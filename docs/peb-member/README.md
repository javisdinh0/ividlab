# Chuyên mục PEB Member

Chuyên mục giới thiệu plugin **PEB Member** (gói `PEBToolsVN`) cho Tekla Structures.

| Link | Nguồn |
|---|---|
| `ividlab.com/?tab=peb-member` — trang chuyên mục (tab trong SPA) | `src/components/PebMemberSection.jsx` |
| `ividlab.com/tekla/peb-member/` — link gọn, tự chuyển về tab trên | `public/tekla/peb-member/index.html` |
| `ividlab.com/tekla/peb-member/<slug>.html` — từng bài viết | `public/tekla/peb-member/*.html` |

## Cấu trúc `public/tekla/peb-member/`

| File | Vai trò |
|---|---|
| `posts.json` | **Danh sách bài của chuyên mục** — tab PEB Member và mục "Bài viết khác" cuối mỗi bài đều đọc file này |
| `downloads.json` | Phiên bản plugin, gói `.tsep` theo từng bản Tekla, ghi chú "Có gì mới" — hộp Tải về đọc file này |
| `assets/article.css`, `assets/article.js` | Giao diện + hành vi dùng chung (theme, VN/EN, combobox tải về, khối tự kích hoạt, phóng to ảnh…) |
| `img/` | Ảnh PNG và GIF minh hoạ |
| `*.html` | Các bài viết (bài tổng quan: `gioi-thieu-peb-member.html`) |

Gói cài đặt nằm ở `public/fordownload/peb-member/` (chỉ giữ bản mới nhất).

## Viết bài mới

1. Chép `docs/peb-member/article-template.html` thành `public/tekla/peb-member/<slug>.html`
   (slug không dấu, nối gạch ngang, vd. `huong-dan-cai-dat-peb-member.html`). Sửa các chỗ `TODO`.
2. Ảnh/GIF để trong `public/tekla/peb-member/img/`, chèn bằng `<figure class="media">` như trong mẫu.
   Ảnh chưa có: chạy `npm run dev` sẽ thấy khung "Chưa có ảnh" ghi rõ tên file; trên site thật khung đó tự ẩn.
3. Thêm một mục vào **đầu** mảng `posts.json`:

   ```json
   {
     "id": "huong-dan-cai-dat-peb-member",
     "link": "/tekla/peb-member/huong-dan-cai-dat-peb-member.html",
     "title": { "vi": "…", "en": "…" },
     "description": { "vi": "…", "en": "…" },
     "tag": { "vi": "Hướng dẫn", "en": "Guide" },
     "date": "2026-10-01",
     "cover": "/tekla/peb-member/img/…png"
   }
   ```

   `title`/`description`/`tag` có thể là chuỗi thường nếu chỉ viết một ngôn ngữ; `cover` không bắt buộc.
   Bài có `"featured": true` được dùng làm ảnh lớn ở đầu trang chuyên mục.
4. Chỉ viết tiếng Việt: xoá khối `data-lang="en"` và bỏ `data-lang="vi"` ở khối nội dung (xem ghi chú trong mẫu).
5. `npm run dev` → kiểm tra `http://localhost:5173/?tab=peb-member` và trang bài viết, rồi `npm run deploy`.

## Tự kích hoạt dùng thử 90 ngày

Khối `<div class="activate-card" id="tu-kich-hoat" data-trial-activate>` (có sẵn trong mẫu, ngay dưới hộp
Tải về) cho người dùng dán Product Key + email để nhận Active Key 90 ngày ngay trên trang — không cần
liên hệ. `article.js` gọi cùng API với trang `/trial/` (A-Soft License):

- `POST https://license.ividlab.com/api/keygen/trial` với `productOverride: "PEBToolsVN"` — key PEB dạng
  cũ (không có tiền tố `PT1-`) vẫn kích hoạt được, key của phần mềm khác bị báo lỗi rõ ràng.
- Máy chủ chặn trùng theo máy và theo email, giới hạn 5 lần/phút mỗi IP; các lỗi tiếng Anh hay gặp được
  đổi sang lời dễ hiểu (bảng `TRIAL_ERRORS` + chuỗi `err…` trong `article.js`).
- CORS chỉ cho `https://ividlab.com` → chạy `npm run dev` bấm Nhận key sẽ báo "Không kết nối được máy chủ",
  đó là bình thường; muốn thử giao diện thì giả lập `window.fetch` trong DevTools.

## Video → GIF

Cần `ffmpeg` trên PATH (`winget install Gyan.FFmpeg`).

```powershell
.\scripts\video-to-gif.ps1 -In D:\rec\draw.mp4 -Out public\tekla\peb-member\img\06-draw.gif -Start 2 -Duration 15
```

Tham số hay dùng: `-Speed 1.5` (tua nhanh), `-Width 800`, `-Fps 10`, `-Colors 96` (giảm dung lượng).
Nên giữ mỗi GIF dưới ~3 MB; quay cửa sổ ở độ phân giải vừa phải (≈1280×800) thì chữ trong GIF vẫn đọc được.

## Phát hành bản plugin mới

1. Build plugin như thường lệ (`Build_All_TSEPs.ps1` trong repo PEB Tools VN) — ra đủ 6 gói
   `PEBToolsVN_{2016,2017,2018,2019,2020,2021_Higher}_v<phiên bản>.tsep` trong thư mục Publish.
2. Chép gói mới vào web và cập nhật `downloads.json` (phiên bản, tên file, dung lượng, ngày):

   ```powershell
   node scripts/update-peb-member-downloads.cjs "<thư mục PEB Tools VN Publish>"
   ```

   Mặc định lấy phiên bản cao nhất có đủ 6 gói; muốn chọn bản cụ thể thì thêm số phiên bản ở cuối.
3. Sửa tay trong `downloads.json`:
   - `notes` — mục "Có gì mới" (vi/en);
   - `tekla` — nếu thay đổi phạm vi hỗ trợ (vd. có gói cho Tekla 2025 thì thêm gói vào `packages`
     và trỏ mục `2027+` sang gói đó thay vì `null`).
4. Kiểm tra hộp Tải về trên `npm run dev`, rồi deploy.

Gói `2020_Under` (bản dùng chung 2017–2020 có Auto-Launcher) cố ý không đưa lên web: mỗi năm 2016–2020
đã có gói build riêng đúng Tekla Open API của năm đó.
