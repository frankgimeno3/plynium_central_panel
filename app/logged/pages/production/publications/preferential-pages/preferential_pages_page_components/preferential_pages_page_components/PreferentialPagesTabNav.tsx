"use client";

import type { PreferentialPagesTabId } from "../preferential_pages_types";

type PreferentialPagesTabNavProps = {
  activeTab: PreferentialPagesTabId;
  onTabChange: (tab: PreferentialPagesTabId) => void;
};

export function PreferentialPagesTabNav({
  activeTab,
  onTabChange,
}: PreferentialPagesTabNavProps) {
  return (
    <div className="flex overflow-hidden rounded-t-lg border-b border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => onTabChange("table-format")}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "table-format"
            ? "border-b-2 border-blue-950 bg-white text-blue-950"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        Table format
      </button>
      <button
        type="button"
        onClick={() => onTabChange("ui-format")}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "ui-format"
            ? "border-b-2 border-blue-950 bg-white text-blue-950"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        UI format
      </button>
    </div>
  );
}
