// Bộ đếm lượt xem/tải dùng chung cho toàn site — ghi vào Firestore (project Firebase
// của RFI Console, xem docs/admin/README.md). Mỗi lượt xem/tải ghi path + loại + thời gian
// + mã quốc gia 2 chữ cái (lấy từ Cloudflare của chính site, không lưu IP) + mã phiên ngẫu nhiên
// theo từng lần mở trang (sid, không gắn với người). Thời gian đọc ghi riêng ở collection
// trafficReads theo mốc 15/45/120/300 giây (chỉ tính lúc tab đang hiện và có focus).
// Không cookie/fingerprint. Luôn fire-and-forget: lỗi mạng/ad-blocker/rules cũ không được
// làm hỏng trang.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8-vSVDKhOLuTA6xmYZzwHVrWX58eT3d4",
  authDomain: "ividlab-rficonsole.firebaseapp.com",
  projectId: "ividlab-rficonsole",
  storageBucket: "ividlab-rficonsole.firebasestorage.app",
  messagingSenderId: "447726977999",
  appId: "1:447726977999:web:68355281ff424892ea48ba",
};

let db = null;
try { db = getFirestore(initializeApp(firebaseConfig)); } catch (e) { /* bỏ qua */ }

// Mã phiên ngẫu nhiên cho MỖI lần mở trang: nối bản ghi lượt xem với các mốc thời gian đọc của nó.
const sid = (() => {
  try {
    if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  } catch (e) { /* dùng bản dự phòng */ }
  return (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 20);
})();

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

function write(coll, data) {
  return addDoc(collection(db, coll), { ...data, ts: serverTimestamp() });
}

// Rules cũ (chưa cho field country/sid) sẽ từ chối bản đủ trường → ghi lại bản tối thiểu {path,type} để không mất lượt xem/tải.
function logHit(path, type, country) {
  if (!db) return;
  try {
    const extra = { sid };
    if (country) extra.country = country;
    write('trafficHits', { path, type, ...extra })
      .catch(() => write('trafficHits', { path, type }))
      .catch(() => {});
  } catch (e) { /* bỏ qua */ }
}

visitorCountry(1500).then((country) => logHit(location.pathname + location.search, 'view', country));

// Thời gian đọc: đếm giây khi tab đang hiện + có focus, ghi tại các mốc (mỗi mốc 1 bản ghi, tối đa 4/lượt xem).
const MILESTONES = [15, 45, 120, 300];
let engaged = 0;
let nextMilestone = 0;
if (db) {
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
