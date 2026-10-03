// Sinh dist/sitemap.xml từ các trang HTML công khai trong public/ (chạy trong postbuild).
// lastmod lấy từ commit git gần nhất của từng file.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ORIGIN = 'https://ividlab.com';
const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
// Không đưa vào sitemap: khu vực quản trị/đăng nhập, trang chuyển hướng, trang nội bộ.
const SKIP = [/^admin\//, /^rficonsole\//, /^vietduongphoto\//, /^amc-private\//, /^brand-guidelines\.html$/,
  /^tekla\/component\/index\.html$/, /^tekla\/peb-member\/index\.html$/];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function lastmod(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: root, encoding: 'utf8' }).trim();
    if (d) return d;
  } catch { /* không có git */ }
  return new Date().toISOString().slice(0, 10);
}

const urls = [{ loc: `${ORIGIN}/`, lastmod: lastmod('index.html'), priority: '1.0' }];
for (const f of walk(pub).sort()) {
  const rel = path.relative(pub, f).split(path.sep).join('/');
  if (SKIP.some((re) => re.test(rel))) continue;
  urls.push({ loc: `${ORIGIN}/${rel.replace(/index\.html$/, '')}`, lastmod: lastmod(path.join('public', rel)), priority: '0.7' });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n') +
  '\n</urlset>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URL`);
