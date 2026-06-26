# Changelog

Tài liệu này ghi lại các thay đổi chính của dự án.

## 2026-06-26

### Added

- Thêm model `ProductImage` để một sản phẩm có thể có nhiều ảnh.
- Thêm migration `products.0004_productimage` tạo bảng `product_images`.
- Product API trả thêm trường `images` dạng gallery, đồng thời giữ trường `image` làm ảnh đại diện để tương thích màn hình cũ.
- Product API hỗ trợ upload nhiều file qua `multipart/form-data` với field `uploaded_images`.
- Frontend form thêm/sửa sản phẩm hỗ trợ chọn nhiều ảnh, preview gallery và gửi nhiều file lên API.
- Màn chi tiết sản phẩm hiển thị gallery ảnh nếu sản phẩm có nhiều ảnh.
- Thêm test backend cho luồng upload nhiều ảnh sản phẩm.

### Changed

- Backend expose `MEDIA_URL` cả khi `DJANGO_DEBUG=False` để ảnh upload có thể hiển thị trên Render.
- `MEDIA_ROOT` có thể cấu hình bằng biến môi trường `DJANGO_MEDIA_ROOT`.
- Hàm hiển thị ảnh frontend ưu tiên ảnh trong `images`, sau đó fallback về `image`, `image_url`, `thumbnail` hoặc ảnh mặc định.
- `createProductFormData` append được nhiều giá trị cùng key để gửi nhiều file trong `FormData`.

### Deployment Notes

- Trên Render, ảnh upload lưu vào filesystem của service backend. Nếu không gắn Persistent Disk hoặc dùng storage ngoài như S3/Cloudinary, ảnh có thể mất sau restart hoặc redeploy.
- Khi dùng Render Persistent Disk, đặt `DJANGO_MEDIA_ROOT` trỏ tới mount path của disk, ví dụ `/opt/render/project/src/backend/media`.

### Verified

- Đã chạy frontend production build:

```bash
cd frontend
npm run build
```

- Đã kiểm tra cú pháp Python bằng `py_compile` với cache trỏ vào `/private/tmp`.
- Đã chạy `git diff --check`.

### Not Verified

- Chưa chạy toàn bộ Django test suite trên máy local vì môi trường Python hiện tại chưa cài Django/requirements.

## 2026-06-08

### Added

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
