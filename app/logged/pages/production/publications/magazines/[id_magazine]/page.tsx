"use client";

import React, { FC, use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";
import type { Magazine, MagazineIssue } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/magazines";
const MAX_ISSUES_PER_YEAR = 12;

const PERIODICITY_OPTIONS = [
  { value: "Annually", label: "Annually" },
  { value: "Semiannually", label: "Semiannually" },
  { value: "Every four months", label: "Every four months" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Bimonthly", label: "Bimonthly" },
  { value: "Monthly", label: "Monthly" },
] as const;

const FORMAT_OPTIONS = [
  { value: "informer", label: "Informer" },
  { value: "flipbook", label: "Flipbook" },
  { value: "both", label: "Both" },
] as const;

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
  value: m,
  label: new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" }),
}));

type PublicationRow = {
  id_publication: string;
  publication_status: string;
  publication_format: string;
  magazine_id: string;
  publication_year: number | null;
  magazine_this_year_issue: number | null;
  magazine_general_issue_number: number | null;
  publication_expected_publication_month: number | null;
  publication_theme: string;
  is_special_edition: boolean;
  publication_edition_name: string;
  real_publication_month_date: string | null;
};

function normalizeStatus(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function isPlannableStatus(s: string) {
  const n = normalizeStatus(s);
  return n === "draft" || n === "planned";
}

function isExpiredTabStatus(s: string) {
  const n = normalizeStatus(s);
  return n === "published" || n === "cancelled";
}

function apiRowToIssue(p: PublicationRow): MagazineIssue {
  const fmt = String(p.publication_format || "flipbook").toLowerCase();
  const publication_format =
    fmt === "informer" || fmt === "flipbook" || fmt === "both"
      ? (fmt as "informer" | "flipbook" | "both")
      : "flipbook";
  return {
    publication_id: p.id_publication,
    issue_number: p.magazine_this_year_issue ?? 1,
    forecasted_publication_month: p.publication_expected_publication_month ?? undefined,
    is_special_edition: Boolean(p.is_special_edition),
    special_topic: p.publication_theme ?? "",
    publication_format,
  };
}

const MagazineDetailPage: FC<{ params: Promise<{ id_magazine: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_magazine } = use(params);
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [allPublications, setAllPublications] = useState<PublicationRow[]>([]);
  const [pubsLoading, setPubsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [publicationsTab, setPublicationsTab] = useState<"forecasted" | "expired">("forecasted");
  const { setPageMeta } = usePageContent();

  const [editableName, setEditableName] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [editablePeriodicity, setEditablePeriodicity] = useState("");
  const [editableSubscriberNumber, setEditableSubscriberNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [issuesDirty, setIssuesDirty] = useState(false);

  const loadPublications = useCallback(async () => {
    setPubsLoading(true);
    try {
      const data = await PublicationService.listPublicationsForMagazine(id_magazine);
      setAllPublications(Array.isArray(data) ? (data as PublicationRow[]) : []);
    } catch {
      setAllPublications([]);
    } finally {
      setPubsLoading(false);
    }
  }, [id_magazine]);

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
    return () => {
      cancelled = true;
    };
  }, [id_magazine]);

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  useEffect(() => {
    if (magazine) {
      setEditableName(magazine.name ?? "");
      setEditableDescription(magazine.description ?? "");
      setEditablePeriodicity(magazine.periodicity ?? "");
      setEditableSubscriberNumber(
        magazine.subscriber_number != null ? String(magazine.subscriber_number) : ""
      );
    }
  }, [magazine?.id_magazine, magazine?.name, magazine?.description, magazine?.periodicity, magazine?.subscriber_number]);

  const hasChanges = Boolean(
    magazine &&
      (editableName !== (magazine.name ?? "") ||
        editableDescription !== (magazine.description ?? "") ||
        editablePeriodicity !== (magazine.periodicity ?? "") ||
        editableSubscriberNumber !==
          (magazine.subscriber_number != null ? String(magazine.subscriber_number) : ""))
  );

  const yearOptions = useMemo(() => {
    const fromPubs = new Set(
      allPublications.map((p) => (p.publication_year != null ? String(p.publication_year) : "")).filter(Boolean)
    );
    const first = magazine?.first_year ?? new Date().getFullYear();
    const last = new Date().getFullYear();
    const range: string[] = [];
    for (let y = first; y <= last; y++) range.push(String(y));
    const combined = Array.from(new Set([...fromPubs, ...range])).sort((a, b) => Number(b) - Number(a));
    return combined;
  }, [magazine?.first_year, allPublications]);

  useEffect(() => {
    if (selectedYear === "" && yearOptions.length > 0) {
      setSelectedYear(yearOptions[0]);
    }
  }, [yearOptions, selectedYear]);

  const issuesForYear = useMemo(() => {
    const y = Number(selectedYear);
    if (!Number.isInteger(y)) return [];
    return allPublications
      .filter((p) => p.publication_year === y && isPlannableStatus(p.publication_status))
      .map(apiRowToIssue)
      .sort((a, b) => a.issue_number - b.issue_number);
  }, [allPublications, selectedYear]);

  const forecastedPublications = useMemo(
    () => allPublications.filter((p) => isPlannableStatus(p.publication_status)),
    [allPublications]
  );

  const expiredPublications = useMemo(
    () => allPublications.filter((p) => isExpiredTabStatus(p.publication_status)),
    [allPublications]
  );

  const tabPublications = publicationsTab === "forecasted" ? forecastedPublications : expiredPublications;

  const monthsUsedForYear = useMemo(() => {
    const set = new Set<number>();
    issuesForYear.forEach((i) => {
      if (
        i.forecasted_publication_month != null &&
        i.forecasted_publication_month >= 1 &&
        i.forecasted_publication_month <= 12
      ) {
        set.add(i.forecasted_publication_month);
      }
    });
    return set;
  }, [issuesForYear]);

  const issuesMonthValid = useMemo(() => {
    if (issuesForYear.length === 0) return true;
    const filled = issuesForYear.filter(
      (i) =>
        i.forecasted_publication_month != null &&
        i.forecasted_publication_month >= 1 &&
        i.forecasted_publication_month <= 12
    );
    const uniqueMonths = new Set(filled.map((i) => i.forecasted_publication_month));
    const allInOrder = issuesForYear.every((issue, index) => {
      const prev = issuesForYear[index - 1];
      const minMonth =
        index === 0
          ? issue.issue_number
          : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
      return (issue.forecasted_publication_month ?? 0) >= minMonth;
    });
    return filled.length === issuesForYear.length && uniqueMonths.size === issuesForYear.length && allInOrder;
  }, [issuesForYear]);

  const patchLocalRow = (publicationId: string, patch: Partial<PublicationRow>) => {
    setIssuesDirty(true);
    setAllPublications((prev) =>
      prev.map((r) => (r.id_publication === publicationId ? { ...r, ...patch } : r))
    );
  };

  const toggleSpecialEdition = (publicationId: string) => {
    const row = allPublications.find((r) => r.id_publication === publicationId);
    if (!row) return;
    patchLocalRow(publicationId, { is_special_edition: !row.is_special_edition });
  };

  const setSpecialTopic = (publicationId: string, value: string) => {
    patchLocalRow(publicationId, { publication_theme: value });
  };

  const setPublicationFormat = (publicationId: string, value: "informer" | "flipbook" | "both") => {
    patchLocalRow(publicationId, { publication_format: value });
  };

  const setForecastedMonth = (publicationId: string, value: number | undefined) => {
    patchLocalRow(publicationId, {
      publication_expected_publication_month: value ?? null,
    });
  };

  const deleteIssue = async (publicationId: string) => {
    try {
      await PublicationService.deletePublication(publicationId);
      setIssuesDirty(false);
      await loadPublications();
    } catch {
      // optional toast
    }
  };

  const addIssue = async () => {
    if (!magazine || !selectedYear) return;
    const y = Number(selectedYear);
    if (issuesForYear.length >= MAX_ISSUES_PER_YEAR) return;
    const inYear = allPublications.filter((p) => p.publication_year === y && isPlannableStatus(p.publication_status));
    const maxNum =
      inYear.length === 0 ? 0 : Math.max(...inYear.map((p) => p.magazine_this_year_issue ?? 0));
    const nextNum = maxNum + 1;
    try {
      await PublicationService.createMagazinePublication(magazine.id_magazine, {
        publication_year: y,
        magazine_this_year_issue: nextNum,
        publication_expected_publication_month: null,
        is_special_edition: false,
        publication_theme: "",
        publication_format: "flipbook",
      });
      await loadPublications();
    } catch {
      // optional toast
    }
  };

  const handleSaveChanges = async () => {
    if (!magazine || saving) return;
    if (!hasChanges && !issuesDirty) return;
    if (issuesDirty && !issuesMonthValid) return;
    setSaving(true);
    try {
      if (hasChanges) {
        const sn = editableSubscriberNumber.trim();
        let subscriber_number: number | null = sn === "" ? null : Number(sn);
        if (subscriber_number != null && Number.isNaN(subscriber_number)) subscriber_number = null;
        const updated = await MagazineService.updateMagazine(magazine.id_magazine, {
          name: editableName.trim(),
          description: editableDescription.trim(),
          periodicity: editablePeriodicity.trim(),
          subscriber_number,
        });
        setMagazine(updated);
        setEditableName(updated.name ?? "");
        setEditableDescription(updated.description ?? "");
        setEditablePeriodicity(updated.periodicity ?? "");
        setEditableSubscriberNumber(
          updated.subscriber_number != null ? String(updated.subscriber_number) : ""
        );
      }
      if (issuesDirty) {
        for (const issue of issuesForYear) {
          if (!issue.publication_id) continue;
          await PublicationService.updatePublication(issue.publication_id, {
            publication_expected_publication_month: issue.forecasted_publication_month ?? null,
            publication_theme: issue.special_topic ?? "",
            is_special_edition: issue.is_special_edition,
            publication_format: issue.publication_format ?? "flipbook",
          });
        }
        setIssuesDirty(false);
        await loadPublications();
      }
    } catch {
      // Could add toast/alert
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (magazine) {
      setPageMeta({
        pageTitle: magazine.name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Magazine titles", href: `${BASE}` },
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
          { label: "Magazine titles", href: BASE },
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
                <p className="text-xs text-gray-500 uppercase">Starting year</p>
                <p className="text-gray-900">{magazine.first_year ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Periodicity</p>
                <select
                  value={
                    PERIODICITY_OPTIONS.some((o) => o.value === editablePeriodicity)
                      ? editablePeriodicity
                      : ""
                  }
                  onChange={(e) => setEditablePeriodicity(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                >
                  <option value="">— Select —</option>
                  {PERIODICITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Subscribers</p>
                <input
                  type="number"
                  min={0}
                  value={editableSubscriberNumber}
                  onChange={(e) => setEditableSubscriberNumber(e.target.value)}
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

        <div className="mt-6 bg-white rounded-b-lg overflow-hidden border border-gray-200 border-t-0">
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
              {pubsLoading && <span className="text-sm text-gray-500">Loading issues…</span>}
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Forecasted month</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special edition</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special topic</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {issuesForYear.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-sm">
                        No issues planned for this year. Add one below (max {MAX_ISSUES_PER_YEAR}).
                      </td>
                    </tr>
                  ) : (
                    issuesForYear.map((issue, index) => {
                      const prevIssue = issuesForYear[index - 1];
                      const minMonth =
                        index === 0
                          ? issue.issue_number
                          : Math.max(
                              issue.issue_number,
                              prevIssue?.forecasted_publication_month ?? issue.issue_number
                            );
                      const allowedMonthOptions = MONTH_OPTIONS.filter((opt) => opt.value >= minMonth);
                      const pubId = issue.publication_id ?? "";
                      return (
                        <tr key={pubId || issue.issue_number} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.issue_number}</td>
                          <td className="px-4 py-3">
                            <select
                              value={
                                issue.forecasted_publication_month != null &&
                                issue.forecasted_publication_month >= minMonth
                                  ? issue.forecasted_publication_month
                                  : ""
                              }
                              onChange={(e) =>
                                setForecastedMonth(
                                  pubId,
                                  e.target.value ? parseInt(e.target.value, 10) : undefined
                                )
                              }
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                            >
                              <option value="">—</option>
                              {allowedMonthOptions.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  disabled={
                                    monthsUsedForYear.has(opt.value) &&
                                    issue.forecasted_publication_month !== opt.value
                                  }
                                >
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
                              onClick={() => toggleSpecialEdition(pubId)}
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
                            <span className="ml-2 text-sm text-gray-600">
                              {issue.is_special_edition ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={issue.special_topic ?? ""}
                              onChange={(e) => setSpecialTopic(pubId, e.target.value)}
                              className="w-full max-w-xs px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Special topic"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={issue.publication_format ?? "flipbook"}
                              onChange={(e) =>
                                setPublicationFormat(
                                  pubId,
                                  e.target.value as "informer" | "flipbook" | "both"
                                )
                              }
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[110px]"
                            >
                              {FORMAT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => deleteIssue(pubId)}
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
              <p className="mt-2 text-sm text-red-600">
                Set a unique forecasted publication month (1–12) for each issue; issue #n must be at least month n,
                and months must be in order.
              </p>
            )}
            {(() => {
              const lastIssue = issuesForYear.length > 0 ? issuesForYear[issuesForYear.length - 1] : null;
              const lastIssueIsDecember = lastIssue?.forecasted_publication_month === 12;
              const cannotAddMore =
                issuesForYear.length >= MAX_ISSUES_PER_YEAR || lastIssueIsDecember || pubsLoading;
              return (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void addIssue()}
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
                      It is not possible to add more issues for this year if there is already an issue scheduled for
                      December.
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-b-lg overflow-hidden border border-gray-200 border-t-0">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Publications</h2>
            <p className="text-sm text-gray-600 mb-3">Data from publications_db for this magazine.</p>
            <div className="flex gap-2 border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setPublicationsTab("forecasted")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  publicationsTab === "forecasted"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Forecasted
              </button>
              <button
                type="button"
                onClick={() => setPublicationsTab("expired")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  publicationsTab === "expired"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Expired (published and cancelled)
              </button>
            </div>
            {tabPublications.length === 0 ? (
              <p className="text-gray-500">No publications in this tab.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edition name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue #</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tabPublications
                      .slice()
                      .sort((a, b) => {
                        const da = a.real_publication_month_date || "";
                        const db = b.real_publication_month_date || "";
                        return db.localeCompare(da);
                      })
                      .map((p) => (
                        <tr key={p.id_publication} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.id_publication}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{p.publication_edition_name || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{p.publication_status}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.publication_year ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.magazine_this_year_issue ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.real_publication_month_date ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.publication_format}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default MagazineDetailPage;
