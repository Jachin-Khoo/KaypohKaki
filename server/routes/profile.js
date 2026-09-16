const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

router.get('/:clientId', async (req, res) => {
  const profile = await Profile.findOne({ clientId: req.params.clientId });
  res.json(profile || null);
});

router.post('/', async (req, res) => {
  const { clientId, ...fields } = req.body;
  if (!clientId) return res.status(400).json({ error: 'clientId is required' });
  const profile = await Profile.findOneAndUpdate(
    { clientId },
    { $set: fields },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(profile);
});

router.put('/:clientId/topics', async (req, res) => {
  const profile = await Profile.findOneAndUpdate(
    { clientId: req.params.clientId },
    { $set: { topics: req.body.topics } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(profile);
});

module.exports = router;
