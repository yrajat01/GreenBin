const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  binId: {
    type: String,
    required: true,
    ref: 'Bin'
  },
  userId: {
    type: String,
    required: true
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Foul Smell', 'Overflow', 'Damage/Vandalism', 'Missed Collection', 'Other']
  },
  photoUrl: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'resolved'],
    default: 'pending'
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
