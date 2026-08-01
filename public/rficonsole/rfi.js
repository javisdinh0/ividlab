// RFI Console — App bảng RFI theo dự án (Giai đoạn 3)
// Port từ RFI Web, thay Firebase RTDB + permissions.js bằng Firestore + vai trò membership.
// Ảnh lưu trên Storage (không base64 trong DB). Vai trò: 1 toàn quyền / 2 chỉ trả lời (+khóa 24h) / 3 chỉ xem.
import { db } from "./firebase.js";
import {
  doc, getDoc, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Ảnh lưu base64 (nén) NGAY trong document RFI — không dùng Firebase Storage (Spark
// plan bị khóa Storage). Firestore giới hạn 1MB/doc nên nén mạnh + chặn tổng theo dòng.
const MAX_ROW_IMG_CHARS = 900000;

const ANSWER_FIELDS = new Set(['traLoiNoiDung', 'traLoiImages', 'ghiChu', 'trangThai', 'traLoiNote']);
const LOCK_MS = 24 * 60 * 60 * 1000;

const $ = (id) => document.getElementById(id);
function toast(msg, type) {
  const t = $('toast'); if (!t) return;
  t.textContent = msg; t.className = 'show ' + (type || '');
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = t.className.replace('show', '').trim(); }, 3400);
}
function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(v) { return esc(v).replace(/"/g, '&quot;'); }
function toMillis(ts) { return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : (typeof ts === 'number' ? ts : null); }

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script'); s.src = src;
    s.onload = resolve; s.onerror = () => reject(new Error('Không tải được: ' + src));
    document.head.appendChild(s);
  });
}

// ---- Trạng thái module ----
let PID = null, ROLE = 3, ME = '', PROJECT = {};
let rows = [];                 // [{id, ...data}]
let editingActive = false;     // đang gõ trong 1 ô -> hoãn re-render
let pendingRender = false;
let unsub = null;

export async function initProject(user, projectId, role) {
  PID = projectId; ROLE = ({ 1: 1, 2: 2, 3: 3 })[role] || 3; ME = user.email;
  if (unsub) { unsub(); unsub = null; }

  const view = $('project-view');
  view.innerHTML = renderShell();
  wireToolbar();

  // Cấu hình dự án (tên + Trimble)
  try {
    const snap = await getDoc(doc(db, 'projects', PID));
    PROJECT = snap.exists() ? snap.data() : {};
  } catch (e) { PROJECT = {}; }
  $('rfi-project-name').textContent = PROJECT.name || PID;
  $('rfi-role-badge').textContent = { 1: 'Toàn quyền', 2: 'Chỉ trả lời', 3: 'Chỉ xem' }[ROLE] || '';
  $('rfi-role-badge').className = 'pc-role role-' + ROLE;
  renderTrimble();
  $('rfi-add-row').style.display = ROLE === 1 ? '' : 'none';

  // Lắng nghe dữ liệu RFI realtime.
  // KHÔNG dùng orderBy('order') vì Firestore sẽ LOẠI mọi doc thiếu field 'order'
  // (dữ liệu di trú/nhập tay có thể thiếu) -> sắp xếp phía client, doc thiếu order xuống cuối.
  unsub = onSnapshot(collection(db, 'projects', PID, 'rfis'), (snap) => {
    rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => ((a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
        || String(a.id).localeCompare(String(b.id)));
    if (editingActive) { pendingRender = true; return; }
    renderRows();
  }, (err) => {
    console.error(err);
    toast('Lỗi tải dữ liệu RFI: ' + (err.message || err.code), 'err');
  });
}

/* ============================ SHELL ============================ */
function renderShell() {
  return `
    <header class="topbar">
      <div class="topbar-brand">
        <a href="./" class="btn btn-ghost btn-sm">←</a>
        <span id="rfi-project-name">…</span>
        <span id="rfi-role-badge" class="pc-role"></span>
      </div>
      <div class="topbar-right">
        <button class="btn btn-ghost btn-sm" id="rfi-add-row">+ Thêm dòng</button>
        <button class="btn btn-ghost btn-sm" id="rfi-zip">Tải ảnh (ZIP)</button>
        <button class="btn btn-ghost btn-sm" id="rfi-pdf">In PDF</button>
        <button class="btn btn-ghost btn-sm btn-theme" id="rfi-theme" title="Sáng/Tối">🌓</button>
      </div>
    </header>

    <main class="rfi-main">
      <div id="rfi-print-title" class="table-title">BẢNG GHI NHẬN YÊU CẦU LÀM RÕ THÔNG TIN / ANSWER AND QUESTION INFO</div>
      <div class="excel-table-wrapper">
        <table id="qa-table">
          <thead>
            <tr class="header-main-title">
              <th colspan="4" class="bg-blue">YÊU CẦU / QUESTION INFO</th>
              <th colspan="3" class="bg-green">TRẢ LỜI / ANSWER INFO</th>
            </tr>
            <tr class="header-sub-title">
              <th style="width:50px;">STT<div class="header-hr"></div>Trạng thái</th>
              <th style="width:150px;">BẢN VẼ/<br>CHỈ DẪN KT<div class="header-hr"></div>Ngày ghi nhận</th>
              <th style="width:250px;">NỘI DUNG</th>
              <th style="width:150px;">HÌNH ẢNH</th>
              <th style="width:250px;">NỘI DUNG</th>
              <th style="width:150px;">HÌNH ẢNH</th>
              <th style="width:150px;">GHI CHÚ</th>
            </tr>
          </thead>
          <tbody id="qa-body"></tbody>
        </table>
      </div>
      <div id="rfi-trimble" class="trimble-viewer-container" style="display:none;">
        <div class="viewer-header">
          <span>Mô hình 3D (IFC Viewer)</span>
          <a id="rfi-trimble-link" href="#" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Mở tab mới ↗</a>
        </div>
        <iframe id="rfi-trimble-iframe" allow="fullscreen; autoplay; camera; microphone"></iframe>
      </div>
    </main>`;
}

function renderTrimble() {
  const box = $('rfi-trimble');
  const url = (PROJECT.trimbleUrl || '').trim();
  if (!url || !/^https?:\/\//i.test(url)) { box.style.display = 'none'; return; } // chỉ http/https
  box.style.display = '';
  $('rfi-trimble-iframe').src = url;
  $('rfi-trimble-link').href = url;
}

/* ============================ RENDER BẢNG ============================ */
function isLocked(row) {
  const ms = toMillis(row.firstEditTime);
  return ms != null && (Date.now() - ms) >= LOCK_MS;
}
function canEdit(field, row) {
  if (ROLE === 1) return true;
  if (ROLE === 2) return ANSWER_FIELDS.has(field) && !isLocked(row);
  return false;
}

function editorTitle(row, field) {
  const ed = row.editors && row.editors[field];
  if (!ed) return '';
  if (typeof ed === 'string') return `title="(Sửa bởi: ${escAttr(ed)})"`;
  if (ed.email) {
    const t = ed.ts ? new Date(toMillis(ed.ts) || ed.ts).toLocaleString('vi-VN',
      { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    return `title="(Sửa bởi: ${escAttr(ed.email)}${t ? ' lúc ' + t : ''})"`;
  }
  return '';
}

function imagesHtml(arr, field, row) {
  if (!arr || !arr.length) return '';
  const editable = canEdit(field, row);
  let html = '<div class="thumbnail-container">';
  arr.forEach((img, idx) => {
    const src = img.dataUrl || img.url || '';
    html += `<div class="thumbnail-wrapper" data-src="${escAttr(src)}" title="Bấm để xem cỡ lớn">
      <img src="${escAttr(src)}" alt="RFI" loading="lazy" />
      ${editable ? `<button class="delete-img-btn" data-id="${row.id}" data-field="${field}" data-idx="${idx}" title="Xóa ảnh">X</button>` : ''}
    </div>`;
  });
  return html + '</div>';
}

function renderRows() {
  const body = $('qa-body');
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem;">Chưa có RFI nào.${ROLE === 1 ? ' Bấm “+ Thêm dòng”.' : ''}</td></tr>`;
    return;
  }
  const cellCls = (field, row, base) => (canEdit(field, row) ? 'editable-cell ' : 'locked-cell ') + (base || '');
  const editAttr = (field, row) => canEdit(field, row) ? 'contenteditable="true"' : '';
  const imgCls = (field, row) => canEdit(field, row) ? 'image-cell' : 'locked-image-cell';

  let html = '';
  rows.forEach(row => {
    const st = row.trangThai === 'Done' ? 'status-done' : 'status-pending';
    html += `
    <tr>
      <td class="${cellCls('stt', row)}" ${editorTitle(row, 'stt')} style="text-align:center;font-weight:bold;" data-field="stt" data-id="${row.id}" ${editAttr('stt', row)}>${esc(row.stt)}</td>
      <td class="${cellCls('banVe', row)}" ${editorTitle(row, 'banVe')} style="text-align:center;font-weight:bold;" data-field="banVe" data-id="${row.id}" ${editAttr('banVe', row)}>${esc(row.banVe).replace(/\n/g, '<br>')}</td>
      <td class="${cellCls('yeuCauNoiDung', row)}" ${editorTitle(row, 'yeuCauNoiDung')} data-field="yeuCauNoiDung" data-id="${row.id}" ${editAttr('yeuCauNoiDung', row)}>${esc(row.yeuCauNoiDung)}</td>
      <td class="${imgCls('yeuCauImages', row)}" data-field="yeuCauImages" data-id="${row.id}" ${canEdit('yeuCauImages', row) ? 'tabindex="0"' : ''}>${imagesHtml(row.yeuCauImages, 'yeuCauImages', row)}</td>
      <td class="${cellCls('traLoiNoiDung', row)}" ${editorTitle(row, 'traLoiNoiDung')} data-field="traLoiNoiDung" data-id="${row.id}" ${editAttr('traLoiNoiDung', row)}>${esc(row.traLoiNoiDung)}</td>
      <td class="${imgCls('traLoiImages', row)}" data-field="traLoiImages" data-id="${row.id}" ${canEdit('traLoiImages', row) ? 'tabindex="0"' : ''}>${imagesHtml(row.traLoiImages, 'traLoiImages', row)}</td>
      <td class="${cellCls('ghiChu', row)}" ${editorTitle(row, 'ghiChu')} data-field="ghiChu" data-id="${row.id}" ${editAttr('ghiChu', row)}>${esc(row.ghiChu)}</td>
    </tr>
    <tr class="border-dotted-top">
      <td style="text-align:center;padding:4px;">
        <select class="status-select ${st}" data-id="${row.id}" ${canEdit('trangThai', row) ? '' : 'disabled'}>
          <option value="Pending" ${row.trangThai !== 'Done' ? 'selected' : ''}>Pending</option>
          <option value="Done" ${row.trangThai === 'Done' ? 'selected' : ''}>Done</option>
        </select>
      </td>
      <td class="${cellCls('ngayGhiNhan', row)}" ${editorTitle(row, 'ngayGhiNhan')} style="text-align:center;font-weight:bold;" data-field="ngayGhiNhan" data-id="${row.id}" ${editAttr('ngayGhiNhan', row)}>${esc(row.ngayGhiNhan)}</td>
      <td class="${cellCls('yeuCauNote', row, 'bg-orange-light')}" ${editorTitle(row, 'yeuCauNote')} data-field="yeuCauNote" data-id="${row.id}" ${editAttr('yeuCauNote', row)}>${esc(row.yeuCauNote)}</td>
      <td></td>
      <td class="${cellCls('traLoiNote', row, 'bg-orange-light')}" ${editorTitle(row, 'traLoiNote')} data-field="traLoiNote" data-id="${row.id}" ${editAttr('traLoiNote', row)}>${esc(row.traLoiNote)}</td>
      <td></td>
      <td>${ROLE === 1 ? `<button class="row-del" data-id="${row.id}" title="Xóa dòng">✕</button>` : ''}</td>
    </tr>`;
  });
  body.innerHTML = html;
  attachRowListeners();
}

function attachRowListeners() {
  const body = $('qa-body');
  body.querySelectorAll('.editable-cell[contenteditable="true"]').forEach(cell => {
    cell.addEventListener('focus', (e) => { editingActive = true; e.target.setAttribute('data-old', e.target.innerHTML); });
    cell.addEventListener('blur', onCellBlur);
  });
  // Ô ảnh KHÔNG bật cờ editingActive (không có caret cần bảo vệ); nhờ vậy snapshot
  // sau khi dán/xoá ảnh sẽ re-render ngay để thumbnail hiện lập tức.
  body.querySelectorAll('.image-cell').forEach(cell => {
    cell.addEventListener('paste', onImagePaste);
  });
  body.querySelectorAll('.status-select:not([disabled])').forEach(sel => {
    sel.addEventListener('change', () => applyEdit(sel.dataset.id, 'trangThai', sel.value));
  });
  body.querySelectorAll('.thumbnail-wrapper').forEach(w => {
    w.addEventListener('click', (e) => { if (!e.target.classList.contains('delete-img-btn')) openImage(w.dataset.src); });
  });
  body.querySelectorAll('.delete-img-btn').forEach(b => {
    b.addEventListener('click', (e) => { e.stopPropagation(); deleteImage(b.dataset.id, b.dataset.field, parseInt(b.dataset.idx)); });
  });
  body.querySelectorAll('.row-del').forEach(b => b.addEventListener('click', () => deleteRow(b.dataset.id)));
}

function onCellBlur(e) {
  const cell = e.target;
  const oldHtml = cell.getAttribute('data-old');
  let val = cell.innerHTML;
  editingActive = false;
  if (oldHtml === val) { if (pendingRender) { pendingRender = false; renderRows(); } return; }
  // Chuẩn hóa: <div>/<br> -> \n cho các ô văn bản, bỏ thẻ khác.
  const field = cell.getAttribute('data-field');
  const text = htmlToText(val);
  applyEdit(cell.getAttribute('data-id'), field, text);
}

function htmlToText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html.replace(/<div>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '');
  return (tmp.textContent || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/* ============================ GHI DỮ LIỆU ============================ */
async function applyEdit(rfiId, field, value) {
  const row = rows.find(r => r.id === rfiId);
  const patch = { [field]: value, [`editors.${field}`]: { email: ME, ts: Date.now() } };
  if (ROLE === 2 && ANSWER_FIELDS.has(field) && row && !row.firstEditTime) {
    patch.firstEditTime = serverTimestamp();
  }
  try {
    await updateDoc(doc(db, 'projects', PID, 'rfis', rfiId), patch);
  } catch (e) {
    console.error(e);
    toast(permErr(e) || ('Lỗi lưu: ' + (e.message || e.code)), 'err');
    renderRows(); // hoàn tác hiển thị về trạng thái server
  }
}

function permErr(e) {
  if (e && (e.code === 'permission-denied' || /insufficient permissions/i.test(e.message || ''))) {
    return ROLE === 2 ? 'Không lưu được: chỉ được sửa cột trả lời và trong vòng 24h.' : 'Bạn không có quyền sửa mục này.';
  }
  return null;
}

async function onImagePaste(e) {
  const cell = e.currentTarget;
  const field = cell.getAttribute('data-field');
  const rfiId = cell.getAttribute('data-id');
  const items = (e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData)).items;
  for (const it of items) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      e.preventDefault();
      const blob = it.getAsFile();
      try {
        toast('Đang xử lý ảnh…');
        let dataUrl = await compressImage(blob, 1400, 0.6);
        if (dataUrl.length > 500000) dataUrl = await compressImage(blob, 1100, 0.5); // còn to -> nén mạnh hơn
        const row = rows.find(x => x.id === rfiId) || {};
        if (imageCharsOfRow(row) + dataUrl.length > MAX_ROW_IMG_CHARS) {
          toast('Dòng này đã quá nhiều ảnh (giới hạn ~1MB/dòng). Xoá bớt rồi thử lại.', 'err');
          return;
        }
        const cur = row[field] || [];
        await applyEdit(rfiId, field, [...cur, { dataUrl }]);
        toast('Đã thêm ảnh.', 'ok');
      } catch (err) { console.error(err); toast('Lỗi xử lý ảnh: ' + (err.message || err.code), 'err'); }
      break;
    }
  }
}

// Nén + thu nhỏ ảnh về JPEG dataURL bằng canvas (giảm dung lượng để lưu vào Firestore).
function compressImage(blob, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      if (Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { resolve(c.toDataURL('image/jpeg', quality)); } catch (err) { reject(err); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh')); };
    img.src = url;
  });
}

// Tổng độ dài base64 ảnh của 1 dòng (để chặn vượt 1MB/doc).
function imageCharsOfRow(row) {
  let n = 0;
  ['yeuCauImages', 'traLoiImages'].forEach(f => (row[f] || []).forEach(im => { n += (im.dataUrl || im.url || '').length; }));
  return n;
}

async function deleteImage(rfiId, field, idx) {
  if (!confirm('Xóa ảnh này?')) return;
  const row = rows.find(r => r.id === rfiId);
  const arr = (row && row[field]) || [];
  if (!arr[idx]) return;
  try {
    await applyEdit(rfiId, field, arr.filter((_, i) => i !== idx));
  } catch (e) { toast('Lỗi xóa ảnh: ' + (e.message || e.code), 'err'); }
}

async function addRow() {
  if (ROLE !== 1) return;
  const maxOrder = rows.reduce((m, r) => Math.max(m, r.order || 0), 0);
  const nextStt = rows.length ? String((parseInt(rows[rows.length - 1].stt) || rows.length) + 1) : '1';
  try {
    await addDoc(collection(db, 'projects', PID, 'rfis'), {
      stt: nextStt, banVe: '', yeuCauNoiDung: '', yeuCauImages: [],
      traLoiNoiDung: '', traLoiImages: [], ghiChu: '', yeuCauNote: '', traLoiNote: '',
      trangThai: 'Pending', ngayGhiNhan: new Date().toLocaleDateString('en-GB'),
      order: maxOrder + 1, editors: {}, createdAt: serverTimestamp()
    });
    toast('Đã thêm dòng.', 'ok');
  } catch (e) { toast('Lỗi thêm dòng: ' + (e.message || e.code), 'err'); }
}

async function deleteRow(rfiId) {
  if (ROLE !== 1) return;
  if (!confirm('Xóa dòng RFI này?')) return;
  try { await deleteDoc(doc(db, 'projects', PID, 'rfis', rfiId)); toast('Đã xóa dòng.', 'ok'); }
  catch (e) { toast('Lỗi xóa: ' + (e.message || e.code), 'err'); }
}

/* ============================ TOOLBAR ============================ */
function wireToolbar() {
  $('rfi-add-row').onclick = addRow;
  $('rfi-pdf').onclick = () => window.print();
  $('rfi-zip').onclick = exportZip;
  const bt = $('rfi-theme');
  if (bt) bt.onclick = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('rfiTheme', next); } catch (e) {}
  };
}

async function exportZip() {
  try {
    if (typeof JSZip === 'undefined') { toast('Đang tải thư viện nén…'); await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'); }
    const zip = new JSZip();
    let count = 0;
    for (const row of rows) {
      const stt = (row.stt || row.id).toString().trim();
      for (const [field, tag] of [['yeuCauImages', 'YC'], ['traLoiImages', 'TL']]) {
        const arr = row[field] || [];
        for (let i = 0; i < arr.length; i++) {
          try {
            const src = arr[i].dataUrl || arr[i].url || '';
            if (src.startsWith('data:')) {
              zip.file(`${stt}_${tag}_${i + 1}.jpg`, src.split(',')[1], { base64: true });
              count++;
            } else if (src) {
              const resp = await fetch(src); const blob = await resp.blob();
              zip.file(`${stt}_${tag}_${i + 1}.jpg`, blob); count++;
            }
          } catch (e) { console.warn('Bỏ qua ảnh lỗi', e); }
        }
      }
    }
    if (!count) { toast('Không có ảnh để tải.', 'err'); return; }
    toast('Đang nén ' + count + ' ảnh…');
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'RFI_' + (PROJECT.slug || PID) + '_images.zip';
    a.click();
    toast('Đã tải ' + count + ' ảnh.', 'ok');
  } catch (e) { toast('Lỗi tạo ZIP: ' + (e.message || e.code), 'err'); }
}

/* ============================ MODAL ẢNH ============================ */
function openImage(src) {
  let modal = $('rfi-image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rfi-image-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.9);display:flex;justify-content:center;align-items:center;z-index:10001;cursor:zoom-out;backdrop-filter:blur(5px);';
    const img = document.createElement('img');
    img.id = 'rfi-image-modal-img';
    img.style.cssText = 'max-width:92%;max-height:92%;object-fit:contain;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    modal.appendChild(img);
    modal.onclick = () => { modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }
  $('rfi-image-modal-img').src = src;
  modal.style.display = 'flex';
}
