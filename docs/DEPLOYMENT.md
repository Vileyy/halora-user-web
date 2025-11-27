# Hướng dẫn Deploy và Cấu hình Google OAuth

## Vấn đề: Không thể login bằng Google sau khi deploy lên Vercel

Khi deploy lên Vercel, Google OAuth có thể không hoạt động do thiếu cấu hình domain trong Firebase Console.

## Các bước khắc phục:

### 1. Thêm Domain Vercel vào Firebase Authorized Domains

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** và thêm:
   - Domain Vercel của bạn: `your-app.vercel.app`
   - Custom domain (nếu có): `yourdomain.com`
   - Domain localhost đã có sẵn (không cần xóa)

### 2. Kiểm tra Environment Variables trên Vercel

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Đảm bảo có đầy đủ các biến sau:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```
5. Sau khi thêm/sửa, cần **Redeploy** project

### 3. Cấu hình OAuth trong Google Cloud Console (Nếu cần)

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project Firebase của bạn
3. Vào **APIs & Services** → **Credentials**
4. Tìm OAuth 2.0 Client ID của Firebase
5. Click vào để chỉnh sửa
6. Thêm **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/__/auth/handler
   https://yourdomain.com/__/auth/handler (nếu có custom domain)
   ```

### 4. Kiểm tra Firebase Authentication Providers

1. Vào Firebase Console → **Authentication** → **Sign-in method**
2. Đảm bảo **Google** đã được bật (Enabled)
3. Kiểm tra **Support email** đã được cấu hình

### 5. Redeploy trên Vercel

Sau khi cấu hình xong:

1. Vào Vercel Dashboard → Project → **Deployments**
2. Click vào menu (3 chấm) của deployment mới nhất
3. Chọn **Redeploy**

## Lưu ý:

- Sau khi thêm domain mới, có thể mất vài phút để Firebase cập nhật
- Đảm bảo tất cả environment variables đều có prefix `NEXT_PUBLIC_` để có thể truy cập từ client-side
- Nếu vẫn gặp lỗi, kiểm tra Console của browser để xem lỗi cụ thể

## Các lỗi thường gặp:

### `auth/unauthorized-domain`

- **Nguyên nhân**: Domain chưa được thêm vào Authorized domains
- **Giải pháp**: Thêm domain vào Firebase Console như bước 1

### `auth/popup-blocked`

- **Nguyên nhân**: Browser chặn popup
- **Giải pháp**: Cho phép popup cho domain của bạn

### `auth/popup-closed-by-user`

- **Nguyên nhân**: User đóng popup
- **Giải pháp**: Không phải lỗi, chỉ cần thử lại
