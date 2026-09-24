// Quản trị chuyên mục AMC Private tools (owner-only): danh sách người đọc + tải bài/ảnh lên Firestore.
// Nguồn bài KHÔNG nằm trong repo web (repo public) mà trong repo SDU private — xem docs/amc-private/README.md.
import { auth, db, googleProvider, emailKey } from "./firebase.js";
import {
  onAuthStateChanged, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
const VIEWS = ['loading-view', 'login-view', 'denied-view', 'admin-view'];
function showView(id) { VIEWS.forEach(v => show($(v), v === id)); }

// Firestore giới hạn 1 MiB / document (tính cả tên trường) -> chuỗi data URL giữ dưới mức này.
const IMG_LIMIT = 1000000;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}$/;

function toast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show ' + (type || '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = t.className.replace('show', '').trim(); }, 3400);
}

$('btn-google-login').onclick = async () => {
  $('login-err').textContent = '';
  try { await signInWithPopup(auth, googleProvider); }
  catch (err) { $('login-err').textContent = (err && err.message) || 'Có lỗi xảy ra.'; }
};
$('btn-denied-logout').onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
  if (!user) { showView('login-view'); return; }
  if (!(await isOwner(user.email))) { showView('denied-view'); return; }
  showView('admin-view');
  $('user-chip').textContent = user.email;
  $('btn-logout').onclick = () => signOut(auth);
  $('btn-theme').onclick = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ividlab-theme', next); } catch (e) {}
  };
  $('btn-add-readers').onclick = addReaders;
  $('src-folder').onchange = () => { $('btn-upload').disabled = !$('src-folder').files.length; };
  $('btn-upload').onclick = uploadFolder;
  loadReaders();
  loadPosts();
});

async function isOwner(email) {
  try {
    const snap = await getDoc(doc(db, 'config', 'owners'));
    const emails = (snap.exists() && snap.data().emails) || [];
    return emails.map(x => (x || '').toLowerCase()).includes(emailKey(email));
  } catch (e) { return false; }
}

function cell(text) { const td = document.createElement('td'); td.textContent = text ?? ''; return td; }
function delButton(label, onClick) {
  const td = document.createElement('td');
  const b = document.createElement('button');
  b.className = 'btn btn-ghost btn-sm';
  b.textContent = label;
  b.onclick = onClick;
  td.append(b);
  return td;
}

/* ---------- Người đọc ---------- */
async function loadReaders() {
  const snap = await getDocs(collection(db, 'amcReaders'));
  const rows = snap.docs.map(d => d.data()).sort((a, b) => a.email.localeCompare(b.email));
  $('readers-body').replaceChildren(...rows.map((r) => {
    const tr = document.createElement('tr');
    tr.append(cell(r.email), cell(r.name), delButton('Xoá', async () => {
      if (!confirm(`Xoá quyền đọc của ${r.email}?`)) return;
      await deleteDoc(doc(db, 'amcReaders', r.email));
      toast('Đã xoá ' + r.email, 'ok');
      loadReaders();
    }));
    return tr;
  }));
}

async function addReaders() {
  const lines = $('readers-input').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const bad = [];
  const batch = writeBatch(db);
  let n = 0;
  for (const line of lines) {
    const [rawEmail, ...rest] = line.split(',');
    const email = emailKey(rawEmail);
    if (!EMAIL_RE.test(email)) { bad.push(line); continue; }
    batch.set(doc(db, 'amcReaders', email), { email, name: rest.join(',').trim(), addedAt: serverTimestamp() });
    n++;
  }
  try {
    if (n) await batch.commit();
    toast(`Đã lưu ${n} người đọc` + (bad.length ? `, bỏ qua ${bad.length} dòng sai` : ''), bad.length ? 'err' : 'ok');
    $('readers-input').value = bad.join('\n');
    loadReaders();
  } catch (err) { toast('Lỗi: ' + (err.code || err.message), 'err'); }
}

/* ---------- Bài viết ---------- */
async function loadPosts() {
  const snap = await getDocs(collection(db, 'amcPosts'));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  $('posts-body').replaceChildren(...rows.map((p) => {
    const tr = document.createElement('tr');
    const link = document.createElement('td');
    const a = document.createElement('a');
    a.href = `/amc-private/?p=${encodeURIComponent(p.id)}`;
    a.target = '_blank';
    a.textContent = p.id;
    link.append(a);
    tr.append(link, cell(p.title), cell(p.order), cell(p.date), delButton('Xoá', async () => {
      if (!confirm(`Xoá bài "${p.title || p.id}" và toàn bộ ảnh của bài?`)) return;
      await deletePost(p.id);
      toast('Đã xoá bài ' + p.id, 'ok');
      loadPosts();
    }));
    return tr;
  }));
}

async function deletePost(id) {
  const imgs = await getDocs(collection(db, 'amcPosts', id, 'img'));
  await Promise.all(imgs.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'amcPosts', id));
}

function log(line) { $('upload-log').textContent += line + '\n'; }

// Đường dẫn trong thư mục đã chọn, bỏ tên thư mục gốc: "Web-AMC-Private/img/a/b.png" -> "img/a/b.png".
function relPath(file) { return file.webkitRelativePath.split('/').slice(1).join('/'); }

async function uploadFolder() {
  const files = [...$('src-folder').files];
  const byPath = new Map(files.map(f => [relPath(f), f]));
  $('upload-log').textContent = '';
  $('btn-upload').disabled = true;
  try {
    const postsFile = byPath.get('posts.json');
    if (!postsFile) throw new Error('Không thấy posts.json ở gốc thư mục đã chọn.');
    const posts = JSON.parse(await postsFile.text());
    for (const post of posts) {
      const htmlFile = byPath.get(`${post.id}.html`);
      if (!htmlFile) { log(`✗ ${post.id}: thiếu ${post.id}.html — bỏ qua`); continue; }
      await setDoc(doc(db, 'amcPosts', post.id), {
        title: post.title || '', description: post.description || '', tag: post.tag || '',
        date: post.date || '', order: post.order ?? 0, html: await htmlFile.text(), updatedAt: serverTimestamp(),
      });
      log(`✓ ${post.id}: bài`);

      const prefix = `img/${post.id}/`;
      const imgs = files.filter(f => relPath(f).startsWith(prefix) && /^image\//.test(f.type));
      const keep = new Set();
      for (const f of imgs) {
        const name = relPath(f).slice(prefix.length);
        try {
          const data = await toDataUrl(f);
          await setDoc(doc(db, 'amcPosts', post.id, 'img', name), { data, bytes: data.length, updatedAt: serverTimestamp() });
          keep.add(name);
          log(`   ✓ ảnh ${name} (${Math.round(data.length / 1024)} KB)`);
        } catch (err) { log(`   ✗ ảnh ${name}: ${err.message}`); }
      }
      // Ảnh cũ không còn trong thư mục nguồn -> xoá cho khỏi rác.
      const old = await getDocs(collection(db, 'amcPosts', post.id, 'img'));
      for (const d of old.docs) {
        if (!keep.has(d.id)) { await deleteDoc(d.ref); log(`   – xoá ảnh cũ ${d.id}`); }
      }
    }
    toast('Tải lên xong', 'ok');
    loadPosts();
  } catch (err) {
    log('LỖI: ' + (err.code || err.message));
    toast('Tải lên lỗi', 'err');
  } finally {
    $('btn-upload').disabled = false;
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// Ảnh vừa sức thì giữ nguyên; lớn quá thì thu nhỏ + nén WebP cho tới khi < IMG_LIMIT.
// GIF động không nén lại được (canvas làm mất chuyển động) -> báo lỗi để tự cắt ngắn/giảm màu.
async function toDataUrl(file) {
  const raw = await readAsDataUrl(file);
  if (raw.length <= IMG_LIMIT) return raw;
  if (file.type === 'image/gif') throw new Error('GIF quá 1 MB sau mã hoá — giảm kích thước (scripts/video-to-gif.ps1 -Width/-Colors)');
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('không đọc được ảnh'));
    im.src = raw;
  });
  let scale = Math.min(1, 1920 / img.naturalWidth);
  for (let quality = 0.88; ; ) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL('image/webp', quality);
    if (out.length <= IMG_LIMIT) return out;
    if (quality > 0.6) quality -= 0.1; else scale *= 0.8;
    if (canvas.width < 400) throw new Error('không nén được dưới 1 MB');
  }
}
