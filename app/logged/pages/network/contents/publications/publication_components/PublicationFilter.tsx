"use client";

import React, { FC, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicationService } from '@/app/service/PublicationService';
import { publicationInterface } from '@/app/contents/interfaces';

export interface PublicationFilterParams {
  dateFrom: string;
  dateTo: string;
  tag: string;
}

interface PublicationFilterProps {
  initialParams?: Partial<PublicationFilterParams>;
  onFilter?: (params: PublicationFilterParams) => void;
}

const PublicationFilterContent: FC<PublicationFilterProps> = ({
  initialParams = {},
  onFilter,
}) => {
  const router = useRouter();
  const [dateFromMonth, setDateFromMonth] = useState('');
  const [dateFromYear, setDateFromYear] = useState('');
  const [dateToMonth, setDateToMonth] = useState('');
  const [dateToYear, setDateToYear] = useState('');
  const [tag, setTag] = useState(initialParams.tag ?? '');
  const [publications, setPublications] = useState<publicationInterface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialParams.tag !== undefined) setTag(initialParams.tag);
    if (initialParams.dateFrom) {
      const [y, m] = initialParams.dateFrom.split('-');
      if (y) setDateFromYear(y);
      if (m) setDateFromMonth(m);
    }
    if (initialParams.dateTo) {
      const [y, m] = initialParams.dateTo.split('-');
      if (y) setDateToYear(y);
      if (m) setDateToMonth(m);
    }
  }, [initialParams.tag, initialParams.dateFrom, initialParams.dateTo]);

  useEffect(() => {
    const loadPublications = async () => {
      try {
        const apiPublications = await PublicationService.getAllPublications();
        setPublications(Array.isArray(apiPublications) ? apiPublications : []);
      } catch (error) {
        console.error('Error loading publications for filter:', error);
        setPublications([]);
      } finally {
        setLoading(false);
      }
    };
    loadPublications();
  }, []);

  const { uniqueMonths, uniqueYears } = useMemo(() => {
    const months = new Set<string>();
    const years = new Set<string>();
    publications.forEach((pub: publicationInterface) => {
      if (pub.date) {
        const date = new Date(pub.date);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        months.add(month);
        years.add(year);
      }
    });
    return {
      uniqueMonths: Array.from(months).sort(),
      uniqueYears: Array.from(years).sort().reverse(),
    };
  }, [publications]);

  const monthNames: { [key: string]: string } = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December',
  };

  const isDateRangeValid = () => {
    const hasAny = !!(dateFromMonth || dateFromYear || dateToMonth || dateToYear);
    const hasAll = !!(dateFromMonth && dateFromYear && dateToMonth && dateToYear);
    return !hasAny || hasAll;
  };

  const dateRangeValid = isDateRangeValid();
  const canApply = dateRangeValid;

  const handleApply = () => {
    if (!canApply) return;
    const params: PublicationFilterParams = {
      dateFrom: dateFromMonth && dateFromYear ? `${dateFromYear}-${dateFromMonth}` : '',
      dateTo: dateToMonth && dateToYear ? `${dateToYear}-${dateToMonth}` : '',
      tag: tag.trim(),
    };
    if (onFilter) {
      onFilter(params);
    } else {
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
      if (params.tag) searchParams.set('tag', params.tag);
      const q = searchParams.toString();
      router.push(
        `/logged/pages/network/contents/publications/search${q ? `?${q}` : ''}`
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filter by date and Filter by tag in row */}
      <div className="flex flex-row flex-wrap gap-6 items-end">
        {/* Filter by date */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <label className="text-base font-medium text-gray-700">Filter by date</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm text-gray-600 mb-1">By range from</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={dateFromMonth}
                onChange={(e) => setDateFromMonth(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Month</option>
                {uniqueMonths.map((month) => (
                  <option key={month} value={month}>
                    {monthNames[month] || month}
                  </option>
                ))}
              </select>
              <select
                value={dateFromYear}
                onChange={(e) => setDateFromYear(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Year</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <span className="block text-sm text-gray-600 mb-1">By range to</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={dateToMonth}
                onChange={(e) => setDateToMonth(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Month</option>
                {uniqueMonths.map((month) => (
                  <option key={month} value={month}>
                    {monthNames[month] || month}
                  </option>
                ))}
              </select>
              <select
                value={dateToYear}
                onChange={(e) => setDateToYear(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Year</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {!dateRangeValid && (dateFromMonth || dateFromYear || dateToMonth || dateToYear) && (
          <p className="text-xs text-red-600">
            Please fill all date fields (From month/year, To month/year) or leave them empty.
          </p>
        )}
        </div>

        {/* Filter by tag */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <label className="text-base font-medium text-gray-700">Filter by tag</label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Type a tag..."
            className="w-full max-w-xs rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
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

const PublicationFilter: FC<PublicationFilterProps> = (props) => {
  return <PublicationFilterContent {...props} />;
};

export default PublicationFilter;
