// backend/models/User.js
const mongoose = require('mongoose');

// Define the structure of a User in the database
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,      // Each username must be unique
    trim: true         // Remove whitespace
  },
  password: {
    type: String,
    required: true
  },
  online: {
    type: Boolean,
    default: false     // Track if user is currently online
  }
}, {
  timestamps: true     // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);