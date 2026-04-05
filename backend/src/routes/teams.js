import express from 'express';
import Team from '../models/Team.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { getIo } from '../socket.js';

const router = express.Router();
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

router.post('/', auth, async (req, res) => {
  try {
    const { name, roomId, maxSize } = req.body;
    const room = await Room.findById(roomId);
    if (!room || room.status !== 'WAITING') return res.status(400).json({ error: 'Room not available' });
    // Check via user doc first (handles stale DB state)
    if (req.user.currentTeamId) {
      const staleTeam = await Team.findById(req.user.currentTeamId);
      if (staleTeam && staleTeam.roomId.toString() === roomId) {
        return res.status(400).json({ error: 'Already in a team in this room' });
      }
      // Stale reference to a deleted/different room's team — clear it
      req.user.currentTeamId = null;
      await req.user.save();
    }
    // Extra DB guard
    const existing = await Team.findOne({ roomId, 'members.userId': req.user._id });
    if (existing) return res.status(400).json({ error: 'Already in a team' });
    const team = await Team.create({
      code: genCode(), name, roomId, leaderId: req.user._id, maxSize: maxSize || room.maxTeamSize || 4,
      members: [{ userId: req.user._id, username: req.user.username, isReady: false }],
    });
    room.teams.push(team._id);
    await room.save();
    req.user.currentTeamId = team._id;
    await req.user.save();
    getIo().to(`room:${roomId}`).emit('room:team_added', team);
    getIo().emit('dashboard:room_updated', roomId);
    res.json(team);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const team = await Team.findOne({ code });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const room = await Room.findById(team.roomId);
    if (!room || room.status !== 'WAITING') return res.status(400).json({ error: 'Room not available' });
    // Check if already in a team in this room
    if (req.user.currentTeamId) {
      const staleTeam = await Team.findById(req.user.currentTeamId);
      if (staleTeam && staleTeam.roomId.toString() === team.roomId.toString()) {
        return res.status(400).json({ error: 'Already in a team in this room' });
      }
      req.user.currentTeamId = null;
      await req.user.save();
    }
    const already = team.members.find(m => m.userId.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ error: 'Already in this team' });
    if (team.members.length >= (team.maxSize || 4)) return res.status(400).json({ error: 'Team is full' });
    team.members.push({ userId: req.user._id, username: req.user.username, isReady: false });
    await team.save();
    req.user.currentTeamId = team._id;
    await req.user.save();
    getIo().to(`room:${team.roomId}`).emit('room:team_updated', team);
    res.json(team);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.patch('/:id/ready', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const member = team.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ error: 'Not in this team' });
    member.isReady  = !member.isReady;
    team.isReady    = team.members.every(m => m.isReady);
    await team.save();
    getIo().to(`room:${team.roomId}`).emit('room:team_updated', team);
    res.json(team);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.leaderId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not leader' });
    if (req.params.userId === req.user._id.toString()) return res.status(400).json({ error: 'Cannot kick yourself' });
    team.members = team.members.filter(m => m.userId.toString() !== req.params.userId);
    team.isReady = team.members.length > 0 && team.members.every(m => m.isReady); // Recalculate team ready status
    await team.save();
    
    // Import User directly from the top
    await User.findByIdAndUpdate(req.params.userId, { currentTeamId: null });
    getIo().to(`room:${team.roomId}`).emit('room:team_updated', team);
    res.json(team);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/:id/leave', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const isMember = team.members.some(m => m.userId.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Not in this team' });
    
    if (team.leaderId.toString() === req.user._id.toString()) {
      await Team.findByIdAndDelete(team._id);
      await Room.findByIdAndUpdate(team.roomId, { $pull: { teams: team._id } });
      const userIds = team.members.map(m => m.userId);
      await User.updateMany({ _id: { $in: userIds } }, { currentTeamId: null });
      getIo().to(`room:${team.roomId}`).emit('room:team_deleted', team._id);
      
      getIo().emit('dashboard:room_updated', team.roomId);
      return res.json({ message: 'Team disbanded' });
    } else {
      team.members = team.members.filter(m => m.userId.toString() !== req.user._id.toString());
      team.isReady = team.members.length > 0 && team.members.every(m => m.isReady);
      await team.save();
      await User.findByIdAndUpdate(req.user._id, { currentTeamId: null });
      getIo().to(`room:${team.roomId}`).emit('room:team_updated', team);
      return res.json({ message: 'Left team' });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const teams = await Team.find({ roomId: req.params.roomId }).populate('members.userId', 'username');
    res.json(teams);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

export default router;
