"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import MagazineSelectModal from "@/app/logged/logged_components/modals/MagazineSelectModal";
import magazinesData from "@/app/contents/magazines.json";
import flatplansData from "@/app/contents/flatplans.json";
import { Flatplan, Magazine, MagazineIssue } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/flatplans";

type Step = 1 | 2 | 3;

const CreateFlatplanPage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [magazineModalOpen, setMagazineModalOpen] = useState(false);

  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [year, setYear] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<MagazineIssue | null>(null);

  const [idFlatplan, setIdFlatplan] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [description, setDescription] = useState("");
  const [editionName, setEditionName] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const flatplans = (flatplansData as Flatplan[]) || [];
  const magazines = (magazinesData as Magazine[]) || [];

  const takenIssueKeys = useMemo(() => {
    const set = new Set<string>();
    flatplans.forEach((f) => {
      if (f.id_magazine != null && f.year != null && f.issue_number != null) {
        set.add(`${f.id_magazine}|${f.year}|${f.issue_number}`);
      }
    });
    return set;
  }, [flatplans]);

  const issuesForMagazineYear = useMemo(() => {
    if (!magazine || !year.trim()) return [];
    const yearKey = year.trim();
    const arr = magazine.issues_by_year?.[yearKey] ?? [];
    return arr.slice().sort((a, b) => a.issue_number - b.issue_number);
  }, [magazine, year]);

  const availableIssues = useMemo(() => {
    return issuesForMagazineYear.filter((issue) => {
      if (!magazine) return false;
      const key = `${magazine.id_magazine}|${year.trim()}|${issue.issue_number}`;
      return !takenIssueKeys.has(key);
    });
  }, [issuesForMagazineYear, magazine, year, takenIssueKeys]);

  const takenIssues = useMemo(() => {
    return issuesForMagazineYear.filter((issue) => {
      if (!magazine) return true;
      const key = `${magazine.id_magazine}|${year.trim()}|${issue.issue_number}`;
      return takenIssueKeys.has(key);
    });
  }, [issuesForMagazineYear, magazine, year, takenIssueKeys]);

  const canAdvanceStep1 = Boolean(magazine && year.trim() && selectedIssue);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create Flatplan",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: BASE },
        { label: "Flatplans", href: BASE },
        { label: "Create Flatplan" },
      ],
      buttons: [{ label: "Back to Flatplans", href: BASE }],
    });
  }, [setPageMeta]);

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      const nextId = `fp-${Date.now().toString(36)}`;
      setIdFlatplan(nextId);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleCreate = () => {
    setSubmitting(true);
    // Demo: no persistence
    setTimeout(() => router.push(BASE), 300);
  };

  const issueDisplay = (issue: MagazineIssue) =>
    `#${issue.issue_number}${issue.is_special_edition && issue.special_topic ? ` (${issue.special_topic})` : ""}`;

  return (
    <>
      <PageContentSection className="p-0">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
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
              {step === 1 && "Magazine, year & issue"}
              {step === 2 && "Details"}
              {step === 3 && "Preview"}
            </span>
          </div>
        </div>

        <div className="p-12 w-full">
          {step === 1 && (
            <div className="space-y-6 max-w-xl">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">1) Select magazine</p>
                <button
                  type="button"
                  onClick={() => setMagazineModalOpen(true)}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                    magazine
                      ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900"
                      : "border-dashed border-gray-300 text-gray-700 hover:border-blue-950 hover:bg-blue-50/30"
                  }`}
                >
                  {magazine ? `${magazine.name} (${magazine.id_magazine})` : "Select magazine"}
                </button>
              </div>

              {magazine && (
                <>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">2) Year</label>
                    <input
                      type="number"
                      min={1900}
                      max={2100}
                      value={year}
                      onChange={(e) => {
                        setYear(e.target.value);
                        setSelectedIssue(null);
                      }}
                      className="w-full max-w-[140px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 2025"
                    />
                  </div>

                  {year.trim() && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">3) Issue</label>
                      <p className="text-xs text-gray-500 mb-2">Issues that already have a flatplan are not available.</p>
                      <select
                        value={selectedIssue ? selectedIssue.issue_number : ""}
                        onChange={(e) => {
                          const num = parseInt(e.target.value, 10);
                          const issue = issuesForMagazineYear.find((i) => i.issue_number === num) ?? null;
                          setSelectedIssue(issue);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Select issue —</option>
                        {availableIssues.map((issue) => (
                          <option key={issue.issue_number} value={issue.issue_number}>
                            Issue {issueDisplay(issue)} (available)
                          </option>
                        ))}
                        {takenIssues.map((issue) => (
                          <option key={issue.issue_number} value={issue.issue_number} disabled>
                            Issue {issueDisplay(issue)} (has flatplan)
                          </option>
                        ))}
                        {issuesForMagazineYear.length === 0 && (
                          <option value="" disabled>No issues planned for this year</option>
                        )}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvanceStep1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Details
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-xl">
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Flatplan ID (read-only)</p>
                <input
                  type="text"
                  value={idFlatplan}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-mono"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned publication date</label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom name for flatplan</label>
                  <input
                    type="text"
                    value={editionName}
                    onChange={(e) => setEditionName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Glass Today April 2025"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Next: Preview
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-xl">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Preview – confirm and create</p>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Magazine</dt>
                    <dd className="font-medium">{magazine?.name ?? "—"} ({magazine?.id_magazine})</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Year / Issue</dt>
                    <dd className="font-medium">{year} — Issue #{selectedIssue?.issue_number ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Flatplan ID</dt>
                    <dd className="font-mono">{idFlatplan}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Planned publication date</dt>
                    <dd className="font-medium">{publicationDate || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Custom name</dt>
                    <dd className="font-medium">{editionName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Description</dt>
                    <dd className="text-gray-700 whitespace-pre-wrap">{description || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create flatplan"}
                </button>
              </div>
            </div>
          )}
        </div>
      </PageContentSection>

      <MagazineSelectModal
        open={magazineModalOpen}
        onClose={() => setMagazineModalOpen(false)}
        onSelectMagazine={(m) => {
          setMagazine(m);
          setYear("");
          setSelectedIssue(null);
          setMagazineModalOpen(false);
        }}
      />
    </>
  );
};

export default CreateFlatplanPage;
