// RFI Console — Auth shell (Giai đoạn 1)
// Đăng ký / đăng nhập / xác minh email / quên mật khẩu + danh sách dự án của người dùng.
import { auth, db, CONFIGURED, emailKey } from "./firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged, reload
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc, getDoc, collectionGroup, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const show = (el, on) => { el.style.display = on ? '' : 'none'; };

function toast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show ' + (type || '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = t.className.replace('show', '').trim(); }, 3400);
}

// Dịch mã lỗi Firebase sang tiếng Việt gọn.
function authErr(e) {
  const c = (e && e.code) || '';
  const map = {
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/missing-password': 'Chưa nhập mật khẩu.',
    'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
    'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy đăng nhập.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/wrong-password': 'Mật khẩu không đúng.',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
    'auth/too-many-requests': 'Thử quá nhiều lần. Vui lòng đợi rồi thử lại.',
    'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối.',
  };
  return map[c] || (e && e.message) || 'Có lỗi xảy ra.';
}

const views = ['config-banner', 'auth-view', 'verify-view', 'home-view', 'project-view'];
function showView(id) {
  views.forEach(v => { const el = $(v); if (el) show(el, false); });
  if (id) show($(id), true);
}

// ---------- Chưa cấu hình Firebase ----------
if (!CONFIGURED) {
  show($('config-banner'), true);
  show($('auth-view'), true);
  document.querySelectorAll('#auth-view button, #auth-view input').forEach(el => el.disabled = true);
  $('auth-sub').textContent = 'Chưa cấu hình Firebase — xem DEPLOY.md';
} else {
  wireAuthForms();
  onAuthStateChanged(auth, (user) => {
    if (!user) { showView('auth-view'); return; }
    if (!user.emailVerified) { renderVerify(user); return; }
    route(user);
  });
}

// Định tuyến sau khi đã đăng nhập + xác minh.
async function route(user) {
  const pid = new URLSearchParams(location.search).get('project');
  if (!pid) { renderHome(user); return; }
  // Kiểm tra membership để lấy vai trò rồi mở app RFI.
  try {
    const m = await getDoc(doc(db, 'projects', pid, 'members', emailKey(user.email)));
    let role = m.exists() ? sanitizeRole(m.data().role) : null;
    if (role == null && await checkOwner(user.email)) role = 1; // owner không phải member vẫn mở được
    if (role == null) {
      history.replaceState(null, '', './');       // dứt khoát không có quyền -> bỏ deep-link
      toast('Bạn không có quyền vào dự án này.', 'err');
      renderHome(user);
      return;
    }
    showView('project-view');
    const mod = await import('./rfi.js');
    await mod.initProject(user, pid, role);
  } catch (e) {
    console.error(e);
    // Lỗi tạm thời (mạng/token/index) -> GIỮ ?project để tải lại là thử lại được.
    toast('Không mở được dự án: ' + (e.message || e.code), 'err');
    renderHome(user);
  }
}

/* =========================================================================
   FORM: đăng nhập / đăng ký / quên mật khẩu
   ========================================================================= */
function switchAuthForm(which) {
  show($('login-form'), which === 'login');
  show($('signup-form'), which === 'signup');
  show($('forgot-form'), which === 'forgot');
  $('auth-sub').textContent = which === 'signup' ? 'Tạo tài khoản mới'
    : which === 'forgot' ? 'Khôi phục mật khẩu' : 'Đăng nhập để quản lý RFI dự án';
  ['login-err', 'signup-err', 'forgot-err'].forEach(id => $(id).textContent = '');
}

function wireAuthForms() {
  $('link-to-signup').onclick = (e) => { e.preventDefault(); switchAuthForm('signup'); };
  $('link-to-login').onclick = (e) => { e.preventDefault(); switchAuthForm('login'); };
  $('link-forgot').onclick = (e) => { e.preventDefault(); switchAuthForm('forgot'); };
  $('link-forgot-back').onclick = (e) => { e.preventDefault(); switchAuthForm('login'); };

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('login-err').textContent = '';
    try {
      await signInWithEmailAndPassword(auth, $('login-email').value.trim(), $('login-pwd').value);
    } catch (err) { $('login-err').textContent = authErr(err); }
  });

  $('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('signup-err').textContent = '';
    const email = $('signup-email').value.trim();
    const p1 = $('signup-pwd').value, p2 = $('signup-pwd2').value;
    if (p1 !== p2) { $('signup-err').textContent = 'Hai mật khẩu không khớp.'; return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, p1);
      await sendEmailVerification(cred.user);
      toast('Đã gửi email xác minh. Kiểm tra hộp thư.', 'ok');
    } catch (err) { $('signup-err').textContent = authErr(err); }
  });

  $('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('forgot-err').textContent = '';
    try {
      await sendPasswordResetEmail(auth, $('forgot-email').value.trim());
      toast('Đã gửi link đặt lại mật khẩu (nếu email tồn tại).', 'ok');
      switchAuthForm('login');
    } catch (err) { $('forgot-err').textContent = authErr(err); }
  });
}

/* =========================================================================
   VIEW: chưa xác minh email
   ========================================================================= */
function renderVerify(user) {
  showView('verify-view');
  $('verify-email').textContent = user.email;
  $('verify-msg').textContent = '';

  $('btn-verified').onclick = async () => {
    $('verify-msg').textContent = 'Đang kiểm tra…';
    try {
      await reload(user);
      if (auth.currentUser && auth.currentUser.emailVerified) {
        // reload() KHÔNG cấp token mới -> token cũ vẫn email_verified:false, mọi read
        // Firestore sẽ bị từ chối. Ép làm mới token trước khi đọc.
        await auth.currentUser.getIdToken(true);
        route(auth.currentUser);                 // route() để tôn trọng ?project deep-link
      } else {
        $('verify-msg').textContent = 'Chưa thấy xác minh. Hãy bấm link trong email rồi thử lại.';
      }
    } catch (e) { $('verify-msg').textContent = authErr(e); }
  };
  $('btn-resend').onclick = async () => {
    try { await sendEmailVerification(user); toast('Đã gửi lại email xác minh.', 'ok'); }
    catch (e) { $('verify-msg').textContent = authErr(e); }
  };
  $('btn-verify-logout').onclick = () => signOut(auth);
}

/* =========================================================================
   VIEW: đã đăng nhập — danh sách dự án
   ========================================================================= */
async function renderHome(user) {
  showView('home-view');
  $('user-chip').textContent = user.email;
  $('btn-logout').onclick = () => signOut(auth);
  wireTheme();

  // Owner? -> hiện nút Quản trị
  const isOwner = await checkOwner(user.email);
  show($('btn-admin'), isOwner);

  // Danh sách dự án mình là thành viên (collectionGroup trên "members")
  show($('projects-loading'), true);
  show($('projects-empty'), false);
  $('projects-grid').innerHTML = '';
  try {
    const q = query(collectionGroup(db, 'members'), where('email', '==', emailKey(user.email)));
    const res = await getDocs(q);
    const items = [];
    for (const m of res.docs) {
      const projRef = m.ref.parent.parent;
      if (!projRef) continue;
      const p = await getDoc(projRef);
      if (p.exists()) items.push({ id: projRef.id, ...p.data(), role: m.data().role });
    }
    show($('projects-loading'), false);
    if (!items.length && !isOwner) { show($('projects-empty'), true); return; }
    renderProjectCards(items);
  } catch (e) {
    show($('projects-loading'), false);
    // Thiếu index collectionGroup sẽ báo ở console (Firestore cho link tạo index).
    console.error(e);
    toast('Không tải được danh sách dự án: ' + (e.message || e.code), 'err');
    if (!isOwner) show($('projects-empty'), true);
  }
}

const ROLE_LABEL = { 1: 'Toàn quyền', 2: 'Trả lời', 3: 'Chỉ xem' };
function renderProjectCards(items) {
  const grid = $('projects-grid');
  grid.innerHTML = items.map(p => {
    const role = sanitizeRole(p.role);              // 1|2|3 -> chống XSS qua thuộc tính class
    return `
    <a class="project-card" href="./?project=${encodeURIComponent(p.id)}" data-id="${escAttr(p.id)}">
      <div class="pc-name">${escapeHtml(p.name || p.id)}</div>
      <div class="pc-desc">${escapeHtml(p.description || '')}</div>
      <div class="pc-foot">
        <span class="pc-role role-${role}">${ROLE_LABEL[role] || 'Thành viên'}</span>
        ${p.status && p.status !== 'open' ? '<span class="pc-status">Đã đóng</span>' : ''}
      </div>
    </a>`;
  }).join('');
  // Thẻ dự án điều hướng tới ./?project=<id> (route() sẽ mở bảng RFI).
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
// Ép vai trò về số nguyên trong danh sách trắng (chống chèn chuỗi độc vào class/nhãn).
function sanitizeRole(r) { return ({ 1: 1, 2: 2, 3: 3 })[r] || null; }
// Đọc config/owners (danh sách lưu lowercase) để biết user có phải owner.
async function checkOwner(email) {
  try {
    const snap = await getDoc(doc(db, 'config', 'owners'));
    const emails = (snap.exists() && snap.data().emails) || [];
    return emails.map(x => (x || '').toLowerCase()).includes(emailKey(email));
  } catch (e) { return false; }
}

/* =========================================================================
   Theme
   ========================================================================= */
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
