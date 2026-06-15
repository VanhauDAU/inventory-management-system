import json
import urllib.error
import urllib.request


OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


class OpenAIClientError(Exception):
    pass


def create_inventory_analysis(api_key, model, payload, timeout=20):
    request_payload = {
        "model": model,
        "instructions": (
            "Bạn là trợ lý phân tích tồn kho cho hệ thống quản lý kho. "
            "Chỉ dùng số liệu được cung cấp, không tự bịa dữ liệu. "
            "Không thay đổi suggested_quantity do hệ thống đã tính. "
            "Trả lời ngắn gọn, thực dụng, bằng tiếng Việt."
        ),
        "input": json.dumps(payload, ensure_ascii=False),
        "max_output_tokens": 700,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "inventory_ai_advice",
                "strict": True,
                "schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["ai_summary", "recommendations"],
                    "properties": {
                        "ai_summary": {"type": "string"},
                        "recommendations": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["product_id", "ai_reason", "risk", "suggested_action"],
                                "properties": {
                                    "product_id": {"type": "integer"},
                                    "ai_reason": {"type": "string"},
                                    "risk": {"type": "string"},
                                    "suggested_action": {"type": "string"},
                                },
                            },
                        },
                    },
                },
            }
        },
    }

    request = urllib.request.Request(
        OPENAI_RESPONSES_URL,
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise OpenAIClientError(f"HTTP {exc.code}: {detail}") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise OpenAIClientError(str(exc)) from exc

    output_text = _extract_output_text(response_data)
    if not output_text:
        raise OpenAIClientError("OpenAI response did not include output text.")

    try:
        return json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise OpenAIClientError("OpenAI response was not valid JSON.") from exc


def _extract_output_text(response_data):
    if response_data.get("output_text"):
        return response_data["output_text"]

    for output_item in response_data.get("output", []):
        for content in output_item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                return content["text"]

    return ""
