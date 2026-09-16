// Wraps The Straits Times' free, public Singapore-section RSS feed into the
// same normalised JSON shape as every other source — this is exactly what
// GET /api/feed is: a real REST API, regardless of what format the
// underlying source publishes in.

const { XMLParser } = require('fast-xml-parser');
const { classify, stripHtml } = require('./classify');

const FEED_URL = 'https://www.straitstimes.com/news/singapore/rss.xml';
const CACHE_TTL_MS = 5 * 60 * 1000; // be a polite consumer of a third-party feed

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

let cache = { items: null, fetchedAt: 0 };

async function fetchStraitsTimesSingaporeFeed() {
  const now = Date.now();
  if (cache.items && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KaypohKaki/1.0)' },
  });
  if (!res.ok) throw new Error(`Straits Times feed responded ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;
  const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const items = list.slice(0, 20).map((item) => {
    const title = stripHtml(item.title);
    const description = stripHtml(item.description);
    const { category, label } = classify(`${title} ${description}`);
    return {
      title,
      description,
      link: item.link,
      pubDate: item.pubDate,
      category,
      tagLabel: label,
      thumbnail: null,
      source: 'The Straits Times',
    };
  });

  cache = { items, fetchedAt: now };
  return items;
}

module.exports = { fetchStraitsTimesSingaporeFeed };
