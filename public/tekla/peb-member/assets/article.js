/*
 * Hành vi dùng chung cho các trang chuyên mục PEB Member (public/tekla/peb-member/*.html):
 *  - công tắc Sáng/Tối và nút VN/EN (dùng chung key localStorage với SPA),
 *  - ảnh minh hoạ: phóng to khi bấm; ảnh chưa có thì hiện chỗ trống trên máy dev, ẩn trên site thật,
 *  - hộp Tải về: combobox phiên bản Tekla -> đúng gói .tsep (đọc downloads.json),
 *  - khối Dùng thử qua email (downloads-*.json có "trialMail"): tự hiện dưới hộp Tải về, soạn sẵn thư có
 *    Product Key gửi iViDLab; bot MailBot (repo A-Soft License) trả lời bằng Active Key,
 *  - mục "Bài viết khác trong chuyên mục" (đọc posts.json).
 * Theme/ngôn ngữ ban đầu do đoạn script nhỏ trong <head> đặt sẵn để trang không bị nháy.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const CATEGORY = '/tekla/peb-member/';
  const ZALO_GROUP_URL = 'https://zalo.me/g/jqsxa7ptubdcqxf5inwz';
  const TEKLA_CHOICE_KEY = 'peb-member-tekla-version';

  const TEXT = {
    vi: {
      missingMedia: 'Chưa có ảnh — cần bổ sung file',
      dlEyebrow: 'Tải về',
      dlTitle: 'Tải PEB Member',
      dlChoose: 'Chọn phiên bản Tekla Structures bạn đang dùng',
      dlPlaceholder: '— Chọn phiên bản Tekla —',
      dlIdle: 'Chọn phiên bản Tekla để tải',
      dlButton: 'Tải về cho {tekla}',
      dlNoPackage: 'Chưa có gói cho phiên bản này',
      dlPackage: 'Gói cài đặt',
      // "Cài được trên": đúng nghĩa khoảng phiên bản khai trong gói .tsep (chưa hẳn là đã kiểm thử hết).
      dlCompat: 'Cài được trên',
      dlSize: 'Dung lượng',
      dlUnsupported: 'Hiện chưa có gói cài đặt chính thức cho phiên bản Tekla này. Vui lòng báo trong',
      dlUnsupportedEnd: 'để được hỗ trợ.',
      dlWhatsNew: 'Có gì mới trong bản {version}',
      dlError: 'Không tải được danh sách phiên bản. Vui lòng tải lại trang hoặc báo trong nhóm Zalo người dùng.',
      zaloGroup: 'nhóm Zalo người dùng',
      trialTitle: 'Tự kích hoạt dùng thử 90 ngày',
      trialIntro: 'Chép Product Key trong cửa sổ License của PEB Tools VN, dán vào ô dưới đây cùng email rồi bấm Nhận key — Active Key hiện ngay, không cần chờ.',
      trialProductKey: 'Product Key',
      trialProductKeyHint: 'Dán Product Key (bắt đầu bằng PT1-)',
      trialEmail: 'Email',
      trialSubmit: 'Nhận key dùng thử',
      trialBusy: 'Đang xử lý…',
      trialDone: 'Active Key dùng thử 90 ngày cho {product}:',
      trialCopy: 'Chép Active Key',
      trialNext: 'Dán key này vào ô Active Key trong cửa sổ License rồi bấm Activate.',
      trialAgain: 'Kích hoạt máy khác',
      trialAlt: 'Cần dùng thử phần mềm khác của iViDLab? Mở',
      trialAltLink: 'trang dùng thử',
      trialNetwork: 'Không kết nối được máy chủ cấp key. Vui lòng thử lại sau.',
      errEmail: 'Vui lòng nhập email hợp lệ.',
      errKeyMissing: 'Vui lòng dán Product Key.',
      errKeyBroken: 'Product Key bị thiếu hoặc thừa ký tự. Hãy bấm Copy trong cửa sổ License của PEB Tools VN rồi dán lại cả chuỗi.',
      errKeyOther: 'Đây không phải Product Key của PEB Tools VN. Hãy chép Product Key trong cửa sổ License của PEB Tools VN.',
      errUsedMachine: 'Máy này đã được cấp key dùng thử trước đây. Nếu cần hỗ trợ, vui lòng báo trong nhóm Zalo người dùng.',
      errUsedEmail: 'Email này đã nhận key dùng thử PEB Tools VN trước đây. Nếu cần hỗ trợ, vui lòng báo trong nhóm Zalo người dùng.',
      errRateLimit: 'Bạn gửi hơi nhiều yêu cầu. Vui lòng đợi 1 phút rồi thử lại.',
      errServer: 'Chưa cấp được key ({message}). Vui lòng thử lại sau hoặc báo trong nhóm Zalo người dùng.',
      mailTitle: 'Dùng thử {days} ngày qua email',
      mailIntro: 'Trong Tekla mở hộp thoại {product} > tab License, bấm Copy để chép Product Key rồi dán vào ô dưới. Bạn gửi một thư có Product Key tới iViDLab, thư trả lời kèm Active Key sẽ về đúng hộp thư đó trong khoảng 5–10 phút.',
      mailKeyHint: 'Dán Product Key (bắt đầu bằng {tag}-)',
      mailNext: 'Tiếp tục',
      mailErrKey: 'Product Key bị thiếu hoặc thừa ký tự. Hãy bấm Copy trong tab License của {product} rồi dán lại cả chuỗi.',
      mailErrOther: 'Đây không phải Product Key của {product} (Product Key phải bắt đầu bằng {tag}-).',
      mailReady: 'Product Key hợp lệ. Chọn cách gửi thư — nội dung đã soạn sẵn, chỉ cần bấm Gửi:',
      mailApp: 'Mở chương trình mail',
      mailManual: 'Hoặc tự gửi thư tới {to} với nội dung:',
      mailCopyAddr: 'Chép địa chỉ',
      mailCopyBody: 'Chép nội dung thư',
      mailNote: 'Mỗi máy được dùng thử một lần; key gửi về đúng địa chỉ bạn dùng để gửi thư. Sau 15 phút chưa thấy thư trả lời: xem thư mục Spam, hoặc báo trong nhóm Zalo người dùng.',
      mailBack: 'Sửa Product Key',
      mailSubject: '{product} trial {tag}',
      mailBody: 'Xin key dùng thử {product} / {product} trial request\r\n\r\nProduct Key: {key}\r\n\r\n(Thư được đọc tự động — vui lòng giữ nguyên dòng Product Key.)',
      copied: '✔ Đã chép'
    },
    en: {
      missingMedia: 'Media not added yet — missing file',
      dlEyebrow: 'Download',
      dlTitle: 'Download PEB Member',
      dlChoose: 'Select the Tekla Structures version you use',
      dlPlaceholder: '— Select your Tekla version —',
      dlIdle: 'Select a Tekla version to download',
      dlButton: 'Download for {tekla}',
      dlNoPackage: 'No package for this version yet',
      dlPackage: 'Package',
      dlCompat: 'Installs on',
      dlSize: 'Size',
      dlUnsupported: 'There is no official package for this Tekla version yet. Please report it in the',
      dlUnsupportedEnd: 'for support.',
      dlWhatsNew: "What's new in {version}",
      dlError: 'Could not load the version list. Please reload the page or report it in the Zalo user group.',
      zaloGroup: 'Zalo user group',
      trialTitle: 'Activate a 90-day trial yourself',
      trialIntro: 'Copy the Product Key from the PEB Tools VN License window, paste it below with your email and click Get key — the Active Key appears right away, no waiting.',
      trialProductKey: 'Product Key',
      trialProductKeyHint: 'Paste the Product Key (starts with PT1-)',
      trialEmail: 'Email',
      trialSubmit: 'Get a trial key',
      trialBusy: 'Working…',
      trialDone: '90-day trial Active Key for {product}:',
      trialCopy: 'Copy Active Key',
      trialNext: 'Paste this key into the Active Key box of the License window, then click Activate.',
      trialAgain: 'Activate another computer',
      trialAlt: 'Trying another iViDLab product? Open the',
      trialAltLink: 'trial page',
      trialNetwork: 'Could not reach the key server. Please try again later.',
      errEmail: 'Please enter a valid email address.',
      errKeyMissing: 'Please paste your Product Key.',
      errKeyBroken: 'The Product Key is incomplete or has extra characters. Click Copy in the PEB Tools VN License window and paste the whole string again.',
      errKeyOther: 'This is not a PEB Tools VN Product Key. Copy the Product Key from the PEB Tools VN License window.',
      errUsedMachine: 'A trial key has already been issued for this computer. If you need help, please ask in the Zalo user group.',
      errUsedEmail: 'This email has already received a PEB Tools VN trial key. If you need help, please ask in the Zalo user group.',
      errRateLimit: 'Too many requests. Please wait a minute and try again.',
      errServer: 'Could not issue a key ({message}). Please try again later or ask in the Zalo user group.',
      mailTitle: '{days}-day trial by email',
      mailIntro: 'In Tekla, open the {product} dialog > License tab, click Copy to copy the Product Key and paste it below. You send iViDLab one email with the Product Key; the reply with your Active Key arrives in that same mailbox within about 5–10 minutes.',
      mailKeyHint: 'Paste the Product Key (starts with {tag}-)',
      mailNext: 'Continue',
      mailErrKey: 'The Product Key is incomplete or has extra characters. Click Copy in the {product} License tab and paste the whole string again.',
      mailErrOther: 'This is not a {product} Product Key (it must start with {tag}-).',
      mailReady: 'Product Key looks good. Choose how to send the email — it is already written, just click Send:',
      mailApp: 'Open my mail app',
      mailManual: 'Or send an email yourself to {to} with this text:',
      mailCopyAddr: 'Copy address',
      mailCopyBody: 'Copy email text',
      mailNote: 'One trial per computer; the key is sent to the address you email from. No reply after 15 minutes? Check your Spam folder, or ask in the Zalo user group.',
      mailBack: 'Edit Product Key',
      mailSubject: '{product} trial {tag}',
      mailBody: 'Xin key dùng thử {product} / {product} trial request\r\n\r\nProduct Key: {key}\r\n\r\n(Thư được đọc tự động — vui lòng giữ nguyên dòng Product Key.)',
      copied: '✔ Copied'
    }
  };

  // localStorage có thể bị chặn (chế độ riêng tư, chặn cookie) — trang vẫn phải chạy bình thường.
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* bỏ qua */ } }
  };

  const lang = () => (root.classList.contains('lang-en') ? 'en' : 'vi');
  const t = (key, vars = {}) => TEXT[lang()][key].replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
  // Trường song ngữ trong JSON có dạng { vi, en } hoặc là chuỗi dùng chung.
  const pick = (value) => (value && typeof value === 'object' ? value[lang()] || value.vi : value || '');
  const langListeners = [];

  function formatDate(iso) {
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso || '';
    return lang() === 'en'
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child != null && child !== false) node.append(child);
    }
    return node;
  }

  async function fetchJson(url) {
    // no-cache = luôn hỏi lại server (GitHub Pages cache ~10 phút) để bản mới hiện ngay.
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res.json();
  }

  /* ---------- Theme ---------- */
  function initTheme() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sync = () => {
      const dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-checked', String(dark));
      btn.querySelector('.theme-switch-thumb').textContent = dark ? '🌙' : '☀️';
    };
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      storage.set('ividlab-theme', next);
      sync();
    });
    sync();
  }

  /* ---------- Ngôn ngữ ---------- */
  function initLang() {
    const btn = document.getElementById('lang-toggle');
    const titleEl = document.querySelector('title');
    const titles = { vi: titleEl.textContent, en: titleEl.dataset.en || titleEl.textContent };
    const sync = () => {
      root.lang = lang();
      document.title = titles[lang()];
      if (btn) btn.textContent = `🌐 ${lang().toUpperCase()}`;
    };
    if (btn) {
      btn.addEventListener('click', () => {
        root.classList.toggle('lang-en');
        storage.set('ividlab-lang', lang());
        sync();
        langListeners.forEach((render) => render());
      });
    }
    sync();
  }

  /* ---------- Ảnh minh hoạ ---------- */
  const isLocalPreview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  function openLightbox(src, alt, isVideo) {
    const media = isVideo
      ? h('video', { src, muted: '', loop: '', autoplay: '', playsinline: '', 'aria-label': alt || '' })
      : h('img', { src, alt: alt || '' });
    if (isVideo) media.muted = true; // thuộc tính muted qua setAttribute chưa đủ để autoplay
    const box = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': alt || 'Image' }, media);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const close = () => {
      box.remove();
      document.removeEventListener('keydown', onKey);
    };
    box.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.append(box);
  }

  function initFigures() {
    document.querySelectorAll('figure.media img').forEach((img) => {
      const fail = () => {
        const figure = img.closest('figure');
        // Site thật: ẩn khung ảnh chưa có để bài vẫn liền mạch. Máy dev: chỉ rõ file còn thiếu.
        if (!isLocalPreview) {
          figure.hidden = true;
          return;
        }
        img.replaceWith(h('div', { class: 'media-placeholder' },
          h('strong', { text: `📷 ${t('missingMedia')}` }),
          h('code', { text: img.getAttribute('src') })));
      };
      if (img.complete && img.naturalWidth === 0) fail();
      else img.addEventListener('error', fail, { once: true });
      img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
    });

    // Hình động (GIF đã đổi sang mp4 — scripts/optimize-media.cjs): chỉ tải/phát khi lọt vào màn hình,
    // nên bản ngôn ngữ đang ẩn không tốn băng thông. Bật "giảm chuyển động" thì không tự phát, hiện nút điều khiển.
    const videos = document.querySelectorAll('figure.media video[data-autoplay]');
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = !reduceMotion && 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => { target.controls = true; });
        else target.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach((video) => {
      video.muted = true;
      video.addEventListener('error', () => {
        if (!isLocalPreview) video.closest('figure').hidden = true;
      }, { once: true });
      if (io) io.observe(video);
      else video.controls = true;
      video.addEventListener('click', () => {
        if (video.controls) return; // đang dùng nút điều khiển thì để trình duyệt xử lý
        openLightbox(video.currentSrc || video.src, video.getAttribute('aria-label'), true);
      });
    });
  }

  /* ---------- Tải về theo phiên bản Tekla ---------- */
  function setDownloadButton(button, label, href, fileName) {
    button.textContent = href ? `⬇ ${label}` : label;
    if (href) {
      button.href = href;
      button.setAttribute('download', fileName);
      button.removeAttribute('aria-disabled');
    } else {
      button.removeAttribute('href');
      button.removeAttribute('download');
      button.setAttribute('aria-disabled', 'true');
    }
  }

  async function initDownload(box, index) {
    let data;
    try {
      data = await fetchJson(box.dataset.pebDownload || `${CATEGORY}downloads.json`);
    } catch (err) {
      console.error(err);
      box.replaceChildren(h('div', { class: 'download-info download-info--warn' },
        h('p', { text: t('dlError') })));
      return;
    }

    let selected = storage.get(TEKLA_CHOICE_KEY) || '';
    if (!data.tekla.some((item) => item.value === selected)) selected = '';

    // Khối dùng thử qua email: giữ Product Key đã dán qua các lần vẽ lại (đổi VI/EN).
    const mailState = data.trialMail ? { key: '', error: null, ready: '' } : null;
    let mailHolder = null;
    const renderMail = () => {
      if (mailHolder) mailHolder.replaceChildren(mailTrialCard(data.trialMail, index, mailState, renderMail));
    };

    const render = () => {
      const select = h('select', { id: `tekla-version-${index}` },
        h('option', { value: '', text: t('dlPlaceholder') }),
        data.tekla.map((item) => h('option', { value: item.value, selected: item.value === selected, text: pick(item.label) })));
      const info = h('div', { class: 'download-info', 'aria-live': 'polite' });
      const button = h('a', { class: 'btn btn--primary btn-download' });

      const update = () => {
        selected = select.value;
        storage.set(TEKLA_CHOICE_KEY, selected);
        const choice = data.tekla.find((item) => item.value === selected);
        const pkg = choice && choice.package ? data.packages[choice.package] : null;

        if (!choice) {
          info.hidden = true;
          setDownloadButton(button, t('dlIdle'));
        } else if (!pkg || !pkg.file) {
          info.hidden = false;
          info.className = 'download-info download-info--warn';
          info.replaceChildren(h('p', {},
            `${t('dlUnsupported')} `,
            h('a', { href: ZALO_GROUP_URL, target: '_blank', rel: 'noopener', text: t('zaloGroup') }),
            ` ${t('dlUnsupportedEnd')}`));
          setDownloadButton(button, t('dlNoPackage'));
        } else {
          info.hidden = false;
          info.className = 'download-info';
          info.replaceChildren(h('dl', {},
            h('dt', { text: t('dlPackage') }), h('dd', { text: pkg.saveAs || pkg.file }),
            h('dt', { text: t('dlCompat') }), h('dd', { text: `Tekla Structures ${pkg.range}` }),
            h('dt', { text: t('dlSize') }), h('dd', { text: pkg.size })));
          setDownloadButton(button, t('dlButton', { tekla: pick(choice.label) }), data.baseUrl + pkg.file, pkg.saveAs || pkg.file);
          button.onclick = () => { try { window.iViDTrack && window.iViDTrack.download(choice.package); } catch (e) { /* bỏ qua */ } };
        }
      };
      select.addEventListener('change', update);

      const notes = data.notes && pick(data.notes);
      mailHolder = mailState ? h('div', {}) : null;
      box.replaceChildren(...[h('div', { class: 'download-card' },
        h('div', { class: 'download-card__head' },
          h('div', {},
            h('div', { class: 'eyebrow', text: t('dlEyebrow') }),
            h('h3', { class: 'download-card__title', text: data.title ? pick(data.title) : t('dlTitle') })),
          h('span', { class: 'pill', text: `v${data.version} · ${formatDate(data.released)}` })),
        h('label', { class: 'field-label', for: select.id, text: t('dlChoose') }),
        h('div', { class: 'select-wrap' }, select),
        info,
        button,
        Array.isArray(notes) && notes.length > 0 && h('div', { class: 'whats-new' },
          h('h4', { text: t('dlWhatsNew', { version: data.version }) }),
          h('ul', {}, notes.map((note) => h('li', { text: note }))))), mailHolder].filter(Boolean));
      update();
      renderMail();
    };

    render();
    langListeners.push(render);
  }

  /* ---------- Dùng thử qua email ("trialMail" trong downloads-*.json) ----------
   * { "to": hộp thư nhận, "tag": tag Product Key (vd SH1), "days": số ngày, "product": tên hiển thị }.
   * Trang chỉ kiểm định dạng + checksum để bắt lỗi chép thiếu sớm; cấp hay không do máy chủ quyết định
   * (A-Soft License: POST /api/keygen/trial-mail, bot MailBot đọc hộp thư và trả lời). */
  async function keyChecksum(fp) {
    // Cùng công thức với plugin (LicMachine.Checksum): 2 byte đầu SHA-256 của vân tay in hoa.
    if (!window.crypto || !crypto.subtle || typeof TextEncoder === 'undefined') return null;
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fp)));
    return [hash[0], hash[1]].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  async function checkProductKey(raw, tag) {
    const key = String(raw || '').replace(/\s+/g, '').toUpperCase();
    if (!key) return { error: 'errKeyMissing' };
    const m = key.match(/^([A-Z0-9]{2,4})-([0-9A-F]{64})-([0-9A-F]{4})$/);
    if (!m) return { error: key.startsWith(`${tag}-`) || !/^[A-Z0-9]{2,4}-/.test(key) ? 'mailErrKey' : 'mailErrOther' };
    if (m[1] !== tag) return { error: 'mailErrOther' };
    const sum = await keyChecksum(m[2]).catch(() => null);
    if (sum && sum !== m[3]) return { error: 'mailErrKey' };
    return { key };
  }

  function mailTrialCard(cfg, index, state, rerender) {
    const vars = { product: cfg.product, tag: cfg.tag, days: cfg.days, to: cfg.to };
    const head = h('div', { class: 'activate-card__head' },
      h('div', { class: 'activate-card__icon', 'aria-hidden': 'true', text: '✉️' }),
      h('div', {},
        h('h3', { class: 'activate-card__title', text: t('mailTitle', vars) }),
        h('p', { text: t('mailIntro', vars) })));

    const copyButton = (label, value) => {
      const btn = h('button', { type: 'button', class: 'btn btn--ghost', text: t(label) });
      btn.addEventListener('click', async () => {
        await copyText(value);
        btn.textContent = t('copied');
        setTimeout(() => { btn.textContent = t(label); }, 1800);
      });
      return btn;
    };

    let body;
    if (state.ready) {
      const subject = t('mailSubject', vars);
      const text = t('mailBody', { ...vars, key: state.ready });
      const enc = encodeURIComponent;
      const links = [
        [t('mailApp'), `mailto:${cfg.to}?subject=${enc(subject)}&body=${enc(text)}`],
        ['Gmail', `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(cfg.to)}&su=${enc(subject)}&body=${enc(text)}`],
        ['Outlook 365', `https://outlook.office.com/mail/deeplink/compose?to=${enc(cfg.to)}&subject=${enc(subject)}&body=${enc(text)}`],
        ['Outlook.com', `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(cfg.to)}&subject=${enc(subject)}&body=${enc(text)}`]
      ];
      const output = h('textarea', { class: 'activate-output', rows: 5, readonly: true });
      output.value = text;
      const back = h('button', { type: 'button', class: 'btn btn--ghost', text: t('mailBack') });
      back.addEventListener('click', () => {
        state.ready = '';
        rerender();
      });
      body = h('div', { class: 'activate-result', 'aria-live': 'polite' },
        h('p', { class: 'activate-done', text: t('mailReady') }),
        h('div', { class: 'activate-actions' }, links.map(([label, href], i) => h('a', {
          class: `btn ${i === 0 ? 'btn--primary' : 'btn--ghost'}`, href, text: label,
          target: i > 0 ? '_blank' : null, rel: i > 0 ? 'noopener' : null
        }))),
        h('p', { class: 'activate-note', text: t('mailManual', vars) }),
        output,
        h('div', { class: 'activate-actions' }, copyButton('mailCopyAddr', cfg.to), copyButton('mailCopyBody', text), back),
        h('p', { class: 'activate-note', text: t('mailNote') }));
    } else {
      const keyId = `mail-trial-key-${index}`;
      const input = h('textarea', { id: keyId, rows: 2, required: true, spellcheck: 'false', placeholder: t('mailKeyHint', vars) });
      input.value = state.key;
      input.addEventListener('input', () => { state.key = input.value; });
      body = h('form', { class: 'activate-form' },
        h('label', { for: keyId, text: 'Product Key' }), input,
        h('button', { type: 'submit', class: 'btn btn--primary', text: t('mailNext') }),
        state.error && h('p', { class: 'activate-error', role: 'alert', text: t(state.error, vars) }));
      body.addEventListener('submit', async (e) => {
        e.preventDefault();
        const result = await checkProductKey(state.key, cfg.tag);
        state.error = result.error || null;
        state.ready = result.key || '';
        rerender();
      });
    }
    return h('div', { class: 'activate-card', id: index ? `dung-thu-email-${index}` : 'dung-thu-email' }, head, body);
  }

  /* ---------- Bài viết khác trong chuyên mục ---------- */
  async function initRelated() {
    const holder = document.querySelector('[data-peb-posts]');
    if (!holder) return;
    const section = holder.closest('.related') || holder;
    let posts;
    try {
      posts = await fetchJson(holder.dataset.pebPosts || `${CATEGORY}posts.json`);
    } catch (err) {
      console.error(err);
      return;
    }
    const others = (Array.isArray(posts) ? posts : []).filter((post) => post.link !== location.pathname);
    if (!others.length) return;

    const render = () => holder.replaceChildren(...others.map((post) => h('a', { class: 'related-card', href: post.link },
      h('span', { class: 'badge', text: pick(post.tag) || 'PEB Member' }),
      h('h3', { text: pick(post.title) }),
      post.description && h('p', { text: pick(post.description) }))));
    render();
    langListeners.push(render);
    section.hidden = false;
  }

  /* ---------- Nút chép (link nhóm Zalo...) ---------- */
  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = h('textarea', { readonly: true, style: 'position:fixed;opacity:0' });
      field.value = value;
      document.body.append(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await copyText(btn.dataset.copy);
        if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
        btn.textContent = t('copied');
        clearTimeout(btn._copyTimer);
        btn._copyTimer = setTimeout(() => { btn.innerHTML = btn.dataset.label; }, 1800);
      });
    });
  }

  initTheme();
  initLang();
  initFigures();
  initCopyButtons();
  document.querySelectorAll('[data-peb-download]').forEach(initDownload);
  initRelated();
})();
