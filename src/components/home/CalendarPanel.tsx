import React, { useState } from 'react';
import { Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

const CalendarPanel: React.FC = () => {
  const [iframeError, setIframeError] = useState(false);
  const calendarUrl = "https://calendar.google.com/calendar/u/0/r";

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-100">Календарь</h2>
          </div>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-500 transition-colors"
            title="Открыть в новой вкладке"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full bg-gray-800 rounded-lg overflow-hidden">
          {!iframeError ? (
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=2&bgcolor=%23222222&ctz=Europe%2FMoscow&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0"
              style={{ border: 0 }}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Google Calendar"
              className="rounded-lg"
              onError={() => setIframeError(true)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <CalendarIcon className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">
                Не удалось загрузить календарь
              </p>
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center space-x-2"
              >
                <span>Открыть Google Calendar</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
