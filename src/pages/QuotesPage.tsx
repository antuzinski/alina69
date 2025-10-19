import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, ArrowLeft, Plus } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ItemCard from '../components/ItemCard';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { useDebounce } from '../hooks/useDebounce';

const QuotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);
  const currentFolderId = searchParams.get('folder');
  
  // Get folders
  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
    staleTime: 10 * 60 * 1000,
  });

  // Get current folder info
  const currentFolder = folders?.find(f => f.id === currentFolderId);
  
  // Get subfolders of current folder
  const subfolders = (folders || []).filter(f => 
    f.parent_id === currentFolderId && 
    (f.content_types.length === 0 || f.content_types.includes('quote'))
  );

  // Get quotes in current folder
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'quote', currentFolderId, debouncedSearchQuery],
    queryFn: () => api.getItems({ 
      type: 'quote', 
      folder: currentFolderId || undefined,
      q: debouncedSearchQuery || undefined,
      limit: 30 // Reduce for mobile
    }),
    staleTime: 10 * 60 * 1000, // Longer cache
    retry: 2,
  });

  const handleFolderClick = (folderId: string) => {
    setSearchParams({ folder: folderId });
    setSearchQuery(''); // Clear search when navigating
  };

  const handleBackClick = () => {
    if (currentFolder?.parent_id) {
      setSearchParams({ folder: currentFolder.parent_id });
    } else {
      setSearchParams({});
    }
    setSearchQuery('');
  };

  const handleRootClick = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-800 rounded-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
          Ошибка загрузки цитат
        </div>
      </div>
    );
  }

  const items = data?.data.items || [];

  // Build breadcrumb path
  const buildBreadcrumb = () => {
    if (!currentFolder) return [];
    if (!folders) return [];
    
    const path = [];
    let folder = currentFolder;
    
    while (folder) {
      path.unshift(folder);
      folder = folders.find(f => f.id === folder.parent_id);
    }
    
    return path;
  };

  const breadcrumb = buildBreadcrumb();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header with quick add button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">
          {currentFolder ? currentFolder.name : 'Цитаты'}
        </h1>
        <Link
          to={`/admin/upload?type=quote${currentFolderId ? `&folder=${currentFolderId}` : ''}`}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Цитата</span>
        </Link>
      </div>
      
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center space-x-2 text-sm mb-4">
          <button
            onClick={handleRootClick}
            className={`hover:text-emerald-500 transition-colors ${
              !currentFolderId ? 'text-emerald-500' : 'text-gray-400'
            }`}
          >
            Quotes
          </button>
          
          {breadcrumb.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span className="text-gray-600">/</span>
              <button
                onClick={() => handleFolderClick(folder.id)}
                className={`hover:text-emerald-500 transition-colors ${
                  index === breadcrumb.length - 1 ? 'text-emerald-500' : 'text-gray-400'
                }`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Back button */}
      {currentFolderId && (
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-gray-400 hover:text-emerald-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>
      )}

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Поиск по цитатам..."
        />
      </div>

      {/* Subfolders */}
      {subfolders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Папки</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {subfolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-left transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Folder className="w-6 h-6 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
                  <div>
                    <div className="text-gray-100 font-medium">{folder.name}</div>
                    <div className="text-gray-500 text-xs">Папка</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      {debouncedSearchQuery && (
        <div className="mb-4 text-sm text-gray-400">
          Найдено: {items.length} цитат
          {searchQuery !== debouncedSearchQuery && (
            <span className="ml-2 text-yellow-500">Поиск...</span>
          )}
        </div>
      )}

      {/* Quotes */}
      {items.length === 0 && subfolders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">
            {debouncedSearchQuery ? 'Ничего не найдено' : 'Пока нет цитат'}
          </div>
          {!debouncedSearchQuery && (
            <p className="text-gray-600 text-sm">
              {currentFolder 
                ? `Добавьте цитаты в папку "${currentFolder.name}" через админку`
                : 'Добавьте первую цитату через админку'
              }
            </p>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            {debouncedSearchQuery ? 'Цитат не найдено' : 'В этой папке пока нет цитат'}
          </div>
        </div>
      ) : (
        <div>
          {items.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                {debouncedSearchQuery ? 'Результаты поиска' : 'Цитаты'}
              </h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuotesPage;