// Chèn khối SEO (description, canonical, Open Graph, JSON-LD) vào các trang tĩnh chưa có.
// Idempotent: bỏ qua trang đã có <link rel="canonical">. Chạy: node scripts/add-seo-meta.cjs
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://ividlab.com';
const OG_IMAGE = `${ORIGIN}/og-default.png`;
const ADS = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234924381658348" crossorigin="anonymous"></script>';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const PAGES = {
  'autocad/chiase/tuy-chinh-lenh-autolisp.html': {
    type: 'Article',
    desc: 'Hướng dẫn từng bước mở file Lisp (.lsp) bằng Notepad và đổi tên lệnh AutoLISP thành lệnh ngắn theo thói quen, an toàn và không làm hỏng chương trình.',
  },
  'autocad/chiase/huong-dan-appload-lisp-autocad.html': {
    type: 'Article',
    desc: 'Cách dùng lệnh APPLOAD tải file .lsp, .fas, .vlx vào AutoCAD và thiết lập Startup Suite để tự động nạp Lisp mỗi khi mở phần mềm.',
  },
  'autocad/chiase/huong-dan-netload-dll-autocad.html': {
    type: 'Article',
    desc: 'Quy trình nạp plugin .DLL viết bằng C#/VB.NET vào AutoCAD bằng lệnh NETLOAD, cách Unblock file tải về và xử lý lỗi file bị khóa.',
  },
  'autocad/chiase/phan-biet-appload-va-netload-trong-autocad.html': {
    type: 'Article',
    desc: 'So sánh APPLOAD (Lisp/ARX) và NETLOAD (DLL .NET) trong AutoCAD: bản chất, ưu nhược điểm và khi nào nên dùng lệnh nào.',
  },
  'autocad/chiase/huong-dan-lenh-layiso-autocad.html': {
    type: 'Article',
    desc: 'Hướng dẫn toàn tập lệnh LAYISO trong AutoCAD: cô lập layer của đối tượng đã chọn, cách khôi phục layer và cách đặt chế độ hiển thị (ẩn hoặc làm mờ) cho các layer còn lại.',
  },
  'autocad/autolisp/autocad-lisp-vexago.html': {
    type: 'SoftwareApplication',
    name: 'DrawPurlin Lisp (VEXAGO)',
    desc: 'Lisp AutoCAD vẽ tiết diện xà gồ C và Z cán nguội tự động, bo góc R2T–R3T chính xác, nhớ thông số lần trước. Miễn phí.',
  },
  'autocad/autolisp/autolisp-layiso-layer-manager.html': {
    type: 'SoftwareApplication',
    name: 'Layiso Suite – phím tắt quản lý Layer & Linetype',
    desc: 'Bộ Lisp phím tắt giúp quản lý Layer và Linetype trong AutoCAD nhanh hơn, dựa trên lệnh LAYISO. Miễn phí.',
  },
  'autocad/autolisp/autolisp-merge-hatch-mh.html': {
    type: 'SoftwareApplication',
    name: 'Merge Hatch (MH) – gộp Hatch rời rạc',
    desc: 'Lisp AutoCAD gộp nhiều vùng Hatch rời rạc thành một đối tượng duy nhất bằng lệnh MH. Miễn phí.',
  },
  'autocad/autolisp/autolisp-quick-block-bb.html': {
    type: 'SoftwareApplication',
    name: 'Quick Block (BB) – tạo Block nhanh',
    desc: 'Lisp AutoCAD tạo Block nhanh bằng lệnh BB, tự động đặt tên Block theo giây để không bị trùng tên. Miễn phí.',
  },
  'trial/index.html': {
    type: 'WebPage',
    desc: 'Nhập Product Key từ hộp thoại License của plugin A-Soft để nhận ngay license dùng thử miễn phí 90 ngày, không cần chờ, không cần liên hệ.',
    ads: true,
  },
};

function block(rel, cfg, title) {
  const url = `${ORIGIN}/${rel.replace(/index\.html$/, '')}`;
  const name = cfg.name || title;
  const ld = { '@context': 'https://schema.org', '@type': cfg.type, url, description: cfg.desc,
    inLanguage: 'vi', publisher: { '@type': 'Organization', name: 'iViDLab', url: ORIGIN } };
  if (cfg.type === 'Article') { ld.headline = title; ld.image = OG_IMAGE; ld.author = ld.publisher; }
  else if (cfg.type === 'SoftwareApplication') {
    Object.assign(ld, { name, applicationCategory: 'DesignApplication', operatingSystem: 'Windows',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' } });
  } else ld.name = name;
  return [
    `  <meta name="description" content="${esc(cfg.desc)}" />`,
    `  <link rel="canonical" href="${url}" />`,
    `  <meta property="og:type" content="${cfg.type === 'Article' ? 'article' : 'website'}" />`,
    `  <meta property="og:site_name" content="iViDLab" />`,
    `  <meta property="og:locale" content="vi_VN" />`,
    `  <meta property="og:title" content="${esc(title)}" />`,
    `  <meta property="og:description" content="${esc(cfg.desc)}" />`,
    `  <meta property="og:url" content="${url}" />`,
    `  <meta property="og:image" content="${OG_IMAGE}" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <script type="application/ld+json">${JSON.stringify(ld)}</script>`,
  ].join('\n');
}

for (const [rel, cfg] of Object.entries(PAGES)) {
  const file = path.join(__dirname, '..', 'public', rel);
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('rel="canonical"')) { console.log('skip  ', rel); continue; }
  const m = html.match(/<title>([^<]*)<\/title>/);
  if (!m) { console.log('NO TITLE', rel); continue; }
  const title = m[1].replace(/\s*[-—]\s*(iViDLab|A-Soft License)\s*$/, '').trim();
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  let ins = block(rel, cfg, title).replace(/\n/g, eol);
  // trang đã có <meta name="description"> riêng thì không chèn trùng
  if (/<meta name="description"/.test(html)) ins = ins.split(eol).slice(1).join(eol);
  html = html.replace(m[0], m[0] + eol + ins);
  if (cfg.ads && !html.includes('pagead2')) {
    html = html.replace(/<meta charset="UTF-8"\s*\/?>/i, (c) => `${c}${eol}  <!-- Google AdSense -->${eol}  ${ADS}${eol}  <script type="module" src="/traffic-track.js"></script>`);
  }
  fs.writeFileSync(file, html);
  console.log('patched', rel);
}
