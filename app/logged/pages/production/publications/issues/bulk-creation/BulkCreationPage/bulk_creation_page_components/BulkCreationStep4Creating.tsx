"use client";

import React, { FC } from "react";
import { useRouter } from "next/navigation";
import { ISSUES_URL } from "./constants";

export type BulkCreationStep4CreatingProps = {
  createError: string | null;
  createSuccess: boolean;
  createdCount: number;
  createProgress: { done: number; total: number; currentLabel: string };
  onBackToSummary: () => void;
};

export const BulkCreationStep4Creating: FC<BulkCreationStep4CreatingProps> = ({
  createError,
  createSuccess,
  createdCount,
  createProgress,
  onBackToSummary,
}) => {
  const router = useRouter();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900">Creating issues</h2>
      {createError ? (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{createError}</p>
          <button
            type="button"
            onClick={onBackToSummary}
            className="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            Back to summary
          </button>
        </div>
      ) : createSuccess ? (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            {createdCount === 0
              ? "No new issues were required. Everything in the horizon already exists."
              : `Successfully created ${createdCount} issue${createdCount === 1 ? "" : "s"}. Redirecting to issues…`}
          </p>
          <button
            type="button"
            onClick={() => router.push(ISSUES_URL)}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900"
          >
            Go to issues
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {createProgress.done} of {createProgress.total} completed
            {createProgress.currentLabel ? ` · ${createProgress.currentLabel}` : ""}
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
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
};
