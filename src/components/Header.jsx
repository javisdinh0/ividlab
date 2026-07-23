import React from 'react';

export default function Header({ activeTab, setActiveTab, lang, setLang, theme, setTheme, t }) {
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const toggleLang = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--header-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-rule)',
      padding: '1rem 0',
      transition: 'background-color 0.3s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Official iViDLab Logo (Master logo with transparent V and ocean palette) */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setActiveTab('all'); }}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <img 
            src="/logo.svg" 
            alt="iViDLab Official Logo" 
            style={{ height: '36px', width: 'auto', display: 'block' }}
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-ink)'
          }}>
            iViD<span style={{ color: 'var(--accent-blue)' }}>Lab</span>
          </span>
        </a>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'all' ? 700 : 500,
              color: activeTab === 'all' ? 'var(--text-ink)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            {t.nav.home}
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'tools' ? 700 : 500,
              color: activeTab === 'tools' ? 'var(--text-ink)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            {t.nav.tools}
          </button>

          <button
            onClick={() => setActiveTab('about')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'about' ? 700 : 500,
              color: activeTab === 'about' ? 'var(--text-ink)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            {t.nav.about}
          </button>
        </nav>

        {/* Toggles (Theme & Language) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="toggle-btn" title="Chuyển giao diện Sáng / Tối">
            {theme === 'light' ? '☀️ LIGHT' : '🌙 DARK'}
          </button>

          {/* Language Toggle */}
          <button onClick={toggleLang} className="toggle-btn" title="Switch Language">
            🌐 {lang.toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}
