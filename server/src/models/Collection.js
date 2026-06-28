const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    ref: 'Bin'
  },
  staffId: {
    type: String,
    required: true
  },
  collectedAt: {
    type: Date,
    default: Date.now
  },
  fillLevelAtCollection: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Collection', collectionSchema);
