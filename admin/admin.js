// Trang Admin — Kiểm soát lưu lượng truy cập. Đọc trafficHits do public/traffic-track.js
// ghi (mọi khách, không đăng nhập) và tổng hợp lại; chỉ owner (config/owners) xem được.
import { auth, db, googleProvider, emailKey } from "./firebase.js";
import {
  onAuthStateChanged, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, query, orderBy, limit, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };

// 10000 là mức limit() tối đa Firestore cho phép trong 1 structured query — vượt số này
// server từ chối thẳng cả câu query (không phải giới hạn tự chọn để "đủ dùng nhiều năm").
// Nếu sau này lượng bản ghi vượt mức này, "Tổng" sẽ chỉ còn tính trên HIT_LIMIT bản ghi gần
// nhất (có cảnh báo ở scope-note) — cần chuyển sang rollup theo ngày lúc đó, chưa cần làm ngay.
const HIT_LIMIT = 10000;
const DAY_MS = 86400000;

function toast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show ' + (type || '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = t.className.replace('show', '').trim(); }, 3400);
}

const VIEWS = ['loading-view', 'login-view', 'denied-view', 'admin-view'];
function showView(id) { VIEWS.forEach(v => show($(v), v === id)); }

wireLogin();
onAuthStateChanged(auth, async (user) => {
  if (!user) { showView('login-view'); return; }
  const owner = await isOwner(user.email);
  if (!owner) { showView('denied-view'); return; }
  bootAdmin(user);
});

async function isOwner(email) {
  try {
    const snap = await getDoc(doc(db, 'config', 'owners'));
    const emails = (snap.exists() && snap.data().emails) || [];
    return emails.map(x => (x || '').toLowerCase()).includes(emailKey(email));
  } catch (e) { return false; }
}

function authErr(e) {
  const map = {
    'auth/popup-closed-by-user': 'Đã đóng cửa sổ đăng nhập trước khi hoàn tất.',
    'auth/cancelled-popup-request': 'Đã huỷ yêu cầu đăng nhập trước đó.',
    'auth/popup-blocked': 'Trình duyệt chặn popup — cho phép popup rồi thử lại.',
    'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối.',
  };
  return map[(e && e.code) || ''] || (e && e.message) || 'Có lỗi xảy ra.';
}

function wireLogin() {
  $('btn-google-login').onclick = async () => {
    $('login-err').textContent = '';
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) { $('login-err').textContent = authErr(err); }
  };
  $('btn-denied-logout').onclick = () => signOut(auth);
}

function bootAdmin(user) {
  showView('admin-view');
  $('user-chip').textContent = user.email;
  $('btn-logout').onclick = () => signOut(auth);
  $('btn-refresh').onclick = () => loadData();
  wireTheme();
  loadData();
}

async function loadData() {
  $('scope-note').textContent = 'Đang tải…';
  try {
    const [hits, packages] = await Promise.all([fetchHits(), fetchPackages()]);
    render(hits, packages);
  } catch (e) {
    console.error(e);
    $('scope-note').textContent = 'Lỗi tải dữ liệu: ' + (e.message || e.code);
    toast('Không tải được dữ liệu traffic: ' + (e.message || e.code), 'err');
  }
}

async function fetchHits() {
  const q = query(collection(db, 'trafficHits'), orderBy('ts', 'desc'), limit(HIT_LIMIT));
  const res = await getDocs(q);
  return res.docs.map(d => d.data());
}

async function fetchPackages() {
  try {
    const res = await fetch('/tekla/peb-member/downloads.json', { cache: 'no-cache' });
    if (!res.ok) return {};
    const data = await res.json();
    return data.packages || {};
  } catch (e) { return {}; }
}

function emptyBucket() { return { total: 0, d7: 0, d30: 0 }; }

function render(hits, packages) {
  const now = Date.now();
  const cut7 = now - 7 * DAY_MS, cut30 = now - 30 * DAY_MS;
  const views = new Map();
  const downloads = new Map();
  let oldestTs = null;

  for (const hit of hits) {
    const t = hit.ts && typeof hit.ts.toMillis === 'function' ? hit.ts.toMillis() : null;
    if (t == null) continue;
    if (oldestTs == null || t < oldestTs) oldestTs = t;
    const isDownload = hit.type === 'download';
    const bucket = isDownload ? downloads : views;
    const key = isDownload ? String(hit.path || '').replace(/^\/download\//, '') : (hit.path || '(không rõ)');
    const entry = bucket.get(key) || emptyBucket();
    entry.total++;
    if (t >= cut7) entry.d7++;
    if (t >= cut30) entry.d30++;
    bucket.set(key, entry);
  }

  let estBytes = 0;
  for (const [key, entry] of downloads) {
    const bytes = packages[key] && packages[key].bytes;
    if (bytes) estBytes += bytes * entry.total;
  }

  $('stat-views').textContent = sumField(views, 'total').toLocaleString('vi-VN');
  $('stat-views-sub').textContent = `${sumField(views, 'd7').toLocaleString('vi-VN')} trong 7 ngày · ${sumField(views, 'd30').toLocaleString('vi-VN')} trong 30 ngày`;
  $('stat-downloads').textContent = sumField(downloads, 'total').toLocaleString('vi-VN');
  $('stat-downloads-sub').textContent = `${sumField(downloads, 'd7').toLocaleString('vi-VN')} trong 7 ngày · ${sumField(downloads, 'd30').toLocaleString('vi-VN')} trong 30 ngày`;
  $('stat-bytes').textContent = formatBytes(estBytes);

  $('views-body').innerHTML = rowsHtml(views, (key) => `<code>${escapeHtml(key)}</code>`);
  $('downloads-body').innerHTML = rowsHtml(downloads, (key) => {
    const pkg = packages[key];
    return pkg ? `Tekla ${escapeHtml(pkg.range)} <span class="muted">(${escapeHtml(key)})</span>` : escapeHtml(key);
  }, (key, entry) => {
    const bytes = packages[key] && packages[key].bytes;
    return bytes ? formatBytes(bytes * entry.total) : '—';
  });

  const bits = [`${hits.length.toLocaleString('vi-VN')} bản ghi`];
  if (oldestTs) bits.push(`từ ${new Date(oldestTs).toLocaleDateString('vi-VN')}`);
  if (hits.length >= HIT_LIMIT) bits.push(`⚠️ đã chạm giới hạn ${HIT_LIMIT.toLocaleString('vi-VN')} bản ghi gần nhất — "Tổng" có thể chưa đủ toàn bộ lịch sử`);
  $('scope-note').textContent = bits.join(' · ');
}

function sumField(map, field) {
  let s = 0;
  for (const entry of map.values()) s += entry[field];
  return s;
}

function rowsHtml(map, keyHtml, extraCol) {
  const cols = extraCol ? 5 : 4;
  const items = [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  if (!items.length) return `<tr><td colspan="${cols}" class="muted">Chưa có dữ liệu.</td></tr>`;
  return items.map(([key, entry]) => `
    <tr>
      <td>${keyHtml(key)}</td>
      <td>${entry.total.toLocaleString('vi-VN')}</td>
      <td>${entry.d7.toLocaleString('vi-VN')}</td>
      <td>${entry.d30.toLocaleString('vi-VN')}</td>
      ${extraCol ? `<td>${extraCol(key, entry)}</td>` : ''}
    </tr>`).join('');
}

function formatBytes(n) {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wireTheme() {
  const btn = $('btn-theme');
  if (!btn || btn._wired) return;
  btn._wired = true;
  btn.onclick = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ividlab-theme', next); } catch (e) {}
  };
}
