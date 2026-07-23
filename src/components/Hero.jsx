import React from 'react';

export default function Hero({ t }) {
  return (
    <section style={{ padding: '5rem 0 3.5rem 0' }}>
      <div className="container">
        <div className="section-label">
          {t.hero.badge}
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 4.8vw, 4rem)',
          letterSpacing: '-0.03em',
          maxWidth: '920px',
          marginBottom: '1.5rem',
          color: 'var(--text-ink)',
          fontWeight: 800
        }}>
          <span>{t.hero.title_2}</span>.
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          lineHeight: '1.7',
          marginBottom: '2.5rem',
          fontFamily: 'var(--font-body)'
        }}>
          {t.hero.desc}
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="#tools" className="btn btn-primary">
            {t.hero.btn_explore}
          </a>
          <a href="#about" className="btn btn-secondary">
            {t.hero.btn_about}
          </a>
        </div>
      </div>
    </section>
  );
}
