const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  clientId: { type: String, required: true, index: true },
  todoId: { type: String, required: true },
  title: String,
  note: String,
  tag: String,
  tagClass: String,
  done: { type: Boolean, default: false },
}, { timestamps: true });

todoSchema.index({ clientId: 1, todoId: 1 }, { unique: true });

module.exports = mongoose.model('Todo', todoSchema);
