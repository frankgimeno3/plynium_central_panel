"use client";

import type { CompanySelectPublicationOption } from "./types";

type Props = {
  publications: CompanySelectPublicationOption[];
  selectedPortalId: number | null;
  onChangePortalId: (id: number | null) => void;
};

export function CompanySelectPortalField({ publications, selectedPortalId, onChangePortalId }: Props) {
  if (publications.length <= 1) return null;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold text-gray-700">Portal</label>
      <select
        value={selectedPortalId ?? ""}
        onChange={(e) => {
          const v = e.target.value ? Number(e.target.value) : null;
          onChangePortalId(v);
        }}
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-800"
      >
        <option value="">Select a portal…</option>
        {publications.map((p) => (
          <option key={p.portalId} value={p.portalId}>
            {p.portalName}
          </option>
        ))}
      </select>
    </div>
  );
}
