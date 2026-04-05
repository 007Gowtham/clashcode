import express from 'express';
import Room from '../models/Room.js';
import Team from '../models/Team.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import Submission from '../models/Submission.js';
import { getIo } from '../socket.js';

const router = express.Router();
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

router.post('/', auth, async (req, res) => {
  try {
    const { name, questionsPerUser, timeLimitMinutes, difficulty, maxTeamSize } = req.body;
    const room = await Room.create({ code: genCode(), name, questionsPerUser, timeLimitMinutes, difficulty, maxTeamSize: maxTeamSize || 4, adminId: req.user._id });
    req.user.activeRoomId = room._id;
    await req.user.save();
    getIo().emit('dashboard:room_created', room);
    res.json(room);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ status: { $in: ['WAITING', 'IN_PROGRESS'] } })
      .populate('adminId', 'username email')
      .populate({ path: 'teams', populate: { path: 'members.userId', select: 'username' } });
    res.json(rooms);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate({ path: 'teams', populate: { path: 'members.userId', select: 'username' } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'WAITING') return res.status(400).json({ error: 'Room already started' });
    if (req.user.activeRoomId) return res.status(400).json({ error: 'Already in a room' });
    // Always clear any stale team association when joining a new room
    req.user.activeRoomId = room._id;
    req.user.currentTeamId = null;
    await req.user.save();
    res.json(room);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/leave', auth, async (req, res) => {
  try {
    if (!req.user.activeRoomId) return res.status(400).json({ error: 'Not in a room' });
    
    const room = await Room.findById(req.user.activeRoomId);
    
    if (room && room.adminId.toString() === req.user._id.toString()) {
      // 1. Delete all teams in the room
      await Team.deleteMany({ roomId: room._id });
      // 2. Delete the room completely
      await Room.findByIdAndDelete(room._id);
      
      // 3. Kick everyone in the room
      await User.updateMany(
        { activeRoomId: room._id },
        { activeRoomId: null, currentTeamId: null }
      );
      
      getIo().to(`room:${room._id}`).emit('room:kicked', { message: 'Admin disbanded the room.' });
      getIo().emit('dashboard:room_ended', room._id);
    } else {
      if (req.user.currentTeamId) {
        const team = await Team.findById(req.user.currentTeamId);
        if (team) {
          if (team.leaderId.toString() === req.user._id.toString()) {
            await Team.findByIdAndDelete(team._id);
            await Room.findByIdAndUpdate(team.roomId, { $pull: { teams: team._id } });
            const userIds = team.members.map(m => m.userId);
            await User.updateMany({ _id: { $in: userIds } }, { currentTeamId: null });
            getIo().to(`room:${team.roomId}`).emit('room:team_deleted', team._id);
          } else {
            team.members = team.members.filter(m => m.userId.toString() !== req.user._id.toString());
            team.isReady = team.members.length > 0 && team.members.every(m => m.isReady);
            await team.save();
            getIo().to(`room:${team.roomId}`).emit('room:team_updated', team);
          }
        }
        req.user.currentTeamId = null;
      }
      req.user.activeRoomId = null;
      await req.user.save();
      
      if (room) {
        getIo().to(`room:${room._id}`).emit('room:member_left', { userId: req.user._id });
      }
    }

    res.json({ message: 'Left room' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// GET /rooms/:id/questions — fetch a user's assigned questions for an in-progress room
router.get('/:id/questions', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status === 'WAITING') return res.status(400).json({ error: 'Contest has not started yet' });

    const userId = req.user._id.toString();
    const assignment = room.assignedQuestions.find(
      a => a.userId.toString() === userId
    );

    if (!assignment || !assignment.questionIds?.length) {
      return res.status(404).json({ error: 'No questions assigned to you' });
    }

    const questions = await Question.find({ _id: { $in: assignment.questionIds } });
    res.json({ questions, endTime: room.endTime });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/:id/start', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.adminId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not admin' });
    if (room.status !== 'WAITING') return res.status(400).json({ error: 'Already started' });

    const teams = await Team.find({ roomId: room._id }).populate('members.userId');
    if (teams.length === 0) return res.status(400).json({ error: 'At least one team is required' });
    if (!teams.every(t => t.isReady)) return res.status(400).json({ error: 'All teams must be ready' });
    
    const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
    const totalQuestionsNeeded = totalMembers * room.questionsPerUser;

    // isActive may be undefined on older docs — use $ne: false to include both true and undefined
    const filter = room.difficulty === 'MIXED'
      ? { isActive: { $ne: false } }
      : { difficulty: room.difficulty, isActive: { $ne: false } };

    const questions = await Question.find(filter);

    if (questions.length < room.questionsPerUser) {
      return res.status(400).json({
        error: `Not enough questions in database. Need at least ${room.questionsPerUser}, found ${questions.length}.`
      });
    }

    const assignedQuestions = [];

    // Each team member gets their own unique set of questions
    // Use a global shuffle and hand out slices to avoid repeats within a team
    for (const team of teams) {
      // Shuffle the full question pool fresh for this team
      const teamPool = [...questions].sort(() => Math.random() - 0.5);
      let pointer = 0;

      for (const member of team.members) {
        const userId = member.userId?._id || member.userId;
        // If pool exhausted, wrap around (shouldn't happen if enough questions exist)
        const userQs = [];
        for (let i = 0; i < room.questionsPerUser; i++) {
          userQs.push(teamPool[pointer % teamPool.length]);
          pointer++;
        }
        const userQIds = userQs.map(q => q._id);
        assignedQuestions.push({ userId, questionIds: userQIds });
      }
    }

    room.assignedQuestions = assignedQuestions;
    room.status    = 'IN_PROGRESS';
    room.startTime = new Date();
    room.endTime   = new Date(Date.now() + room.timeLimitMinutes * 60 * 1000);
    await room.save();

    const io = getIo();

    // Emit each user's questions individually
    for (const assignment of assignedQuestions) {
      const qs = await Question.find({ _id: { $in: assignment.questionIds } });
      io.to(`user:${assignment.userId}`).emit('contest:questions', qs);
    }

    io.to(`room:${room._id}`).emit('room:started', { endTime: room.endTime });
    io.emit('dashboard:room_updated', room._id);
    io.emit('dashboard:room_started', room._id);

    const durationMs = room.timeLimitMinutes * 60 * 1000;
    setTimeout(async () => {
      try {
        const currentRoom = await Room.findById(room._id);
        if (currentRoom && currentRoom.status === 'IN_PROGRESS') {
          const teams = await Team.find({ roomId: currentRoom._id }).sort({ score: -1 });
          const counts = await Promise.all(teams.map(async (t) => {
            const solvedQs = await Submission.distinct('questionId', { teamId: t._id, roomId: currentRoom._id, verdict: 'ACCEPTED' });
            return solvedQs.length;
          }));
          currentRoom.status = 'ENDED';
          await currentRoom.save();
          
          const leaderboard = teams.map((t, i) => ({ rank: i + 1, teamName: t.name, score: t.score, memberCount: t.members.length, acceptedCount: counts[i] }));
          io.to(`room:${currentRoom._id}`).emit('room:ended', { leaderboard });
          io.emit('dashboard:room_ended', currentRoom._id);
        }
      } catch (err) {
        console.error('Error auto-ending room:', err);
      }
    }, durationMs);

    res.json({ message: 'Contest started' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/:id/questions', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const assignment = room.assignedQuestions.find(a => a.userId.toString() === req.user._id.toString());
    if (!assignment) return res.status(403).json({ error: 'No questions assigned to you in this room' });
    
    const questions = await Question.find({ _id: { $in: assignment.questionIds } });
    res.json({ questions, endTime: room.endTime });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/:id/end', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.adminId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not admin' });

    const teams = await Team.find({ roomId: room._id }).sort({ score: -1 });
    const counts = await Promise.all(teams.map(async (t) => {
      const solvedQs = await Submission.distinct('questionId', { teamId: t._id, roomId: room._id, verdict: 'ACCEPTED' });
      return solvedQs.length;
    }));
    room.status = 'ENDED';
    await room.save();
    
    const leaderboard = teams.map((t, i) => ({ rank: i + 1, teamName: t.name, score: t.score, memberCount: t.members.length, acceptedCount: counts[i] }));
    getIo().to(`room:${room._id}`).emit('room:ended', { leaderboard });
    getIo().emit('dashboard:room_ended', room._id);
    res.json(leaderboard);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

export default router;
