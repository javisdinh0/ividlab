// Gắn ?v=<hash nội dung> vào tham chiếu tới các file dùng chung của trang tĩnh (chạy trong postbuild).
//
// Cùng lý do với stamp-rficonsole.cjs: file trong public/ giữ nguyên tên khi build, Cloudflare cache
// .js/.css 4 giờ, nên sau deploy trang HTML mới có thể chạy với article.js cũ (vd. video không phát).
// Nguồn không cần sửa: script tìm đúng chuỗi src/href trong dist/**/*.html và thêm mã phiên bản.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST = path.join(__dirname, '..', 'dist');
const ASSETS = ['/tekla/peb-member/assets/article.js', '/tekla/peb-member/assets/article.css', '/traffic-track.js'];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const versions = Object.fromEntries(ASSETS.map((a) => {
  const text = fs.readFileSync(path.join(DIST, a), 'utf8').replace(/\r\n/g, '\n');
  return [a, crypto.createHash('sha1').update(text).digest('hex').slice(0, 10)];
}));

let stamped = 0;
for (const f of walk(DIST)) {
  const s = fs.readFileSync(f, 'utf8');
  let out = s;
  for (const a of ASSETS) out = out.split(`="${a}"`).join(`="${a}?v=${versions[a]}"`);
  if (out !== s) {
    fs.writeFileSync(f, out);
    stamped++;
  }
}
console.log(`stamp-assets: ${stamped} trang (${Object.values(versions).join(', ')})`);
