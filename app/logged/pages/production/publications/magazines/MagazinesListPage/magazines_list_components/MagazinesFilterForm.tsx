"use client";

import React, { FC } from "react";

export type MagazineListFilter = { id: string; name: string };

type Props = {
  filter: MagazineListFilter;
  onFilterChange: (next: MagazineListFilter) => void;
  onResetPage: () => void;
};

export const MagazinesFilterForm: FC<Props> = ({ filter, onFilterChange, onResetPage }) => (
  <>
    <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="mag-filter-id" className="block text-xs text-gray-600 mb-1">
          ID
        </label>
        <input
          id="mag-filter-id"
          type="text"
          value={filter.id}
          onChange={(e) => {
            onFilterChange({ ...filter, id: e.target.value });
            onResetPage();
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by ID"
        />
      </div>
      <div>
        <label htmlFor="mag-filter-name" className="block text-xs text-gray-600 mb-1">
          Name
        </label>
        <input
          id="mag-filter-name"
          type="text"
          value={filter.name}
          onChange={(e) => {
            onFilterChange({ ...filter, name: e.target.value });
            onResetPage();
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name"
        />
      </div>
    </div>
  </>
);
