import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsSection from './components/ToolsSection';
import GuidesSection from './components/GuidesSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import { translations } from './i18n/translations';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [lang, setLang] = useState('vi');
  const [theme, setTheme] = useState(() => localStorage.getItem('ividlab-theme') || 'light');

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ividlab-theme', theme);
  }, [theme]);

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
