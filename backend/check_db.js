import mongoose from 'mongoose';
import Question from './src/models/Question.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const qs = await Question.find().limit(2);
  console.log(JSON.stringify(qs, null, 2));
  process.exit(0);
}
check();
