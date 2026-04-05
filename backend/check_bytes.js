import mongoose from 'mongoose';
import Question from './src/models/Question.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const q = await Question.findOne({ title: /Valid Parentheses/i });
  if (q) {
    console.log("Question Found");
    q.testCases.forEach((tc, i) => {
      console.log(`Case ${i+1}:`);
      console.log(`  Input: "${tc.input}"`);
      console.log(`  Expected: "${tc.expectedOutput}"`);
      console.log(`  Bytes: ${JSON.stringify([...tc.expectedOutput].map(c => c.charCodeAt(0)))}`);
    });
  }
  process.exit(0);
}
check();
