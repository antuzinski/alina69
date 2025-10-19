import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import MediaDisplay from '../components/MediaDisplay';
import MarkdownRenderer from '../components/MarkdownRenderer';
import MarkdownHelp from '../components/MarkdownHelp';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { ItemType, MediaType } from '../lib/supabase';

const EditItemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('image');
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  // Get item data
  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => api.getItem(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Get folders for selection
  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
    staleTime: 10 * 60 * 1000,
  });

  // Initialize form when item loads
  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setBody(item.body || '');
      setTags(item.tags.join(', '));
      setSelectedFolder(item.folder_id || '');
      setImageUrl(item.image_url || '');
      setIsPinned(item.is_pinned);
      setSelectedMediaType(item.media_type || 'image');
    }
  }, [item]);

  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      api.updateItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/admin/manage');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/admin/manage');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const updates = {
      title: title.trim() || undefined,
      body: body.trim() || undefined,
      tags: tagsArray,
      folder_id: selectedFolder || undefined,
      image_url: imageUrl.trim() || undefined,
      is_pinned: isPinned,
      media_type: selectedMediaType,
      is_draft: false, // Ensure item is published when saved
    };

    // Generate preview for text items
    if (item.type === 'text' && body) {
      const preview = body.substring(0, 200).trim();
      updates.preview = body.length > 200 ? preview + '...' : preview;
    }

    await updateItemMutation.mutateAsync({ id: item.id, updates });
  };

  const handleDelete = async () => {
    if (!item) return;
    
    const confirmText = item.title || 'этот элемент';
    if (window.confirm(`Удалить "${confirmText}"? Это действие нельзя отменить.`)) {
      await deleteItemMutation.mutateAsync(item.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="h-12 bg-gray-800 rounded"></div>
            <div className="h-32 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
        <button
          onClick={() => navigate('/admin/manage')}
          className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
          Элемент не найден
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: ItemType) => {
    switch (type) {
      case 'text': return 'Текст';
      case 'image': return 'Изображение';
      case 'quote': return 'Цитата';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/admin/manage')}
            className="flex items-center space-x-2 text-gray-400 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Управление</span>
          </button>
          
          <h1 className="text-lg font-medium">
            Редактирование {getTypeLabel(item.type)}
          </h1>
          
          <button
            onClick={handleDelete}
            disabled={deleteItemMutation.isPending}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Папка
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Без папки</option>
              {folders?.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image URL (for images) */}
          {item.type === 'image' && (
            <div>
              {/* Media Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Тип медиа
                </label>
                <div className="flex space-x-3">
                  {(['image', 'gif', 'video'] as MediaType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedMediaType(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedMediaType === type
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {type === 'image' && '🖼️ Фото'}
                      {type === 'gif' && '🎞️ GIF'}
                      {type === 'video' && '🎬 Видео'}
                    </button>
                  ))}
                </div>
              </div>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL {selectedMediaType === 'video' ? 'видео' : selectedMediaType === 'gif' ? 'GIF' : 'изображения'}
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={`https://example.com/${selectedMediaType === 'video' ? 'video.mp4' : selectedMediaType === 'gif' ? 'animation.gif' : 'image.jpg'}`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              
              {imageUrl && (
                <div className="mt-3">
                  <MediaDisplay
                    src={imageUrl}
                    alt="Preview"
                    mediaType={selectedMediaType}
                    className="max-w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {item.type === 'quote' ? 'Автор/Источник' : 'Заголовок'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                item.type === 'quote' 
                  ? 'Автор цитаты или источник'
                  : 'Заголовок'
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                {item.type === 'text' && 'Текст'}
                {item.type === 'image' && 'Описание'}
                {item.type === 'quote' && 'Цитата'}
              </label>
              
              {item.type === 'text' && (
                <div className="flex items-center space-x-3">
                  <MarkdownHelp />
                  <button
                    type="button"
                    onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                    className={`text-sm transition-colors ${
                      showMarkdownPreview 
                        ? 'text-emerald-500' 
                        : 'text-gray-400 hover:text-emerald-500'
                    }`}
                  >
                    {showMarkdownPreview ? 'Редактор' : 'Превью'}
                  </button>
                </div>
              )}
            </div>
            
            {item.type === 'text' && showMarkdownPreview ? (
              <div className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 min-h-[200px]">
                {body ? (
                  <MarkdownRenderer content={body} />
                ) : (
                  <div className="text-gray-500 italic">Введите текст для предварительного просмотра...</div>
                )}
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  item.type === 'text' 
                    ? 'Основной текст... (поддерживается Markdown: **жирный**, *курсив*, # заголовки)'
                    : item.type === 'image'
                    ? 'Описание изображения...'
                    : 'Текст цитаты...'
                }
                rows={item.type === 'text' ? 12 : 6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-vertical"
              />
            )}
            
            {/* Markdown tips for text type */}
            {item.type === 'text' && !showMarkdownPreview && (
              <div className="mt-2 text-xs text-gray-500">
                💡 Поддерживается Markdown: <code className="bg-gray-700 px-1 rounded">**жирный**</code>, <code className="bg-gray-700 px-1 rounded">*курсив*</code>, <code className="bg-gray-700 px-1 rounded"># заголовки</code>, <code className="bg-gray-700 px-1 rounded">&gt; цитаты</code>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Теги
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="тег1, тег2, тег3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Разделяйте теги запятыми
            </p>
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-gray-800 border-gray-700 rounded focus:ring-emerald-500 focus:ring-2"
            />
            <label htmlFor="isPinned" className="text-sm font-medium text-gray-300">
              Закрепить элемент
            </label>
          </div>

          {/* Submit */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={updateItemMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {updateItemMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Сохранить</span>
                </>
              )}
            </button>
          </div>

          {/* Error Messages */}
          {updateItemMutation.error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              Ошибка сохранения: {(updateItemMutation.error as Error).message}
            </div>
          )}
          
          {deleteItemMutation.error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              Ошибка удаления: {(deleteItemMutation.error as Error).message}
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default EditItemPage;