import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { api } from '../../lib/api';
import { linkifyReact } from '../../utils/linkify';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'Alina' | 'Yura';
  timestamp: string;
}

const ChatPanel: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['chat-messages-notes'],
    queryFn: () => api.getItems({
      type: 'text',
      tags: ['chat'],
      limit: 20,
      sort: 'created_at_desc',
    }),
    refetchInterval: 10000,
    staleTime: 60000,
  });

  const messages: ChatMessage[] = (data?.data.items || [])
    .slice()
    .reverse()
    .map(item => ({
      id: item.id,
      text: item.body || '',
      sender: item.body?.includes('/yura') ? 'Yura' : 'Alina',
      timestamp: item.created_at,
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
      queryClient.invalidateQueries({ queryKey: ['chat-messages-notes'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages-latest'] });
      setMessage('');
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
      }) + ', ' + date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-gray-100">Письма</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Нет сообщений
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-3 ${
                  msg.sender === 'Alina'
                    ? 'bg-emerald-600/20 border border-emerald-600/30'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${
                    msg.sender === 'Alina' ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {msg.sender}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {linkifyReact(msg.text.replace('/yura', '').trim())}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-gray-800 p-4 flex-shrink-0 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <TextareaAutosize
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none text-sm leading-relaxed"
            minRows={1}
            maxRows={4}
            disabled={isSubmitting}
            style={{
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          />

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        {createMessageMutation.error && (
          <div className="mt-2 text-xs text-red-400">
            Ошибка отправки сообщения
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
