// Pulls CNA's official public RSS feed (meant for syndication) for the
// Singapore category and normalises it into the shape the dashboard cards
// expect, with a light keyword classifier standing in for the "AI matching"
// described in the project brief — swap classify() for a real LLM call later.

const { XMLParser } = require('fast-xml-parser');
const { classify, stripHtml } = require('./classify');

const FEED_URL = 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=10416';
const CACHE_TTL_MS = 5 * 60 * 1000; // be a polite consumer of a third-party feed

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

let cache = { items: null, fetchedAt: 0 };

async function fetchCnaSingaporeFeed() {
  const now = Date.now();
  if (cache.items && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KaypohKaki/1.0)' },
  });
  if (!res.ok) throw new Error(`CNA feed responded ${res.status}`);
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
      thumbnail: item['media:thumbnail']?.['@_url'] || null,
      source: 'CNA',
    };
  });

  cache = { items, fetchedAt: now };
  return items;
}

module.exports = { fetchCnaSingaporeFeed };
