"use client";

import React, { FC } from "react";
import type { MagazinePublicationsPlan } from "../../preferential_generate_types";

type StepSelectPublicationsProps = {
  publicationsLoading: boolean;
  publicationsError: string | null;
  publicationPlans: MagazinePublicationsPlan[];
  selectedPublicationIds: Set<string>;
  togglePublication: (publicationId: string) => void;
  toggleAllPublicationsForMagazine: (plan: MagazinePublicationsPlan) => void;
  onBack: () => void;
  onContinue: () => void;
};

export const StepSelectPublications: FC<StepSelectPublicationsProps> = ({
  publicationsLoading,
  publicationsError,
  publicationPlans,
  selectedPublicationIds,
  togglePublication,
  toggleAllPublicationsForMagazine,
  onBack,
  onContinue,
}) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div className="flex flex-col gap-4 p-6">
      {publicationsLoading ? (
        <p className="text-sm text-gray-500">Loading publications…</p>
      ) : (
        <>
          {publicationsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {publicationsError}
            </div>
          )}
          {publicationPlans.map((plan) => {
            const publicationIds = plan.publications.map((publication) => publication.id_publication);
            const allSelected =
              publicationIds.length > 0 && publicationIds.every((id) => selectedPublicationIds.has(id));
            const someSelected = publicationIds.some((id) => selectedPublicationIds.has(id));
            return (
              <details key={plan.magazine.id_magazine} open className="rounded-lg border border-gray-200">
                <summary className="flex list-none cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{plan.magazine.name}</p>
                    <p className="text-xs text-gray-600">{plan.publications.length} publications</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allSelected && someSelected;
                      }}
                      onChange={(event) => {
                        event.stopPropagation();
                        toggleAllPublicationsForMagazine(plan);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                    />
                    Select all
                  </label>
                </summary>
                <div className="p-4">
                  {plan.loadError && <p className="mb-3 text-sm text-red-700">{plan.loadError}</p>}
                  {plan.publications.length === 0 ? (
                    <p className="text-sm text-gray-500">No publications found for this magazine.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              Select
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              Publication ID
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              Edition
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              Year
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              Issue
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {plan.publications.map((publication) => (
                            <tr key={publication.id_publication}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedPublicationIds.has(publication.id_publication)}
                                  onChange={() => togglePublication(publication.id_publication)}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{publication.id_publication}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {publication.publication_edition_name || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {publication.publication_year != null ? publication.publication_year : "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {publication.magazine_this_year_issue != null
                                  ? String(publication.magazine_this_year_issue).padStart(3, "0")
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{publication.publication_status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
          disabled={publicationsLoading || selectedPublicationIds.size === 0}
          onClick={onContinue}
          className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
);
