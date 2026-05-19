"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PortalService } from "@/app/service/PortalService";
import { PUBLICATIONS_ISSUES_BASE } from "./issues_page_components/constants";
import type { ExpiredStatus, PortalRow, PublicationDbRow, TabId } from "./issues_page_components/types";
import { DevelopmentIssuesTab } from "./_tabs/DevelopmentIssuesTab/DevelopmentIssuesTab";
import { ForecastedIssuesTab } from "./_tabs/ForecastedIssuesTab/ForecastedIssuesTab";
import { ExpiredIssuesTab } from "./_tabs/ExpiredIssuesTab/ExpiredIssuesTab";
import { IssuesLifecycleTabBar } from "./issues_page_components/IssuesLifecycleTabBar";
import { IssuesPortalTabBar } from "./issues_page_components/IssuesPortalTabBar";

const IssuesPage: FC = () => {
  const { setPageMeta } = usePageContent();

  const [activeTab, setActiveTab] = useState<TabId>("development");
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [activePortalId, setActivePortalId] = useState<number | null>(null);
  const [portalsReady, setPortalsReady] = useState(false);
  const [all, setAll] = useState<PublicationDbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState({ id: "", edition: "", magazine: "" });
  const [expiredStatus, setExpiredStatus] = useState<ExpiredStatus>("published");

  const portalTabs = useMemo(
    () => [...portals].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)),
    [portals]
  );

  const fetchPublicationsForPortal = useCallback(async (portalId: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (portalId != null) params.set("portal_id", String(portalId));
      const qs = params.toString();
      const res = await fetch(`/api/v1/publications-db${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load issues");
      const data = (await res.json()) as PublicationDbRow[];
      setAll(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setAll([]);
      setError(e instanceof Error ? e.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const plist = await PortalService.getAllPortals();
        if (cancelled) return;
        const sorted = [...(Array.isArray(plist) ? plist : [])].sort(
          (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
        ) as PortalRow[];
        setPortals(sorted);
        setActivePortalId((prev) => {
          if (prev != null && sorted.some((p) => Number(p.id) === prev)) return prev;
          return sorted[0]?.id != null ? Number(sorted[0].id) : null;
        });
      } catch {
        if (!cancelled) {
          setPortals([]);
          setActivePortalId(null);
        }
      } finally {
        if (!cancelled) setPortalsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!portalsReady) return;
    void fetchPublicationsForPortal(activePortalId);
  }, [portalsReady, activePortalId, fetchPublicationsForPortal]);

  const load = useCallback(() => {
    void fetchPublicationsForPortal(activePortalId);
  }, [activePortalId, fetchPublicationsForPortal]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Issues",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${PUBLICATIONS_ISSUES_BASE}/issues` },
        { label: "Issues" },
      ],
      buttons: [{ label: "Issue Bulk Creation", href: `${PUBLICATIONS_ISSUES_BASE}/issues/bulk-creation` }],
    });
  }, [setPageMeta]);

  const inDevelopment = useMemo(
    () => all.filter((p) => p.publication_status === "draft"),
    [all]
  );
  const forecasted = useMemo(
    () => all.filter((p) => p.publication_status === "planned"),
    [all]
  );
  const expiredPublished = useMemo(
    () => all.filter((p) => String(p.publication_status ?? "").trim().toLowerCase() === "published"),
    [all]
  );
  const expiredCancelled = useMemo(
    () => all.filter((p) => String(p.publication_status ?? "").trim().toLowerCase() === "cancelled"),
    [all]
  );
  const expiredTotalCount = expiredPublished.length + expiredCancelled.length;

  const listForTab = useMemo(() => {
    if (activeTab === "development") return inDevelopment;
    if (activeTab === "forecasted") return forecasted;
    return expiredStatus === "published" ? expiredPublished : expiredCancelled;
  }, [activeTab, inDevelopment, forecasted, expiredPublished, expiredCancelled, expiredStatus]);

  const filtered = useMemo(() => {
    let list = [...listForTab];
    if (filter.id) list = list.filter((p) => p.publication_id.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.edition)
      list = list.filter((p) => (p.publication_edition_name ?? "").toLowerCase().includes(filter.edition.toLowerCase()));
    if (filter.magazine)
      list = list.filter((p) => (p.magazine_id ?? "").toLowerCase().includes(filter.magazine.toLowerCase()));
    return list;
  }, [listForTab, filter]);

  return (
    <PageContentSection className="pt-4">
      <div className="flex flex-col w-full">
        <IssuesPortalTabBar
          portalTabs={portalTabs}
          activePortalId={activePortalId}
          onPortalChange={setActivePortalId}
        />

        <IssuesLifecycleTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          inDevelopmentCount={inDevelopment.length}
          forecastedCount={forecasted.length}
          expiredTotalCount={expiredTotalCount}
          onRefresh={load}
        />

        <div className="bg-white rounded-b-lg overflow-hidden">
          {activeTab === "development" ? (
            <DevelopmentIssuesTab
              error={error}
              loading={loading}
              onRetry={load}
              filter={filter}
              setFilter={setFilter}
              filteredRows={filtered}
            />
          ) : null}
          {activeTab === "forecasted" ? (
            <ForecastedIssuesTab
              error={error}
              loading={loading}
              onRetry={load}
              filter={filter}
              setFilter={setFilter}
              filteredRows={filtered}
            />
          ) : null}
          {activeTab === "expired" ? (
            <ExpiredIssuesTab
              error={error}
              loading={loading}
              onRetry={load}
              expiredStatus={expiredStatus}
              setExpiredStatus={setExpiredStatus}
              filter={filter}
              setFilter={setFilter}
              filteredRows={filtered}
            />
          ) : null}
        </div>
      </div>
    </PageContentSection>
  );
};

export default IssuesPage;
