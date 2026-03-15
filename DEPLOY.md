# Cách deploy Server Key lên GitHub Pages

## Lưu ý quan trọng
GitHub Pages **KHÔNG** hỗ trợ chạy Node.js server. Bạn cần:
1. Host Node.js server ở nơi khác (Render, Railway, Heroku...)
2. Deploy giao diện admin (static HTML) lên GitHub Pages

---

## Bước 1: Tạo GitHub Repository

1. Vào https://github.com và đăng nhập
2. Click **New repository**
3. Đặt tên: `Web-Server-Key` (hoặc tên bạn muốn)
4. Chọn **Public**
5. Click **Create repository**

---

## Bước 2: Upload code lên GitHub

### Cách 1: Sử dụng Git (khuyên dùng)

```bash
# Di chuyển vào thư mục project
cd "c:\Users\Administrator\Downloads\sever key"

# Khởi tạo git
git init

# Thêm tất cả file
git add .

# Tạo commit
git commit -m "Initial commit"

# Thêm remote (thay username và repo name)
git remote add origin https://github.com/YOUR_USERNAME/Web-Server-Key.git

# Push lên GitHub
git push -u origin main
```

### Cách 2: Upload trực tiếp

1. Vào repository vừa tạo trên GitHub
2. Click **uploading an existing file**
3. Kéo thả tất cả file vào (trừ node_modules)
4. Click **Commit changes**

---

## Bước 3: Bật GitHub Pages

1. Vào repository > **Settings** > **Pages**
2. Tại **Source**, chọn **Deploy from a branch**
3. Tại **Branch**, chọn **main** (hoặc master) và **/(root)**
4. Click **Save**
5. Đợi 1-2 phút, link sẽ có dạng: `https://YOUR_USERNAME.github.io/Web-Server-Key/`

---

## Bước 4: Deploy Server Node.js (Backend)

### Trên Render (Miễn phí):

1. Đăng ký tại https://render.com
2. Click **New** > **Web Service**
3. Connect GitHub repository vừa tạo
4. Cấu hình:
   - Name: `server-key-api`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Click **Create Web Service**

Sau khi deploy, bạn sẽ có URL dạng: `https://server-key-api.onrender.com`

### Cập nhật API URL trong admin:

Sau khi có server URL, cần cập nhật code để trỏ về API đúng:

Trong file `public/index.html`, tìm và thay đổi các API calls:
```javascript
// Thay '/api/keys' thành 'https://YOUR_RENDER_URL/api/keys'
```

---

## Video hướng dẫn chi tiết

Bạn có thể xem video hướng dẫn chi tiết hơn:
- [Cách deploy Node.js lên Render](https://www.youtube.com/watch?v=YOUR_VIDEO_LINK)
- [Cách sử dụng GitHub Pages](https://www.youtube.com/watch?v=YOUR_VIDEO_LINK)

---

## Lưu ý bảo mật

**KHÔNG** upload file `serviceAccountKey.json` lên GitHub!
- File này chứa private key của Firebase
- Thêm vào `.gitignore` để không bị commit

Tôi có thể giúp bạn tạo file `.gitignore` và hướng dẫn chi tiết hơn không?