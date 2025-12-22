import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { api, CalendarEvent } from '../../lib/api';

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

const CalendarPanel: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#3b82f6',
    isMultiDay: false,
    endDate: null as Date | null,
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const eventsList = await api.getCalendarEvents(startOfMonth, endOfMonth);
    setEvents(eventsList);
  };

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
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const startDate = event.start_date;
      const endDate = event.end_date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setFormData({
      title: '',
      description: '',
      color: '#3b82f6',
      isMultiDay: false,
      endDate: null,
    });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    setSelectedDate(startDate);
    setFormData({
      title: event.title,
      description: event.description,
      color: event.color,
      isMultiDay: event.start_date !== event.end_date,
      endDate: event.start_date !== event.end_date ? endDate : null,
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this event?')) {
      await api.deleteCalendarEvent(eventId);
      loadEvents();
    }
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !formData.title.trim()) return;

    const startDate = selectedDate.toISOString().split('T')[0];
    const endDate = formData.isMultiDay && formData.endDate
      ? formData.endDate.toISOString().split('T')[0]
      : startDate;

    const eventData = {
      title: formData.title,
      description: formData.description,
      start_date: startDate,
      end_date: endDate,
      color: formData.color,
    };

    try {
      if (editingEvent) {
        await api.updateCalendarEvent(editingEvent.id, eventData);
      } else {
        await api.createCalendarEvent(eventData);
      }
      setShowEventModal(false);
      loadEvents();
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

  const upcomingEvents = events
    .filter(event => new Date(event.start_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-semibold text-gray-900">Calendar</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{monthName}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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

          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`min-h-[100px] p-2 border rounded-lg transition-all cursor-pointer ${
                    date
                      ? 'bg-white hover:bg-gray-50 border-gray-200 hover:shadow-md'
                      : 'bg-gray-50 border-gray-100'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="text-xs px-2 py-1 rounded text-white truncate group relative"
                            style={{ backgroundColor: event.color }}
                            onClick={(e) => handleEditEvent(event, e)}
                          >
                            {event.title}
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

                return (
                  <div
                    key={event.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={(e) => handleEditEvent(event, e)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
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
                      <button
                        onClick={(e) => handleDeleteEvent(event.id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedDate && (
                <div className="text-sm text-gray-600 mb-4">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Add details"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.isMultiDay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isMultiDay: e.target.checked,
                        endDate: e.target.checked ? formData.endDate : null,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Multi-day event</span>
                </label>

                {formData.isMultiDay && (
                  <input
                    type="date"
                    value={
                      formData.endDate
                        ? formData.endDate.toISOString().split('T')[0]
                        : selectedDate?.toISOString().split('T')[0]
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: new Date(e.target.value) })
                    }
                    min={selectedDate?.toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-10 rounded-lg transition-all ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-900 scale-105'
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
                    }}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={!formData.title.trim()}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
