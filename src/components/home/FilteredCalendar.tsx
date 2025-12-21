import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { showNotification } from '../../lib/notifications';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

interface FilteredCalendarProps {
  apiKey?: string;
  calendarId?: string;
}

const FilteredCalendar: React.FC<FilteredCalendarProps> = ({
  apiKey = '',
  calendarId = ''
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousEventIdsRef = useRef<Set<string>>(new Set());

  const fetchEvents = async () => {
    if (!apiKey || !calendarId) {
      setError('Please configure API key and Calendar ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const formattedEvents: CalendarEvent[] = data.items?.map((item: any) => ({
        id: item.id,
        summary: item.summary || 'No title',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        description: item.description,
        location: item.location,
      })) || [];

      const newEventIds = new Set(formattedEvents.map(e => e.id));
      const previousEventIds = previousEventIdsRef.current;

      if (previousEventIds.size > 0) {
        const newEvents = formattedEvents.filter(event => !previousEventIds.has(event.id));
        newEvents.forEach(event => {
          showNotification('Новое событие в календаре', {
            body: `${event.summary}\n${formatDate(event.start)}`,
            tag: `calendar-${event.id}`,
          });
        });
      }

      previousEventIdsRef.current = newEventIds;
      setEvents(formattedEvents);
      setFilteredEvents(formattedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey && calendarId) {
      fetchEvents();
    }
  }, [apiKey, calendarId]);

  useEffect(() => {
    if (!filterText.trim()) {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter(event => {
      const searchText = filterText.toLowerCase();
      return (
        event.summary.toLowerCase().includes(searchText) ||
        event.description?.toLowerCase().includes(searchText) ||
        event.location?.toLowerCase().includes(searchText)
      );
    });

    setFilteredEvents(filtered);
  }, [filterText, events]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};

    events.forEach(event => {
      const date = new Date(event.start).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  if (!apiKey || !calendarId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 p-6">
        <div className="text-center text-gray-400 max-w-md">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium mb-2">Calendar Not Configured</h3>
          <p className="text-sm">Add your Google Calendar API key and Calendar ID to display filtered events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter events by keyword..."
            className="w-full pl-10 pr-10 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {filterText && (
          <p className="text-sm text-gray-400 mt-2">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="text-center text-gray-400 py-8">Loading events...</div>
        )}

        {error && (
          <div className="text-center text-red-400 py-8">
            <p>{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            {filterText ? 'No events match your filter' : 'No upcoming events'}
          </div>
        )}

        {!loading && !error && Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 sticky top-0 bg-gray-900 py-2">
              {new Date(dayEvents[0].start).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{event.summary}</h4>
                    <p className="text-sm text-gray-400">
                      {formatDate(event.start)}
                    </p>
                    {event.location && (
                      <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilteredCalendar;
