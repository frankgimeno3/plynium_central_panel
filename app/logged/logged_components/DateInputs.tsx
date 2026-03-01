"use client";

import React, { FC } from "react";

export function parseDateFields(dateStr: string): { day: string; month: string; year: string } {
  const norm = !dateStr ? "" : dateStr.split("T")[0] ?? "";
  if (!norm || norm.length < 10) return { day: "", month: "", year: "" };
  const [y, m, d] = norm.split("-");
  return {
    day: d ? String(parseInt(d, 10) || "") : "",
    month: m ? String(parseInt(m, 10) || "") : "",
    year: y || "",
  };
}

export function buildDateStr(day: string, month: string, year: string): string {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!day || !month || !year || isNaN(d) || isNaN(m) || isNaN(y)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return "";
  return `${y}-${pad(m)}-${pad(Math.min(d, new Date(y, m, 0).getDate()))}`;
}

interface DateInputsProps {
  day: string;
  month: string;
  year: string;
  onDayChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  error?: string;
  inputClassName?: string;
}

export const DateInputs: FC<DateInputsProps> = ({
  day,
  month,
  year,
  onDayChange,
  onMonthChange,
  onYearChange,
  error,
  inputClassName,
}) => {
  const baseClass =
    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const inputClass = inputClassName ?? `${baseClass} ${error ? "border-red-500" : "border-gray-300"}`;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
        <input
          type="number"
          min={1}
          max={31}
          placeholder="DD"
          value={day}
          onChange={(e) => onDayChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
        <input
          type="number"
          min={1}
          max={12}
          placeholder="MM"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
        <input
          type="number"
          min={1900}
          max={2100}
          placeholder="YYYY"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
};
