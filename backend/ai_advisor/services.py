import math
from datetime import timedelta

from django.conf import settings
from django.db.models import Count, Max, Sum
from django.utils import timezone

from inventory.models import StockTransaction, StockTransactionItem, WarehouseStock
from products.models import Product

from .openai_client import OpenAIClientError, create_inventory_analysis


ADVICE_WINDOW_DAYS = 30
TARGET_COVER_DAYS = 14
MAX_AI_RECOMMENDATIONS = 8


def build_inventory_advice():
    since = timezone.now() - timedelta(days=ADVICE_WINDOW_DAYS)
    export_stats = {
        row["product"]: row
        for row in StockTransactionItem.objects.filter(
            stock_transaction__transaction_type=StockTransaction.TransactionType.EXPORT,
            stock_transaction__created_at__gte=since,
        )
        .values("product")
        .annotate(
            exported_quantity=Sum("quantity"),
            export_lines=Count("id"),
            last_export_at=Max("stock_transaction__created_at"),
        )
    }
    warehouse_stocks = _get_warehouse_stock_map()

    recommendations = []
    for product in Product.objects.select_related("category", "supplier").order_by("name"):
        minimum_stock = int(product.minimum_stock or 0)
        current_quantity = int(product.quantity or 0)
        stats = export_stats.get(product.id, {})
        exported_30_days = int(stats.get("exported_quantity") or 0)
        average_daily_export = exported_30_days / ADVICE_WINDOW_DAYS
        days_remaining = (
            current_quantity / average_daily_export
            if average_daily_export > 0
            else None
        )

        should_recommend = (
            minimum_stock > 0
            and (
                current_quantity <= minimum_stock
                or current_quantity <= math.ceil(minimum_stock * 1.5)
                or (days_remaining is not None and days_remaining <= TARGET_COVER_DAYS)
            )
        )
        if not should_recommend:
            continue

        suggested_quantity = _calculate_suggested_quantity(
            current_quantity=current_quantity,
            minimum_stock=minimum_stock,
            average_daily_export=average_daily_export,
        )
        if suggested_quantity <= 0:
            continue

        priority = _get_priority(current_quantity, minimum_stock, days_remaining)
        recommendations.append(
            {
                "product_id": product.id,
                "sku": product.sku,
                "product_name": product.name,
                "category_name": product.category.name if product.category_id else "",
                "supplier_name": product.supplier.name if product.supplier_id else "",
                "current_quantity": current_quantity,
                "minimum_stock": minimum_stock,
                "exported_30_days": exported_30_days,
                "average_daily_export": round(average_daily_export, 2),
                "days_remaining": round(days_remaining, 1) if days_remaining is not None else None,
                "suggested_quantity": suggested_quantity,
                "priority": priority,
                "reason": _build_reason(current_quantity, minimum_stock, exported_30_days, days_remaining),
                "warehouse_stocks": warehouse_stocks.get(product.id, []),
            }
        )

    recommendations.sort(
        key=lambda item: (
            {"high": 0, "medium": 1, "low": 2}.get(item["priority"], 3),
            item["days_remaining"] if item["days_remaining"] is not None else 9999,
            item["current_quantity"] - item["minimum_stock"],
        )
    )

    summary = _build_summary(recommendations)
    ai_summary = _build_ai_summary(recommendations)
    meta = {
        "mode": "rule_based",
        "provider": "",
        "model": "",
        "window_days": ADVICE_WINDOW_DAYS,
        "target_cover_days": TARGET_COVER_DAYS,
        "generated_at": timezone.now().isoformat(),
    }

    ai_result, ai_error = _get_openai_analysis(summary, recommendations)
    if ai_result:
        ai_summary = ai_result.get("ai_summary") or ai_summary
        _merge_ai_recommendations(recommendations, ai_result.get("recommendations", []))
        meta["mode"] = "openai"
        meta["provider"] = "openai"
        meta["model"] = getattr(settings, "OPENAI_MODEL", "")
    elif ai_error:
        meta["ai_fallback"] = "OpenAI enrichment failed. Returned rule-based advice."
        meta["ai_fallback_reason"] = ai_error

    return {
        "summary": summary,
        "ai_summary": ai_summary,
        "recommendations": recommendations,
        "meta": meta,
    }


def _calculate_suggested_quantity(current_quantity, minimum_stock, average_daily_export):
    safety_stock_target = max(minimum_stock * 2, math.ceil(average_daily_export * TARGET_COVER_DAYS))
    return max(0, safety_stock_target - current_quantity)


def _get_priority(current_quantity, minimum_stock, days_remaining):
    if current_quantity <= minimum_stock or (days_remaining is not None and days_remaining <= 7):
        return "high"
    if current_quantity <= math.ceil(minimum_stock * 1.25) or (days_remaining is not None and days_remaining <= 14):
        return "medium"
    return "low"


def _build_reason(current_quantity, minimum_stock, exported_30_days, days_remaining):
    if current_quantity <= minimum_stock:
        return (
            f"Tồn kho hiện tại {current_quantity} thấp hơn hoặc bằng ngưỡng tối thiểu "
            f"{minimum_stock}. 30 ngày gần đây đã xuất {exported_30_days} sản phẩm."
        )
    if days_remaining is not None and days_remaining <= TARGET_COVER_DAYS:
        return (
            f"Tốc độ xuất gần đây khiến lượng tồn chỉ còn đủ khoảng {days_remaining:.1f} ngày. "
            "Nên bổ sung để giữ mức an toàn."
        )
    return (
        f"Tồn kho hiện tại {current_quantity} đang gần ngưỡng tối thiểu {minimum_stock}. "
        "Nên chuẩn bị nhập thêm để tránh thiếu hàng."
    )


def _build_summary(recommendations):
    return {
        "total_alerts": len(recommendations),
        "high_priority": sum(1 for item in recommendations if item["priority"] == "high"),
        "medium_priority": sum(1 for item in recommendations if item["priority"] == "medium"),
        "low_priority": sum(1 for item in recommendations if item["priority"] == "low"),
        "estimated_restock_items": sum(item["suggested_quantity"] for item in recommendations),
    }


def _build_ai_summary(recommendations):
    if not recommendations:
        return "Tồn kho hiện tại ổn định, chưa có sản phẩm cần nhập thêm theo ngưỡng và tốc độ xuất gần đây."

    summary = _build_summary(recommendations)
    top_items = ", ".join(item["product_name"] for item in recommendations[:3])
    return (
        f"Có {summary['total_alerts']} sản phẩm nên xem xét nhập thêm, trong đó "
        f"{summary['high_priority']} sản phẩm ở mức ưu tiên cao. Nhóm cần xử lý trước: {top_items}."
    )


def _get_openai_analysis(summary, recommendations):
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        return None, "OPENAI_API_KEY is not configured in the backend environment."
    if not recommendations:
        return None, ""

    payload = {
        "summary": summary,
        "window_days": ADVICE_WINDOW_DAYS,
        "target_cover_days": TARGET_COVER_DAYS,
        "recommendations": [
            {
                "product_id": item["product_id"],
                "sku": item["sku"],
                "product_name": item["product_name"],
                "category_name": item["category_name"],
                "supplier_name": item["supplier_name"],
                "current_quantity": item["current_quantity"],
                "minimum_stock": item["minimum_stock"],
                "exported_30_days": item["exported_30_days"],
                "average_daily_export": item["average_daily_export"],
                "days_remaining": item["days_remaining"],
                "suggested_quantity": item["suggested_quantity"],
                "priority": item["priority"],
                "system_reason": item["reason"],
                "warehouse_stocks": item["warehouse_stocks"],
            }
            for item in recommendations[:MAX_AI_RECOMMENDATIONS]
        ],
    }

    try:
        return create_inventory_analysis(
            api_key=api_key,
            model=getattr(settings, "OPENAI_MODEL", "gpt-5.2"),
            payload=payload,
        ), ""
    except OpenAIClientError as exc:
        return None, str(exc)


def _merge_ai_recommendations(recommendations, ai_recommendations):
    by_product_id = {
        item.get("product_id"): item
        for item in ai_recommendations
        if isinstance(item, dict) and item.get("product_id")
    }

    for recommendation in recommendations:
        ai_item = by_product_id.get(recommendation["product_id"])
        if not ai_item:
            continue
        recommendation["ai_reason"] = ai_item.get("ai_reason", "")
        recommendation["risk"] = ai_item.get("risk", "")
        recommendation["suggested_action"] = ai_item.get("suggested_action", "")


def _get_warehouse_stock_map():
    stock_map = {}
    for stock in WarehouseStock.objects.select_related("warehouse", "product").order_by("warehouse__name"):
        stock_map.setdefault(stock.product_id, []).append(
            {
                "warehouse_id": stock.warehouse_id,
                "warehouse_name": stock.warehouse.name,
                "quantity": stock.quantity,
            }
        )
    return stock_map
