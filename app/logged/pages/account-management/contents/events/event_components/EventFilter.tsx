'use client';

import React, { FC, useState, useEffect } from 'react';
import { PortalService } from '@/app/service/PortalService';
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [name, setName] = useState(initialParams.name ?? '');
  const [region, setRegion] = useState(initialParams.region ?? '');
  const [dateFrom, setDateFrom] = useState(initialParams.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialParams.dateTo ?? '');
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [portalChecklist, setPortalChecklist] = useState<string[]>(
    initialParams.portalNames ?? []
  );

  useEffect(() => {
    PortalService.getAllPortals()
      .then((list: any[]) => {
        setPortals(
          Array.isArray(list)
            ? list.map((p) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
            : []
        );
      })
      .catch(() => setPortals([]));
  }, []);

  const toggleFilter = () => setIsFilterOpen((prev) => !prev);

  const togglePortal = (portalName: string) => {
    setPortalChecklist((prev) =>
      prev.includes(portalName)
        ? prev.filter((n) => n !== portalName)
        : [...prev, portalName]
    );
  };

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
      portalNames: [...portalChecklist],
    });
  };

  const handleClear = () => {
    setName('');
    setRegion('');
    setDateFrom('');
    setDateTo('');
    setPortalChecklist([]);
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
    <div className="px-0 mb-6">
      <div
        className="flex flex-col border border-gray-100 shadow-xl text-center py-2 text-xs cursor-pointer hover:bg-gray-100/80 rounded-lg"
        onClick={toggleFilter}
      >
        <p>{isFilterOpen ? 'Click to close filter' : 'Click to open filter'}</p>
      </div>
      {isFilterOpen && (
        <div className="bg-white mt-2 mb-4 shadow-xl border border-gray-100 rounded-lg p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Name (partial match)
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
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Region
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
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Date range - From
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
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Date range - To
              </label>
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                className="w-full"
                placeholder="To date"
                min={dateFrom || undefined}
              />
            </div>

            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Portal (by name)
              </label>
              <div className="flex flex-wrap gap-3">
                {portals.length === 0 ? (
                  <span className="text-gray-400 text-xs">Loading portals...</span>
                ) : (
                  portals.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={portalChecklist.includes(p.name)}
                        onChange={() => togglePortal(p.name)}
                        className="rounded border-gray-300"
                      />
                      <span>{p.name}</span>
                    </label>
                  ))
                )}
              </div>
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
      )}
    </div>
  );
};

export default EventFilter;
