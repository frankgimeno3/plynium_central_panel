"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { fetchFlatplans, getFlatplans } from "@/app/contents/publicationsHelpers";
import type { Magazine, MagazineIssue, PublicationUnified } from "@/app/contents/interfaces";
import { MagazineService } from "@/app/service/MagazineService";
import { decodeForecastedIssueId } from "@/app/logged/pages/production/publications/flatplans/forecastedIssueRoute";

const BASE = "/logged/pages/production/publications/flatplans";

const ForecastedIssueDetailPage: FC<{ params: Promise<{ id: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id } = use(params);
  const decoded = useMemo(() => decodeForecastedIssueId(id), [id]);

  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [publicationsData, setPublicationsData] = useState<PublicationUnified[]>([]);

  useEffect(() => {
    MagazineService.getAllMagazines()
      .then((data) => setMagazines(Array.isArray(data) ? data : []))
      .catch(() => setMagazines([]));
  }, []);

  useEffect(() => {
    fetchFlatplans()
      .then(setPublicationsData)
      .catch(() => setPublicationsData([]));
  }, []);

  const flatplanKeys = useMemo(() => {
    const set = new Set<string>();
    getFlatplans(publicationsData).forEach((f) => {
      if (f.id_magazine != null && f.year != null && f.issue_number != null) {
        set.add(`${f.id_magazine}|${f.year}|${f.issue_number}`);
      }
    });
    return set;
  }, [publicationsData]);

  const detail = useMemo(() => {
    if (!decoded) return null;
    const mag = magazines.find((m) => m.id_magazine === decoded.id_magazine);
    if (!mag) return null;
    const issues = mag.issues_by_year?.[String(decoded.year)] ?? [];
    const issue = issues.find((i: MagazineIssue) => i.issue_number === decoded.issue_number);
    if (!issue) return null;
    const key = `${decoded.id_magazine}|${decoded.year}|${decoded.issue_number}`;
    const hasFlatplan = flatplanKeys.has(key);
    return { magazine: mag, issue, hasFlatplan, ...decoded };
  }, [decoded, magazines, flatplanKeys]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Production", href: "/logged/pages/production/services" },
      { label: "Publications", href: "/logged/pages/production/publications/magazines" },
      { label: "Flatplans", href: BASE },
      { label: "Forecasted issue" },
    ],
    []
  );

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (detail && !detail.hasFlatplan) {
      setPageMeta({
        pageTitle: `${detail.magazine.name} · ${detail.year} · Issue ${detail.issue_number}`,
        breadcrumbs: [
          ...breadcrumbs.slice(0, 3),
          { label: "Forecasted issues", href: BASE },
          { label: `${detail.magazine.name} #${detail.issue_number}` },
        ],
        buttons: [{ label: "Back to Flatplans", href: BASE }],
      });
    } else if (detail?.hasFlatplan) {
      setPageMeta({
        pageTitle: "Issue already in production",
        breadcrumbs: [...breadcrumbs.slice(0, 3), { label: "Forecasted issue" }],
        buttons: [{ label: "Back to Flatplans", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Forecasted issue not found",
        breadcrumbs: [...breadcrumbs.slice(0, 3), { label: "Forecasted issue" }],
        buttons: [{ label: "Back to Flatplans", href: BASE }],
      });
    }
  }, [setPageMeta, breadcrumbs, detail]);

  if (!decoded) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">Invalid forecasted issue link.</p>
          <Link href={BASE} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            Back to Flatplans
          </Link>
        </div>
      </PageContentSection>
    );
  }

  if (!detail) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">This forecasted issue could not be found.</p>
          <Link href={BASE} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            Back to Flatplans
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const { magazine, issue, year, issue_number, hasFlatplan } = detail;
  const monthLabel =
    issue.forecasted_publication_month != null &&
    issue.forecasted_publication_month >= 1 &&
    issue.forecasted_publication_month <= 12
      ? new Date(2000, issue.forecasted_publication_month - 1, 1).toLocaleString("default", { month: "long" })
      : "—";

  const magazineEditHref = `/logged/pages/production/publications/magazines/${encodeURIComponent(magazine.id_magazine)}`;

  return (
    <PageContentSection>
      <div className="flex flex-col w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
            <h1 className="text-lg font-semibold text-gray-900">Forecasted issue</h1>
            <p className="text-sm text-gray-500 mt-1">
              Planned magazine issue without a flatplan yet. You can adjust the forecasted month on the magazine page.
            </p>
          </div>
          <dl className="px-6 py-5 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Magazine</dt>
              <dd className="mt-1 font-medium text-gray-900">{magazine.name}</dd>
              <dd className="text-xs text-gray-500 font-mono">{magazine.id_magazine}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year</dt>
              <dd className="mt-1 text-gray-900">{year}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Issue #</dt>
              <dd className="mt-1 text-gray-900">{issue_number}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Forecasted month</dt>
              <dd className="mt-1 text-gray-900">{monthLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Special edition</dt>
              <dd className="mt-1 text-gray-900">{issue.is_special_edition ? "Yes" : "No"}</dd>
            </div>
            {issue.is_special_edition && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Special topic</dt>
                <dd className="mt-1 text-gray-900">{issue.special_topic ?? "—"}</dd>
              </div>
            )}
          </dl>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
            {hasFlatplan && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                A flatplan already exists for this magazine, year and issue. Open it from the Flatplans list.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                href={magazineEditHref}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit magazine &amp; issues
              </Link>
              {!hasFlatplan && (
                <Link
                  href={`${BASE}/forecasted/create?from=${encodeURIComponent(id)}`}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create flatplan
                </Link>
              )}
              <button
                type="button"
                onClick={() => router.push(BASE)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
              >
                Back to Flatplans
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default ForecastedIssueDetailPage;
