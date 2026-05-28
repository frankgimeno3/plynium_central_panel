"use client";

import React, { FC } from "react";
import type { IssuesFilterState } from "../../../issues_page_components/types";

type ExpiredStatus = "published" | "cancelled";

export type ExpiredIssuesFiltersProps = {
  expiredStatus: ExpiredStatus;
  setExpiredStatus: React.Dispatch<React.SetStateAction<ExpiredStatus>>;
  filter: IssuesFilterState;
  setFilter: React.Dispatch<React.SetStateAction<IssuesFilterState>>;
};

export const ExpiredIssuesFilters: FC<ExpiredIssuesFiltersProps> = ({
  expiredStatus,
  setExpiredStatus,
  filter,
  setFilter,
}) => (
  <>
    <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Status</label>
        <select
          value={expiredStatus}
          onChange={(e) => setExpiredStatus(e.target.value as ExpiredStatus)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="published">published</option>
          <option value="cancelled">cancelled</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Publication ID</label>
        <input
          type="text"
          value={filter.id}
          onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by ID"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Edition name</label>
        <input
          type="text"
          value={filter.edition}
          onChange={(e) => setFilter((f) => ({ ...f, edition: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by edition name"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Magazine ID</label>
        <input
          type="text"
          value={filter.magazine}
          onChange={(e) => setFilter((f) => ({ ...f, magazine: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by magazine"
        />
      </div>
    </div>
  </>
);
