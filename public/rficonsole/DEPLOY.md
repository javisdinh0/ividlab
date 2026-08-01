# RFI Console — Thiết lập Firebase (Giai đoạn 0)

Làm **một lần**. Sau khi xong, gửi lại `firebaseConfig` để dán vào [firebase.js](./firebase.js).

## 1. Tạo Firebase project mới
1. Vào <https://console.firebase.google.com> → **Add project** → đặt tên (VD `ividlab-rfi`).
2. Tắt Google Analytics nếu không cần (không bắt buộc).

## 2. Bật Authentication (email + mật khẩu)
1. **Build → Authentication → Get started**.
2. Tab **Sign-in method** → bật **Email/Password** (không cần bật Email link).
3. Tab **Settings → Authorized domains** → **Add domain** → `ividlab.com`.
   (Sẵn có `localhost` để chạy thử.)

## 3. Tạo Firestore
1. **Build → Firestore Database → Create database**.
2. Chọn location gần VN: **asia-southeast1** (Singapore).
3. Bắt đầu ở **production mode** (rules sẽ dán ở bước 6).

## 4. Tạo Storage
1. **Build → Storage → Get started**.
2. Cùng location `asia-southeast1`. Production mode.

## 5. Lấy firebaseConfig
1. **Project settings (⚙) → General → Your apps → Web (</>)** → đăng ký app (VD `rficonsole`).
2. Copy khối `firebaseConfig` → gửi lại để dán vào [firebase.js](./firebase.js) (biến `firebaseConfig`).
   > Config này để **công khai** trong mã client là bình thường — bảo mật do Security Rules đảm bảo.

## 6. Deploy Security Rules
**Firestore:** Firestore Database → tab **Rules** → dán nội dung [firestore.rules](./firestore.rules) → **Publish**.
**Storage:** Storage → tab **Rules** → dán nội dung [storage.rules](./storage.rules) → **Publish**.

## 7. Seed tài khoản owner (super-admin)
Owner là người được tạo dự án và quản trị toàn portal.

1. Vào `ividlab.com/rficonsole/` → **Đăng ký** bằng email owner (VD `dinhvietdung.amc@gmail.com`) → xác minh email.
2. Vào **Firestore → Start collection** → Collection ID `config` → Document ID `owners`.
3. Thêm field `emails` kiểu **array**, phần tử là email owner. VD:
   ```
   emails: ["dinhvietdung.amc@gmail.com"]
   ```
   > ⚠️ **BẮT BUỘC chữ thường.** Security Rules không chuẩn hóa được mảng, nên mỗi
   > email phải lưu ở dạng lowercase; nếu để hoa (VD `Admin@Corp.com`) thì UI vẫn hiện
   > nút quản trị nhưng **mọi thao tác ghi của owner sẽ bị từ chối** (permission-denied).
4. Từ giờ owner đó có thể vào `/rficonsole/admin/` để tạo dự án & cấp quyền.

## Kiểm tra nhanh
- Đăng ký email mới → nhận mail xác minh → xác minh → đăng nhập.
- Chưa được gán dự án → thấy màn hình "Bạn chưa được cấp quyền vào dự án nào".
- Owner cấp quyền (Giai đoạn 2) → tải lại → thấy dự án.

## Chi phí
Gói **Spark (miễn phí)** đủ cho Auth + Firestore + Storage ở quy mô RFI. Chỉ cần nâng
**Blaze** nếu sau này chọn phương án DB vật lý riêng (Cloud Function) — xem PLAN.md giai đoạn 6.
