"use client";

import type { PublicationsListSubTab } from "../types";

type MagazinePublicationsTabNavProps = {
  publicationsTab: PublicationsListSubTab;
  onPublicationsTabChange: (tab: PublicationsListSubTab) => void;
};

export function MagazinePublicationsTabNav({
  publicationsTab,
  onPublicationsTabChange,
}: MagazinePublicationsTabNavProps) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-4" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={publicationsTab === "forecasted"}
        id="mag-pubs-tab-forecasted"
        onClick={() => onPublicationsTabChange("forecasted")}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
          publicationsTab === "forecasted"
            ? "border-blue-600 text-blue-700"
            : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        Forecasted
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={publicationsTab === "expired"}
        id="mag-pubs-tab-expired"
        onClick={() => onPublicationsTabChange("expired")}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
          publicationsTab === "expired"
            ? "border-blue-600 text-blue-700"
            : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        Expired (published and cancelled)
      </button>
    </div>
  );
}
