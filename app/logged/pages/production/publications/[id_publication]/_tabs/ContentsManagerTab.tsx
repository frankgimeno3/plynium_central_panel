"use client";

import React, { useState } from "react";
import { ShouldBeInMagazinePanel } from "./contents_manager/panels/ShouldBeInMagazinePanel";
import { AvailableArticlesPanel } from "./contents_manager/panels/AvailableArticlesPanel";

export type ContentsManagerSubTabId = "should_be_in_magazine" | "available_articles";

export type ContentsManagerTabProps = {
  publicationId: string;
};

const SUB_TABS: { id: ContentsManagerSubTabId; label: string; description: string }[] = [
  {
    id: "should_be_in_magazine",
    label: "Should be in magazine",
    description:
      "Projects contracted for this publication: assign each one to a slot and attach media when needed.",
  },
  {
    id: "available_articles",
    label: "Available unused articles",
    description:
      "Articles already published in the portal that can be adapted into magazine pages, plus the ones already selected.",
  },
];

/**
 * Top-level body for the "Contents Manager" tab. Owns the active sub-tab and
 * delegates rendering to the dedicated sub-panels:
 *   - ShouldBeInMagazinePanel  (D.5)
 *   - AvailableArticlesPanel   (D.7)
 */
export function ContentsManagerTab({ publicationId }: ContentsManagerTabProps) {
  const [activeSubTab, setActiveSubTab] =
    useState<ContentsManagerSubTabId>("should_be_in_magazine");
  const activeMeta = SUB_TABS.find((t) => t.id === activeSubTab) ?? SUB_TABS[0];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Contents Manager</p>
          <p className="text-xs text-gray-500">{activeMeta.description}</p>
        </div>
      </div>

      <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
        {SUB_TABS.map((tab) => {
          const isActive = tab.id === activeSubTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-white text-blue-950 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {activeSubTab === "should_be_in_magazine" ? (
          <ShouldBeInMagazinePanel publicationId={publicationId} />
        ) : (
          <AvailableArticlesPanel publicationId={publicationId} />
        )}
      </div>
    </div>
  );
}
