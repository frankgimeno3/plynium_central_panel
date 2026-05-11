"use client";

import type { Dispatch, SetStateAction } from "react";
import type { MagazineFilterState } from "./types";

interface Props {
  filter: MagazineFilterState;
  onChangeFilter: Dispatch<SetStateAction<MagazineFilterState>>;
}

export function MagazineSelectFilters({ filter, onChangeFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">ID</label>
        <input
          type="text"
          value={filter.id}
          onChange={(e) => onChangeFilter((f) => ({ ...f, id: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="Search by ID"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Name</label>
        <input
          type="text"
          value={filter.name}
          onChange={(e) => onChangeFilter((f) => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="Search by name"
        />
      </div>
    </div>
  );
}
