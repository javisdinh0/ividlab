// Bộ đếm lượt xem/tải dùng chung cho toàn site — ghi vào Firestore (project Firebase
// của RFI Console, xem docs/admin/README.md). Chỉ ghi path + loại + thời gian, không
// thu thập IP/cookie/fingerprint. Luôn fire-and-forget: lỗi mạng/ad-blocker không
// được phép làm hỏng trang.
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

function logHit(path, type) {
  if (!db) return;
  try {
    addDoc(collection(db, 'trafficHits'), { path, type, ts: serverTimestamp() }).catch(() => {});
  } catch (e) { /* bỏ qua */ }
}

logHit(location.pathname + location.search, 'view');

// Các trang tải file (vd. peb-member/assets/article.js) gọi window.iViDTrack.download(key)
// khi khách bấm nút tải — key là mã gói ổn định (vd. "2021_Higher"), không phải tên file
// theo version, để lịch sử không bị phân mảnh mỗi lần ra bản mới.
window.iViDTrack = {
  download(packageKey) { logHit('/download/' + packageKey, 'download'); }
};
