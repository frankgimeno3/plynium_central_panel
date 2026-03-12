import React from "react";

type DayEvent = {
  id_event: string;
  id_customer: string;
  event_type: string;
};

type RenderMonthParams = {
  month: Date;
  today: Date;
  weekDays: string[];
  getPmEventsForDate: (date: Date) => DayEvent[];
  handleDayClick: (date: Date) => void;
  eventTypeLabel: Record<string, string>;
  eventTypeCardColor: Record<string, string>;
  getCustomerName: (id: string) => string;
};

export const renderMonth = ({
  month,
  today,
  weekDays,
  getPmEventsForDate,
  handleDayClick,
  eventTypeLabel,
  eventTypeCardColor,
  getCustomerName,
}: RenderMonthParams) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const days: (number | null)[] = [
    ...Array(startingDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to 6 weeks (42 cells) so every month has the same grid height
  const PAD_TO_CELLS = 6 * 7;
  while (days.length < PAD_TO_CELLS) days.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < PAD_TO_CELLS; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col text-gray-100 w-full">
      <div className="grid grid-cols-7 gap-x-2 gap-y-4 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-slate-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-x-2 gap-y-4">
          {week.map((day, dayIndex) => {
            if (day === null) return <div key={dayIndex} className="aspect-square" />;

            const date = new Date(year, monthIndex, day);
            const dayEvents = getPmEventsForDate(date);
            const hasEvents = dayEvents.length > 0;
            const isToday =
              year === today.getFullYear() &&
              monthIndex === today.getMonth() &&
              day === today.getDate();

            return (
              <div
                key={dayIndex}
                onClick={() => handleDayClick(date)}
                className={`aspect-square border rounded-lg p-2 text-sm flex flex-col relative cursor-pointer transition-all bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 ${
                  isToday
                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                    : ""
                }`}
              >
                <div
                  className={`font-medium shrink-0 ${
                    isToday ? "text-blue-300" : "text-slate-200"
                  }`}
                >
                  {day}
                </div>
                {hasEvents && (
                  <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden overflow-y-auto">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id_event}
                        className={`px-1.5 py-0.5 rounded text-base font-medium border truncate ${
                          eventTypeCardColor[ev.event_type] ??
                          "bg-slate-600/80 text-slate-100 border-slate-500"
                        }`}
                        title={`${
                          eventTypeLabel[ev.event_type] ?? ev.event_type
                        } - ${getCustomerName(ev.id_customer)}`}
                      >
                        {eventTypeLabel[ev.event_type] ?? ev.event_type} -{" "}
                        {getCustomerName(ev.id_customer)}
                      </div>
                    ))}
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

