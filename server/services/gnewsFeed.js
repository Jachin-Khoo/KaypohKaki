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

function normalizeArticle(a) {
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
}

async function gnewsSearch(q, sortby) {
  const apiKey = process.env.GNEWS_API_KEY;
  const url = `${BASE_URL}?q=${encodeURIComponent(q)}&country=sg&lang=en&sortby=${sortby}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const body = await res.json();
  if (body.errors) throw new Error(body.errors.join('; '));
  return (body.articles || []).slice(0, 20).map(normalizeArticle);
}

async function fetchGNewsSingaporeFeed() {
  if (!process.env.GNEWS_API_KEY) return [];

  const now = Date.now();
  if (cache.items && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items;
  }

  const items = await gnewsSearch('Singapore', 'publishedAt');
  cache = { items, fetchedAt: now };
  return items;
}

// On-demand search, scoped to Singapore, driven by the user's own query —
// not cached, since results should reflect exactly what was typed.
// Note: sortby=relevance silently returns zero articles on the free tier
// (totalArticles is still nonzero, but the articles array comes back
// empty) — publishedAt is what actually works.
async function searchGNews(query) {
  if (!process.env.GNEWS_API_KEY) return null; // caller distinguishes "no key" from "no results"
  return gnewsSearch(`${query} Singapore`, 'publishedAt');
}

module.exports = { fetchGNewsSingaporeFeed, searchGNews };
