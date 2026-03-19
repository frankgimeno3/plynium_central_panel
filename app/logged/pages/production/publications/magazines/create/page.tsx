"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { MagazineIssue } from "@/app/contents/interfaces";
import { MagazineService } from "@/app/service/MagazineService";

const BASE = "/logged/pages/production/publications/magazines";

type Step = 1 | 2 | 3;

type IssueFormRow = MagazineIssue & { key: string };

type FormState = {
  id_magazine: string;
  name: string;
  description: string;
  starting_year: string;
  notes: string;
  num_issues: number;
  issues: IssueFormRow[];
  /** When true, do NOT auto-create next year issues at end of year (user checked the box). */
  doNotAutoCreateNextYearIssues: boolean;
};

function generateNextMagazineId(existingIds: string[]): string {
  const prefix = "mag-";
  const numericIds = existingIds
    .map((id) => {
      const match = (id || "").replace(prefix, "").match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const next = (max + 1).toString().padStart(3, "0");
  return `${prefix}${next}`;
}

const initialForm: FormState = {
  id_magazine: "",
  name: "",
  description: "",
  starting_year: "",
  notes: "",
  num_issues: 0,
  issues: [],
  doNotAutoCreateNextYearIssues: false,
};

const currentYear = new Date().getFullYear();

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

  const MAX_ISSUES_PER_YEAR = 12;

  // When num_issues changes, rebuild issue list (1 to n), cap at 12
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
      const next = f.issues.filter((_, i) => i !== index).map((iss, i) => ({
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

  const allIssuesHaveMonth = form.issues.length > 0 && form.issues.every((i) => i.forecasted_publication_month != null && i.forecasted_publication_month >= 1 && i.forecasted_publication_month <= 12);
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
          ...(forecasted_publication_month != null && forecasted_publication_month >= 1 && forecasted_publication_month <= 12 ? { forecasted_publication_month } : {}),
        })
      );
      await MagazineService.createMagazine({
        id_magazine: form.id_magazine || nextId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        first_year: form.starting_year ? Number(form.starting_year) : currentYear,
        notes: form.notes.trim() || undefined,
        issues_by_year: form.issues.length > 0 ? { [yearKey]: issuesForYear } : undefined,
      });
      router.push(BASE);
    } catch {
      // Could add toast/alert
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-4">
              {([1, 2, 3] as Step[]).map((s) => (
                <React.Fragment key={s}>
                  <button
                    type="button"
                    onClick={() => s < step && setStep(s)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                      step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
                    } ${step > s ? "cursor-pointer" : ""}`}
                  >
                    {s}
                  </button>
                  {s < 3 && <span className="w-8 h-0.5 bg-gray-300" />}
                </React.Fragment>
              ))}
              <span className="text-sm text-gray-600 ml-2">
                {step === 1 && "Name and description"}
                {step === 2 && "Starting year, notes and issues"}
                {step === 3 && "Review"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="p-6 w-full">
            <form onSubmit={handleSubmit} className="w-full">
              {/* Step 1: Name, Description (ID is assigned) */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Magazine ID</p>
                    <p className="text-base font-mono font-medium text-gray-900">{displayId}</p>
                    <p className="text-xs text-gray-500 mt-1">This ID will be assigned to the new magazine.</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Magazine name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canAdvanceStep1}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Starting year, notes and issues
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Starting year, Notes, Issues this year */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Starting year</label>
                    <input
                      type="number"
                      value={form.starting_year}
                      onChange={(e) => setForm((f) => ({ ...f, starting_year: e.target.value }))}
                      min={1900}
                      max={2100}
                      className="w-full max-w-[120px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={String(currentYear)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Issues this year</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter how many issues to plan. For each issue you can mark it as a special edition and set a special edition topic.
                    </p>

                    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Number of issues (max {MAX_ISSUES_PER_YEAR})</label>
                          <input
                            type="number"
                            min={0}
                            max={MAX_ISSUES_PER_YEAR}
                            value={form.num_issues || ""}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                num_issues: Math.max(0, Math.min(MAX_ISSUES_PER_YEAR, parseInt(e.target.value, 10) || 0)),
                              }))
                            }
                            className="w-full max-w-[120px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>

                        <div className="sm:ml-auto sm:max-w-md rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 shadow-sm">
                          <p className="text-sm text-gray-700 mb-3">
                            By default, new planned issues for the next year will be created at the end of this one, unless you check the box below.
                          </p>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.doNotAutoCreateNextYearIssues}
                              onChange={(e) => setForm((f) => ({ ...f, doNotAutoCreateNextYearIssues: e.target.checked }))}
                              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                            />
                            <span className="text-sm text-gray-800">
                              Click if you DON&apos;t want new issues to be created automatically at the end of the year
                            </span>
                          </label>
                          <p className="mt-3 text-xs font-medium text-gray-500 uppercase tracking-wide border-t border-blue-100 pt-3">
                            Current state
                          </p>
                          <p
                            className={`mt-1.5 inline-block rounded-md px-3 py-2 text-sm font-medium ${
                              form.doNotAutoCreateNextYearIssues
                                ? "bg-red-100 text-red-900"
                                : "bg-green-100 text-green-900"
                            }`}
                          >
                            {form.doNotAutoCreateNextYearIssues ? (
                              <>
                                New issues <strong>will not be created automatically</strong>; the administrator will need to configure them manually if they want them to be created.
                              </>
                            ) : (
                              <>
                                New issues for next year <strong>will be created automatically</strong> at the end of this year based on the current configuration.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {form.issues.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <p className="text-sm font-medium text-gray-700">Issues</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {form.issues.map((issue, index) => {
                            const firstDecemberIndex = form.issues.findIndex((i) => i.forecasted_publication_month === 12);
                            const isFromDecemberOn = firstDecemberIndex >= 0 && index >= firstDecemberIndex;
                            return (
                            <div
                              key={issue.key}
                              className={`rounded-lg border p-4 space-y-3 ${
                                isFromDecemberOn ? "bg-red-50 border-red-300" : "bg-gray-50/50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Issue #{issue.issue_number}</span>
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeIssue(index)}
                                    className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                    title="Remove issue"
                                    aria-label="Remove issue"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                      <line x1="10" y1="11" x2="10" y2="17" />
                                      <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Forecasted publication month <span className="text-red-500">*</span></label>
                                <select
                                  value={(() => {
                                    const prev = form.issues[index - 1];
                                    const minMonth = index === 0 ? issue.issue_number : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
                                    const month = issue.forecasted_publication_month;
                                    return month != null && month >= minMonth ? month : "";
                                  })()}
                                  onChange={(e) => setIssue(index, { forecasted_publication_month: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                >
                                  <option value="">— Select month —</option>
                                  {(() => {
                                    const prev = form.issues[index - 1];
                                    const minMonth = index === 0
                                      ? issue.issue_number
                                      : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
                                    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                      .filter((m) => m >= minMonth)
                                      .map((m) => (
                                        <option
                                          key={m}
                                          value={m}
                                          disabled={monthsUsed.has(m) && issue.forecasted_publication_month !== m}
                                        >
                                          {new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}
                                        </option>
                                      ));
                                  })()}
                                </select>
                                {hasDuplicateMonths && (
                                  <p className="text-xs text-red-600 mt-1">Each issue must have a different forecasted month.</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Is this a special edition?</span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={issue.is_special_edition}
                                  onClick={() =>
                                    setIssue(index, {
                                      is_special_edition: !issue.is_special_edition,
                                      ...(!issue.is_special_edition ? {} : { special_topic: undefined }),
                                    })
                                  }
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    issue.is_special_edition ? "bg-blue-600" : "bg-gray-200"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                                      issue.is_special_edition ? "translate-x-5" : "translate-x-1"
                                    }`}
                                  />
                                </button>
                                <span className="text-sm text-gray-600">{issue.is_special_edition ? "Yes" : "No"}</span>
                              </div>
                              {issue.is_special_edition && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Special Edition Topic</label>
                                  <input
                                    type="text"
                                    value={issue.special_topic ?? ""}
                                    onChange={(e) => setIssue(index, { special_topic: e.target.value || undefined })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Sustainable construction"
                                  />
                                </div>
                              )}
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
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

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Magazine review</p>
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-gray-500">Magazine ID</dt>
                        <dd className="font-medium font-mono">{form.id_magazine || nextId}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Name</dt>
                        <dd className="font-medium">{form.name || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Description</dt>
                        <dd className="font-medium whitespace-pre-wrap">{form.description || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Starting year</dt>
                        <dd className="font-medium">{form.starting_year || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Notes</dt>
                        <dd className="font-medium whitespace-pre-wrap">{form.notes || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Issues this year</dt>
                        <dd className="font-medium">
                          {form.issues.length > 0
                            ? `${form.issues.length} issue(s)${form.issues.some((i) => i.is_special_edition) ? " (including special editions)" : ""}`
                            : "—"}
                        </dd>
                      </div>
                      {form.issues.length > 0 && (
                        <div>
                          <dt className="text-gray-500 mb-1">Issues summary</dt>
                          <dd className="text-gray-700">
                            <ul className="list-disc list-inside space-y-0.5">
                              {form.issues.map((i) => (
                                <li key={i.key}>
                                  Issue #{i.issue_number}
                                  {i.forecasted_publication_month != null
                                    ? ` — ${new Date(2000, i.forecasted_publication_month - 1, 1).toLocaleString("default", { month: "long" })}`
                                    : ""}
                                  {i.is_special_edition && i.special_topic
                                    ? ` — Special: ${i.special_topic}`
                                    : i.is_special_edition
                                      ? " — Special edition"
                                      : ""}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Saving…" : "Create magazine"}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(BASE)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default CreateMagazinePage;
