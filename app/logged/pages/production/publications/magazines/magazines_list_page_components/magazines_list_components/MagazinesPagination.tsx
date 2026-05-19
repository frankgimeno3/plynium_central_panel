"use client";

import React, { FC } from "react";

type Props = {
  start: number;
  pageSize: number;
  filteredCount: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export const MagazinesPagination: FC<Props> = ({
  start,
  pageSize,
  filteredCount,
  page,
  totalPages,
  onPrev,
  onNext,
}) => (
  <div className="flex items-center justify-between mt-4">
    <p className="text-sm text-gray-600">
      Showing {start + 1}–{Math.min(start + pageSize, filteredCount)} of {filteredCount}
    </p>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
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
