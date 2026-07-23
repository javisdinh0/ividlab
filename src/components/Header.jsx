import React from 'react';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(162, 191, 199, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-rule)',
      padding: '1.25rem 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setActiveTab('all'); }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--c-1)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem'
          }}>
            iV
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--c-1)'
          }}>
            iViD<span style={{ color: 'var(--c-2)' }}>Lab</span>
          </span>
        </a>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'all' ? 700 : 500,
              color: activeTab === 'all' ? 'var(--c-1)' : 'var(--c-3)',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            // TRANG CHỦ
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'tools' ? 700 : 500,
              color: activeTab === 'tools' ? 'var(--c-1)' : 'var(--c-3)',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            // CÔNG CỤ
          </button>

          <button
            onClick={() => setActiveTab('about')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'about' ? 700 : 500,
              color: activeTab === 'about' ? 'var(--c-1)' : 'var(--c-3)',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            // GIỚI THIỆU
          </button>
        </nav>
      </div>
    </header>
  );
}
