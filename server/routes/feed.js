const express = require('express');
const router = express.Router();
const { fetchCnaSingaporeFeed } = require('../services/cnaFeed');

router.get('/', async (req, res) => {
  try {
    const items = await fetchCnaSingaporeFeed();
    res.json(items);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach the CNA feed', detail: err.message });
  }
});

module.exports = router;
