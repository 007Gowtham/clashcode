import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  pass: { type: Boolean },
  timedOut: { type: Boolean },
  input: { type: String },
  rawInput: { type: String },
  expectedOutput: { type: String },
  actualOutput: { type: String },
  error: { type: String },
  code: { type: Number },
  signal: { type: String },
  isHidden: { type: Boolean },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  code: { type: String, required: true },
  language: { type: String, required: true },
  verdict: { type: String, enum: ['PENDING', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'WRONG_ANSWER', 'ERROR', 'TIME_LIMIT_EXCEEDED'], default: 'PENDING' },
  score: { type: Number, default: 0 },
  output: { type: String, default: '' },
  error: { type: String, default: '' },
  accepted: { type: Boolean, default: false },
  testResults: { type: [testResultSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);

