import React, { useState, useEffect } from 'react';
import { Shield, MessageSquare, Globe, Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../config/firebase';
import { ref, get } from 'firebase/database';
import VersionNotes from './VersionNotes';

interface WhitelistIP {
  id: string;
  ip: string;
  description: string;
  addedAt: string;
  active: boolean;
}

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [whitelistIPs, setWhitelistIPs] = useState<WhitelistIP[]>([]);
  const [newIP, setNewIP] = useState('');
  const [newIPDescription, setNewIPDescription] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    checkAdminAccess();
  }, [currentUser]);

  const checkAdminAccess = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const adminRef = ref(database, `admins/${currentUser.uid}`);
      const snapshot = await get(adminRef);
      
      if (snapshot.exists() && snapshot.val().role === 'admin') {
        setIsAuthenticated(true);
        await loadWhitelistIPs();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadWhitelistIPs = async () => {
    try {
      const response = await fetch(`/api/admin/whitelist-ips?adminKey=${adminKey}`);
      if (response.ok) {
        const ips = await response.json();
        setWhitelistIPs(ips);
      }
    } catch (error) {
      console.error('Error loading whitelist IPs:', error);
    }
  };

  const handleAnnouncementSave = async () => {
    setSaveLoading(true);
    try {
      const announcementRef = ref(database, 'system/announcement');
      await announcementRef.set({
        message: announcement,
        timestamp: new Date().toISOString(),
        active: announcement.trim().length > 0,
        addedBy: currentUser?.uid
      });

      alert('Duyuru başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Duyuru kaydedilirken hata oluştu!');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) return;

    setSaveLoading(true);
    try {
      const whitelistRef = ref(database, 'system/whitelistIPs').push();
      await whitelistRef.set({
        ip: newIP,
        description: newIPDescription,
        addedAt: new Date().toISOString(),
        addedBy: currentUser?.uid,
        active: true
      });

      setNewIP('');
      setNewIPDescription('');
      await loadWhitelistIPs();
      alert('IP adresi başarıyla eklendi!');
    } catch (error) {
      console.error('Error adding IP:', error);
      alert('IP adresi eklenirken hata oluştu!');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Admin erişimi kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-red-500 mb-6" />
            <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
            <p className="mt-2 text-gray-400">Lütfen önce giriş yapın</p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
            <a
              href="/"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105"
            >
              Ana Sayfaya Dön
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-red-500 mb-6" />
            <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
            <p className="mt-2 text-gray-400">Yetkisiz Erişim</p>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
            <div className="text-center space-y-4">
              <p className="text-gray-300">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
              <p className="text-gray-400 text-sm">
                Kullanıcı: {currentUser.email}
              </p>
              <a
                href="/"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Sistem yönetimi ve konfigürasyon</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Announcement Management */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center mb-6">
              <MessageSquare className="h-6 w-6 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">Genel Duyuru</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duyuru Metni
                </label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Tüm kullanıcılara gösterilecek duyuru metnini buraya yazın..."
                />
              </div>

              <button
                onClick={handleAnnouncementSave}
                disabled={saveLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {saveLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Duyuruyu Kaydet
              </button>
            </div>
          </div>

          {/* IP Whitelist Management */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center mb-6">
              <Globe className="h-6 w-6 text-green-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">IP Whitelist</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="IP adresi (örn: 192.168.1.1)"
                />
                <input
                  type="text"
                  value={newIPDescription}
                  onChange={(e) => setNewIPDescription(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Açıklama (isteğe bağlı)"
                />
              </div>

              <button
                onClick={handleAddIP}
                disabled={saveLoading || !newIP.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                IP Ekle
              </button>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Mevcut IP Adresleri</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {whitelistIPs.length === 0 ? (
                    <p className="text-gray-500 text-sm">Henüz IP adresi eklenmemiş</p>
                  ) : (
                    whitelistIPs.map((ipData) => (
                      <div
                        key={ipData.id}
                        className="flex items-center justify-between bg-gray-700 bg-opacity-50 rounded-lg p-3"
                      >
                        <div>
                          <p className="text-white font-medium">{ipData.ip}</p>
                          {ipData.description && (
                            <p className="text-gray-400 text-xs">{ipData.description}</p>
                          )}
                          <p className="text-gray-500 text-xs">
                            {new Date(ipData.addedAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <button className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version Notes Management */}
        <div className="mt-6">
          <VersionNotes adminKey={currentUser?.uid || ''} />
        </div>

        {/* System Status */}
        <div className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
          <h3 className="text-xl font-semibold text-white mb-4">Sistem Durumu</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 text-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-gray-400 text-sm">Server Durumu</p>
              <p className="text-white font-bold">Çalışıyor</p>
            </div>
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 text-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-gray-400 text-sm">Database</p>
              <p className="text-white font-bold">Bağlı</p>
            </div>
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 text-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-gray-400 text-sm">Trading Bot</p>
              <p className="text-white font-bold">Aktif</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;