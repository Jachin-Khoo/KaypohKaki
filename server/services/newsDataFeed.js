// Pulls Singapore news from NewsData.io's free-tier API (requires a free
// NEWSDATA_API_KEY from https://newsdata.io/register). If no key is set,
// this silently contributes nothing and the feed falls back to CNA alone —
// so the app works out of the box, and gets richer once a key is added.

const { classify, stripHtml } = require('./classify');

const BASE_URL = 'https://newsdata.io/api/1/latest';
const CACHE_TTL_MS = 15 * 60 * 1000; // free tier has a small daily request cap

let cache = { items: null, fetchedAt: 0 };

async function fetchNewsDataSingaporeFeed() {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) return [];

  const now = Date.now();
  if (cache.items && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  // country=sg alone just returns Google News's Singapore edition, which is
  // mostly reposted global wire stories. Restricting to real Singapore
  // outlets plus a "Singapore" keyword match gives genuinely local news.
  const domains = 'channelnewsasia,straitstimes,mothership,businesstimes';
  const url = `${BASE_URL}?apikey=${encodeURIComponent(apiKey)}&domain=${domains}&q=Singapore&language=en`;
  const res = await fetch(url);
  const body = await res.json();
  if (body.status !== 'success') {
    throw new Error(body.results?.message || `NewsData.io responded ${res.status}`);
  }

  const items = (body.results || []).slice(0, 20).map((a) => {
    const title = stripHtml(a.title);
    const description = stripHtml(a.description);
    const { category, label } = classify(`${title} ${description}`);
    return {
      title,
      description,
      link: a.link,
      pubDate: a.pubDate,
      category,
      tagLabel: label,
      thumbnail: a.image_url || null,
      source: a.source_id ? a.source_id.toUpperCase() : 'NewsData',
    };
  });

  cache = { items, fetchedAt: now };
  return items;
}

module.exports = { fetchNewsDataSingaporeFeed };
