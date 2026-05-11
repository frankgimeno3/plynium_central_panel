"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { useAdvertisements, TabFilter } from "@/app/logged/pages/tickets/hooks/useAdvertisements";
import AdvertisementQuotationsFilterTabs from "./quotations_tab_components/AdvertisementQuotationsFilterTabs";
import AdvertisementQuotationsTableBody from "./quotations_tab_components/AdvertisementQuotationsTableBody";

const BASE = "/logged/pages/tickets";

const QuotationsTab: FC = () => {
  const router = useRouter();
  const {
    currentTab,
    setCurrentTab,
    currentPage,
    setCurrentPage,
    paginatedAdvertisements,
    totalPages,
    counts,
  } = useAdvertisements();

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "in process", label: "In Process" },
    { key: "other", label: "Other" },
  ];

  return (
    <div className="p-6">
      <p className="text-sm text-gray-500 mb-4">Requests from companies to advertise their products or services</p>
      <AdvertisementQuotationsFilterTabs
        tabs={tabs}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        counts={counts}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sender Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sender Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AdvertisementQuotationsTableBody
              rows={paginatedAdvertisements}
              onRowClick={(id) => router.push(`${BASE}/quotations/${encodeURIComponent(id)}`)}
            />
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center py-4 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsTab;
