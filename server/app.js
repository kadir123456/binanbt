const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const WebSocket = require('ws');
const ccxt = require('ccxt');
const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK initialization
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Trading Bot Class
class TradingBot {
  constructor() {
    this.activeUsers = new Map();
    this.exchanges = new Map();
    this.positions = new Map();
    this.isRunning = false;
    this.init();
  }

  async init() {
    console.log('🤖 Trading Bot initializing...');
    await this.loadActiveUsers();
    this.startBot();
    this.setupCronJobs();
  }

  async loadActiveUsers() {
    try {
      const usersRef = db.ref('users');
      const snapshot = await usersRef.once('value');
      const users = snapshot.val() || {};

      for (const [userId, userData] of Object.entries(users)) {
        if (userData.botStatus?.isRunning && userData.apiKeys) {
          await this.initializeUserExchange(userId, userData);
        }
      }
      
      console.log(`📊 Loaded ${this.activeUsers.size} active trading users`);
    } catch (error) {
      console.error('❌ Error loading users:', error);
    }
  }

  async initializeUserExchange(userId, userData) {
    try {
      const decryptedApiKey = Buffer.from(userData.apiKeys.apiKey, 'base64').toString();
      const decryptedSecret = Buffer.from(userData.apiKeys.apiSecret, 'base64').toString();

      const exchange = new ccxt.binance({
        apiKey: decryptedApiKey,
        secret: decryptedSecret,
        sandbox: false,
        options: {
          defaultType: 'future'
        }
      });

      // Test connection
      await exchange.fetchBalance();
      
      this.exchanges.set(userId, exchange);
      this.activeUsers.set(userId, {
        settings: userData.settings || {},
        lastSignalTime: Date.now(),
        positions: userData.positions || {}
      });

      console.log(`✅ User ${userId} exchange initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize exchange for user ${userId}:`, error);
      await this.updateUserBotStatus(userId, { 
        isRunning: false, 
        error: 'API anahtarları geçersiz veya yetkisiz' 
      });
    }
  }

  startBot() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Trading Bot started');

    // Main trading loop - runs every 30 seconds
    this.tradingInterval = setInterval(async () => {
      await this.runTradingCycle();
    }, 30000);

    // Position monitoring - runs every 10 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.monitorPositions();
    }, 10000);
  }

  async runTradingCycle() {
    for (const [userId, userData] of this.activeUsers) {
      try {
        const exchange = this.exchanges.get(userId);
        if (!exchange) continue;

        const settings = userData.settings;
        if (!settings?.symbols?.length) continue;

        for (const symbol of settings.symbols) {
          await this.analyzeAndTrade(userId, exchange, symbol, settings);
        }
      } catch (error) {
        console.error(`❌ Trading cycle error for user ${userId}:`, error);
      }
    }
  }

  async analyzeAndTrade(userId, exchange, symbol, settings) {
    try {
      // Fetch OHLCV data for EMA calculation
      const timeframe = settings.timeframe || '15m';
      const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, 100);
      
      if (ohlcv.length < 50) return;

      // Calculate EMAs
      const closes = ohlcv.map(candle => candle[4]);
      const ema9 = this.calculateEMA(closes, 9);
      const ema21 = this.calculateEMA(closes, 21);
      const ema50 = this.calculateEMA(closes, 50);

      const currentPrice = closes[closes.length - 1];
      const currentEma9 = ema9[ema9.length - 1];
      const currentEma21 = ema21[ema21.length - 1];
      const currentEma50 = ema50[ema50.length - 1];

      // Trading signals
      const bullishSignal = currentEma9 > currentEma21 && currentEma21 > currentEma50;
      const bearishSignal = currentEma9 < currentEma21 && currentEma21 < currentEma50;

      // Volume confirmation
      const volumes = ohlcv.slice(-10).map(candle => candle[5]);
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const currentVolume = volumes[volumes.length - 1];
      const volumeConfirmed = currentVolume > avgVolume * 1.2;

      if (volumeConfirmed && (bullishSignal || bearishSignal)) {
        await this.executeTradeSignal(userId, exchange, symbol, {
          signal: bullishSignal ? 'LONG' : 'SHORT',
          price: currentPrice,
          settings
        });
      }

    } catch (error) {
      console.error(`❌ Analysis error for ${symbol}:`, error);
    }
  }

  async executeTradeSignal(userId, exchange, symbol, signalData) {
    try {
      const { signal, price, settings } = signalData;
      
      // Log trading attempt
      await this.logActivity(userId, 'info', `${symbol} için ${signal} sinyali analiz ediliyor`, {
        symbol,
        signal,
        price: price.toFixed(4)
      });

      // Check if already have position for this symbol
      const existingPosition = await this.getExistingPosition(userId, symbol);
      if (existingPosition) {
        await this.logActivity(userId, 'warning', `${symbol} için zaten açık pozisyon mevcut`, { symbol });
        return;
      }

      // Calculate position size
      const balance = await exchange.fetchBalance();
      const usdtBalance = balance.USDT?.free || 0;
      
      if (usdtBalance < 10) {
        await this.logActivity(userId, 'error', 'Yetersiz bakiye - minimum 10 USDT gerekli', {
          currentBalance: usdtBalance.toFixed(2)
        });
        return;
      }

      const riskAmount = usdtBalance * (settings.riskPercentage / 100);
      const leverage = settings.leverage || 10;
      const positionSize = (riskAmount * leverage) / price;

      // Set leverage
      await exchange.setLeverage(leverage, symbol);

      // Place market order
      const side = signal === 'LONG' ? 'buy' : 'sell';
      const order = await exchange.createMarketOrder(symbol, side, positionSize);

      if (order.filled > 0) {
        // Calculate TP and SL prices
        const tpPrice = signal === 'LONG' 
          ? price * (1 + settings.tpPercentage / 100)
          : price * (1 - settings.tpPercentage / 100);
          
        const slPrice = signal === 'LONG'
          ? price * (1 - settings.slPercentage / 100)
          : price * (1 + settings.slPercentage / 100);

        // Place TP and SL orders
        const tpSide = signal === 'LONG' ? 'sell' : 'buy';
        const slSide = signal === 'LONG' ? 'sell' : 'buy';

        await exchange.createLimitOrder(symbol, tpSide, order.filled, tpPrice);
        await exchange.createStopMarketOrder(symbol, slSide, order.filled, slPrice);

        // Save position to database
        const position = {
          id: order.id,
          symbol,
          side: signal,
          size: order.filled,
          entryPrice: order.average || price,
          currentPrice: price,
          tpPrice,
          slPrice,
          pnl: 0,
          timestamp: new Date().toISOString()
        };

        await this.savePosition(userId, position);
        
        await this.logActivity(userId, 'success', `${symbol} ${signal} pozisyonu açıldı`, {
          symbol,
          side: signal,
          size: order.filled.toFixed(6),
          price: (order.average || price).toFixed(4),
          tpPrice: tpPrice.toFixed(4),
          slPrice: slPrice.toFixed(4)
        });
        
        console.log(`✅ Position opened: ${symbol} ${signal} at ${price}`);
      }

    } catch (error) {
      console.error(`❌ Trade execution error:`, error);
      await this.logActivity(userId, 'error', `İşlem hatası: ${error.message}`, {
        symbol: signalData.symbol,
        error: error.message
      });
      await this.updateUserBotStatus(userId, { 
        error: `İşlem hatası: ${error.message}` 
      });
    }
  }

  async logActivity(userId, type, message, details = {}) {
    try {
      const activityRef = db.ref(`users/${userId}/activityLogs`).push();
      await activityRef.set({
        type, // 'info', 'success', 'warning', 'error'
        message,
        details: JSON.stringify(details),
        symbol: details.symbol || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  async monitorPositions() {
    for (const [userId, userData] of this.activeUsers) {
      try {
        const exchange = this.exchanges.get(userId);
        if (!exchange) continue;

        const positions = await exchange.fetchPositions();
        const openPositions = positions.filter(pos => pos.size > 0);

        // Update position data in database
        for (const position of openPositions) {
          await this.updatePositionPnL(userId, position);
        }

        // Update bot status
        await this.updateUserBotStatus(userId, {
          activePositions: openPositions.length,
          lastUpdate: new Date().toISOString()
        });

      } catch (error) {
        console.error(`❌ Position monitoring error for user ${userId}:`, error);
      }
    }
  }

  calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }

    return ema;
  }

  async savePosition(userId, position) {
    const positionRef = db.ref(`users/${userId}/positions`).push();
    await positionRef.set(position);
  }

  async updatePositionPnL(userId, position) {
    const positionsRef = db.ref(`users/${userId}/positions`);
    const snapshot = await positionsRef.once('value');
    const positions = snapshot.val() || {};

    for (const [key, pos] of Object.entries(positions)) {
      if (pos.symbol === position.symbol) {
        await positionsRef.child(key).update({
          currentPrice: position.markPrice,
          pnl: position.unrealizedPnl,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  async updateUserBotStatus(userId, status) {
    const statusRef = db.ref(`users/${userId}/botStatus`);
    const currentStatus = (await statusRef.once('value')).val() || {};
    
    await statusRef.update({
      ...currentStatus,
      ...status,
      lastUpdate: new Date().toISOString()
    });
  }

  async getExistingPosition(userId, symbol) {
    const positionsRef = db.ref(`users/${userId}/positions`);
    const snapshot = await positionsRef.once('value');
    const positions = snapshot.val() || {};
    
    return Object.values(positions).find(pos => 
      pos.symbol === symbol && pos.status !== 'closed'
    );
  }

  setupCronJobs() {
    // Daily cleanup - runs at 00:00 UTC
    cron.schedule('0 0 * * *', async () => {
      console.log('🧹 Running daily cleanup...');
      await this.cleanupOldData();
    });

    // Health check - runs every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.healthCheck();
    });
  }

  async cleanupOldData() {
    // Clean up old trade history (older than 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const userId of this.activeUsers.keys()) {
      const historyRef = db.ref(`users/${userId}/tradeHistory`);
      const snapshot = await historyRef.once('value');
      const history = snapshot.val() || {};

      for (const [key, trade] of Object.entries(history)) {
        if (new Date(trade.timestamp).getTime() < thirtyDaysAgo) {
          await historyRef.child(key).remove();
        }
      }
    }
  }

  async healthCheck() {
    console.log(`💓 Health check - Active users: ${this.activeUsers.size}`);
    
    // Check exchange connections
    for (const [userId, exchange] of this.exchanges) {
      try {
        await exchange.fetchBalance();
      } catch (error) {
        console.error(`❌ Exchange connection lost for user ${userId}`);
        await this.updateUserBotStatus(userId, {
          error: 'Binance bağlantısı kesildi'
        });
      }
    }
  }
}

// Initialize trading bot
const tradingBot = new TradingBot();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    activeUsers: tradingBot.activeUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Admin routes
app.post('/api/admin/announcement', async (req, res) => {
  try {
    const { message, adminKey } = req.body;
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.ref('system/announcement').set({
      message,
      timestamp: new Date().toISOString(),
      active: true
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/whitelist-ip', async (req, res) => {
  try {
    const { ip, description, adminKey } = req.body;
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ipRef = db.ref('system/whitelistIPs').push();
    await ipRef.set({
      ip,
      description,
      addedAt: new Date().toISOString(),
      active: true
    });

    res.json({ success: true, id: ipRef.key });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/whitelist-ips', async (req, res) => {
  try {
    const { adminKey } = req.query;
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.ref('system/whitelistIPs').once('value');
    const ips = snapshot.val() || {};
    
    res.json(Object.entries(ips).map(([id, data]) => ({ id, ...data })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User bot control
app.post('/api/bot/start', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Load user data
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    if (!userData?.apiKeys) {
      return res.status(400).json({ error: 'API anahtarları bulunamadı' });
    }

    await tradingBot.initializeUserExchange(userId, userData);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bot/stop', async (req, res) => {
  try {
    const { userId } = req.body;
    
    tradingBot.exchanges.delete(userId);
    tradingBot.activeUsers.delete(userId);
    
    await tradingBot.updateUserBotStatus(userId, {
      isRunning: false,
      error: undefined
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Trading Bot Server running on port ${PORT}`);
});

module.exports = app;