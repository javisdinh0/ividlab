import React from 'react';

export default function AboutSection({ t }) {
  return (
    <section id="about" style={{ padding: '4rem 0' }}>
      <div className="container">
        <div className="section-label">
          {t.about.badge}
        </div>
        
        <h2 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '1.75rem' }}>
          {t.about.title}
        </h2>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-rule)',
          borderRadius: '12px',
          padding: '2.5rem',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
        }}>
          <p style={{
            fontSize: '1.15rem',
            lineHeight: '1.85',
            color: 'var(--text-ink)',
            fontFamily: 'var(--font-body)',
            marginBottom: '1.5rem'
          }}>
            {t.about.content_1}
          </p>

          <div style={{
            borderLeft: '3px solid var(--accent-blue)',
            paddingLeft: '1.25rem',
            marginTop: '1.5rem',
            backgroundColor: 'var(--accent-blue-light)',
            padding: '1.25rem 1.5rem',
            borderRadius: '0 8px 8px 0'
          }}>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'var(--text-ink)',
              fontWeight: 500
            }}>
              {t.about.content_2}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
