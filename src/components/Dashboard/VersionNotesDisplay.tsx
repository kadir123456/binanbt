import React, { useState, useEffect } from 'react';
import { FileText, X, Sparkles, Wrench } from 'lucide-react';
import { database } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';

interface VersionNote {
  id: string;
  version: string;
  title: string;
  description: string;
  features: string[];
  fixes: string[];
  releaseDate: string;
  isLatest: boolean;
}

const VersionNotesDisplay: React.FC = () => {
  const [latestVersion, setLatestVersion] = useState<VersionNote | null>(null);
  const [allVersions, setAllVersions] = useState<VersionNote[]>([]);
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const versionsRef = ref(database, 'system/versionNotes');
    
    const unsubscribe = onValue(versionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const versionsData = snapshot.val();
        const versionsArray = Object.entries(versionsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        
        setAllVersions(versionsArray);
        
        const latest = versionsArray.find(v => v.isLatest);
        if (latest) {
          setLatestVersion(latest);
        }
      }
    });

    return () => off(versionsRef);
  }, []);

  if (!isVisible || !latestVersion) {
    return null;
  }

  if (showAllVersions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-purple-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">Tüm Sürüm Notları</h3>
            </div>
            <button
              onClick={() => setShowAllVersions(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {allVersions.map((version) => (
              <div
                key={version.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  version.isLatest
                    ? 'border-purple-600 bg-purple-600 bg-opacity-10'
                    : 'border-gray-600 bg-gray-700 bg-opacity-30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-semibold text-white">
                      v{version.version} - {version.title}
                    </h4>
                    {version.isLatest && (
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        Güncel
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {new Date(version.releaseDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                {version.description && (
                  <p className="text-gray-300 text-sm mb-3">{version.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {version.features.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Sparkles className="h-4 w-4 text-green-400 mr-2" />
                        <h5 className="text-green-400 font-medium text-sm">Yeni Özellikler</h5>
                      </div>
                      <ul className="space-y-1">
                        {version.features.map((feature, index) => (
                          <li key={index} className="text-gray-300 text-sm">• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {version.fixes.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Wrench className="h-4 w-4 text-blue-400 mr-2" />
                        <h5 className="text-blue-400 font-medium text-sm">Hata Düzeltmeleri</h5>
                      </div>
                      <ul className="space-y-1">
                        {version.fixes.map((fix, index) => (
                          <li key={index} className="text-gray-300 text-sm">• {fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-800 border-l-4 border-purple-400 p-4 mb-6 rounded-lg shadow-lg">
      <div className="flex items-start">
        <FileText className="h-5 w-5 text-purple-200 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-medium">
              🎉 Yeni Sürüm: v{latestVersion.version} - {latestVersion.title}
            </p>
            <button
              onClick={() => setIsVisible(false)}
              className="text-purple-200 hover:text-white transition-colors ml-4"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {latestVersion.description && (
            <p className="text-purple-100 text-sm mb-3">{latestVersion.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {latestVersion.features.length > 0 && (
              <div>
                <h5 className="text-purple-200 font-medium text-sm mb-1 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Yeni Özellikler
                </h5>
                <ul className="space-y-1">
                  {latestVersion.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="text-purple-100 text-xs">• {feature}</li>
                  ))}
                  {latestVersion.features.length > 3 && (
                    <li className="text-purple-200 text-xs">• ve {latestVersion.features.length - 3} özellik daha...</li>
                  )}
                </ul>
              </div>
            )}

            {latestVersion.fixes.length > 0 && (
              <div>
                <h5 className="text-purple-200 font-medium text-sm mb-1 flex items-center">
                  <Wrench className="h-3 w-3 mr-1" />
                  Hata Düzeltmeleri
                </h5>
                <ul className="space-y-1">
                  {latestVersion.fixes.slice(0, 3).map((fix, index) => (
                    <li key={index} className="text-purple-100 text-xs">• {fix}</li>
                  ))}
                  {latestVersion.fixes.length > 3 && (
                    <li className="text-purple-200 text-xs">• ve {latestVersion.fixes.length - 3} düzeltme daha...</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-purple-200 text-xs">
              {new Date(latestVersion.releaseDate).toLocaleDateString('tr-TR')}
            </p>
            <button
              onClick={() => setShowAllVersions(true)}
              className="text-purple-200 hover:text-white text-xs underline transition-colors"
            >
              Tüm sürüm notlarını gör
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionNotesDisplay;