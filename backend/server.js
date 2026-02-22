// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const Message = require('./models/Message');
const GroupMessage = require('./models/GroupMessage');
const Group = require('./models/Group');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:3000'], methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

const onlineUsers = new Map();
function getOnlineList() { return [...new Set(onlineUsers.values())]; }

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('user-online', async (username) => {
    socket.data.username = username;
    onlineUsers.set(socket.id, username);
    socket.join('global');
    try {
      const groups = await Group.find({ members: username });
      groups.forEach(g => socket.join(`group:${g._id}`));
      await User.findOneAndUpdate({ username }, { online: true });
    } catch (e) {}
    io.emit('online-users', getOnlineList());
    console.log(`👤 ${username} is online`);
  });

  // Global message
  socket.on('send-message', async ({ sender, content, replyTo }) => {
    if (!content?.trim() || content.length > 500) return;
    try {
      const message = new Message({
        sender, content: content.trim(),
        replyTo: replyTo || { sender: null, content: null, messageId: null },
        reactions: {}
      });
      await message.save();
      console.log(`✅ Global message saved: "${content.substring(0, 40)}"`);
      io.to('global').emit('receive-message', {
        _id: message._id, sender: message.sender, content: message.content,
        timestamp: message.timestamp, replyTo: message.replyTo, reactions: {}, room: 'global'
      });
    } catch (err) {
      console.error('❌ Error saving message:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Group message
  socket.on('send-group-message', async ({ sender, groupId, content, replyTo }) => {
    if (!content?.trim() || content.length > 500) return;
    try {
      const group = await Group.findById(groupId);
      if (!group || !group.members.includes(sender)) return socket.emit('error', { message: 'Access denied' });
      const message = new GroupMessage({
        groupId, sender, content: content.trim(),
        replyTo: replyTo || { sender: null, content: null, messageId: null },
        reactions: {}
      });
      await message.save();
      console.log(`✅ Group [${group.name}] msg: "${content.substring(0, 40)}"`);
      io.to(`group:${groupId}`).emit('receive-group-message', {
        _id: message._id, groupId, sender: message.sender, content: message.content,
        timestamp: message.timestamp, replyTo: message.replyTo, reactions: {}
      });
    } catch (err) { console.error('❌ Error saving group message:', err.message); }
  });

  socket.on('join-group', (groupId) => socket.join(`group:${groupId}`));

  socket.on('typing', ({ username, isTyping, room }) => {
    if (room && room !== 'global') socket.to(`group:${room}`).emit('typing', { username, isTyping, room });
    else socket.to('global').emit('typing', { username, isTyping, room: 'global' });
  });

  socket.on('react-message', async ({ messageId, emoji, username }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      const reactions = message.reactions || {};
      const users = reactions[emoji] || [];
      reactions[emoji] = users.includes(username) ? users.filter(u => u !== username) : [...users, username];
      if (!reactions[emoji].length) delete reactions[emoji];
      message.reactions = reactions;
      message.markModified('reactions');
      await message.save();
      io.to('global').emit('message-reaction', { messageId, reactions });
    } catch (err) { console.error('Reaction error:', err.message); }
  });

  socket.on('react-group-message', async ({ messageId, emoji, username, groupId }) => {
    try {
      const message = await GroupMessage.findById(messageId);
      if (!message) return;
      const reactions = message.reactions || {};
      const users = reactions[emoji] || [];
      reactions[emoji] = users.includes(username) ? users.filter(u => u !== username) : [...users, username];
      if (!reactions[emoji].length) delete reactions[emoji];
      message.reactions = reactions;
      message.markModified('reactions');
      await message.save();
      io.to(`group:${groupId}`).emit('message-reaction', { messageId, reactions });
    } catch (err) { console.error('Group reaction error:', err.message); }
  });

  socket.on('disconnect', async () => {
    const username = socket.data.username || onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    if (!getOnlineList().includes(username) && username) {
      try { await User.findOneAndUpdate({ username }, { online: false }); } catch (e) {}
    }
    io.emit('online-users', getOnlineList());
    console.log(`👋 ${username || socket.id} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 ConvoSphere server running on http://localhost:${PORT}`));