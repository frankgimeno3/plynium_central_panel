"use client";

import React, { FC } from "react";

type ServicesListPaginationProps = {
  start: number;
  itemsPerPage: number;
  filteredLength: number;
  totalPages: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  showPagination: boolean;
};

export const ServicesListPagination: FC<ServicesListPaginationProps> = ({
  start,
  itemsPerPage,
  filteredLength,
  totalPages,
  page,
  setPage,
  showPagination,
}) => {
  if (!showPagination) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Showing {start + 1}–{Math.min(start + itemsPerPage, filteredLength)} of {filteredLength}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
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
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
