import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  code:             { type: String, required: true, unique: true },
  name:             { type: String, required: true },
  adminId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:           { type: String, enum: ['WAITING', 'IN_PROGRESS', 'ENDED'], default: 'WAITING' },
  questionsPerUser: { type: Number, default: 1, min: 1, max: 5 },
  maxTeamSize:      { type: Number, default: 4, min: 2, max: 10 },
  timeLimitMinutes: { type: Number, default: 30 },
  difficulty:       { type: String, enum: ['EASY', 'MEDIUM', 'HARD', 'MIXED'], default: 'MIXED' },
  teams:            [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  startTime:        { type: Date, default: null },
  endTime:          { type: Date, default: null },
  assignedQuestions: [{
    userId:      { type: mongoose.Schema.Types.ObjectId },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId }],
  }],
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
