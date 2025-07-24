import React, { useState, useEffect } from 'react';
import { FileText, Plus, Save, Trash2, Edit3 } from 'lucide-react';
import { database } from '../../config/firebase';
import { ref, set, get, push, remove } from 'firebase/database';

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

interface VersionNotesProps {
  adminKey?: string;
}

const VersionNotes: React.FC<VersionNotesProps> = ({ adminKey = 'admin_key_2025' }) => {
  const [versions, setVersions] = useState<VersionNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    description: '',
    features: [''],
    fixes: ['']
  });

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const versionsRef = ref(database, 'system/versionNotes');
      const snapshot = await get(versionsRef);
      
      if (snapshot.exists()) {
        const versionsData = snapshot.val();
        const versionsArray = Object.entries(versionsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        
        setVersions(versionsArray);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const handleSaveVersion = async () => {
    if (!formData.version || !formData.title) {
      alert('Versiyon numarası ve başlık zorunludur!');
      return;
    }

    setLoading(true);
    try {
      // Backend API kullan
      const response = await fetch('/api/admin/version-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionData: {
            version: formData.version,
            title: formData.title,
            description: formData.description,
            features: formData.features.filter(f => f.trim()),
            fixes: formData.fixes.filter(f => f.trim()),
            releaseDate: new Date().toISOString(),
            isLatest: true
          },
          editingVersion,
          adminKey
        })
      });

      if (!response.ok) {
        throw new Error('Sürüm notu kaydedilemedi');
      }

      /* Eski kod - Firebase kuralları ile çakışıyor
      const versionData = {
        version: formData.version,
        title: formData.title,
        description: formData.description,
        features: formData.features.filter(f => f.trim()),
        fixes: formData.fixes.filter(f => f.trim()),
        releaseDate: new Date().toISOString(),
        isLatest: true
      };

      let versionRef;
      if (editingVersion) {
        versionRef = ref(database, `system/versionNotes/${editingVersion}`);
        versionData.isLatest = versions.find(v => v.id === editingVersion)?.isLatest || false;
      } else {
        versionRef = push(ref(database, 'system/versionNotes'));
        
        // Mark all other versions as not latest
        for (const version of versions) {
          if (version.isLatest) {
            await set(ref(database, `system/versionNotes/${version.id}/isLatest`), false);
          }
        }
      }

      await set(versionRef, versionData);
      */
      
      setFormData({
        version: '',
        title: '',
        description: '',
        features: [''],
        fixes: ['']
      });
      setShowAddForm(false);
      setEditingVersion(null);
      await loadVersions();
      
      alert('Sürüm notu başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving version:', error);
      alert('Sürüm notu kaydedilirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVersion = (version: VersionNote) => {
    setFormData({
      version: version.version,
      title: version.title,
      description: version.description,
      features: version.features.length > 0 ? version.features : [''],
      fixes: version.fixes.length > 0 ? version.fixes : ['']
    });
    setEditingVersion(version.id);
    setShowAddForm(true);
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Bu sürüm notunu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/version-note/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey
        })
      });

      if (!response.ok) {
        throw new Error('Sürüm notu silinemedi');
      }

      await loadVersions();
      alert('Sürüm notu silindi!');
    } catch (error) {
      console.error('Error deleting version:', error);
      alert('Sürüm notu silinirken hata oluştu!');
    }
  };

  const addFeatureField = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const addFixField = () => {
    setFormData(prev => ({
      ...prev,
      fixes: [...prev.fixes, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const updateFix = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      fixes: prev.fixes.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const removeFix = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fixes: prev.fixes.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-purple-400 mr-3" />
          <h3 className="text-xl font-semibold text-white">Sürüm Notları Yönetimi</h3>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingVersion(null);
            setFormData({
              version: '',
              title: '',
              description: '',
              features: [''],
              fixes: ['']
            });
          }}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sürüm
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600">
          <h4 className="text-lg font-medium text-white mb-4">
            {editingVersion ? 'Sürüm Notunu Düzenle' : 'Yeni Sürüm Notu Ekle'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Versiyon Numarası
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Başlık
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="İlk Sürüm"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Bu sürümde yapılan değişikliklerin genel açıklaması..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Yeni Özellikler
                </label>
                <button
                  onClick={addFeatureField}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  + Ekle
                </button>
              </div>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Yeni özellik açıklaması"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                  />
                  {formData.features.length > 1 && (
                    <button
                      onClick={() => removeFeature(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Hata Düzeltmeleri
                </label>
                <button
                  onClick={addFixField}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  + Ekle
                </button>
              </div>
              {formData.fixes.map((fix, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={fix}
                    onChange={(e) => updateFix(index, e.target.value)}
                    placeholder="Düzeltilen hata açıklaması"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                  />
                  {formData.fixes.length > 1 && (
                    <button
                      onClick={() => removeFix(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveVersion}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingVersion ? 'Güncelle' : 'Kaydet'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingVersion(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Henüz sürüm notu eklenmemiş</p>
          </div>
        ) : (
          versions.map((version) => (
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditVersion(version)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVersion(version.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {version.description && (
                <p className="text-gray-300 text-sm mb-3">{version.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                {version.features.length > 0 && (
                  <div>
                    <h5 className="text-green-400 font-medium text-sm mb-2">✨ Yeni Özellikler</h5>
                    <ul className="space-y-1">
                      {version.features.map((feature, index) => (
                        <li key={index} className="text-gray-300 text-sm">• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.fixes.length > 0 && (
                  <div>
                    <h5 className="text-blue-400 font-medium text-sm mb-2">🔧 Hata Düzeltmeleri</h5>
                    <ul className="space-y-1">
                      {version.fixes.map((fix, index) => (
                        <li key={index} className="text-gray-300 text-sm">• {fix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-gray-500 text-xs">
                {new Date(version.releaseDate).toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionNotes;
