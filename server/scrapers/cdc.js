const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Scrape CDC Hantavirus HPS surveillance page for case stats + alerts
async function scrapeCDCStats() {
  const url = 'https://www.cdc.gov/hantavirus/data-research/hps-cases.html';
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(data);

  const stats = {
    totalUSCases: null,
    totalUSDeaths: null,
    cfr: null,
    timespan: '1993–present',
    source: url,
    scrapedAt: new Date().toISOString(),
  };

  // CDC pages typically have paragraph text with numbers
  const bodyText = $('body').text().replace(/\s+/g, ' ');

  // Extract total cases — CDC usually states something like "890 cases" or "890 laboratory-confirmed"
  const caseMatch = bodyText.match(/(\d{3,4})\s*(laboratory[- ]confirmed\s*)?cases?\s*(of HPS|of hantavirus|reported|have been)/i)
    || bodyText.match(/total\s+of\s+(\d{3,4})\s+cases/i)
    || bodyText.match(/(\d{3,4})\s+cases?\s+have\s+been\s+reported/i);
  if (caseMatch) stats.totalUSCases = parseInt(caseMatch[1], 10);

  // Extract CFR
  const cfrMatch = bodyText.match(/(\d{1,2})\s*%\s*(case[- ]fatality|died|fatality)/i)
    || bodyText.match(/case[- ]fatality\s+rate\s+(?:is\s+)?(?:approximately\s+)?(\d{1,2})\s*%/i);
  if (cfrMatch) stats.cfr = parseFloat(cfrMatch[1]);

  // Extract death count
  const deathMatch = bodyText.match(/(\d{2,3})\s*(people\s+)?died/i)
    || bodyText.match(/resulted\s+in\s+(\d{2,3})\s+deaths/i);
  if (deathMatch) stats.totalUSDeaths = parseInt(deathMatch[1], 10);

  // Scrape any state table that may exist
  const stateData = [];
  $('table').each((_, table) => {
    const headers = [];
    $(table).find('th').each((_, th) => headers.push($(th).text().trim().toLowerCase()));
    const hasStateCol = headers.some(h => h.includes('state'));
    const hasCaseCol  = headers.some(h => h.includes('case'));
    if (!hasStateCol || !hasCaseCol) return;

    $(table).find('tbody tr').each((_, tr) => {
      const cells = $(tr).find('td').map((_, td) => $(td).text().trim()).get();
      if (cells.length >= 2) {
        stateData.push({
          state: cells[0],
          cases: parseInt(cells[1], 10) || 0,
          deaths: cells[2] ? parseInt(cells[2], 10) || 0 : null,
        });
      }
    });
  });

  return { stats, stateData };
}

// Scrape CDC Health Alert Network for recent hantavirus advisories
async function scrapeCDCAlerts() {
  const url = 'https://emergency.cdc.gov/han/';
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(data);

  const alerts = [];
  $('table tr, .han-item, article, .list-item').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text.toLowerCase().includes('hanta')) return;

    const link = $(el).find('a').first();
    alerts.push({
      title: link.text().trim() || text.slice(0, 120),
      url: link.attr('href') || url,
      date: text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) ?
            text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)[0] : null,
      source: 'CDC HAN',
    });
  });

  return alerts;
}

module.exports = { scrapeCDCStats, scrapeCDCAlerts };
