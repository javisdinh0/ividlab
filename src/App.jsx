import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsSection from './components/ToolsSection';
import GuidesSection from './components/GuidesSection';
import PebMemberSection from './components/PebMemberSection';
import AmcPrivateSection from './components/AmcPrivateSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import { translations } from './i18n/translations';
import './index.css';

const TABS = ['all', 'tools', 'guides', 'peb-member', 'amc-private', 'about'];

// Các trang tĩnh (public/**) link về SPA bằng /?tab=<id>, nên tab ban đầu lấy từ URL.
function tabFromUrl() {
  const tab = new URLSearchParams(window.location.search).get('tab');
  return TABS.includes(tab) ? tab : 'all';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  // Dùng chung key 'ividlab-lang' với các trang tĩnh để ngôn ngữ giữ nguyên khi chuyển trang.
  const [lang, setLang] = useState(() => (localStorage.getItem('ividlab-lang') === 'en' ? 'en' : 'vi'));
  const [theme, setTheme] = useState(() => localStorage.getItem('ividlab-theme') || 'light');
  const isFirstTabSync = useRef(true);

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ividlab-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('ividlab-lang', lang);
  }, [lang]);

  // Đồng bộ ?tab= để mỗi tab có link riêng và nút Back/Forward hoạt động.
  // Lần chạy đầu chỉ chuẩn hoá URL (vd. /?tab=all -> /) nên dùng replaceState.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 'all') url.searchParams.delete('tab');
    else url.searchParams.set('tab', activeTab);
    if (url.href !== window.location.href) {
      window.history[isFirstTabSync.current ? 'replaceState' : 'pushState'](null, '', url);
    }
    isFirstTabSync.current = false;
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'all' && (
          <>
            <Hero t={t} />
            <div className="divider" />
            <ToolsSection t={t} lang={lang} />
            <div className="divider" />
            <GuidesSection t={t} lang={lang} />
            <div className="divider" />
            <AboutSection t={t} />
          </>
        )}

        {activeTab === 'tools' && (
          <div style={{ paddingTop: '2rem' }}>
            <ToolsSection t={t} lang={lang} />
          </div>
        )}

        {activeTab === 'guides' && (
          <div style={{ paddingTop: '2rem' }}>
            <GuidesSection t={t} lang={lang} />
          </div>
        )}

        {activeTab === 'peb-member' && (
          <div style={{ paddingTop: '2rem' }}>
            <PebMemberSection t={t} lang={lang} />
          </div>
        )}

        {activeTab === 'amc-private' && (
          <div style={{ paddingTop: '2rem' }}>
            <AmcPrivateSection t={t} />
          </div>
        )}

        {activeTab === 'about' && (
          <div style={{ paddingTop: '2rem' }}>
            <AboutSection t={t} />
          </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
