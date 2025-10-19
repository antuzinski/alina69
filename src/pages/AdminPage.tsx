import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Upload, Settings, FolderOpen, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';

const AdminPage: React.FC = () => {
  // Get stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [itemsRes, foldersRes] = await Promise.all([
        api.getItems({ limit: 2000 }),
        api.getFolders()
      ]);
      
      const items = itemsRes.data.items;
      return {
        total: items.length,
        folders: foldersRes.length,
        images: items.filter(i => i.type === 'image').length,
        texts: items.filter(i => i.type === 'text').length,
        quotes: items.filter(i => i.type === 'quote').length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Админка</h1>
        <p className="text-gray-400">Управление контентом каталога</p>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/admin/upload"
          className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 transition-colors group"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">Upload</h3>
          </div>
          <p className="text-gray-400 text-sm">
            Загрузить новые тексты, изображения или цитаты
          </p>
        </Link>

        <Link
          to="/admin/manage"
          className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 transition-colors group"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">Manage</h3>
          </div>
          <p className="text-gray-400 text-sm">
            Управление существующим контентом
          </p>
        </Link>

        <Link
          to="/admin/folders"
          className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 transition-colors group"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">Folders</h3>
          </div>
          <p className="text-gray-400 text-sm">
            Создание и управление папками
          </p>
        </Link>

      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Быстрые действия</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/upload?type=quote"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Цитата</span>
          </Link>
          
          <Link
            to="/admin/upload?type=text"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Текст</span>
          </Link>
          
          <Link
            to="/admin/upload?type=image"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Фото</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Статистика</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-500">{stats?.total || 0}</div>
            <div className="text-sm text-gray-400">Всего элементов</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-500">{stats?.folders || 0}</div>
            <div className="text-sm text-gray-400">Папок</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-500">{stats?.images || 0}</div>
            <div className="text-sm text-gray-400">Изображений</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-500">{stats?.texts || 0}</div>
            <div className="text-sm text-gray-400">Текстов</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-500">{stats?.quotes || 0}</div>
            <div className="text-sm text-gray-400">Цитат</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;