import mongoose from 'mongoose';
import Submission from './src/models/Submission.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const s = await Submission.findOne().sort({ createdAt: -1 });
  console.log(JSON.stringify(s, null, 2));
  process.exit(0);
}
check();
