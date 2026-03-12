"use client";

import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { MagazineIssue } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/magazines";

type IssueFormRow = MagazineIssue & { key: string };

const CreateMagazinePage: FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [idMagazine, setIdMagazine] = useState("");
  const [description, setDescription] = useState("");
  const [firstYear, setFirstYear] = useState("");
  const [lastYear, setLastYear] = useState("");
  const [notes, setNotes] = useState("");
  const [plannedYear, setPlannedYear] = useState("");
  const [numIssues, setNumIssues] = useState<number>(0);
  const [issues, setIssues] = useState<IssueFormRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  // When numIssues or plannedYear changes, rebuild issue cards (keep existing data when possible)
  useEffect(() => {
    const n = Math.max(0, Math.min(100, numIssues));
    const year = plannedYear.trim();
    if (n === 0 || !year) {
      setIssues([]);
      return;
    }
    setIssues((prev) => {
      const next: IssueFormRow[] = [];
      for (let i = 1; i <= n; i++) {
        const existing = prev.find((x) => x.issue_number === i);
        next.push(
          existing ?? {
            key: `issue-${i}`,
            issue_number: i,
            is_special_edition: false,
            special_topic: undefined,
          }
        );
      }
      return next;
    });
  }, [numIssues, plannedYear]);

  const setIssue = (index: number, patch: Partial<IssueFormRow>) => {
    setIssues((prev) =>
      prev.map((iss, i) => (i === index ? { ...iss, ...patch } : iss))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Build issues_by_year for the planned year
    const yearKey = plannedYear.trim();
    const issuesForYear: MagazineIssue[] = issues.map(
      ({ issue_number, is_special_edition, special_topic }) => ({
        issue_number,
        is_special_edition,
        ...(is_special_edition && special_topic ? { special_topic } : {}),
      })
    );
    // Demo: no persistence; in real app would POST magazine with issues_by_year: { [yearKey]: issuesForYear }
    console.log("Magazine payload", {
      id_magazine: idMagazine,
      name,
      description,
      first_year: firstYear ? Number(firstYear) : undefined,
      last_year: lastYear ? Number(lastYear) : undefined,
      notes,
      issues_by_year: yearKey ? { [yearKey]: issuesForYear } : undefined,
    });
    setTimeout(() => {
      router.push(BASE);
    }, 300);
  };

  const canAddIssues = plannedYear.trim() !== "" && Number(plannedYear) >= 1900 && Number(plannedYear) <= 2100;

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID (required)</label>
          <input
            type="text"
            value={idMagazine}
            onChange={(e) => setIdMagazine(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. mag-004"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name (required)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Magazine name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First year</label>
            <input
              type="number"
              value={firstYear}
              onChange={(e) => setFirstYear(e.target.value)}
              min={1900}
              max={2100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2020"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last year</label>
            <input
              type="number"
              value={lastYear}
              onChange={(e) => setLastYear(e.target.value)}
              min={1900}
              max={2100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2025"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Issues planned for a year</h3>
          <p className="text-sm text-gray-600 mb-4">
            Indicate the year and how many issues are planned for that year. For each issue you can mark it as special edition and set a special topic.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={plannedYear}
                onChange={(e) => setPlannedYear(e.target.value)}
                min={1900}
                max={2100}
                className="w-full max-w-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of issues planned for this year</label>
              <input
                type="number"
                min={0}
                max={100}
                value={numIssues || ""}
                onChange={(e) => setNumIssues(Math.max(0, parseInt(e.target.value, 10) || 0))}
                disabled={!canAddIssues}
                className="w-full max-w-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="0"
              />
            </div>
          </div>

          {issues.length > 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-medium text-gray-700">Issue cards</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {issues.map((issue, index) => (
                  <div
                    key={issue.key}
                    className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Issue #{issue.issue_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Special edition</span>
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
                        <label className="block text-xs text-gray-600 mb-1">Special topic</label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Create magazine"}
          </button>
          <button
            type="button"
            onClick={() => router.push(BASE)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default CreateMagazinePage;
