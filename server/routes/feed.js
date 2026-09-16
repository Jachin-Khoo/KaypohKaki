const express = require('express');
const router = express.Router();
const { fetchCnaSingaporeFeed } = require('../services/cnaFeed');
const { fetchNewsDataSingaporeFeed } = require('../services/newsDataFeed');
const { fetchGNewsSingaporeFeed } = require('../services/gnewsFeed');

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

module.exports = router;
