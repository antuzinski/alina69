import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Edit, Trash2, Eye, Pin, PinOff, FileText, Send } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { ItemType } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';

const ManagePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);
  const [typeFilter, setTypeFilter] = useState<ItemType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['manage-items', debouncedSearchQuery, typeFilter],
    queryFn: () => api.getItems({ 
      q: debouncedSearchQuery || undefined,
      type: typeFilter || undefined,
      limit: 500 
    }),
    staleTime: 2 * 60 * 1000,
  });

  const deleteItemMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-items'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      api.updateItem(id, { is_pinned: !isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-items'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const publishDraftMutation = useMutation({
    mutationFn: (id: string) => api.updateItem(id, { is_draft: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-items'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const handleDeleteItem = async (id: string, title: string) => {
    const confirmText = title || 'этот элемент';
    if (window.confirm(`Удалить "${confirmText}"? Это действие нельзя отменить.`)) {
      await deleteItemMutation.mutateAsync(id);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await togglePinMutation.mutateAsync({ id, isPinned });
  };

  const handlePublishDraft = async (id: string) => {
    await publishDraftMutation.mutateAsync(id);
  };

  const items = data?.data.items || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeLabel = (type: ItemType) => {
    switch (type) {
      case 'text': return 'Текст';
      case 'image': return 'Фото';
      case 'quote': return 'Цитата';
      default: return type;
    }
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'text': return 'bg-blue-600';
      case 'image': return 'bg-purple-600';
      case 'quote': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2 text-gray-400 hover:text-emerald-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Админка</span>
            </button>
            
            <h1 className="text-xl font-semibold">Управление</h1>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || typeFilter
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
          
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск для управления..."
            className="mb-3"
          />
          
          {/* Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-800 rounded-lg">
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
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
            Ошибка загрузки элементов
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-400">
              Найдено: {items.length} элементов
              {typeFilter && ` (тип: ${getTypeLabel(typeFilter)})`}
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">
                  {searchQuery ? 'Ничего не найдено' : 'Пока нет элементов'}
                </div>
                {!searchQuery && (
                  <p className="text-gray-600 text-sm">
                    Создайте первый элемент через Upload
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getTypeColor(item.type)}`}>
                            {getTypeLabel(item.type)}
                          </span>
                          
                          {item.is_draft && (
                            <span className="px-2 py-1 rounded text-xs font-medium text-blue-400 bg-blue-900/50 border border-blue-700/50 flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>ЧЕРНОВИК</span>
                            </span>
                          )}
                          
                          {item.is_pinned && (
                            <Pin className="w-4 h-4 text-emerald-500" />
                          )}
                          
                          {item.folder && (
                            <span className="text-xs text-gray-500">
                              📁 {item.folder.name}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-gray-100 font-medium mb-1 truncate">
                          {item.title || 'Без заголовка'}
                        </h3>
                        
                        {item.preview && (
                          <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                            {item.preview}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(item.created_at)}</span>
                          {item.tags.length > 0 && (
                            <span>{item.tags.map(tag => `#${tag}`).join(' ')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {item.is_draft && (
                          <button
                            onClick={() => handlePublishDraft(item.id)}
                            disabled={publishDraftMutation.isPending}
                            className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                            title="Опубликовать черновик"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => navigate(`/item/${item.id}`)}
                          className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/admin/edit/${item.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {!item.is_draft && (
                          <button
                            onClick={() => handleTogglePin(item.id, item.is_pinned)}
                            disabled={togglePinMutation.isPending}
                            className={`p-2 transition-colors ${
                              item.is_pinned
                                ? 'text-emerald-500 hover:text-emerald-400'
                                : 'text-gray-400 hover:text-emerald-500'
                            }`}
                            title={item.is_pinned ? 'Открепить' : 'Закрепить'}
                          >
                            {item.is_pinned ? (
                              <PinOff className="w-4 h-4" />
                            ) : (
                              <Pin className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteItem(item.id, item.title || '')}
                          disabled={deleteItemMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Error Messages */}
        {deleteItemMutation.error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
            Ошибка удаления: {(deleteItemMutation.error as Error).message}
          </div>
        )}
        
        {togglePinMutation.error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
            Ошибка изменения закрепления: {(togglePinMutation.error as Error).message}
          </div>
        )}
        
        {publishDraftMutation.error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
            Ошибка публикации: {(publishDraftMutation.error as Error).message}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagePage;