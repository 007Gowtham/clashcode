import express from 'express';
import Submission from '../models/Submission.js';
import Question from '../models/Question.js';
import Team from '../models/Team.js';
import Room from '../models/Room.js';
import { auth } from '../middleware/auth.js';
import { runCode } from '../utils/judge0.js';
import { getIo } from '../socket.js';
import { normalizeInput } from '../utils/normalize.js';

const router = express.Router();
const SCORES = { EASY: 100, MEDIUM: 200, HARD: 300 };

async function buildLeaderboard(roomId) {
  const teams = await Team.find({ roomId }).sort({ score: -1 });
  const counts = await Promise.all(teams.map(async (t) => {
    const solvedQs = await Submission.distinct('questionId', { teamId: t._id, roomId, verdict: 'ACCEPTED' });
    return solvedQs.length;
  }));
  return teams.map((t, i) => ({ rank: i + 1, teamName: t.name, score: t.score, memberCount: t.members.length, acceptedCount: counts[i] }));
}

router.post('/submit', auth, async (req, res) => {
  try {
    const { roomId, teamId, questionId, code, language } = req.body;
    const room = await Room.findById(roomId);
    if (!room || room.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Contest not active' });

    const assigned = room.assignedQuestions.find(a =>
      a.userId.toString() === req.user._id.toString() &&
      a.questionIds.map(id => id.toString()).includes(questionId)
    );
    if (!assigned) return res.status(403).json({ error: 'This question is not assigned to you' });

    // We now use proportional scoring, so we will check highest previous score instead of just 'ACCEPTED'
    const prevSubmissions = await Submission.find({ teamId, roomId, questionId });
    const prevBestScore = prevSubmissions.reduce((max, sub) => Math.max(max, sub.score || 0), 0);

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    let testsPassed = 0;
    let finalVerdict = 'ACCEPTED';
    let testResults = [];
    const scoreVal = SCORES[question.difficulty?.toUpperCase()] || 0;
    
    if (question.testCases && question.testCases.length > 0) {
      for (const tc of question.testCases) {
        // Prefer tc.stdin (primary field) over legacy tc.input
        const rawInput = normalizeInput(tc.stdin || tc.input || '');
        const displayInput = tc.stdin || tc.input || '';
        const res = await runCode(language, code, rawInput);
        
        // Include compilation errors if they exist
        const compileErr = res.compile?.stderr || '';
        const runErr = res.run?.stderr || '';
        const error = (compileErr + runErr).trim();
        const output = (res.run?.stdout || '').trim();
        
        const expected = (tc.expectedOutput || '').trim();
        
        const cleanOutput = (output || '').replace(/[\s\[\],"]/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').toLowerCase();
        const cleanExpected = (expected || '').replace(/[\s\[\],"]/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').toLowerCase();
        
        const timedOut = res.run?.signal === 'SIGKILL' || res.run?.status === 'TO';
        const pass = res.run?.code === 0 && !timedOut && (cleanOutput === cleanExpected || (cleanOutput === '' && (cleanExpected === '' || cleanExpected === 'empty')));
        
        testResults.push({ 
          pass,
          timedOut,
          input: displayInput, 
          rawInput: rawInput, 
          expectedOutput: expected, 
          actualOutput: output, 
          error: error || (timedOut ? 'Time Limit Exceeded' : ''),
          code: res.run?.code || res.compile?.code,
          signal: res.run?.signal || null,
          debugInfo: JSON.stringify(res),
          isHidden: tc.isHidden
        });

        if (pass) {
          testsPassed++;
        } else {
          if (finalVerdict === 'ACCEPTED') finalVerdict = timedOut ? 'TIME_LIMIT_EXCEEDED' : (res.error ? 'ERROR' : 'WRONG_ANSWER');
        }
      }
    } else {
      // Fallback
      const result = await runCode(language, code, '');
      const hasErr = result.run.stderr && result.run.stderr.trim().length > 0;
      finalVerdict = result.run.code === 0 && !hasErr ? 'ACCEPTED' : hasErr ? 'ERROR' : 'WRONG_ANSWER';
      if (finalVerdict === 'ACCEPTED') testsPassed = 1;
      testResults.push({
        pass: finalVerdict === 'ACCEPTED',
        input: 'N/A',
        expectedOutput: 'N/A',
        actualOutput: result.run.stdout,
        error: result.run.stderr,
        code: result.run.code
      });
    }

    const totalCases = question.testCases?.length > 0 ? question.testCases.length : 1;
    
    // Apply Partial Verdict if the user solved some but not all test cases
    if (testsPassed > 0 && testsPassed < totalCases && finalVerdict !== 'ACCEPTED') {
      finalVerdict = 'PARTIALLY_ACCEPTED';
    }

    // Award proportional points based on exact percentage of passed cases natively rounding down
    const earnedScore = Math.floor((testsPassed / totalCases) * scoreVal);
    
    // Only safely award the delta increase in points if they improve their previous submission!
    const pointsToAward = Math.max(0, earnedScore - prevBestScore);

    const finalOutputMsg = `Passed ${testsPassed} / ${totalCases} test cases.`;

    const submission = await Submission.create({
      userId: req.user._id, teamId, roomId, questionId,
      code, language, verdict: finalVerdict, score: earnedScore,
      output: finalOutputMsg, 
      testResults,
      accepted: finalVerdict === 'ACCEPTED',
    });

    // Update real-time global Team score only if they objectively gained new points
    if (pointsToAward > 0) {
      const updatedTeam = await Team.findByIdAndUpdate(teamId, { $inc: { score: pointsToAward } }, { new: true });
      console.log(`Team ${teamId} score dynamically updated by +${pointsToAward}. New score: ${updatedTeam?.score}`);
      const leaderboard = await buildLeaderboard(roomId);
      getIo().to(`room:${roomId}`).emit('leaderboard:update', leaderboard);
    }

    res.json({ verdict: finalVerdict, score: earnedScore, awarded: pointsToAward, output: finalOutputMsg, testResults });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.message.includes('timeout')) {
      return res.status(408).json({ error: 'Time limit exceeded or Execution Server Error' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/test', auth, async (req, res) => {
  try {
    const { questionId, code, language } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const testResults = [];
    if (question.examples && question.examples.length > 0) {
      for (const ex of question.examples) {
        const rawInput = normalizeInput(ex.input || '');
        const result = await runCode(language, code, rawInput);
        
        const compileErr = result.compile?.stderr || '';
        const runErr = result.run?.stderr || '';
        const error = (compileErr + runErr).trim();
        const output = (result.run?.stdout || '').trim();
        
        const expected = (ex.output || '').trim();
        
        const cleanOutput = (output || '').replace(/[\s\[\],"]/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').toLowerCase();
        const cleanExpected = (expected || '').replace(/[\s\[\],"]/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').toLowerCase();
        
        const timedOut = result.run?.signal === 'SIGKILL' || result.run?.status === 'TO';
        const pass = result.run?.code === 0 && !timedOut && (cleanOutput === cleanExpected || (cleanOutput === '' && (cleanExpected === '' || cleanExpected === 'empty')));
        
        testResults.push({
          pass,
          timedOut,
          input: ex.input || '',
          rawInput: rawInput,
          expectedOutput: expected,
          actualOutput: output,
          error: error || (timedOut ? 'Time Limit Exceeded' : ''),
          code: result.run?.code || result.compile?.code,
          signal: result.run?.signal || null,
          debugInfo: JSON.stringify(result)
        });
      }
    } else {
      // No examples defined — return empty so frontend shows a helpful message
      return res.json({ testResults: [], message: 'No sample test cases available for this question' });
    }

    res.json({ testResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/run', auth, async (req, res) => {
  try {
    const { code, language, stdin } = req.body;
    const result = await runCode(language, code, stdin || '');
    res.json({ output: result.run.stdout, error: result.run.stderr, exitCode: result.run.code });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.message.includes('timeout')) {
      return res.status(408).json({ error: 'Time limit exceeded or Execution Server Error' });
    }
    console.error(err);
    res.status(500).json({ error: 'Execution failed' });
  }
});

router.get('/submissions/room/:roomId', auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ roomId: req.params.roomId }).populate('userId', 'username').populate('questionId', 'title');
    res.json(submissions);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/leaderboard/:roomId', auth, async (req, res) => {
  try {
    res.json(await buildLeaderboard(req.params.roomId));
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/questions', auth, async (req, res) => {
  try {
    const q = await Question.create(req.body);
    res.json(q);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

export default router;
