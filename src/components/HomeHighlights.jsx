import React, { useEffect, useMemo, useState } from 'react';
import { guidesData } from '../data/guides';
import { SOURCES } from './PebMemberSection';

// Ba khối trên trang chủ: bài mới đăng nhất, bài được đọc nhiều nhất, công cụ được tải nhiều nhất.
// "Mới nhất" tính từ posts.json (có ngày ISO) và guides.js (chỉ có tháng/năm, quy về ngày 1).
// "Đọc nhiều / tải nhiều" lấy từ document công khai siteStats/popular do trang /admin/ ghi (xem docs/admin/README.md);
// chưa có dữ liệu thì hai khối đó ẩn đi chứ không bịa thứ hạng.

const API_KEY = 'AIzaSyB8-vSVDKhOLuTA6xmYZzwHVrWX58eT3d4';
const STATS_URL = `https://firestore.googleapis.com/v1/projects/ividlab-rficonsole/databases/(default)/documents/siteStats/popular?key=${API_KEY}`;
const COUNT = 6;

// Thẻ công cụ (Tekla App & Component). `product` khớp tên sản phẩm mà /admin/ gom lượt tải theo (DOWNLOAD_MANIFESTS).
const TOOLS = [
  { id: 'peb', name: 'PEB Member', product: 'PEB Member', icon: '/tekla/peb-member/img/01-tong-quan.webp', link: '/tekla/peb-member/gioi-thieu-peb-member.html' },
  { id: '2v', name: '2V Cross', product: '2V Cross Anti-Sag', icon: '/tekla/component/img/2v-cross-cover.webp', link: '/tekla/component/anti-sag-2v-cross.html' },
  { id: 'tube', name: 'Tube Round Connect', product: 'Tube Round Connect', icon: '/tekla/component/img/tube-round-connect-1-12.webp', link: '/tekla/component/tube-round-connect.html' },
  { id: 'bolt', name: 'Bolt Quick Dim V2', product: 'Bolt Quick Dim', icon: '/tekla/component/img/bolt-quick-dim-v2-drawing.webp', link: '/tekla/component/bolt-quick-dim.html' },
  { id: 'stay', name: 'Stay Hole', product: 'Stay Hole', icon: '/tekla/component/img/stay-hole-icon.png', link: '/tekla/component/stay-hole.html' },
  { id: 'shear', name: 'Shear (CC1)', product: 'Shear (CC1)', icon: '/tekla/component/img/shear-cc1-icon.webp', link: '/tekla/component/shear-cc1.html' },
  { id: 'bracket', name: 'PEB Bracket', product: 'PEB Bracket', icon: '/tekla/component/img/peb-bracket-icon.webp', link: '/tekla/component/peb-bracket.html' }
];

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function guideDate(text) {
  const m = String(text).toLowerCase().match(/([a-z]+)\s+(\d{4})/);
  const idx = m ? MONTHS.indexOf(m[1]) : -1;
  return m && idx >= 0 ? `${m[2]}-${String(idx + 1).padStart(2, '0')}-01` : '1970-01-01';
}

const pick = (value, lang) => (value && typeof value === 'object' ? value[lang] || value.vi : value);
const cleanPath = (p) => String(p || '').split(/[?#]/)[0];

function formatDate(iso, lang) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return lang === 'en'
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildArticles(lists) {
  const fromPosts = (Array.isArray(lists) ? lists : []).flatMap((data) => (Array.isArray(data) ? data : []));
  const posts = fromPosts.map((p) => ({ link: p.link, title: p.title, tag: p.tag, date: p.date, cover: p.cover }));
  const guides = guidesData.map((g) => ({ link: g.link, title: g.title, tag: g.tag, date: guideDate(g.date), cover: null }));
  return [...posts, ...guides];
}

function SectionHead({ badge, title }) {
  return (
    <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--border-rule)', paddingBottom: '1rem' }}>
      <div className="section-label">{badge}</div>
      <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
  );
}

function ArticleCard({ item, lang, extra }) {
  return (
    <a href={item.link} className="card post-card">
      <div>
        {item.cover && <img className="post-cover" src={item.cover} alt="" loading="lazy" />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem' }}>
          <span className="tag-pill">{pick(item.tag, lang)}</span>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {extra || formatDate(item.date, lang)}
          </span>
        </div>
        <h3 style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>{pick(item.title, lang)}</h3>
      </div>
    </a>
  );
}

export default function HomeHighlights({ t, lang, initialLists }) {
  const tx = t.home;
  const [lists, setLists] = useState(initialLists || null);
  const [stats, setStats] = useState(null);

  // Dev/không có dữ liệu dựng sẵn: tự đọc posts.json.
  useEffect(() => {
    if (lists) return undefined;
    let alive = true;
    Promise.all(SOURCES.map((s) => fetch(s.url).then((r) => (r.ok ? r.json() : [])).catch(() => [])))
      .then((data) => { if (alive) setLists(data); });
    return () => { alive = false; };
  }, [lists]);

  useEffect(() => {
    let alive = true;
    fetch(STATS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => {
        const raw = doc && doc.fields && doc.fields.data && doc.fields.data.stringValue;
        if (alive && raw) setStats(JSON.parse(raw));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const articles = useMemo(() => buildArticles(lists), [lists]);

  const latest = useMemo(
    () => articles.map((a, i) => ({ a, i })).sort((x, y) => String(y.a.date).localeCompare(String(x.a.date)) || x.i - y.i).slice(0, COUNT).map((x) => x.a),
    [articles]
  );

  const mostRead = useMemo(() => {
    const views = (stats && stats.views) || {};
    return articles
      .map((a, i) => ({ a, i, n: Number(views[cleanPath(a.link)]) || 0 }))
      .filter((x) => x.n > 0)
      .sort((x, y) => y.n - x.n || x.i - y.i)
      .slice(0, COUNT);
  }, [articles, stats]);

  const popularTools = useMemo(() => {
    const dl = (stats && stats.downloads) || {};
    return TOOLS
      .map((tool, i) => ({ tool, i, n: Number(dl[tool.product]) || 0 }))
      .sort((x, y) => y.n - x.n || x.i - y.i);
  }, [stats]);
  const haveDownloads = popularTools.some((x) => x.n > 0);

  const fmt = (n) => n.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN');

  return (
    <>
      {latest.length > 0 && (
        <section id="latest" style={{ padding: '3rem 0 1rem' }}>
          <div className="container">
            <SectionHead badge={tx.latest_badge} title={tx.latest_title} />
            <div className="tools-grid">
              {latest.map((item) => <ArticleCard key={item.link} item={item} lang={lang} />)}
            </div>
          </div>
        </section>
      )}

      {mostRead.length > 0 && (
        <section id="most-read" style={{ padding: '3rem 0 1rem' }}>
          <div className="container">
            <SectionHead badge={tx.read_badge} title={tx.read_title} />
            <div className="tools-grid">
              {mostRead.map((x) => (
                <ArticleCard key={x.a.link} item={x.a} lang={lang} extra={`${fmt(x.n)} ${tx.reads}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      {haveDownloads && (
        <section id="popular-tools" style={{ padding: '3rem 0 1rem' }}>
          <div className="container">
            <SectionHead badge={tx.tools_badge} title={tx.tools_title} />
            <div className="home-tools">
              {popularTools.map((x, rank) => (
                <a key={x.tool.id} href={x.tool.link} className="home-tool">
                  <span className="home-tool__rank font-mono">{rank + 1}</span>
                  <img className="home-tool__icon" src={x.tool.icon} alt="" loading="lazy" />
                  <span className="home-tool__name">{x.tool.name}</span>
                  <span className="home-tool__count font-mono">{fmt(x.n)} {tx.downloads}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
