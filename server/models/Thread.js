const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: String,
  category: { type: String, default: 'general' },
  author: { type: String, default: 'Anonymous' },
  replies: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Thread', threadSchema);
