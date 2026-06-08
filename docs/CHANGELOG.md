# Changelog

Tài liệu này ghi lại các thay đổi chính của dự án.

## 2026-06-08

### Added

- Thêm `.env.example` dùng chung ở thư mục gốc dự án.
- Cấu hình backend đọc `.env` từ thư mục gốc bằng `python-dotenv`.
- Cấu hình frontend Vite đọc env từ thư mục gốc bằng `envDir`.
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

### Pending

- Validate `price >= 0` và `quantity >= 0`.
- Kiểm thử và mở rộng phần auth/search/filter/pagination cho nhánh `feature/auth-api`.
- Hoàn thiện PostgreSQL trong Docker.
- Hoàn thiện frontend React.
- Thêm GitHub Actions CI/CD.
- Export Postman collection nếu cần nộp.
