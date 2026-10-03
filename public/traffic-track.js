// Bộ đếm lượt xem/tải dùng chung cho toàn site — ghi vào Firestore (project Firebase
// của RFI Console, xem docs/admin/README.md). Ghi path + loại + thời gian; riêng lượt TẢI
// có thêm mã quốc gia 2 chữ cái (lấy từ Cloudflare của chính site, không lưu IP), không
// cookie/fingerprint. Luôn fire-and-forget: lỗi mạng/ad-blocker không được làm hỏng trang.
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

function logHit(path, type, country) {
  if (!db) return;
  const write = (data) => addDoc(collection(db, 'trafficHits'), { path, type, ts: serverTimestamp(), ...data });
  try {
    // Rules cũ (chưa cho field `country`) sẽ từ chối bản có quốc gia → ghi lại không kèm quốc gia để không mất lượt tải.
    const p = country ? write({ country }).catch(() => write({})) : write({});
    p.catch(() => {});
  } catch (e) { /* bỏ qua */ }
}

// Quốc gia của khách: /cdn-cgi/trace do Cloudflare (đứng trước ividlab.com) phục vụ cùng origin, trả `loc=VN`.
// Không có (chạy local, bị chặn, quá 2,5 giây) thì trả '' — lượt tải vẫn được ghi.
async function visitorCountry() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch('/cdn-cgi/trace', { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return '';
    const m = (await res.text()).match(/^loc=([A-Z]{2})$/m);
    return m && m[1] !== 'XX' && m[1] !== 'T1' ? m[1] : '';
  } catch (e) { return ''; }
}

logHit(location.pathname + location.search, 'view');

// Các trang tải file (vd. peb-member/assets/article.js) gọi window.iViDTrack.download(key)
// khi khách bấm nút tải — key là mã gói ổn định (vd. "2021_Higher"), không phải tên file
// theo version, để lịch sử không bị phân mảnh mỗi lần ra bản mới.
window.iViDTrack = {
  download(packageKey) {
    visitorCountry().then((country) => logHit('/download/' + packageKey, 'download', country));
  }
};
