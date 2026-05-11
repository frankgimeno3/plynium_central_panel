"use client";

import React, { FC } from "react";
import { ForecastedIssuesFilters } from "./forecasted_issues_tab_components/ForecastedIssuesFilters";
import { ForecastedIssuesTable } from "./forecasted_issues_tab_components/ForecastedIssuesTable";
import type { IssuesFilterState, PublicationDbRow } from "../../issues_page_components/types";

export type ForecastedIssuesTabProps = {
  error: string | null;
  loading: boolean;
  onRetry: () => void;
  filter: IssuesFilterState;
  setFilter: React.Dispatch<React.SetStateAction<IssuesFilterState>>;
  filteredRows: PublicationDbRow[];
};

export const ForecastedIssuesTab: FC<ForecastedIssuesTabProps> = ({
  error,
  loading,
  onRetry,
  filter,
  setFilter,
  filteredRows,
}) => (
  <div className="p-6">
    {error && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    )}

    <ForecastedIssuesFilters filter={filter} setFilter={setFilter} />

    {loading ? (
      <div className="py-6 text-center text-gray-500">Loading issues…</div>
    ) : (
      <ForecastedIssuesTable rows={filteredRows} />
    )}
  </div>
);
