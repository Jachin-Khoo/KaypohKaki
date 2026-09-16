const mongoose = require('mongoose');

const topicsSchema = new mongoose.Schema({
  housing: { type: Boolean, default: true },
  col: { type: Boolean, default: true },
  cpf: { type: Boolean, default: true },
  parenting: { type: Boolean, default: false },
  tax: { type: Boolean, default: false },
  health: { type: Boolean, default: false },
}, { _id: false });

const profileSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true, index: true },
  age: String,
  income: String,
  marital: String,
  housing: String,
  dependents: String,
  employment: String,
  topics: { type: topicsSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
