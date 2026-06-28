const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  binSequence: {
    type: [String],
    required: true
  },
  totalDistance: {
    type: Number,
    required: true
  },
  baselineDistance: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  assignedStaffId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
