const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

async function checkMaxId() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const currentYear = new Date().getFullYear();
  const pattern = new RegExp(`^CN/INT/${currentYear}/`);
  
  const users = await User.find({ studentId: pattern }).lean();
  console.log(`Found ${users.length} users for ${currentYear}`);
  
  const ids = users.map(u => {
    const parts = u.studentId.split('/');
    return parseInt(parts[parts.length - 1], 10);
  }).filter(n => !isNaN(n));
  
  if (ids.length > 0) {
    const maxId = Math.max(...ids);
    console.log(`Max Student ID number: ${maxId}`);
    console.log(`Suggested Next ID: ${maxId + 1}`);
  } else {
    console.log("No users found for this year. Starting from 501.");
  }
  
  process.exit(0);
}

checkMaxId();
