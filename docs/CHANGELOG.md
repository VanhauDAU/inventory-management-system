# Changelog

Tài liệu này ghi lại các thay đổi chính của dự án.

## 2026-06-08

### Added

- Cập nhật README dự án đầy đủ với tổng quan, công nghệ, cấu trúc thư mục, hướng dẫn chạy Docker/PostgreSQL, API chính, test và quy trình Git.
- Thêm `.env.example` dùng chung ở thư mục gốc dự án.
- Cấu hình backend đọc `.env` từ thư mục gốc bằng `python-dotenv`.
- Cấu hình frontend Vite đọc env từ thư mục gốc bằng `envDir`.
- Thêm Docker Compose cho backend Django và PostgreSQL.
- Thêm `backend/Dockerfile` và `backend/entrypoint.sh`.
- Backend container tự chạy migration trước khi khởi động server.
- Tạo nhánh `dev` làm nhánh tích hợp chung.
- Triển khai CRUD API cho Product.
- Triển khai CRUD API cho Category.
- Thêm JWT authentication cho API.
- Thêm endpoint lấy token:
  - `POST /api/token/`
  - `POST /api/token/refresh/`
- Thêm serializer cho Product và Category.
- Thêm search, filter, ordering và pagination cơ bản cho Product API.
- Thêm test backend cho Product và Category API.
- Tạo cấu trúc tài liệu dự án gồm:
  - `01-phan-tich`
  - `02-tong-quan`
  - `03-database`
  - `04-api`
  - `05-huong-dan`
  - `06-deployment`
  - `07-algorithms`
- Thêm tài liệu phân công thành viên.
- Thêm tài liệu kế hoạch và trạng thái dự án.

### Changed

- Xóa `frontend/.env.example` để tránh mỗi folder có một file env riêng.
- Chuyển `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` và database config sang biến môi trường.
- Chuẩn hóa `DB_ENGINE` để hỗ trợ cả `postgres` và `postgresql`.
- Cập nhật `.env.example` mặc định dùng PostgreSQL qua Docker service `db`.
- Đổi tên các file docs từ `README.md` sang tên cụ thể hơn:
  - `phan-tich-yeu-cau.md`
  - `tong-quan-he-thong.md`
  - `thiet-ke-database.md`
  - `tai-lieu-api.md`
  - `huong-dan-su-dung.md`
  - `trien-khai-docker-postgresql.md`
  - `search-filter-pagination.md`
  - `muc-luc-tai-lieu.md`

### Verified

- Đã chạy backend test bằng lệnh:

```bash
cd backend
./venv/bin/python manage.py test
```

- Kết quả: `5 tests OK`.
- Đã rà soát cấu hình `.env`, Docker Compose, backend Dockerfile và entrypoint.
- Đã chạy `docker compose config` thành công.
- Đã build và khởi động `docker compose up --build -d` thành công.
- PostgreSQL container healthy.
- Backend container kết nối PostgreSQL, chạy migration và khởi động Django thành công.
- Đã chạy `docker compose exec backend python manage.py test`: `5 tests OK`.
- Đã kiểm tra `GET /api/products/` trên Docker backend trả `401 Unauthorized` đúng vì API yêu cầu JWT.

### Pending

- Validate `price >= 0` và `quantity >= 0`.
- Kiểm thử và mở rộng phần auth/search/filter/pagination cho nhánh `feature/auth-api`.
- Bổ sung frontend service vào Docker Compose nếu nhóm muốn chạy toàn bộ hệ thống bằng một lệnh.
- Hoàn thiện frontend React.
- Thêm GitHub Actions CI/CD.
- Export Postman collection nếu cần nộp.
