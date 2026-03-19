"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { fetchPublishedPublications } from "@/app/contents/publicationsHelpers";
import type { Magazine, MagazineIssue, publicationInterface } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/magazines";
const MAX_ISSUES_PER_YEAR = 12;

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
  value: m,
  label: new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" }),
}));

const MagazineDetailPage: FC<{ params: Promise<{ id_magazine: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_magazine } = use(params);
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuesByYear, setIssuesByYear] = useState<Record<string, MagazineIssue[]>>({});
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [publishedList, setPublishedList] = useState<publicationInterface[]>([]);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    fetchPublishedPublications()
      .then(setPublishedList)
      .catch(() => setPublishedList([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    MagazineService.getMagazineById(id_magazine)
      .then((data) => {
        if (!cancelled) setMagazine(data);
      })
      .catch(() => {
        if (!cancelled) setMagazine(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id_magazine]);

  // Editable fields for name, description, notes
  const [editableName, setEditableName] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [editableNotes, setEditableNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [issuesDirty, setIssuesDirty] = useState(false);

  useEffect(() => {
    if (magazine) {
      setEditableName(magazine.name ?? "");
      setEditableDescription(magazine.description ?? "");
      setEditableNotes(magazine.notes ?? "");
    }
  }, [magazine?.id_magazine, magazine?.name, magazine?.description, magazine?.notes]);

  const hasChanges = Boolean(
    magazine &&
    (editableName !== (magazine.name ?? "") ||
      editableDescription !== (magazine.description ?? "") ||
      editableNotes !== (magazine.notes ?? ""))
  );

  const handleSaveChanges = async () => {
    if (!magazine || saving) return;
    if (!hasChanges && !issuesDirty) return;
    if (issuesDirty && !issuesMonthValid) return;
    setSaving(true);
    try {
      const payload: { name?: string; description?: string; notes?: string; issues_by_year?: Record<string, MagazineIssue[]> } = {};
      if (hasChanges) {
        payload.name = editableName.trim();
        payload.description = editableDescription.trim();
        payload.notes = editableNotes.trim();
      }
      if (issuesDirty) payload.issues_by_year = issuesByYear;
      const updated = await MagazineService.updateMagazine(magazine.id_magazine, payload);
      setMagazine(updated);
      if (updated.issues_by_year) setIssuesByYear(updated.issues_by_year);
      setEditableName(updated.name ?? "");
      setEditableDescription(updated.description ?? "");
      setEditableNotes(updated.notes ?? "");
      setIssuesDirty(false);
    } catch {
      // Could add toast/alert
    } finally {
      setSaving(false);
    }
  };

  // Initialize editable issues from magazine
  useEffect(() => {
    if (magazine?.issues_by_year) {
      const copy: Record<string, MagazineIssue[]> = {};
      Object.entries(magazine.issues_by_year).forEach(([y, arr]) => {
        copy[y] = arr.map((i) => ({ ...i }));
      });
      setIssuesByYear(copy);
      setIssuesDirty(false);
      if (!selectedYear && Object.keys(copy).length > 0) {
        setSelectedYear(Object.keys(copy).sort((a, b) => Number(b) - Number(a))[0]);
      }
    } else {
      setIssuesByYear({});
      setIssuesDirty(false);
      if (magazine?.first_year != null && !selectedYear) {
        setSelectedYear(String(magazine.first_year));
      }
    }
  }, [magazine?.id_magazine]);

  const yearOptions = useMemo(() => {
    const fromIssues = Object.keys(issuesByYear);
    const first = magazine?.first_year ?? new Date().getFullYear();
    const last = magazine?.last_year ?? new Date().getFullYear();
    const range: string[] = [];
    for (let y = first; y <= last; y++) range.push(String(y));
    const combined = Array.from(new Set([...fromIssues, ...range])).sort(
      (a, b) => Number(b) - Number(a)
    );
    return combined;
  }, [magazine?.first_year, magazine?.last_year, issuesByYear]);

  useEffect(() => {
    if (selectedYear === "" && yearOptions.length > 0) {
      setSelectedYear(yearOptions[0]);
    }
  }, [yearOptions, selectedYear]);

  const issuesForYear = selectedYear ? (issuesByYear[selectedYear] ?? []).slice().sort((a, b) => a.issue_number - b.issue_number) : [];

  const setIssuesForSelectedYear = (next: MagazineIssue[]) => {
    if (!selectedYear) return;
    setIssuesDirty(true);
    setIssuesByYear((prev) => ({
      ...prev,
      [selectedYear]: next.sort((a, b) => a.issue_number - b.issue_number),
    }));
  };

  const toggleSpecialEdition = (issueNumber: number) => {
    setIssuesForSelectedYear(
      issuesForYear.map((i) =>
        i.issue_number === issueNumber
          ? {
              ...i,
              is_special_edition: !i.is_special_edition,
              ...(i.is_special_edition ? { special_topic: undefined } : {}),
            }
          : i
      )
    );
  };

  const setSpecialTopic = (issueNumber: number, value: string) => {
    setIssuesForSelectedYear(
      issuesForYear.map((i) =>
        i.issue_number === issueNumber ? { ...i, special_topic: value || undefined } : i
      )
    );
  };

  const monthsUsedForYear = useMemo(() => {
    const set = new Set<number>();
    issuesForYear.forEach((i) => {
      if (i.forecasted_publication_month != null && i.forecasted_publication_month >= 1 && i.forecasted_publication_month <= 12) {
        set.add(i.forecasted_publication_month);
      }
    });
    return set;
  }, [issuesForYear]);

  const setForecastedMonth = (issueNumber: number, value: number | undefined) => {
    setIssuesForSelectedYear(
      issuesForYear.map((i) =>
        i.issue_number === issueNumber ? { ...i, forecasted_publication_month: value } : i
      )
    );
  };

  const deleteIssue = (issueNumber: number) => {
    const filtered = issuesForYear.filter((i) => i.issue_number !== issueNumber);
    const renumbered = filtered.map((i) =>
      i.issue_number > issueNumber
        ? { ...i, issue_number: i.issue_number - 1 }
        : i
    );
    setIssuesForSelectedYear(renumbered);
  };

  const addIssue = () => {
    if (issuesForYear.length >= MAX_ISSUES_PER_YEAR) return;
    const maxNum = issuesForYear.length === 0 ? 0 : Math.max(...issuesForYear.map((i) => i.issue_number));
    setIssuesForSelectedYear([
      ...issuesForYear,
      { issue_number: maxNum + 1, is_special_edition: false },
    ]);
  };

  const issuesMonthValid = useMemo(() => {
    if (issuesForYear.length === 0) return true;
    const filled = issuesForYear.filter((i) => i.forecasted_publication_month != null && i.forecasted_publication_month >= 1 && i.forecasted_publication_month <= 12);
    const uniqueMonths = new Set(filled.map((i) => i.forecasted_publication_month));
    const allInOrder = issuesForYear.every((issue, index) => {
      const prev = issuesForYear[index - 1];
      const minMonth = index === 0 ? issue.issue_number : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
      return (issue.forecasted_publication_month ?? 0) >= minMonth;
    });
    return filled.length === issuesForYear.length && uniqueMonths.size === issuesForYear.length && allInOrder;
  }, [issuesForYear]);

  const publicationsByYear = useMemo(() => {
    if (!magazine) return [];
    const forMagazine = publishedList.filter((p) => p.revista === magazine.name);
    const byYear = new Map<number, publicationInterface[]>();
    forMagazine.forEach((p) => {
      const d = new Date(p.date);
      const year = isNaN(d.getTime()) ? 0 : d.getFullYear();
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year)!.push(p);
    });
    byYear.forEach((arr) => arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    return Array.from(byYear.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, pubs]) => ({ year, publications: pubs }));
  }, [magazine, publishedList]);

  useEffect(() => {
    if (magazine) {
      setPageMeta({
        pageTitle: magazine.name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Magazines", href: `${BASE}` },
          { label: magazine.name },
        ],
        buttons: [{ label: "Back to Magazines", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Magazine not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Magazines", href: BASE },
        ],
        buttons: [{ label: "Back to Magazines", href: BASE }],
      });
    }
  }, [setPageMeta, magazine]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading magazine…</div>
      </PageContentSection>
    );
  }

  if (!magazine) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="text-gray-500">Magazine not found.</p>
              <button
                type="button"
                onClick={() => router.push(BASE)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Back to Magazines
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const publicationDisplayName = (pub: publicationInterface) =>
    `${magazine.name} - ${pub.número}`;

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs text-gray-500 uppercase">ID</p>
          <p className="font-mono text-gray-900">{magazine.id_magazine}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Name</p>
          <input
            type="text"
            value={editableName}
            onChange={(e) => setEditableName(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          />
        </div>
        {magazine.portal_name && (
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 uppercase">Portal</p>
            <p className="font-medium text-gray-900">{magazine.portal_name}</p>
          </div>
        )}
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Description</p>
          <textarea
            value={editableDescription}
            onChange={(e) => setEditableDescription(e.target.value)}
            rows={3}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">First year</p>
          <p className="text-gray-900">{magazine.first_year ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Last year</p>
          <p className="text-gray-900">{magazine.last_year ?? "—"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Notes</p>
          <textarea
            value={editableNotes}
            onChange={(e) => setEditableNotes(e.target.value)}
            rows={2}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            placeholder="—"
          />
        </div>
      </div>
            {(hasChanges || issuesDirty) && (
              <div className="fixed bottom-6 right-6 z-10">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving || (issuesDirty && !issuesMonthValid)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}
          </div>
        </div>
        </div>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Planned issues by year</h2>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Forecasted month</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special edition</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special topic</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issuesForYear.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                    No issues planned for this year. Add one below (max {MAX_ISSUES_PER_YEAR}).
                  </td>
                </tr>
              ) : (
                issuesForYear.map((issue, index) => {
                  const prevIssue = issuesForYear[index - 1];
                  const minMonth = index === 0
                    ? issue.issue_number
                    : Math.max(issue.issue_number, prevIssue?.forecasted_publication_month ?? issue.issue_number);
                  const allowedMonthOptions = MONTH_OPTIONS.filter((opt) => opt.value >= minMonth);
                  return (
                  <tr key={issue.issue_number} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.issue_number}</td>
                    <td className="px-4 py-3">
                      <select
                        value={(issue.forecasted_publication_month != null && issue.forecasted_publication_month >= minMonth)
                          ? issue.forecasted_publication_month
                          : ""}
                        onChange={(e) => setForecastedMonth(issue.issue_number, e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                      >
                        <option value="">—</option>
                        {allowedMonthOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} disabled={monthsUsedForYear.has(opt.value) && issue.forecasted_publication_month !== opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={issue.is_special_edition}
                        onClick={() => toggleSpecialEdition(issue.issue_number)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          issue.is_special_edition ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            issue.is_special_edition ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-sm text-gray-600">{issue.is_special_edition ? "Yes" : "No"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {issue.is_special_edition ? (
                        <input
                          type="text"
                          value={issue.special_topic ?? ""}
                          onChange={(e) => setSpecialTopic(issue.issue_number, e.target.value)}
                          className="w-full max-w-xs px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Special topic"
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteIssue(issue.issue_number)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {issuesDirty && !issuesMonthValid && issuesForYear.length > 0 && (
          <p className="mt-2 text-sm text-red-600">Set a unique forecasted publication month (1–12) for each issue; issue #n must be at least month n, and months must be in order.</p>
        )}
        {(() => {
          const lastIssue = issuesForYear.length > 0 ? issuesForYear[issuesForYear.length - 1] : null;
          const lastIssueIsDecember = lastIssue?.forecasted_publication_month === 12;
          const cannotAddMore = issuesForYear.length >= MAX_ISSUES_PER_YEAR || lastIssueIsDecember;
          return (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addIssue}
                disabled={cannotAddMore}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add issue
              </button>
              {issuesForYear.length >= MAX_ISSUES_PER_YEAR && (
                <span className="text-sm text-gray-500">Max {MAX_ISSUES_PER_YEAR} issues per year.</span>
              )}
              {lastIssueIsDecember && (
                <span className="text-sm text-amber-700">
                  It is not possible to add more issues for this year if there is already an issue scheduled for December.
                </span>
              )}
            </div>
          );
        })()}
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Publications</h2>
        {publicationsByYear.length === 0 ? (
          <p className="text-gray-500">No publications yet for this magazine.</p>
        ) : (
          <div className="space-y-8">
            {publicationsByYear.map(({ year, publications }) => (
              <div key={year}>
                <h3 className="text-lg font-medium text-gray-800 mb-3">{year}</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Publication name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Publication date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Publication link</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {publications.map((pub) => (
                        <tr key={pub.id_publication} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{pub.id_publication}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{publicationDisplayName(pub)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{pub.date}</td>
                          <td className="px-4 py-3 text-sm">
                            {pub.redirectionLink ? (
                              <a
                                href={pub.redirectionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Open
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </PageContentSection>
  );
};

export default MagazineDetailPage;
