import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { sendVerificationEmail, sendForgotEmail, sendResendEmail } from '../utils/email.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const genCode  = () => Math.floor(100000 + Math.random() * 900000).toString();
const genToken = () => crypto.randomBytes(32).toString('hex');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (await User.findOne({ email }))    return res.status(400).json({ error: 'Email already in use' });
    if (await User.findOne({ username })) return res.status(400).json({ error: 'Username taken' });
    const passwordHash = await bcrypt.hash(password, 10);
    const verifyCode   = genCode();
    const user = await User.create({ username, email, passwordHash, verifyCode, isVerified: false });
    await sendVerificationEmail(email, verifyCode);
    res.json({ message: 'Check your email for verification code' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.verifyCode !== code) return res.status(400).json({ error: 'Invalid code' });
    user.isVerified = true;
    user.verifyCode = null;
    user.token      = genToken();
    await user.save();
    res.json({ token: user.token, user: { _id: user._id, username: user.username, email: user.email } });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ error: 'Please verify your email first' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    user.token = genToken();
    await user.save();
    res.json({ token: user.token, user: { _id: user._id, username: user.username, email: user.email } });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      user.forgotCode    = genCode();
      user.forgotExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      await sendForgotEmail(email, user.forgotCode);
    }
    res.json({ message: 'Reset code sent to your email' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.forgotCode !== code || !user.forgotExpires || user.forgotExpires < new Date())
      return res.status(400).json({ error: 'Invalid or expired code' });
    user.passwordHash  = await bcrypt.hash(newPassword, 10);
    user.forgotCode    = null;
    user.forgotExpires = null;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Already verified' });
    user.verifyCode = genCode();
    await user.save();
    await sendResendEmail(email, user.verifyCode);
    res.json({ message: 'Verification code resent' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/logout', auth, async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.json({ message: 'Logged out' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.activeRoomId) {
      const room = await Room.findById(req.user.activeRoomId);
      if (!room || room.status === 'ENDED') {
        req.user.activeRoomId = null;
        req.user.currentTeamId = null;
        await req.user.save();
      }
    }
    res.json({ _id: req.user._id, username: req.user.username, email: req.user.email, activeRoomId: req.user.activeRoomId, currentTeamId: req.user.currentTeamId });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

export default router;
