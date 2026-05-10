import React, { useState, useRef } from 'react';
import { LiveUpdate } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface FeedMeta {
  lastRefreshed: string;
  cacheAge: number;
  sources?: Record<string, { ok: boolean; count?: number; error?: string }>;
}

interface Props {
  updates: LiveUpdate[];
  loading: boolean;
  feedMeta?: FeedMeta | null;
}

const SOURCE_LABELS: Record<string, string> = {
  'WHO-RSS': 'WHO', 'WHO DON': 'WHO', 'WHO RSS': 'WHO',
  'ProMED-RSS': 'ProMED', 'ProMED-Search': 'ProMED', 'ProMED Search': 'ProMED',
  'Google-News': 'News', 'Bing-News': 'News',
  'CDC-HAN': 'CDC',
  'ECDC': 'ECDC',
};

const badgeClass = (src: string) => {
  const s = src.toUpperCase();
  if (s.includes('WHO'))    return 'WHO';
  if (s.includes('CDC'))    return 'CDC';
  if (s.includes('ECDC'))   return 'ECDC';
  if (s.includes('PROMED')) return 'ProMED';
  return 'ProMED'; // default style
};

const LiveFeed: React.FC<Props> = ({ updates, loading, feedMeta }) => {
  const [filter, setFilter] = useState<'all' | 'hanta' | 'WHO' | 'CDC' | 'ProMED' | 'News'>('all');
  const [selected, setSelected] = useState<LiveUpdate | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = (() => {
    if (filter === 'all')   return updates;
    if (filter === 'hanta') return updates.filter(u => (u as any).isHantavirus);
    return updates.filter(u => badgeClass(u.source) === filter || u.source === filter);
  })();

  const relativeTime = (iso: string) => {
    try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); }
    catch { return ''; }
  };

  const filterBtns = [
    { key: 'all',    label: `🌐 All (${updates.length})` },
    { key: 'hanta',  label: `🦠 Hantavirus` },
    { key: 'WHO',    label: 'WHO' },
    { key: 'CDC',    label: 'CDC' },
    { key: 'ProMED', label: 'ProMED' },
    { key: 'News',   label: 'News' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Source health pills */}
      {feedMeta?.sources && (
        <div style={{
          padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)',
          display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.65rem',
          background: 'var(--bg-secondary)',
        }}>
          {Object.entries(feedMeta.sources).map(([src, info]) => (
            <span key={src} title={info.error || ''} style={{
              padding: '0.1rem 0.45rem', borderRadius: 100, fontWeight: 700,
              background: info.ok ? 'rgba(56,161,105,0.12)' : 'rgba(229,62,62,0.12)',
              border: `1px solid ${info.ok ? 'rgba(56,161,105,0.3)' : 'rgba(229,62,62,0.3)'}`,
              color: info.ok ? '#68d391' : '#fc8181',
            }}>
              {src}{info.ok && info.count != null ? ` ✓${info.count}` : ' ✗'}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', alignSelf: 'center' }}>
            {feedMeta.lastRefreshed ? relativeTime(feedMeta.lastRefreshed) : ''}
          </span>
        </div>
      )}

      {/* Filter row */}
      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {filterBtns.map(({ key, label }) => (
          <button key={key} className={`tab-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)} aria-pressed={filter === key}>
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="live-feed-container" ref={listRef} role="feed" aria-label="Live surveillance feed" aria-busy={loading}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="feed-item">
              <div style={{ height: 11, width: '55%', background: 'var(--border-color)', borderRadius: 4, marginBottom: 7, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 9, width: '90%', background: 'var(--border-color)', borderRadius: 4, marginBottom: 5, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 9, width: '70%', background: 'var(--border-color)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No items for this filter.
          </div>
        ) : (
          filtered.map(update => (
            <article
              key={update.id}
              className="feed-item fade-in"
              onClick={() => setSelected(update)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelected(update)}
              aria-label={`${update.source}: ${update.title}`}
            >
              <div className="feed-item-header">
                <span className={`feed-source-badge ${badgeClass(update.source)}`}>
                  {SOURCE_LABELS[update.source] || update.source}
                </span>
                <span className={`severity-dot ${update.severity}`} />
                {(update as any).isHantavirus && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(229,62,62,0.15)', color: '#fc8181', padding: '0.1rem 0.4rem', borderRadius: 100, fontWeight: 700 }}>
                    HANTAVIRUS
                  </span>
                )}
                <span className="feed-time">{relativeTime(update.timestamp)}</span>
              </div>
              <div className="feed-title">{update.title}</div>
              <div className="feed-content" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {update.content}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.4rem 0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#68d391', animation: 'pulse 2s infinite', display: 'inline-block' }} />
        Real scrape · WHO · ProMED · Google News · Bing · CDC · auto-refresh 60s · {filtered.length} items shown
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)} role="dialog" aria-modal="true" aria-labelledby="feed-modal-title">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 6 }}>
                  <span className={`feed-source-badge ${badgeClass(selected.source)}`}>{selected.source}</span>
                  <span style={{
                    fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 100,
                    background: selected.severity === 'critical' ? 'rgba(229,62,62,0.2)' : selected.severity === 'warning' ? 'rgba(214,158,46,0.2)' : 'rgba(49,130,206,0.2)',
                    color: selected.severity === 'critical' ? '#fc8181' : selected.severity === 'warning' ? '#f6e05e' : '#63b3ed',
                    textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em',
                  }}>
                    {selected.severity}
                  </span>
                </div>
                <h2 className="modal-title" id="feed-modal-title" style={{ fontSize: '0.9rem' }}>{selected.title}</h2>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
              {selected.content}
            </div>
            {(selected as any).url && (
              <a href={(selected as any).url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-surveillance)' }}>
                View original source ↗
              </a>
            )}
            <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Published: {new Date(selected.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
