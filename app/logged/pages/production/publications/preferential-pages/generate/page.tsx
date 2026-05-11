"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";
import type { Magazine } from "@/app/contents/interfaces";
import type { PreferentialSlotApiRow } from "../../[id_publication]/_shared";
import {
  CANONICAL_PREFERENTIAL_POSITIONS,
  displayPreferentialPosition,
  selectionKey,
} from "./preferentialSlotPositions";

const BASE = "/logged/pages/production/publications/preferential-pages";

type WizardStep = 1 | 2 | 3 | 4 | 5;

const stepLabels: Record<WizardStep, string> = {
  1: "Select magazines",
  2: "Select publications",
  3: "Review slots",
  4: "Summary",
  5: "Creating slots",
};

type PublicationRow = {
  id_publication: string;
  publication_edition_name: string;
  publication_status: string;
  publication_year: number | null;
  magazine_this_year_issue: number | null;
};

type MagazinePublicationsPlan = {
  magazine: Magazine;
  publications: PublicationRow[];
  loadError: string | null;
};

type PublicationSlotReview = {
  magazineId: string;
  magazineName: string;
  publication: PublicationRow;
  slots: PreferentialSlotApiRow[];
  loadError: string | null;
};

type CreationQueueItem = {
  publicationId: string;
  publicationLabel: string;
  magazineName: string;
  positions: string[];
};

function normalizeMagazines(data: unknown): Magazine[] {
  if (Array.isArray(data)) return data as Magazine[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Magazine[] }).data;
  }
  return [];
}

function normalizePublications(data: unknown): PublicationRow[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id_publication: String(item.id_publication ?? ""),
      publication_edition_name: String(item.publication_edition_name ?? ""),
      publication_status: String(item.publication_status ?? ""),
      publication_year: item.publication_year != null ? Number(item.publication_year) : null,
      magazine_this_year_issue:
        item.magazine_this_year_issue != null ? Number(item.magazine_this_year_issue) : null,
    };
  });
}

const PreferentialSlotsGeneratePage: FC = () => {
  const router = useRouter();
  const { setPageMeta } = usePageContent();

  const [step, setStep] = useState<WizardStep>(1);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [magazinesLoading, setMagazinesLoading] = useState(true);
  const [magazinesError, setMagazinesError] = useState<string | null>(null);
  const [selectedMagazineIds, setSelectedMagazineIds] = useState<Set<string>>(new Set());

  const [publicationPlans, setPublicationPlans] = useState<MagazinePublicationsPlan[]>([]);
  const [publicationsLoading, setPublicationsLoading] = useState(false);
  const [publicationsError, setPublicationsError] = useState<string | null>(null);
  const [selectedPublicationIds, setSelectedPublicationIds] = useState<Set<string>>(new Set());

  const [slotReviews, setSlotReviews] = useState<PublicationSlotReview[]>([]);
  const [slotReviewsLoading, setSlotReviewsLoading] = useState(false);
  const [slotReviewsError, setSlotReviewsError] = useState<string | null>(null);
  const [selectedMissingSlots, setSelectedMissingSlots] = useState<Set<string>>(new Set());

  const [createProgress, setCreateProgress] = useState({ done: 0, total: 0, currentLabel: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const breadcrumbs = useMemo(
    () => [
      { label: "Production", href: "/logged/pages/production/services" },
      { label: "Publications", href: "/logged/pages/production/publications/issues" },
      { label: "Preferential pages", href: BASE },
      { label: "Generate preferential slots" },
    ],
    []
  );

  useEffect(() => {
    setPageMeta({
      pageTitle: "Generate preferential slots",
      breadcrumbs,
      buttons: [{ label: "Back to preferential pages", href: BASE }],
    });
  }, [setPageMeta, breadcrumbs]);

  useEffect(() => {
    if (!createSuccess) return;
    const timer = window.setTimeout(() => router.push(BASE), 2500);
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

  const allMagazinesSelected =
    sortedMagazines.length > 0 && sortedMagazines.every((magazine) => selectedMagazineIds.has(magazine.id_magazine));
  const someMagazinesSelected = sortedMagazines.some((magazine) => selectedMagazineIds.has(magazine.id_magazine));

  const toggleMagazine = (magazineId: string) => {
    setSelectedMagazineIds((prev) => {
      const next = new Set(prev);
      if (next.has(magazineId)) next.delete(magazineId);
      else next.add(magazineId);
      return next;
    });
  };

  const toggleSelectAllMagazines = () => {
    setSelectedMagazineIds((prev) => {
      if (sortedMagazines.length === 0) return prev;
      if (sortedMagazines.every((magazine) => prev.has(magazine.id_magazine))) {
        return new Set();
      }
      return new Set(sortedMagazines.map((magazine) => magazine.id_magazine));
    });
  };

  const loadPublicationsForSelection = useCallback(async () => {
    const ids = Array.from(selectedMagazineIds);
    if (ids.length === 0) return;
    setPublicationsLoading(true);
    setPublicationsError(null);
    try {
      const results = await Promise.all(
        ids.map(async (magazineId) => {
          const magazine = magazines.find((item) => item.id_magazine === magazineId);
          if (!magazine) {
            return {
              magazine: { id_magazine: magazineId, name: magazineId } as Magazine,
              publications: [],
              loadError: "Magazine not found in the current list.",
            };
          }
          try {
            const data = await PublicationService.listPublicationsForMagazine(magazineId);
            return {
              magazine,
              publications: normalizePublications(data),
              loadError: null,
            };
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to load publications";
            return { magazine, publications: [], loadError: message };
          }
        })
      );
      setPublicationPlans(results);
      setSelectedPublicationIds(new Set());
    } catch (e: unknown) {
      setPublicationPlans([]);
      setPublicationsError(e instanceof Error ? e.message : "Failed to load publications");
    } finally {
      setPublicationsLoading(false);
    }
  }, [magazines, selectedMagazineIds]);

  const togglePublication = (publicationId: string) => {
    setSelectedPublicationIds((prev) => {
      const next = new Set(prev);
      if (next.has(publicationId)) next.delete(publicationId);
      else next.add(publicationId);
      return next;
    });
  };

  const toggleAllPublicationsForMagazine = (plan: MagazinePublicationsPlan) => {
    setSelectedPublicationIds((prev) => {
      const next = new Set(prev);
      const ids = plan.publications.map((publication) => publication.id_publication);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const loadSlotReviews = useCallback(async () => {
    const selected = publicationPlans.flatMap((plan) =>
      plan.publications
        .filter((publication) => selectedPublicationIds.has(publication.id_publication))
        .map((publication) => ({ plan, publication }))
    );
    if (selected.length === 0) return;

    setSlotReviewsLoading(true);
    setSlotReviewsError(null);
    try {
      const reviews = await Promise.all(
        selected.map(async ({ plan, publication }) => {
          try {
            const res = await fetch(
              `/api/v1/publications/${encodeURIComponent(publication.id_publication)}/preferential-slots?ensure=false`,
              { cache: "no-store", credentials: "include" }
            );
            if (!res.ok) throw new Error(`Failed to load slots (${res.status})`);
            const data = (await res.json()) as { slots?: PreferentialSlotApiRow[] };
            return {
              magazineId: plan.magazine.id_magazine,
              magazineName: plan.magazine.name,
              publication,
              slots: Array.isArray(data.slots) ? data.slots : [],
              loadError: null,
            };
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to load preferential slots";
            return {
              magazineId: plan.magazine.id_magazine,
              magazineName: plan.magazine.name,
              publication,
              slots: [],
              loadError: message,
            };
          }
        })
      );
      setSlotReviews(reviews);
      const initialSelection = new Set<string>();
      for (const review of reviews) {
        for (const slot of review.slots) {
          if (slot.missing) {
            initialSelection.add(selectionKey(review.publication.id_publication, slot.position_in_magazine));
          }
        }
      }
      setSelectedMissingSlots(initialSelection);
    } catch (e: unknown) {
      setSlotReviews([]);
      setSlotReviewsError(e instanceof Error ? e.message : "Failed to prepare slot review");
    } finally {
      setSlotReviewsLoading(false);
    }
  }, [publicationPlans, selectedPublicationIds]);

  const toggleMissingSlot = (publicationId: string, position: string) => {
    const key = selectionKey(publicationId, position);
    setSelectedMissingSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllMissingForPublication = (review: PublicationSlotReview) => {
    const missingKeys = review.slots
      .filter((slot) => slot.missing)
      .map((slot) => selectionKey(review.publication.id_publication, slot.position_in_magazine));
    setSelectedMissingSlots((prev) => {
      const next = new Set(prev);
      const allSelected = missingKeys.length > 0 && missingKeys.every((key) => next.has(key));
      if (allSelected) {
        missingKeys.forEach((key) => next.delete(key));
      } else {
        missingKeys.forEach((key) => next.add(key));
      }
      return next;
    });
  };

  const creationQueue = useMemo<CreationQueueItem[]>(() => {
    const grouped = new Map<string, CreationQueueItem>();
    for (const review of slotReviews) {
      const positions = review.slots
        .filter(
          (slot) =>
            slot.missing &&
            selectedMissingSlots.has(selectionKey(review.publication.id_publication, slot.position_in_magazine))
        )
        .map((slot) => slot.position_in_magazine);
      if (!positions.length) continue;
      grouped.set(review.publication.id_publication, {
        publicationId: review.publication.id_publication,
        publicationLabel: review.publication.publication_edition_name || review.publication.id_publication,
        magazineName: review.magazineName,
        positions,
      });
    }
    return Array.from(grouped.values());
  }, [slotReviews, selectedMissingSlots]);

  const totalSelectedSlots = useMemo(
    () => creationQueue.reduce((sum, item) => sum + item.positions.length, 0),
    [creationQueue]
  );

  const existingSlotsCount = useMemo(
    () => slotReviews.reduce((sum, review) => sum + review.slots.filter((slot) => !slot.missing).length, 0),
    [slotReviews]
  );

  const runCreation = async () => {
    if (creationQueue.length === 0) {
      setCreatedCount(0);
      setCreateSuccess(true);
      setStep(5);
      return;
    }

    setStep(5);
    setCreateError(null);
    setCreateSuccess(false);
    setCreatedCount(0);
    setCreateProgress({ done: 0, total: totalSelectedSlots, currentLabel: "" });

    let created = 0;
    for (const item of creationQueue) {
      setCreateProgress((prev) => ({
        ...prev,
        currentLabel: `${item.magazineName} · ${item.publicationLabel}`,
      }));
      try {
        const res = await fetch(
          `/api/v1/publications/${encodeURIComponent(item.publicationId)}/preferential-slots`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ positions: item.positions }),
          }
        );
        if (!res.ok) {
          let message = `Failed to create slots (${res.status})`;
          try {
            const payload = (await res.json()) as { message?: unknown };
            if (payload && typeof payload.message === "string" && payload.message.trim()) {
              message = payload.message;
            }
          } catch {
          }
          throw new Error(message);
        }
        const payload = (await res.json()) as { created?: string[] };
        const createdForPublication = Array.isArray(payload.created) ? payload.created.length : item.positions.length;
        created += createdForPublication;
        setCreateProgress((prev) => ({
          done: prev.done + createdForPublication,
          total: prev.total,
          currentLabel: `${item.magazineName} · ${item.publicationLabel}`,
        }));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to create preferential slots";
        setCreateError(`${item.magazineName} · ${item.publicationLabel}: ${message}`);
        return;
      }
    }

    setCreatedCount(created);
    setCreateSuccess(true);
  };

  return (
    <PageContentSection className="pt-4">
      <div className="flex flex-col gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600">
            Create missing preferential slots for existing publications. Each publication should include cover page,
            inside cover, preferential pages 1–9, and end page.
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
                            checked={allMagazinesSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = !allMagazinesSelected && someMagazinesSelected;
                            }}
                            onChange={toggleSelectAllMagazines}
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
                          Periodicity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{magazine.id_magazine}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{magazine.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                  onClick={() => {
                    void loadPublicationsForSelection();
                    setStep(2);
                  }}
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
              {publicationsLoading ? (
                <p className="text-sm text-gray-500">Loading publications…</p>
              ) : (
                <>
                  {publicationsError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      {publicationsError}
                    </div>
                  )}
                  {publicationPlans.map((plan) => {
                    const publicationIds = plan.publications.map((publication) => publication.id_publication);
                    const allSelected =
                      publicationIds.length > 0 &&
                      publicationIds.every((id) => selectedPublicationIds.has(id));
                    const someSelected = publicationIds.some((id) => selectedPublicationIds.has(id));
                    return (
                      <details key={plan.magazine.id_magazine} open className="border border-gray-200 rounded-lg">
                        <summary className="cursor-pointer list-none px-4 py-3 bg-gray-50 rounded-lg flex flex-wrap items-center justify-between gap-3">
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
                              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Select
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Publication ID
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Edition
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Year
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Issue
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
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
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={publicationsLoading || selectedPublicationIds.size === 0}
                  onClick={() => {
                    void loadSlotReviews();
                    setStep(3);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-6 flex flex-col gap-4">
              {slotReviewsLoading ? (
                <p className="text-sm text-gray-500">Loading preferential slots…</p>
              ) : (
                <>
                  {slotReviewsError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
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
                      <details key={review.publication.id_publication} open className="border border-gray-200 rounded-lg">
                        <summary className="cursor-pointer list-none px-4 py-3 bg-gray-50 rounded-lg flex flex-wrap items-center justify-between gap-3">
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
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Create
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Position
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
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
                                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-900">
                                            Missing
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
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
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={slotReviewsLoading || slotReviews.length === 0}
                  onClick={() => setStep(4)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
            <p className="mt-2 text-sm text-gray-600">
              {slotReviews.length} publication{slotReviews.length === 1 ? "" : "s"} · {existingSlotsCount} existing slot
              {existingSlotsCount === 1 ? "" : "s"} · {totalSelectedSlots} to create
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Magazine</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Publication</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Positions</th>
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
                onClick={() => setStep(3)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void runCreation()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900"
              >
                Confirm and create
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900">Creating slots</h2>
            {createError ? (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{createError}</p>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                >
                  Back to summary
                </button>
              </div>
            ) : createSuccess ? (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  {createdCount === 0
                    ? "No new preferential slots were required for the selected publications."
                    : `Successfully created ${createdCount} preferential slot${createdCount === 1 ? "" : "s"}. Redirecting to preferential pages…`}
                </p>
                <button
                  type="button"
                  onClick={() => router.push(BASE)}
                  className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900"
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

export default PreferentialSlotsGeneratePage;
