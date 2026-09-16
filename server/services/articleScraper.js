// On-demand full-article extraction, triggered only when a user opens a
// specific article — not run eagerly across the whole feed, to stay fast
// and polite to source sites. Uses whatever HTML the source serves to an
// anonymous visitor: this does not and cannot bypass paywalls (a premium
// Straits Times article will just extract to its public preview).

const { extract } = require('@extractus/article-extractor');

// Article HTML comes from arbitrary third-party sites — never forward it to
// the browser as markup (XSS risk). Flatten to plain text, keeping
// paragraph breaks so it's still readable.
function htmlToPlainText(html) {
  if (!html) return null;
  return html
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const CACHE_TTL_MS = 60 * 60 * 1000; // article content doesn't change once published
const cache = new Map(); // url -> { data, fetchedAt }

const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function isSafeUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  // block obvious private/internal IP ranges (basic SSRF guard, not exhaustive)
  if (/^(10\.|127\.|192\.168\.|169\.254\.)/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
  return true;
}

async function scrapeArticle(url) {
  if (!isSafeUrl(url)) {
    const err = new Error('Refused to fetch this URL');
    err.code = 'UNSAFE_URL';
    throw err;
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const article = await extract(url);
  if (!article) throw new Error('Could not extract article content');

  const data = {
    title: article.title || null,
    content: htmlToPlainText(article.content),
    image: article.image || null,
    author: article.author || null,
    publishedAt: article.published || null,
    source: article.source || null,
    url,
  };

  cache.set(url, { data, fetchedAt: Date.now() });
  return data;
}

module.exports = { scrapeArticle };
