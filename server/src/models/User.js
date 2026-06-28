const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  role: {
    type: String,
    required: true,
    enum: ['citizen', 'staff', 'admin'],
    default: 'citizen'
  },
  zone: {
    type: String,
    default: 'Zone-A'
  },
  points: {
    type: Number,
    default: 0
  },
  badgesEarned: {
    type: [String],
    default: []
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
