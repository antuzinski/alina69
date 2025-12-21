import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const CalendarPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-100">Календарь</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full bg-gray-800 rounded-lg overflow-hidden">
          <iframe
            src="https://calendar.google.com/calendar/embed?height=600&wkst=2&bgcolor=%23222222&ctz=Europe%2FMoscow&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0"
            style={{ border: 0 }}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            title="Google Calendar"
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
