"use client";

import React, { FC } from "react";
import type { ContactFilterState } from "./types";

type Props = {
  filter: ContactFilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<ContactFilterState>>;
};

export const ContactSelectFilters: FC<Props> = ({ filter, onFilterChange }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div>
      <label className="block text-xs text-gray-600 mb-1">ID</label>
      <input
        type="text"
        value={filter.id}
        onChange={(e) => onFilterChange((f) => ({ ...f, id: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
        placeholder="Search by ID"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 mb-1">Name</label>
      <input
        type="text"
        value={filter.name}
        onChange={(e) => onFilterChange((f) => ({ ...f, name: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
        placeholder="Search by name"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 mb-1">Role</label>
      <input
        type="text"
        value={filter.role}
        onChange={(e) => onFilterChange((f) => ({ ...f, role: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
        placeholder="Search by role"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 mb-1">Company</label>
      <input
        type="text"
        value={filter.company}
        onChange={(e) => onFilterChange((f) => ({ ...f, company: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
        placeholder="Search by company"
      />
    </div>
  </div>
);
