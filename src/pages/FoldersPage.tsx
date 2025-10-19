import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Folder, Edit2, Trash2, FolderOpen, FileText, Image, Quote, ChevronRight, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { Folder as FolderType } from '../lib/supabase';

const FoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTypes, setNewFolderTypes] = useState<string[]>([]);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editParent, setEditParent] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editTypes, setEditTypes] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const { data: folders, isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
    staleTime: 5 * 60 * 1000,
  });

  const createFolderMutation = useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setShowCreateForm(false);
      setSelectedParent('');
      setNewFolderName('');
      setNewFolderTypes([]);
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, name, content_types, parent_id }: { id: string; name: string; content_types: string[]; parent_id?: string }) => 
      api.updateFolder(id, { name, content_types, parent_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setEditingFolder(null);
      setEditParent('');
      setEditName('');
      setEditTypes([]);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  // Build folder tree structure
  const buildFolderTree = (folders: FolderType[]): FolderType[] => {
    const folderMap = new Map<string, FolderType & { children: FolderType[] }>();
    
    // Initialize all folders with children array
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });
    
    // Build tree structure
    const rootFolders: (FolderType & { children: FolderType[] })[] = [];
    
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderWithChildren);
        } else {
          // Parent not found, treat as root
          rootFolders.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });
    
    // Sort folders: root level alphabetically, then children alphabetically
    const sortFolders = (folders: (FolderType & { children: FolderType[] })[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(folder => {
        if (folder.children.length > 0) {
          sortFolders(folder.children);
        }
      });
    };
    
    sortFolders(rootFolders);
    return rootFolders;
  };

  const toggleExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    try {
      console.log('[FOLDERS] Creating folder:', newFolderName.trim());
      const result = await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        parent_id: selectedParent || undefined,
        content_types: newFolderTypes,
      });
      console.log('[FOLDERS] Folder created successfully:', result);
    } catch (error) {
      console.error('[FOLDERS] Error creating folder:', error);
    }
  };

  const handleEditFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingFolder) return;
    
    await updateFolderMutation.mutateAsync({
      id: editingFolder,
      name: editName.trim(), 
      content_types: editTypes,
      parent_id: editParent || undefined,
    });
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (window.confirm(`Удалить папку "${name}"? Элементы в ней останутся без папки.`)) {
      await deleteFolderMutation.mutateAsync(id);
    }
  };

  // Get available parent folders (excluding current folder and its children)
  const getAvailableParents = (excludeId?: string) => {
    if (!folders) return [];
    
    return folders.filter(folder => {
      // Exclude self
      if (folder.id === excludeId) return false;
      
      // Exclude children of current folder (prevent circular references)
      if (excludeId && folder.path?.startsWith(folders.find(f => f.id === excludeId)?.path + '/')) {
        return false;
      }
      
      // Exclude folders at max depth (level 4, since max is 5)
      if (folder.level >= 4) return false;
      
      return true;
    });
  };

  const toggleContentType = (type: string, isEditing = false) => {
    if (isEditing) {
      setEditTypes(prev => 
        prev.includes(type) 
          ? prev.filter(t => t !== type)
          : [...prev, type]
      );
    } else {
      setNewFolderTypes(prev => 
        prev.includes(type) 
          ? prev.filter(t => t !== type)
          : [...prev, type]
      );
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'quote': return <Quote className="w-4 h-4" />;
      default: return null;
    }
  };

  // Render folder tree recursively
  const renderFolderTree = (folders: (FolderType & { children: FolderType[] })[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id}>
        {editingFolder === folder.id ? (
          <div className="bg-gray-700 rounded-lg p-4 mb-2" style={{ marginLeft: `${level * 24}px` }}>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Редактирование папки</h4>
            <form onSubmit={handleEditFolder} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Родительская папка:</label>
                <select
                  value={editParent}
                  onChange={(e) => setEditParent(e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">Корневая папка</option>
                  {getAvailableParents(folder.id).map(parentFolder => (
                    <option key={parentFolder.id} value={parentFolder.id}>
                      {'  '.repeat(parentFolder.level)}{parentFolder.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-2">Название:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-2">Типы контента:</label>
                <div className="flex space-x-2">
                  {['text', 'image', 'quote'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleContentType(type, true)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                        editTypes.includes(type)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {getContentTypeIcon(type)}
                      <span>
                        {type === 'text' && 'Тексты'}
                        {type === 'image' && 'Фото'}
                        {type === 'quote' && 'Цитаты'}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Пустой = все типы</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!editName.trim() || updateFolderMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setEditParent('');
                    setEditName('');
                    setEditTypes([]);
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div 
            className="bg-gray-800 hover:bg-gray-750 rounded-lg p-3 mb-2 transition-colors"
            style={{ marginLeft: `${level * 24}px` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Expand/Collapse button */}
                {folder.children.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(folder.id)}
                    className="text-gray-400 hover:text-gray-300 transition-colors flex-shrink-0"
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                {/* Folder icon and info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Folder className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-gray-100 font-medium truncate">
                        {folder.name}
                      </h3>
                      {folder.children.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                          {folder.children.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>/{folder.path || folder.slug}</span>
                      
                      {folder.level > 0 && (
                        <span className="bg-gray-700 px-2 py-1 rounded">
                          Уровень {folder.level + 1}
                        </span>
                      )}
                      
                      {folder.content_types.length > 0 && (
                        <div className="flex items-center space-x-1">
                          {folder.content_types.map(type => (
                            <span key={type} className="flex items-center">
                              {getContentTypeIcon(type)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {folder.content_types.length === 0 && (
                        <span className="text-gray-600">Все типы</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingFolder(folder.id);
                    setEditParent(folder.parent_id || '');
                    setEditName(folder.name);
                    setEditTypes(folder.content_types || []);
                  }}
                  className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id, folder.name)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={deleteFolderMutation.isPending}
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Render children if expanded */}
        {folder.children.length > 0 && expandedFolders.has(folder.id) && (
          <div>
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Build tree structure
  const folderTree = folders ? buildFolderTree(folders) : [];

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
          
          <h1 className="text-xl font-semibold">Папки</h1>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            title="Создать папку"
          >
            <Plus className="w-4 h-4" />
            <span>Папка</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Новая папка</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Родительская папка
                </label>
                <select
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">📁 Корневая папка</option>
                  {folders?.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {'  '.repeat(folder.level + 1)}📁 {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название папки
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Название папки"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Типы контента
                </label>
                <div className="flex space-x-3">
                  {['text', 'image', 'quote'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleContentType(type)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        newFolderTypes.includes(type)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {getContentTypeIcon(type)}
                      <span>
                        {type === 'text' && 'Тексты'}
                        {type === 'image' && 'Фото'}
                        {type === 'quote' && 'Цитаты'}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Оставьте пустым для всех типов контента
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {createFolderMutation.isPending ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedParent('');
                    setNewFolderName('');
                    setNewFolderTypes([]);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Folders Tree */}
        {folderTree.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">Пока нет папок</div>
            <p className="text-gray-600 text-sm mb-4">
              Создайте первую папку для организации контента
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Создать папку
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">
                Структура папок ({folders?.length || 0})
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Expand all folders
                    const allIds = new Set(folders?.map(f => f.id) || []);
                    setExpandedFolders(allIds);
                  }}
                  className="text-xs text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  Развернуть все
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={() => setExpandedFolders(new Set())}
                  className="text-xs text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  Свернуть все
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              {renderFolderTree(folderTree)}
            </div>
          </div>
        )}

        {/* Error Messages */}
        {createFolderMutation.error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
            Ошибка создания: {(createFolderMutation.error as Error).message}
          </div>
        )}
        
        {updateFolderMutation.error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
            Ошибка обновления: {(updateFolderMutation.error as Error).message}
          </div>
        )}
        
        {deleteFolderMutation.error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
            Ошибка удаления: {(deleteFolderMutation.error as Error).message}
          </div>
        )}
      </main>
    </div>
  );
};

export default FoldersPage;