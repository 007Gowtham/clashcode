import express from 'express';
import Question from '../models/Question.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /questions/bulk — Bulk insert questions (no auth required for seeding)
router.post('/bulk', async (req, res) => {
  try {
    // Accept both: raw array  OR  { "questions": [...] }
    const questions = Array.isArray(req.body) ? req.body : req.body?.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        error: 'Please provide a non-empty array of questions (as a JSON array or { "questions": [...] })'
      });
    }

    const inserted = await Question.insertMany(questions, { ordered: true });

    res.status(201).json({
      success: true,
      message: `${inserted.length} question(s) inserted successfully.`,
      data: inserted
    });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to insert questions',
      details: error.message
    });
  }
});

// GET /questions — Get all questions
router.get('/', async (req, res) => {
  try {
    const { difficulty, limit } = req.query;
    const filter = difficulty ? { difficulty } : {};
    const questions = await Question.find(filter).limit(limit ? parseInt(limit) : 0);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /questions/:id — Get single question
router.get('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// DELETE /questions/:id — Delete a question
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Question not found' });
    res.json({ success: true, message: 'Question deleted successfully', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete question', details: error.message });
  }
});

export default router;
