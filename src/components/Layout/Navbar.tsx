import React from 'react';
import { TrendingUp, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-400 mr-3" />
            <h1 className="text-xl font-bold text-white">BinanceBot Pro</h1>
          </div>
          
          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;