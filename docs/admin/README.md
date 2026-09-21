# Admin — Kiểm soát lưu lượng truy cập

`ividlab.com/admin/` — dashboard xem lượt xem trang + lượt tải PEB Member, đăng nhập bằng
**Google Sign-In**, cùng project Firebase `ividlab-rficonsole` với RFI Console và cùng danh
sách allowlist `config/owners` (giống pattern đăng nhập của `asoft-license-web`, xem
`T:\asoft-license-web\src\App.jsx`). Đăng nhập Google thành công không tự nhiên có quyền — vẫn
phải nằm trong `config/owners` mới qua được màn "Không có quyền quản trị".

**Cần bật 1 lần:** Firebase Console → project `ividlab-rficonsole` → Authentication → Sign-in
method → bật provider **Google** (chỉ RFI Console dùng Email/Password nên provider này chưa
từng bật trước đây). Không cần đổi gì ở RFI Console — nó vẫn dùng email/password như cũ, chỉ
`/admin/` đổi sang Google.

## Cách đếm hoạt động

- `public/traffic-track.js` — chạy trên mọi trang công khai (được include qua 1 dòng
  `<script type="module" src="/traffic-track.js">` trong `<head>`). Mỗi lần tải trang, ghi
  1 document vào Firestore collection `trafficHits`: `{ path, type: 'view', ts }`.
- Nút tải PEB Member (`public/tekla/peb-member/assets/article.js`) gọi
  `window.iViDTrack.download(packageKey)` khi bấm tải, ghi `{ path: '/download/<key>', type: 'download', ts }`.
  `packageKey` là mã gói ổn định (vd. `2021_Higher`), không phải tên file theo version, để
  lịch sử không bị phân mảnh mỗi lần ra bản mới.
- Không thu thập IP, cookie, hay bất kỳ định danh cá nhân nào — chỉ path + loại + thời gian.
- `public/admin/admin.js` đọc tối đa 10.000 bản ghi gần nhất (`HIT_LIMIT` — đúng bằng mức
  `limit()` tối đa Firestore cho phép trong 1 structured query, không phải số tự chọn), tự tổng hợp theo
  trang/gói × (tổng / 7 ngày / 30 ngày). Dung lượng tải ước tính = số lượt tải × kích thước
  file thật (field `bytes` trong `downloads.json`) — chỉ tính được cho download vì GitHub
  **không hề công khai số GB băng thông đã dùng ở bất kỳ đâu**; lượt xem trang chỉ hiển thị
  số lượt, không suy ra dung lượng (page weight thay đổi theo ảnh/cache, số đó sẽ là bịa).

## Cần làm khi cập nhật rules

Rules của `trafficHits` nằm chung file với RFI Console (cùng Firebase project):
[`firebase/rficonsole/firestore.rules`](../../firebase/rficonsole/firestore.rules). Sau khi
sửa file này, dán lại toàn bộ nội dung vào **Firestore Database → tab Rules → Publish**
(xem thêm [docs/rficonsole/DEPLOY.md](../rficonsole/DEPLOY.md) bước 6).

## Giới hạn đã biết (chấp nhận được ở quy mô site hiện tại)

- **Ghi công khai không chặn spam theo tần suất**: `trafficHits` cho phép `create` từ bất kỳ
  ai (kể cả chưa đăng nhập) miễn đúng hình dạng dữ liệu — đây là điều bắt buộc để đếm được
  khách vãng lai. Rules chặn được sửa/xoá và chặn sai hình dạng, nhưng không chặn được một
  script cố tình gửi hàng loạt lượt "xem" giả. Ở quy mô traffic hiện tại rủi ro thấp (Firestore
  free tier 50k đọc + 20k ghi/ngày); nếu sau này bị spam thật, giải pháp là bật
  **Firebase App Check** (reCAPTCHA) cho project — chưa làm vì chưa cần.
- **Không phải số liệu chính thức của GitHub**: đây là site tự đếm qua Firestore, không phải
  số GitHub đo (GitHub Traffic API cũng chỉ có views/clones 14 ngày gần nhất, không có số GB).
- **HIT_LIMIT 10.000 bản ghi** (mức trần cứng của Firestore, không thể tăng bằng cách sửa số):
  đủ dùng nhiều năm ở traffic hiện tại. Nếu số "Tổng" bắt đầu bị cảnh báo "đã chạm giới hạn"
  trong `scope-note`, cần chuyển sang rollup theo ngày (không làm trước vì chưa cần).
- Dashboard hiện **chỉ theo dõi** — không có công tắc chủ động tắt/giới hạn tải xuống. Nếu cần,
  thêm sau bằng cách đọc thêm 1 document cấu hình (vd. `config/siteControl`) từ các trang công khai.
