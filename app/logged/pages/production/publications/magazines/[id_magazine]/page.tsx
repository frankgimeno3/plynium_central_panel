"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import magazinesData from "@/app/contents/magazines.json";
import publicationsData from "@/app/contents/publications.json";
import { Magazine, MagazineIssue, publicationInterface } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/magazines";

const MagazineDetailPage: FC<{ params: Promise<{ id_magazine: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_magazine } = use(params);
  const magazineFromData = (magazinesData as Magazine[]).find((m) => m.id_magazine === id_magazine);
  const [issuesByYear, setIssuesByYear] = useState<Record<string, MagazineIssue[]>>({});
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { setPageMeta } = usePageContent();

  const magazine = magazineFromData;

  // Initialize editable issues from magazine
  useEffect(() => {
    if (magazine?.issues_by_year) {
      const copy: Record<string, MagazineIssue[]> = {};
      Object.entries(magazine.issues_by_year).forEach(([y, arr]) => {
        copy[y] = arr.map((i) => ({ ...i }));
      });
      setIssuesByYear(copy);
      if (!selectedYear && Object.keys(copy).length > 0) {
        setSelectedYear(Object.keys(copy).sort((a, b) => Number(b) - Number(a))[0]);
      }
    } else {
      setIssuesByYear({});
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
    const maxNum = issuesForYear.length === 0 ? 0 : Math.max(...issuesForYear.map((i) => i.issue_number));
    setIssuesForSelectedYear([
      ...issuesForYear,
      { issue_number: maxNum + 1, is_special_edition: false },
    ]);
  };

  const publicationsByYear = useMemo(() => {
    if (!magazine) return [];
    const all = publicationsData as publicationInterface[];
    const forMagazine = all.filter((p) => p.revista === magazine.name);
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
  }, [magazine]);

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
          <p className="font-medium text-gray-900">{magazine.name}</p>
        </div>
        {magazine.portal_name && (
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 uppercase">Portal</p>
            <p className="font-medium text-gray-900">{magazine.portal_name}</p>
          </div>
        )}
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Description</p>
          <p className="text-gray-700">{magazine.description ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">First year</p>
          <p className="text-gray-900">{magazine.first_year ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Last year</p>
          <p className="text-gray-900">{magazine.last_year ?? "—"}</p>
        </div>
        {magazine.notes && (
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 uppercase">Notes</p>
            <p className="text-gray-700">{magazine.notes}</p>
          </div>
        )}
      </div>
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special edition</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special topic</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issuesForYear.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                    No issues planned for this year. Add one below.
                  </td>
                </tr>
              ) : (
                issuesForYear.map((issue) => (
                  <tr key={issue.issue_number} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.issue_number}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={addIssue}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add issue
          </button>
        </div>
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
