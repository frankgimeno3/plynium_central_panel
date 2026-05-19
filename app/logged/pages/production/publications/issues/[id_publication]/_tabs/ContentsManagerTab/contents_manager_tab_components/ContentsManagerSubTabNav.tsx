"use client";

import type { ContentsManagerSubTabId } from "./types";
import { CONTENTS_MANAGER_SUB_TABS } from "./subTabs";

type ContentsManagerSubTabNavProps = {
  activeSubTab: ContentsManagerSubTabId;
  onChange: (subTab: ContentsManagerSubTabId) => void;
  description: string;
};

export function ContentsManagerSubTabNav({
  activeSubTab,
  onChange,
  description,
}: ContentsManagerSubTabNavProps) {
  return (
    <>
      <div>
        <p className="text-sm font-semibold text-gray-700">Publication Contents Manager</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
        {CONTENTS_MANAGER_SUB_TABS.map((tab) => {
          const isActive = tab.id === activeSubTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
