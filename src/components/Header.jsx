import React, { useEffect, useRef } from 'react';

const NAV_LABEL = { all: 'home', tools: 'tools', guides: 'guides', 'tekla-component': 'teklacomponent', 'amc-private': 'amcprivate', about: 'about' };

export default function Header({ activeTab, setActiveTab, routes, lang, setLang, theme, setTheme, t }) {
  const navRef = useRef(null);

  // Link thật (crawler lần theo được, Ctrl/chuột giữa mở tab mới); bấm thường thì đổi tab tại chỗ.
  const go = (tab) => (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setActiveTab(tab);
  };

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
        <a href="/" className="site-brand" onClick={go('all')}>
          iViD<span style={{ color: 'var(--accent-blue)' }}>Lab</span>
        </a>

        {/* Navigation */}
        <nav className="site-nav" ref={navRef}>
          {routes.map(({ tab, path }) => (
            <a
              key={tab}
              href={path}
              className="nav-link"
              onClick={go(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {t.nav[NAV_LABEL[tab]]}
            </a>
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
