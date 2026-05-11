"use client";

import { FC, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOtherRequests, RequestState } from "@/app/logged/pages/tickets/hooks/useOtherRequests";
import OtherCommunicationsFilterTabs from "./other_tab_components/OtherCommunicationsFilterTabs";
import OtherCommunicationsTableBody from "./other_tab_components/OtherCommunicationsTableBody";

const BASE = "/logged/pages/tickets";

type TabFilter = RequestState;

const OtherTab: FC = () => {
  const router = useRouter();
  const { requests } = useOtherRequests();
  const [currentTab, setCurrentTab] = useState<TabFilter>("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => r.request_state === currentTab);
  }, [requests, currentTab]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.request_state === "Pending").length,
    [requests]
  );

  const counts = useMemo(
    () => ({
      Pending: pendingCount,
      "In Process": requests.filter((r) => r.request_state === "In Process").length,
      Done: requests.filter((r) => r.request_state === "Done").length,
      Other: requests.filter((r) => r.request_state === "Other").length,
    }),
    [requests, pendingCount]
  );

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "Pending", label: "Pending" },
    { key: "In Process", label: "In Process" },
    { key: "Other", label: "Other" },
    { key: "Done", label: "Done" },
  ];

  const handleRowClick = (reqId: string) => {
    router.push(`${BASE}/other/${encodeURIComponent(reqId)}`);
  };

  return (
    <div className="p-6">
      <p className="text-sm text-gray-500 mb-4">General contact and inquiry requests</p>
      <OtherCommunicationsFilterTabs
        tabs={tabs}
        currentTab={currentTab}
        onTabChange={(key) => {
          setCurrentTab(key);
          setCurrentPage(1);
        }}
        pendingCount={pendingCount}
        counts={counts}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <OtherCommunicationsTableBody rows={paginatedRequests} onRowClick={handleRowClick} />
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

export default OtherTab;
