const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const NegotiationSession = require('../models/NegotiationSession');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/chat/:sessionId - Get messages for a session
router.get('/:sessionId', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await ChatMessage.find({ negotiationSession: req.params.sessionId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/chat/:sessionId - Send a message
router.post('/:sessionId', async (req, res) => {
  try {
    const { text, type = 'text' } = req.body;
    const session = await NegotiationSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const message = await ChatMessage.create({
      negotiationSession: req.params.sessionId,
      requirement: session.requirement,
      sender: req.user._id,
      senderRole: req.user.role,
      text,
      type,
    });

    const populated = await message.populate('sender', 'name role');

    // Emit message via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${req.params.sessionId}`).emit('chat_message', populated);
    }

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/chat/sessions/my - Get all sessions relevant to current user
router.get('/sessions/my', async (req, res) => {
  try {
    const filter = req.user.role === 'buyer'
      ? { buyer: req.user._id }
      : {};
    const sessions = await NegotiationSession.find(filter)
      .populate('requirement', 'cropName variety status')
      .populate('buyer', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
