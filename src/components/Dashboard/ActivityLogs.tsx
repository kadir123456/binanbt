import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Info, AlertTriangle, Clock } from 'lucide-react';
import { database } from '../../config/firebase';
import { ref, onValue, off, query, orderByChild, limitToLast } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

interface ActivityLog {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  symbol?: string;
  timestamp: string;
}

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const logsRef = query(
      ref(database, `users/${currentUser.uid}/activityLogs`),
      orderByChild('timestamp'),
      limitToLast(50)
    );

    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const logsData = snapshot.val();
        const logsArray = Object.entries(logsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).reverse(); // En yeni önce
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
      setLoading(false);
    });

    return () => off(logsRef);
  }, [currentUser]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-600 bg-green-600 bg-opacity-10';
      case 'warning':
        return 'border-yellow-600 bg-yellow-600 bg-opacity-10';
      case 'error':
        return 'border-red-600 bg-red-600 bg-opacity-10';
      default:
        return 'border-blue-600 bg-blue-600 bg-opacity-10';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center mb-6">
          <Activity className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-xl font-semibold text-white">Bot Aktivite Günlüğü</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-700 bg-opacity-50 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-xl font-semibold text-white">Bot Aktivite Günlüğü</h3>
        </div>
        <div className="flex items-center text-sm text-gray-400">
          <Clock className="h-4 w-4 mr-1" />
          Canlı
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Henüz aktivite kaydı yok</p>
            <p className="text-gray-500 text-sm">Bot çalışmaya başladığında aktiviteler burada görünecek</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getLogColor(log.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-medium text-sm">{log.message}</p>
                    {log.symbol && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {log.symbol}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-gray-400 text-xs mb-2">{log.details}</p>
                  )}
                  <p className="text-gray-500 text-xs">{formatTime(log.timestamp)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {logs.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Son 50 aktivite gösteriliyor • Otomatik güncelleme aktif
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;