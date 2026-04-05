import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  roomId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:  [{
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    isReady:  { type: Boolean, default: false },
  }],
  score:   { type: Number, default: 0 },
  maxSize: { type: Number, default: 4 },
  isReady: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Team', teamSchema);
