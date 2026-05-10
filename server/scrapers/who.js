const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Scrape WHO Disease Outbreak News for hantavirus items
async function scrapeWHOOutbreakNews() {
  const url = 'https://www.who.int/emergencies/disease-outbreak-news';
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 });
  const $ = cheerio.load(data);

  const items = [];

  // WHO DON page uses various CSS structures — try multiple selectors
  const selectors = [
    '.sf-list-vertical__item',
    '.list-view--item',
    'li.list-view--item',
    '.don-item',
    'article',
  ];

  let found = false;
  for (const sel of selectors) {
    if ($(sel).length) {
      $(sel).each((_, el) => {
        const title = $(el).find('a, h3, h4, .title').first().text().trim();
        const href  = $(el).find('a').first().attr('href') || '';
        const date  = $(el).find('time, .date, .published').first().text().trim();
        const desc  = $(el).find('p, .summary').first().text().trim();

        if (!title) return;

        const isHanta =
          title.toLowerCase().includes('hanta') ||
          desc.toLowerCase().includes('hanta');

        items.push({
          title,
          url: href.startsWith('http') ? href : `https://www.who.int${href}`,
          date: date || new Date().toISOString(),
          description: desc.slice(0, 400),
          isHantavirus: isHanta,
          source: 'WHO DON',
        });
      });
      if (items.length) { found = true; break; }
    }
  }

  // If structured selectors failed, grab all anchor links in main content
  if (!found) {
    $('main a, #content a, .content a').each((_, a) => {
      const title = $(a).text().trim();
      if (title.length < 10) return;
      const href  = $(a).attr('href') || '';
      items.push({
        title,
        url: href.startsWith('http') ? href : `https://www.who.int${href}`,
        date: new Date().toISOString(),
        description: '',
        isHantavirus: title.toLowerCase().includes('hanta'),
        source: 'WHO DON',
      });
    });
  }

  return items.slice(0, 30);
}

// Scrape WHO RSS feed (XML — very reliable)
async function scrapeWHORSS() {
  const Parser = require('rss-parser');
  const parser = new Parser({ timeout: 15000, headers: HEADERS });
  // Try multiple WHO RSS feed URLs in case one moves
  let feed;
  const urls = [
    'https://www.who.int/feeds/entity/csr/don/en/rss.xml',
    'https://www.who.int/rss-feeds/news-releases.xml',
    'https://www.who.int/feeds/entity/newsroom/news/en/rss.xml',
  ];
  for (const url of urls) {
    try { feed = await parser.parseURL(url); break; } catch { /* try next */ }
  }
  if (!feed) throw new Error('All WHO RSS URLs failed');

  return (feed.items || []).map(item => ({
    title: item.title || '',
    url: item.link || '',
    date: item.pubDate || item.isoDate || new Date().toISOString(),
    description: (item.contentSnippet || item.summary || '').slice(0, 500),
    isHantavirus:
      (item.title || '').toLowerCase().includes('hanta') ||
      (item.contentSnippet || '').toLowerCase().includes('hanta'),
    source: 'WHO RSS',
  }));
}

module.exports = { scrapeWHOOutbreakNews, scrapeWHORSS };
