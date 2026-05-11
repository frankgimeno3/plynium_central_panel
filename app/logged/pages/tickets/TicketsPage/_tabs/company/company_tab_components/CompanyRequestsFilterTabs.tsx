"use client";

import type { RequestState } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";

type TabFilter = RequestState;

type Props = {
  tabs: { key: TabFilter; label: string }[];
  currentTab: TabFilter;
  onTabChange: (key: TabFilter) => void;
  pendingCount: number;
  counts: Record<TabFilter, number>;
};

export default function CompanyRequestsFilterTabs({
  tabs,
  currentTab,
  onTabChange,
  pendingCount,
  counts,
}: Props) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`
              relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
              ${
                currentTab === tab.key
                  ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
        >
          {tab.label}
          {tab.key === "Pending" && pendingCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-950 rounded-full">
              {pendingCount}
            </span>
          )}
          {tab.key !== "Pending" && tab.key !== "Done" && counts[tab.key] > 0 && (
            <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none bg-gray-200 text-gray-700">
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
