// RFI Console — Tab Admin (Giai đoạn 2)
// Owner: tạo/cấu hình dự án, cấp quyền thành viên theo email + vai trò.
import { auth, db, CONFIGURED, emailKey } from "../firebase.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };

function toast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show ' + (type || '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = t.className.replace('show', '').trim(); }, 3400);
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// Slug: bỏ dấu tiếng Việt, khoảng trắng -> gạch nối, chỉ còn a-z0-9-
function slugify(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

let me = null;        // { email }
let currentPid = null;

if (!CONFIGURED) {
  show($('config-banner'), true);
  show($('loading-view'), false);
  show($('denied-view'), true);
  $('denied-msg').textContent = 'Chưa cấu hình Firebase — xem DEPLOY.md';
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user || !user.emailVerified) {
      // Chưa đăng nhập/chưa xác minh -> về trang đăng nhập chính
      location.href = '../';
      return;
    }
    me = { email: emailKey(user.email) };
    const owner = await isOwner(me.email);
    if (!owner) {
      show($('loading-view'), false);
      show($('denied-view'), true);
      return;
    }
    bootAdmin(user);
  });
}

async function isOwner(email) {
  try {
    const snap = await getDoc(doc(db, 'config', 'owners'));
    const emails = (snap.exists() && snap.data().emails) || [];
    return emails.map(x => (x || '').toLowerCase()).includes(email);
  } catch (e) { return false; }
}

function bootAdmin(user) {
  show($('loading-view'), false);
  show($('admin-view'), true);
  $('user-chip').textContent = user.email;
  $('btn-logout').onclick = () => signOut(auth);
  wireTheme();
  wireNewProject();
  wireDetail();
  loadProjects();
}

/* ---------- Danh sách dự án ---------- */
async function loadProjects(selectPid) {
  const list = $('project-list');
  list.innerHTML = '<div class="muted" style="padding:0.6rem;">Đang tải…</div>';
  try {
    const res = await getDocs(collection(db, 'projects'));
    const items = res.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    if (!items.length) { list.innerHTML = '<div class="muted" style="padding:0.6rem;">Chưa có dự án nào.</div>'; return; }
    list.innerHTML = items.map(p => `
      <button class="proj-item${p.id === currentPid ? ' active' : ''}" data-id="${p.id}">
        <span class="pi-name">${escapeHtml(p.name || p.id)}</span>
        <span class="pi-slug">${escapeHtml(p.id)}</span>
      </button>`).join('');
    list.querySelectorAll('.proj-item').forEach(b => b.onclick = () => openProject(b.dataset.id));
    if (selectPid) openProject(selectPid);
  } catch (e) {
    list.innerHTML = '<div class="form-err" style="padding:0.6rem;">Lỗi tải: ' + escapeHtml(e.message || e.code) + '</div>';
  }
}

/* ---------- Tạo dự án ---------- */
function wireNewProject() {
  $('btn-new-project').onclick = () => {
    show($('detail'), false); show($('detail-empty'), false);
    show($('new-project-card'), true);
    ['np-name', 'np-slug', 'np-trimble', 'np-desc'].forEach(id => $(id).value = '');
    $('np-err').textContent = '';
    $('np-name').focus();
  };
  $('np-name').addEventListener('input', () => {
    if (!$('np-slug')._touched) $('np-slug').value = slugify($('np-name').value);
  });
  $('np-slug').addEventListener('input', () => { $('np-slug')._touched = true; });
  $('np-cancel').onclick = () => { show($('new-project-card'), false); show($('detail-empty'), true); };

  $('np-create').onclick = async () => {
    $('np-err').textContent = '';
    const name = $('np-name').value.trim();
    const slug = slugify($('np-slug').value || name);
    if (!name) { $('np-err').textContent = 'Chưa nhập tên dự án.'; return; }
    if (!slug) { $('np-err').textContent = 'Mã dự án (slug) không hợp lệ.'; return; }
    const ref = doc(db, 'projects', slug);
    try {
      const existing = await getDoc(ref);
      if (existing.exists()) { $('np-err').textContent = 'Mã dự án "' + slug + '" đã tồn tại. Chọn mã khác.'; return; }
      await setDoc(ref, {
        name, slug, trimbleUrl: $('np-trimble').value.trim(),
        description: $('np-desc').value.trim(), status: 'open',
        createdBy: me.email, createdAt: serverTimestamp()
      });
      // Tự thêm người tạo làm thành viên L1.
      await setDoc(doc(db, 'projects', slug, 'members', me.email), {
        email: me.email, role: 1, status: 'active', addedBy: me.email, addedAt: serverTimestamp()
      });
      toast('Đã tạo dự án "' + name + '".', 'ok');
      show($('new-project-card'), false);
      currentPid = slug;
      loadProjects(slug);
    } catch (e) { $('np-err').textContent = 'Lỗi tạo dự án: ' + (e.message || e.code); }
  };
}

/* ---------- Mở & cấu hình dự án ---------- */
async function openProject(pid) {
  currentPid = pid;
  show($('new-project-card'), false);
  show($('detail-empty'), false);
  show($('detail'), true);
  document.querySelectorAll('.proj-item').forEach(b => b.classList.toggle('active', b.dataset.id === pid));
  try {
    const snap = await getDoc(doc(db, 'projects', pid));
    if (!snap.exists()) { toast('Dự án không tồn tại.', 'err'); return; }
    const p = snap.data();
    $('cfg-name').value = p.name || '';
    $('cfg-slug').value = pid;
    $('cfg-trimble').value = p.trimbleUrl || '';
    $('cfg-desc').value = p.description || '';
    $('cfg-status').value = p.status || 'open';
    loadMembers(pid);
  } catch (e) { toast('Lỗi mở dự án: ' + (e.message || e.code), 'err'); }
}

function wireDetail() {
  $('cfg-save').onclick = async () => {
    if (!currentPid) return;
    try {
      await updateDoc(doc(db, 'projects', currentPid), {
        name: $('cfg-name').value.trim(),
        trimbleUrl: $('cfg-trimble').value.trim(),
        description: $('cfg-desc').value.trim(),
        status: $('cfg-status').value
      });
      toast('Đã lưu cấu hình.', 'ok');
      loadProjects(currentPid);
    } catch (e) { toast('Lỗi lưu: ' + (e.message || e.code), 'err'); }
  };

  $('cfg-delete').onclick = async () => {
    if (!currentPid) return;
    if (!confirm('Xóa dự án "' + currentPid + '"? Hành động này không xóa dữ liệu RFI/thành viên con tự động — hãy đảm bảo dự án đã trống.')) return;
    try {
      await deleteDoc(doc(db, 'projects', currentPid));
      toast('Đã xóa dự án.', 'ok');
      currentPid = null;
      show($('detail'), false); show($('detail-empty'), true);
      loadProjects();
    } catch (e) { toast('Lỗi xóa: ' + (e.message || e.code), 'err'); }
  };

  $('m-add').onclick = addMember;
  $('m-email').addEventListener('keypress', (e) => { if (e.key === 'Enter') addMember(); });
}

/* ---------- Thành viên ---------- */
const ROLE_LABEL = { 1: 'L1 · Toàn quyền', 2: 'L2 · Chỉ trả lời', 3: 'L3 · Chỉ xem' };

async function loadMembers(pid) {
  const body = $('member-body');
  body.innerHTML = '<tr><td colspan="3" class="muted">Đang tải…</td></tr>';
  try {
    const res = await getDocs(collection(db, 'projects', pid, 'members'));
    const items = res.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.role - b.role) || a.email.localeCompare(b.email));
    if (!items.length) { body.innerHTML = '<tr><td colspan="3" class="muted">Chưa có thành viên.</td></tr>'; return; }
    body.innerHTML = items.map(m => `
      <tr>
        <td>${escapeHtml(m.email)}${m.email === me.email ? ' <span class="you-tag">(bạn)</span>' : ''}</td>
        <td>
          <select class="m-role-sel" data-email="${escapeHtml(m.email)}">
            <option value="1"${m.role === 1 ? ' selected' : ''}>L1 · Toàn quyền</option>
            <option value="2"${m.role === 2 ? ' selected' : ''}>L2 · Chỉ trả lời</option>
            <option value="3"${m.role === 3 ? ' selected' : ''}>L3 · Chỉ xem</option>
          </select>
        </td>
        <td><button class="row-del" data-email="${escapeHtml(m.email)}" title="Gỡ khỏi dự án">✕</button></td>
      </tr>`).join('');
    body.querySelectorAll('.m-role-sel').forEach(s => s.onchange = () => changeRole(s.dataset.email, parseInt(s.value)));
    body.querySelectorAll('.row-del').forEach(b => b.onclick = () => removeMember(b.dataset.email));
  } catch (e) {
    body.innerHTML = '<tr><td colspan="3" class="form-err">Lỗi tải: ' + escapeHtml(e.message || e.code) + '</td></tr>';
  }
}

async function addMember() {
  $('m-err').textContent = '';
  const email = emailKey($('m-email').value);
  const role = parseInt($('m-role').value);
  if (!email || email.indexOf('@') === -1) { $('m-err').textContent = 'Email không hợp lệ.'; return; }
  try {
    await setDoc(doc(db, 'projects', currentPid, 'members', email), {
      email, role, status: 'active', addedBy: me.email, addedAt: serverTimestamp()
    });
    $('m-email').value = '';
    toast('Đã cấp quyền ' + ROLE_LABEL[role] + ' cho ' + email + '.', 'ok');
    loadMembers(currentPid);
  } catch (e) { $('m-err').textContent = 'Lỗi: ' + (e.message || e.code); }
}

async function changeRole(email, role) {
  try {
    await updateDoc(doc(db, 'projects', currentPid, 'members', email), { role });
    toast('Đã đổi vai trò ' + email + ' → ' + ROLE_LABEL[role] + '.', 'ok');
  } catch (e) { toast('Lỗi đổi vai trò: ' + (e.message || e.code), 'err'); loadMembers(currentPid); }
}

async function removeMember(email) {
  if (!confirm('Gỡ ' + email + ' khỏi dự án?')) return;
  try {
    await deleteDoc(doc(db, 'projects', currentPid, 'members', email));
    toast('Đã gỡ ' + email + '.', 'ok');
    loadMembers(currentPid);
  } catch (e) { toast('Lỗi gỡ: ' + (e.message || e.code), 'err'); }
}

/* ---------- Theme ---------- */
function wireTheme() {
  const btn = $('btn-theme');
  if (!btn || btn._wired) return;
  btn._wired = true;
  btn.onclick = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('rfiTheme', next); } catch (e) {}
  };
}
