# Tài liệu dự án Product Management System

## Cấu trúc tài liệu

- `01-phan-tich`: Phân tích yêu cầu, vai trò thành viên, phạm vi chức năng.
- `02-tong-quan`: Tổng quan kiến trúc hệ thống và công nghệ sử dụng.
- `03-database`: Thiết kế database, model và quan hệ dữ liệu.
- `04-api`: Tài liệu REST API cho backend.
- `05-huong-dan`: Hướng dẫn chạy dự án và test API.
- `06-deployment`: Ghi chú Docker, PostgreSQL, CI/CD và triển khai.
- `07-algorithms`: Search, filter, pagination và các xử lý nghiệp vụ.

## Trạng thái phần backend của Lê Văn Hậu

Đã hoàn thiện mức cơ bản:

- Product model.
- Category model.
- CRUD API cho Product.
- CRUD API cho Category.
- JWT authentication cho API.
- Search, filter, ordering và pagination cơ bản cho Product.
- Test API cơ bản cho auth, CRUD và filter.

Việc nên làm thêm:

- Đồng bộ nhánh `feature/products-api` với `dev` trước khi tạo Pull Request.
- Bổ sung validation nghiệp vụ cho `price` và `quantity`.
- Chuyển database từ SQLite sang PostgreSQL theo cấu hình Docker của nhóm.
- Bổ sung tài liệu Postman collection nếu nhóm yêu cầu nộp file import.
- Trao đổi với nhánh frontend để thống nhất response JSON và field hiển thị.
