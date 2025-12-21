import React, { useState } from 'react';
import { ClipboardList, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import TaskManager from '../components/home/TaskManager';
import ChatPanel from '../components/home/ChatPanel';
import CalendarPanel from '../components/home/CalendarPanel';

type MobileView = 'tasks' | 'calendar' | 'chat';

const HomePage: React.FC = () => {
  const [mobileView, setMobileView] = useState<MobileView>('tasks');

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: Task Manager */}
        <div className="flex-1 border-r border-gray-800 overflow-hidden">
          <TaskManager />
        </div>

        {/* Right: Chat and Calendar */}
        <div className="w-96 flex flex-col">
          {/* Chat */}
          <div className="flex-1 border-b border-gray-800 overflow-hidden">
            <ChatPanel />
          </div>

          {/* Calendar */}
          <div className="flex-1 overflow-hidden">
            <CalendarPanel />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {mobileView === 'tasks' && <TaskManager />}
          {mobileView === 'calendar' && <CalendarPanel />}
          {mobileView === 'chat' && <ChatPanel />}
        </div>

        {/* Bottom Navigation Tabs */}
        <div className="flex bg-gray-950 border-t border-gray-800">
          <button
            onClick={() => setMobileView('tasks')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mobileView === 'tasks'
                ? 'text-blue-500 border-t-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <ClipboardList className="w-5 h-5 mx-auto mb-1" />
            Планы
          </button>
          <button
            onClick={() => setMobileView('calendar')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mobileView === 'calendar'
                ? 'text-blue-500 border-t-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <CalendarIcon className="w-5 h-5 mx-auto mb-1" />
            Календарь
          </button>
          <button
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mobileView === 'chat'
                ? 'text-blue-500 border-t-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <MessageCircle className="w-5 h-5 mx-auto mb-1" />
            Письма
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
