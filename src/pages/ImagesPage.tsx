import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, ArrowLeft, Search, Plus, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ImageWithFallback from '../components/ImageWithFallback';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { useDebounce } from '../hooks/useDebounce';

const ImagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);
  const currentFolderId = searchParams.get('folder');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Get folders
  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
    staleTime: 10 * 60 * 1000,
  });

  // Get current folder info
  const currentFolder = folders?.find(f => f.id === currentFolderId);
  
  // Get subfolders of current folder
  const subfolders = folders?.filter(f => 
    f.parent_id === currentFolderId && 
    (f.content_types.length === 0 || f.content_types.includes('image'))
  ) || [];

  // Get images in current folder
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'image', currentFolderId, debouncedSearchQuery, currentPage],
    queryFn: async () => {
      if (debouncedSearchQuery) {
        // For search, get all results without pagination
        return api.getItems({
          type: 'image',
          folder: currentFolderId || undefined,
          q: debouncedSearchQuery,
          limit: 500
        });
      } else {
        // For normal browsing, get specific page
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        return api.getItems({
          type: 'image',
          folder: currentFolderId || undefined,
          limit: ITEMS_PER_PAGE + offset + ITEMS_PER_PAGE,
        }).then(response => {
          // Simulate offset by slicing the results
          const allItems = response.data.items || [];
          const pageItems = allItems.slice(offset, offset + ITEMS_PER_PAGE);

          return {
            ...response,
            data: {
              ...response.data,
              items: pageItems
            }
          };
        });
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Reset to page 1 when search or folder changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, currentFolderId]);

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
          <div className="grid grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
          Ошибка загрузки изображений
        </div>
      </div>
    );
  }

  const items = data?.data.items || [];
  const totalCount = data?.meta?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasSearch = !!debouncedSearchQuery;

  // Pagination helpers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 6) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        if (totalPages > 6) {
          pages.push('...');
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

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
      {/* Navigation Header */}
      <div className="mb-6">
        {/* Header with quick add button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-100 flex items-center space-x-2">
            <span>{currentFolder ? currentFolder.name : 'Медиа'}</span>
            <span className="text-sm text-gray-500 font-normal">(фото, GIF, видео)</span>
          </h1>
          <div className="flex items-center space-x-2">
            <Link
              to={`/admin/upload?type=image${currentFolderId ? `&folder=${currentFolderId}` : ''}`}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Медиа</span>
            </Link>
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={handleRootClick}
            className={`hover:text-emerald-500 transition-colors ${
              !currentFolderId ? 'text-emerald-500' : 'text-gray-400'
            }`}
          >
            Media
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
            placeholder="Поиск по медиа-файлам..."
          />
        </div>
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

      {/* Results info */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
        <div>
          {hasSearch ? (
            <>
              Найдено: {items.length} из {totalCount} медиа-файлов
              {searchQuery !== debouncedSearchQuery && (
                <span className="ml-2 text-yellow-500">Поиск...</span>
              )}
            </>
          ) : (
            <>
              Страница {currentPage} из {totalPages}
              <span className="ml-2">({totalCount} медиа-файлов всего)</span>
            </>
          )}
        </div>

        {!hasSearch && totalPages > 1 && (
          <div className="text-xs text-gray-500">
            Показано {Math.min(ITEMS_PER_PAGE, items.length)} из {ITEMS_PER_PAGE}
          </div>
        )}
      </div>

      {/* Images Grid */}
      {items.length === 0 && subfolders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">
            {debouncedSearchQuery ? 'Ничего не найдено' : 'Пока нет медиа-файлов'}
          </div>
          {!debouncedSearchQuery && (
            <p className="text-gray-600 text-sm">
              {currentFolder 
                ? `Добавьте медиа-файлы в папку "${currentFolder.name}" через админку`
                : 'Добавьте первый медиа-файл через админку'
              }
            </p>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            {debouncedSearchQuery ? 'Медиа-файлов не найдено' : 'В этой папке пока нет медиа-файлов'}
          </div>
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                {debouncedSearchQuery ? 'Результаты поиска' : 'Медиа-файлы'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/item/${item.id}`}
                    className="group aspect-square bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all relative"
                  >
                    {item.image_url ? (
                      <ImageWithFallback
                        src={item.image_url}
                        alt={item.title || 'Image'}
                        mediaType={item.media_type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-sm">No Image</span>
                      </div>
                    )}

                    {/* Overlay with title */}
                    {item.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-sm font-medium truncate">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Media type indicator */}
                    {item.media_type === 'video' && (
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>VIDEO</span>
                      </div>
                    )}

                    {item.media_type === 'gif' && (
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        GIF
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Pagination - only show for normal browsing, not search */}
          {!hasSearch && totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Назад</span>
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <button
                        onClick={() => goToPage(page as number)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white transition-colors"
              >
                <span className="hidden sm:inline">Вперед</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Page info for mobile */}
          {!hasSearch && totalPages > 1 && (
            <div className="text-center mt-4 text-xs text-gray-500">
              Страница {currentPage} из {totalPages}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImagesPage;