import React from 'react';
import AnnouncementBanner from './AnnouncementBanner';
import VersionNotesDisplay from './VersionNotesDisplay';
import ActivityLogs from './ActivityLogs';
import BotControl from './BotControl';
import TradingSettings from './TradingSettings';
import ApiSettings from './ApiSettings';
import MarketOverview from './MarketOverview';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
          <p className="text-gray-400">Binance Futures Bot yönetim paneli</p>
        </div>

        <AnnouncementBanner />
        <VersionNotesDisplay />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <BotControl />
            <TradingSettings />
            <ActivityLogs />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ApiSettings />
            <MarketOverview />
            
            {/* Account Info */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Hesap Bilgileri</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bakiye:</span>
                  <span className="text-white font-medium">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Açık P&L:</span>
                  <span className="text-gray-400">$0.00</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-3">
                  <span className="text-gray-400">Toplam:</span>
                  <span className="text-white font-bold">$0.00</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Sistem Durumu</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Binance Bağlantısı:</span>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm text-green-400">Bağlı</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">WebSocket:</span>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm text-green-400">Aktif</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Strateji:</span>
                  <span className="text-sm text-blue-400">EMA Cross</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Son Aktiviteler</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">Henüz aktivite yok...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;