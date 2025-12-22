import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Trash2, ExternalLink } from 'lucide-react';
import { api, CalendarEvent } from '../../lib/api';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const COLORS = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#10b981' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Yellow', value: '#eab308' },
];

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  start_time?: string | null;
  end_time?: string | null;
  description?: string;
  color?: string;
  isGoogleEvent?: boolean;
}

const CalendarPanel: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);

  const googleCalendarApiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || '';
  const googleCalendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || '';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#3b82f6',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    loadLocalEvents();
    if (googleCalendarApiKey && googleCalendarId) {
      loadGoogleEvents();
    }
  }, [currentDate]);

  const loadLocalEvents = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const eventsList = await api.getCalendarEvents(startOfMonth, endOfMonth);
    setLocalEvents(eventsList);
  };

  const loadGoogleEvents = async () => {
    if (!googleCalendarApiKey || !googleCalendarId) return;

    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const timeMin = startOfMonth.toISOString();
      const timeMax = endOfMonth.toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId)}/events?key=${googleCalendarApiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch Google Calendar events');

      const data = await response.json();
      const formattedEvents: GoogleCalendarEvent[] = data.items?.map((item: any) => {
        const startStr = (item.start?.dateTime || item.start?.date || '').split('T')[0];
        let endStr = (item.end?.dateTime || item.end?.date || '').split('T')[0];

        const startTime = item.start?.dateTime
          ? item.start.dateTime.split('T')[1]?.slice(0, 5)
          : null;
        const endTime = item.end?.dateTime
          ? item.end.dateTime.split('T')[1]?.slice(0, 5)
          : null;

        if (endStr && !item.end?.dateTime) {
          const endDate = new Date(endStr);
          endDate.setDate(endDate.getDate() - 1);
          endStr = formatDateLocal(endDate);
        }

        return {
          id: `google-${item.id}`,
          summary: item.summary || 'No title',
          start: startStr,
          end: endStr || startStr,
          start_time: startTime,
          end_time: endTime,
          description: item.description,
          color: '#6366f1',
          isGoogleEvent: true,
        };
      }) || [];

      setGoogleEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading Google Calendar events:', error);
    }
  };

  const allEvents = [
    ...localEvents,
    ...googleEvents.map(e => ({
      ...e,
      start_date: e.start,
      end_date: e.end,
      title: e.summary,
      start_time: e.start_time,
      end_time: e.end_time,
      created_at: '',
      updated_at: '',
    }))
  ];

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = formatDateLocal(date);
    return allEvents.filter(event => {
      const startDate = event.start_date;
      const endDate = event.end_date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const handleMouseDown = (date: Date | null) => {
    if (!date) return;
    setIsDragging(true);
    setDragStartDate(date);
    setDragEndDate(date);
  };

  const handleMouseEnter = (date: Date | null) => {
    if (!isDragging || !date) return;
    setDragEndDate(date);
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStartDate) return;

    setIsDragging(false);

    const start = dragEndDate && dragEndDate < dragStartDate ? dragEndDate : dragStartDate;
    const end = dragEndDate && dragEndDate > dragStartDate ? dragEndDate : dragStartDate;

    setSelectedDate(start);
    setFormData({
      title: '',
      description: '',
      color: '#3b82f6',
      start_time: '',
      end_time: '',
    });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const isDateInDragRange = (date: Date | null) => {
    if (!isDragging || !dragStartDate || !date) return false;

    const start = dragEndDate && dragEndDate < dragStartDate ? dragEndDate : dragStartDate;
    const end = dragEndDate && dragEndDate > dragStartDate ? dragEndDate : dragStartDate;

    return date >= start && date <= end;
  };

  const handleEditEvent = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();

    if (event.isGoogleEvent) return;

    setEditingEvent(event);
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    setSelectedDate(startDate);
    setDragEndDate(endDate);
    setFormData({
      title: event.title,
      description: event.description,
      color: event.color,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this event?')) {
      await api.deleteCalendarEvent(eventId);
      loadLocalEvents();
    }
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !formData.title.trim()) return;

    const startDate = formatDateLocal(selectedDate);
    const endDate = dragEndDate && dragEndDate >= selectedDate
      ? formatDateLocal(dragEndDate)
      : startDate;

    const eventData = {
      title: formData.title,
      description: formData.description,
      start_date: startDate,
      end_date: endDate,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      color: formData.color,
    };

    try {
      if (editingEvent) {
        await api.updateCalendarEvent(editingEvent.id, eventData);
      } else {
        await api.createCalendarEvent(eventData);
      }
      setShowEventModal(false);
      setDragStartDate(null);
      setDragEndDate(null);
      loadLocalEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const upcomingEvents = allEvents
    .filter(event => new Date(event.start_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold text-gray-100">Calendar</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              List
            </button>
            {googleCalendarApiKey && googleCalendarId && (
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                title="Open Google Calendar"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-100">{monthName}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-2"
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
          >
            {days.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date && date.toDateString() === new Date().toDateString();
              const inDragRange = isDateInDragRange(date);

              return (
                <div
                  key={index}
                  onMouseDown={() => handleMouseDown(date)}
                  onMouseEnter={() => handleMouseEnter(date)}
                  className={`min-h-[100px] p-2 border rounded-lg transition-all select-none ${
                    date
                      ? `bg-gray-800 hover:bg-gray-750 border-gray-700 cursor-pointer ${
                          inDragRange ? 'bg-blue-900 border-blue-600' : ''
                        }`
                      : 'bg-gray-900 border-gray-800'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-400' : 'text-gray-300'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-2 py-1 rounded text-white group relative flex items-center justify-between ${
                              (event as any).isGoogleEvent ? 'opacity-75 italic' : 'cursor-pointer'
                            }`}
                            style={{ backgroundColor: event.color }}
                            onClick={(e) => handleEditEvent(event, e)}
                            title={(event as any).isGoogleEvent ? 'Google Calendar Event (read-only)' : event.title}
                          >
                            <span className="truncate">{event.title}</span>
                            {event.start_time && (
                              <span className="ml-2 text-[10px] opacity-75 shrink-0">
                                {event.start_time.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map(event => {
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                const isMultiDay = event.start_date !== event.end_date;
                const isGoogle = (event as any).isGoogleEvent;

                return (
                  <div
                    key={event.id}
                    className={`p-4 border border-gray-700 bg-gray-800 rounded-lg hover:border-gray-600 transition-all ${
                      !isGoogle ? 'cursor-pointer' : ''
                    }`}
                    onClick={(e) => !isGoogle && handleEditEvent(event, e)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: event.color }}
                          />
                          <h4 className="font-medium text-gray-100 flex items-center gap-2 flex-1">
                            <span className="flex-1">{event.title}</span>
                            {event.start_time && (
                              <span className="text-sm text-gray-400 font-normal shrink-0">
                                {event.start_time.slice(0, 5)}
                                {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                              </span>
                            )}
                            {isGoogle && <span className="text-xs text-gray-500 shrink-0">(Google Calendar)</span>}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          {startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {isMultiDay &&
                            ` - ${endDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}`}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-500">{event.description}</p>
                        )}
                      </div>
                      {!isGoogle && (
                        <button
                          onClick={(e) => handleDeleteEvent(event.id, e)}
                          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-100">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setDragStartDate(null);
                  setDragEndDate(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedDate && (
                <div className="text-sm text-gray-400 mb-4">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {dragEndDate && dragEndDate > selectedDate && (
                    <span>
                      {' - '}
                      {dragEndDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Add details"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-10 rounded-lg transition-all ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-gray-300 scale-105'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                {editingEvent && (
                  <button
                    onClick={(e) => {
                      handleDeleteEvent(editingEvent.id, e);
                      setShowEventModal(false);
                      setDragStartDate(null);
                      setDragEndDate(null);
                    }}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setDragStartDate(null);
                    setDragEndDate(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={!formData.title.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPanel;
