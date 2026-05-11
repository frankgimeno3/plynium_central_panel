"use client";

import React, { FC } from "react";

type Props = {
  start: number;
  page: number;
  totalPages: number;
  filteredLength: number;
  itemsPerPage: number;
  onPrevious: () => void;
  onNext: () => void;
  visible: boolean;
};

export const PublicationsManagementListPagination: FC<Props> = ({
  start,
  page,
  totalPages,
  filteredLength,
  itemsPerPage,
  onPrevious,
  onNext,
  visible,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Showing {start + 1}–{Math.min(start + itemsPerPage, filteredLength)} of {filteredLength}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
