import React from 'react';

export default function AboutSection() {
  return (
    <section id="about" style={{ padding: '4rem 0' }}>
      <div className="container">
        <div className="section-label">
          ABOUT // IVIDLAB
        </div>
        
        <h2 style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '1.75rem' }}>
          Giới thiệu về iViDLab
        </h2>

        <div style={{
          backgroundColor: '#FFFFFF',
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
            <strong>iViDLab</strong> là nhóm kỹ sư xây dựng có đam mê với các ứng dụng tự động thiết kế xây dựng. Với sự ra đời và hỗ trợ của AI cùng khả năng Vibe Code tuyệt vời hỗ trợ, chúng tôi mong muốn ngày càng có nhiều công cụ thực sự hữu ích giúp giảm thời gian, tối ưu thao tác, giảm thiểu sai sót và nâng cao chất lượng sản phẩm thiết kế.
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
              Nhóm hoạt động phi lợi nhuận phục vụ cộng đồng trên cơ sở tuân thủ tuyệt đối quy định và luật pháp về sở hữu trí tuệ và bản quyền.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
