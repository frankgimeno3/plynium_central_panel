"use client";

import type { CustomerSelectFilterState } from "./types";

type Props = {
  filter: CustomerSelectFilterState;
  onChange: (next: CustomerSelectFilterState) => void;
};

export function CustomerSelectFilters({ filter, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">ID</label>
        <input
          type="text"
          value={filter.id}
          onChange={(e) => onChange({ ...filter, id: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="Search by ID"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Name</label>
        <input
          type="text"
          value={filter.name}
          onChange={(e) => onChange({ ...filter, name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="Search by name"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">CIF</label>
        <input
          type="text"
          value={filter.cif}
          onChange={(e) => onChange({ ...filter, cif: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="Search by CIF"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Country</label>
        <input
          type="text"
          value={filter.country}
          onChange={(e) => onChange({ ...filter, country: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="Search by country"
        />
      </div>
    </div>
  );
}
