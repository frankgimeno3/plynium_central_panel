"use client";

import type { PortalRow } from "./types";

type Props = {
  portals: PortalRow[];
  selectedPortalId: number | null;
  onChangePortalId: (id: number | null) => void;
  loading: boolean;
  onContinue: () => void;
};

export function ArticleRelatePhase1({
  portals,
  selectedPortalId,
  onChangePortalId,
  loading,
  onContinue,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Portal</label>
        <select
          value={selectedPortalId ?? ""}
          onChange={(e) => onChangePortalId(e.target.value ? Number(e.target.value) : null)}
          className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="">Select a portal</option>
          {portals.map((portal) => (
            <option key={portal.id} value={portal.id}>
              {portal.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={!selectedPortalId || loading}
        onClick={onContinue}
        className="px-4 py-2 rounded-lg bg-blue-950 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Loading..." : "Continue"}
      </button>
    </div>
  );
}
