import React, { useEffect, useState } from 'react';

// Danh sách bài viết của chuyên mục nằm trong public/ để các trang bài viết tĩnh dùng chung
// (mục "Bài viết khác"). Thêm bài mới chỉ cần sửa posts.json — xem docs/peb-member/README.md.
const POSTS_URL = '/tekla/peb-member/posts.json';
const INTRO_URL = '/tekla/peb-member/gioi-thieu-peb-member.html';

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
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(POSTS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => { if (!cancelled) setPosts(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  const featured = posts && (posts.find((post) => post.featured) || posts[0]);

  return (
    <section id="peb-member" style={{ padding: '3rem 0' }}>
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
              {t.pebmember.badge}
            </div>
            <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>
              {t.pebmember.title}
            </h2>
          </div>
          {posts && (
            <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {posts.length} {t.pebmember.items_count}
            </span>
          )}
        </div>

        <div className="category-intro">
          <div>
            <p className="category-intro__desc">{t.pebmember.desc}</p>
            <div className="chip-row">
              {t.pebmember.highlights.map((item) => (
                <span key={item} className="tag-pill">{item}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href={INTRO_URL} className="btn btn-primary">{t.pebmember.btn_intro}</a>
              <a href={`${INTRO_URL}#tai-ve`} className="btn btn-secondary">{t.pebmember.btn_download}</a>
            </div>
          </div>
          {featured && (
            <Cover className="category-intro__cover" src={featured.cover} alt={pick(featured.title, lang)} />
          )}
        </div>

        <h3 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>
          {t.pebmember.articles_title}
        </h3>

        {!posts && !failed && (
          <p className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.pebmember.loading}</p>
        )}
        {failed && (
          <p style={{ color: 'var(--text-muted)' }}>{t.pebmember.error}</p>
        )}
        {posts && posts.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>{t.pebmember.empty}</p>
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
                    PEB Member
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-ink)',
                    fontWeight: 700
                  }}>
                    {t.pebmember.read_article}
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
