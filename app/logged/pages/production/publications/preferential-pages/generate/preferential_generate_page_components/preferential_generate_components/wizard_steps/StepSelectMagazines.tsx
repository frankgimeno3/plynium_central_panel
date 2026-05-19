"use client";

import React, { FC } from "react";
import type { Magazine } from "@/app/contents/interfaces";

type StepSelectMagazinesProps = {
  magazinesError: string | null;
  loadMagazines: () => void;
  magazinesLoading: boolean;
  sortedMagazines: Magazine[];
  selectedMagazineIds: Set<string>;
  allMagazinesSelected: boolean;
  someMagazinesSelected: boolean;
  toggleSelectAllMagazines: () => void;
  toggleMagazine: (magazineId: string) => void;
  onContinue: () => void;
};

export const StepSelectMagazines: FC<StepSelectMagazinesProps> = ({
  magazinesError,
  loadMagazines,
  magazinesLoading,
  sortedMagazines,
  selectedMagazineIds,
  allMagazinesSelected,
  someMagazinesSelected,
  toggleSelectAllMagazines,
  toggleMagazine,
  onContinue,
}) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div className="p-6">
      {magazinesError && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{magazinesError}</p>
          <button
            type="button"
            onClick={loadMagazines}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {magazinesLoading ? (
        <p className="text-sm text-gray-500">Loading magazines…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all magazines"
                    checked={allMagazinesSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allMagazinesSelected && someMagazinesSelected;
                    }}
                    onChange={toggleSelectAllMagazines}
                    className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Periodicity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedMagazines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    No magazines available.
                  </td>
                </tr>
              ) : (
                sortedMagazines.map((magazine) => (
                  <tr key={magazine.id_magazine} className="hover:bg-blue-50/40">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedMagazineIds.has(magazine.id_magazine)}
                        onChange={() => toggleMagazine(magazine.id_magazine)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{magazine.id_magazine}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{magazine.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {magazine.periodicity?.trim() ? magazine.periodicity : "—"}
                    </td>
                  </tr>
                ))
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
          onClick={onContinue}
          className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
);
