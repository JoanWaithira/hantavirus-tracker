import React from 'react';

interface HeaderProps {
  lastUpdated: string;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, theme, onThemeToggle, onRefresh, isRefreshing }) => {
  const fmtTime = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="header" role="banner">
      <div className="header-brand">
        <div className="header-logo" aria-hidden="true">🦠</div>
        <div>
          <div className="header-title">HantaVirusWatch</div>
          <div className="header-subtitle">Global Surveillance Dashboard</div>
        </div>
      </div>

      <div className="header-center">
        <span className="status-badge critical" role="status" aria-label="CDC Level 3 Emergency Response Active">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fc8181', display: 'inline-block', animation: 'pulse 1.5s infinite' }} aria-hidden="true" />
          CDC Level 3 Active
        </span>
        <span className="status-badge warning" aria-label="WHO Risk: Low for general public">
          ⚠️ WHO Risk: LOW
        </span>
        <span className="status-badge info" aria-label="Andes virus strain detected">
          🧬 Andes Virus
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
        <div className="header-controls">
          <button
            className="theme-toggle"
            onClick={onThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={onRefresh}
            aria-label="Refresh data"
            title="Refresh data"
            disabled={isRefreshing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
        {lastUpdated && (
          <div className="last-updated" aria-live="polite">
            Last updated: {fmtTime(lastUpdated)}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
