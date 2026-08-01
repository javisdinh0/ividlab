// RFI Console — khởi tạo Firebase dùng chung (app RFI + tab admin).
// Firebase v10 modular SDK qua CDN ESM.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// ┌───────────────────────────────────────────────────────────────────────┐
// │  DÁN firebaseConfig CỦA BẠN VÀO ĐÂY (xem DEPLOY.md bước 5).            │
// │  Config này công khai được — bảo mật do Security Rules đảm bảo.        │
// └───────────────────────────────────────────────────────────────────────┘
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

// true khi đã dán config thật (chưa dán thì UI báo "chưa cấu hình").
export const CONFIGURED = !!firebaseConfig.apiKey && firebaseConfig.apiKey.indexOf("PASTE") === -1;

export const app = CONFIGURED ? initializeApp(firebaseConfig) : null;
export const auth = CONFIGURED ? getAuth(app) : null;
export const db = CONFIGURED ? getFirestore(app) : null;
export const storage = CONFIGURED ? getStorage(app) : null;

// Chuẩn hóa email làm khóa document thành viên (chữ thường, cắt khoảng trắng).
export function emailKey(email) {
  return (email || "").trim().toLowerCase();
}
