import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { linkifyReact } from '../../utils/linkify';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'Alina' | 'Yura';
  timestamp: string;
}

const NotesPanel: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['chat-messages-notes'],
    queryFn: () => api.getItems({
      type: 'text',
      tags: ['chat'],
      limit: 20,
      sort: 'created_at_desc',
    }),
    refetchInterval: 30000,
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
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
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
          messages.map((msg) => (
            <div key={msg.id} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400">
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
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
