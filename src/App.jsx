import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsSection from './components/ToolsSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ flex: 1 }}>
        {activeTab === 'all' && (
          <>
            <Hero />
            <div className="divider" />
            <ToolsSection />
            <div className="divider" />
            <AboutSection />
          </>
        )}

        {activeTab === 'tools' && (
          <div style={{ paddingTop: '2rem' }}>
            <ToolsSection />
          </div>
        )}

        {activeTab === 'about' && (
          <div style={{ paddingTop: '2rem' }}>
            <AboutSection />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
