import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { binanceService } from '../../services/binanceService';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
}

const MarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'];
    
    // Subscribe to market data
    const unsubscribe = binanceService.subscribeToMarketData(symbols, (data: MarketData) => {
      setMarketData(prev => {
        const updated = prev.filter(item => item.symbol !== data.symbol);
        return [...updated, data].sort((a, b) => a.symbol.localeCompare(b.symbol));
      });
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center mb-6">
          <Activity className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-xl font-semibold text-white">Piyasa Durumu</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-700 bg-opacity-50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-6 bg-gray-600 rounded mb-1"></div>
              <div className="h-3 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center mb-6">
        <Activity className="h-6 w-6 text-blue-400 mr-3" />
        <h3 className="text-xl font-semibold text-white">Piyasa Durumu</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {marketData.map(data => (
          <div
            key={data.symbol}
            className="bg-gray-700 bg-opacity-50 rounded-lg p-4 hover:bg-opacity-70 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs font-medium">
                {data.symbol.replace('USDT', '/USDT')}
              </p>
              {data.change >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400" />
              )}
            </div>
            
            <p className="text-lg font-bold text-white mb-1">
              {formatPrice(data.price)}
            </p>
            
            <div className="flex items-center justify-between">
              <p className={`text-xs font-medium ${
                data.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">
                Vol: {formatVolume(data.volume)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Canlı Binance verileri - Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
      </div>
    </div>
  );
};

export default MarketOverview;