import React from 'react';

export default function AboutSection() {
  return (
    <section id="about" style={{ padding: '4rem 0' }}>
      <div className="container">
        <div className="section-label">
          ABOUT // IVIDLAB
        </div>
        
        <h2 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
          Giới thiệu về iViDLab
        </h2>

        {/* Clean Placeholder Box */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px dashed var(--accent-blue)',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div className="font-mono" style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>
            // PLACEHOLDER: NỘI DUNG GIỚI THIỆU
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
            Khu vực giới thiệu iViDLab được để trống theo yêu cầu. Bạn có thể dễ dàng cập nhật thông tin giới thiệu, tầm nhìn và định hướng phát triển bất kỳ lúc nào tại đây.
          </p>
          <div className="font-mono" style={{ fontSize: '0.8rem', color: '#999999' }}>
            File chỉnh sửa: <code>src/components/AboutSection.jsx</code>
          </div>
        </div>
      </div>
    </section>
  );
}
