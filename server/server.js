const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Imports for upgraded components
const logger = require('./utils/logger');
const db = require('./config/db');
const { 
  validateBody, 
  loginSchema, 
  tradeSchema, 
  subscriptionSchema, 
  settingsSchema 
} = require('./validators/schemas');

// Mongoose Database Models
const User = require('./models/User');
const Subscription = require('./models/Subscription');
const Notification = require('./models/Notification');
const ActivityLog = require('./models/ActivityLog');
const Portfolio = require('./models/Portfolio');
const Trade = require('./models/Trade');

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ─── Security & Core Middlewares ──────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply rate limiting specifically to HTTP API endpoints to protect resources
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', apiLimiter);

// ─── Constants ────────────────────────────────────────────────────────────────
const SUPPORTED_STOCKS = ['GOOG', 'TSLA', 'AMZN', 'META', 'NVDA'];

const STOCK_META = {
  GOOG: { company: 'Alphabet Inc.',     sector: 'Technology',  basePrice: 175.00 },
  TSLA: { company: 'Tesla, Inc.',       sector: 'Automotive',  basePrice: 285.00 },
  AMZN: { company: 'Amazon.com Inc.',   sector: 'E-Commerce',  basePrice: 190.00 },
  META: { company: 'Meta Platforms',    sector: 'Social Media',basePrice: 560.00 },
  NVDA: { company: 'NVIDIA Corp.',      sector: 'Semiconductors', basePrice: 140.00 },
};

// ─── State Cache ──────────────────────────────────────────────────────────────
// stockPrices: { ticker: { price, prevPrice, openPrice, high, low, updatedAt } }
const stockPrices = {};
SUPPORTED_STOCKS.forEach(t => {
  const p = STOCK_META[t].basePrice;
  stockPrices[t] = { price: p, prevPrice: p, openPrice: p, high: p, low: p, updatedAt: new Date().toISOString() };
});

// priceHistory: { ticker: [number, ...] } — last 60 ticks
const priceHistory = {};
SUPPORTED_STOCKS.forEach(t => { priceHistory[t] = [stockPrices[t].price]; });

// users: email -> { subscriptions: Set, activityLog: [], notifCount, balance, portfolio, isAdmin }
const users = {};

// socketToEmail: socketId -> email
const socketToEmail = {};

// notifications: email -> notification items
const pendingNotifications = {}; 

// ─── Helpers & Database Sync ──────────────────────────────────────────────────
let isFeedActive = true;

function ensureUser(email) {
  if (!users[email]) {
    users[email] = { 
      subscriptions: new Set(), 
      activityLog: [], 
      notifCount: 0,
      balance: 100000,
      portfolio: {},
      isAdmin: email.startsWith('admin') || email.includes('admin')
    };
    pendingNotifications[email] = [];
  }
}

// Sync user metrics, portfolio, subscriptions, and logs from MongoDB if available
async function syncUserFromDB(email) {
  ensureUser(email);
  if (!db.dbConnected) return;

  try {
    // 1. Fetch or create User record
    let userDoc = await User.findOne({ email });
    if (!userDoc) {
      userDoc = await User.create({
        email,
        role: (email.startsWith('admin') || email.includes('admin')) ? 'admin' : 'user',
        theme: 'dark',
      });
      logger.info(`[DB] Created user document for ${email}`);
    }

    // 2. Fetch or create Portfolio record
    let portfolioDoc = await Portfolio.findOne({ userId: email });
    if (!portfolioDoc) {
      portfolioDoc = await Portfolio.create({
        userId: email,
        cashBalance: 100000,
        holdings: {},
        investedAmount: 0,
        totalValue: 100000,
      });
      logger.info(`[DB] Created portfolio document for ${email}`);
    }

    // Calculate invested balance dynamically using latest stock feed prices
    let investedAmount = 0;
    const holdingsObj = {};
    if (portfolioDoc.holdings) {
      portfolioDoc.holdings.forEach((shares, ticker) => {
        holdingsObj[ticker] = shares;
        const currentPrice = stockPrices[ticker]?.price || 0;
        investedAmount += shares * currentPrice;
      });
    }

    const totalValue = portfolioDoc.cashBalance + investedAmount;

    // Load values into live memory cache
    users[email].balance = portfolioDoc.cashBalance;
    users[email].portfolio = holdingsObj;
    users[email].isAdmin = userDoc.role === 'admin';

    // 3. Load user stock subscriptions
    const subDocs = await Subscription.find({ userId: email });
    users[email].subscriptions = new Set(subDocs.map(s => s.stockCode));

    // 4. Load activity history (capped at 50)
    const logsDocs = await ActivityLog.find({ userId: email })
      .sort({ timestamp: -1 })
      .limit(50);
    users[email].activityLog = logsDocs.map(l => ({
      id: l._id.toString(),
      action: l.action,
      detail: l.detail,
      timestamp: l.timestamp.toISOString(),
    }));

    // 5. Load notifications history (capped at 30)
    const notifDocs = await Notification.find({ userId: email })
      .sort({ createdAt: -1 })
      .limit(30);
    pendingNotifications[email] = notifDocs.map(n => ({
      id: n._id.toString(),
      ticker: n.ticker,
      message: n.message,
      type: n.type,
      timestamp: n.createdAt.toISOString(),
      read: n.read,
    }));
    users[email].notifCount = pendingNotifications[email].filter(n => !n.read).length;

    logger.info(`[DB] Synced state cache from MongoDB for ${email}`);
  } catch (error) {
    logger.error(`[DB Error] Failed to sync cache for user ${email}:`, error);
  }
}

async function addActivity(email, action, detail = '') {
  ensureUser(email);
  const timestamp = new Date().toISOString();
  
  // Add to memory
  const logItem = {
    id: Date.now() + Math.random(),
    action,
    detail,
    timestamp,
  };
  users[email].activityLog.unshift(logItem);
  if (users[email].activityLog.length > 50) users[email].activityLog.pop();

  logger.info(`[Activity] User: ${email} | Action: ${action} | Detail: ${detail}`);

  // Write to DB asynchronously
  if (db.dbConnected) {
    try {
      await ActivityLog.create({
        userId: email,
        action,
        detail,
        timestamp: new Date(timestamp),
      });
    } catch (err) {
      logger.error(`[DB Write Error] Failed to save log item for ${email}:`, err);
    }
  }
}

async function pushNotification(email, ticker, message, type = 'info') {
  if (!pendingNotifications[email]) pendingNotifications[email] = [];
  const timestamp = new Date().toISOString();
  const id = Date.now() + Math.random();

  const notif = { id, ticker, message, type, timestamp, read: false };
  pendingNotifications[email].unshift(notif);
  if (pendingNotifications[email].length > 30) pendingNotifications[email].pop();

  // Push to active socket if online
  const sockets = io.sockets.sockets;
  sockets.forEach((socket) => {
    if (socketToEmail[socket.id] === email) {
      socket.emit('notification', notif);
    }
  });

  logger.info(`[Alert] Sent notification to ${email}: ${message}`);

  // Write to DB asynchronously
  if (db.dbConnected) {
    try {
      await Notification.create({
        userId: email,
        ticker,
        message,
        type,
        read: false,
        createdAt: new Date(timestamp),
      });
    } catch (err) {
      logger.error(`[DB Write Error] Failed to save notification for ${email}:`, err);
    }
  }
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── REST Endpoints ───────────────────────────────────────────────────────────

// POST /api/login
app.post('/api/login', validateBody(loginSchema), async (req, res) => {
  const { email } = req.body;
  const e = email.toLowerCase().trim();
  
  // Try loading records from MongoDB first
  await syncUserFromDB(e);
  
  // Record login activity
  await addActivity(e, 'login', `Logged in from web`);

  if (db.dbConnected) {
    try {
      await User.findOneAndUpdate({ email: e }, { lastLogin: new Date() });
    } catch (err) {
      logger.error(`[DB Error] Failed to update user lastLogin:`, err);
    }
  }

  const token = jwt.sign({ email: e }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    token,
    email: e,
    subscriptions: Array.from(users[e].subscriptions),
    supportedStocks: SUPPORTED_STOCKS,
    stockMeta: STOCK_META,
    currentPrices: buildPriceMap(SUPPORTED_STOCKS),
    isAdmin: users[e].isAdmin,
    balance: users[e].balance,
    portfolio: users[e].portfolio,
  });
});

// GET /api/prices
app.get('/api/prices', authenticate, (req, res) => {
  res.json(buildPriceMap(SUPPORTED_STOCKS));
});

// GET /api/activity
app.get('/api/activity', authenticate, async (req, res) => {
  const e = req.user.email;
  ensureUser(e);

  if (db.dbConnected) {
    try {
      const logs = await ActivityLog.find({ userId: e })
        .sort({ timestamp: -1 })
        .limit(50);
      return res.json(logs.map(l => ({
        id: l._id.toString(),
        action: l.action,
        detail: l.detail,
        timestamp: l.timestamp.toISOString(),
      })));
    } catch (err) {
      logger.error(`[DB Error] Failed to query activity logs for ${e}:`, err);
    }
  }

  res.json(users[e].activityLog);
});

// GET /api/notifications
app.get('/api/notifications', authenticate, async (req, res) => {
  const e = req.user.email;
  ensureUser(e);

  if (db.dbConnected) {
    try {
      const notifs = await Notification.find({ userId: e })
        .sort({ createdAt: -1 })
        .limit(30);
      return res.json(notifs.map(n => ({
        id: n._id.toString(),
        ticker: n.ticker,
        message: n.message,
        type: n.type,
        timestamp: n.createdAt.toISOString(),
        read: n.read,
      })));
    } catch (err) {
      logger.error(`[DB Error] Failed to query notifications for ${e}:`, err);
    }
  }

  res.json(pendingNotifications[e] || []);
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', authenticate, async (req, res) => {
  const e = req.user.email;
  if (pendingNotifications[e]) {
    pendingNotifications[e].forEach(n => (n.read = true));
  }
  if (users[e]) {
    users[e].notifCount = 0;
  }

  if (db.dbConnected) {
    try {
      await Notification.updateMany({ userId: e, read: false }, { read: true });
    } catch (err) {
      logger.error(`[DB Error] Failed to mark notifications as read for ${e}:`, err);
    }
  }

  res.json({ ok: true });
});

// GET /api/history/:ticker
app.get('/api/history/:ticker', authenticate, (req, res) => {
  const t = req.params.ticker.toUpperCase();
  if (!SUPPORTED_STOCKS.includes(t)) return res.status(404).json({ error: 'Unknown ticker' });
  res.json(priceHistory[t]);
});

// POST /api/portfolio/buy
app.post('/api/portfolio/buy', authenticate, validateBody(tradeSchema), async (req, res) => {
  const { ticker, shares } = req.body;
  const e = req.user.email;
  const user = users[e];
  const price = stockPrices[ticker]?.price;
  
  if (!price) return res.status(400).json({ error: 'Invalid ticker' });
  const cost = price * shares;
  if (user.balance < cost) return res.status(400).json({ error: 'Insufficient balance' });
  
  user.balance -= cost;
  user.portfolio[ticker] = (user.portfolio[ticker] || 0) + shares;
  
  await addActivity(e, 'buy', `Bought ${shares} shares of ${ticker} at $${price.toFixed(2)}`);

  if (db.dbConnected) {
    try {
      await Trade.create({
        userId: e,
        stock: ticker,
        quantity: shares,
        price,
        type: 'buy',
      });
      await Portfolio.findOneAndUpdate(
        { userId: e },
        { 
          cashBalance: user.balance, 
          holdings: user.portfolio,
          updatedAt: new Date()
        },
        { upsert: true }
      );
    } catch (err) {
      logger.error(`[DB Error] Portfolio trade write failed:`, err);
    }
  }

  res.json({ balance: user.balance, portfolio: user.portfolio });
});

// POST /api/portfolio/sell
app.post('/api/portfolio/sell', authenticate, validateBody(tradeSchema), async (req, res) => {
  const { ticker, shares } = req.body;
  const e = req.user.email;
  const user = users[e];
  const currentShares = user.portfolio[ticker] || 0;
  if (currentShares < shares) return res.status(400).json({ error: 'Not enough shares' });
  
  const price = stockPrices[ticker]?.price;
  const revenue = price * shares;
  user.balance += revenue;
  user.portfolio[ticker] -= shares;
  if (user.portfolio[ticker] === 0) delete user.portfolio[ticker];
  
  await addActivity(e, 'sell', `Sold ${shares} shares of ${ticker} at $${price.toFixed(2)}`);

  if (db.dbConnected) {
    try {
      await Trade.create({
        userId: e,
        stock: ticker,
        quantity: shares,
        price,
        type: 'sell',
      });
      await Portfolio.findOneAndUpdate(
        { userId: e },
        { 
          cashBalance: user.balance, 
          holdings: user.portfolio,
          updatedAt: new Date()
        },
        { upsert: true }
      );
    } catch (err) {
      logger.error(`[DB Error] Portfolio trade write failed:`, err);
    }
  }

  res.json({ balance: user.balance, portfolio: user.portfolio });
});

// GET /api/admin/stats
app.get('/api/admin/stats', authenticate, async (req, res) => {
  const e = req.user.email;
  if (!users[e]?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  
  const activeSockets = new Set(Object.values(socketToEmail)).size;
  let totalUsers = Object.keys(users).length;
  const subStats = {};
  SUPPORTED_STOCKS.forEach(t => subStats[t] = 0);

  if (db.dbConnected) {
    try {
      totalUsers = await User.countDocuments();
      const dbSubs = await Subscription.aggregate([
        { $group: { _id: "$stockCode", count: { $sum: 1 } } }
      ]);
      dbSubs.forEach(item => {
        if (subStats[item._id] !== undefined) {
          subStats[item._id] = item.count;
        }
      });
    } catch (err) {
      logger.error(`[DB Error] Admin statistics aggregation failed:`, err);
      // Fallback
      Object.values(users).forEach(u => {
        u.subscriptions.forEach(sub => {
          if (subStats[sub] !== undefined) subStats[sub]++;
        });
      });
    }
  } else {
    // in-memory stats
    Object.values(users).forEach(u => {
      u.subscriptions.forEach(sub => {
        if (subStats[sub] !== undefined) subStats[sub]++;
      });
    });
  }

  res.json({
    totalUsers,
    activeUsers: activeSockets,
    subscriptionAnalytics: subStats,
    feedActive: isFeedActive,
  });
});

// POST /api/admin/feed
app.post('/api/admin/feed', authenticate, (req, res) => {
  const e = req.user.email;
  if (!users[e]?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  const { active } = req.body;
  isFeedActive = !!active;
  res.json({ feedActive: isFeedActive });
});

function buildPriceMap(tickers) {
  const map = {};
  tickers.forEach(t => {
    const s = stockPrices[t];
    map[t] = {
      price: s.price,
      prevPrice: s.prevPrice,
      openPrice: s.openPrice,
      high: s.high,
      low: s.low,
      company: STOCK_META[t].company,
      sector: STOCK_META[t].sector,
      updatedAt: s.updatedAt,
    };
  });
  return map;
}

// ─── Socket.IO WebSockets ────────────────────────────────────────────────────
io.use((socket, next) => {
  try {
    socket.user = jwt.verify(socket.handshake.auth.token, JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const email = socket.user.email;
  socketToEmail[socket.id] = email;
  ensureUser(email);
  logger.info(`[+] Connection: ${email} (${socket.id})`);

  // Pull updates from database inside Promise to avoid blockages
  syncUserFromDB(email).then(() => {
    socket.emit('subscriptions', Array.from(users[email].subscriptions));
    socket.emit('allPrices', buildPriceMap(SUPPORTED_STOCKS));
    socket.emit('priceHistory', priceHistory);

    // Deliver unread notifications
    const unread = (pendingNotifications[email] || []).filter(n => !n.read);
    if (unread.length) socket.emit('notifications', unread);
  });

  socket.on('subscribe', async (ticker) => {
    if (!SUPPORTED_STOCKS.includes(ticker)) return;
    if (users[email].subscriptions.has(ticker)) {
      socket.emit('subscribeError', { ticker, message: `${ticker} already subscribed` });
      return;
    }
    users[email].subscriptions.add(ticker);
    await addActivity(email, 'subscribe', `Subscribed to ${ticker}`);

    if (db.dbConnected) {
      try {
        await Subscription.findOneAndUpdate(
          { userId: email, stockCode: ticker },
          { subscribedAt: new Date() },
          { upsert: true }
        );
      } catch (err) {
        logger.error(`[DB Error] Subscription update failed for ${email}:`, err);
      }
    }

    socket.emit('subscriptions', Array.from(users[email].subscriptions));
    socket.emit('subscribeSuccess', { ticker });
    logger.info(`  ${email} → +${ticker}`);
  });

  socket.on('unsubscribe', async (ticker) => {
    users[email].subscriptions.delete(ticker);
    await addActivity(email, 'unsubscribe', `Unsubscribed from ${ticker}`);

    if (db.dbConnected) {
      try {
        await Subscription.deleteOne({ userId: email, stockCode: ticker });
      } catch (err) {
        logger.error(`[DB Error] Subscription delete failed for ${email}:`, err);
      }
    }

    socket.emit('subscriptions', Array.from(users[email].subscriptions));
    logger.info(`  ${email} → -${ticker}`);
  });

  socket.on('disconnect', () => {
    delete socketToEmail[socket.id];
    logger.info(`[-] Disconnected: ${email} (${socket.id})`);
    addActivity(email, 'logout', 'Disconnected');
  });
});

// ─── Price Simulator ─────────────────────────────────────────────────────────
function randomWalk(price, volatility = 3) {
  const change = (Math.random() - 0.49) * volatility * 2; // slight upward bias
  return Math.max(1, parseFloat((price + change).toFixed(2)));
}

setInterval(() => {
  if (!isFeedActive) return;

  const now = new Date().toISOString();

  SUPPORTED_STOCKS.forEach(ticker => {
    const s = stockPrices[ticker];
    s.prevPrice = s.price;
    s.price = randomWalk(s.price);
    s.high = Math.max(s.high, s.price);
    s.low = Math.min(s.low, s.price);
    s.updatedAt = now;

    // Keep history (last 60)
    priceHistory[ticker].push(s.price);
    if (priceHistory[ticker].length > 60) priceHistory[ticker].shift();

    // Check notification thresholds
    const changePct = ((s.price - s.prevPrice) / s.prevPrice) * 100;
    if (Math.abs(changePct) >= 1.5) {
      const dir = changePct > 0 ? 'up' : 'down';
      // Notify all subscribed users
      Object.entries(users).forEach(([email, user]) => {
        if (user.subscriptions.has(ticker)) {
          const msg = `${ticker} ${dir === 'up' ? '▲ rose' : '▼ dropped'} ${Math.abs(changePct).toFixed(2)}% to $${s.price.toFixed(2)}`;
          pushNotification(email, ticker, msg, dir === 'up' ? 'success' : 'warning');
        }
      });
    }
  });

  // Push to each connected socket — only their subscribed stocks
  io.sockets.sockets.forEach((socket) => {
    const email = socketToEmail[socket.id];
    if (!email || !users[email]) return;
    const subs = Array.from(users[email].subscriptions);
    if (!subs.length) return;
    socket.emit('stockUpdate', buildPriceMap(subs));
  });

}, 1000);

// Every 5s send full market snapshot to all connected
setInterval(() => {
  if (!isFeedActive) return;
  io.emit('marketSnapshot', buildPriceMap(SUPPORTED_STOCKS));
}, 5000);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

db.connectDB().finally(() => {
  server.listen(PORT, () => logger.info(`🚀 Server listening @ http://localhost:${PORT}`));
});
