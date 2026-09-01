"use client";

import React, { FC } from "react";

export type ServicesListFilterState = {
  id: string;
  name: string;
  hasPublicationDate: string;
  specifity: string;
};

type ServicesListFiltersProps = {
  filter: ServicesListFilterState;
  setFilter: React.Dispatch<React.SetStateAction<ServicesListFilterState>>;
  onAnyChangeResetPage: () => void;
};

export const ServicesListFilters: FC<ServicesListFiltersProps> = ({
  filter,
  setFilter,
  onAnyChangeResetPage,
}) => (
  <>
    <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">ID</label>
        <input
          type="text"
          value={filter.id}
          onChange={(e) => {
            setFilter((f) => ({ ...f, id: e.target.value }));
            onAnyChangeResetPage();
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by ID"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Name</label>
        <input
          type="text"
          value={filter.name}
          onChange={(e) => {
            setFilter((f) => ({ ...f, name: e.target.value }));
            onAnyChangeResetPage();
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Specifity</label>
        <select
          value={filter.specifity}
          onChange={(e) => {
            setFilter((f) => ({ ...f, specifity: e.target.value }));
            onAnyChangeResetPage();
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="general">General</option>
          <option value="specific-related">Specific-related</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Publication date</label>
        <select
          value={filter.hasPublicationDate}
          onChange={(e) => {
            setFilter((f) => ({ ...f, hasPublicationDate: e.target.value }));
            onAnyChangeResetPage();
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="yes">With publication date</option>
          <option value="no">Without publication date</option>
        </select>
      </div>
    </div>
  </>
);
