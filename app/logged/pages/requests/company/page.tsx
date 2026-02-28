"use client";

import { FC, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyRequests, RequestState } from '../hooks/useCompanyRequests';

type TabFilter = RequestState;

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

const CompanyRequestsPage: FC = () => {
  const router = useRouter();
  const { requests } = useCompanyRequests();
  const [currentTab, setCurrentTab] = useState<TabFilter>('Pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRequests = useMemo(() => {
    const filtered = requests.filter(r => r.request_state === currentTab);
    return filtered.sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
  }, [requests, currentTab]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const counts = useMemo(() => ({
    Pending: requests.filter(r => r.request_state === 'Pending').length,
    'In Process': requests.filter(r => r.request_state === 'In Process').length,
    Other: requests.filter(r => r.request_state === 'Other').length
  }), [requests]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'Pending', label: 'Pending' },
    { key: 'In Process', label: 'In Process' },
    { key: 'Other', label: 'Other' }
  ];

  const handleRowClick = (id: string) => {
    router.push(`/logged/pages/requests/company/${encodeURIComponent(id)}`);
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Create a Company Requests</p>
        <p className="text-sm text-blue-100 mt-1">Requests from users to add a company profile to the directory</p>
      </div>
      <div className="px-6 py-6">
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setCurrentTab(tab.key); setCurrentPage(1); }}
                className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                  currentTab === tab.key
                    ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.key === 'Pending' && counts.Pending > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-950 rounded-full">
                    {counts.Pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-white shadow-sm rounded-b-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No company requests found for this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req) => (
                      <tr
                        key={req.companyRequestId}
                        onClick={() => handleRowClick(req.companyRequestId)}
                        className="hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{req.companyRequestId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.userId}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{req.content.nombre_comercial}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.content.pais_empresa}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            req.request_state === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            req.request_state === 'In Process' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {req.request_state}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.request_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center py-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyRequestsPage;
