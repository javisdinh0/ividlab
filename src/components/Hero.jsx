import React from 'react';

export default function Hero() {
  return (
    <section style={{ padding: '5rem 0 3.5rem 0' }}>
      <div className="container">
        <div className="section-label">
          LABORATORY & PORTFOLIO
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
          letterSpacing: '-0.03em',
          maxWidth: '900px',
          marginBottom: '1.5rem',
          color: 'var(--text-ink)',
          fontWeight: 800
        }}>
          Công cụ BIM & Tự động hóa kết cấu thép cho{' '}
          <span className="highlight-hover">Tekla Structures</span>.
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          lineHeight: '1.7',
          marginBottom: '2.5rem',
          fontFamily: 'var(--font-body)'
        }}>
          Nơi chia sẻ giải pháp lập trình tự động hóa, plugin mở rộng và các công cụ tối ưu quy trình thiết kế, mô hình hóa kết cấu thép PEB.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="#tools" className="btn btn-primary">
            Khám phá công cụ ↓
          </a>
          <a href="#about" className="btn btn-secondary">
            Tìm hiểu iViDLab
          </a>
        </div>
      </div>
    </section>
  );
}
