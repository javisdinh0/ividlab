// Sinh các trang bài hướng dẫn AutoCAD từ scripts/guides-src.cjs, dùng vỏ (header/CSS/script) của
// bài "phân biệt APPLOAD vs NETLOAD". Ghi ra public/autocad/chiase/<slug>.html.
// Chạy: node scripts/build-guides.cjs   (ghi đè các trang trong guides-src.cjs, không động vào bài khác)
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://ividlab.com';
const root = path.join(__dirname, '..');
const SHELL = path.join(root, 'public/autocad/chiase/phan-biet-appload-va-netload-trong-autocad.html');
const articles = require('./guides-src.cjs');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Thẻ "Có thể bạn quan tâm": tiêu đề các bài hiện có + bài mới.
const CARDS = {
  'huong-dan-appload-lisp-autocad': ['Hướng Dẫn Nạp Lisp Bằng APPLOAD', 'Guide to Load Lisp via APPLOAD'],
  'huong-dan-netload-dll-autocad': ['Hướng Dẫn NETLOAD Nạp Plugin DLL', 'NETLOAD Guide for DLL Plugins'],
  'tuy-chinh-lenh-autolisp': ['Cách Tùy Chỉnh Phím Tắt Lệnh AutoLISP', 'How to Customize AutoLISP Commands'],
  'phan-biet-appload-va-netload-trong-autocad': ['Phân Biệt APPLOAD và NETLOAD', 'APPLOAD vs NETLOAD'],
  'huong-dan-lenh-layiso-autocad': ['Hướng Dẫn Toàn Tập Lệnh LAYISO', 'Complete Guide to LAYISO'],
};
for (const a of articles) CARDS[a.slug] = [a.title, a.titleEn];

function renderBlock([type, vi, en]) {
  const both = (tag, v, e, attr = '') => `    <${tag} data-lang="vi"${attr}>${v}</${tag}>\n    <${tag} data-lang="en"${attr}>${e}</${tag}>`;
  if (type === 'p') return both('p', vi, en);
  if (type === 'h2' || type === 'h3') return both(type, vi, en);
  if (type === 'ul') {
    const li = vi.map((v, i) => `      <li><span data-lang="vi">${v}</span><span data-lang="en">${en[i]}</span></li>`).join('\n');
    return `    <ul>\n${li}\n    </ul>`;
  }
  if (type === 'tip') {
    return `    <div class="tip-box">\n      <strong data-lang="vi">${vi[0]}</strong>\n      <strong data-lang="en">${en[0]}</strong>\n` +
      `      <p data-lang="vi">${vi[1]}</p>\n      <p data-lang="en">${en[1]}</p>\n    </div>`;
  }
  throw new Error('block type ' + type);
}

function build(a) {
  let html = fs.readFileSync(SHELL, 'utf8').replace(/\r\n/g, '\n');
  const url = `${ORIGIN}/autocad/chiase/${a.slug}.html`;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, url, description: a.desc,
    image: `${ORIGIN}/og-default.png`, inLanguage: 'vi', datePublished: a.date || '2026-10-03',
    author: { '@type': 'Organization', name: 'iViDLab', url: ORIGIN }, publisher: { '@type': 'Organization', name: 'iViDLab', url: ORIGIN } });
  const head = [
    `  <title>${esc(a.title)} - iViDLab</title>`,
    `  <meta name="description" content="${esc(a.desc)}" />`,
    `  <link rel="canonical" href="${url}" />`,
    `  <meta property="og:type" content="article" />`,
    `  <meta property="og:site_name" content="iViDLab" />`,
    `  <meta property="og:locale" content="vi_VN" />`,
    `  <meta property="og:title" content="${esc(a.title)}" />`,
    `  <meta property="og:description" content="${esc(a.desc)}" />`,
    `  <meta property="og:url" content="${url}" />`,
    `  <meta property="og:image" content="${ORIGIN}/og-default.png" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <script type="application/ld+json">${ld}</script>`,
  ].join('\n');
  // thay cụm từ <title> đến ngay trước <link rel="icon">
  html = html.replace(/  <title>[\s\S]*?(?=  <link rel="icon")/, head + '\n');

  const body = [
    `  <div class="article-container">`,
    `    <span class="badge" data-lang="vi">${a.badge}</span>`,
    `    <span class="badge" data-lang="en">${a.badgeEn}</span>`,
    '',
    `    <h1 data-lang="vi">${a.title}</h1>`,
    `    <h1 data-lang="en">${a.titleEn}</h1>`,
    '',
    a.body.map(renderBlock).join('\n\n'),
    '',
    `    <hr style="margin: 40px 0; border: none; border-top: 1px solid var(--border-color);">`,
    `    <p style="text-align: center; font-style: italic; color: var(--text-muted); margin-bottom: 0;">`,
    `      <span data-lang="vi">Tài liệu được nghiên cứu và tổng hợp bởi đội ngũ kỹ thuật <a href="https://ividlab.com/">iViDLab.com</a>.</span>`,
    `      <span data-lang="en">Document researched and compiled by the <a href="https://ividlab.com/">iViDLab.com</a> technical team.</span>`,
    `    </p>`,
    `  </div>`,
    `  <div class="related-container">`,
    `    <h2 data-lang="vi" style="margin-top:0; border-bottom: none; font-size: 1.8rem;">Có thể bạn quan tâm</h2>`,
    `    <h2 data-lang="en" style="margin-top:0; border-bottom: none; font-size: 1.8rem;">You might also be interested in</h2>`,
    `    <div class="related-grid">`,
    ...a.related.map((s) => `      <a class="related-card" href="/autocad/chiase/${s}.html">\n        <span class="badge">Knowledge Share</span>\n` +
      `        <h3><span data-lang="vi">${CARDS[s][0]}</span><span data-lang="en">${CARDS[s][1]}</span></h3>\n      </a>`),
    `    </div>`,
    `  </div>`,
    '',
  ].join('\n');
  html = html.replace(/  <div class="article-container">[\s\S]*?(?=  <footer)/, body + '\n');
  return html;
}

for (const a of articles) {
  const out = path.join(root, 'public/autocad/chiase', `${a.slug}.html`);
  fs.writeFileSync(out, build(a));
  console.log('wrote', path.relative(root, out));
}
