const express = require('express');
const router = express.Router();
const { fetchCnaSingaporeFeed } = require('../services/cnaFeed');
const { fetchNewsDataSingaporeFeed } = require('../services/newsDataFeed');
const { fetchGNewsSingaporeFeed, searchGNews } = require('../services/gnewsFeed');

router.get('/', async (req, res) => {
  const results = await Promise.allSettled([
    fetchCnaSingaporeFeed(),
    fetchNewsDataSingaporeFeed(),
    fetchGNewsSingaporeFeed(),
  ]);

  const items = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (!items.length && results.every((r) => r.status === 'rejected')) {
    return res.status(502).json({ error: 'Could not reach any news source' });
  }

  res.json(items);
});

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const items = await searchGNews(q);
    if (items === null) {
      return res.status(501).json({ error: 'Search needs a GNEWS_API_KEY configured on the server' });
    }
    res.json(items);
  } catch (err) {
    res.status(502).json({ error: 'Search failed', detail: err.message });
  }
});

module.exports = router;
