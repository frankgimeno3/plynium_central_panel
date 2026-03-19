"use client";

import React, { FC, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { createFlatplanApi, fetchFlatplans, getFlatplans } from "@/app/contents/publicationsHelpers";
import type { Magazine, MagazineIssue, PublicationUnified } from "@/app/contents/interfaces";
import { decodeForecastedIssueId } from "@/app/logged/pages/production/publications/flatplans/forecastedIssueRoute";

const BASE = "/logged/pages/production/publications/flatplans";

type Step = 2 | 3;

const CreateFlatplanFromForecastedInner: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from")?.trim() ?? "";

  const [step, setStep] = useState<Step>(2);
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [year, setYear] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<MagazineIssue | null>(null);

  const [idFlatplan, setIdFlatplan] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [description, setDescription] = useState("");
  const [editionName, setEditionName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasFlatplan, setHasFlatplan] = useState(false);

  const decoded = useMemo(() => (fromId ? decodeForecastedIssueId(fromId) : null), [fromId]);

  const detailHref = fromId ? `${BASE}/forecasted/${encodeURIComponent(fromId)}` : `${BASE}/forecasted`;

  useEffect(() => {
    if (!decoded) {
      setLoading(false);
      setLoadError("Missing or invalid forecasted issue link. Open this page from a forecasted issue.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setHasFlatplan(false);

    Promise.all([
      MagazineService.getAllMagazines(),
      fetchFlatplans().catch(() => [] as PublicationUnified[]),
    ])
      .then(([magList, publicationsData]) => {
        if (cancelled) return;
        const mags = Array.isArray(magList) ? magList : [];
        const mag = mags.find((m) => m.id_magazine === decoded.id_magazine);
        if (!mag) {
          setLoadError("Magazine not found.");
          setMagazine(null);
          return;
        }
        const issues = mag.issues_by_year?.[String(decoded.year)] ?? [];
        const issue = issues.find((i: MagazineIssue) => i.issue_number === decoded.issue_number) ?? null;
        if (!issue) {
          setLoadError("Issue not found for this magazine and year.");
          setMagazine(null);
          return;
        }

        const keys = new Set<string>();
        getFlatplans(publicationsData).forEach((f) => {
          if (f.id_magazine != null && f.year != null && f.issue_number != null) {
            keys.add(`${f.id_magazine}|${f.year}|${f.issue_number}`);
          }
        });
        const key = `${decoded.id_magazine}|${decoded.year}|${decoded.issue_number}`;
        if (keys.has(key)) {
          setHasFlatplan(true);
          setMagazine(mag);
          setYear(String(decoded.year));
          setSelectedIssue(issue);
          return;
        }

        setMagazine(mag);
        setYear(String(decoded.year));
        setSelectedIssue(issue);
        setIdFlatplan(`fp-${Date.now().toString(36)}`);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [decoded]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create flatplan (from forecast)",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: "/logged/pages/production/publications/magazines" },
        { label: "Flatplans", href: BASE },
        ...(fromId ? [{ label: "Forecasted issue", href: detailHref }] : []),
        { label: "Create flatplan" },
      ],
      buttons: [{ label: "Back to Flatplans", href: BASE }],
    });
  }, [setPageMeta, fromId, detailHref]);

  const goNext = () => {
    if (step === 2) setStep(3);
  };

  const goBack = () => {
    if (step === 3) setStep(2);
    else router.push(detailHref);
  };

  const handleCreate = async () => {
    if (!magazine || !selectedIssue || !year || !idFlatplan) return;
    setCreateError(null);
    setSubmitting(true);
    try {
      const y = parseInt(year, 10);
      const edition =
        editionName.trim() ||
        `${magazine.name} ${y} · Issue ${selectedIssue.issue_number}`;
      const theme =
        selectedIssue.is_special_edition && selectedIssue.special_topic
          ? selectedIssue.special_topic
          : "";
      await createFlatplanApi({
        id_flatplan: idFlatplan,
        id_magazine: magazine.id_magazine,
        year: y,
        issue_number: selectedIssue.issue_number,
        edition_name: edition,
        theme,
        publication_date: publicationDate.trim() || null,
        description: description.trim(),
      });
      router.push(`${BASE}/${idFlatplan}`);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Could not create flatplan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
      </PageContentSection>
    );
  }

  if (loadError || !magazine || !selectedIssue || !year) {
    return (
      <PageContentSection>
        <div className="p-6 max-w-lg mx-auto text-center">
          <p className="text-gray-700">{loadError ?? "Could not load this forecasted issue."}</p>
          <Link href={BASE} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            Back to Flatplans
          </Link>
        </div>
      </PageContentSection>
    );
  }

  if (hasFlatplan) {
    return (
      <PageContentSection>
        <div className="p-6 max-w-lg mx-auto text-center">
          <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            A flatplan already exists for this magazine, year and issue.
          </p>
          <Link href={detailHref} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            Back to forecasted issue
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const issueDisplay = (issue: MagazineIssue) =>
    `#${issue.issue_number}${issue.is_special_edition && issue.special_topic ? ` (${issue.special_topic})` : ""}`;

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="p-6 flex-1">
              <div className="flex items-center gap-4">
                {([2, 3] as Step[]).map((s, idx) => (
                  <React.Fragment key={s}>
                    <button
                      type="button"
                      onClick={() => s < step && setStep(s)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                        step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
                      } ${step > s ? "cursor-pointer" : ""}`}
                    >
                      {idx + 1}
                    </button>
                    {idx < 1 && <span className="w-8 h-0.5 bg-gray-300" />}
                  </React.Fragment>
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  {step === 2 && "Details"}
                  {step === 3 && "Preview"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
            <div className="p-6 w-full space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Selected magazine, year &amp; issue</p>
                <p className="font-medium text-gray-900">
                  {magazine.name} <span className="text-gray-500 font-mono font-normal">({magazine.id_magazine})</span>
                </p>
                <p className="text-gray-700 mt-1">
                  Year <strong>{year}</strong> · Issue <strong>{issueDisplay(selectedIssue)}</strong>
                </p>
              </div>

              {step === 2 && (
                <div className="space-y-6 w-full">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Flatplan ID</p>
                      <p className="text-base font-mono font-medium text-gray-900">{idFlatplan || "—"}</p>
                      <p className="text-xs text-gray-500 mt-1">This ID will be assigned to the new flatplan.</p>
                    </div>
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
                      Next: Preview
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 w-full">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Preview – confirm and create</p>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-gray-500">Magazine</dt>
                        <dd className="font-medium">
                          {magazine.name} ({magazine.id_magazine})
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Year / Issue</dt>
                        <dd className="font-medium">
                          {year} — Issue #{selectedIssue.issue_number}
                        </dd>
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
                  {createError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</p>
                  )}
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
                      onClick={() => void handleCreate()}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? "Creating…" : "Create flatplan"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

const CreateFlatplanFromForecastedPage: FC = () => (
  <Suspense
    fallback={
      <PageContentSection>
        <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
      </PageContentSection>
    }
  >
    <CreateFlatplanFromForecastedInner />
  </Suspense>
);

export default CreateFlatplanFromForecastedPage;
