"use client";

import type { TabId } from "./types";

type IssuesLifecycleTabBarProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  inDevelopmentCount: number;
  forecastedCount: number;
  expiredTotalCount: number;
  onRefresh: () => void;
};

export function IssuesLifecycleTabBar({
  activeTab,
  onTabChange,
  inDevelopmentCount,
  forecastedCount,
  expiredTotalCount,
  onRefresh,
}: IssuesLifecycleTabBarProps) {
  return (
    <div className="flex border-b border-gray-200 bg-gray-50 overflow-hidden">
      <button
        type="button"
        onClick={() => onTabChange("development")}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "development"
            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        In development
        <span className="ml-2 text-xs text-gray-500">({inDevelopmentCount})</span>
      </button>
      <button
        type="button"
        onClick={() => onTabChange("forecasted")}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "forecasted"
            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        Forecasted
        <span className="ml-2 text-xs text-gray-500">({forecastedCount})</span>
      </button>
      <button
        type="button"
        onClick={() => onTabChange("expired")}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "expired"
            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        Expired
        <span className="ml-2 text-xs text-gray-500">({expiredTotalCount})</span>
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onRefresh}
        className="px-4 py-2 my-2 mr-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Refresh
      </button>
    </div>
  );
}
