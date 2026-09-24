// AMC Private tools — trang đọc có khoá (xem docs/amc-private/README.md).
// Đăng nhập Google → kiểm amcReaders/{email} (hoặc owner) → đọc amcPosts. Quyền thật do
// firebase/rficonsole/firestore.rules quyết định; kiểm ở đây chỉ để chọn màn hình hiển thị.
import { auth, db, googleProvider, emailKey } from "/admin/firebase.js";
import {
  onAuthStateChanged, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, query, orderBy, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const VIEWS = ['loading-view', 'login-view', 'denied-view', 'list-view', 'post-view'];
function showView(id) { VIEWS.forEach((v) => { $(v).hidden = v !== id; }); }

// Luôn hiện hộp chọn tài khoản — người dùng có nhiều Gmail hay đăng nhập nhầm tài khoản.
googleProvider.setCustomParameters({ prompt: 'select_account' });

const slug = new URLSearchParams(location.search).get('p');
let isOwnerUser = false;

function authErr(e) {
  const map = {
    'auth/popup-closed-by-user': 'Đã đóng cửa sổ đăng nhập trước khi hoàn tất.',
    'auth/cancelled-popup-request': 'Đã huỷ yêu cầu đăng nhập trước đó.',
    'auth/popup-blocked': 'Trình duyệt chặn popup — cho phép popup rồi thử lại.',
    'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối.',
  };
  return map[(e && e.code) || ''] || (e && e.message) || 'Có lỗi xảy ra.';
}

$('btn-google-login').onclick = async () => {
  $('login-err').textContent = '';
  try { await signInWithPopup(auth, googleProvider); }
  catch (err) { $('login-err').textContent = authErr(err); }
};
$('btn-denied-logout').onclick = () => signOut(auth);
$('btn-logout').onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
  $('user-chip').hidden = $('btn-logout').hidden = !user;
  if (!user) { showView('login-view'); return; }
  $('user-chip').textContent = user.email;
  const [reader, owner] = await Promise.all([isReader(user.email), isOwner(user.email)]);
  isOwnerUser = owner;
  if (!reader && !owner) {
    $('denied-email').textContent = user.email;
    showView('denied-view');
    return;
  }
  if (slug) openPost(slug); else openList();
});

async function isReader(email) {
  try { return (await getDoc(doc(db, 'amcReaders', emailKey(email)))).exists(); }
  catch (e) { return false; }
}

async function isOwner(email) {
  try {
    const snap = await getDoc(doc(db, 'config', 'owners'));
    const emails = (snap.exists() && snap.data().emails) || [];
    return emails.map((x) => (x || '').toLowerCase()).includes(emailKey(email));
  } catch (e) { return false; }
}

async function fetchPosts() {
  const snap = await getDocs(query(collection(db, 'amcPosts'), orderBy('order')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function formatDate(iso) {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? (iso || '')
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function postCard(post) {
  const a = document.createElement('a');
  a.className = 'related-card';
  a.href = `/amc-private/?p=${encodeURIComponent(post.id)}`;
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = post.tag || 'SDU';
  const h3 = document.createElement('h3');
  h3.textContent = post.title || post.id;
  const p = document.createElement('p');
  p.textContent = post.description || '';
  const date = document.createElement('span');
  date.className = 'amc-date';
  date.textContent = formatDate(post.date);
  a.append(badge, h3, p, date);
  return a;
}

async function openList() {
  showView('list-view');
  try {
    const posts = await fetchPosts();
    $('list-status').textContent = posts.length ? `${posts.length} bài viết` : 'Chưa có bài viết nào.';
    $('post-list').replaceChildren(...posts.map(postCard));
  } catch (err) {
    console.error(err);
    $('list-status').textContent = 'Không tải được danh sách bài (' + (err.code || err.message) + ').';
  }
}

async function openPost(id) {
  showView('post-view');
  const body = $('post-body');
  body.innerHTML = '<p class="amc-muted">Đang tải bài…</p>';
  let post;
  try {
    const snap = await getDoc(doc(db, 'amcPosts', id));
    if (!snap.exists()) {
      body.innerHTML = '<p>Không tìm thấy bài này. <a href="/amc-private/">Về danh sách</a></p>';
      return;
    }
    post = { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error(err);
    body.innerHTML = '<p>Không tải được bài (' + (err.code || err.message) + ').</p>';
    return;
  }
  // html do owner soạn và chỉ owner ghi được (rules) nên chèn thẳng.
  body.innerHTML = post.html || '';
  document.title = `${post.title || id} - AMC Private tools`;
  $('crumb-title').textContent = post.title || id;
  $('crumb-post').hidden = false;
  loadImages(id, body);
  loadMedia(body);
  wireDownloads(body);
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  loadOthers(id);
}

// Ảnh nằm ở amcPosts/{slug}/img/{tên file} dạng data URL (không để trong public/ vì repo public).
function loadImages(id, root) {
  root.querySelectorAll('img[data-amc-img]').forEach(async (img) => {
    const name = img.dataset.amcImg;
    const figure = img.closest('figure');
    try {
      const snap = await getDoc(doc(db, 'amcPosts', id, 'img', name));
      if (!snap.exists()) throw new Error('missing');
      img.src = snap.data().data;
      img.addEventListener('click', () => openLightbox(img.src, img.alt));
    } catch (e) {
      // Người đọc: ẩn khung ảnh chưa có. Owner: hiện rõ tên file còn thiếu để biết cần chụp/tải.
      if (!isOwnerUser) { if (figure) figure.hidden = true; else img.remove(); return; }
      const ph = document.createElement('div');
      ph.className = 'media-placeholder';
      ph.innerHTML = '<strong>📷 Chưa có ảnh</strong>';
      const code = document.createElement('code');
      code.textContent = name;
      ph.append(code);
      img.replaceWith(ph);
    }
  });
}

/* ---------- File lớn chia khúc: amcFiles/{id} + amcFiles/{id}/chunks/{000,001…} ----------
   Dùng cho GIF thao tác, bộ cài, file thiết lập. Tải qua Firestore (đi qua rules) nên chỉ người
   đọc được cấp quyền mới lấy được — không có URL công khai nào để chia sẻ ra ngoài. */
const fileCache = new Map();

function fetchMeta(fileId) {
  return getDoc(doc(db, 'amcFiles', fileId)).then((s) => (s.exists() ? s.data() : null));
}

function fetchFile(fileId) {
  if (!fileCache.has(fileId)) {
    fileCache.set(fileId, (async () => {
      const meta = await fetchMeta(fileId);
      if (!meta) throw new Error('missing');
      const snap = await getDocs(collection(db, 'amcFiles', fileId, 'chunks'));
      const parts = snap.docs.sort((a, b) => a.id.localeCompare(b.id)).map((d) => d.data().data.toUint8Array());
      if (parts.length !== meta.chunks) throw new Error('incomplete');
      return { meta, blob: new Blob(parts, { type: meta.type || 'application/octet-stream' }) };
    })());
  }
  return fileCache.get(fileId);
}

function formatSize(bytes) {
  return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

// GIF lớn: chỉ tải khi người đọc cuộn gần tới, để mở bài không phải kéo cả chục MB một lúc.
function loadMedia(root) {
  const imgs = [...root.querySelectorAll('img[data-amc-media]')];
  if (!imgs.length) return;
  const load = async (img) => {
    const figure = img.closest('figure');
    figure?.classList.add('amc-media-loading');
    try {
      const { blob } = await fetchFile(img.dataset.amcMedia);
      img.src = URL.createObjectURL(blob);
      img.addEventListener('click', () => openLightbox(img.src, img.alt));
    } catch (e) {
      if (!isOwnerUser) { if (figure) figure.hidden = true; else img.remove(); return; }
      const ph = document.createElement('div');
      ph.className = 'media-placeholder';
      ph.innerHTML = '<strong>🎞 Chưa có file</strong>';
      const code = document.createElement('code');
      code.textContent = img.dataset.amcMedia;
      ph.append(code);
      img.replaceWith(ph);
    } finally {
      figure?.classList.remove('amc-media-loading');
    }
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); load(en.target); } });
  }, { rootMargin: '400px 0px' });
  imgs.forEach((img) => io.observe(img));
}

// Nút tải: <a class="btn btn--primary" data-amc-download="<fileId>">…</a> — hiện dung lượng, bấm thì
// ghép khúc thành file rồi cho trình duyệt lưu với tên gốc.
function wireDownloads(root) {
  root.querySelectorAll('[data-amc-download]').forEach(async (btn) => {
    const fileId = btn.dataset.amcDownload;
    const label = btn.innerHTML;
    btn.setAttribute('href', '#');
    let meta = null;
    try { meta = await fetchMeta(fileId); } catch (e) { /* xử lý bên dưới */ }
    if (!meta) {
      if (!isOwnerUser) { btn.hidden = true; return; }
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = '⚠ Chưa có file ' + fileId;
      return;
    }
    const size = document.createElement('span');
    size.className = 'amc-size';
    size.textContent = ` (${formatSize(meta.size)})`;
    btn.append(size);
    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      if (btn.dataset.busy) return;
      btn.dataset.busy = '1';
      btn.textContent = 'Đang tải…';
      try {
        const { blob } = await fetchFile(fileId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = meta.name || fileId;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (e) {
        alert('Không tải được file (' + (e.code || e.message) + ').');
      } finally {
        btn.innerHTML = label;
        btn.append(size);
        delete btn.dataset.busy;
      }
    });
  });
}

function openLightbox(src, alt) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  const im = document.createElement('img');
  im.src = src;
  im.alt = alt || '';
  box.append(im);
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
  box.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.append(box);
}

async function loadOthers(id) {
  try {
    const others = (await fetchPosts()).filter((p) => p.id !== id);
    if (!others.length) return;
    $('post-others-list').replaceChildren(...others.map(postCard));
    $('post-others').hidden = false;
  } catch (e) { /* phần phụ, bỏ qua */ }
}
