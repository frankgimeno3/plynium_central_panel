"use client";

import React, { FC } from "react";
import type { PublicationsListFilter } from "./types";

type Props = {
  filter: PublicationsListFilter;
  onFilterChange: (next: PublicationsListFilter) => void;
};

export const PublicationsManagementListFilters: FC<Props> = ({ filter, onFilterChange }) => {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="pub-mgmt-filter-id" className="block text-xs text-gray-600 mb-1">
            ID
          </label>
          <input
            id="pub-mgmt-filter-id"
            type="text"
            value={filter.id}
            onChange={(e) => onFilterChange({ ...filter, id: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by ID"
          />
        </div>
        <div>
          <label htmlFor="pub-mgmt-filter-edition" className="block text-xs text-gray-600 mb-1">
            Edition
          </label>
          <input
            id="pub-mgmt-filter-edition"
            type="text"
            value={filter.edition}
            onChange={(e) => onFilterChange({ ...filter, edition: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by edition"
          />
        </div>
        <div>
          <label htmlFor="pub-mgmt-filter-theme" className="block text-xs text-gray-600 mb-1">
            Theme
          </label>
          <input
            id="pub-mgmt-filter-theme"
            type="text"
            value={filter.theme}
            onChange={(e) => onFilterChange({ ...filter, theme: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by theme"
          />
        </div>
      </div>
    </div>
  );
};
