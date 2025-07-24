import { database } from '../config/firebase';
import { ref, set, get, push, onValue, off } from 'firebase/database';

export interface TradingSettings {
  leverage: number;
  riskPercentage: number;
  tpPercentage: number;
  slPercentage: number;
  symbols: string[];
  timeframe: string;
}

export interface ApiKeys {
  apiKey: string;
  apiSecret: string;
  encrypted: boolean;
}

export interface BotStatus {
  isRunning: boolean;
  activePositions: number;
  lastUpdate: string;
  error?: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  tpPrice?: number;
  slPrice?: number;
  timestamp: string;
}

class BinanceService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // API Keys Management
  async saveApiKeys(apiKeys: ApiKeys): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const userRef = ref(database, `users/${this.userId}/apiKeys`);
    await set(userRef, {
      ...apiKeys,
      updatedAt: new Date().toISOString()
    });
  }

  async getApiKeys(): Promise<ApiKeys | null> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const userRef = ref(database, `users/${this.userId}/apiKeys`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Trading Settings
  async saveTradingSettings(settings: TradingSettings): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const userRef = ref(database, `users/${this.userId}/settings`);
    await set(userRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
  }

  async getTradingSettings(): Promise<TradingSettings | null> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const userRef = ref(database, `users/${this.userId}/settings`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Bot Status
  async updateBotStatus(status: Partial<BotStatus>): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const statusRef = ref(database, `users/${this.userId}/botStatus`);
    const currentStatus = await this.getBotStatus();
    
    await set(statusRef, {
      ...currentStatus,
      ...status,
      lastUpdate: new Date().toISOString()
    });
  }

  async getBotStatus(): Promise<BotStatus> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const statusRef = ref(database, `users/${this.userId}/botStatus`);
    const snapshot = await get(statusRef);
    
    return snapshot.exists() ? snapshot.val() : {
      isRunning: false,
      activePositions: 0,
      lastUpdate: new Date().toISOString()
    };
  }

  // Real-time Bot Status Listener
  onBotStatusChange(callback: (status: BotStatus) => void): () => void {
    if (!this.userId) throw new Error('User not authenticated');
    
    const statusRef = ref(database, `users/${this.userId}/botStatus`);
    
    onValue(statusRef, (snapshot) => {
      const status = snapshot.exists() ? snapshot.val() : {
        isRunning: false,
        activePositions: 0,
        lastUpdate: new Date().toISOString()
      };
      callback(status);
    });

    return () => off(statusRef);
  }

  // Positions Management
  async addPosition(position: Omit<Position, 'id'>): Promise<string> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const positionsRef = ref(database, `users/${this.userId}/positions`);
    const newPositionRef = push(positionsRef);
    
    await set(newPositionRef, {
      ...position,
      id: newPositionRef.key,
      timestamp: new Date().toISOString()
    });
    
    return newPositionRef.key!;
  }

  async updatePosition(positionId: string, updates: Partial<Position>): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const positionRef = ref(database, `users/${this.userId}/positions/${positionId}`);
    const currentPosition = await get(positionRef);
    
    if (currentPosition.exists()) {
      await set(positionRef, {
        ...currentPosition.val(),
        ...updates,
        updatedAt: new Date().toISOString()
      });
    }
  }

  async getPositions(): Promise<Position[]> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const positionsRef = ref(database, `users/${this.userId}/positions`);
    const snapshot = await get(positionsRef);
    
    if (!snapshot.exists()) return [];
    
    const positions = snapshot.val();
    return Object.values(positions) as Position[];
  }

  // Real-time Positions Listener
  onPositionsChange(callback: (positions: Position[]) => void): () => void {
    if (!this.userId) throw new Error('User not authenticated');
    
    const positionsRef = ref(database, `users/${this.userId}/positions`);
    
    onValue(positionsRef, (snapshot) => {
      const positions = snapshot.exists() 
        ? Object.values(snapshot.val()) as Position[]
        : [];
      callback(positions);
    });

    return () => off(positionsRef);
  }

  // Trading History
  async addTradeHistory(trade: any): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const historyRef = ref(database, `users/${this.userId}/tradeHistory`);
    const newTradeRef = push(historyRef);
    
    await set(newTradeRef, {
      ...trade,
      id: newTradeRef.key,
      timestamp: new Date().toISOString()
    });
  }

  // Market Data (WebSocket simulation)
  private marketDataCallbacks: ((data: any) => void)[] = [];
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  subscribeToMarketData(symbols: string[], callback: (data: any) => void): () => void {
    this.marketDataCallbacks.push(callback);
    
    // Start real price updates if not already running
    if (!this.priceUpdateInterval) {
      this.startMarketDataSimulation(symbols);
    }

    return () => {
      const index = this.marketDataCallbacks.indexOf(callback);
      if (index > -1) {
        this.marketDataCallbacks.splice(index, 1);
      }
      
      // Stop updates if no more callbacks
      if (this.marketDataCallbacks.length === 0 && this.priceUpdateInterval) {
        clearInterval(this.priceUpdateInterval);
        this.priceUpdateInterval = null;
      }
    };
  }

  private async startMarketDataSimulation(symbols: string[]) {
    // Fetch real-time price updates from Binance public API
    const fetchPrices = async () => {
      try {
        // Binance public API - 24hr ticker statistics
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const allTickers = await response.json();
        
        // Filter for our symbols
        const relevantTickers = allTickers.filter((ticker: any) => 
          symbols.includes(ticker.symbol)
        );

        relevantTickers.forEach((ticker: any) => {
          const marketData = {
            symbol: ticker.symbol,
            price: parseFloat(ticker.lastPrice),
            change: parseFloat(ticker.priceChangePercent),
            volume: parseFloat(ticker.volume),
            timestamp: new Date().toISOString()
          };

          this.marketDataCallbacks.forEach(callback => {
            callback(marketData);
          });
        });
      } catch (error) {
        console.error('Error fetching Binance market data:', error);
        
        // Fallback to mock data if API fails
        symbols.forEach(symbol => {
          const mockData = {
            symbol,
            price: this.getMockPrice(symbol),
            change: (Math.random() - 0.5) * 10,
            volume: Math.random() * 1000000,
            timestamp: new Date().toISOString()
          };

          this.marketDataCallbacks.forEach(callback => {
            callback(mockData);
          });
        });
      }
    };

    // Initial fetch
    await fetchPrices();
    
    // Update every 5 seconds (Binance rate limit friendly)
    this.priceUpdateInterval = setInterval(fetchPrices, 5000);
  }

  private getMockPrice(symbol: string): number {
    // Realistic mock prices for fallback
    const basePrices: { [key: string]: number } = {
      'BTCUSDT': 43000,
      'ETHUSDT': 2600,
      'ADAUSDT': 0.45,
      'SOLUSDT': 95,
      'BNBUSDT': 310,
      'XRPUSDT': 0.62,
      'DOGEUSDT': 0.08,
      'MATICUSDT': 0.85
    };
    
    const basePrice = basePrices[symbol] || 100;
    // Add some realistic variation (±5%)
    return basePrice * (0.95 + Math.random() * 0.1);
  }
}

export const binanceService = new BinanceService();