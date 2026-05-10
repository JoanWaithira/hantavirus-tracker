import { useState, useCallback, useEffect } from 'react';
import './styles/globals.css';
import AlertBanner from './components/AlertBanner';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import { fetchGlobalStats } from './services/dataService';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchGlobalStats().then((s) => setLastUpdated(s.lastUpdated)).catch(() => {});
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const s = await fetchGlobalStats();
      setLastUpdated(s.lastUpdated);
      setRefreshKey((k) => k + 1);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="app-wrapper" data-theme={theme}>
      <a href="#main-content" className="sr-only">Skip to main content</a>
      <AlertBanner />
      <Header
        lastUpdated={lastUpdated}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <div id="main-content">
        <Dashboard key={refreshKey} />
      </div>
      <footer className="footer" role="contentinfo">
        <span>
          HantaVirusWatch — Educational Surveillance Dashboard · Data sourced from CDC, WHO, ECDC
        </span>
        <span>
          ⚠️ For educational & public health awareness purposes only · Not a clinical tool
        </span>
      </footer>
    </div>
  );
}

export default App;
