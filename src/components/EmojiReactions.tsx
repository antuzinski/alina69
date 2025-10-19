import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface EmojiReactionsProps {
  itemId: string;
  reactions: {
    heart: number;
    eyes: number;
    grinning: number;
    bird: number;
  };
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const EmojiReactions: React.FC<EmojiReactionsProps> = ({ 
  itemId, 
  reactions, 
  className = "",
  onClick
}) => {
  const queryClient = useQueryClient();

  const addReactionMutation = useMutation({
    mutationFn: ({ itemId, reactionType }: { itemId: string; reactionType: 'heart' | 'eyes' | 'grinning' | 'bird' }) =>
      api.addReaction(itemId, reactionType),
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
  });

  const handleReaction = (reactionType: 'heart' | 'eyes' | 'grinning' | 'bird') => {
    addReactionMutation.mutate({ itemId, reactionType });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
  };

  const reactionButtons = [
    { type: 'bird' as const, emoji: '🐦', label: 'Bird' },
  ];

  // Check if this is being used in chat context
  const isInChat = className?.includes('scale-90');
  
  // For chat, filter to only show bird emoji
  const buttonsToShow = isInChat 
    ? reactionButtons.filter(btn => btn.type === 'bird')
    : [
        { type: 'heart' as const, emoji: '❤️', label: 'Heart' },
        { type: 'eyes' as const, emoji: '👀', label: 'Eyes' },
        { type: 'grinning' as const, emoji: '😁', label: 'Grinning' },
        { type: 'bird' as const, emoji: '🐦', label: 'Bird' },
      ];

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      onClick={handleClick}
    >
      {buttonsToShow.map(({ type, emoji, label }) => (
        <button
          key={type}
          onClick={() => handleReaction(type)}
          disabled={addReactionMutation.isPending}
          className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
          title={`Add ${label} reaction`}
        >
          <span className="text-base">{emoji}</span>
          {reactions[type] > 0 && (
            <span className="text-gray-300 text-xs font-medium">
              {reactions[type]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default EmojiReactions;