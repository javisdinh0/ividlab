import React from 'react';
import { toolsData } from '../data/tools';

export default function ToolsSection() {
  return (
    <section id="tools" style={{ padding: '3rem 0' }}>
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
              PORTFOLIO // TOOLS
            </div>
            <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>
              Danh mục Công cụ & Plugin
            </h2>
          </div>
          <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {toolsData.length} items
          </span>
        </div>

        <div className="tools-grid">
          {toolsData.map((tool) => (
            <div key={tool.id} className="card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="tag-pill">{tool.tag}</span>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                    {tool.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>
                  <span className="highlight-hover">{tool.title}</span>
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {tool.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-rule)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {tool.category}
                </span>
                <a 
                  href={tool.link} 
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--accent-blue)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Xem chi tiết →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
