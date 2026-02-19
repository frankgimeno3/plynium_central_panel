"use client";

import { FC } from 'react';
import Link from 'next/link';
import { useAdvertisements, TabFilter } from '../hooks/useAdvertisements';

interface AdvertisementTableProps {}

const AdvertisementTable: FC<AdvertisementTableProps> = () => {
  const {
    currentTab,
    setCurrentTab,
    currentPage,
    setCurrentPage,
    paginatedAdvertisements,
    counts,
    totalPages
  } = useAdvertisements();

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatState = (state: string): string => {
    return state
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'in process', label: 'In Process' },
    { key: 'other', label: 'Other' }
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCurrentTab(tab.key)}
            className={`
              relative px-6 py-3 text-sm font-medium transition-colors
              ${currentTab === tab.key
                ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
            {tab.key === 'pending' && counts.pending > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-950 rounded-full">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-b-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAdvertisements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No advertisement requests found for this filter.
                  </td>
                </tr>
              ) : (
                paginatedAdvertisements.map((advertisement) => (
                  <tr
                    key={advertisement.idAdvReq}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/logged/pages/advertisement/${encodeURIComponent(advertisement.idAdvReq)}`}
                        className="text-sm text-gray-900 hover:text-blue-950"
                      >
                        {advertisement.idAdvReq}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/logged/pages/advertisement/${encodeURIComponent(advertisement.idAdvReq)}`}
                        className="text-sm text-gray-900 hover:text-blue-950"
                      >
                        {advertisement.senderEmail}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/logged/pages/advertisement/${encodeURIComponent(advertisement.idAdvReq)}`}
                        className="text-sm text-gray-900 hover:text-blue-950"
                      >
                        {advertisement.senderCompany}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/logged/pages/advertisement/${encodeURIComponent(advertisement.idAdvReq)}`}
                        className="text-sm text-gray-900 hover:text-blue-950"
                      >
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {formatState(advertisement.advReqState)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/logged/pages/advertisement/${encodeURIComponent(advertisement.idAdvReq)}`}
                        className="text-sm text-gray-500 hover:text-blue-950"
                      >
                        {formatDate(advertisement.senderDate)}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`
                  relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md
                  ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`
                  ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md
                  ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`
                      relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium
                      ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                      }
                    `}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`
                      relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium
                      ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                      }
                    `}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertisementTable;
