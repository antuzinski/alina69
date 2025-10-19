import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Plus, Image as ImageIcon, Save, Trash2, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import MarkdownRenderer from '../components/MarkdownRenderer';
import MarkdownHelp from '../components/MarkdownHelp';
import { ItemType, MediaType, supabase } from '../lib/supabase';
import { storage } from '../lib/storage';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [selectedType, setSelectedType] = useState<ItemType>(
    (searchParams.get('type') as ItemType) || 'text'
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('image');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{[key: string]: string}>({});
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  // Get folder from URL params
  useEffect(() => {
    const folderParam = searchParams.get('folder');
    if (folderParam) {
      setSelectedFolder(folderParam);
    }
  }, [searchParams]);
  
  // Get folders for selection
  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
    staleTime: 10 * 60 * 1000,
  });

  // Auto-save draft functionality
  const autoSaveDraft = async () => {
    // Only auto-save drafts for text and quote types
    if (selectedType === 'image') return;
    if (!title.trim() && !body.trim()) return;
    
    // Don't auto-save if we're currently submitting
    if (isSubmitting) return;
    
    // Don't auto-save if we already have a published item
    if (currentDraftId) {
      try {
        const existingItem = await api.getItem(currentDraftId);
        if (existingItem && !existingItem.is_draft) {
          // Item is already published, clear draft ID
          setCurrentDraftId(null);
          return;
        }
      } catch (error) {
        // Item doesn't exist anymore, clear draft ID
        setCurrentDraftId(null);
        return;
      }
    }

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const itemData = {
      type: selectedType,
      title: title.trim() || undefined,
      body: body.trim() || undefined,
      tags: tagsArray,
      folder_id: selectedFolder || undefined,
      image_url: imageUrl?.trim() || undefined,
      is_draft: true,
    };

    // Generate preview for text items
    if (selectedType === 'text' && body.trim()) {
      const preview = body.trim().substring(0, 200);
      itemData.preview = body.trim().length > 200 ? preview + '...' : preview;
    }

    try {
      if (currentDraftId) {
        // Update existing draft
        await api.updateItem(currentDraftId, itemData);
        console.log('[DRAFT] Updated existing draft:', currentDraftId);
      } else {
        // Create new draft
        const result = await api.createItem(itemData);
        if (result) {
          setCurrentDraftId(result.id);
          console.log('[DRAFT] Created new draft:', result.id);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['items'] });
    } catch (error) {
      console.error('[DRAFT] Auto-save failed:', error);
    }
  };

  // Auto-save when form data changes
  useEffect(() => {
    // Don't auto-save for images
    if (selectedType === 'image') return;
    
    // Don't auto-save if we're submitting
    if (isSubmitting) return;
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    if (title.trim() || body.trim()) {
      const timeoutId = setTimeout(() => {
        autoSaveDraft();
      }, 2000); // Save after 2 seconds of inactivity

      setAutoSaveTimeout(timeoutId);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [title, body, tags, selectedFolder, selectedType, imageUrl, isSubmitting, currentDraftId]);

  const createItemMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      // Clear draft state after successful creation
      setCurrentDraftId(null);
      navigate('/admin');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      api.updateItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      // Clear draft state after successful update
      setCurrentDraftId(null);
      navigate('/admin');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('[UPLOAD] Starting upload process');
      
      // Handle bulk upload for images
      if (selectedType === 'image' && imageFiles.length > 0) {
        console.log('[UPLOAD] Starting bulk upload of', imageFiles.length, 'files');
        setUploadProgress(`Загрузка ${imageFiles.length} изображений...`);
        
        // Clear any existing draft when doing bulk upload
        if (currentDraftId) {
          try {
            await api.deleteItem(currentDraftId);
            setCurrentDraftId(null);
          } catch (error) {
            console.error('[UPLOAD] Error deleting draft before bulk upload:', error);
          }
        }
        
        const tagsArray = tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileName = file.name;
          
          try {
            setBulkUploadProgress(prev => ({
              ...prev,
              [fileName]: 'Загрузка...'
            }));
            
            setUploadProgress(`Загрузка ${i + 1} из ${imageFiles.length}: ${fileName}`);
            
            // Upload image
            const result = await storage.uploadMedia(file, { 
              folder: 'uploads',
              itemId: undefined // Don't create item-specific folder for bulk upload
            });
            
            setBulkUploadProgress(prev => ({
              ...prev,
              [fileName]: 'Сохранение...'
            }));
            
            // Create item
            const itemData = {
              type: selectedType,
              title: title.trim() || fileName.replace(/\.[^/.]+$/, ''), // Use filename as title if no title provided
              body: body.trim() || undefined,
              tags: tagsArray,
              folder_id: selectedFolder || undefined,
              image_url: result.path, // Store path, not URL
              media_type: result.mediaType,
              is_draft: false,
            };

            const createdItem = await api.createItem(itemData);
            if (!createdItem) {
              throw new Error('Failed to create item');
            }
            
            setBulkUploadProgress(prev => ({
              ...prev,
              [fileName]: 'Готово ✓'
            }));
            
            successCount++;
          } catch (error) {
            console.error('[UPLOAD] Error uploading file:', fileName, error);
            setBulkUploadProgress(prev => ({
              ...prev,
              [fileName]: `Ошибка: ${error instanceof Error ? error.message : 'Unknown error'} ✗`
            }));
            errorCount++;
          }
        }
        
        setUploadProgress(`Завершено: ${successCount} успешно, ${errorCount} ошибок`);
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['items'] });
        
        // Clear files after upload
        setTimeout(() => {
          setImageFiles([]);
          setBulkUploadProgress({});
          if (errorCount === 0) {
            navigate('/admin');
          }
        }, 2000);
        
        return;
      }
      
      // Handle single upload (existing logic)
      let finalImageUrl = imageUrl;
      
      setUploadProgress('Сохранение...');
      
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const itemData = {
        type: selectedType,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        tags: tagsArray,
        folder_id: selectedFolder || undefined,
        image_url: finalImageUrl?.trim() || undefined,
        is_draft: false, // Explicitly set to false when publishing
        media_type: selectedMediaType,
      };

      // Generate preview for text items
      if (selectedType === 'text' && body.trim()) {
        const preview = body.trim().substring(0, 200);
        itemData.preview = body.trim().length > 200 ? preview + '...' : preview;
      }

      console.log('[UPLOAD] Item data prepared:', itemData);
      
      if (currentDraftId) {
        // Update existing draft and publish it
        const result = await updateItemMutation.mutateAsync({ 
          id: currentDraftId, 
          updates: itemData 
        });
        console.log('[UPLOAD] Draft published successfully:', result);
      } else {
        // Create new item
        const result = await createItemMutation.mutateAsync(itemData);
        console.log('[UPLOAD] Item created successfully:', result);
      }
      
      // Clear form and draft state after successful submission
      setTitle('');
      setBody('');
      setTags('');
      setImageUrl('');
      setCurrentDraftId(null);
      
    } catch (error) {
      console.error('[UPLOAD] Error creating item:', error);
      // Error will be shown by the mutation error state
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleClearDraft = async () => {
    if (window.confirm('Удалить черновик? Все данные будут потеряны.')) {
      if (currentDraftId) {
        try {
          await api.deleteItem(currentDraftId);
          queryClient.invalidateQueries({ queryKey: ['items'] });
          setCurrentDraftId(null);
        } catch (error) {
          console.error('[DRAFT] Error deleting draft:', error);
        }
      }
      setTitle('');
      setBody('');
      setTags('');
      setSelectedFolder('');
      setImageUrl('');
    }
  };

  const generatePreview = () => {
    if (selectedType === 'text' && body) {
      const preview = body.substring(0, 200).trim();
      return body.length > 200 ? preview + '...' : preview;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-gray-400 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Админка</span>
          </button>
          
          <h1 className="text-xl font-semibold">Загрузка</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        {/* Draft Status */}
        {currentDraftId && (
          <div className="mb-4 bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-blue-300 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Редактируется черновик</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Тип контента
            </label>
            <div className="flex space-x-3">
              {(['text', 'image', 'quote'] as ItemType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {type === 'text' && 'Текст'}
                  {type === 'image' && 'Изображение'}
                  {type === 'quote' && 'Цитата'}
                </button>
              ))}
            </div>
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Папка (опционально)
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
          {selectedType === 'image' && (
            <div>
              <div className="space-y-4">
                {/* Media Type Selection */}
                <div>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Загрузка файлов
                  </label>
                  <input
                    type="file"
                    accept={
                      selectedMediaType === 'image' ? 'image/jpeg,image/jpg,image/png,image/webp' :
                      selectedMediaType === 'gif' ? 'image/gif' :
                      'video/mp4,video/webm,video/quicktime,video/mov,video/x-msvideo,video/3gpp,video/3gpp2'
                    }
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        setImageFiles(files);
                        setImageUrl(''); // Clear URL
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 focus:outline-none focus:border-emerald-500"
                  />
                  {imageFiles.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-2">
                        Выбрано {selectedMediaType === 'video' ? 'видео' : selectedMediaType === 'gif' ? 'GIF' : 'файлов'}: {imageFiles.length}
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {imageFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-xs text-gray-500 bg-gray-800 rounded px-2 py-1">
                            <span className="truncate flex-1">{file.name}</span>
                            <div className="flex items-center space-x-2 ml-2">
                              <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                              {bulkUploadProgress[file.name] && (
                                <span className={`text-xs ${
                                  bulkUploadProgress[file.name].includes('✓') ? 'text-green-500' :
                                  bulkUploadProgress[file.name].includes('✗') ? 'text-red-500' :
                                  'text-yellow-500'
                                }`}>
                                  {bulkUploadProgress[file.name]}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setImageFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="text-red-500 hover:text-red-400"
                                disabled={isSubmitting}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center text-gray-500 text-sm">или</div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL {selectedMediaType === 'video' ? 'видео' : selectedMediaType === 'gif' ? 'GIF' : 'изображения'}
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageFiles([]); // Clear bulk files
                    }}
                    placeholder={`https://example.com/${selectedMediaType === 'video' ? 'video.mp4' : selectedMediaType === 'gif' ? 'animation.gif' : 'image.jpg'}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                {imageUrl && imageFiles.length === 0 && (
                  <div className="mt-3">
                    {selectedMediaType === 'video' ? (
                      <video
                        src={imageUrl}
                        className="max-w-full h-48 object-cover rounded-lg"
                        controls
                        muted
                        preload="metadata"
                        onError={() => console.log('Video preview failed to load')}
                      />
                    ) : (
                      <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-lg"
                      onError={() => console.log('Image preview failed to load')}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {selectedType === 'quote' ? 'Автор/Источник' : 'Заголовок'}
              {selectedType === 'quote' && ' (опционально)'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                selectedType === 'quote' 
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
                {selectedType === 'text' && 'Текст *'}
                {selectedType === 'image' && 'Описание'}
                {selectedType === 'quote' && 'Цитата *'}
              </label>
              
              {selectedType === 'text' && (
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
            
            {selectedType === 'text' && showMarkdownPreview ? (
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
                  selectedType === 'text' 
                    ? 'Основной текст... (поддерживается Markdown: **жирный**, *курсив*, # заголовки)'
                    : selectedType === 'image'
                    ? 'Описание изображения...'
                    : 'Текст цитаты...'
                }
                rows={selectedType === 'text' ? 10 : 4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-vertical"
                required={selectedType === 'text' || selectedType === 'quote'}
              />
            )}
            
            {/* Markdown tips for text type */}
            {selectedType === 'text' && !showMarkdownPreview && (
              <div className="mt-2 text-xs text-gray-500">
                💡 Поддерживается Markdown: <code className="bg-gray-700 px-1 rounded">**жирный**</code>, <code className="bg-gray-700 px-1 rounded">*курсив*</code>, <code className="bg-gray-700 px-1 rounded"># заголовки</code>, <code className="bg-gray-700 px-1 rounded">&gt; цитаты</code>
              </div>
            )}
            
            {/* Old preview for text - now shows markdown rendered */}
            {selectedType === 'text' && body && !showMarkdownPreview && (
              <div className="mt-2 p-3 bg-gray-800 rounded border-l-4 border-emerald-500">
                <p className="text-xs text-gray-400 mb-1">Превью (первые 200 символов):</p>
                <div className="text-sm">
                  <MarkdownRenderer 
                    content={body.substring(0, 200) + (body.length > 200 ? '...' : '')}
                    isPreview={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Теги (через запятую)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="тег1, тег2, тег3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-3">
              {currentDraftId && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Удалить черновик</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {uploadProgress && (
                <span className="text-sm text-gray-400">{uploadProgress}</span>
              )}
              
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (selectedType === 'text' && !body.trim()) ||
                  (selectedType === 'quote' && !body.trim()) ||
                  (selectedType === 'image' && !imageUrl.trim() && imageFiles.length === 0)
                }
                className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Загрузка...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{currentDraftId ? 'Опубликовать' : 'Создать'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {(createItemMutation.error || updateItemMutation.error) && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              Ошибка: {(createItemMutation.error || updateItemMutation.error)?.message}
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default UploadPage;
