# Changelog

Tài liệu này ghi lại các thay đổi chính của dự án.

<<<<<<< HEAD
## 2026-06-11

### Added

- Mở rộng bảng `categories` với mô tả, danh mục cha-con, trạng thái và timestamps.
- Thêm bảng `suppliers`.
- Mở rộng bảng `products` với SKU, barcode, ảnh, supplier, giá nhập, giá bán, tồn tối thiểu, đơn vị và trạng thái.
- Thêm bảng `warehouses`.
- Thêm bảng `stock_transactions`.
- Thêm bảng `stock_transaction_items`.
- Thêm quan hệ và constraint giữa Category, Supplier, Product, Warehouse, User và Stock Transaction.
- Thêm Django admin cho Supplier, Warehouse và Stock Transaction.
- Thêm test model cho quan hệ kho và tính `total_amount`.

### Changed

- Rename bảng Django cũ `categories_category` thành `categories`.
- Rename bảng Django cũ `products_product` thành `products`.
- Rename cột `price` thành `selling_price`, giữ alias API `price` để tương thích frontend.
- Product cũ được tự sinh SKU theo định dạng `PRD-000001`.

### Verified

- Django system check không có lỗi.
- `makemigrations --check --dry-run` báo `No changes detected`.
- Migration PostgreSQL cho toàn bộ schema mới thành công.
- Kiểm tra migration dữ liệu cũ giữ nguyên giá, quantity và category thành công.
- Docker backend và PostgreSQL đều hoạt động.
- Backend test với PostgreSQL: `8 tests OK`.

=======
>>>>>>> feature/frontend-crud
## 2026-06-08

### Added

<<<<<<< HEAD
- Thêm Swagger/OpenAPI bằng `drf-spectacular`.
- Thêm endpoint tài liệu API: `/api/docs/`, `/api/schema/`, `/api/redoc/`.
- Thêm CORS middleware để frontend `localhost:3000` gọi được backend `localhost:8000`.
- Thêm biến `CORS_ALLOWED_ORIGINS` vào env mẫu.
- Thêm endpoint health check `GET /api/health/` không yêu cầu JWT.
- Thêm test cho endpoint health check.
- Thêm `.gitattributes` để giữ shell script dùng LF trên Windows.
- Cập nhật README dự án đầy đủ với tổng quan, công nghệ, cấu trúc thư mục, hướng dẫn chạy Docker/PostgreSQL, API chính, test và quy trình Git.
- Thêm `.env.example` dùng chung ở thư mục gốc dự án.
- Cấu hình backend đọc `.env` từ thư mục gốc bằng `python-dotenv`.
- Cấu hình frontend Vite đọc env từ thư mục gốc bằng `envDir`.
- Thêm Docker Compose cho backend Django và PostgreSQL.
- Thêm `backend/Dockerfile` và `backend/entrypoint.sh`.
- Backend container tự chạy migration trước khi khởi động server.
- Thêm GitHub Actions workflow tại `.github/workflows/ci.yml`.
- CI chạy backend test với PostgreSQL service.
- CI chạy frontend build bằng Vite.
- Thêm `.gitattributes` để giữ line ending LF cho shell script và workflow YAML.
=======
>>>>>>> feature/frontend-crud
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

<<<<<<< HEAD
- Cập nhật backend Dockerfile để normalize CRLF trong `entrypoint.sh` và chạy entrypoint qua `sh`.
- Xóa `frontend/.env.example` để tránh mỗi folder có một file env riêng.
- Chuyển `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` và database config sang biến môi trường.
- Chuẩn hóa `DB_ENGINE` để hỗ trợ cả `postgres` và `postgresql`.
- Cập nhật `.env.example` mặc định dùng PostgreSQL qua Docker service `db`.
=======
>>>>>>> feature/frontend-crud
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
<<<<<<< HEAD
- Đã rà soát cấu hình `.env`, Docker Compose, backend Dockerfile và entrypoint.
- Đã chạy `docker compose config` thành công.
- Đã build và khởi động `docker compose up --build -d` thành công.
- PostgreSQL container healthy.
- Backend container kết nối PostgreSQL, chạy migration và khởi động Django thành công.
- Đã chạy `docker compose exec backend python manage.py test`: `5 tests OK`.
- Đã kiểm tra `GET /api/products/` trên Docker backend trả `401 Unauthorized` đúng vì API yêu cầu JWT.
- Đã chạy `npm ci` trong frontend thành công.
- Đã chạy `npm run build` trong frontend thành công.
=======
>>>>>>> feature/frontend-crud

### Pending

- Validate `price >= 0` và `quantity >= 0`.
- Kiểm thử và mở rộng phần auth/search/filter/pagination cho nhánh `feature/auth-api`.
<<<<<<< HEAD
- Bổ sung frontend service vào Docker Compose nếu nhóm muốn chạy toàn bộ hệ thống bằng một lệnh.
- Hoàn thiện frontend React.
- Mở rộng GitHub Actions thêm lint, coverage hoặc deploy nếu nhóm cần.
=======
- Hoàn thiện PostgreSQL trong Docker.
- Hoàn thiện frontend React.
- Thêm GitHub Actions CI/CD.
>>>>>>> feature/frontend-crud
- Export Postman collection nếu cần nộp.
