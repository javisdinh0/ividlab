import React from 'react';
import { guidesData } from '../data/guides';

export default function GuidesSection({ t, lang }) {
  return (
    <section id="guides" style={{ padding: '3rem 0' }}>
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
              {t.guides.badge}
            </div>
            <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>
              {t.guides.title}
            </h2>
          </div>
          <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {guidesData.length} {t.guides.items_count}
          </span>
        </div>

        <div className="tools-grid">
          {guidesData.map((guide) => (
            <div key={guide.id} className="card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="tag-pill" style={{ backgroundColor: 'var(--accent-blue-light)' }}>{guide.tag}</span>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {guide.date}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>
                  <span>{guide.title}</span>
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {guide.description[lang]}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-rule)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {guide.category}
                </span>
                <a 
                  href={guide.link} 
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-ink)',
                    textDecoration: 'none',
                    fontWeight: 700
                  }}
                >
                  {t.guides.read_article}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
