# Chuyên mục AMC Private tools

Chuyên mục **chỉ người trong danh sách đọc được** (thành viên AMC), đăng nhập bằng **Google Sign-In**. Hiện có
bài giới thiệu + hướng dẫn sử dụng Steel Design Universe (SDU).

| Link | Nguồn | Ghi chú |
|---|---|---|
| `ividlab.com/?tab=amc-private` | `src/components/AmcPrivateSection.jsx` | Chỉ mô tả công khai + nút đăng nhập |
| `ividlab.com/amc-private/` (`?p=<slug>`) | `public/amc-private/` | Trang đọc: đăng nhập → kiểm quyền → danh sách / 1 bài |
| `ividlab.com/admin/amc.html` | `public/admin/amc.html`, `amc.js` | Owner: quản lý người đọc, tải bài lên |

## Vì sao nội dung KHÔNG nằm trong repo này

Repo này public và mọi thứ trong `public/` ai cũng tải được (`scripts/deploy.cjs` chỉ chặn `.rules/.gs/.md`).
Nên chỉ có **khung trang** ở đây; nội dung nằm trong Firestore project `ividlab-rficonsole`:

| Dữ liệu | Vị trí | Ai đọc / ghi |
|---|---|---|
| Người đọc | `amcReaders/{email chữ thường}` = `{ email, name, addedAt }` | Người đọc chỉ đọc doc của mình; owner đọc/ghi hết |
| Bài | `amcPosts/{slug}` = `{ title, description, tag, date, order, html, updatedAt }` | Người đọc + owner đọc; owner ghi |
| Ảnh | `amcPosts/{slug}/img/{tên file}` = `{ data: data URL, bytes }` | Như bài |
| File lớn (GIF thao tác, bộ cài, bộ thiết lập) | `amcFiles/{tên file}` = `{ name, type, size, chunks, sha256 }` + `amcFiles/{tên}/chunks/{000…}` = `{ data: Bytes ≤ 900 KB }` | Như bài |

Ảnh để trong Firestore (base64, < 1 MB/ảnh) thay vì Storage: không phải cấu hình CORS bucket, không cần rules chéo
Storage→Firestore, và không có link tải công khai kiểu `getDownloadURL()` có token.

Danh sách người đọc **không** để trong `config/*` vì `config` ai đăng nhập cũng đọc được (xem rules).

**Nguồn bài viết** (html + ảnh + `posts.json`) nằm trong repo SDU (private):
`T:\AutoCAD\Steel Design Universe\Docs\Web-AMC-Private\` — cách viết bài xem README ở đó.

## Cài đặt lần đầu (làm 1 lần, bằng tay)

1. **Dán rules**: Firebase Console → project `ividlab-rficonsole` → Firestore Database → Rules → dán toàn bộ
   [`firebase/rficonsole/firestore.rules`](../../firebase/rficonsole/firestore.rules) → Publish.
   (Storage rules không đổi.)
2. **Deploy web**: `npm run deploy`.
3. **Thêm người đọc**: vào `/admin/amc.html` bằng tài khoản owner → ô *Người được đọc* → mỗi dòng `email, họ tên`
   → *Thêm / cập nhật*.
4. **Tải bài**: cùng trang → *Bài viết* → chọn thư mục `Docs/Web-AMC-Private` của repo SDU → *Tải lên*.

Google provider và authorized domain `ividlab.com` đã bật sẵn từ trang `/admin/` (xem `docs/admin/README.md`).

## Lưu ý

- **Email phải là tài khoản Google.** Gmail thì chắc chắn được. Email tên miền công ty (vd. `@amcsteel.vn`) chỉ
  đăng nhập được nếu tên miền dùng Google Workspace, hoặc người đó đã tạo tài khoản Google bằng chính email này.
  Nếu không, thêm Gmail của người đó vào danh sách thay thế.
- Người không có trong danh sách vẫn đăng nhập Google được nhưng chỉ thấy màn "Chưa được cấp quyền";
  mọi truy vấn `amcPosts` của họ bị rules trả `permission-denied`.
- Owner (`config/owners`) luôn đọc được mọi bài dù không có trong `amcReaders`, và thấy khung
  "📷 Chưa có ảnh" cho ảnh còn thiếu (người đọc thường thì khung đó tự ẩn).
- `html` của bài được chèn thẳng bằng `innerHTML` — an toàn vì chỉ owner ghi được `amcPosts` (rules).
- Trang `/amc-private/` và `/admin/amc.html` có `noindex` và không gắn `traffic-track.js`.
- Đổi quyền có hiệu lực ngay (rules đọc `amcReaders` mỗi lần truy vấn); người bị xoá chỉ cần tải lại trang.

## File lớn và nút tải (amcFiles)

- Trong html bài: GIF `<img data-amc-media="<tên>">` (tải khi cuộn gần tới), nút tải
  `<a class="btn btn--primary" data-amc-download="<tên>">Nhãn</a>` (tự hiện dung lượng, bấm thì ghép khúc và lưu với tên gốc).
- Nguồn là thư mục `files/` trong thư mục bài (repo SDU). Trang `/admin/amc.html` tải lên theo khúc; file cùng sha256 thì
  bỏ qua, file không còn trong thư mục thì xoá (chỉ khi thư mục chọn có `files/`).
- Không có URL công khai: file chỉ tải được qua Firestore SDK sau khi đăng nhập và có trong `amcReaders`.
- Đổi rules (thêm `amcFiles`) → phải dán lại `firestore.rules` vào Console và Publish.
