const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept': '*/*',
};

async function scrapeProMEDRSS() {
  const Parser = require('rss-parser');
  const parser = new Parser({ timeout: 15000, headers: HEADERS });
  // Try multiple ProMED feed URLs
  let feed;
  const urls = [
    'https://promedmail.org/feed/',
    'https://promedmail.org/?feed=atom',
    'https://promedmail.org/promed-post/feed/',
  ];
  for (const url of urls) {
    try { feed = await parser.parseURL(url); break; } catch { /* try next */ }
  }
  if (!feed) throw new Error('All ProMED RSS URLs failed');

  return (feed.items || []).map(item => ({
    title: item.title || '',
    url: item.link || '',
    date: item.pubDate || item.isoDate || new Date().toISOString(),
    description: (item.contentSnippet || item.summary || '').replace(/<[^>]+>/g, '').slice(0, 600),
    isHantavirus:
      (item.title || '').toLowerCase().includes('hanta') ||
      (item.contentSnippet || '').toLowerCase().includes('hanta') ||
      (item.categories || []).some(c => c.toLowerCase().includes('hanta')),
    source: 'ProMED',
  }));
}

async function scrapeProMEDSearch() {
  const url = 'https://promedmail.org/?s=hantavirus';
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(data);

  const items = [];
  $('article, .post, .entry').each((_, el) => {
    const title = $(el).find('h2, h3, .entry-title').first().text().trim();
    const href  = $(el).find('a').first().attr('href') || '';
    const date  = $(el).find('time, .entry-date, .date').first().text().trim();
    const desc  = $(el).find('p, .entry-summary').first().text().trim();
    if (!title) return;
    items.push({
      title,
      url: href || url,
      date: date || new Date().toISOString(),
      description: desc.slice(0, 400),
      isHantavirus: true,
      source: 'ProMED',
    });
  });

  return items.slice(0, 10);
}

module.exports = { scrapeProMEDRSS, scrapeProMEDSearch };
