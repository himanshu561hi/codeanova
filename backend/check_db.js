const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

async function checkCounts() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const total = await User.countDocuments();
  const pending = await User.countDocuments({ paymentStatus: 'Pending' });
  const paid = await User.countDocuments({ paymentStatus: 'Paid' });
  const lowercasePaid = await User.countDocuments({ paymentStatus: 'paid' });
  
  // Find all unique values for paymentStatus
  const uniqueStatus = await User.distinct('paymentStatus');

  console.log({ total, pending, paid, lowercasePaid, uniqueStatus });
  process.exit(0);
}

checkCounts().catch(console.error);
