<<<<<<< HEAD
# Frontend React App

This folder contains a Vite + React frontend for the project.

## Setup

1. Open `frontend`
2. Run `npm install`
3. Run `npm run dev`

## Environment variables

Create a `.env` file in `frontend/` and add backend connection variables, for example:
=======
# Frontend - Lê Đình Nguyên

Phần frontend này chỉ thực hiện đúng nhiệm vụ được phân công cho Lê Đình Nguyên:

- Setup React/Vite.
- Thiết kế layout giao diện chính.
- Thiết kế trang chính dạng website sản phẩm.
- Hiển thị danh mục sản phẩm.
- Hiển thị danh sách sản phẩm.
- Hiển thị chi tiết sản phẩm.
- Giữ mục Thống kê như một trang riêng trong giao diện chính.
- Gọi `GET /api/products/` và `GET /api/categories/` khi có access token.
- Hiển thị loading, empty state, error state và pagination.

Không thực hiện backend, database, đăng nhập, thêm, sửa, xóa sản phẩm, Docker hoặc CI.

## Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend đọc API URL từ `.env`:
>>>>>>> feature/frontend-crud

```env
VITE_API_URL=http://localhost:8000/api
```

<<<<<<< HEAD
Then use it in React with `import.meta.env.VITE_API_URL`.
=======
Nếu chưa có backend hoặc token đăng nhập, giao diện sẽ dùng dữ liệu mẫu để demo.
Khi thành viên phụ trách Login lưu access token vào `localStorage` với key `access_token` hoặc `accessToken`, frontend sẽ tự gọi API thật.
>>>>>>> feature/frontend-crud
