// Trang Admin — Kiểm soát lưu lượng truy cập. Dùng chung Firebase project với RFI Console
// (cùng tài khoản owner qua config/owners, xem docs/admin/README.md). Config public được,
// bảo mật do Security Rules đảm bảo — xem firebase/rficonsole/firestore.rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyB8-vSVDKhOLuTA6xmYZzwHVrWX58eT3d4",
  authDomain: "ividlab-rficonsole.firebaseapp.com",
  projectId: "ividlab-rficonsole",
  storageBucket: "ividlab-rficonsole.firebasestorage.app",
  messagingSenderId: "447726977999",
  appId: "1:447726977999:web:68355281ff424892ea48ba",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Chuẩn hóa email làm khóa so khớp config/owners (chữ thường, cắt khoảng trắng).
export function emailKey(email) {
  return (email || "").trim().toLowerCase();
}
