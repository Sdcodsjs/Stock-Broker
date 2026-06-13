const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId: {
    type: String, // email address
    required: true,
    index: true,
  },
  stock: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Trade', TradeSchema);
