"use client";

import { DateInputs, buildDateStr } from "@/app/logged/logged_components/date_components/DateInputs";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

interface Props {
  isDateField: boolean;
  useRichEditor: boolean;
  currentValue: string;
  onChangeCurrentValue: (v: string) => void;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  setDateDay: (v: string) => void;
  setDateMonth: (v: string) => void;
  setDateYear: (v: string) => void;
}

export function EditContentsValueArea({
  isDateField,
  useRichEditor,
  currentValue,
  onChangeCurrentValue,
  dateDay,
  dateMonth,
  dateYear,
  setDateDay,
  setDateMonth,
  setDateYear,
}: Props) {
  if (isDateField) {
    return (
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Date</div>
        <DateInputs
          day={dateDay}
          month={dateMonth}
          year={dateYear}
          onDayChange={(v) => {
            setDateDay(v);
            onChangeCurrentValue(buildDateStr(v, dateMonth, dateYear));
          }}
          onMonthChange={(v) => {
            setDateMonth(v);
            onChangeCurrentValue(buildDateStr(dateDay, v, dateYear));
          }}
          onYearChange={(v) => {
            setDateYear(v);
            onChangeCurrentValue(buildDateStr(dateDay, dateMonth, v));
          }}
        />
      </div>
    );
  }

  if (useRichEditor) {
    return (
      <div className="mb-4">
        <RichTextEditor
          value={currentValue}
          onChange={onChangeCurrentValue}
          placeholder="Type here..."
          minHeight="192px"
        />
      </div>
    );
  }

  return (
    <textarea
      className="mb-4 h-48 w-full resize-none rounded-md border border-gray-300 p-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={currentValue}
      onChange={(event) => onChangeCurrentValue(event.target.value)}
    />
  );
}
