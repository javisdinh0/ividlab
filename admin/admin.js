// Trang Admin — Kiểm soát lưu lượng truy cập. Đọc trafficHits do public/traffic-track.js
// ghi (mọi khách, không đăng nhập) và tổng hợp lại; chỉ owner (config/owners) xem được.
import { auth, db, googleProvider, emailKey } from "./firebase.js";
import {
  onAuthStateChanged, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, query, where, orderBy, limit, getDocs, doc, getDoc
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
  $('period').onchange = () => { if (cache) render(cache); };
  wireTheme();
  loadData();
}

let cache = null; // { views, downloads, packages } — đổi khoảng thời gian chỉ tính lại, không đọc lại Firestore

async function loadData() {
  $('scope-note').textContent = 'Đang tải…';
  try {
    const [views, downloads, packages] = await Promise.all([fetchViews(), fetchDownloads(), fetchPackages()]);
    cache = { views, downloads, packages };
    render(cache);
  } catch (e) {
    console.error(e);
    $('scope-note').textContent = 'Lỗi tải dữ liệu: ' + (e.message || e.code);
    toast('Không tải được dữ liệu traffic: ' + (e.message || e.code), 'err');
  }
}

const toHit = (d) => {
  const x = d.data();
  const t = x.ts && typeof x.ts.toMillis === 'function' ? x.ts.toMillis() : null;
  return t == null ? null : { t, type: x.type, path: x.path || '', country: typeof x.country === 'string' ? x.country : '' };
};

// Lượt xem: HIT_LIMIT bản ghi gần nhất. Chỉ orderBy (không where) để khỏi cần chỉ mục kép; lượt tải lẫn trong đó được lọc ra ở client.
async function fetchViews() {
  const q = query(collection(db, 'trafficHits'), orderBy('ts', 'desc'), limit(HIT_LIMIT));
  const res = await getDocs(q);
  return { hits: res.docs.map(toHit).filter((h) => h && h.type !== 'download'), truncated: res.size >= HIT_LIMIT };
}

// Lượt tải: lấy riêng (chỉ lọc bằng ==, không cần chỉ mục kép) để lượt xem không đẩy lượt tải cũ ra khỏi giới hạn.
async function fetchDownloads() {
  const q = query(collection(db, 'trafficHits'), where('type', '==', 'download'), limit(HIT_LIMIT));
  const res = await getDocs(q);
  return { hits: res.docs.map(toHit).filter(Boolean), truncated: res.size >= HIT_LIMIT };
}

// Gói tải của mọi sản phẩm: mỗi downloads.json khai `packages`; khoá gói trùng khoá gửi lên khi bấm Tải.
const DOWNLOAD_MANIFESTS = [
  { url: '/tekla/peb-member/downloads.json', product: 'PEB Member' },
  { url: '/tekla/component/downloads-2v-cross.json', product: '2V Cross Anti-Sag' }
];

async function fetchPackages() {
  const merged = {};
  await Promise.all(DOWNLOAD_MANIFESTS.map(async ({ url, product }) => {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();
      for (const [key, pkg] of Object.entries(data.packages || {})) merged[key] = { ...pkg, product, version: data.version };
    } catch (e) { /* bỏ qua manifest lỗi */ }
  }));
  return merged;
}

/* ---------- Tính toán ---------- */

const VN_OFFSET = 7 * 3600000; // ngày tính theo giờ Việt Nam
const dayIndex = (t) => Math.floor((t + VN_OFFSET) / DAY_MS);
const dayLabel = (idx) => {
  const d = new Date(idx * DAY_MS);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const fmt = (n) => Math.round(n).toLocaleString('vi-VN');
const pct = (part, whole) => (whole ? `${(part / whole * 100).toFixed(1).replace('.', ',')}%` : '—');
const pkgKey = (hit) => hit.path.replace(/^\/download\//, '');

const regionNames = (() => { try { return new Intl.DisplayNames(['vi'], { type: 'region' }); } catch (e) { return null; } })();
const countryName = (cc) => { try { return (regionNames && regionNames.of(cc)) || cc; } catch (e) { return cc; } };
const flag = (cc) => /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : '🌐';

function inRange(hits, from, to) { return hits.filter((h) => h.t >= from && h.t < to); }

function countBy(hits, keyFn) {
  const m = new Map();
  for (const h of hits) { const k = keyFn(h); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}

function render({ views, downloads, packages }) {
  const now = Date.now();
  const periodDays = $('period').value === 'all' ? null : Number($('period').value);
  const allDl = downloads.hits;
  const from = periodDays ? now - periodDays * DAY_MS : 0;
  const dl = inRange(allDl, from, now + 1);
  const vw = inRange(views.hits, from, now + 1);
  const prev = periodDays ? inRange(allDl, from - periodDays * DAY_MS, from) : null;

  /* Thẻ tổng quan */
  $('k-dl').textContent = fmt(dl.length);
  $('k-dl-sub').innerHTML = deltaHtml(dl.length, prev && prev.length, periodDays);
  const articleViews = vw.filter((h) => h.path.startsWith('/tekla/')).length;
  $('k-views').textContent = fmt(vw.length);
  $('k-views-sub').textContent = `${fmt(articleViews)} lượt vào bài Tekla`;
  $('k-conv').textContent = articleViews ? pct(dl.length, articleViews) : '—';
  let bytes = 0;
  for (const h of dl) { const b = packages[pkgKey(h)] && packages[pkgKey(h)].bytes; if (b) bytes += b; }
  $('k-bytes').textContent = formatBytes(bytes);
  const known = dl.filter((h) => /^[A-Z]{2}$/.test(h.country));
  const byCountry = countBy(known, (h) => h.country);
  $('k-countries').textContent = String(byCountry.size);
  const top = [...byCountry.entries()].sort((a, b) => b[1] - a[1])[0];
  $('k-countries-sub').textContent = top ? `nhiều nhất: ${countryName(top[0])} (${pct(top[1], known.length)})` : 'chưa có dữ liệu quốc gia';

  renderChart(dl, periodDays, allDl);
  renderProducts(dl, allDl, packages, now);
  renderCountries(dl, known, byCountry);
  renderViews(vw);

  const bits = [`${fmt(allDl.length)} lượt tải · ${fmt(views.hits.length)} lượt xem trong dữ liệu`];
  const oldest = Math.min(...allDl.map((h) => h.t), ...views.hits.map((h) => h.t));
  if (Number.isFinite(oldest)) bits.push(`từ ${new Date(oldest).toLocaleDateString('vi-VN')}`);
  if (downloads.truncated) bits.push(`⚠️ lượt tải đã chạm giới hạn ${fmt(HIT_LIMIT)} bản ghi`);
  if (views.truncated) bits.push(`⚠️ lượt xem chỉ tính ${fmt(HIT_LIMIT)} bản ghi gần nhất (kỳ dài có thể thiếu)`);
  $('scope-note').textContent = bits.join(' · ');
}

function deltaHtml(cur, prev, periodDays) {
  if (prev == null) return 'toàn bộ lịch sử';
  if (!prev) return cur ? `${periodDays} ngày trước đó: 0 → mới phát sinh` : `${periodDays} ngày gần nhất`;
  const d = (cur - prev) / prev * 100;
  const cls = d > 0 ? 'up' : d < 0 ? 'down' : '';
  const sign = d > 0 ? '▲ +' : d < 0 ? '▼ ' : '';
  return `<span class="delta ${cls}">${sign}${d.toFixed(0)}%</span> so với ${periodDays} ngày trước đó (${fmt(prev)})`;
}

/* ---------- Biểu đồ theo ngày/tuần (SVG thuần) ---------- */

function renderChart(dl, periodDays, allDl) {
  const box = $('chart');
  const today = dayIndex(Date.now());
  const firstDl = allDl.length ? dayIndex(Math.min(...allDl.map((h) => h.t))) : today;
  const span = periodDays || Math.max(1, today - firstDl + 1);
  const start = today - span + 1;
  const binDays = span > 120 ? 7 : 1;
  const nBins = Math.ceil(span / binDays);
  const bins = new Array(nBins).fill(0);
  for (const h of dl) {
    const i = Math.floor((dayIndex(h.t) - start) / binDays);
    if (i >= 0 && i < nBins) bins[i]++;
  }
  const max = Math.max(1, ...bins);
  const W = 760, H = 230, L = 38, R = 8, T = 12, B = 30;
  const bw = (W - L - R) / nBins;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  // trung bình trượt 7 ngày (khi mỗi cột là 1 ngày) làm rõ xu hướng
  let line = '';
  if (binDays === 1 && nBins >= 7) {
    const pts = bins.map((_, i) => {
      const win = bins.slice(Math.max(0, i - 6), i + 1);
      return `${(L + bw * (i + 0.5)).toFixed(1)},${y(win.reduce((a, b) => a + b, 0) / win.length).toFixed(1)}`;
    });
    line = `<polyline class="ma" points="${pts.join(' ')}" fill="none"/>`;
  }
  const bars = bins.map((v, i) => {
    const x = L + bw * i, h = (H - T - B) * (v / max);
    const label = binDays === 1 ? dayLabel(start + i) : `${dayLabel(start + i * binDays)}–${dayLabel(Math.min(today, start + (i + 1) * binDays - 1))}`;
    return `<g><title>${label}: ${v} lượt tải</title><rect class="bar" x="${(x + bw * 0.12).toFixed(1)}" y="${(H - B - h).toFixed(1)}" width="${(bw * 0.76).toFixed(1)}" height="${Math.max(h, v ? 1 : 0).toFixed(1)}" rx="1.5"/></g>`;
  }).join('');
  const ticks = [0, 0.5, 1].map((f) => {
    const v = Math.round(max * f);
    return `<g><line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text></g>`;
  }).join('');
  const labelEvery = Math.max(1, Math.ceil(nBins / 10));
  const xl = bins.map((_, i) => i % labelEvery ? '' :
    `<text class="axis" x="${(L + bw * (i + 0.5)).toFixed(1)}" y="${H - 10}" text-anchor="middle">${dayLabel(start + i * binDays)}</text>`).join('');
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lượt tải theo ${binDays === 1 ? 'ngày' : 'tuần'}">${ticks}${bars}${line}${xl}</svg>`;
  $('chart-note').textContent = `Mỗi cột = ${binDays === 1 ? '1 ngày' : '1 tuần'} (giờ Việt Nam)${line ? '; đường cam = trung bình trượt 7 ngày' : ''}. Tổng ${fmt(dl.length)} lượt trong kỳ.`;
}

/* ---------- Bảng theo sản phẩm / gói ---------- */

function renderProducts(dl, allDl, packages, now) {
  const rows = new Map(); // khoá gói -> số liệu
  const add = (h, field) => {
    const k = pkgKey(h);
    const r = rows.get(k) || { period: 0, total: 0, d7: 0, d30: 0 };
    r[field]++;
    rows.set(k, r);
  };
  for (const h of allDl) {
    add(h, 'total');
    if (h.t >= now - 7 * DAY_MS) add(h, 'd7');
    if (h.t >= now - 30 * DAY_MS) add(h, 'd30');
  }
  for (const h of dl) add(h, 'period');
  const items = [...rows.entries()].sort((a, b) => b[1].period - a[1].period || b[1].total - a[1].total);
  const sum = dl.length;
  $('products-body').innerHTML = items.length ? items.map(([k, r]) => {
    const pkg = packages[k];
    const name = pkg ? `${escapeHtml(pkg.product)} <span class="muted">· Tekla ${escapeHtml(pkg.range)}</span>` : escapeHtml(k);
    return `<tr>
      <td>${name}<div class="muted small"><code>${escapeHtml(k)}</code>${pkg ? ` · v${escapeHtml(pkg.version)}` : ''}</div></td>
      <td class="num"><strong>${fmt(r.period)}</strong></td>
      <td class="share">${barHtml(r.period, sum)}</td>
      <td class="num">${fmt(r.d7)}</td><td class="num">${fmt(r.d30)}</td><td class="num">${fmt(r.total)}</td>
      <td class="num">${pkg && pkg.bytes ? formatBytes(pkg.bytes * r.period) : '—'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="muted">Chưa có lượt tải nào.</td></tr>`;
}

function barHtml(part, whole) {
  const w = whole ? (part / whole * 100) : 0;
  return `<div class="bar-cell"><div class="bar-fill" style="width:${w.toFixed(1)}%"></div><span>${pct(part, whole)}</span></div>`;
}

/* ---------- Bảng theo quốc gia ---------- */

function renderCountries(dl, known, byCountry) {
  const last = new Map();
  for (const h of known) last.set(h.country, Math.max(last.get(h.country) || 0, h.t));
  const items = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);
  const unknown = dl.length - known.length;
  $('countries-body').innerHTML = items.length ? items.map(([cc, n], i) => `<tr>
      <td class="num">${i + 1}</td>
      <td>${flag(cc)} ${escapeHtml(countryName(cc))} <span class="muted small"><code>${cc}</code></span></td>
      <td class="num"><strong>${fmt(n)}</strong></td>
      <td class="share">${barHtml(n, known.length)}</td>
      <td class="num">${new Date(last.get(cc)).toLocaleDateString('vi-VN')}</td>
    </tr>`).join('') : `<tr><td colspan="5" class="muted">Chưa có lượt tải nào kèm quốc gia (chỉ ghi từ khi bật tính năng này).</td></tr>`;
  $('country-note').textContent = dl.length
    ? `Độ phủ: ${fmt(known.length)}/${fmt(dl.length)} lượt tải trong kỳ có quốc gia (${pct(known.length, dl.length)}); ${fmt(unknown)} lượt chưa rõ (ghi trước khi có tính năng, hoặc không lấy được). Tỷ trọng tính trên các lượt đã biết quốc gia.`
    : 'Chưa có lượt tải trong kỳ.';
}

/* ---------- Lượt xem theo trang ---------- */

function renderViews(vw) {
  const items = [...countBy(vw, (h) => h.path || '(không rõ)').entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  $('views-body').innerHTML = items.length ? items.map(([k, n]) =>
    `<tr><td><code>${escapeHtml(k)}</code></td><td class="num">${fmt(n)}</td><td class="share">${barHtml(n, vw.length)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="muted">Chưa có dữ liệu.</td></tr>`;
}

function formatBytes(n) {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
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
