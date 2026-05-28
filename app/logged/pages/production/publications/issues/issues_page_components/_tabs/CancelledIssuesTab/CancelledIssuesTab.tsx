"use client";

import React, { FC } from "react";
import { DevelopmentIssuesFilters } from "../DevelopmentIssuesTab/development_issues_tab_components/DevelopmentIssuesFilters";
import { IssuesDataTable } from "../../issues_page_components/IssuesDataTable";
import type { IssuesFilterState, PublicationDbRow } from "../../issues_page_components/types";

export type CancelledIssuesTabProps = {
  error: string | null;
  loading: boolean;
  onRetry: () => void;
  filter: IssuesFilterState;
  setFilter: React.Dispatch<React.SetStateAction<IssuesFilterState>>;
  filteredRows: PublicationDbRow[];
};

export const CancelledIssuesTab: FC<CancelledIssuesTabProps> = ({
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

    <DevelopmentIssuesFilters filter={filter} setFilter={setFilter} />

    {loading ? (
      <div className="py-6 text-center text-gray-500">Loading issues…</div>
    ) : (
      <IssuesDataTable rows={filteredRows} />
    )}
  </div>
);
