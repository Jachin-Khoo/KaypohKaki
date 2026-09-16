// Pulls Singapore news from GNews's free tier (requires a free GNEWS_API_KEY
// from https://gnews.io/). If no key is set, this contributes nothing and
// the feed falls back to whatever other sources are configured.
//
// Note: /top-headlines?country=sg alone is noisy (returns lots of unrelated
// global stories loosely tagged "sg"). /search with q=Singapore + country=sg,
// sorted by publish date, actually returns local Singapore news.

const { classify, stripHtml } = require('./classify');

const BASE_URL = 'https://gnews.io/api/v4/search';
const CACHE_TTL_MS = 15 * 60 * 1000; // free tier is capped at 100 requests/day

let cache = { items: null, fetchedAt: 0 };

async function fetchGNewsSingaporeFeed() {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  const now = Date.now();
  if (cache.items && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  const url = `${BASE_URL}?q=Singapore&country=sg&lang=en&sortby=publishedAt&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const body = await res.json();
  if (body.errors) {
    throw new Error(body.errors.join('; '));
  }

  const items = (body.articles || []).slice(0, 20).map((a) => {
    const title = stripHtml(a.title);
    const description = stripHtml(a.description);
    const { category, label } = classify(`${title} ${description}`);
    return {
      title,
      description,
      link: a.url,
      pubDate: a.publishedAt,
      category,
      tagLabel: label,
      thumbnail: a.image || null,
      source: a.source?.name || 'GNews',
    };
  });

  cache = { items, fetchedAt: now };
  return items;
}

module.exports = { fetchGNewsSingaporeFeed };
