import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Search, FileText, Image, Quote, Settings, LogOut, MessageCircle } from 'lucide-react';
import { logout } from '../lib/auth';

const Layout: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/texts' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    if (window.confirm('Выйти из системы?')) {
      await logout();
      window.location.href = '/login';
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">◎</span>
            </div>
            <span className="text-lg font-semibold">Hidden Treasure</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Link 
              to="/search" 
              className={`p-2 transition-colors ${
                location.pathname === '/search'
                  ? 'text-emerald-500'
                  : 'text-gray-400 hover:text-emerald-500'
              }`}
            >
              <Search className="w-5 h-5" />
            </Link>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800">
        <div className="flex items-center justify-around max-w-4xl mx-auto">
          <Link
            to="/texts"
            className={`flex flex-col items-center py-3 px-4 text-xs transition-colors ${
              isActive('/texts') || location.pathname === '/'
                ? 'text-emerald-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span>Texts</span>
          </Link>
          
          <Link
            to="/images"
            className={`flex flex-col items-center py-3 px-4 text-xs transition-colors ${
              isActive('/images')
                ? 'text-emerald-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Image className="w-5 h-5 mb-1" />
            <span>Media</span>
          </Link>
          
          <Link
            to="/quotes"
            className={`flex flex-col items-center py-3 px-4 text-xs transition-colors ${
              isActive('/quotes')
                ? 'text-emerald-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Quote className="w-5 h-5 mb-1" />
            <span>Quotes</span>
          </Link>
          
          <Link
            to="/chat"
            className={`flex flex-col items-center py-3 px-4 text-xs transition-colors ${
              isActive('/chat')
                ? 'text-emerald-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <MessageCircle className="w-5 h-5 mb-1" />
            <span>Chat</span>
          </Link>
          
          <Link
            to="/admin"
            className={`flex flex-col items-center py-3 px-4 text-xs transition-colors ${
              isActive('/admin')
                ? 'text-emerald-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span>Admin</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;