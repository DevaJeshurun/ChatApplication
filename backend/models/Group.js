// backend/models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  description: {
    type: String,
    default: '',
    maxlength: 120
  },
  isPrivate: {
    type: Boolean,
    default: false   // false = anyone can join, true = invite only
  },
  creator: {
    type: String,
    required: true
  },
  members: {
    type: [String],  // array of usernames
    default: []
  },
  avatar: {
    type: String,
    default: '💬'   // emoji avatar for group
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);