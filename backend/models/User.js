const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  studentId: { type: String, unique: true, trim: true },
  course: { type: String, required: true },
  branch: { type: String, required: true },
  currentYear: { type: String, required: true },
  collegeName: { type: String, required: true },
  state: { type: String, required: true },
  preferredDomain: { type: String, required: true },
  preferredDuration: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  profilePic: { type: String, default: null },
  internshipStartDate: { type: String, default: 'Unassigned' },
  offerLetterSent: { type: Boolean, default: false },
  certificateSent: { type: Boolean, default: false },
  badges: { type: [String], default: [] },
  adminNote: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  isDownloaded: { type: Boolean, default: false },
  certificateId: { type: String, unique: true, sparse: true, trim: true },
  lastProjectNotified: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);