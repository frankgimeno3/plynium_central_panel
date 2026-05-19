"use client";

import { FC } from "react";
import { TabId } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { IssueDetailAutoSaveStatus } from "./IssueDetailAutoSaveStatus";

export type IssueDetailTabBarProps = {
  activeTab: TabId;
  onSelectData: () => void;
  onSelectFlatplan: () => void;
  onSelectContentsManager: () => void;
  slotsCount: number;
  showAutoSaveStatus: boolean;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  hasPubChanges: boolean;
};

export const IssueDetailTabBar: FC<IssueDetailTabBarProps> = ({
  activeTab,
  onSelectData,
  onSelectFlatplan,
  onSelectContentsManager,
  slotsCount,
  showAutoSaveStatus,
  autoSaveStatus,
  hasPubChanges,
}) => {
  return (
    <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
      <button
        type="button"
        onClick={onSelectData}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "data"
            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        Data
      </button>
      <button
        type="button"
        onClick={onSelectFlatplan}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "flatplan"
            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        Flatplan
        <span className="ml-2 text-xs text-gray-500">({slotsCount} slots)</span>
      </button>
      <button
        type="button"
        onClick={onSelectContentsManager}
        className={`px-6 py-3 text-sm font-medium transition-colors ${
          activeTab === "contentsManager"
            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        Publication Contents Manager
      </button>
      <div className="flex-1" />
      {showAutoSaveStatus ? (
        <div className="flex items-center mr-3 text-xs">
          <IssueDetailAutoSaveStatus
            autoSaveStatus={autoSaveStatus}
            hasPubChanges={hasPubChanges}
          />
        </div>
      ) : null}
    </div>
  );
};
