# 📈 TradeDesk — Real-Time Stock Broker Client Dashboard

> Production-inspired real-time financial dashboard built using React, TypeScript, Node.js, Socket.IO, MongoDB, and Docker.

**Live Demo:** [https://stock-broker-6by2.vercel.app](https://stock-broker-6by2.vercel.app)

---

# 🚀 Overview

TradeDesk is a full-stack real-time stock broker dashboard that enables users to subscribe to stocks, receive live WebSocket-powered market updates, simulate trades using virtual capital, analyze portfolio performance, and monitor market activity through advanced analytics dashboards.

The platform was designed using an **Additive Scalability Architecture**, allowing seamless operation with either MongoDB persistence or an in-memory fallback engine for local execution and evaluation.

---

# 🎯 Project Objectives

* Real-time stock market simulation
* Multi-user concurrent dashboard updates
* WebSocket-based communication
* Portfolio management and trading simulation
* Advanced financial analytics
* Production-ready architecture
* Cloud deployment support
* Security-first backend design

---

# ✨ Core Features

## Real-Time Market Engine

* Live stock price simulation
* Random-walk market generation
* Sub-second updates
* Socket.IO powered streaming
* User-specific stock subscriptions
* Multi-user concurrent updates

---

## Stock Subscription Management

* Subscribe to stocks
* Unsubscribe from stocks
* Personalized watchlists
* User-specific market feeds
* Dynamic stock search and filtering

---

## Portfolio Simulator

Every user starts with:

```text
$100,000 Virtual Capital
```

Features:

* Buy stocks
* Sell stocks
* Portfolio valuation
* Holdings tracking
* Cash balance management
* Profit/Loss calculations
* Return on Investment (ROI)

---

## Analytics Dashboard

Advanced analytics powered by Recharts.

Includes:

* Portfolio Growth
* Asset Allocation
* Stock Performance Trends
* Market Volatility Analysis
* Historical Price Tracking
* Top Gainers
* Top Losers

---

## Notification Center

Real-time alerts for:

* Trade confirmations
* High volatility movements
* Subscription updates
* Market feed status
* User-defined price alerts

---

## Activity & Audit Tracking

Tracks:

* Logins
* Subscriptions
* Unsubscriptions
* Buy Orders
* Sell Orders
* Portfolio Actions

Export:

* CSV
* JSON
* Excel

---

## Admin Dashboard

Administrative controls include:

* Active user monitoring
* Connected WebSocket tracking
* Subscriber analytics
* Database health monitoring
* Market feed control
* System metrics dashboard

---

## Theme Engine

* Dark Mode
* Light Mode
* Persistent preferences

---

# 📊 Feature Matrix

| Feature              | Status |
| -------------------- | ------ |
| Email Authentication | ✅      |
| Role-Based Access    | ✅      |
| Real-Time Updates    | ✅      |
| Multi-User Support   | ✅      |
| Portfolio Simulator  | ✅      |
| Notifications        | ✅      |
| Activity Logs        | ✅      |
| Search & Filter      | ✅      |
| CSV/JSON Export      | ✅      |
| Admin Dashboard      | ✅      |
| MongoDB Persistence  | ✅      |
| Memory Fallback      | ✅      |
| Docker Support       | ✅      |
| CI/CD Pipeline       | ✅      |

---

# 🏗 System Architecture

```text
React + TypeScript Frontend
            │
            ▼
     Socket.IO Client
            │
            ▼
     Socket.IO Server
            │
            ▼
       Express API
            │
            ▼
  Market Simulation Engine
            │
            ▼
 MongoDB / Memory Storage
```

---

# 🛠 Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Zustand
* React Router DOM
* Tailwind CSS
* Recharts
* Socket.IO Client

---

## Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* Helmet
* Zod Validation
* Winston Logging
* Express Rate Limiting

---

## Database

* MongoDB Atlas
* Mongoose ODM
* In-Memory Fallback Layer

---

## DevOps

* Docker
* Docker Compose
* Nginx
* GitHub Actions

---

# 📁 Project Structure

```text
stock-dashboard/

├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── charts/
│   │   └── utils/
│   │
│   ├── Dockerfile
│   └── tailwind.config.js
│
├── server/
│   ├── config/
│   ├── models/
│   ├── validators/
│   ├── sockets/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   └── server.js
│
├── docker-compose.yml
├── nginx.conf
└── .github/workflows/
```

---

# ⚡ Scalability Design

TradeDesk uses a non-destructive enhancement architecture.

If MongoDB is available:

```text
MongoDB
↓
Persistent Storage
```

If MongoDB is unavailable:

```text
In-Memory Storage
↓
Application Continues Running
```

This allows:

* Local development without setup
* Easy evaluation by faculty
* Cloud-native deployment
* High availability

---

# 🔒 Security Features

* JWT Authentication
* Protected Routes
* Helmet Security Headers
* API Rate Limiting
* Request Validation via Zod
* Environment Variable Isolation
* Role-Based Access Control

---

# 🚦 Quick Start

## Docker Deployment

```bash
git clone https://github.com/Sdcodsjs/Stock-Broker.git

cd Stock-Broker

docker compose up --build
```

---

## Local Development

### Backend

```bash
cd server

npm install

npm start
```

### Frontend

```bash
cd client

npm install

npm run dev
```

---

# 📈 Performance Highlights

* Real-Time WebSocket Communication
* Concurrent Multi-User Support
* Optimized State Management via Zustand
* Efficient Socket Subscription Broadcasting
* Modular Component Architecture
* Dockerized Deployment Pipeline

---

# 🎓 Academic Requirements Covered

✔ Email Login

✔ Stock Subscription

✔ Multiple Users

✔ Real-Time Updates

✔ WebSocket Communication

✔ User-Specific Market Feeds

✔ Live Dashboard Updates Without Refresh

✔ Stock Price Simulation

✔ Activity Tracking

✔ Advanced Analytics

---

# 🔮 Future Enhancements

* Real Market Data APIs
* OAuth Authentication
* Mobile Application
* AI Market Insights
* Advanced Portfolio Optimization
* Kubernetes Deployment

---

# 👨‍💻 Author

Developed as a real-time financial systems project demonstrating:

* Full-Stack Development
* Real-Time Architectures
* WebSocket Communication
* Portfolio Simulation
* DevOps Practices
* Secure API Design

---

# 📄 License

MIT License
