const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: String, // email address
    required: true,
    index: true,
  },
  stockCode: {
    type: String,
    required: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  }
});

// Compound index to ensure uniqueness per user-stock subscription
SubscriptionSchema.index({ userId: 1, stockCode: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
