import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username:      { type: String, required: true, unique: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  passwordHash:  { type: String, required: true },
  token:         { type: String, default: null },
  isVerified:    { type: Boolean, default: false },
  verifyCode:    { type: String, default: null },
  forgotCode:    { type: String, default: null },
  forgotExpires: { type: Date, default: null },
  activeRoomId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  currentTeamId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
