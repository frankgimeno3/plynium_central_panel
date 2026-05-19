"use client";

import React, { FC } from "react";

type StepCreatingProps = {
  createError: string | null;
  createSuccess: boolean;
  createdCount: number;
  createProgress: { done: number; total: number; currentLabel: string };
  onBackToSummary: () => void;
  onGoToPreferentialPages: () => void;
};

export const StepCreating: FC<StepCreatingProps> = ({
  createError,
  createSuccess,
  createdCount,
  createProgress,
  onBackToSummary,
  onGoToPreferentialPages,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6">
    <h2 className="text-lg font-semibold text-gray-900">Creating slots</h2>
    {createError ? (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{createError}</p>
        <button
          type="button"
          onClick={onBackToSummary}
          className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Back to summary
        </button>
      </div>
    ) : createSuccess ? (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          {createdCount === 0
            ? "No new preferential slots were required for the selected publications."
            : `Successfully created ${createdCount} preferential slot${createdCount === 1 ? "" : "s"}. Redirecting to preferential pages…`}
        </p>
        <button
          type="button"
          onClick={onGoToPreferentialPages}
          className="mt-3 rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
        >
          Go to preferential pages
        </button>
      </div>
    ) : (
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          {createProgress.done} of {createProgress.total} completed
          {createProgress.currentLabel ? ` · ${createProgress.currentLabel}` : ""}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-950 transition-all duration-300"
            style={{
              width:
                createProgress.total > 0
                  ? `${Math.round((createProgress.done / createProgress.total) * 100)}%`
                  : "0%",
            }}
          />
        </div>
        <p className="mt-3 text-sm text-gray-500">Please keep this page open until the process finishes.</p>
      </div>
    )}
  </div>
);
