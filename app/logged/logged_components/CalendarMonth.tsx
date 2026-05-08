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
    <div className="flex w-full flex-col text-gray-100">
      <div className="mb-2 grid grid-cols-7 gap-x-1 gap-y-1 md:mb-3 md:gap-x-1.5">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-0.5 text-center text-[10px] font-medium text-slate-400 md:text-xs"
          >
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-x-1 gap-y-1 md:gap-x-1.5 md:gap-y-1.5">
          {week.map((day, dayIndex) => {
            if (day === null) return <div key={dayIndex} className="h-[5.25rem] md:h-[5.75rem]" />;

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
                className={`relative flex h-[5.25rem] cursor-pointer flex-col rounded-md border border-slate-600 bg-slate-800/50 p-1 text-xs transition-all hover:bg-slate-700/50 md:h-[5.75rem] md:p-1.5 md:text-sm ${
                  isToday
                    ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-900 md:ring-offset-2"
                    : ""
                }`}
              >
                <div
                  className={`shrink-0 font-medium leading-none ${
                    isToday ? "text-blue-300" : "text-slate-200"
                  }`}
                >
                  {day}
                </div>
                {hasEvents && (
                  <div className="mt-0.5 flex flex-1 flex-col gap-0.5 overflow-hidden overflow-y-auto md:mt-1 md:gap-1">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id_event}
                        className={`truncate rounded border px-1 py-0.5 text-[10px] font-medium leading-tight md:text-xs ${
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

