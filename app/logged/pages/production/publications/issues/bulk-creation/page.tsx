"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";
import type { Magazine } from "@/app/contents/interfaces";
import {
  buildPlannedIssueSlots,
  issuesPerYearFromPeriodicity,
  monthLabel,
  type ExistingPublicationRow,
  type PlannedIssueSlot,
  type PublicationFormat,
} from "./issueBulkPlan";

const BASE = "/logged/pages/production/publications";
const ISSUES_URL = `${BASE}/issues`;
const HORIZON_DAYS = 365;

const FORMAT_OPTIONS: { value: PublicationFormat; label: string }[] = [
  { value: "informer", label: "Informer" },
  { value: "flipbook", label: "Flipbook" },
  { value: "both", label: "Both" },
];

type WizardStep = 1 | 2 | 3 | 4;

const stepLabels: Record<WizardStep, string> = {
  1: "Select magazines",
  2: "Review & configure",
  3: "Summary",
  4: "Creating",
};

type MagazinePlan = {
  magazine: Magazine;
  slots: PlannedIssueSlot[];
  loadError: string | null;
};

function normalizeMagazines(data: unknown): Magazine[] {
  if (Array.isArray(data)) return data as Magazine[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Magazine[] }).data;
  }
  return [];
}

const IssueBulkCreationPage: FC = () => {
  const router = useRouter();
  const { setPageMeta } = usePageContent();

  const [step, setStep] = useState<WizardStep>(1);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [magazinesLoading, setMagazinesLoading] = useState(true);
  const [magazinesError, setMagazinesError] = useState<string | null>(null);
  const [selectedMagazineIds, setSelectedMagazineIds] = useState<Set<string>>(new Set());
  const [plans, setPlans] = useState<MagazinePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [createProgress, setCreateProgress] = useState({ done: 0, total: 0, currentLabel: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const breadcrumbs = useMemo(
    () => [
      { label: "Production", href: "/logged/pages/production/services" },
      { label: "Publications", href: ISSUES_URL },
      { label: "Issues", href: ISSUES_URL },
      { label: "Issue bulk creation" },
    ],
    []
  );

  useEffect(() => {
    setPageMeta({
      pageTitle: "Issue bulk creation",
      breadcrumbs,
      buttons: [{ label: "Back to issues", href: ISSUES_URL }],
    });
  }, [setPageMeta, breadcrumbs]);

  useEffect(() => {
    if (!createSuccess) return;
    const timer = window.setTimeout(() => router.push(ISSUES_URL), 2500);
    return () => window.clearTimeout(timer);
  }, [createSuccess, router]);

  const loadMagazines = useCallback(() => {
    setMagazinesError(null);
    setMagazinesLoading(true);
    MagazineService.getAllMagazines()
      .then((data) => setMagazines(normalizeMagazines(data)))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to load magazines";
        setMagazinesError(message);
        setMagazines([]);
      })
      .finally(() => setMagazinesLoading(false));
  }, []);

  useEffect(() => {
    loadMagazines();
  }, [loadMagazines]);

  const sortedMagazines = useMemo(
    () => [...magazines].sort((a, b) => a.name.localeCompare(b.name)),
    [magazines]
  );

  const allVisibleSelected =
    sortedMagazines.length > 0 && sortedMagazines.every((m) => selectedMagazineIds.has(m.id_magazine));
  const someVisibleSelected = sortedMagazines.some((m) => selectedMagazineIds.has(m.id_magazine));

  const toggleMagazine = (id: string) => {
    setSelectedMagazineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedMagazineIds((prev) => {
      if (sortedMagazines.length === 0) return prev;
      if (sortedMagazines.every((m) => prev.has(m.id_magazine))) {
        return new Set();
      }
      return new Set(sortedMagazines.map((m) => m.id_magazine));
    });
  };

  const loadPlansForSelection = useCallback(async () => {
    const ids = Array.from(selectedMagazineIds);
    if (ids.length === 0) return;
    setPlansLoading(true);
    setPlansError(null);
    const horizonStart = new Date();
    try {
      const results = await Promise.all(
        ids.map(async (magazineId) => {
          const magazine = magazines.find((m) => m.id_magazine === magazineId);
          if (!magazine) {
            return {
              magazine: { id_magazine: magazineId, name: magazineId } as Magazine,
              slots: [],
              loadError: "Magazine not found in the current list.",
            };
          }
          try {
            const pubs = await PublicationService.listPublicationsForMagazine(magazineId);
            const existing = (Array.isArray(pubs) ? pubs : []) as ExistingPublicationRow[];
            const slots = buildPlannedIssueSlots({
              magazineId,
              periodicity: magazine.periodicity,
              firstYear: magazine.first_year,
              existing,
              horizonStart,
              horizonDays: HORIZON_DAYS,
            });
            return { magazine, slots, loadError: null };
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to load existing issues";
            return { magazine, slots: [], loadError: message };
          }
        })
      );
      setPlans(results);
    } catch (e: unknown) {
      setPlans([]);
      setPlansError(e instanceof Error ? e.message : "Failed to prepare issue plan");
    } finally {
      setPlansLoading(false);
    }
  }, [magazines, selectedMagazineIds]);

  const pendingSlots = useMemo(
    () =>
      plans.flatMap((plan) =>
        plan.slots.filter((slot) => !slot.exists).map((slot) => ({ ...slot, magazineName: plan.magazine.name }))
      ),
    [plans]
  );

  const existingSlotsCount = useMemo(
    () => plans.reduce((sum, plan) => sum + plan.slots.filter((slot) => slot.exists).length, 0),
    [plans]
  );

  const updateSlot = (magazineId: string, slotKey: string, patch: Partial<PlannedIssueSlot>) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.magazine.id_magazine !== magazineId) return plan;
        return {
          ...plan,
          slots: plan.slots.map((slot) => (slot.key === slotKey ? { ...slot, ...patch } : slot)),
        };
      })
    );
  };

  const goToConfigureStep = async () => {
    if (selectedMagazineIds.size === 0) return;
    await loadPlansForSelection();
    setStep(2);
  };

  const runCreation = async () => {
    const queue = plans.flatMap((plan) =>
      plan.slots
        .filter((slot) => !slot.exists)
        .map((slot) => ({ plan, slot }))
    );
    if (queue.length === 0) {
      setCreatedCount(0);
      setCreateSuccess(true);
      setStep(4);
      return;
    }

    setStep(4);
    setCreateError(null);
    setCreateSuccess(false);
    setCreatedCount(0);
    setCreateProgress({ done: 0, total: queue.length, currentLabel: "" });

    for (let index = 0; index < queue.length; index += 1) {
      const { plan, slot } = queue[index];
      const label = `${plan.magazine.name} · ${slot.publicationYear} #${String(slot.issueInYear).padStart(3, "0")}`;
      setCreateProgress({ done: index, total: queue.length, currentLabel: label });
      try {
        await PublicationService.createMagazinePublication(plan.magazine.id_magazine, {
          publication_year: slot.publicationYear,
          magazine_this_year_issue: slot.issueInYear,
          publication_expected_publication_month: slot.expectedMonth,
          is_special_edition: slot.is_special_edition,
          publication_theme: slot.publication_theme,
          publication_format: slot.publication_format,
        });
        setCreateProgress({ done: index + 1, total: queue.length, currentLabel: label });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to create issue";
        setCreateError(`${label}: ${message}`);
        setCreateProgress({ done: index, total: queue.length, currentLabel: label });
        return;
      }
    }

    setCreateProgress({ done: queue.length, total: queue.length, currentLabel: "" });
    setCreatedCount(queue.length);
    setCreateSuccess(true);
  };

  const horizonEndLabel = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + HORIZON_DAYS);
    return end.toLocaleDateString("default", { year: "numeric", month: "long", day: "numeric" });
  }, []);

  return (
    <PageContentSection className="pt-4">
      <div className="flex flex-col gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600">
            Generate missing magazine issues from today through {horizonEndLabel}. Existing issues in the database are
            detected automatically and skipped.
          </p>
          <ol className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(stepLabels) as unknown as WizardStep[]).map((value) => {
              const id = Number(value) as WizardStep;
              const active = step === id;
              const completed = step > id;
              return (
                <li
                  key={id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    active
                      ? "bg-blue-950 text-white border-blue-950"
                      : completed
                        ? "bg-blue-50 text-blue-900 border-blue-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {id}. {stepLabels[id]}
                </li>
              );
            })}
          </ol>
        </div>

        {step === 1 && (
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
                  onClick={() => void goToConfigureStep()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-6 flex flex-col gap-4">
              {plansLoading ? (
                <p className="text-sm text-gray-500">Loading issue plan…</p>
              ) : (
                <>
                  {plansError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      {plansError}
                    </div>
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
                          {plan.loadError && (
                            <p className="mb-3 text-sm text-red-700">{plan.loadError}</p>
                          )}
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
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Year
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Issue
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Expected month
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Expected date
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Status
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Theme
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Format
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Special
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {plan.slots.map((slot) => (
                                    <tr key={slot.key} className={slot.exists ? "bg-gray-50/80" : undefined}>
                                      <td className="px-4 py-3 text-sm text-gray-900">{slot.publicationYear}</td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {String(slot.issueInYear).padStart(3, "0")}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{monthLabel(slot.expectedMonth)}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{slot.expectedDate}</td>
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
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={plansLoading || plans.length === 0}
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
            <p className="mt-2 text-sm text-gray-600">
              {plans.length} magazine{plans.length === 1 ? "" : "s"} · {existingSlotsCount} existing issue
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
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {String(slot.issueInYear).padStart(3, "0")}
                        </td>
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
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void runCreation()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900"
              >
                Create issues
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900">Creating issues</h2>
            {createError ? (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{createError}</p>
                <button
                  type="button"
                  onClick={() => setStep(3)}
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
        )}
      </div>
    </PageContentSection>
  );
};

export default IssueBulkCreationPage;
