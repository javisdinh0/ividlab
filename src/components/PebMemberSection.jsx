import React, { useEffect, useState } from 'react';

// Danh sách bài viết của chuyên mục nằm trong public/ để các trang bài viết tĩnh dùng chung
// (mục "Bài viết khác"). Thêm bài mới chỉ cần sửa posts.json — xem docs/peb-member/README.md.
// Cùng component dùng cho chuyên mục Tekla Component qua prop `category` (xem CATEGORIES bên dưới).
// Chuyên mục 'tekla-component' gom bài của PEB Member và Tekla Component: đọc nhiều posts.json, gộp, xếp mới nhất trước.
const SOURCES = [
  { url: '/tekla/peb-member/posts.json', label: 'PEB Member' },
  { url: '/tekla/component/posts.json', label: 'Tekla Component' }
];
const INTROS = [
  { url: '/tekla/peb-member/gioi-thieu-peb-member.html', key: 'btn_intro_peb', dlKey: 'btn_download_peb' },
  { url: '/tekla/component/anti-sag-2v-cross.html', key: 'btn_intro_2v', dlKey: 'btn_download_2v' }
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

  useEffect(() => {
    let cancelled = false;
    Promise.all(SOURCES.map((source) => fetch(source.url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => (Array.isArray(data) ? data : []).map((post) => ({ ...post, product: source.label })))))
      .then((lists) => {
        if (cancelled) return;
        setPosts(lists.flat().sort((a, b) => String(b.date).localeCompare(String(a.date))));
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

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

        <div className="category-intro">
          <div>
            <p className="category-intro__desc">{tx.desc}</p>
            <div className="chip-row">
              {tx.highlights.map((item) => (
                <span key={item} className="tag-pill">{item}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {INTROS.map((intro, index) => (
                <React.Fragment key={intro.url}>
                  <a href={intro.url} className={index === 0 ? 'btn btn-primary' : 'btn btn-secondary'}>{tx[intro.key]}</a>
                  <a href={`${intro.url}#tai-ve`} className="btn btn-secondary">{tx[intro.dlKey]}</a>
                </React.Fragment>
              ))}
            </div>
          </div>
          {featured && (
            <Cover className="category-intro__cover" src={featured.cover} alt={pick(featured.title, lang)} />
          )}
        </div>

        <h3 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>
          {tx.articles_title}
        </h3>

        {!posts && !failed && (
          <p className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tx.loading}</p>
        )}
        {failed && (
          <p style={{ color: 'var(--text-muted)' }}>{tx.error}</p>
        )}
        {posts && posts.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>{tx.empty}</p>
        )}

        {posts && posts.length > 0 && (
          <div className="tools-grid">
            {posts.map((post) => (
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
