const mongoose = require('mongoose');

const adminProjectSchema = new mongoose.Schema({
  domain: { type: String, required: true }, // e.g., 'Web Development', 'App Development'
  monthNumber: { type: Number, required: true }, // 1, 2, 3
  title: { type: String, required: true },
  description: { type: String, required: true },
  documentLink: { type: String, default: '' },
  tasks: { type: [String], default: [] }, // Optional task names
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminProject', adminProjectSchema);
