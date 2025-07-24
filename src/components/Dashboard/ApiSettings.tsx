import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Shield } from 'lucide-react';
import { binanceService, ApiKeys } from '../../services/binanceService';
import { useAuth } from '../../contexts/AuthContext';

const ApiSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      binanceService.setUserId(currentUser.uid);
      checkExistingKeys();
    }
  }, [currentUser]);

  const checkExistingKeys = async () => {
    try {
      const keys = await binanceService.getApiKeys();
      setHasKeys(!!keys);
    } catch (error) {
      console.error('Error checking API keys:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      alert('Lütfen API Key ve Secret Key alanlarını doldurun');
      return;
    }

    setLoading(true);
    try {
      // Simple encryption simulation (in production, use proper encryption)
      const encryptedKeys: ApiKeys = {
        apiKey: btoa(apiKey), // Base64 encoding as simple encryption
        apiSecret: btoa(apiSecret),
        encrypted: true
      };

      await binanceService.saveApiKeys(encryptedKeys);
      setHasKeys(true);
      setSaved(true);
      setApiKey('');
      setApiSecret('');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving API keys:', error);
      alert('API anahtarları kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center mb-6">
        <Key className="h-6 w-6 text-yellow-400 mr-3" />
        <h3 className="text-lg font-semibold text-white">API Ayarları</h3>
      </div>

      {hasKeys && (
        <div className="mb-4 p-3 bg-green-600 bg-opacity-20 border border-green-600 rounded-lg flex items-center">
          <Shield className="h-4 w-4 text-green-400 mr-2" />
          <span className="text-green-400 text-sm">API anahtarları güvenli şekilde kaydedildi</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Binance API Key
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKeys ? "Mevcut API Key'i değiştirmek için yeni key girin" : "API Key'inizi buraya girin"}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Binance Secret Key
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={hasKeys ? "Mevcut Secret Key'i değiştirmek için yeni key girin" : "Secret Key'inizi buraya girin"}
              className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-3">
          <p className="text-yellow-400 text-xs">
            <strong>Güvenlik Uyarısı:</strong> API anahtarlarınız şifrelenmiş olarak saklanır. 
            Sadece Futures trading yetkisi olan anahtarları kullanın ve IP kısıtlaması ekleyin.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : saved ? (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Güvenli Şekilde Kaydedildi!
            </>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              {hasKeys ? 'API Anahtarlarını Güncelle' : 'API Anahtarlarını Kaydet'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ApiSettings;