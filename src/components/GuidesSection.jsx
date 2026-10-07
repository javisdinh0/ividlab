import React, { useMemo, useState } from 'react';
import { guidesData } from '../data/guides';

const pick = (v, lang) => (v && typeof v === 'object' ? v[lang] || v.vi : v);

const GROUPS = [
  { key: 'all', label: null },
  { key: 'cad', label: 'AutoCAD' },
  { key: 'tekla', label: 'Tekla' },
];

export default function GuidesSection({ t, lang }) {
  const [group, setGroup] = useState('all');
  const [tag, setTag] = useState(null);

  const inGroup = useMemo(
    () => guidesData.filter((g) => group === 'all' || g.group === group),
    [group]
  );
  const tagCounts = useMemo(() => {
    const m = new Map();
    inGroup.forEach((g) => g.tags.forEach((x) => m.set(x, (m.get(x) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [inGroup]);
  const visible = tag ? inGroup.filter((g) => g.tags.includes(tag)) : inGroup;

  const pickGroup = (k) => { setGroup(k); setTag(null); };
  const toggleTag = (x) => setTag((cur) => (cur === x ? null : x));
  const groupCount = (k) => guidesData.filter((g) => k === 'all' || g.group === k).length;

  return (
    <section id="guides" style={{ padding: '3rem 0' }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-rule)',
          paddingBottom: '1rem'
        }}>
          <div>
            <div className="section-label">
              {t.guides.badge}
            </div>
            <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>
              {t.guides.title}
            </h2>
          </div>
          <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {visible.length} {t.guides.items_count}
          </span>
        </div>

        <div className="guide-filter" role="toolbar" aria-label={t.guides.group_label}>
          <div className="guide-filter__tabs" role="tablist">
            {GROUPS.map((g) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={group === g.key}
                className={'guide-filter__tab' + (group === g.key ? ' is-active' : '')}
                onClick={() => pickGroup(g.key)}
              >
                {g.label || t.guides.all}
                <span className="guide-filter__count">{groupCount(g.key)}</span>
              </button>
            ))}
          </div>
          <div className="chip-row guide-filter__tags" aria-label={t.guides.tag_label}>
            {tagCounts.map(([x, n]) => (
              <button
                key={x}
                type="button"
                aria-pressed={tag === x}
                className={'guide-hashtag' + (tag === x ? ' is-active' : '')}
                onClick={() => toggleTag(x)}
              >
                #{x}<span className="guide-filter__count">{n}</span>
              </button>
            ))}
            {tag && (
              <button type="button" className="guide-hashtag guide-hashtag--clear" onClick={() => setTag(null)}>
                ✕ {t.guides.clear}
              </button>
            )}
          </div>
        </div>

        {visible.length === 0 && (
          <p className="font-mono" style={{ color: 'var(--text-muted)' }}>{t.guides.empty}</p>
        )}

        <div className="tools-grid">
          {visible.map((guide) => (
            <div key={guide.id} className="card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="tag-pill" style={{ backgroundColor: 'var(--accent-blue-light)' }}>{pick(guide.tag, lang)}</span>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {guide.date}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>
                  <span>{guide.title}</span>
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  {guide.description[lang]}
                </p>

                <div className="guide-card-tags">
                  {guide.tags.map((x) => (
                    <button
                      key={x}
                      type="button"
                      className={'guide-hashtag guide-hashtag--sm' + (tag === x ? ' is-active' : '')}
                      onClick={() => toggleTag(x)}
                    >
                      #{x}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-rule)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {pick(guide.category, lang)}
                </span>
                <a 
                  href={guide.link} 
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-ink)',
                    textDecoration: 'none',
                    fontWeight: 700
                  }}
                >
                  {t.guides.read_article}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
