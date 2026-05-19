"use client";

import React, { FC } from "react";
import {
  CANONICAL_PREFERENTIAL_POSITIONS,
  displayPreferentialPosition,
  selectionKey,
} from "../../../preferentialSlotPositions";
import type { PublicationSlotReview } from "../../preferential_generate_types";

type StepReviewSlotsProps = {
  slotReviewsLoading: boolean;
  slotReviewsError: string | null;
  slotReviews: PublicationSlotReview[];
  selectedMissingSlots: Set<string>;
  toggleMissingSlot: (publicationId: string, position: string) => void;
  toggleAllMissingForPublication: (review: PublicationSlotReview) => void;
  onBack: () => void;
  onContinue: () => void;
};

export const StepReviewSlots: FC<StepReviewSlotsProps> = ({
  slotReviewsLoading,
  slotReviewsError,
  slotReviews,
  selectedMissingSlots,
  toggleMissingSlot,
  toggleAllMissingForPublication,
  onBack,
  onContinue,
}) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div className="flex flex-col gap-4 p-6">
      {slotReviewsLoading ? (
        <p className="text-sm text-gray-500">Loading preferential slots…</p>
      ) : (
        <>
          {slotReviewsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {slotReviewsError}
            </div>
          )}
          <p className="text-sm text-gray-600">
            Expected positions: {CANONICAL_PREFERENTIAL_POSITIONS.map(displayPreferentialPosition).join(", ")}.
          </p>
          {slotReviews.map((review) => {
            const missingCount = review.slots.filter((slot) => slot.missing).length;
            const existingCount = review.slots.length - missingCount;
            const missingKeys = review.slots
              .filter((slot) => slot.missing)
              .map((slot) => selectionKey(review.publication.id_publication, slot.position_in_magazine));
            const allMissingSelected =
              missingKeys.length > 0 && missingKeys.every((key) => selectedMissingSlots.has(key));
            const someMissingSelected = missingKeys.some((key) => selectedMissingSlots.has(key));
            return (
              <details key={review.publication.id_publication} open className="rounded-lg border border-gray-200">
                <summary className="flex list-none cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {review.publication.publication_edition_name || review.publication.id_publication}
                    </p>
                    <p className="text-xs text-gray-600">
                      {review.magazineName} · {existingCount} existing · {missingCount} missing
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={allMissingSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allMissingSelected && someMissingSelected;
                      }}
                      onChange={(event) => {
                        event.stopPropagation();
                        toggleAllMissingForPublication(review);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                    />
                    Select missing
                  </label>
                </summary>
                <div className="p-4">
                  {review.loadError && <p className="mb-3 text-sm text-red-700">{review.loadError}</p>}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            Create
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            Position
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {review.slots.map((slot) => {
                          const key = selectionKey(review.publication.id_publication, slot.position_in_magazine);
                          return (
                            <tr key={key} className={slot.missing ? undefined : "bg-gray-50/80"}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  disabled={!slot.missing}
                                  checked={slot.missing ? selectedMissingSlots.has(key) : false}
                                  onChange={() =>
                                    toggleMissingSlot(review.publication.id_publication, slot.position_in_magazine)
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-950 disabled:opacity-40"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {displayPreferentialPosition(slot.position_in_magazine)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {slot.missing ? (
                                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                                    Missing
                                  </span>
                                ) : (
                                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                    Exists
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            );
          })}
        </>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={slotReviewsLoading || slotReviews.length === 0}
          onClick={onContinue}
          className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
);
