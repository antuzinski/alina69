import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, Folder, FileText, Play } from 'lucide-react';
import { Item } from '../lib/supabase';
import ImageWithFallback from './ImageWithFallback';
import MarkdownRenderer from './MarkdownRenderer';
import EmojiReactions from './EmojiReactions';

interface ItemCardProps {
  item: Item;
  className?: string;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, className = "" }) => {
  const formatDateTime = (dateString: string) => {
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
          <div>
            {item.title && (
              <h3 className="text-emerald-500 font-semibold mb-2 line-clamp-2">
                {item.title}
              </h3>
            )}
            {item.preview && (
              <div className="text-gray-300 text-sm leading-relaxed mb-3">
                <MarkdownRenderer 
                  content={item.preview} 
                  isPreview={true}
                  className="line-clamp-3"
                />
              </div>
            )}
          </div>
        );
      
      case 'quote':
        return (
          <div>
            <div className="text-gray-100 mb-2">
              <span className="text-emerald-500 text-lg">"</span>
              <span className="italic">{item.body}</span>
              <span className="text-emerald-500 text-lg">"</span>
            </div>
            {item.title && (
              <p className="text-gray-400 text-sm">— {item.title}</p>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div>
            {item.image_url && (
              <ImageWithFallback
                src={item.image_url}
                alt={item.title || 'Image'}
                mediaType={item.media_type}
                className="w-full h-48 object-cover rounded-lg mb-3"
                loading="lazy"
                onError={() => {
                  console.log('[ITEM_CARD] Media failed to load, retrying...', item.image_url);
                }}
                onError={() => {
                  console.log('[ITEM_CARD] Media failed to load:', item.image_url);
                }}
              />
            )}
            
            {/* Media type indicator */}
            {item.media_type === 'video' && item.image_url && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                <Play className="w-3 h-3" />
                <span>VIDEO</span>
              </div>
            )}
            
            {item.title && (
              <h3 className="text-emerald-500 font-semibold mb-2">
                {item.title}
              </h3>
            )}
            {item.body && (
              <p className="text-gray-300 text-sm">{item.body}</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Link
      to={`/item/${item.id}`}
      className={`group block rounded-lg p-4 hover:bg-gray-750 transition-colors relative ${
        item.is_draft 
          ? 'bg-blue-900/30 border border-blue-700/50' 
          : 'bg-gray-800'
      } ${className}`}
    >
      {/* Draft indicator */}
      {item.is_draft && (
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">ЧЕРНОВИК</span>
        </div>
      )}
      
      {renderContent()}
      
      {/* Meta information */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
        {item.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>{item.tags.map(tag => `#${tag}`).join(' ')}</span>
          </div>
        )}
        
        {item.folder && (
          <div className="flex items-center gap-1">
            <Folder className="w-3 h-3" />
            <span>{item.folder.path || item.folder.name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDateTime(item.taken_at || item.created_at)}</span>
        </div>
        
        {/* Emoji Reactions - show on hover */}
        {item.type === 'text' && item.reactions && (
          (() => {
            const hasReactions = Object.values(item.reactions).some(count => count > 0);
            return (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <EmojiReactions
                  itemId={item.id}
                  reactions={item.reactions}
                  className={`scale-75 transition-opacity ${
                    hasReactions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                />
              </div>
            );
          })()
        )}
      </div>
    </Link>
  );
};

export default ItemCard;