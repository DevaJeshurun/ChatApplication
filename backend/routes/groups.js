// backend/routes/groups.js
const express = require('express');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET all groups the current user is a member of (+ all public groups)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { isPrivate: false },
        { members: req.username },
        { creator: req.username }
      ]
    }).sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching groups', error: err.message });
  }
});

// CREATE a new group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, isPrivate, members, avatar } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Always include creator as member
    const allMembers = [...new Set([req.username, ...(members || [])])];

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      isPrivate: isPrivate || false,
      creator: req.username,
      members: allMembers,
      avatar: avatar || '💬'
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: 'Error creating group', error: err.message });
  }
});

// JOIN a public group
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.isPrivate) return res.status(403).json({ message: 'This is a private group' });

    if (!group.members.includes(req.username)) {
      group.members.push(req.username);
      await group.save();
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Error joining group', error: err.message });
  }
});

// LEAVE a group
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(m => m !== req.username);
    await group.save();
    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ message: 'Error leaving group', error: err.message });
  }
});

// ADD member to private group (creator only)
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.creator !== req.username) return res.status(403).json({ message: 'Only the creator can add members' });

    const { username } = req.body;
    if (!group.members.includes(username)) {
      group.members.push(username);
      await group.save();
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Error adding member', error: err.message });
  }
});

// GET messages for a group
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check access
    if (group.isPrivate && !group.members.includes(req.username)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await GroupMessage.find({ groupId: req.params.id })
      .sort({ timestamp: 1 })
      .limit(200);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
});

module.exports = router;