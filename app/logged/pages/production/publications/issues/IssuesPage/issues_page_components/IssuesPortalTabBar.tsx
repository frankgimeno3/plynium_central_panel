"use client";

import type { PortalRow } from "./types";

type IssuesPortalTabBarProps = {
  portalTabs: PortalRow[];
  activePortalId: number | null;
  onPortalChange: (portalId: number) => void;
};

export function IssuesPortalTabBar({
  portalTabs,
  activePortalId,
  onPortalChange,
}: IssuesPortalTabBarProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-hidden px-2">
      {portalTabs.map((portal) => (
        <button
          key={portal.id}
          type="button"
          onClick={() => onPortalChange(Number(portal.id))}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
            activePortalId === Number(portal.id)
              ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {portal.key}
        </button>
      ))}
      {portalTabs.length === 0 ? (
        <span className="text-sm text-gray-500 py-3 px-2">No portals configured.</span>
      ) : null}
    </div>
  );
}
