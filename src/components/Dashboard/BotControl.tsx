import React, { useState, useEffect } from 'react';
import { Play, Square, Activity, AlertCircle } from 'lucide-react';
import { binanceService, BotStatus } from '../../services/binanceService';
import { useAuth } from '../../contexts/AuthContext';

const BotControl: React.FC = () => {
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    activePositions: 0,
    lastUpdate: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      binanceService.setUserId(currentUser.uid);
      
      // Load initial bot status
      loadBotStatus();
      
      // Subscribe to real-time updates
      const unsubscribe = binanceService.onBotStatusChange((status) => {
        setBotStatus(status);
      });

      return unsubscribe;
    }
  }, [currentUser]);

  const loadBotStatus = async () => {
    try {
      const status = await binanceService.getBotStatus();
      setBotStatus(status);
    } catch (error) {
      console.error('Error loading bot status:', error);
    }
  };

  const handleStartBot = async () => {
    setLoading(true);
    try {
      await binanceService.updateBotStatus({
        isRunning: true,
        error: undefined
      });
    } catch (error: any) {
      await binanceService.updateBotStatus({
        error: error.message || 'Bot başlatılamadı'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async () => {
    setLoading(true);
    try {
      await binanceService.updateBotStatus({
        isRunning: false,
        error: undefined
      });
    } catch (error: any) {
      await binanceService.updateBotStatus({
        error: error.message || 'Bot durdurulamadı'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Bot Durumu</h3>
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${
            botStatus.isRunning 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-red-500'
          }`} />
          <span className={`text-sm font-medium ${
            botStatus.isRunning ? 'text-green-400' : 'text-gray-400'
          }`}>
            {botStatus.isRunning ? 'Çalışıyor' : 'Durduruldu'}
          </span>
        </div>
      </div>

      {botStatus.error && (
        <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-600 rounded-lg flex items-center">
          <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
          <span className="text-red-400 text-sm">{botStatus.error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 text-center">
          <Activity className="h-6 w-6 text-blue-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Aktif Pozisyonlar</p>
          <p className="text-2xl font-bold text-white">{botStatus.activePositions}</p>
        </div>
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 text-center">
          <div className="h-6 w-6 bg-green-400 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900">$</span>
          </div>
          <p className="text-gray-400 text-sm">Günlük P&L</p>
          <p className="text-2xl font-bold text-green-400">+$0.00</p>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleStartBot}
          disabled={botStatus.isRunning || loading}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Botu Başlat
        </button>
        
        <button
          onClick={handleStopBot}
          disabled={!botStatus.isRunning || loading}
          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Square className="h-4 w-4 mr-2" />
          )}
          Botu Durdur
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Son güncelleme: {new Date(botStatus.lastUpdate).toLocaleString('tr-TR')}
      </div>
    </div>
  );
};

export default BotControl;