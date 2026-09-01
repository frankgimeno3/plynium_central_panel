"use client";

import React, { FC } from "react";
import {
  issuesPerYearFromPeriodicity,
  MONTH_OPTIONS,
  patchSlotExpectedDate,
  patchSlotExpectedMonth,
  type PlannedIssueSlot,
  type PublicationFormat,
} from "../../issueBulkPlan";
import type { MagazinePlan } from "./constants";
import { FORMAT_OPTIONS } from "./constants";

export type BulkCreationStep2ReviewProps = {
  plansLoading: boolean;
  plansError: string | null;
  plans: MagazinePlan[];
  updateSlot: (magazineId: string, slotKey: string, patch: Partial<PlannedIssueSlot>) => void;
  onBack: () => void;
  onContinue: () => void;
};

export const BulkCreationStep2Review: FC<BulkCreationStep2ReviewProps> = ({
  plansLoading,
  plansError,
  plans,
  updateSlot,
  onBack,
  onContinue,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="p-6 flex flex-col gap-4">
      {plansLoading ? (
        <p className="text-sm text-gray-500">Loading issue plan…</p>
      ) : (
        <>
          {plansError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{plansError}</div>
          )}
          {plans.map((plan) => {
            const perYear = issuesPerYearFromPeriodicity(plan.magazine.periodicity);
            const missing = plan.slots.filter((slot) => !slot.exists);
            const existing = plan.slots.length - missing.length;
            return (
              <details key={plan.magazine.id_magazine} open className="border border-gray-200 rounded-lg">
                <summary className="cursor-pointer list-none px-4 py-3 bg-gray-50 rounded-lg flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{plan.magazine.name}</p>
                    <p className="text-xs text-gray-600">
                      Periodicity: {plan.magazine.periodicity?.trim() || "Not set"}
                      {perYear > 0 ? ` · ${perYear} issues/year` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {plan.slots.length} in horizon · {existing} existing · {missing.length} to create
                  </p>
                </summary>
                <div className="p-4">
                  {plan.loadError && <p className="mb-3 text-sm text-red-700">{plan.loadError}</p>}
                  {perYear < 1 && (
                    <p className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      This magazine has no supported periodicity. It will be skipped during creation.
                    </p>
                  )}
                  {plan.slots.length === 0 ? (
                    <p className="text-sm text-gray-500">No issue slots in the selected horizon.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Expected month
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Expected date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Theme</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {plan.slots.map((slot) => (
                            <tr key={slot.key} className={slot.exists ? "bg-gray-50/80" : undefined}>
                              <td className="px-4 py-3 text-sm text-gray-900">{slot.publicationYear}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {String(slot.issueInYear).padStart(3, "0")}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <select
                                  value={slot.expectedMonth}
                                  disabled={slot.exists}
                                  onChange={(e) =>
                                    updateSlot(plan.magazine.id_magazine, slot.key, {
                                      ...patchSlotExpectedMonth(slot, Number(e.target.value)),
                                    })
                                  }
                                  className="min-w-[8rem] px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
                                >
                                  {MONTH_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <input
                                  type="date"
                                  value={slot.expectedDate}
                                  disabled={slot.exists}
                                  onChange={(e) =>
                                    updateSlot(plan.magazine.id_magazine, slot.key, {
                                      ...patchSlotExpectedDate(slot, e.target.value),
                                    })
                                  }
                                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {slot.exists ? (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Exists
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-900">
                                    Missing
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <input
                                  type="text"
                                  value={slot.publication_theme}
                                  disabled={slot.exists}
                                  onChange={(e) =>
                                    updateSlot(plan.magazine.id_magazine, slot.key, {
                                      publication_theme: e.target.value,
                                    })
                                  }
                                  className="w-full min-w-[10rem] px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <select
                                  value={slot.publication_format}
                                  disabled={slot.exists}
                                  onChange={(e) =>
                                    updateSlot(plan.magazine.id_magazine, slot.key, {
                                      publication_format: e.target.value as PublicationFormat,
                                    })
                                  }
                                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
                                >
                                  {FORMAT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <input
                                  type="checkbox"
                                  checked={slot.is_special_edition}
                                  disabled={slot.exists}
                                  onChange={(e) =>
                                    updateSlot(plan.magazine.id_magazine, slot.key, {
                                      is_special_edition: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-950"
                                />
                              </td>
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
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={plansLoading || plans.length === 0}
          onClick={onContinue}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
);
