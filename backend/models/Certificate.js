const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  domain: { type: String, required: true },
  duration: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  certificateId: { type: String, required: true, unique: true },
  pdfUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
