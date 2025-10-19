import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ItemCard from '../components/ItemCard';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { ItemType } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500); // 1.5s delay
  const [typeFilter, setTypeFilter] = useState<ItemType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Update URL when search changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      setSearchParams({ q: debouncedSearchQuery });
    } else {
      setSearchParams({});
    }
  }, [debouncedSearchQuery, setSearchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', debouncedSearchQuery, typeFilter],
    queryFn: () => api.getItems({ 
      q: debouncedSearchQuery || undefined,
      type: typeFilter || undefined,
      limit: 50 
    }),
    enabled: !!debouncedSearchQuery,
    staleTime: 2 * 60 * 1000,
  });

  const items = data?.data.items || [];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-100 mb-3">Поиск</h1>
          
          <div className="flex items-center space-x-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Поиск по всему каталогу..."
              className="flex-1"
            />
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-lg transition-colors ${
                showFilters || typeFilter
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Тип:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTypeFilter('')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      typeFilter === ''
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setTypeFilter('text')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      typeFilter === 'text'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Тексты
                  </button>
                  <button
                    onClick={() => setTypeFilter('image')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      typeFilter === 'image'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Фото
                  </button>
                  <button
                    onClick={() => setTypeFilter('quote')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      typeFilter === 'quote'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Цитаты
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        {!debouncedSearchQuery ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">Введите запрос для поиска</div>
            <p className="text-gray-600 text-sm">
              Поиск работает по заголовкам, тексту и тегам
            </p>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
            Ошибка поиска
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-400">
              Найдено: {items.length} результатов
              {typeFilter && ` (тип: ${typeFilter})`}
              {searchQuery !== debouncedSearchQuery && (
                <span className="ml-2 text-yellow-500">Поиск...</span>
              )}
            </div>

            {/* Results */}
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">Ничего не найдено</div>
                <p className="text-gray-600 text-sm">
                  Попробуйте изменить запрос или убрать фильтры
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SearchPage;