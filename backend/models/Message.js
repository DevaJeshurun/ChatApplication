// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Quote/reply support
  replyTo: {
    sender: String,
    content: String,
    messageId: mongoose.Schema.Types.ObjectId
  },
  replyTo: {
    sender: { type: String, default: null },
    content: { type: String, default: null },
    messageId: { type: String, default: null }
  },
  // Plain object: { "👍": ["alice", "bob"] }
  reactions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('Message', messageSchema);