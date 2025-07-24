import React, { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import { binanceService, TradingSettings as TradingSettingsType } from '../../services/binanceService';
import { useAuth } from '../../contexts/AuthContext';

const TradingSettings: React.FC = () => {
  const [settings, setSettings] = useState<TradingSettingsType>({
    leverage: 10,
    riskPercentage: 2,
    tpPercentage: 2,
    slPercentage: 1,
    symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'],
    timeframe: '15m'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      binanceService.setUserId(currentUser.uid);
      loadSettings();
    }
  }, [currentUser]);

  const loadSettings = async () => {
    try {
      const savedSettings = await binanceService.getTradingSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await binanceService.saveTradingSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (symbol: string, checked: boolean) => {
    if (checked) {
      setSettings(prev => ({
        ...prev,
        symbols: [...prev.symbols, symbol]
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        symbols: prev.symbols.filter(s => s !== symbol)
      }));
    }
  };

  const availableSymbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'MATICUSDT'];

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 text-blue-400 mr-3" />
        <h3 className="text-xl font-semibold text-white">Trading Ayarları</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Kaldıraç
          </label>
          <select
            value={settings.leverage}
            onChange={(e) => setSettings(prev => ({ ...prev, leverage: Number(e.target.value) }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value={5}>5x</option>
            <option value={10}>10x</option>
            <option value={20}>20x</option>
            <option value={50}>50x</option>
            <option value={100}>100x</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Risk Yüzdesi (%)
          </label>
          <input
            type="number"
            value={settings.riskPercentage}
            onChange={(e) => setSettings(prev => ({ ...prev, riskPercentage: Number(e.target.value) }))}
            min="1"
            max="10"
            step="0.1"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Take Profit (%)
          </label>
          <input
            type="number"
            value={settings.tpPercentage}
            onChange={(e) => setSettings(prev => ({ ...prev, tpPercentage: Number(e.target.value) }))}
            min="0.5"
            max="10"
            step="0.1"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Stop Loss (%)
          </label>
          <input
            type="number"
            value={settings.slPercentage}
            onChange={(e) => setSettings(prev => ({ ...prev, slPercentage: Number(e.target.value) }))}
            min="0.5"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Zaman Dilimi
          </label>
          <select
            value={settings.timeframe}
            onChange={(e) => setSettings(prev => ({ ...prev, timeframe: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="1m">1 Dakika</option>
            <option value="5m">5 Dakika</option>
            <option value="15m">15 Dakika</option>
            <option value="1h">1 Saat</option>
            <option value="4h">4 Saat</option>
            <option value="1d">1 Gün</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Trading Sembolleri
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableSymbols.map(symbol => (
            <label key={symbol} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.symbols.includes(symbol)}
                onChange={(e) => handleSymbolChange(symbol, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-300">{symbol}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className={`mt-6 w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : saved ? (
          <>
            <div className="w-4 h-4 bg-white rounded-full mr-2 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
            </div>
            Kaydedildi!
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Ayarları Kaydet
          </>
        )}
      </button>
    </div>
  );
};

export default TradingSettings;