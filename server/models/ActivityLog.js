const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: String, // email address
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
