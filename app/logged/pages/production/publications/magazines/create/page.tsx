"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { MagazineIssue } from "@/app/contents/interfaces";
import magazinesData from "@/app/contents/magazines.json";

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
};

const allMagazines = magazinesData as { id_magazine: string }[];

function generateNextMagazineId(): string {
  const prefix = "mag-";
  const numericIds = allMagazines
    .map((m) => {
      const match = (m.id_magazine || "").replace(prefix, "").match(/^(\d+)$/);
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

  const nextId = useMemo(() => generateNextMagazineId(), []);

  // When num_issues changes, rebuild issue list (1 to n)
  useEffect(() => {
    const n = Math.max(0, Math.min(100, form.num_issues));
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

  const canAdvanceStep1 = form.name.trim().length > 0;

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      setForm((f) => ({ ...f, id_magazine: nextId }));
      setStep(2);
    } else if (step === 2) setStep(3);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;
    setSubmitting(true);
    const yearKey = form.starting_year.trim() || String(currentYear);
    const issuesForYear: MagazineIssue[] = form.issues.map(
      ({ issue_number, is_special_edition, special_topic }) => ({
        issue_number,
        is_special_edition,
        ...(is_special_edition && special_topic ? { special_topic } : {}),
      })
    );
    const payload = {
      id_magazine: form.id_magazine || nextId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      first_year: form.starting_year ? Number(form.starting_year) : currentYear,
      notes: form.notes.trim() || undefined,
      issues_by_year: form.issues.length > 0 ? { [yearKey]: issuesForYear } : undefined,
    };
    // TODO: POST to API when available; for now demo
    console.log("Magazine payload", payload);
    setTimeout(() => {
      router.push(BASE);
    }, 300);
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
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Number of issues</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={form.num_issues || ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            num_issues: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-full max-w-[120px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    {form.issues.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <p className="text-sm font-medium text-gray-700">Issues</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {form.issues.map((issue, index) => (
                            <div
                              key={issue.key}
                              className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Issue #{issue.issue_number}</span>
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
                          ))}
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
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
