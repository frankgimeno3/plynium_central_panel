"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSyncPageMeta } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";
import type { Magazine } from "@/app/contents/interfaces";
import {
  buildPlannedIssueSlots,
  type ExistingPublicationRow,
  type PlannedIssueSlot,
} from "../issueBulkPlan";
import { HORIZON_DAYS, ISSUES_URL, type MagazinePlan, type WizardStep } from "./bulk_creation_page_components/constants";
import { normalizeMagazines } from "./bulk_creation_page_components/utils";
import { BulkCreationWizardHeader } from "./bulk_creation_page_components/BulkCreationWizardHeader";
import { BulkCreationStep1SelectMagazines } from "./bulk_creation_page_components/BulkCreationStep1SelectMagazines";
import { BulkCreationStep2Review } from "./bulk_creation_page_components/BulkCreationStep2Review";
import { BulkCreationStep3Summary } from "./bulk_creation_page_components/BulkCreationStep3Summary";
import { BulkCreationStep4Creating } from "./bulk_creation_page_components/BulkCreationStep4Creating";

const IssueBulkCreationPage: FC = () => {
  const router = useRouter();

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

  useSyncPageMeta({
    pageTitle: "Issue bulk creation",
    breadcrumbs: [
      { label: "Production", href: "/logged/pages/production/services" },
      { label: "Publications", href: ISSUES_URL },
      { label: "Issues", href: ISSUES_URL },
      { label: "Issue bulk creation" },
    ],
    buttons: [{ label: "Back to issues", href: ISSUES_URL }],
  });

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
          real_publication_month_date: slot.expectedDate || null,
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
        <BulkCreationWizardHeader horizonEndLabel={horizonEndLabel} step={step} />

        {step === 1 && (
          <BulkCreationStep1SelectMagazines
            magazinesError={magazinesError}
            loadMagazines={loadMagazines}
            magazinesLoading={magazinesLoading}
            sortedMagazines={sortedMagazines}
            selectedMagazineIds={selectedMagazineIds}
            toggleMagazine={toggleMagazine}
            toggleSelectAll={toggleSelectAll}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            onContinue={goToConfigureStep}
          />
        )}

        {step === 2 && (
          <BulkCreationStep2Review
            plansLoading={plansLoading}
            plansError={plansError}
            plans={plans}
            updateSlot={updateSlot}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <BulkCreationStep3Summary
            plansCount={plans.length}
            existingSlotsCount={existingSlotsCount}
            pendingSlots={pendingSlots}
            onBack={() => setStep(2)}
            onCreate={runCreation}
          />
        )}

        {step === 4 && (
          <BulkCreationStep4Creating
            createError={createError}
            createSuccess={createSuccess}
            createdCount={createdCount}
            createProgress={createProgress}
            onBackToSummary={() => setStep(3)}
          />
        )}
      </div>
    </PageContentSection>
  );
};

export default IssueBulkCreationPage;
