import React, { useState } from 'react';
import { ClipboardList, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import TaskManager from '../components/home/TaskManager';
import ChatPanel from '../components/home/ChatPanel';
import CalendarPanel from '../components/home/CalendarPanel';

type View = 'tasks' | 'calendar' | 'chat';

const HomePage: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('tasks');

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation Tabs */}
      <div className="flex bg-gray-950 border-b border-gray-800">
        <button
          onClick={() => setActiveView('tasks')}
          className={`flex-1 py-4 text-sm font-medium transition-colors flex flex-col items-center ${
            activeView === 'tasks'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-1" />
          <span>Планы</span>
        </button>
        <button
          onClick={() => setActiveView('calendar')}
          className={`flex-1 py-4 text-sm font-medium transition-colors flex flex-col items-center ${
            activeView === 'calendar'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <CalendarIcon className="w-5 h-5 mb-1" />
          <span>Календарь</span>
        </button>
        <button
          onClick={() => setActiveView('chat')}
          className={`flex-1 py-4 text-sm font-medium transition-colors flex flex-col items-center ${
            activeView === 'chat'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <MessageCircle className="w-5 h-5 mb-1" />
          <span>Письма</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'tasks' && <TaskManager />}
        {activeView === 'calendar' && <CalendarPanel />}
        {activeView === 'chat' && <ChatPanel />}
      </div>
    </div>
  );
};

export default HomePage;
