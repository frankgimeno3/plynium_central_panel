"use client";

import React, { FC } from "react";
import type { PlannedIssueSlot } from "../../issueBulkPlan";

export type PendingSlotRow = PlannedIssueSlot & { magazineName: string };

export type BulkCreationStep3SummaryProps = {
  plansCount: number;
  existingSlotsCount: number;
  pendingSlots: PendingSlotRow[];
  onBack: () => void;
  onCreate: () => void;
};

export const BulkCreationStep3Summary: FC<BulkCreationStep3SummaryProps> = ({
  plansCount,
  existingSlotsCount,
  pendingSlots,
  onBack,
  onCreate,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
    <p className="mt-2 text-sm text-gray-600">
      {plansCount} magazine{plansCount === 1 ? "" : "s"} · {existingSlotsCount} existing issue
      {existingSlotsCount === 1 ? "" : "s"} · {pendingSlots.length} to create
    </p>
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Magazine</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pendingSlots.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                Nothing to create in the selected horizon.
              </td>
            </tr>
          ) : (
            pendingSlots.map((slot) => (
              <tr key={slot.key}>
                <td className="px-4 py-3 text-sm text-gray-900">{slot.magazineName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.publicationYear}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{String(slot.issueInYear).padStart(3, "0")}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.expectedDate}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.publication_format}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    <div className="mt-6 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => void onCreate()}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900"
      >
        Create issues
      </button>
    </div>
  </div>
);
