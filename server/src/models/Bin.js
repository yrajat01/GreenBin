const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  fillLevel: {
    type: Number,
    required: true,
    default: 5,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    required: true,
    enum: ['normal', 'warning', 'critical', 'smell_reported'],
    default: 'normal'
  },
  lastCollected: {
    type: Date,
    default: Date.now
  },
  lastReported: {
    type: Date
  },
  zone: {
    type: String,
    required: true,
    default: 'Zone-A'
  },
  collectionType: {
    type: String,
    enum: ['sensor', 'citizen'],
    default: 'sensor'
  },
  lowTraffic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bin', binSchema);
