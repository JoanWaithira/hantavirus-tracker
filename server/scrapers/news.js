const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

// Google News RSS — no API key, public endpoint
async function scrapeGoogleNewsRSS() {
  const Parser = require('rss-parser');
  const parser = new Parser({ timeout: 15000, headers: HEADERS });
  const url = 'https://news.google.com/rss/search?q=hantavirus&hl=en-US&gl=US&ceid=US:en';
  const feed = await parser.parseURL(url);

  return (feed.items || []).map(item => ({
    title: item.title || '',
    url: item.link || '',
    date: item.pubDate || item.isoDate || new Date().toISOString(),
    description: (item.contentSnippet || item.content || '').replace(/<[^>]+>/g, '').slice(0, 400),
    source: 'News',
    isHantavirus: true,
  }));
}

// Bing News RSS — backup news source
async function scrapeBingNewsRSS() {
  const Parser = require('rss-parser');
  const parser = new Parser({ timeout: 15000, headers: HEADERS });
  const url = 'https://www.bing.com/news/search?q=hantavirus&format=rss';
  const feed = await parser.parseURL(url);

  return (feed.items || []).map(item => ({
    title: item.title || '',
    url: item.link || '',
    date: item.pubDate || item.isoDate || new Date().toISOString(),
    description: (item.contentSnippet || '').replace(/<[^>]+>/g, '').slice(0, 400),
    source: 'News',
    isHantavirus: true,
  }));
}

// ECDC hantavirus surveillance page
async function scrapeECDC() {
  const url = 'https://www.ecdc.europa.eu/en/hantavirus-infections/surveillance-and-disease-data/disease-data-ecdc';
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(data);

  const stats = {};
  const bodyText = $('body').text().replace(/\s+/g, ' ');

  const caseMatch = bodyText.match(/(\d{1,4})\s+(?:cases?|notifications?)\s+(?:reported|of hantavirus)/i);
  if (caseMatch) stats.euCases = parseInt(caseMatch[1], 10);

  const items = [];
  $('table tbody tr').each((_, tr) => {
    const cells = $(tr).find('td').map((_, td) => $(td).text().trim()).get();
    if (cells.length >= 2) items.push(cells);
  });

  return { stats, tableRows: items.slice(0, 20), source: url };
}

module.exports = { scrapeGoogleNewsRSS, scrapeBingNewsRSS, scrapeECDC };
