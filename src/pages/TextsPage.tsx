import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ItemCard from '../components/ItemCard';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { useDebounce } from '../hooks/useDebounce';

const TextsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);
  const [currentPage, setCurrentPage] = useState(1);
  const TEXTS_PER_PAGE = 20;
  
  // Get texts for current page
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'text', 'page', currentPage, debouncedSearchQuery],
    queryFn: async () => {
      if (debouncedSearchQuery) {
        // For search, get all results without pagination
        return api.getItems({
          type: 'text', 
          q: debouncedSearchQuery,
          limit: 500
        });
      } else {
        // For normal browsing, get specific page
        const offset = (currentPage - 1) * TEXTS_PER_PAGE;
        return api.getItems({
          type: 'text',
          limit: TEXTS_PER_PAGE + offset + TEXTS_PER_PAGE, // Get more to simulate offset
        }).then(response => {
          // Simulate offset by slicing the results
          const allItems = response.data.items || [];
          const pageItems = allItems.slice(offset, offset + TEXTS_PER_PAGE);
          
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

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const items = data?.data.items || [];
  const totalCount = data?.meta?.count || 0;
  const totalPages = Math.ceil(totalCount / TEXTS_PER_PAGE);
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
    const maxVisible = 7; // Show max 7 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 4) {
        // Show: 1 2 3 4 5 ... last
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 6) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 3) {
        // Show: 1 ... last-4 last-3 last-2 last-1 last
        pages.push(1);
        if (totalPages > 6) {
          pages.push('...');
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show: 1 ... current-1 current current+1 ... last
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
          Ошибка загрузки текстов
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header with quick add button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Тексты</h1>
        <Link
          to="/admin/upload?type=text"
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Текст</span>
        </Link>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Поиск по текстам..."
        />
      </div>

      {/* Results info */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
        <div>
          {hasSearch ? (
            <>
              Найдено: {items.length} из {totalCount} текстов
              {searchQuery !== debouncedSearchQuery && (
                <span className="ml-2 text-yellow-500">Поиск...</span>
              )}
            </>
          ) : (
            <>
              Страница {currentPage} из {totalPages} 
              <span className="ml-2">({totalCount} текстов всего)</span>
            </>
          )}
        </div>
        
        {!hasSearch && totalPages > 1 && (
          <div className="text-xs text-gray-500">
            Показано {Math.min(TEXTS_PER_PAGE, items.length)} из {TEXTS_PER_PAGE}
          </div>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">
            {debouncedSearchQuery ? 'Ничего не найдено' : 'Пока нет текстов'}
          </div>
          {!debouncedSearchQuery && (
            <p className="text-gray-600 text-sm">
              Добавьте первый текст через админку
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

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

export default TextsPage;