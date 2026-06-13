const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  userId: {
    type: String, // email address
    required: true,
    unique: true,
    index: true,
  },
  cashBalance: {
    type: Number,
    required: true,
    default: 100000,
  },
  holdings: {
    type: Map,
    of: Number,
    default: {},
  },
  investedAmount: {
    type: Number,
    default: 0,
  },
  totalValue: {
    type: Number,
    default: 100000,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
