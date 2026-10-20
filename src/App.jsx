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
import ROUTES from './routes.json';
import './index.css';

const ORIGIN = 'https://ividlab.com';
const HOME_TITLE = 'iViDLab — BIM & Steel Structure Tools'; // khớp <title> trong index.html
const routeOf = (tab) => ROUTES.find((r) => r.tab === tab) || ROUTES[0];

// Mỗi tab có đường dẫn riêng (src/routes.json, HTML dựng sẵn bởi scripts/prerender.mjs).
// Link cũ dạng /?tab=<id> (trang tĩnh, bookmark, Google) vẫn mở đúng tab rồi được đổi sang đường dẫn mới.
function tabFromLocation() {
  const path = window.location.pathname.replace(/\/?$/, '/');
  const byPath = ROUTES.find((r) => r.path === path);
  if (byPath && byPath.tab !== 'all') return byPath.tab;
  let tab = new URLSearchParams(window.location.search).get('tab');
  if (tab === 'peb-member') tab = 'tekla-component'; // chuyên mục PEB Member đã gom vào Tekla App & Component
  return ROUTES.some((r) => r.tab === tab) ? tab : 'all';
}

// Prerender chạy trên Node (không có localStorage) — đọc an toàn, mặc định 'vi'/'light'.
function stored(key) {
  try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key); } catch { return null; }
}

export default function App({ initialTab, initialPostLists }) {
  const [activeTab, setActiveTab] = useState(() => initialTab || tabFromLocation());
  // Dùng chung key 'ividlab-lang' với các trang tĩnh để ngôn ngữ giữ nguyên khi chuyển trang.
  const [lang, setLang] = useState(() => (stored('ividlab-lang') === 'en' ? 'en' : 'vi'));
  const [theme, setTheme] = useState(() => stored('ividlab-theme') || 'light');
  const isFirstTabSync = useRef(true);

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#182B37' : '#A2BFC7');
    localStorage.setItem('ividlab-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('ividlab-lang', lang);
  }, [lang]);

  // Đồng bộ đường dẫn để mỗi tab có link riêng và nút Back/Forward hoạt động.
  // Lần chạy đầu chỉ chuẩn hoá URL (vd. /?tab=guides -> /guides/) nên dùng replaceState.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.pathname = routeOf(activeTab).path;
    url.searchParams.delete('tab');
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', ORIGIN + url.pathname);
    if (url.href !== window.location.href) {
      window.history[isFirstTabSync.current ? 'replaceState' : 'pushState'](null, '', url);
    }
    // Đổi tab khi đang cuộn giữa trang: đưa về đầu để thấy nội dung mới
    if (!isFirstTabSync.current) window.scrollTo({ top: 0 });
    isFirstTabSync.current = false;
  }, [activeTab]);

  // Mỗi tab một tiêu đề trang (tab trình duyệt, lịch sử, bookmark)
  useEffect(() => {
    const key = routeOf(activeTab).i18n;
    document.title = key ? `${t[key].title} — iViDLab` : HOME_TITLE;
  }, [activeTab, t]);

  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        routes={ROUTES}
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

        {activeTab === 'tekla-component' && (
          <div style={{ paddingTop: '2rem' }}>
            <PebMemberSection t={t} lang={lang} initialLists={initialPostLists} />
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
