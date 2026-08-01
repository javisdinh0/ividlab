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
Storage: projects/{projectId}/rfis/{rfiId}/{imageId}.jpg
```
Firestore giới hạn 1MB/doc → mỗi RFI là 1 document, ảnh nằm trong Storage (không base64 trong DB).

## Giai đoạn
- [x] **0. Docs + Rules** — PLAN.md, DEPLOY.md, firestore.rules, storage.rules, firebase.js
- [x] **1. Auth shell** — đăng ký/đăng nhập/xác minh/reset + màn hình "chưa có quyền"
- [x] **2. Tab Admin** — tạo dự án, cấu hình Trimble, cấp quyền theo email/vai trò
- [ ] **3. App RFI** — chọn dự án + bảng Q&A (port UI từ RFI Web), vai trò từ Firestore
- [ ] **4. Ảnh + di trú** — ảnh → Storage; nhập dữ liệu NAVY Hanoi hiện có
- [ ] **5. Hoàn thiện** — Rules khóa 24h + field-level, đồng bộ giao diện portal, link từ trang chủ
- [ ] **6. (Tùy chọn)** — Cloud Function (nếu sau này cần DB vật lý riêng / mời qua email)

## Việc cần chủ dự án làm (xem DEPLOY.md)
1. Tạo Firebase project mới → bật Email/Password auth → tạo Firestore + Storage.
2. Thêm `ividlab.com` vào Authorized domains.
3. Dán `firebaseConfig` vào `firebase.js`.
4. Seed `config/owners` với email owner.
5. Deploy `firestore.rules` + `storage.rules`.
