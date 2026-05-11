"use client";

import React, { FC } from "react";
import type { Magazine } from "@/app/contents/interfaces";

export type BulkCreationStep1SelectMagazinesProps = {
  magazinesError: string | null;
  loadMagazines: () => void;
  magazinesLoading: boolean;
  sortedMagazines: Magazine[];
  selectedMagazineIds: Set<string>;
  toggleMagazine: (id: string) => void;
  toggleSelectAll: () => void;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onContinue: () => void;
};

export const BulkCreationStep1SelectMagazines: FC<BulkCreationStep1SelectMagazinesProps> = ({
  magazinesError,
  loadMagazines,
  magazinesLoading,
  sortedMagazines,
  selectedMagazineIds,
  toggleMagazine,
  toggleSelectAll,
  allVisibleSelected,
  someVisibleSelected,
  onContinue,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="p-6">
      {magazinesError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm text-red-800">{magazinesError}</p>
          <button
            type="button"
            onClick={loadMagazines}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {magazinesLoading ? (
        <p className="text-sm text-gray-500">Loading magazines…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all magazines"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Starting year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodicity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMagazines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No magazines available.
                  </td>
                </tr>
              ) : (
                sortedMagazines.map((magazine) => {
                  const checked = selectedMagazineIds.has(magazine.id_magazine);
                  return (
                    <tr key={magazine.id_magazine} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMagazine(magazine.id_magazine)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {magazine.id_magazine}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{magazine.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {magazine.first_year != null ? magazine.first_year : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {magazine.periodicity?.trim() ? magazine.periodicity : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          {selectedMagazineIds.size} magazine{selectedMagazineIds.size === 1 ? "" : "s"} selected
        </p>
        <button
          type="button"
          disabled={selectedMagazineIds.size === 0 || magazinesLoading}
          onClick={() => void onContinue()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
);
