// Dựng sẵn HTML cho từng tab của SPA (chạy trong postbuild, sau `vite build --ssr src/entry-server.jsx`).
//
// Vì sao: index.html gốc chỉ có <div id="root"></div> — chữ chỉ hiện sau khi tải + chạy xong bundle JS
// (chậm LCP), crawler không chạy JS (Facebook/Zalo xem trước link, Bing…) thấy trang trống, và mọi tab
// dùng chung một URL/canonical nên không tab nào được index riêng.
// Mỗi mục trong src/routes.json -> dist/<path>/index.html với nội dung React render sẵn + title/description/
// canonical/og riêng. Trình duyệt vẫn chạy SPA như cũ (main.jsx createRoot thay nội dung dựng sẵn).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SSR_DIR = path.join(ROOT, 'dist-ssr');
const ORIGIN = 'https://ividlab.com';

const entry = path.join(SSR_DIR, 'entry-server.js');
if (!fs.existsSync(entry)) {
  console.error('✗ prerender: không thấy dist-ssr/entry-server.js — build bằng `npm run build`.');
  process.exit(1);
}
const { render, ROUTES, SOURCES, translations } = await import(pathToFileURL(entry).href);

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) {
  console.error('✗ prerender: dist/index.html không có <div id="root"></div>.');
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON nhúng trong <script>: chặn "</script>" (U+2028/2029 hợp lệ trong chuỗi JS từ ES2019)
const jsonForScript = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`thiếu <meta ${attr}="${key}"> trong index.html`);
  return html.replace(re, `$1${esc(value)}$2`);
}

const postLists = SOURCES.map((s) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public', s.url), 'utf8')));
const vi = translations.vi;

for (const route of ROUTES) {
  const withPosts = route.tab === 'tekla-component';
  const body = render(route.tab, withPosts ? postLists : undefined);
  let html = template.replace('<div id="root"></div>',
    `<div id="root">${body}</div>` +
    (withPosts ? `\n    <script>window.__IVIDLAB_DATA__=${jsonForScript({ postLists })}</script>` : ''));

  if (route.tab !== 'all') {
    const title = `${vi[route.i18n].title} — iViDLab`;
    const url = ORIGIN + route.path;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    html = setMeta(html, 'name', 'description', route.description);
    html = setMeta(html, 'property', 'og:title', title);
    html = setMeta(html, 'property', 'og:description', route.description);
    html = setMeta(html, 'property', 'og:url', url);
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
    const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'iViDLab', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: vi[route.i18n].title, item: url }] };
    html = html.replace('</head>', `  <script type="application/ld+json">${jsonForScript(crumbs)}</script>\n  </head>`);
  }

  const out = path.join(DIST, route.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

fs.rmSync(SSR_DIR, { recursive: true, force: true });
console.log(`prerender: ${ROUTES.length} trang (${ROUTES.map((r) => r.path).join(' ')})`);
