import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { database } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';

interface Announcement {
  message: string;
  timestamp: string;
  active: boolean;
}

const AnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const announcementRef = ref(database, 'system/announcement');
    
    const unsubscribe = onValue(announcementRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.active && data.message.trim()) {
        setAnnouncement(data);
        setIsVisible(true);
      } else {
        setAnnouncement(null);
      }
    });

    return () => off(announcementRef);
  }, []);

  if (!announcement || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 border-l-4 border-blue-400 p-4 mb-6 rounded-lg shadow-lg">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-200 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white font-medium">Sistem Duyurusu</p>
          <p className="text-blue-100 text-sm mt-1">{announcement.message}</p>
          <p className="text-blue-200 text-xs mt-2">
            {new Date(announcement.timestamp).toLocaleString('tr-TR')}
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-200 hover:text-white transition-colors ml-4"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;