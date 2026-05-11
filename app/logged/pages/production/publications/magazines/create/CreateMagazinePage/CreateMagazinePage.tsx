"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { MagazineIssue } from "@/app/contents/interfaces";
import { MagazineService } from "@/app/service/MagazineService";

import type { Step, IssueFormRow, FormState } from "./create_magazine_components/types";
import { MAGAZINES_BASE as BASE, currentYear, MAX_ISSUES_PER_YEAR } from "./create_magazine_components/constants";
import { generateNextMagazineId, initialForm } from "./create_magazine_components/createMagazineFormUtils";
import { CreateMagazineWizardHeader } from "./create_magazine_components/CreateMagazineWizardHeader";
import { CreateMagazineStepBasicsForm } from "./create_magazine_components/CreateMagazineStepBasicsForm";
import { CreateMagazineYearDetailFields } from "./create_magazine_components/CreateMagazineYearDetailFields";
import { CreateMagazineIssuesConfigurator } from "./create_magazine_components/CreateMagazineIssuesConfigurator";
import { CreateMagazineStepReviewPanel } from "./create_magazine_components/CreateMagazineStepReviewPanel";

const CreateMagazinePage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    starting_year: String(currentYear),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [existingIds, setExistingIds] = useState<string[]>([]);

  useEffect(() => {
    MagazineService.getAllMagazines()
      .then((list: { id_magazine: string }[] | undefined) => setExistingIds((list || []).map((m) => m.id_magazine)))
      .catch(() => setExistingIds([]));
  }, []);

  const nextId = useMemo(() => generateNextMagazineId(existingIds), [existingIds]);

  useEffect(() => {
    const n = Math.max(0, Math.min(MAX_ISSUES_PER_YEAR, form.num_issues));
    if (n === 0) {
      setForm((f) => ({ ...f, issues: [] }));
      return;
    }
    setForm((f) => {
      const next: IssueFormRow[] = [];
      for (let i = 1; i <= n; i++) {
        const existing = f.issues.find((x) => x.issue_number === i);
        next.push(
          existing ?? {
            key: `issue-${i}`,
            issue_number: i,
            is_special_edition: false,
            special_topic: undefined,
            forecasted_publication_month: undefined,
          }
        );
      }
      return { ...f, issues: next };
    });
  }, [form.num_issues]);

  const setIssue = (index: number, patch: Partial<IssueFormRow>) => {
    setForm((f) => ({
      ...f,
      issues: f.issues.map((iss, i) => (i === index ? { ...iss, ...patch } : iss)),
    }));
  };

  const removeIssue = (index: number) => {
    if (index <= 0 || index >= form.issues.length) return;
    setForm((f) => {
      const next = f.issues
        .filter((_, i) => i !== index)
        .map((iss, i) => ({
          ...iss,
          issue_number: i + 1,
          key: `issue-${i + 1}`,
        }));
      return { ...f, issues: next, num_issues: next.length };
    });
  };

  const canAdvanceStep1 = form.name.trim().length > 0;

  const monthsUsed = useMemo(() => {
    const set = new Set<number>();
    form.issues.forEach((i) => {
      if (i.forecasted_publication_month != null && i.forecasted_publication_month >= 1 && i.forecasted_publication_month <= 12) {
        set.add(i.forecasted_publication_month);
      }
    });
    return set;
  }, [form.issues]);

  const allIssuesHaveMonth =
    form.issues.length > 0 && form.issues.every((i) => i.forecasted_publication_month != null && i.forecasted_publication_month >= 1 && i.forecasted_publication_month <= 12);
  const hasDuplicateMonths = allIssuesHaveMonth && form.issues.length !== monthsUsed.size;
  const allMonthsInOrder = form.issues.every((issue, i) => {
    const prev = form.issues[i - 1];
    const minMonth = i === 0 ? issue.issue_number : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
    return (issue.forecasted_publication_month ?? 0) >= minMonth;
  });
  const canAdvanceStep2 = form.issues.length === 0 || (allIssuesHaveMonth && !hasDuplicateMonths && allMonthsInOrder);

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      setForm((f) => ({ ...f, id_magazine: nextId }));
      setStep(2);
    } else if (step === 2 && canAdvanceStep2) setStep(3);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create magazine",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: BASE },
        { label: "Magazines", href: BASE },
        { label: "Create magazine" },
      ],
      buttons: [{ label: "Back to Magazines", href: BASE }],
    });
  }, [setPageMeta]);

  const displayId = form.id_magazine || nextId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;
    setSubmitting(true);
    try {
      const yearKey = form.starting_year.trim() || String(currentYear);
      const issuesForYear: MagazineIssue[] = form.issues.map(
        ({ issue_number, is_special_edition, special_topic, forecasted_publication_month }) => ({
          issue_number,
          is_special_edition,
          ...(is_special_edition && special_topic ? { special_topic } : {}),
          ...(forecasted_publication_month != null && forecasted_publication_month >= 1 && forecasted_publication_month <= 12
            ? { forecasted_publication_month }
            : {}),
        })
      );
      const subRaw = form.subscriber_number.trim();
      await MagazineService.createMagazine({
        id_magazine: form.id_magazine || nextId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        first_year: form.starting_year ? Number(form.starting_year) : currentYear,
        periodicity: form.periodicity.trim() || undefined,
        subscriber_number: subRaw === "" ? undefined : Number(subRaw),
        issues_by_year: form.issues.length > 0 ? { [yearKey]: issuesForYear } : undefined,
      });
      router.push(BASE);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <CreateMagazineWizardHeader step={step} onGoToPriorStep={(s) => setStep(s)} />

        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="p-6 w-full">
            <form onSubmit={handleSubmit} className="w-full">
              {step === 1 && (
                <CreateMagazineStepBasicsForm
                  displayId={displayId}
                  name={form.name}
                  description={form.description}
                  canAdvanceStep1={canAdvanceStep1}
                  onNameChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  onDescriptionChange={(v) => setForm((f) => ({ ...f, description: v }))}
                  onNext={goNext}
                />
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <CreateMagazineYearDetailFields
                    startingYear={form.starting_year}
                    periodicity={form.periodicity}
                    subscriberNumber={form.subscriber_number}
                    currentYear={currentYear}
                    onStartingYearChange={(v) => setForm((f) => ({ ...f, starting_year: v }))}
                    onPeriodicityChange={(v) => setForm((f) => ({ ...f, periodicity: v }))}
                    onSubscriberNumberChange={(v) => setForm((f) => ({ ...f, subscriber_number: v }))}
                  />

                  <CreateMagazineIssuesConfigurator
                    formNumIssues={form.num_issues}
                    issues={form.issues}
                    monthsUsed={monthsUsed}
                    hasDuplicateMonths={hasDuplicateMonths}
                    onNumIssuesChange={(n) => setForm((f) => ({ ...f, num_issues: n }))}
                    doNotAutoCreateNextYearIssues={form.doNotAutoCreateNextYearIssues}
                    onDoNotAutoToggle={(checked) => setForm((f) => ({ ...f, doNotAutoCreateNextYearIssues: checked }))}
                    setIssue={setIssue}
                    removeIssue={removeIssue}
                  />

                  <div className="flex gap-3">
                    <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canAdvanceStep2}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Review
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <CreateMagazineStepReviewPanel
                  idMagazine={form.id_magazine}
                  nextFallbackId={nextId}
                  name={form.name}
                  description={form.description}
                  startingYear={form.starting_year}
                  periodicity={form.periodicity}
                  subscriberNumber={form.subscriber_number}
                  issues={form.issues}
                  submitting={submitting}
                  onBack={goBack}
                  onCancel={() => router.push(BASE)}
                />
              )}
            </form>
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default CreateMagazinePage;
