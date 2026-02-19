"use client"
import React, { FC, useState } from 'react';
import Link from 'next/link';

interface ArticleFilterProps {}

type FilterType = 'date' | 'title' | 'company';

const ArticleFilter: FC<ArticleFilterProps> = ({ }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('date');
  const [filterValue, setFilterValue] = useState('');

  const toggleFilter = () => {
    setIsFilterOpen(prev => !prev);
  };

  const handleSelectFilter = (filter: FilterType) => {
    setSelectedFilter(filter);
    setFilterValue('');
  };

  const isFilterButtonEnabled = filterValue.trim() !== '';

  const getFilterHref = () => {
    if (!isFilterButtonEnabled) return '#';
    const searchParam = `${selectedFilter}__${filterValue.trim()}`;
    return `/logged/pages/articles/search/${encodeURIComponent(searchParam)}`;
  };

  return (
    <div className='px-36 mx-7'>
      <div
        className='flex flex-col border border-gray-100 shadow-xl text-center py-2 text-xs cursor-pointer hover:bg-gray-100/80'
        onClick={toggleFilter}
      >
        <p>{isFilterOpen ? 'Click to close filter' : 'Click to open filter'}</p>
      </div>
      {isFilterOpen && (
        <div className='h-56 bg-white mb-12 shadow-xl border border-gray-100'>
          <div className='flex flex-row p-5 w-full justify-between px-24'>
            <button
              onClick={() => handleSelectFilter('date')}
              className={`px-4 py-2 text-xs rounded-lg shadow-sm ${
                selectedFilter === 'date'
                  ? 'bg-blue-950 text-white'
                  : 'bg-gray-100 hover:bg-gray-100/50 text-gray-700 cursor-pointer'
              }`}
            >
              Filter by date
            </button>
            <button
              onClick={() => handleSelectFilter('title')}
              className={`px-4 py-2 text-xs rounded-lg shadow-sm ${
                selectedFilter === 'title'
                  ? 'bg-blue-950 text-white'
                  : 'bg-gray-100 hover:bg-gray-100/50 text-gray-700 cursor-pointer'
              }`}
            >
              Filter by title
            </button>
            <button
              onClick={() => handleSelectFilter('company')}
              className={`px-4 py-2 text-xs rounded-lg shadow-sm ${
                selectedFilter === 'company'
                  ? 'bg-blue-950 text-white'
                  : 'bg-gray-100 hover:bg-gray-100/50 text-gray-700 cursor-pointer'
              }`}
            >
              Filter by company
            </button>
          </div>

          <div className='px-24 pb-5'>
            <div className='flex flex-row items-center gap-4 bg-white border border-gray-100 shadow-xl rounded-lg px-4 py-3'>
              {selectedFilter === 'date' && (
                <input
                  type='date'
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  className='bg-white border-none outline-none text-sm w-full placeholder:text-gray-200'
                  placeholder='Select a date to filter'
                />
              )}
              {selectedFilter === 'title' && (
                <input
                  type='text'
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  className='bg-white border-none outline-none text-sm w-full placeholder:text-gray-200'
                  placeholder='Type a title to filter'
                />
              )}
              {selectedFilter === 'company' && (
                <input
                  type='text'
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  className='bg-white border-none outline-none text-sm w-full placeholder:text-gray-200'
                  placeholder='Type a company to filter'
                />
              )}
              {isFilterButtonEnabled ? (
                <Link
                  href={getFilterHref()}
                  className='px-3 py-1 text-xs cursor-pointer rounded-lg shadow-xl bg-blue-950 text-white inline-block'
                >
                  Filter
                </Link>
              ) : (
                <button
                  disabled
                  className='px-3 py-1 text-xs rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed'
                >
                  Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleFilter;
