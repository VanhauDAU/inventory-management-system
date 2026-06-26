# Tài liệu dự án Product Management System

## Cấu trúc tài liệu

- `01-phan-tich`: Phân tích yêu cầu, vai trò thành viên, phạm vi chức năng.
- `02-tong-quan`: Tổng quan kiến trúc hệ thống và công nghệ sử dụng.
- `03-database`: Thiết kế database, model, gallery ảnh sản phẩm và quan hệ dữ liệu.
- `04-api`: Tài liệu REST API cho backend, bao gồm upload nhiều ảnh sản phẩm.
- `05-huong-dan`: Hướng dẫn chạy dự án, test API và test upload ảnh.
- `06-deployment`: Ghi chú Docker, PostgreSQL, Render, media upload và triển khai.
- `07-algorithms`: Search, filter, pagination và các xử lý nghiệp vụ.

## Tài liệu quan trọng

- Tổng quan project và luồng code: `docs/tong-quan-project-va-luong-code.md`.
- Kế hoạch và trạng thái dự án: `docs/01-phan-tich/ke-hoach-trang-thai-du-an.md`.
- Phân công thành viên: `docs/01-phan-tich/phan-cong-thanh-vien.md`.
- Changelog: `docs/CHANGELOG.md`.

## Trạng thái phần backend của Lê Văn Hậu

Tài liệu phân công chi tiết: `docs/01-phan-tich/phan-cong-thanh-vien.md`.

Đã hoàn thiện mức cơ bản:

- Product model.
- Product image gallery model.
- Category model.
- CRUD API cho Product.
- CRUD API cho Category.
- JWT authentication cho API.
- Search, filter, ordering và pagination cho Product.
- Upload nhiều ảnh sản phẩm bằng `multipart/form-data`.
- Test API cơ bản cho auth, CRUD và filter.

Việc nên làm thêm:

- Đồng bộ nhánh `feature/products-api` với `dev` trước khi tạo Pull Request.
- Cấu hình Persistent Disk hoặc storage ngoài cho media khi deploy production.
- Bổ sung tài liệu Postman collection nếu nhóm yêu cầu nộp file import.
- Đồng bộ Postman collection với API upload nhiều ảnh nếu có dùng collection.
