"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";
import type { Magazine } from "@/app/contents/interfaces";
import { selectionKey } from "../preferentialSlotPositions";
import { PREFERENTIAL_PAGES_BASE } from "./preferential_generate_constants";
import {
  normalizeMagazines,
  normalizePublications,
  type CreationQueueItem,
  type MagazinePublicationsPlan,
  type PublicationSlotReview,
  type WizardStep,
} from "./preferential_generate_types";
import { WizardStepIndicator } from "./preferential_generate_components/WizardStepIndicator";
import { StepSelectMagazines } from "./preferential_generate_components/wizard_steps/StepSelectMagazines";
import { StepSelectPublications } from "./preferential_generate_components/wizard_steps/StepSelectPublications";
import { StepReviewSlots } from "./preferential_generate_components/wizard_steps/StepReviewSlots";
import { StepSummary } from "./preferential_generate_components/wizard_steps/StepSummary";
import { StepCreating } from "./preferential_generate_components/wizard_steps/StepCreating";
import type { PreferentialSlotApiRow } from "../../../[id_publication]/_shared";

const PreferentialGeneratePage: FC = () => {
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
      { label: "Preferential pages", href: PREFERENTIAL_PAGES_BASE },
      { label: "Generate preferential slots" },
    ],
    []
  );

  useEffect(() => {
    setPageMeta({
      pageTitle: "Generate preferential slots",
      breadcrumbs,
      buttons: [{ label: "Back to preferential pages", href: PREFERENTIAL_PAGES_BASE }],
    });
  }, [setPageMeta, breadcrumbs]);

  useEffect(() => {
    if (!createSuccess) return;
    const timer = window.setTimeout(() => router.push(PREFERENTIAL_PAGES_BASE), 2500);
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
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">
            Create missing preferential slots for existing publications. Each publication should include cover page,
            inside cover, preferential pages 1–9, and end page.
          </p>
          <WizardStepIndicator step={step} />
        </div>

        {step === 1 && (
          <StepSelectMagazines
            magazinesError={magazinesError}
            loadMagazines={loadMagazines}
            magazinesLoading={magazinesLoading}
            sortedMagazines={sortedMagazines}
            selectedMagazineIds={selectedMagazineIds}
            allMagazinesSelected={allMagazinesSelected}
            someMagazinesSelected={someMagazinesSelected}
            toggleSelectAllMagazines={toggleSelectAllMagazines}
            toggleMagazine={toggleMagazine}
            onContinue={() => {
              void loadPublicationsForSelection();
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <StepSelectPublications
            publicationsLoading={publicationsLoading}
            publicationsError={publicationsError}
            publicationPlans={publicationPlans}
            selectedPublicationIds={selectedPublicationIds}
            togglePublication={togglePublication}
            toggleAllPublicationsForMagazine={toggleAllPublicationsForMagazine}
            onBack={() => setStep(1)}
            onContinue={() => {
              void loadSlotReviews();
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <StepReviewSlots
            slotReviewsLoading={slotReviewsLoading}
            slotReviewsError={slotReviewsError}
            slotReviews={slotReviews}
            selectedMissingSlots={selectedMissingSlots}
            toggleMissingSlot={toggleMissingSlot}
            toggleAllMissingForPublication={toggleAllMissingForPublication}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepSummary
            slotReviewsLength={slotReviews.length}
            existingSlotsCount={existingSlotsCount}
            totalSelectedSlots={totalSelectedSlots}
            creationQueue={creationQueue}
            onBack={() => setStep(3)}
            onConfirmCreate={runCreation}
          />
        )}

        {step === 5 && (
          <StepCreating
            createError={createError}
            createSuccess={createSuccess}
            createdCount={createdCount}
            createProgress={createProgress}
            onBackToSummary={() => setStep(4)}
            onGoToPreferentialPages={() => router.push(PREFERENTIAL_PAGES_BASE)}
          />
        )}
      </div>
    </PageContentSection>
  );
};

export default PreferentialGeneratePage;
