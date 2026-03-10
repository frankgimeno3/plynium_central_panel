'use client';

import React, { FC, useState } from 'react';
import DatePicker from '@/app/logged/logged_components/DatePicker';

const REGIONS = [
  'EUROPE',
  'AFRICA',
  'ASIA',
  'INDIA',
  'CHINA',
  'OCEANIA',
  'NORTH AMERICA',
  'LATAM',
] as const;

export interface EventFilterParams {
  name: string;
  region: string;
  dateFrom: string;
  dateTo: string;
  portalNames: string[];
}

interface EventFilterProps {
  onFilter: (params: EventFilterParams) => void;
  initialParams?: Partial<EventFilterParams>;
}

const EventFilter: FC<EventFilterProps> = ({ onFilter, initialParams = {} }) => {
  const [name, setName] = useState(initialParams.name ?? '');
  const [region, setRegion] = useState(initialParams.region ?? '');
  const [dateFrom, setDateFrom] = useState(initialParams.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialParams.dateTo ?? '');

  const isDateRangeValid = () => {
    const hasFrom = !!dateFrom;
    const hasTo = !!dateTo;
    return !hasFrom && !hasTo ? true : hasFrom && hasTo;
  };

  const handleApply = () => {
    if (!isDateRangeValid()) return;
    onFilter({
      name: name.trim(),
      region: region.trim(),
      dateFrom: dateFrom.trim(),
      dateTo: dateTo.trim(),
      portalNames: initialParams.portalNames ?? [],
    });
  };

  const handleClear = () => {
    setName('');
    setRegion('');
    setDateFrom('');
    setDateTo('');
    onFilter({
      name: '',
      region: '',
      dateFrom: '',
      dateTo: '',
      portalNames: [],
    });
  };

  const dateRangeValid = isDateRangeValid();
  const canApply = dateRangeValid;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Event Name (partial match)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Search event name..."
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Event Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">All regions</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Event Date range - From
              </label>
              <DatePicker
                value={dateFrom}
                onChange={setDateFrom}
                className="w-full"
                placeholder="From date"
                max={dateTo || undefined}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Event Date range - To
              </label>
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                className="w-full"
                placeholder="To date"
                min={dateFrom || undefined}
              />
            </div>

          </div>

      {!dateRangeValid && (dateFrom || dateTo) && (
        <div className="mt-2 text-xs text-red-600">
          Please fill both From and To dates for the date range, or leave both empty.
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          Clear
        </button>
        <button
          onClick={handleApply}
          disabled={!canApply}
          className={`px-4 py-2 text-sm rounded-lg ${
            canApply
              ? 'bg-blue-950 text-white hover:bg-blue-900 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Apply filter
        </button>
      </div>
    </div>
  );
};

export default EventFilter;
