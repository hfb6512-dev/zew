# Server Key Admin - Phiên bản Việt Nam

Hệ thống quản lý key và thiết bị tương tự Web-Server-Key

## Tính năng

- 🔑 **Normal Key**: Key ngẫu nhiên, dùng 1 lần rồi hết
- 👑 **Custom Key**: Tên tự đặt, tái sử dụng được
- 🌐 **Global Key**: Nhiều thiết bị dùng chung
- 📱 Quản lý thiết bị
- ⚙️ Cấu hình hệ thống
- 🔧 Chế độ bảo trì

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy server
node server.js
```

## Cấu hình Firebase

Chỉnh sửa file `firebase-config.js` với thông tin Firebase của bạn:

```javascript
const firebaseConfig = {
  databaseURL: "YOUR_FIREBASE_DATABASE_URL",
  // ...
};
```

## API Endpoints

- `GET /api/keys` - Lấy danh sách tất cả keys
- `POST /api/keys/generate` - Tạo key mới
- `PUT /api/keys/:id` - Cập nhật key
- `DELETE /api/keys/:id` - Xóa key
- `GET /api/devices` - Lấy danh sách thiết bị
- `POST /api/validate` - Validate key
- `GET /api/config` - Lấy cấu hình
- `PUT /api/config` - Lưu cấu hình

## Port mặc định: 3000