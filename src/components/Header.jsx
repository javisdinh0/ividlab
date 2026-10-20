import React, { useEffect, useRef } from 'react';

export default function Header({ activeTab, setActiveTab, lang, setLang, theme, setTheme, t }) {
  const navRef = useRef(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const toggleLang = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
  };

  // Trên mobile thanh nav cuộn ngang: kéo tab đang chọn vào tầm nhìn.
  useEffect(() => {
    const active = navRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        {/* Clean iViDLab Brand Title */}
        <a
          href="/"
          className="site-brand"
          onClick={(e) => { e.preventDefault(); setActiveTab('all'); }}
        >
          iViD<span style={{ color: 'var(--accent-blue)' }}>Lab</span>
        </a>

        {/* Navigation */}
        <nav className="site-nav" ref={navRef}>
          {[
            ['all', t.nav.home],
            ['tools', t.nav.tools],
            ['guides', t.nav.guides],
            ['tekla-component', t.nav.teklacomponent],
            ['amc-private', t.nav.amcprivate],
            ['about', t.nav.about]
          ].map(([tab, label]) => (
            <button
              key={tab}
              className="nav-link"
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {label}
            </button>
          ))}

          {/* Link tới app RFI Console (trang riêng, ngoài SPA) */}
          <a href="/rficonsole/" className="nav-link nav-link--external" title="Cổng quản lý RFI dự án">
            RFI Console ↗
          </a>
        </nav>

        {/* Toggles (Theme & Language) */}
        <div className="site-header__toggles">
          {/* Theme Toggle — iOS-style switch */}
          <button
            onClick={toggleTheme}
            className="theme-switch"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Chuyển giao diện Sáng / Tối"
            title="Chuyển giao diện Sáng / Tối"
          >
            <span className="theme-switch-thumb">{theme === 'light' ? '☀️' : '🌙'}</span>
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
