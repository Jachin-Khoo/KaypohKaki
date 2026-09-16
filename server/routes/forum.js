const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');

router.get('/threads', async (req, res) => {
  const threads = await Thread.find().sort({ createdAt: -1 });
  res.json(threads);
});

router.post('/threads', async (req, res) => {
  const { title, body, category, author } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const thread = await Thread.create({
    title,
    body,
    category: category || 'general',
    author: author || 'Anonymous',
  });
  res.status(201).json(thread);
});

module.exports = router;
