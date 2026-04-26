"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchNotifications, type UnifiedNotification } from "@/app/contents/notifications.types";

type TicketState = "pending" | "in_process" | "solved" | "other";

const BASE = "/logged/pages/tickets";

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const ProductTicketsTab: FC = () => {
  const router = useRouter();
  const [tickets, setTickets] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TicketState>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    fetchNotifications({ notification_type: "product" })
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const list = tickets.filter((t) => String(t.state) === currentTab);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tickets, currentTab]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const counts = useMemo(
    () => ({
      pending: tickets.filter((t) => t.state === "pending").length,
      in_process: tickets.filter((t) => t.state === "in_process").length,
      solved: tickets.filter((t) => t.state === "solved").length,
      other: tickets.filter((t) => t.state === "other").length,
    }),
    [tickets]
  );

  const tabs: { key: TicketState; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "in_process", label: "In Process" },
    { key: "other", label: "Other" },
    { key: "solved", label: "Solved" },
  ];

  const handleRowClick = (id: string) => {
    router.push(`${BASE}/products/${encodeURIComponent(id)}`);
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-6">
      <p className="text-sm text-gray-500 mb-4">Directory product creation tickets (panel_ticket_type = product)</p>
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setCurrentTab(tab.key);
              setCurrentPage(1);
            }}
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              currentTab === tab.key
                ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.key === "pending" && counts.pending > 0 && (
              <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                {counts.pending}
              </span>
            )}
            {tab.key !== "pending" && tab.key !== "solved" && counts[tab.key] > 0 && (
              <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none bg-gray-200 text-gray-700">
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No product tickets found for this filter.
                </td>
              </tr>
            ) : (
              paginated.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => handleRowClick(t.id)}
                  className="hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{t.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.sender_company || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{t.brief_description || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.state}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(t.date)}</td>
                </tr>
              ))
            )}
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
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

export default ProductTicketsTab;

