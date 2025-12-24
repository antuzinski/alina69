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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'TODAY';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'TOMORROW';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  };

  const getEventColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
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

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const timeA = new Date(a.start).getTime();
        const timeB = new Date(b.start).getTime();
        return timeA - timeB;
      });
    });

    return grouped;
  };

  const eventsOverlap = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
    const start1 = new Date(event1.start).getTime();
    const end1 = new Date(event1.end).getTime();
    const start2 = new Date(event2.start).getTime();
    const end2 = new Date(event2.end).getTime();

    return (start1 < end2 && start2 < end1);
  };

  interface EventGroup {
    events: CalendarEvent[];
  }

  const groupOverlappingEvents = (events: CalendarEvent[]): EventGroup[] => {
    const groups: EventGroup[] = [];
    const processed = new Set<string>();

    events.forEach(event => {
      if (processed.has(event.id)) return;

      const group: EventGroup = { events: [event] };
      processed.add(event.id);

      events.forEach(otherEvent => {
        if (processed.has(otherEvent.id)) return;

        const overlapsWithAny = group.events.some(groupEvent =>
          eventsOverlap(groupEvent, otherEvent)
        );

        if (overlapsWithAny) {
          group.events.push(otherEvent);
          processed.add(otherEvent.id);
        }
      });

      groups.push(group);
    });

    return groups;
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

      <div className="flex-1 overflow-y-auto">
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

        {!loading && !error && Object.entries(groupedEvents).map(([date, dayEvents], dateIndex) => {
          const eventGroups = groupOverlappingEvents(dayEvents);

          return (
            <div key={date} className="mb-6">
              <div className="sticky top-0 bg-gray-900 px-4 py-3 border-b border-gray-800 backdrop-blur-sm bg-opacity-95 z-10">
                <h3 className="text-xs font-bold text-blue-400 tracking-wider">
                  {formatDateHeader(dayEvents[0].start)}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {new Date(dayEvents[0].start).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </p>
              </div>
              <div className="px-4 py-2 space-y-2">
                {eventGroups.map((group, groupIndex) => {
                  const hasOverlap = group.events.length > 1;

                  return (
                    <div key={`group-${groupIndex}`}>
                      {hasOverlap ? (
                        <div className="flex gap-2">
                          {group.events.map((event, eventIndex) => {
                            const eventColor = getEventColor(dateIndex * 10 + groupIndex * 10 + eventIndex);

                            return (
                              <div
                                key={event.id}
                                className="flex-1 min-w-0"
                              >
                                <div className="py-2 px-3 rounded-lg hover:bg-gray-800/70 transition-all cursor-pointer group border border-gray-700 hover:border-gray-600 hover:shadow-lg"
                                  style={{
                                    backgroundColor: `${eventColor}15`,
                                    borderLeftColor: eventColor,
                                    borderLeftWidth: '3px',
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-400 font-medium truncate">
                                          {formatTime(event.start)}
                                        </span>
                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: eventColor }} />
                                      </div>
                                      <h4 className="font-semibold text-white text-sm mb-1 group-hover:text-blue-300 transition-colors line-clamp-1">
                                        {event.summary}
                                      </h4>
                                      {event.description && (
                                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                          {event.description}
                                        </p>
                                      )}
                                      {event.location && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                          📍 {event.location}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div key={group.events[0].id}>
                          {group.events.map(event => {
                            const eventColor = getEventColor(dateIndex * 10 + groupIndex);

                            return (
                              <div
                                key={event.id}
                                className="py-2 px-3 rounded-lg hover:bg-gray-800/70 transition-all cursor-pointer group border border-gray-800 hover:border-gray-700 hover:shadow-lg"
                                style={{
                                  backgroundColor: `${eventColor}15`,
                                  borderLeftColor: eventColor,
                                  borderLeftWidth: '3px',
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-gray-400 font-medium">
                                        {formatTime(event.start)}
                                      </span>
                                    </div>
                                    <h4 className="font-semibold text-white text-sm mb-1 group-hover:text-blue-300 transition-colors">
                                      {event.summary}
                                    </h4>
                                    {event.description && (
                                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                        {event.description}
                                      </p>
                                    )}
                                    {event.location && (
                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        📍 {event.location}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilteredCalendar;
