# RFI Console — Kế hoạch & Quyết định

Cổng quản lý RFI (Request For Information) đa dự án tại `ividlab.com/rficonsole`.
Kế thừa từ dự án **RFI Web** (`X:\iViDLab\RFI Web`), tổng quát hóa thành 1 app +
tab admin no-code.

## Quyết định đã chốt (2026-08-01)

| # | Quyết định | Chọn |
|---|---|---|
| 1 | Cô lập database mỗi dự án | **A — Cô lập logic**: 1 Firestore, mỗi dự án là nhánh `projects/{id}/…`, Security Rules chặn chéo dự án |
| 2 | Firebase project | **Tạo mới** (không tái dùng `navyhanoi`) |
| 3 | Vai trò & khóa 24h | **Giữ nguyên** 3 cấp: L1 toàn quyền / L2 chỉ trả lời + khóa 24h / L3 chỉ xem |
| 4 | Backend + xác thực | **Firebase** (Auth email/mật khẩu + Firestore + Storage) |
| 5 | Tạo tài khoản | **Tự đăng ký** + xác minh email; admin gán vai trò sau |

## Nguyên tắc
- **1 app tổng quát** tham số hóa theo `?project=<slug>` — thêm dự án = tạo bản ghi, không sửa code.
- **Nhánh độc lập** `feat/rficonsole`, thư mục tự chứa `public/rficonsole/`, không đụng app React chính.
- **Phân quyền enforced phía server** bằng Firestore Security Rules (thay `permissions.js` client-side cũ).
- MVP không cần Cloud Functions → chạy trên gói Spark miễn phí.

## Mô hình dữ liệu (Firestore)
```
config/owners            { emails: ["dinhvietdung.amc@gmail.com"] }   // super-admin toàn portal
projects/{projectId}     { name, slug, trimbleUrl, description, status, createdBy, createdAt }
  members/{emailKey}     { email, role: 1|2|3, status:"active", addedBy, addedAt }   // emailKey = email lowercase
  rfis/{rfiId}           { stt, banVe, yeuCauNoiDung, traLoiNoiDung, ghiChu,
                           yeuCauNote, traLoiNote, trangThai, ngayGhiNhan,
                           yeuCauImages:[{path,url}], traLoiImages:[{path,url}],
                           editors:{field:{email,ts}}, firstEditTime, order }
```
**Ảnh:** vì project Firebase mới bị **khóa Cloud Storage trên gói Spark** (đòi Blaze), ảnh
được **nén (canvas → JPEG ~1400px) và lưu base64 NGAY trong document RFI** (mảng
`yeuCauImages`/`traLoiImages` = `[{dataUrl}]`). Chặn tổng ~900KB/dòng để không vượt giới
hạn 1MB/doc của Firestore. `storage.rules` giữ lại nhưng KHÔNG dùng cho tới khi nâng Blaze
(Giai đoạn 6). Đổi quyết định: 2026-08-01.

## Giai đoạn
- [x] **0. Docs + Rules** — PLAN.md, DEPLOY.md, firestore.rules, storage.rules, firebase.js
- [x] **1. Auth shell** — đăng ký/đăng nhập/xác minh/reset + màn hình "chưa có quyền"
- [x] **2. Tab Admin** — tạo dự án, cấu hình Trimble, cấp quyền theo email/vai trò
- [x] **3. App RFI** — chọn dự án + bảng Q&A (port UI từ RFI Web), vai trò từ Firestore, ảnh lên Storage
- [ ] **4. Ảnh + di trú** — ảnh → Storage; nhập dữ liệu NAVY Hanoi hiện có
- [ ] **5. Hoàn thiện** — Rules khóa 24h + field-level, đồng bộ giao diện portal, link từ trang chủ
- [ ] **6. (Tùy chọn)** — Cloud Function (nếu sau này cần DB vật lý riêng / mời qua email)

## Review đối kháng (workflow, 5 chiều) — đã xử lý

**Đã vá:**
- L2 khóa 24h giờ **cưỡng chế server-side** (rules: `firstEditTime` == request.time lần đầu, bất biến sau) — không lách bằng SDK được.
- **Stored XSS**: escape nháy kép trong mọi thuộc tính (`escAttr` ở admin.js/auth.js); sanitize `role` về số; validate `role∈{1,2,3}` + regex email tại rules (chặn payload tại nguồn).
- **Token cũ sau xác minh**: `getIdToken(true)` trước khi đọc Firestore; xác minh xong `route()` (giữ deep-link `?project`).
- **`orderBy('order')`** bỏ đi → sort client-side (không ẩn doc thiếu `order`).
- Owner không phải member vẫn mở được board; lỗi tạm thời không xóa `?project`; thumbnail ảnh hiện ngay sau dán; reset `_touched`; URL Trimble chỉ nhận http(s).

**Rủi ro chấp nhận (đưa vào Giai đoạn 6):**
- **Storage coarse**: Rules Storage không đọc được Firestore membership → mọi user đã xác minh có thể đọc/ghi/xóa ảnh nếu biết path. Firestore vẫn giấu URL (chỉ member đọc được doc). Khắc phục triệt để cần custom claims / Cloud Function.
- **config/owners đọc được bởi mọi user đã đăng nhập** (để tự nhận biết owner) → lộ danh sách email admin. Thay bằng custom claim nếu cần.
- Quản lý thành viên là **owner HOẶC L1** (đúng thiết kế "toàn quyền").

**Lưu ý Giai đoạn 4 (di trú):** mọi doc RFI nhập vào PHẢI có field `order` (và `editors`), nếu không sẽ xuống cuối bảng.

## Việc cần chủ dự án làm (xem DEPLOY.md)
1. Tạo Firebase project mới → bật Email/Password auth → tạo Firestore + Storage.
2. Thêm `ividlab.com` vào Authorized domains.
3. Dán `firebaseConfig` vào `firebase.js`.
4. Seed `config/owners` với email owner.
5. Deploy `firestore.rules` + `storage.rules`.
