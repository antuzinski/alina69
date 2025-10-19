import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Tag, Folder, Edit } from 'lucide-react';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import ImageWithFallback from '../components/ImageWithFallback';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ItemNavigation from '../components/ItemNavigation';
import EmojiReactions from '../components/EmojiReactions';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => api.getItem(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
        <button
          onClick={() => navigate(-1)}
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = () => {
    switch (item.type) {
      case 'text':
        return (
          <div className="space-y-6">
            {item.image_url && (
              <ImageWithFallback
                src={item.image_url}
                alt={item.title || 'Cover image'}
                mediaType={item.media_type}
                className="w-full max-h-96 object-cover rounded-lg"
                onError={() => {
                  console.log('[ITEM_DETAIL] Media failed to load:', item.image_url);
                }}
              />
            )}
            
            {item.title && (
              <h1 className="text-2xl font-bold text-emerald-500">
                {item.title}
              </h1>
            )}
            
            {item.body && (
              <MarkdownRenderer 
                content={item.body}
                className="leading-relaxed"
              />
            )}
          </div>
        );
      
      case 'quote':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-xl text-gray-100 mb-4">
                <span className="text-emerald-500 text-2xl">"</span>
                <span className="italic">{item.body}</span>
                <span className="text-emerald-500 text-2xl">"</span>
              </div>
              {item.title && (
                <p className="text-gray-400 text-right">— {item.title}</p>
              )}
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-6">
            {item.image_url && (
              <div className="bg-black rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={item.image_url}
                  alt={item.title || 'Image'}
                  mediaType={item.media_type}
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {item.title && (
              <h1 className="text-2xl font-bold text-emerald-500">
                {item.title}
              </h1>
            )}
            
            {item.body && (
              <MarkdownRenderer 
                content={item.body}
                className="leading-relaxed text-gray-300"
              />
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-400 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
          
          <Link
            to={`/admin/edit/${item.id}`}
            className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 max-w-4xl mx-auto pb-20">
        {renderContent()}
        
        {/* Emoji Reactions - only for text items */}
        {item.type === 'text' && item.reactions && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <EmojiReactions
              itemId={item.id}
              reactions={item.reactions}
              className="justify-center"
            />
          </div>
        )}
        
        {/* Navigation between items */}
        <ItemNavigation currentItem={item} />
        
        {/* Meta information */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {item.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-emerald-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {item.folder && (
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>{item.folder.path || item.folder.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(item.taken_at || item.created_at)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItemDetailPage;