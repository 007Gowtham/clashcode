import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  slug:        { type: String, unique: true, sparse: true },
  description: { type: String, required: true },
  difficulty:  { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
  tags:        [String],
  hints:       [String],
  isActive:    { type: Boolean, default: true },

  examples: [{
    input:       String,
    output:      String,
    explanation: String,
  }],

  constraints: [String],

  // testCases support both 'stdin' (from your seed data) and 'input' (legacy)
  testCases: [{
    stdin:          { type: String, default: '' },  // primary field
    input:          { type: String, default: '' },  // legacy alias
    expectedOutput: { type: String, default: '' },  // empty string allowed (e.g. empty list output)
    difficulty:     { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
    isHidden:       { type: Boolean, default: true },
    order:          { type: Number, default: 0 },
  }],

  timeLimit:   { type: Number, default: 2000 },
  memoryLimit: { type: Number, default: 256 },

  starterCode: {
    javascript: { type: String, default: '' },
    python:     { type: String, default: '' },
    java:       { type: String, default: '' },
    cpp:        { type: String, default: '' },
  },
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
