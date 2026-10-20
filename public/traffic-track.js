// Bộ đếm lượt xem/tải dùng chung cho toàn site — ghi vào Firestore (project Firebase
// của RFI Console, xem docs/admin/README.md). Mỗi lượt xem/tải ghi path + loại + thời gian
// + mã quốc gia 2 chữ cái (lấy từ Cloudflare của chính site, không lưu IP) + mã phiên ngẫu nhiên
// theo từng lần mở trang (sid, không gắn với người). Thời gian đọc ghi riêng ở collection
// trafficReads theo mốc 15/45/120/300 giây (chỉ tính lúc tab đang hiện và có focus).
// Không cookie/fingerprint. Luôn fire-and-forget: lỗi mạng/ad-blocker/rules cũ không được
// làm hỏng trang.
//
// Ghi qua Firestore REST API (documents:commit) bằng fetch thay cho Firebase SDK: SDK nặng
// ~135 KB gzip và chạy trên MỌI trang chỉ để ghi vài document. Commit với currentDocument
// {exists:false} là thao tác "create" (rules vẫn áp như cũ) và transform REQUEST_TIME cho ts
// chính là cách SDK làm serverTimestamp() — nên rules `ts == request.time` không cần đổi.

const API_KEY = 'AIzaSyB8-vSVDKhOLuTA6xmYZzwHVrWX58eT3d4';
const DB = 'projects/ividlab-rficonsole/databases/(default)';
const COMMIT_URL = `https://firestore.googleapis.com/v1/${DB}/documents:commit?key=${API_KEY}`;

function randomId(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(len);
  try { crypto.getRandomValues(bytes); } catch (e) { for (let i = 0; i < len; i++) bytes[i] = Math.random() * 256; }
  let s = '';
  for (let i = 0; i < len; i++) s += chars[bytes[i] % chars.length];
  return s;
}

// Mã phiên ngẫu nhiên cho MỖI lần mở trang: nối bản ghi lượt xem với các mốc thời gian đọc của nó.
const sid = randomId(20);

// Quốc gia của khách: /cdn-cgi/trace do Cloudflare (đứng trước ividlab.com) phục vụ cùng origin, trả `loc=VN`.
// Nhớ trong sessionStorage để các trang sau không gọi lại. Không có (chạy local, bị chặn, quá hạn) thì trả ''.
async function visitorCountry(timeoutMs) {
  try {
    const cached = sessionStorage.getItem('ividlab-cc');
    if (cached !== null) return cached;
  } catch (e) { /* bỏ qua */ }
  let cc = '';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch('/cdn-cgi/trace', { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const m = (await res.text()).match(/^loc=([A-Z]{2})$/m);
      if (m && m[1] !== 'XX' && m[1] !== 'T1') cc = m[1];
    }
  } catch (e) { /* bỏ qua */ }
  try { sessionStorage.setItem('ividlab-cc', cc); } catch (e) { /* bỏ qua */ }
  return cc;
}

// Giá trị JS -> Firestore Value (chỉ cần string và số nguyên)
function toFields(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { stringValue: String(v) };
  }
  return fields;
}

// Tạo 1 document mới; reject nếu rules từ chối (để logHit thử lại bản tối thiểu).
async function write(coll, data) {
  const res = await fetch(COMMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true, // vẫn gửi được khi khách đóng tab ngay sau khi bấm tải
    body: JSON.stringify({
      writes: [{
        update: { name: `${DB}/documents/${coll}/${randomId(20)}`, fields: toFields(data) },
        updateTransforms: [{ fieldPath: 'ts', setToServerValue: 'REQUEST_TIME' }],
        currentDocument: { exists: false },
      }],
    }),
  });
  if (!res.ok) throw new Error('firestore ' + res.status);
}

// Rules cũ (chưa cho field country/sid) sẽ từ chối bản đủ trường → ghi lại bản tối thiểu {path,type} để không mất lượt xem/tải.
function logHit(path, type, country) {
  const extra = { sid };
  if (country) extra.country = country;
  write('trafficHits', { path, type, ...extra })
    .catch(() => write('trafficHits', { path, type }))
    .catch(() => {});
}

visitorCountry(1500).then((country) => logHit(location.pathname + location.search, 'view', country));

// Thời gian đọc: đếm giây khi tab đang hiện + có focus, ghi tại các mốc (mỗi mốc 1 bản ghi, tối đa 4/lượt xem).
const MILESTONES = [15, 45, 120, 300];
let engaged = 0;
let nextMilestone = 0;
{
  const path = location.pathname + location.search;
  const timer = setInterval(async () => {
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
    engaged++;
    if (engaged >= MILESTONES[nextMilestone]) {
      const secs = MILESTONES[nextMilestone++];
      try {
        const country = await visitorCountry(1500);
        const data = { path, sid, secs };
        if (country) data.country = country;
        write('trafficReads', data).catch(() => {});
      } catch (e) { /* bỏ qua */ }
      if (nextMilestone >= MILESTONES.length) clearInterval(timer);
    }
  }, 1000);
}

// Các trang tải file (vd. peb-member/assets/article.js) gọi window.iViDTrack.download(key)
// khi khách bấm nút tải — key là mã gói ổn định (vd. "2021_Higher"), không phải tên file
// theo version, để lịch sử không bị phân mảnh mỗi lần ra bản mới.
window.iViDTrack = {
  download(packageKey) {
    visitorCountry(2500).then((country) => logHit('/download/' + packageKey, 'download', country));
  }
};
