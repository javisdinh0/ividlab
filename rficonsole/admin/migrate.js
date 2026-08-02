// RFI Console — Công cụ di trú (Giai đoạn 4). Owner-only.
// Đọc RFI cũ từ Firebase RTDB (REST công khai) -> nén ảnh (canvas) -> ghi Firestore.
import { auth, db, CONFIGURED, emailKey } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
const MAX_ROW = 900000; // ~ giữ document < 1MB

let ME = null;

function log(msg, cls) {
  const p = document.createElement('div');
  if (cls) p.className = cls;
  p.textContent = msg;
  $('log').appendChild(p);
  $('log').scrollTop = $('log').scrollHeight;
}

if (!CONFIGURED) {
  show($('config-banner'), true); show($('loading-view'), false); show($('denied-view'), true);
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user || !user.emailVerified) { location.href = '../'; return; }
    ME = emailKey(user.email);
    const owner = await isOwner(ME);
    show($('loading-view'), false);
    if (!owner) { show($('denied-view'), true); return; }
    show($('tool-view'), true);
    $('btn-run').onclick = run;
  });
}

async function isOwner(email) {
  try {
    const s = await getDoc(doc(db, 'config', 'owners'));
    const e = (s.exists() && s.data().emails) || [];
    return e.map(x => (x || '').toLowerCase()).includes(email);
  } catch (e) { return false; }
}

function stripHtml(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.innerHTML = String(s).replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<div>/gi, '');
  return (d.textContent || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

// Nén 1 ảnh base64 -> JPEG dataURL nhỏ hơn. Trả null nếu không đọc được.
function compressFromSrc(src, maxDim, q) {
  return new Promise((res) => {
    if (!src || String(src).indexOf('data:image') !== 0) { res(null); return; }
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      if (Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      try { res(c.toDataURL('image/jpeg', q)); } catch (e) { res(null); }
    };
    img.onerror = () => res(null);
    img.src = src;
  });
}

async function compressList(arr, maxDim, q) {
  const out = [];
  for (const im of (arr || [])) {
    const src = im && (im.src || im.dataUrl || im.url);
    const d = await compressFromSrc(src, maxDim, q);
    if (d) out.push({ dataUrl: d });
  }
  return out;
}

function charsOf(images) { let n = 0; images.forEach(im => n += (im.dataUrl || '').length); return n; }

async function run() {
  $('btn-run').disabled = true;
  $('log').innerHTML = '';
  const rtdb = $('f-rtdb').value.trim().replace(/\/+$/, '');
  const path = $('f-path').value.trim().replace(/^\/+|\/+$/g, '');
  const slug = $('f-slug').value.trim();
  const name = $('f-name').value.trim();
  const trimble = $('f-trimble').value.trim();
  if (!rtdb || !path || !slug || !name) { log('Thiếu thông tin bắt buộc.', 'err'); $('btn-run').disabled = false; return; }
  if (!confirm('Di trú vào dự án "' + slug + '"? Dòng cùng ID sẽ bị ghi đè.')) { $('btn-run').disabled = false; return; }

  try {
    log('Đang tải dữ liệu cũ từ RTDB…');
    const resp = await fetch(rtdb + '/' + path + '.json');
    if (!resp.ok) throw new Error('Tải RTDB lỗi HTTP ' + resp.status);
    const data = await resp.json();
    if (!data) { log('Path này rỗng, không có dữ liệu.', 'err'); $('btn-run').disabled = false; return; }
    const rows = (Array.isArray(data) ? data : Object.values(data))
      .filter(r => r && (r.stt || r.yeuCauNoiDung || r.banVe));
    log('Tìm thấy ' + rows.length + ' dòng RFI.');

    await setDoc(doc(db, 'projects', slug), {
      name, slug, trimbleUrl: trimble, description: 'Di trú từ dữ liệu NAVY Hanoi cũ',
      status: 'open', createdBy: ME, createdAt: serverTimestamp()
    }, { merge: true });
    await setDoc(doc(db, 'projects', slug, 'members', ME), {
      email: ME, role: 1, status: 'active', addedBy: ME, addedAt: serverTimestamp()
    }, { merge: true });
    log('✔ Đã tạo/cập nhật dự án + quyền owner (L1).', 'ok');

    let ok = 0, imgTotal = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      log('Dòng ' + (i + 1) + '/' + rows.length + ': đang nén ảnh…');
      let yc = await compressList(r.yeuCauHinhAnh || r.yeuCauImages, 1400, 0.6);
      let tl = await compressList(r.traLoiHinhAnh || r.traLoiImages, 1400, 0.6);
      if (charsOf(yc) + charsOf(tl) > MAX_ROW) { // còn to -> nén mạnh hơn
        yc = await compressList(r.yeuCauHinhAnh || r.yeuCauImages, 1000, 0.45);
        tl = await compressList(r.traLoiHinhAnh || r.traLoiImages, 1000, 0.45);
      }
      let dropped = 0;
      while (charsOf(yc) + charsOf(tl) > MAX_ROW && (yc.length || tl.length)) {
        if (tl.length) tl.pop(); else yc.pop(); dropped++;
      }

      const docId = 'orig_' + (r.id != null ? r.id : i);
      const out = {
        stt: stripHtml(r.stt) || String(i + 1),
        banVe: stripHtml(r.banVe),
        yeuCauNoiDung: stripHtml(r.yeuCauNoiDung),
        traLoiNoiDung: stripHtml(r.traLoiNoiDung),
        ghiChu: stripHtml(r.ghiChu),
        yeuCauNote: stripHtml(r.yeuCauNote),
        traLoiNote: stripHtml(r.traLoiNote),
        trangThai: r.trangThai === 'Done' ? 'Done' : 'Pending',
        ngayGhiNhan: stripHtml(r.ngayGhiNhan),
        yeuCauImages: yc, traLoiImages: tl,
        editors: (r.editors && typeof r.editors === 'object') ? r.editors : {},
        order: i, createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'projects', slug, 'rfis', docId), out);
      ok++; imgTotal += yc.length + tl.length;
      log('  ✔ Dòng ' + (i + 1) + ': OK — ' + (yc.length + tl.length) + ' ảnh' + (dropped ? ' (bỏ ' + dropped + ' ảnh do quá lớn)' : ''), 'ok');
    }
    log('───────────────', '');
    log('HOÀN TẤT: ' + ok + '/' + rows.length + ' dòng, tổng ' + imgTotal + ' ảnh.', 'ok');
    log('Mở dự án: ' + location.origin + '/rficonsole/?project=' + slug, 'ok');
  } catch (e) {
    console.error(e);
    log('LỖI: ' + (e.message || e.code), 'err');
    log('(Nếu là lỗi CORS khi tải RTDB, báo lại để tôi đổi cách lấy dữ liệu.)', 'err');
  }
  $('btn-run').disabled = false;
}
