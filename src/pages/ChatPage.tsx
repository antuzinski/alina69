import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageCircle, Trash2, MoreVertical, ChevronUp } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import EmojiReactions from '../components/EmojiReactions';
import { api } from '../lib/api';
import { requireAuth } from '../lib/auth';
import { linkifyReact } from '../utils/linkify';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'Alina' | 'Yura';
  timestamp: string;
  reactions?: {
    heart: number;
    eyes: number;
    grinning: number;
    bird: number;
  };
}

const ChatPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedMessages, setLoadedMessages] = useState<ChatMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestMessageDate, setOldestMessageDate] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Get latest chat messages (last 20)
  const { data: latestData, isLoading, error } = useQuery({
    queryKey: ['chat-messages-latest'],
    queryFn: () => api.getItems({
      type: 'text',
      tags: ['chat'],
      limit: 20,
      sort: 'created_at_desc' // Get newest first, then reverse
    }),
    staleTime: 60 * 1000, // 1 minute for mobile
    refetchInterval: 10 * 1000, // Refresh every 10 seconds for mobile
    retry: 2,
    networkMode: 'offlineFirst',
  });

  // Load more messages (older)
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      console.log('[CHAT] Loading more messages, current offset:', offset + 20);
      
      // Get next batch of messages with offset
      const olderResponse = await api.getItems({
        type: 'text',
        tags: ['chat'],
        limit: 20 + offset + 20, // Get more messages to skip already loaded ones
        sort: 'created_at_desc'
      });
      
      const allOlderMessages = olderResponse.data.items || [];
      console.log('[CHAT] Got messages from API:', allOlderMessages.length);
      
      // Skip messages we already have (first 20 + offset are already loaded)
      const currentIds = new Set(loadedMessages.map(m => m.id));
      const newMessages = allOlderMessages
        .slice(20 + offset, 40 + offset) // Take next 20 messages
        .filter(item => !currentIds.has(item.id)); // Remove any duplicates
      
      console.log('[CHAT] New messages to add:', newMessages.length);
      
      if (newMessages.length === 0) {
        console.log('[CHAT] No more messages available');
        setHasMoreMessages(false);
      } else {
        // Convert to chat messages (they're already in desc order, so reverse for chronological)
        const newChatMessages = newMessages.reverse().map(item => ({
          id: item.id,
          text: item.body || '',
          sender: item.body?.includes('/yura') ? 'Yura' : 'Alina',
          timestamp: item.created_at,
          reactions: item.reactions,
        }));
        
        console.log('[CHAT] Adding messages to beginning:', newChatMessages.length);
        
        // Add to beginning of loaded messages
        setLoadedMessages(prev => [...newChatMessages, ...prev]);
        
        // Update offset for next load
        setOffset(prev => prev + 20);
        
        // Update oldest message date
        if (newChatMessages.length > 0) {
          setOldestMessageDate(newChatMessages[0].timestamp);
        }
        
        // Check if we've reached the end
        if (newMessages.length < 20 || (20 + offset + 20) >= (olderResponse.meta?.count || 0)) {
          console.log('[CHAT] Reached end of messages');
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Initialize messages when latest data loads
  useEffect(() => {
    if (latestData?.data.items) {
      const newMessages = latestData.data.items
        .slice() // Create copy
        .reverse() // Reverse to get chronological order (oldest first)
        .map(item => ({
          id: item.id,
          text: item.body || '',
          sender: item.body?.includes('/yura') ? 'Yura' : 'Alina',
          timestamp: item.created_at,
          reactions: item.reactions,
        }));
      
      setLoadedMessages(newMessages);
      setOffset(0); // Reset offset
      
      // Set oldest message ID for pagination
      if (newMessages.length > 0) {
        setOldestMessageDate(newMessages[0].timestamp);
        setHasMoreMessages((latestData.meta?.count || 0) > 20); // Check if there are more messages
      }
      
      // Scroll to bottom on initial load
      setShouldScrollToBottom(true);
    }
  }, [latestData]);

  // Convert loaded messages to display format
  const messages: ChatMessage[] = loadedMessages;

  // Check for new messages and add them
  useEffect(() => {
    if (latestData?.data.items && loadedMessages.length > 0) {
      const latestMessages = latestData.data.items.slice().reverse();
      const currentIds = new Set(loadedMessages.map(m => m.id));
      const newMessages = latestMessages
        .filter(item => !currentIds.has(item.id))
        .map(item => ({
          id: item.id,
          text: item.body || '',
          sender: item.body?.includes('/yura') ? 'Yura' : 'Alina',
          timestamp: item.created_at,
          reactions: item.reactions,
        }));
      
      if (newMessages.length > 0) {
        setLoadedMessages(prev => [...prev, ...newMessages]);
        setShouldScrollToBottom(true);
      }
    }
  }, [latestData, loadedMessages.length]);

  // Handle scroll to detect when to load more messages
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    // If scrolled to top (with some threshold), load more messages
    if (container.scrollTop < 200 && hasMoreMessages && !isLoadingMore && loadedMessages.length > 0) {
      loadMoreMessages();
    }
  };

  // Scroll event listener
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreMessages, isLoadingMore]);

  // Convert items to chat messages (keeping old logic as fallback)
  const fallbackMessages: ChatMessage[] = (latestData?.data.items || [])
    .slice()
    .reverse()
    .map(item => ({
    id: item.id,
    text: item.body || '',
    sender: item.body?.includes('/yura') ? 'Yura' : 'Alina',
    timestamp: item.created_at,
    reactions: item.reactions,
  }));

  const createMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const sender = messageText.includes('/yura') ? 'Yura' : 'Alina';
      
      return api.createItem({
        type: 'text',
        title: `Chat message from ${sender}`,
        body: messageText,
        tags: ['chat'],
        preview: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages-latest'] });
      setMessage('');
      setShouldScrollToBottom(true);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages-latest'] });
      setShowDeleteMenu(null);
      // Remove from local state
      setLoadedMessages(prev => prev.filter(m => m.id !== showDeleteMenu));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createMessageMutation.mutateAsync(message.trim());
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Удалить это сообщение?')) {
      await deleteMessageMutation.mutateAsync(messageId);
    }
  };

  // Auto-scroll to bottom when needed
  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom, messages.length]);

  // Handle click outside to close delete menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(null);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDeleteMenu]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, typeof messages>, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-800 rounded-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-semibold text-gray-100">Чат</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
         
          </p>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-24"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Load more button/indicator */}
          {hasMoreMessages && (
            <div className="text-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Загрузка сообщений...</span>
                </div>
              ) : (
                <button
                  onClick={loadMoreMessages}
                  className="flex items-center space-x-2 text-gray-500 hover:text-gray-400 transition-colors text-sm"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Загрузить предыдущие сообщения</span>
                </button>
              )}
            </div>
          )}
          
          <div ref={messagesStartRef} />
          
          {Object.keys(groupedMessages).length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">Пока нет сообщений</div>
              <p className="text-gray-600 text-sm">
                Начните переписку - напишите первое сообщение
              </p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-6">
                  <div className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-400">
                    {formatDate(dayMessages[0].timestamp)}
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dayMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'Alina' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${msg.sender === 'Alina' ? 'order-2' : 'order-1'}`}>
                        {/* Message bubble with delete menu */}
                        <div className="relative group/message">
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              msg.sender === 'Alina'
                                ? 'bg-emerald-600 text-white rounded-br-md'
                                : 'bg-gray-800 text-gray-100 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {linkifyReact(msg.text.replace('/yura', '').trim())}
                            </p>
                          </div>
                          
                          {/* Emoji Reactions - only for text messages */}
                          {msg.text && (
                            <div className={`mt-2 transition-opacity ${
                              msg.reactions?.bird && msg.reactions.bird > 0 
                                ? 'opacity-100' 
                                : 'opacity-0 group-hover/message:opacity-100'
                            }`}>
                              <EmojiReactions
                                itemId={msg.id}
                                reactions={msg.reactions || { heart: 0, eyes: 0, grinning: 0, bird: 0 }}
                                className="justify-start scale-90"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Delete button */}
                          <div className={`absolute top-1 ${msg.sender === 'Alina' ? 'left-1' : 'right-1'} opacity-0 group-hover/message:opacity-100 transition-opacity`}>
                            <div className="relative" ref={showDeleteMenu === msg.id ? deleteMenuRef : null}>
                              <button
                                onClick={() => setShowDeleteMenu(showDeleteMenu === msg.id ? null : msg.id)}
                                className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              
                              {/* Delete menu */}
                              {showDeleteMenu === msg.id && (
                                <div className={`absolute top-full mt-1 ${msg.sender === 'Alina' ? 'left-0' : 'right-0'} bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-max`}>
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    disabled={deleteMessageMutation.isPending}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors w-full text-left whitespace-nowrap"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Удалить</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Sender and time */}
                        <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
                          msg.sender === 'Alina' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="font-medium">{msg.sender}</span>
                          <span>•</span>
                          <span>{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-gray-950 border-t border-gray-800 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1 relative flex items-end">
              <TextareaAutosize
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none text-base leading-relaxed"
                minRows={1}
                maxRows={6}
                onKeyDown={(e) => {
                  // Enter now creates new line, no auto-submit
                  // Only submit via button click
                }}
                disabled={isSubmitting}
                style={{ 
                  fontSize: '16px', // Prevents zoom on iOS
                  lineHeight: '1.5'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center min-w-[60px] self-end flex-shrink-0"
              style={{ minHeight: '52px' }}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </form>
          
          {/* Helper text */}
          <div className="mt-2 text-xs text-gray-500">
            Enter - новая строка, отправка только по кнопке
            {messages.length > 0 && (
              <span className="ml-4">
                Показано {messages.length} сообщений
                {hasMoreMessages && ' (есть более старые)'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {createMessageMutation.error && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm max-w-4xl mx-auto">
          Ошибка отправки: {(createMessageMutation.error as Error).message}
        </div>
      )}
      
      {deleteMessageMutation.error && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm max-w-4xl mx-auto">
          Ошибка удаления: {(deleteMessageMutation.error as Error).message}
        </div>
      )}
    </div>
  );
};

export default ChatPage;