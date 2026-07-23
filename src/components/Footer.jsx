import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-rule)',
      padding: '3rem 0',
      backgroundColor: 'rgba(248, 247, 244, 0.5)',
      marginTop: '4rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          fontWeight: 800,
          color: 'var(--text-ink)'
        }}>
          iViD<span style={{ color: 'var(--accent-blue)' }}>Lab</span>
        </div>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          © {new Date().getFullYear()} iViDLab. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
