// backend/routes/messages.js
const express = require('express');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET ALL MESSAGES
router.get('/', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: 1 })
      .limit(200); // last 200 messages
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// POST NEW MESSAGE
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, replyTo } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: 'Message too long (max 500 chars)' });
    }

    const message = new Message({
      sender: req.username,
      content: content.trim(),
      replyTo: replyTo || null,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
});

// POST REACTION — toggle emoji on a message
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Get current users for this emoji
    const users = message.reactions.get(emoji) || [];

    if (users.includes(req.username)) {
      // Remove reaction
      message.reactions.set(emoji, users.filter(u => u !== req.username));
    } else {
      // Add reaction (limit to 1 emoji type per user total across all emojis)
      message.reactions.set(emoji, [...users, req.username]);
    }

    // Clean up empty emoji keys
    for (const [e, u] of message.reactions.entries()) {
      if (!u.length) message.reactions.delete(e);
    }

    await message.save();

    // Convert Map to plain object for JSON response
    const reactionsObj = Object.fromEntries(message.reactions);
    res.json({ reactions: reactionsObj });
  } catch (error) {
    res.status(500).json({ message: 'Error updating reaction', error: error.message });
  }
});

module.exports = router;