const express = require('express');
const cors = require('cors');
const path = require('path');
const { scrapeCDCStats, scrapeCDCAlerts } = require('./scrapers/cdc');
const { scrapeWHOOutbreakNews, scrapeWHORSS } = require('./scrapers/who');
const { scrapeProMEDRSS, scrapeProMEDSearch } = require('./scrapers/promed');
const { scrapeGoogleNewsRSS, scrapeBingNewsRSS, scrapeECDC } = require('./scrapers/news');
const { scrapeEuropeData } = require('./scrapers/ecdc_europe');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ── In-memory cache ────────────────────────────────────────────────────────
const cache = {};
const TTL = {
  feed: 5 * 60 * 1000,      // live feed: 5 min
  stats: 15 * 60 * 1000,    // case stats: 15 min
  news: 5 * 60 * 1000,      // news: 5 min
};

function getCache(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL[key] || TTL.feed) return null;
  return entry.data;
}

function setCache(key, data, ttl) {
  cache[key] = { data, ts: Date.now(), ttl };
}

function isFresh(key, ttl) {
  const entry = cache[key];
  if (!entry) return false;
  return Date.now() - entry.ts < ttl;
}

// ── helpers ────────────────────────────────────────────────────────────────

// Normalise any scraped item into a unified LiveUpdate shape
function toUpdate(item, idx, defaultSource) {
  const severity = (() => {
    const t = (item.title || '').toLowerCase();
    const d = (item.description || '').toLowerCase();
    if (t.includes('death') || t.includes('fatal') || t.includes('emergency') ||
        t.includes('outbreak') || d.includes('died') || d.includes('fatality')) return 'critical';
    if (t.includes('alert') || t.includes('warning') || t.includes('risk') ||
        t.includes('surge') || t.includes('spread')) return 'warning';
    return 'info';
  })();

  return {
    id: `${defaultSource}-${idx}-${Date.now()}`,
    timestamp: (() => {
      try { return new Date(item.date).toISOString(); }
      catch { return new Date().toISOString(); }
    })(),
    source: item.source || defaultSource,
    severity,
    title: (item.title || '').trim(),
    content: (item.description || item.url || '').trim(),
    url: item.url || null,
    isHantavirus: item.isHantavirus || false,
  };
}

// ── Background refresh loop ────────────────────────────────────────────────

let feedCache = [];
let feedCacheTs = 0;
let statsCacheData = null;
let statsCacheTs = 0;
let europeCacheData = null;
let europeCacheTs = 0;
const EUROPE_TTL = 60 * 60 * 1000; // 1 hour — ECDC data changes slowly
const FEED_TTL  = 5  * 60 * 1000;
const STATS_TTL = 15 * 60 * 1000;

async function refreshFeed() {
  console.log('[scraper] Refreshing live feed…');
  const results = await Promise.allSettled([
    scrapeWHORSS(),
    scrapeProMEDRSS(),
    scrapeGoogleNewsRSS(),
    scrapeProMEDSearch(),
    scrapeBingNewsRSS(),
    scrapeWHOOutbreakNews(),
    scrapeCDCAlerts(),
  ]);

  const labels = ['WHO-RSS','ProMED-RSS','Google-News','ProMED-Search','Bing-News','WHO-DON','CDC-HAN'];
  const sources = {};
  const all = [];

  results.forEach((r, i) => {
    const label = labels[i];
    if (r.status === 'fulfilled') {
      const items = Array.isArray(r.value) ? r.value : [];
      sources[label] = { ok: true, count: items.length };
      items.forEach((item, idx) => all.push(toUpdate(item, idx, label)));
      console.log(`  ✓ ${label}: ${items.length} items`);
    } else {
      sources[label] = { ok: false, error: r.reason?.message };
      console.log(`  ✗ ${label}: ${r.reason?.message}`);
    }
  });

  // Deduplicate by title similarity, sort newest first
  const seen = new Set();
  const deduped = all.filter(u => {
    const key = u.title.slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  feedCache = deduped;
  feedCacheTs = Date.now();
  console.log(`[scraper] Feed ready: ${deduped.length} unique items`);
  return { updates: deduped, sources };
}

async function refreshStats() {
  console.log('[scraper] Refreshing CDC stats…');
  const [cdcResult, ecdcResult] = await Promise.allSettled([
    scrapeCDCStats(),
    scrapeECDC(),
  ]);

  const cdcData  = cdcResult.status  === 'fulfilled' ? cdcResult.value  : null;
  const ecdcData = ecdcResult.status === 'fulfilled' ? ecdcResult.value : null;

  statsCacheData = {
    cdc: cdcData,
    ecdc: ecdcData,
    scrapedAt: new Date().toISOString(),
    sources: {
      cdc:  cdcResult.status  === 'fulfilled',
      ecdc: ecdcResult.status === 'fulfilled',
    },
  };
  statsCacheTs = Date.now();
  console.log('[scraper] Stats ready');
  return statsCacheData;
}

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/live-feed  — real scraped updates
app.get('/api/live-feed', async (req, res) => {
  try {
    if (!feedCache.length || Date.now() - feedCacheTs > FEED_TTL) {
      await refreshFeed();
    }
    // Separate hantavirus-specific vs general disease news
    const hanta   = feedCache.filter(u => u.isHantavirus);
    const general = feedCache.filter(u => !u.isHantavirus);
    res.json({
      updates: feedCache,
      hantavirusSpecific: hanta,
      generalDisease: general,
      totalCount: feedCache.length,
      lastRefreshed: new Date(feedCacheTs).toISOString(),
      cacheAge: Math.round((Date.now() - feedCacheTs) / 1000),
    });
  } catch (err) {
    console.error('[/api/live-feed]', err.message);
    res.status(500).json({ error: err.message, updates: [] });
  }
});

// GET /api/scraped-stats  — CDC & ECDC scraped case statistics
app.get('/api/scraped-stats', async (req, res) => {
  try {
    if (!statsCacheData || Date.now() - statsCacheTs > STATS_TTL) {
      await refreshStats();
    }
    res.json(statsCacheData);
  } catch (err) {
    console.error('[/api/scraped-stats]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news  — hantavirus news only (Google + Bing)
app.get('/api/news', async (req, res) => {
  try {
    const [google, bing] = await Promise.allSettled([
      scrapeGoogleNewsRSS(),
      scrapeBingNewsRSS(),
    ]);
    const items = [
      ...(google.status === 'fulfilled' ? google.value : []),
      ...(bing.status   === 'fulfilled' ? bing.value   : []),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Deduplicate
    const seen = new Set();
    const deduped = items.filter(i => {
      const k = (i.title || '').slice(0, 50).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    res.json({
      articles: deduped,
      count: deduped.length,
      sources: { google: google.status === 'fulfilled', bing: bing.status === 'fulfilled' },
    });
  } catch (err) {
    res.status(500).json({ error: err.message, articles: [] });
  }
});

// POST /api/feedback  — send feedback email to dashboard owner
app.post('/api/feedback', async (req, res) => {
  const { name, email, type, message } = req.body;

  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Message too short.' });
  }

  // If email credentials are not configured, log and acknowledge gracefully
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[feedback] Email not configured — logging submission:');
    console.log(`  From: ${name || 'Anonymous'} <${email || 'no-reply'}>`);
    console.log(`  Type: ${type || 'General'}`);
    console.log(`  Message: ${message}`);
    return res.json({ ok: true, delivered: false, note: 'Logged server-side (email not yet configured).' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"HantaVirusWatch Feedback" <${process.env.GMAIL_USER}>`,
      to: 'joanwaithira.jw@gmail.com',
      replyTo: email || process.env.GMAIL_USER,
      subject: `[HantaVirusWatch] ${type || 'Feedback'} from ${name || 'Anonymous'}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#1a202c;color:#e2e8f0;border-radius:8px">
          <h2 style="color:#fc8181;margin-top:0">HantaVirusWatch — New Feedback</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr><td style="color:#a0aec0;padding:4px 0;width:100px">From</td><td style="font-weight:700">${name || 'Anonymous'}</td></tr>
            <tr><td style="color:#a0aec0;padding:4px 0">Email</td><td>${email || '—'}</td></tr>
            <tr><td style="color:#a0aec0;padding:4px 0">Type</td><td><span style="background:#e53e3e22;color:#fc8181;padding:2px 10px;border-radius:100px;font-size:12px">${type || 'General'}</span></td></tr>
            <tr><td style="color:#a0aec0;padding:4px 0">Time</td><td>${new Date().toUTCString()}</td></tr>
          </table>
          <div style="background:#2d3748;border-radius:6px;padding:16px;line-height:1.6;white-space:pre-wrap">${message}</div>
        </div>
      `,
    });

    res.json({ ok: true, delivered: true });
  } catch (err) {
    console.error('[feedback] Email send failed:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
});

// GET /api/europe-data  — ECDC European hantavirus surveillance data
app.get('/api/europe-data', async (req, res) => {
  try {
    if (!europeCacheData || Date.now() - europeCacheTs > EUROPE_TTL) {
      console.log('[scraper] Fetching European ECDC data…');
      europeCacheData = await scrapeEuropeData();
      europeCacheTs = Date.now();
      console.log(`[scraper] Europe data ready: ${europeCacheData.countries.length} countries (liveData=${europeCacheData.liveData})`);
    }
    res.json(europeCacheData);
  } catch (err) {
    console.error('[/api/europe-data]', err.message);
    res.status(500).json({ error: err.message, countries: [] });
  }
});

// GET /api/health  — server + scraper status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    feedCached: feedCache.length,
    feedAge: feedCacheTs ? Math.round((Date.now() - feedCacheTs) / 1000) : null,
    statsAge: statsCacheTs ? Math.round((Date.now() - statsCacheTs) / 1000) : null,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Force a manual refresh
app.post('/api/refresh', async (req, res) => {
  try {
    const [feed, stats] = await Promise.all([refreshFeed(), refreshStats()]);
    res.json({ ok: true, feedCount: feed.updates.length, statsOk: !!stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Serve React build in production ───────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));
  // All non-API routes serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🦠  HantaVirusWatch scraping server running on http://localhost:${PORT}`);
  console.log('   Endpoints:');
  console.log('   GET  /api/live-feed     — WHO + ProMED + Google News + Bing');
  console.log('   GET  /api/scraped-stats — CDC + ECDC case statistics');
  console.log('   GET  /api/news          — News articles only');
  console.log('   GET  /api/health        — Server status');
  console.log('   POST /api/refresh       — Force cache refresh\n');

  // Warm up caches on startup
  refreshFeed().catch(e => console.error('Feed warm-up failed:', e.message));
  refreshStats().catch(e => console.error('Stats warm-up failed:', e.message));
});
