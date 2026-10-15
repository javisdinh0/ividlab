// Gắn mã phiên bản vào mọi tham chiếu nội bộ của /rficonsole (chạy trong postbuild).
//
// Nguồn trong public/rficonsole/** viết "?v=__BUILD__" ở mọi <script src>, <link href> và import nội bộ;
// file tương ứng trong dist/ được thay bằng hash nội dung (10 ký tự hex).
//
// Vì sao: file trong public/ được Vite chép nguyên văn (không có hash trong tên) và Cloudflare đặt
// Cache-Control max-age=14400 (4 giờ) cho .js/.css — người dùng kẹt bản cũ tới 4 giờ sau mỗi lần deploy.
// index.html chỉ cache ~10 phút; khi nó trỏ tới auth.js?v=<hash mới> thì cả chuỗi import được tải lại.
//
// Hash tính trên nội dung CHƯA thay (CRLF chuẩn hóa về LF) nên ổn định giữa các máy và giữa các lần build:
// không đổi nội dung rficonsole thì mã phiên bản không đổi, deploy báo "không có gì thay đổi" như cũ.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = path.join(__dirname, '..', 'dist', 'rficonsole');
const PLACEHOLDER = '__BUILD__';
const TEXT = /\.(html|js|css)$/i;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

if (!fs.existsSync(DIR)) {
  console.error('✗ stamp-rficonsole: không thấy dist/rficonsole — chạy sau vite build.');
  process.exit(1);
}

const files = walk(DIR).sort();
const hash = crypto.createHash('sha1');
for (const f of files) {
  hash.update(path.relative(DIR, f).split(path.sep).join('/') + '\n');
  hash.update(TEXT.test(f) ? fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : fs.readFileSync(f));
}
const version = hash.digest('hex').slice(0, 10);

let stamped = 0;
for (const f of files.filter((x) => TEXT.test(x))) {
  const s = fs.readFileSync(f, 'utf8');
  if (!s.includes(PLACEHOLDER)) continue;
  fs.writeFileSync(f, s.split(PLACEHOLDER).join(version));
  stamped++;
}

if (!stamped) {
  console.error(`✗ stamp-rficonsole: không file nào chứa ${PLACEHOLDER} — kiểm tra lại ?v=${PLACEHOLDER} trong public/rficonsole.`);
  process.exit(1);
}
const left = files.filter((x) => TEXT.test(x) && fs.readFileSync(x, 'utf8').includes(PLACEHOLDER));
if (left.length) {
  console.error('✗ stamp-rficonsole: còn sót ' + PLACEHOLDER + ' trong:\n' + left.join('\n'));
  process.exit(1);
}
console.log(`rficonsole: v=${version} (${stamped} file)`);
