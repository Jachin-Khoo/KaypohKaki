const express = require('express');
const router = express.Router();
const { fetchCnaSingaporeFeed } = require('../services/cnaFeed');
const { fetchNewsDataSingaporeFeed } = require('../services/newsDataFeed');

router.get('/', async (req, res) => {
  const [cna, newsData] = await Promise.allSettled([
    fetchCnaSingaporeFeed(),
    fetchNewsDataSingaporeFeed(),
  ]);

  const items = [
    ...(cna.status === 'fulfilled' ? cna.value : []),
    ...(newsData.status === 'fulfilled' ? newsData.value : []),
  ].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (!items.length && cna.status === 'rejected' && newsData.status === 'rejected') {
    return res.status(502).json({ error: 'Could not reach any news source' });
  }

  res.json(items);
});

module.exports = router;
