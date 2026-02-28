'use client';

import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventsService } from '@/app/service/EventsService';
import EventFilter, { EventFilterParams } from './event_components/EventFilter';

interface Event {
  id_fair: string;
  event_name: string;
  country: string;
  main_description: string;
  region: string;
  start_date: string;
  end_date: string;
  location: string;
  event_main_image?: string;
}

const IndustryEvents: FC = () => {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [calendarInitialized, setCalendarInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<'months' | 'day'>('months');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filterParams, setFilterParams] = useState<EventFilterParams>({
    name: '',
    region: '',
    dateFrom: '',
    dateTo: '',
    portalNames: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string | string[] | undefined> = {};
        if (filterParams.name) params.name = filterParams.name;
        if (filterParams.region) params.region = filterParams.region;
        if (filterParams.dateFrom) params.dateFrom = filterParams.dateFrom;
        if (filterParams.dateTo) params.dateTo = filterParams.dateTo;
        if (filterParams.portalNames.length > 0) params.portalNames = filterParams.portalNames;
        const data = await EventsService.getAllEvents(params);
        if (!cancelled) setEvents(data);
      } catch (err: unknown) {
        const msg =
          typeof err === 'string'
            ? err
            : (err as { message?: string })?.message ||
              (err as { data?: { message?: string } })?.data?.message ||
              (err as { status?: number })?.status != null
                ? `HTTP ${(err as { status?: number }).status}`
                : 'Unknown error';
        console.error('Error loading events:', msg, err);
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterParams]);

  useEffect(() => {
    if (events.length > 0 && !calendarInitialized) {
      const sortedEvents = [...events].sort((a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      const firstEventDate = new Date(sortedEvents[0].start_date);
      const initialMonth = new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1);
      setCurrentMonth(initialMonth);
      setCalendarInitialized(true);
    }
  }, [events, calendarInitialized]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    if (events.length === 0) return [];

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return events.filter((event) => {
      if (!event.start_date || !event.end_date) return false;
      const startDateStr = event.start_date.split('T')[0];
      const endDateStr = event.end_date.split('T')[0];
      return dateStr >= startDateStr && dateStr <= endDateStr;
    });
  };

  const isEventSelected = (eventId: string) => {
    return selectedEventId === eventId;
  };

  const isDateInSelectedEvent = (date: Date) => {
    if (!selectedEventId) return false;
    const selectedEvent = events.find((e) => e.id_fair === selectedEventId);
    if (!selectedEvent) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const startDateStr = selectedEvent.start_date.split('T')[0];
    const endDateStr = selectedEvent.end_date.split('T')[0];
    return dateStr >= startDateStr && dateStr <= endDateStr;
  };

  const getEventDayNumber = (event: Event, date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const startDateStr = event.start_date.split('T')[0];
    const endDateStr = event.end_date.split('T')[0];

    if (dateStr < startDateStr || dateStr > endDateStr) return null;

    const startDate = new Date(startDateStr);
    const currentDate = new Date(dateStr);
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const endDate = new Date(endDateStr);
    const totalDays =
      Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return { current: diffDays, total: totalDays };
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    setViewMode('day');
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDay) return;
    const newDate = new Date(selectedDay);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDay(newDate);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEventId(event.id_fair);
    router.push(`/logged/pages/events/${event.id_fair}`);
  };

  const renderCalendar = () => {
    const month1 = new Date(currentMonth);
    const month2 = new Date(currentMonth);
    month2.setMonth(month2.getMonth() + 1);

    const renderMonth = (month: Date) => {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const days = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }

      const weeks = [];
      for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
      }

      return (
        <div className="flex flex-col">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">
              {monthNames[monthIndex]} {year}
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return <div key={dayIndex} className="aspect-square" />;
                }
                const date = new Date(year, monthIndex, day);
                const dayEvents = getEventsForDate(date);
                const hasEvents = dayEvents.length > 0;
                const isSelected = isDateInSelectedEvent(date);
                const eventNames = hasEvents ? dayEvents.map((e) => e.event_name) : [];

                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDayClick(date)}
                    className={`aspect-square border rounded p-1 text-xs flex flex-col relative cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : hasEvents
                          ? 'bg-blue-50 border-blue-300'
                          : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{day}</div>
                    {hasEvents && (
                      <div className="flex-1 flex flex-col justify-start mt-1 overflow-hidden">
                        {eventNames.slice(0, 2).map((name, idx) => (
                          <div
                            key={idx}
                            className={`text-[8px] leading-tight truncate ${
                              isSelected ? 'text-blue-200' : 'text-blue-600'
                            }`}
                            title={name}
                          >
                            {name}
                          </div>
                        ))}
                        {eventNames.length > 2 && (
                          <div
                            className={`text-[8px] ${
                              isSelected ? 'text-blue-200' : 'text-blue-600'
                            }`}
                          >
                            +{eventNames.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              ←
            </button>
            <span className="text-sm text-gray-600">Move Left</span>
          </div>
          {renderMonth(month1)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Move Right</span>
            <button
              onClick={() => navigateMonth('next')}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              →
            </button>
          </div>
          {renderMonth(month2)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-white px-6 py-10">
        <div className="flex flex-row items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Industry Events</h1>
        </div>
        <p className="text-gray-500">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white px-6 py-10">
      <div className="flex flex-row items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Industry Events</h1>
        <button
          onClick={() => router.push('/logged/pages/events/create')}
          className="px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-900"
        >
          Create event
        </button>
      </div>

      <EventFilter
        onFilter={setFilterParams}
        initialParams={filterParams}
      />

      {viewMode === 'months' ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {renderCalendar()}
            </div>
          </div>

          <div className="lg:w-1/3">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-gray-500">No events available</p>
              ) : (
                events
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((event) => {
                    const isSelected = isEventSelected(event.id_fair);
                    return (
                      <div
                        key={event.id_fair}
                        onClick={() => handleEventClick(event)}
                        className={`flex flex-row gap-4 border rounded-lg overflow-hidden p-4 cursor-pointer transition-all items-center ${
                          isSelected
                            ? 'bg-blue-900 border-blue-900 text-white shadow-lg'
                            : 'border-gray-200 hover:shadow-md'
                        }`}
                      >
                        {event.event_main_image?.trim() && (
                          <div className="mb-2  rounded-lg overflow-hidden border border-gray-200" style={{ width: '100px', height: '100px' }}>
                            <img
                              src={event.event_main_image}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <div className="flex flex-col">
                        <h3
                          className={`font-semibold text-lg mb-2 transition-colors ${
                            isSelected ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {event.event_name}
                        </h3>
                        <p className={`text-sm mb-2 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                          {event.main_description}
                        </p>
                        <div className={`text-xs space-y-1 ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                          <div>
                            <span className="font-medium">Location: </span>
                            {event.location}
                          </div>
                          <div>
                            <span className="font-medium">Date: </span>
                            {new Date(event.start_date).toLocaleDateString()}
                            {event.start_date !== event.end_date && (
                              <> - {new Date(event.end_date).toLocaleDateString()}</>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Region: </span>
                            {event.region}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <button
            onClick={() => {
              setViewMode('months');
              setSelectedDay(null);
            }}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm self-start"
          >
            ← Back to Calendar
          </button>

          {selectedDay && (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateDay('prev')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  ← Previous Day
                </button>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{selectedDay.getDate()}</div>
                  <div className="text-xl text-gray-600 capitalize">
                    {selectedDay.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className="text-lg text-gray-500 capitalize">
                    {selectedDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => navigateDay('next')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Next Day →
                </button>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Events</h3>
                {getEventsForDate(selectedDay).length === 0 ? (
                  <p className="text-gray-500">No events scheduled for this day</p>
                ) : (
                  <div className="space-y-4">
                    {getEventsForDate(selectedDay).map((event) => {
                      const dayInfo = getEventDayNumber(event, selectedDay);
                      return (
                        <div
                          key={event.id_fair}
                          onClick={() => handleEventClick(event)}
                          className="border border-gray-200 rounded-lg overflow-hidden p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          {event.event_main_image?.trim() && (
                            <div className="mb-2 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                              <img
                                src={event.event_main_image}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          )}
                          <h4 className="font-semibold text-lg text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                            {event.event_name}
                            {dayInfo && (
                              <span className="ml-2 text-sm text-gray-500">
                                ({dayInfo.current}/{dayInfo.total})
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">{event.main_description}</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>
                              <span className="font-medium">Location: </span>
                              {event.location}
                            </div>
                            <div>
                              <span className="font-medium">Date: </span>
                              {new Date(event.start_date).toLocaleDateString()}
                              {event.start_date !== event.end_date && (
                                <> - {new Date(event.end_date).toLocaleDateString()}</>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Region: </span>
                              {event.region}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IndustryEvents;
