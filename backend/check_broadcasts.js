const mongoose = require('mongoose');
require('dotenv').config();
const Broadcast = require('./models/Broadcast');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const broadcasts = await Broadcast.find();
  console.log('ALL BROADCASTS:', broadcasts);
  const active = await Broadcast.findOne({ active: true });
  console.log('ACTIVE BROADCAST:', active);
  process.exit();
}
check();
