# Frontend

Ứng dụng React/Vite cho hệ thống quản lý sản phẩm và tồn kho.

## Cấu trúc chính

```text
src/
├── components/          # Component dùng chung: layout, chart, common, chat
├── hooks/               # Hook đọc dữ liệu dashboard và báo cáo
├── pages/               # Màn hình nghiệp vụ theo từng module
├── services/            # Axios client và API service
└── utils/               # Helper format, permission, pagination
```

Component chỉ dùng riêng cho một màn hình được đặt gần màn hình đó, ví dụ `src/pages/products/components/`.

## Chạy local

```bash
npm install
npm run dev
```

Frontend đọc `VITE_API_URL` từ `../backend/.env`, cùng file env với backend.

## Build production

```bash
npm run build
npm run preview
```
