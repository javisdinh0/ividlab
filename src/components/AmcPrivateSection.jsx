import React from 'react';

// Chuyên mục AMC Private tools — tab này CHỈ có phần mô tả công khai. Nội dung bài và danh sách
// người được đọc nằm trong Firestore (amcPosts / amcReaders), đọc ở trang /amc-private/ sau khi
// đăng nhập Google — repo này public nên không được để bài viết trong public/. Xem docs/amc-private/README.md.
const READER_URL = '/amc-private/';

export default function AmcPrivateSection({ t }) {
  return (
    <section id="amc-private" style={{ padding: '3rem 0' }}>
      <div className="container">
        <div style={{
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-rule)',
          paddingBottom: '1rem'
        }}>
          <div className="section-label">
            {t.amcprivate.badge}
          </div>
          <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>
            {t.amcprivate.title}
          </h2>
        </div>

        <div className="category-intro">
          <div>
            <p className="category-intro__desc">{t.amcprivate.desc}</p>
            <div className="chip-row">
              {t.amcprivate.highlights.map((item) => (
                <span key={item} className="tag-pill">{item}</span>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {t.amcprivate.note}
            </p>
            <a href={READER_URL} className="btn btn-primary">{t.amcprivate.btn_login}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
