'use client';

import React, { FC, useState, useEffect } from 'react';

/** Converts YYYY-MM-DD to dd/mm/yyyy for display */
function toDisplayValue(iso: string): string {
  if (!iso || iso.length < 10) return '';
  const [y, m, d] = iso.split('-');
  if (!d || !m || !y) return '';
  return `${d}/${m}/${y}`;
}

/** Converts dd/mm/yyyy string to YYYY-MM-DD if valid, otherwise returns '' */
function toIso(display: string): string {
  const cleaned = display.replace(/\D/g, '');
  if (cleaned.length !== 8) return '';
  const dd = cleaned.slice(0, 2);
  const mm = cleaned.slice(2, 4);
  const yy = cleaned.slice(4, 8);
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yy, 10);
  if (month < 1 || month > 12) return '';
  const lastDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDay) return '';
  if (year < 1900 || year > 2100) return '';
  return `${yy}-${mm}-${dd}`;
}

/** Returns true if display string is complete dd/mm/yyyy and valid */
export function isCompleteValidDate(display: string): boolean {
  return toIso(display).length > 0;
}

interface DateInputDdMmYyyyProps {
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  'data-testid'?: string;
}

const DateInputDdMmYyyy: FC<DateInputDdMmYyyyProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'dd/mm/yyyy',
  min,
  max,
  'data-testid': dataTestId,
}) => {
  const [display, setDisplay] = useState(() => (value ? toDisplayValue(value) : ''));
  const [lastEmittedIso, setLastEmittedIso] = useState(value);

  useEffect(() => {
    if (value !== lastEmittedIso) {
      const d = value ? toDisplayValue(value) : '';
      setDisplay(d);
      setLastEmittedIso(value);
    }
  }, [value]);

  const formatInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = formatInput(e.target.value);
    setDisplay(next);
    const iso = toIso(next);
    if (iso) {
      setLastEmittedIso(iso);
      onChange(iso);
    } else {
      setLastEmittedIso('');
      onChange('');
    }
  };

  const handleBlur = () => {
    const iso = toIso(display);
    if (iso) {
      setLastEmittedIso(iso);
      onChange(iso);
      setDisplay(toDisplayValue(iso));
    } else if (display.trim() !== '') {
      setDisplay('');
      setLastEmittedIso('');
      onChange('');
    }
  };

  const isValid = toIso(display).length > 0;
  const showInvalid = display.length >= 8 && !isValid;

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      maxLength={10}
      data-testid={dataTestId}
      className={`w-full rounded-md border p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
        showInvalid ? 'border-red-500 bg-red-50' : 'border-gray-300'
      } ${className}`}
      aria-invalid={showInvalid}
      aria-label={placeholder}
    />
  );
};

export default DateInputDdMmYyyy;
