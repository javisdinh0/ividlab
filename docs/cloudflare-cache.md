# Cloudflare cache cho ividlab.com

Hiện trạng (đo 2026-10-20): HTML `cf-cache-status: DYNAMIC` — Cloudflare **không** cache HTML, mọi lượt
xem đều chạy về GitHub Pages (TTFB 0,3–0,9 s). File `.js/.css/ảnh` cache theo Browser Cache TTL mặc định
4 giờ, kể cả `/assets/*` có hash trong tên (đáng ra cache được 1 năm).

Làm 3 bước dưới trên dashboard Cloudflare (zone `ividlab.com`). Thứ tự quan trọng: **làm bước 3 (token
xoá cache) trước khi bật rule cache HTML**, nếu không sau mỗi lần deploy khách sẽ thấy bản cũ tới khi
hết hạn cache.

## 1. Cache Rules (Caching → Cache Rules → Create rule)

| # | Tên | Điều kiện (Edit expression) | Cache | Edge TTL | Browser TTL |
|---|---|---|---|---|---|
| 1 | Assets có hash | `starts_with(http.request.uri.path, "/assets/")` | Eligible | Ignore origin, 1 năm | Override, 1 năm |
| 2 | Ảnh/video/font | `http.request.uri.path.extension in {"webp" "png" "jpg" "jpeg" "gif" "svg" "mp4" "woff2" "ico"}` | Eligible | Ignore origin, 1 tháng | Override, 1 ngày |
| 3 | HTML công khai | `http.host eq "ividlab.com" and not starts_with(http.request.uri.path, "/admin/") and not starts_with(http.request.uri.path, "/rficonsole/") and not starts_with(http.request.uri.path, "/amc-private/") and not starts_with(http.request.uri.path, "/cdn-cgi/")` | Eligible | Ignore origin, 1 ngày | Respect origin (GitHub gửi 10 phút) |

Rule 3 đặt **dưới cùng** (rule 1, 2 khớp trước). `.js/.css` ngoài `/assets/` (article.js, traffic-track.js,
rficonsole) đã có `?v=<hash>` do `stamp-assets.cjs` / `stamp-rficonsole.cjs` gắn khi build, nên rule 3 cache
chúng an toàn — query string là một phần của cache key.

## 2. Kiểm tra

```bash
curl -sI https://ividlab.com/ | grep -i cf-cache-status
```

Lần đầu `MISS`, lần sau `HIT`. `/assets/main-*.js` phải có `Cache-Control: max-age=31536000`.

## 3. Token xoá cache cho `npm run deploy`

1. My Profile → API Tokens → Create Token → **Custom token**: quyền `Zone · Cache Purge · Purge`,
   Zone Resources: `Include · Specific zone · ividlab.com`.
2. Zone ID: trang Overview của zone, cột phải.
3. Đặt biến môi trường **User** (không lưu trong repo/OneDrive), mở lại terminal sau khi đặt:

```powershell
[Environment]::SetEnvironmentVariable('CLOUDFLARE_API_TOKEN', '<token>', 'User')
[Environment]::SetEnvironmentVariable('CLOUDFLARE_ZONE_ID', '<zone id>', 'User')
```

Từ đó `scripts/deploy.cjs` push xong sẽ đợi 90 giây (GitHub Pages build) rồi gọi
`purge_cache {purge_everything: true}`. Đổi thời gian chờ bằng biến `CF_PURGE_DELAY` (giây).
Thiếu biến thì deploy chạy như cũ, chỉ in dòng "Bỏ qua xoá cache Cloudflare".
