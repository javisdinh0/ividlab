import React, { useEffect, useRef, useState } from 'react';

// Danh sách bài viết của chuyên mục nằm trong public/ để các trang bài viết tĩnh dùng chung
// (mục "Bài viết khác"). Thêm bài mới chỉ cần sửa posts.json — xem docs/peb-member/README.md.
// Cùng component dùng cho chuyên mục Tekla Component qua prop `category` (xem CATEGORIES bên dưới).
// Chuyên mục 'tekla-component' gom bài của PEB Member và Tekla Component: đọc nhiều posts.json, gộp, xếp mới nhất trước.
const SOURCES = [
  { url: '/tekla/peb-member/posts.json', label: 'PEB Member' },
  { url: '/tekla/component/posts.json', label: 'Tekla Component' }
];
// Sản phẩm của chuyên mục: bấm thẻ để lọc bài viết theo sản phẩm (khớp `label` của SOURCES).
// Thêm sản phẩm mới: thêm một mục ở đây, một nguồn ở SOURCES và chuỗi tên/mô tả trong translations.js.
const PRODUCTS = [
  { key: 'peb', label: 'PEB Member', cover: '/tekla/peb-member/img/01-tong-quan.png', intro: '/tekla/peb-member/gioi-thieu-peb-member.html' },
  { key: '2v', label: '2V Cross', cover: '/tekla/component/img/2v-cross-cover.png', intro: '/tekla/component/anti-sag-2v-cross.html' },
  { key: 'tube', label: 'Tube Round Connect', cover: '/tekla/component/img/tube-round-connect-1-12.png', intro: '/tekla/component/tube-round-connect.html' },
  { key: 'bolt', label: 'Bolt Quick Dim', cover: '/tekla/component/img/bolt-quick-dim-dialog.png', intro: '/tekla/component/bolt-quick-dim.html' }
];
const NS = 'teklacomponent';

// Trường song ngữ trong posts.json có dạng { vi, en } hoặc là chuỗi dùng chung.
const pick = (value, lang) => (value && typeof value === 'object' ? value[lang] || value.vi : value);

function formatDate(iso, lang) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return lang === 'en'
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Ảnh bìa là tuỳ chọn — ảnh chưa có hoặc lỗi thì bỏ qua, không để lại khung trống.
function Cover({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export default function PebMemberSection({ t, lang }) {
  const tx = t[NS];
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(null);
  const articlesRef = useRef(null);

  // Chọn một sản phẩm thì cuộn tới danh sách bài viết (nằm dưới khối giới thiệu, nếu không sẽ không thấy gì đổi).
  useEffect(() => {
    if (selected && articlesRef.current) articlesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(SOURCES.map((source) => fetch(source.url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => (Array.isArray(data) ? data : []).map((post) => ({ ...post, product: post.product || source.label })))))
      .then((lists) => {
        if (cancelled) return;
        setPosts(lists.flat().sort((a, b) => String(b.date).localeCompare(String(a.date))));
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  const product = PRODUCTS.find((item) => item.key === selected);
  const visible = posts && (product ? posts.filter((post) => post.product === product.label) : posts);
  const countOf = (item) => (posts ? posts.filter((post) => post.product === item.label).length : 0);
  const featured = posts && (posts.find((post) => post.featured) || posts[0]);

  return (
    <section id="tekla-component" style={{ padding: '3rem 0' }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-rule)',
          paddingBottom: '1rem'
        }}>
          <div>
            <div className="section-label">
              {tx.badge}
            </div>
            <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>
              {tx.title}
            </h2>
          </div>
          {posts && (
            <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {posts.length} {tx.items_count}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
          {tx.products_title}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          {tx.products_hint}
        </p>
        <div className="tools-grid product-grid">
          {PRODUCTS.map((item) => (
            <div key={item.key} className={`card product-card${selected === item.key ? ' product-card--active' : ''}`}>
              <button
                type="button"
                className="product-card__select"
                aria-pressed={selected === item.key}
                onClick={() => setSelected(selected === item.key ? null : item.key)}
              >
                <Cover className="post-cover" src={item.cover} alt="" />
                <span className="product-card__name">{tx[`product_${item.key}_name`]}</span>
                <span className="product-card__desc">{tx[`product_${item.key}_desc`]}</span>
                <span className="font-mono product-card__count">
                  {countOf(item)} {tx.items_count} · {selected === item.key ? tx.product_hide : tx.product_show}
                </span>
              </button>
              <div className="product-card__links">
                <a href={item.intro} className="btn btn-secondary">{tx[`btn_intro_${item.key}`]}</a>
                <a href={`${item.intro}#tai-ve`} className="btn btn-secondary">{tx[`btn_download_${item.key}`]}</a>
              </div>
            </div>
          ))}
        </div>

        <div className="category-intro" style={{ marginTop: '2.75rem', marginBottom: 0 }}>
          <div>
            <p className="category-intro__desc">{tx.desc}</p>
            <div className="chip-row" style={{ marginBottom: 0 }}>
              {tx.highlights.map((item) => (
                <span key={item} className="tag-pill">{item}</span>
              ))}
            </div>
          </div>
          {featured && (
            <Cover className="category-intro__cover" src={featured.cover} alt={pick(featured.title, lang)} />
          )}
        </div>

        <h3 id="tekla-articles" ref={articlesRef} style={{ scrollMarginTop: '6rem', fontSize: '1.35rem', margin: '2.75rem 0 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>{product ? `${tx.articles_of} ${tx[`product_${product.key}_name`]}` : tx.articles_title}</span>
          {product && (
            <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>{tx.show_all}</button>
          )}
        </h3>

        {!posts && !failed && (
          <p className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tx.loading}</p>
        )}
        {failed && (
          <p style={{ color: 'var(--text-muted)' }}>{tx.error}</p>
        )}
        {posts && visible.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>{tx.empty}</p>
        )}

        {posts && visible.length > 0 && (
          <div className="tools-grid">
            {visible.map((post) => (
              <a key={post.id} href={post.link} className="card post-card">
                <div>
                  <Cover className="post-cover" src={post.cover} alt="" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
                    <span className="tag-pill">{pick(post.tag, lang)}</span>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(post.date, lang)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                    {pick(post.title, lang)}
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    {pick(post.description, lang)}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-rule)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {post.product}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-ink)',
                    fontWeight: 700
                  }}>
                    {tx.read_article}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
