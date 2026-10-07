// Trang Admin — Kiểm soát lưu lượng truy cập. Đọc trafficHits do public/traffic-track.js
// ghi (mọi khách, không đăng nhập) và tổng hợp lại; chỉ owner (config/owners) xem được.
import { auth, db, googleProvider, emailKey } from "./firebase.js";
import {
  onAuthStateChanged, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, query, where, orderBy, limit, getDocs, onSnapshot, doc, getDoc
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
  startLive();
}

let cache = null; // { views, downloads, reads, packages } — đổi khoảng thời gian chỉ tính lại, không đọc lại Firestore

async function loadData() {
  $('scope-note').textContent = 'Đang tải…';
  try {
    const [views, downloads, reads, packages] = await Promise.all([fetchViews(), fetchDownloads(), fetchReads(), fetchPackages()]);
    cache = { views, downloads, reads, packages };
    render(cache);
  } catch (e) {
    console.error(e);
    $('scope-note').textContent = 'Lỗi tải dữ liệu: ' + (e.message || e.code);
    toast('Không tải được dữ liệu traffic: ' + (e.message || e.code), 'err');
  }
}

const toTs = (x) => (x.ts && typeof x.ts.toMillis === 'function' ? x.ts.toMillis() : null);
const toHit = (d) => {
  const x = d.data();
  const t = toTs(x);
  return t == null ? null : { t, type: x.type, path: x.path || '', country: typeof x.country === 'string' ? x.country : '', sid: typeof x.sid === 'string' ? x.sid : '' };
};
const toRead = (d) => {
  const x = d.data();
  const t = toTs(x);
  return t == null ? null : { t, path: x.path || '', sid: x.sid || '', secs: Number(x.secs) || 0 };
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

// Mốc thời gian đọc (collection riêng, mỗi lượt xem tối đa 4 mốc). Lỗi (rules chưa cập nhật…) thì coi như chưa có dữ liệu.
async function fetchReads() {
  try {
    const q = query(collection(db, 'trafficReads'), orderBy('ts', 'desc'), limit(HIT_LIMIT));
    const res = await getDocs(q);
    return { hits: res.docs.map(toRead).filter(Boolean), truncated: res.size >= HIT_LIMIT, ok: true };
  } catch (e) {
    console.warn('trafficReads:', e);
    return { hits: [], truncated: false, ok: false };
  }
}

// Gói tải của mọi sản phẩm: mỗi downloads.json khai `packages`; khoá gói trùng khoá gửi lên khi bấm Tải.
const DOWNLOAD_MANIFESTS = [
  { url: '/tekla/peb-member/downloads.json', product: 'PEB Member' },
  { url: '/tekla/component/downloads-2v-cross.json', product: '2V Cross Anti-Sag' },
  { url: '/tekla/component/downloads-tube-round-connect.json', product: 'Tube Round Connect' },
  { url: '/tekla/component/downloads-bolt-quick-dim.json', product: 'Bolt Quick Dim' },
  { url: '/autocad/downloads-xbc.json', product: 'XBC Explode Clipped Block' }
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

/* ---------- Tiện ích ---------- */

const VN_OFFSET = 7 * 3600000; // ngày tính theo giờ Việt Nam
const dayIndex = (t) => Math.floor((t + VN_OFFSET) / DAY_MS);
const dayLabel = (idx) => {
  const d = new Date(idx * DAY_MS);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const fmt = (n) => Math.round(n).toLocaleString('vi-VN');
const pct = (part, whole) => (whole ? `${(part / whole * 100).toFixed(1).replace('.', ',')}%` : '—');
const pkgKey = (hit) => hit.path.replace(/^\/download\//, '');
const isCC = (cc) => /^[A-Z]{2}$/.test(cc);

const regionNames = (() => { try { return new Intl.DisplayNames(['vi'], { type: 'region' }); } catch (e) { return null; } })();
const countryName = (cc) => { try { return (regionNames && regionNames.of(cc)) || cc; } catch (e) { return cc; } };
const flag = (cc) => isCC(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : '🌐';
const durText = (s) => (s < 60 ? `${Math.round(s)} giây` : `${Math.floor(s / 60)} phút${Math.round(s % 60) ? ` ${Math.round(s % 60)} giây` : ''}`);

function inRange(hits, from, to) { return hits.filter((h) => h.t >= from && h.t < to); }

function countBy(hits, keyFn) {
  const m = new Map();
  for (const h of hits) { const k = keyFn(h); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}

function deltaHtml(cur, prev, periodDays) {
  if (prev == null) return 'toàn bộ lịch sử';
  if (!prev) return cur ? `${periodDays} ngày trước đó: 0 → mới phát sinh` : `${periodDays} ngày gần nhất`;
  const d = (cur - prev) / prev * 100;
  const cls = d > 0 ? 'up' : d < 0 ? 'down' : '';
  const sign = d > 0 ? '▲ +' : d < 0 ? '▼ ' : '';
  return `<span class="delta ${cls}">${sign}${d.toFixed(0)}%</span> so với ${periodDays} ngày trước đó (${fmt(prev)})`;
}

function barHtml(part, whole) {
  const w = whole ? (part / whole * 100) : 0;
  return `<div class="bar-cell"><div class="bar-fill" style="width:${w.toFixed(1)}%"></div><span>${pct(part, whole)}</span></div>`;
}

/* ---------- Thời gian thực (onSnapshot) ---------- */

const live = { hits: [], reads: [], started: false };
const READ_BUCKETS = [
  { min: 0, label: 'Dưới 15 giây', mid: 7 },
  { min: 15, label: '15 – 45 giây', mid: 30 },
  { min: 45, label: '45 giây – 2 phút', mid: 80 },
  { min: 120, label: '2 – 5 phút', mid: 210 },
  { min: 300, label: 'Từ 5 phút', mid: 300 }
];

function startLive() {
  if (live.started) return;
  live.started = true;
  const onErr = (e) => { console.warn('live:', e); $('live-status').textContent = 'mất kết nối'; };
  onSnapshot(query(collection(db, 'trafficHits'), orderBy('ts', 'desc'), limit(300)),
    (snap) => { live.hits = snap.docs.map(toHit).filter(Boolean); renderLive(); }, onErr);
  onSnapshot(query(collection(db, 'trafficReads'), orderBy('ts', 'desc'), limit(300)),
    (snap) => { live.reads = snap.docs.map(toRead).filter(Boolean); renderLive(); }, () => { /* chưa có quyền/collection: bỏ qua */ });
  setInterval(renderLive, 30000); // làm tươi "x phút trước" và cửa sổ trực tuyến
}

function ago(t, now) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return `${s} giây trước`;
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  return `${Math.floor(s / 3600)} giờ trước`;
}

function renderLive() {
  const now = Date.now();
  const WINDOW = 5 * 60000;
  // "Đang trực tuyến" = số mã phiên (sid) có hoạt động (mở trang hoặc mốc đọc) trong 5 phút; lượt xem cũ không có sid tính mỗi lượt là 1.
  const active = new Set();
  let noSid = 0;
  for (const h of live.hits) {
    if (h.type === 'download' || now - h.t > WINDOW) continue;
    if (h.sid) active.add(h.sid); else noSid++;
  }
  for (const r of live.reads) if (now - r.t <= WINDOW && r.sid) active.add(r.sid);
  $('live-online').textContent = String(active.size + noSid);
  $('live-status').textContent = 'đang cập nhật trực tiếp';

  const views = live.hits.filter((h) => h.type !== 'download');
  $('live-30m').textContent = String(views.filter((h) => now - h.t <= 30 * 60000).length);
  const todayIdx = dayIndex(now);
  $('live-today').textContent = String(views.filter((h) => dayIndex(h.t) === todayIdx).length) + (views.length >= 300 && live.hits.length >= 300 && dayIndex(live.hits[live.hits.length - 1].t) === todayIdx ? '+' : '');

  // cột theo phút, 30 phút gần nhất
  const bins = new Array(30).fill(0);
  for (const h of views) {
    const i = 29 - Math.floor((now - h.t) / 60000);
    if (i >= 0 && i < 30) bins[i]++;
  }
  const max = Math.max(1, ...bins);
  const W = 420, H = 70, bw = W / 30;
  $('live-chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lượt xem theo phút, 30 phút gần nhất">${bins.map((v, i) => {
    const h = (H - 6) * (v / max);
    return `<g><title>${30 - i - 1 === 0 ? 'phút này' : `${29 - i} phút trước`}: ${v} lượt xem</title><rect class="bar" x="${(i * bw + 1).toFixed(1)}" y="${(H - 3 - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${Math.max(h, v ? 2 : 0).toFixed(1)}" rx="1.5"/></g>`;
  }).join('')}</svg>`;

  // dòng sự kiện gần nhất
  const feed = live.hits.slice(0, 12);
  $('live-feed').innerHTML = feed.length ? feed.map((h) => `<li>
      <span class="feed-time">${ago(h.t, now)}</span>
      <span class="pill ${h.type === 'download' ? 'pill-dl' : ''}">${h.type === 'download' ? 'TẢI' : 'XEM'}</span>
      <span class="feed-cc">${h.country ? `${flag(h.country)} ${h.country}` : '—'}</span>
      <code>${escapeHtml(h.path)}</code></li>`).join('') : '<li class="muted">Chưa có hoạt động.</li>';
}

/* ---------- Tính toán chính ---------- */

function render({ views, downloads, reads, packages }) {
  const now = Date.now();
  const periodDays = $('period').value === 'all' ? null : Number($('period').value);
  const from = periodDays ? now - periodDays * DAY_MS : 0;

  renderViewsSection(views, reads, periodDays, from, now);
  renderDownloadsSection(downloads, views, packages, periodDays, from, now);

  const bits = [`${fmt(downloads.hits.length)} lượt tải · ${fmt(views.hits.length)} lượt xem trong dữ liệu`];
  const oldest = Math.min(...downloads.hits.map((h) => h.t), ...views.hits.map((h) => h.t));
  if (Number.isFinite(oldest)) bits.push(`từ ${new Date(oldest).toLocaleDateString('vi-VN')}`);
  if (downloads.truncated) bits.push(`⚠️ lượt tải đã chạm giới hạn ${fmt(HIT_LIMIT)} bản ghi`);
  if (views.truncated) bits.push(`⚠️ lượt xem chỉ tính ${fmt(HIT_LIMIT)} bản ghi gần nhất (kỳ dài có thể thiếu)`);
  $('scope-note').textContent = bits.join(' · ');
}

/* ----- Phần LƯỢT XEM ----- */

function renderViewsSection(views, reads, periodDays, from, now) {
  const all = views.hits;
  const vw = inRange(all, from, now + 1);
  const prev = periodDays ? inRange(all, from - periodDays * DAY_MS, from) : null;

  $('v-views').textContent = fmt(vw.length);
  $('v-views-sub').innerHTML = deltaHtml(vw.length, prev && prev.length, periodDays);

  const known = vw.filter((h) => isCC(h.country));
  const byCountry = countBy(known, (h) => h.country);
  $('v-countries').textContent = String(byCountry.size);
  const top = [...byCountry.entries()].sort((a, b) => b[1] - a[1])[0];
  $('v-countries-sub').textContent = top ? `nhiều nhất: ${countryName(top[0])} (${pct(top[1], known.length)})` : 'chưa có dữ liệu quốc gia';

  renderChart('vchart', 'vchart-note', vw, periodDays, all, 'lượt xem');
  renderCountryTable('vcountries-body', 'vcountry-note', vw, known, byCountry, 'lượt xem');
  renderReading(vw, reads, now);
  renderViewsByPage(vw);
}

// Thời gian đọc: ghép lượt xem (có sid) với mốc đọc cao nhất cùng sid. Lượt xem trong 5 phút gần nhất chưa đủ thời gian đạt mốc nên bị loại.
function renderReading(vw, reads, now) {
  const maxSecs = new Map();
  for (const r of reads.hits) if ((maxSecs.get(r.sid) || 0) < r.secs) maxSecs.set(r.sid, r.secs);
  const eligible = vw.filter((h) => h.sid && now - h.t > 5 * 60000);
  const bucketOf = (secs) => { let b = 0; READ_BUCKETS.forEach((x, i) => { if (secs >= x.min) b = i; }); return b; };
  const counts = new Array(READ_BUCKETS.length).fill(0);
  const byPage = new Map();
  let sumMid = 0, deep = 0;
  for (const h of eligible) {
    const b = bucketOf(maxSecs.get(h.sid) || 0);
    counts[b]++;
    sumMid += READ_BUCKETS[b].mid;
    if (b >= 2) deep++;
    const p = byPage.get(h.path) || { n: 0, mid: 0, deep: 0 };
    p.n++; p.mid += READ_BUCKETS[b].mid; if (b >= 2) p.deep++;
    byPage.set(h.path, p);
  }
  const n = eligible.length;
  $('v-read').textContent = n ? durText(sumMid / n) : '—';
  $('v-read-sub').textContent = n ? `ước tính trên ${fmt(n)} lượt xem có theo dõi` : (reads.ok ? 'chưa có dữ liệu thời gian đọc' : 'chưa đọc được dữ liệu (kiểm tra rules)');
  $('v-deep').textContent = n ? pct(deep, n) : '—';

  $('read-buckets').innerHTML = n ? READ_BUCKETS.map((b, i) => `<div class="hbar-row">
      <span class="hbar-label">${b.label}</span>
      <div class="bar-cell"><div class="bar-fill" style="width:${(counts[i] / n * 100).toFixed(1)}%"></div><span>${fmt(counts[i])} · ${pct(counts[i], n)}</span></div>
    </div>`).join('') : '<p class="muted">Chưa có dữ liệu.</p>';

  const items = [...byPage.entries()].filter(([, p]) => p.n >= 2).sort((a, b) => b[1].n - a[1].n).slice(0, 15);
  $('read-body').innerHTML = items.length ? items.map(([path, p]) => `<tr>
      <td><code>${escapeHtml(path)}</code></td>
      <td class="num">${fmt(p.n)}</td>
      <td class="num">${durText(p.mid / p.n)}</td>
      <td class="num">${pct(p.deep, p.n)}</td></tr>`).join('') : '<tr><td colspan="4" class="muted">Chưa đủ dữ liệu (cần ≥ 2 lượt xem mỗi trang).</td></tr>';
}

function renderViewsByPage(vw) {
  const items = [...countBy(vw, (h) => h.path || '(không rõ)').entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  $('views-body').innerHTML = items.length ? items.map(([k, n]) =>
    `<tr><td><code>${escapeHtml(k)}</code></td><td class="num">${fmt(n)}</td><td class="share">${barHtml(n, vw.length)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="muted">Chưa có dữ liệu.</td></tr>`;
}

/* ----- Phần LƯỢT TẢI ----- */

function renderDownloadsSection(downloads, views, packages, periodDays, from, now) {
  const allDl = downloads.hits;
  const dl = inRange(allDl, from, now + 1);
  const prev = periodDays ? inRange(allDl, from - periodDays * DAY_MS, from) : null;

  $('k-dl').textContent = fmt(dl.length);
  $('k-dl-sub').innerHTML = deltaHtml(dl.length, prev && prev.length, periodDays);
  const articleViews = inRange(views.hits, from, now + 1).filter((h) => h.path.startsWith('/tekla/')).length;
  $('k-conv').textContent = articleViews ? pct(dl.length, articleViews) : '—';
  $('k-conv-sub').textContent = `${fmt(dl.length)} lượt tải ÷ ${fmt(articleViews)} lượt xem trang /tekla/ (xấp xỉ, không phải tỷ lệ theo người)`;
  let bytes = 0;
  for (const h of dl) { const b = packages[pkgKey(h)] && packages[pkgKey(h)].bytes; if (b) bytes += b; }
  $('k-bytes').textContent = formatBytes(bytes);
  const known = dl.filter((h) => isCC(h.country));
  const byCountry = countBy(known, (h) => h.country);
  $('k-countries').textContent = String(byCountry.size);
  const top = [...byCountry.entries()].sort((a, b) => b[1] - a[1])[0];
  $('k-countries-sub').textContent = top ? `nhiều nhất: ${countryName(top[0])} (${pct(top[1], known.length)})` : 'chưa có dữ liệu quốc gia';

  renderChart('chart', 'chart-note', dl, periodDays, allDl, 'lượt tải');
  renderProducts(dl, allDl, packages, now);
  renderCountryTable('countries-body', 'country-note', dl, known, byCountry, 'lượt tải');
}

/* ---------- Biểu đồ theo ngày/tuần (SVG thuần) ---------- */

function renderChart(boxId, noteId, hitsInPeriod, periodDays, allHits, unit) {
  const box = $(boxId);
  const today = dayIndex(Date.now());
  const first = allHits.length ? dayIndex(Math.min(...allHits.map((h) => h.t))) : today;
  const span = periodDays || Math.max(1, today - first + 1);
  const start = today - span + 1;
  const binDays = span > 120 ? 7 : 1;
  const nBins = Math.ceil(span / binDays);
  const bins = new Array(nBins).fill(0);
  for (const h of hitsInPeriod) {
    const i = Math.floor((dayIndex(h.t) - start) / binDays);
    if (i >= 0 && i < nBins) bins[i]++;
  }
  const max = Math.max(1, ...bins);
  const W = 760, H = 230, L = 38, R = 8, T = 12, B = 30;
  const bw = (W - L - R) / nBins;
  const y = (v) => T + (H - T - B) * (1 - v / max);
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
    return `<g><title>${label}: ${v} ${unit}</title><rect class="bar" x="${(x + bw * 0.12).toFixed(1)}" y="${(H - B - h).toFixed(1)}" width="${(bw * 0.76).toFixed(1)}" height="${Math.max(h, v ? 1 : 0).toFixed(1)}" rx="1.5"/></g>`;
  }).join('');
  const ticks = [0, 0.5, 1].map((f) => {
    const v = Math.round(max * f);
    return `<g><line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text></g>`;
  }).join('');
  const labelEvery = Math.max(1, Math.ceil(nBins / 10));
  const xl = bins.map((_, i) => i % labelEvery ? '' :
    `<text class="axis" x="${(L + bw * (i + 0.5)).toFixed(1)}" y="${H - 10}" text-anchor="middle">${dayLabel(start + i * binDays)}</text>`).join('');
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${unit} theo ${binDays === 1 ? 'ngày' : 'tuần'}">${ticks}${bars}${line}${xl}</svg>`;
  $(noteId).textContent = `Mỗi cột = ${binDays === 1 ? '1 ngày' : '1 tuần'} (giờ Việt Nam)${line ? '; đường cam = trung bình trượt 7 ngày' : ''}. Tổng ${fmt(hitsInPeriod.length)} ${unit} trong kỳ.`;
}

/* ---------- Bảng theo sản phẩm / gói ---------- */

function renderProducts(dl, allDl, packages, now) {
  const rows = new Map();
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

/* ---------- Bảng quốc gia (dùng chung cho lượt xem và lượt tải) ---------- */

function renderCountryTable(bodyId, noteId, hits, known, byCountry, unit) {
  const last = new Map();
  for (const h of known) last.set(h.country, Math.max(last.get(h.country) || 0, h.t));
  const items = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  const unknown = hits.length - known.length;
  $(bodyId).innerHTML = items.length ? items.map(([cc, n], i) => `<tr>
      <td class="num">${i + 1}</td>
      <td>${flag(cc)} ${escapeHtml(countryName(cc))} <span class="muted small"><code>${cc}</code></span></td>
      <td class="num"><strong>${fmt(n)}</strong></td>
      <td class="share">${barHtml(n, known.length)}</td>
      <td class="num">${new Date(last.get(cc)).toLocaleDateString('vi-VN')}</td>
    </tr>`).join('') : `<tr><td colspan="5" class="muted">Chưa có ${unit} nào kèm quốc gia (chỉ ghi từ khi bật tính năng này).</td></tr>`;
  $(noteId).textContent = hits.length
    ? `Độ phủ: ${fmt(known.length)}/${fmt(hits.length)} ${unit} trong kỳ có quốc gia (${pct(known.length, hits.length)}); ${fmt(unknown)} chưa rõ (ghi trước khi có tính năng, hoặc không lấy được). Tỷ trọng tính trên các lượt đã biết quốc gia.`
    : `Chưa có ${unit} trong kỳ.`;
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
