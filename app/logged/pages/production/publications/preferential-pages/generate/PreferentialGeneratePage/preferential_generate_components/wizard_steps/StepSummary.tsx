"use client";

import React, { FC } from "react";
import { displayPreferentialPosition } from "../../../preferentialSlotPositions";
import type { CreationQueueItem } from "../../preferential_generate_types";

type StepSummaryProps = {
  slotReviewsLength: number;
  existingSlotsCount: number;
  totalSelectedSlots: number;
  creationQueue: CreationQueueItem[];
  onBack: () => void;
  onConfirmCreate: () => void;
};

export const StepSummary: FC<StepSummaryProps> = ({
  slotReviewsLength,
  existingSlotsCount,
  totalSelectedSlots,
  creationQueue,
  onBack,
  onConfirmCreate,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6">
    <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
    <p className="mt-2 text-sm text-gray-600">
      {slotReviewsLength} publication{slotReviewsLength === 1 ? "" : "s"} · {existingSlotsCount} existing slot
      {existingSlotsCount === 1 ? "" : "s"} · {totalSelectedSlots} to create
    </p>
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Magazine</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Publication</th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Positions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {creationQueue.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                No missing slots selected for creation.
              </td>
            </tr>
          ) : (
            creationQueue.map((item) => (
              <tr key={item.publicationId}>
                <td className="px-4 py-3 text-sm text-gray-900">{item.magazineName}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.publicationLabel}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.positions.map(displayPreferentialPosition).join(", ")}
                </td>
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
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => void onConfirmCreate()}
        className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
      >
        Confirm and create
      </button>
    </div>
  </div>
);
