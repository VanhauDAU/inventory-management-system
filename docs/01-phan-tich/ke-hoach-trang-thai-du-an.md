# Kế hoạch và trạng thái dự án

## Mục tiêu tổng thể

Product Management System là hệ thống quản lý sản phẩm gồm frontend React, backend Django REST Framework, database PostgreSQL và môi trường chạy bằng Docker. Hệ thống cần hỗ trợ đăng nhập bằng JWT, quản lý danh mục, quản lý sản phẩm, tìm kiếm, lọc, phân trang, kiểm thử và CI/CD.

## Phạm vi chức năng cần làm

### Backend

- API đăng nhập JWT.
- API refresh token.
- CRUD API cho Category.
- CRUD API cho Product.
- Search sản phẩm.
- Filter sản phẩm.
- Ordering sản phẩm.
- Pagination danh sách sản phẩm.
- Validation dữ liệu sản phẩm.
- Permission bảo vệ API.
- Test cho auth và CRUD API.

### Frontend

- Layout chính của ứng dụng.
- Màn hình đăng nhập.
- Lưu và gửi JWT access token khi gọi API.
- Trang danh sách sản phẩm.
- Tìm kiếm, lọc và phân trang sản phẩm.
- Form thêm sản phẩm.
- Form sửa sản phẩm.
- Chức năng xóa sản phẩm.
- Hiển thị loading, empty state và error state.

### Database

- Thiết kế bảng Category.
- Thiết kế bảng Product.
- Quan hệ Product - Category.
- Migration Django.
- Cấu hình PostgreSQL cho môi trường Docker.
- Seed dữ liệu mẫu nếu cần demo.

### DevOps

- Dockerfile cho backend.
- Dockerfile cho frontend nếu cần.
- Docker Compose gồm backend và PostgreSQL.
- Docker Compose frontend nếu nhóm muốn chạy cả React bằng Docker.
- File `.env.example` dùng chung ở thư mục gốc.
- Cấu hình Django đọc biến môi trường.
- GitHub Actions chạy test tự động.
- Hướng dẫn chạy dự án bằng Docker.

### Testing

- Test model nếu có validation nghiệp vụ.
- Test CRUD Category API.
- Test CRUD Product API.
- Test JWT authentication.
- Test search, filter, pagination.
- Test frontend các luồng chính nếu nhóm có thời gian.

## Đã thực hiện

### Git và quy trình nhánh

- Đã có nhánh `dev` làm nhánh tích hợp.
- Đã có các nhánh feature:
  - `feature/products-api`
  - `feature/auth-api`
  - `feature/frontend-ui`
  - `feature/frontend-crud`
  - `feature/devops`

### Backend Product/Category

- Đã có model `Category`.
- Đã có model `Product`.
- Đã có serializer cho Category.
- Đã có serializer cho Product.
- Đã có `CategoryViewSet`.
- Đã có `ProductViewSet`.
- Đã có router API:
  - `/api/categories/`
  - `/api/products/`
- Đã có JWT endpoint:
  - `/api/token/`
  - `/api/token/refresh/`
- Đã bảo vệ Product/Category API bằng JWT.
- Đã có search theo `name`, `description`.
- Đã có filter theo `category`.
- Đã có ordering theo `id`, `name`, `price`, `quantity`, `created_at`, `updated_at`.
- Đã có pagination mặc định 10 item/trang.

### Backend Auth/Search/Filter/Pagination cơ bản

- Đã có endpoint JWT token và refresh token ở mức cơ bản.
- Đã có search/filter/ordering/pagination cơ bản trong Product API.
- Các phần này không cần làm lại từ đầu ở nhánh `feature/auth-api`.
- Việc còn lại của nhánh `feature/auth-api` là kiểm thử, chuẩn hóa và mở rộng chức năng.

### Test backend

- Đã có test API yêu cầu authentication.
- Đã có test tạo và cập nhật Category.
- Đã có test CRUD Product.
- Đã có test filter Product theo Category.
- Test backend đã chạy pass: `5 tests`.

### Tài liệu

- Đã tạo cấu trúc docs theo 7 phần:
  - `01-phan-tich`
  - `02-tong-quan`
  - `03-database`
  - `04-api`
  - `05-huong-dan`
  - `06-deployment`
  - `07-algorithms`
- Đã có tài liệu database.
- Đã có tài liệu API.
- Đã có hướng dẫn test API bằng Postman.
- Đã có tài liệu phân công thành viên.

### Environment config

- Đã tạo `.env.example` ở thư mục gốc.
- Backend đọc `.env` từ thư mục gốc bằng `python-dotenv`.
- Frontend Vite đọc env từ thư mục gốc bằng `envDir: "../"`.
- Không cần đặt file `.env` riêng trong từng folder backend/frontend.

### Docker và PostgreSQL

- Đã có `backend/Dockerfile`.
- Đã có `backend/entrypoint.sh`.
- Đã có `docker-compose.yml` cho backend và PostgreSQL.
- Backend container chờ PostgreSQL sẵn sàng trước khi chạy migration.
- Backend container tự chạy migration khi khởi động.
- Đã kiểm tra Docker Compose build và start thành công.
- Đã kiểm tra backend kết nối PostgreSQL trong Docker thành công.

## Chưa thực hiện

### Backend

- Chưa validate `price >= 0`.
- Chưa validate `quantity >= 0`.
- Chưa filter theo khoảng giá `min_price`, `max_price`.
- Chưa filter theo trạng thái tồn kho.
- Chưa có permission theo role.
- Chưa có API riêng cho thống kê sản phẩm.
- Chưa có export/import dữ liệu sản phẩm.

### Frontend

- Chưa có React layout hoàn chỉnh trong nhánh hiện tại.
- Chưa có màn hình đăng nhập hoàn chỉnh.
- Chưa có trang danh sách sản phẩm gọi API thật.
- Chưa có form thêm/sửa/xóa sản phẩm.
- Chưa có xử lý token hết hạn.
- Chưa có UI search/filter/pagination.

### Database và Docker

- Backend local có thể dùng SQLite khi `DB_ENGINE=sqlite`.
- Docker Compose đang dùng PostgreSQL khi `DB_ENGINE=postgres`.
- Chưa có Docker Compose cho frontend.
- Chưa có script seed dữ liệu mẫu.

### CI/CD

- Chưa có GitHub Actions chạy test tự động.
- Chưa có kiểm tra lint/format tự động.
- Chưa có pipeline build frontend/backend.

### Tài liệu

- Chưa có Postman collection export.
- Chưa có ảnh minh họa màn hình frontend.
- Chưa có hướng dẫn chi tiết chạy bằng Docker sau khi DevOps hoàn thiện.

## Kế hoạch thực hiện tiếp theo

### Giai đoạn 1 - Hoàn thiện backend API

Người phụ trách chính: Lê Văn Hậu, Lê Doãn Long.

- Thêm validation cho Product.
- Kiểm tra và viết test cho auth/search/filter/pagination đã có.
- Mở rộng filter theo khoảng giá và tồn kho nếu còn thời gian.
- Bổ sung test cho auth và filter nâng cao.
- Chạy lại toàn bộ backend test.
- Tạo Pull Request từ `feature/products-api` và `feature/auth-api` vào `dev`.

### Giai đoạn 2 - Hoàn thiện frontend

Người phụ trách chính: Lê Đình Nguyên, Nguyễn Nguyên Tài.

- Dựng layout React.
- Làm màn hình login.
- Gọi API lấy token.
- Làm product list.
- Làm product CRUD UI.
- Kết nối search/filter/pagination với backend.
- Test thủ công toàn bộ luồng từ login đến CRUD.

### Giai đoạn 3 - Docker, PostgreSQL và CI/CD

Người phụ trách chính: Trần Văn Sỹ.

- Rà soát Dockerfile backend.
- Tạo Dockerfile frontend nếu cần.
- Bổ sung service frontend vào Docker Compose nếu cần.
- Duy trì Django database config bằng biến môi trường.
- Kiểm tra migration trên PostgreSQL khi thay đổi model.
- Tạo GitHub Actions chạy backend test.

### Giai đoạn 4 - Tích hợp và hoàn thiện tài liệu

Người phụ trách: toàn nhóm.

- Merge các nhánh feature vào `dev`.
- Kiểm tra conflict.
- Test end-to-end trên môi trường Docker.
- Cập nhật docs theo trạng thái cuối.
- Chuẩn bị demo API bằng Postman.
- Merge `dev` vào `main` khi ổn định.

## Tiêu chí hoàn thành dự án

- Người dùng đăng nhập được bằng JWT.
- Người dùng xem được danh sách sản phẩm.
- Người dùng thêm, sửa, xóa sản phẩm được.
- Người dùng xem và tạo danh mục được.
- API được bảo vệ bằng token.
- Search, filter, pagination hoạt động.
- Backend kết nối PostgreSQL trong Docker.
- Test backend chạy pass.
- GitHub Actions chạy test tự động.
- Docs mô tả rõ cách chạy, cách test và API chính.
