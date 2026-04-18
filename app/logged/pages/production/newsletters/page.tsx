"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { NewsletterCampaign, Newsletter } from "@/app/contents/interfaces";
import { NewsletterService } from "@/app/service/NewsletterService";
import { PortalService } from "@/app/service/PortalService";
import GenerateScheduledNewslettersModal, {
  type ScheduledNewsletterDraft,
} from "./components/GenerateScheduledNewslettersModal";

const BASE = "/logged/pages/production/newsletters";

const SCHEDULED_STATUSES: string[] = ["calendarized", "pending"];

type TabId = "campaigns" | "scheduled" | "expired";
type ExpiredSubTab = "published" | "cancelled";

type PortalRow = { id: number; key: string; name: string };

function buildNewsletterPortalTabs(items: Newsletter[], portals: PortalRow[]): PortalRow[] {
  const keys = new Set<string>();
  for (const n of items) {
    const k = String(n.portalCode ?? "").trim();
    if (k) keys.add(k);
  }
  const list = portals
    .filter((p) => keys.has(String(p.key ?? "").trim()))
    .map((p) => ({ ...p }))
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  const fromPortals = new Set(list.map((p) => String(p.key ?? "").trim()));
  for (const k of keys) {
    if (!fromPortals.has(k)) {
      list.push({ id: 0, key: k, name: k });
    }
  }
  return list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0) || a.key.localeCompare(b.key));
}

function normalizeCampaignType(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function nextNewsletterId(existing: Newsletter[]): string {
  const nums = existing
    .map((n) => (n.id.startsWith("nl-") ? parseInt(n.id.replace("nl-", ""), 10) : 0))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `nl-${String(max + 1).padStart(3, "0")}`;
}

const NewsletterManagementPage: FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("campaigns");

  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleConfirming, setScheduleConfirming] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<string>("");
  const [activeScheduledPortalTab, setActiveScheduledPortalTab] = useState<string>("");
  const [expiredSubTab, setExpiredSubTab] = useState<ExpiredSubTab>("published");
  const [activeExpiredPortalTab, setActiveExpiredPortalTab] = useState<string>("");
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [campaignNameFilter, setCampaignNameFilter] = useState("");
  const [campaignFrequencyFilter, setCampaignFrequencyFilter] = useState("");
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("");

  const scheduledNewsletters = useMemo(
    () => newsletters.filter((n) => SCHEDULED_STATUSES.includes(n.status)),
    [newsletters]
  );
  const publishedNewsletters = useMemo(
    () => newsletters.filter((n) => String(n.status ?? "").trim().toLowerCase() === "published"),
    [newsletters]
  );
  const cancelledNewsletters = useMemo(
    () => newsletters.filter((n) => String(n.status ?? "").trim().toLowerCase() === "cancelled"),
    [newsletters]
  );

  const portalCampaigns = useMemo(() => {
    if (!activePortalTab) return [];
    return campaigns.filter((c) => String(c.portalCode ?? "").trim() === activePortalTab);
  }, [campaigns, activePortalTab]);

  const portalFrequencyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of portalCampaigns) {
      const v = String(c.frequency ?? "").trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [portalCampaigns]);

  const portalStatusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of portalCampaigns) {
      const v = String(c.status ?? "").trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [portalCampaigns]);

  const filteredPortalCampaigns = useMemo(() => {
    const nameNeedle = campaignNameFilter.trim().toLowerCase();
    return portalCampaigns
      .filter((c) => {
        if (campaignFrequencyFilter && String(c.frequency ?? "").trim() !== campaignFrequencyFilter) {
          return false;
        }
        if (campaignStatusFilter && String(c.status ?? "").trim() !== campaignStatusFilter) {
          return false;
        }
        if (nameNeedle) {
          const hay = `${c.name ?? ""}`.toLowerCase();
          if (!hay.includes(nameNeedle)) return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        const ta = normalizeCampaignType(a.newsletterType);
        const tb = normalizeCampaignType(b.newsletterType);
        if (ta !== tb) {
          if (ta === "main") return -1;
          if (tb === "main") return 1;
        }
        return `${a.name}`.localeCompare(`${b.name}`);
      });
  }, [portalCampaigns, campaignFrequencyFilter, campaignNameFilter, campaignStatusFilter]);

  const portalTabs = useMemo(() => {
    const usedKeys = new Set<string>();
    for (const c of campaigns) {
      const code = String(c.portalCode ?? "").trim();
      if (code) usedKeys.add(code);
    }
    return portals
      .filter((p) => usedKeys.has(String(p.key ?? "").trim()))
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }, [campaigns, portals]);

  const scheduledPortalTabs = useMemo(
    () => buildNewsletterPortalTabs(scheduledNewsletters, portals),
    [scheduledNewsletters, portals]
  );

  const expiredSourceNewsletters = useMemo(
    () => (expiredSubTab === "published" ? publishedNewsletters : cancelledNewsletters),
    [expiredSubTab, publishedNewsletters, cancelledNewsletters]
  );

  const expiredPortalTabs = useMemo(
    () => buildNewsletterPortalTabs(expiredSourceNewsletters, portals),
    [expiredSourceNewsletters, portals]
  );

  const portalExpiredNewsletters = useMemo(() => {
    if (!activeExpiredPortalTab) return [];
    return expiredSourceNewsletters.filter(
      (n) => String(n.portalCode ?? "").trim() === activeExpiredPortalTab
    );
  }, [expiredSourceNewsletters, activeExpiredPortalTab]);

  const portalScheduledNewsletters = useMemo(() => {
    if (!activeScheduledPortalTab) return [];
    return scheduledNewsletters.filter(
      (n) => String(n.portalCode ?? "").trim() === activeScheduledPortalTab
    );
  }, [scheduledNewsletters, activeScheduledPortalTab]);

  useEffect(() => {
    if (!portalTabs.length) {
      setActivePortalTab("");
      return;
    }
    const keys = portalTabs.map((p) => p.key);
    if (!activePortalTab || !keys.includes(activePortalTab)) {
      setActivePortalTab(portalTabs[0].key);
    }
  }, [portalTabs, activePortalTab]);

  useEffect(() => {
    if (activeTab !== "scheduled") return;
    if (!scheduledPortalTabs.length) {
      setActiveScheduledPortalTab("");
      return;
    }
    const keys = scheduledPortalTabs.map((p) => p.key);
    if (!activeScheduledPortalTab || !keys.includes(activeScheduledPortalTab)) {
      setActiveScheduledPortalTab(scheduledPortalTabs[0].key);
    }
  }, [activeTab, scheduledPortalTabs, activeScheduledPortalTab]);

  useEffect(() => {
    if (activeTab !== "expired") return;
    if (!expiredPortalTabs.length) {
      setActiveExpiredPortalTab("");
      return;
    }
    const keys = expiredPortalTabs.map((p) => p.key);
    if (!activeExpiredPortalTab || !keys.includes(activeExpiredPortalTab)) {
      setActiveExpiredPortalTab(expiredPortalTabs[0].key);
    }
  }, [activeTab, expiredPortalTabs, activeExpiredPortalTab]);

  useEffect(() => {
    // Reset campaign filters when switching portal tab
    setCampaignNameFilter("");
    setCampaignFrequencyFilter("");
    setCampaignStatusFilter("");
  }, [activePortalTab]);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Newsletters" },
  ];

  const handleOpenScheduleModal = useCallback(() => {
    setScheduleError(null);
    setScheduleModalOpen(true);
  }, []);

  const handleCloseScheduleModal = useCallback(() => {
    if (scheduleConfirming) return;
    setScheduleModalOpen(false);
    setScheduleError(null);
  }, [scheduleConfirming]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Newsletters",
      breadcrumbs,
      buttons: [
        { label: "Create newsletter campaign", href: `${BASE}/create` },
        { label: "Generate scheduled newsletters", onClick: handleOpenScheduleModal },
      ],
    });
  }, [setPageMeta, breadcrumbs, handleOpenScheduleModal]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [campaignsRes, newslettersRes, portalsRes] = await Promise.all([
        NewsletterService.getNewsletterCampaigns(),
        NewsletterService.getNewsletters(),
        PortalService.getAllPortals(),
      ]);
      setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
      setNewsletters(Array.isArray(newslettersRes) ? newslettersRes : []);
      setPortals(Array.isArray(portalsRes) ? portalsRes : []);
      setLoading(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load newsletters");
      setCampaigns([]);
      setNewsletters([]);
      setPortals([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [campaignsRes, newslettersRes, portalsRes] = await Promise.all([
          NewsletterService.getNewsletterCampaigns(),
          NewsletterService.getNewsletters(),
          PortalService.getAllPortals(),
        ]);
        if (cancelled) return;
        setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
        setNewsletters(Array.isArray(newslettersRes) ? newslettersRes : []);
        setPortals(Array.isArray(portalsRes) ? portalsRes : []);
        setLoading(false);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load newsletters");
        setCampaigns([]);
        setNewsletters([]);
        setPortals([]);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerateScheduled = async (items: ScheduledNewsletterDraft[]) => {
    if (items.length === 0) return;
    setScheduleConfirming(true);
    setScheduleError(null);

    try {
      const workingNewsletters = [...newsletters];
      for (const item of items) {
        const id = nextNewsletterId(workingNewsletters);
        const created = await NewsletterService.createNewsletter(id, {
          idCampaign: item.campaignId,
          portalCode: item.portalCode,
          estimatedPublishDate: item.estimatedPublishDate,
          topic: item.topic,
          status: "calendarized",
          userNewsletterListId: null,
        });
        if (created) {
          workingNewsletters.push(created);
        }
      }
      await reload();
      setScheduleModalOpen(false);
    } catch (e: unknown) {
      setScheduleError(e instanceof Error ? e.message : "Failed to generate scheduled newsletters");
    } finally {
      setScheduleConfirming(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "campaigns", label: "Campaigns" },
    { id: "scheduled", label: "Scheduled newsletters" },
    { id: "expired", label: "Expired" },
  ];

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-gray-600">Loading newsletters…</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (error) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-red-600">{error}</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        {activeTab === "campaigns" && (
          <div>
            <div className="flex border-b border-gray-200">
              {portalTabs.map((portal) => (
                <button
                  key={portal.key}
                  type="button"
                  onClick={() => setActivePortalTab(portal.key)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activePortalTab === portal.key
                      ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {portal.key}
                </button>
              ))}
              {portalTabs.length === 0 && (
                <span className="text-sm text-gray-500">No portals found.</span>
              )}
            </div>

            {activePortalTab && (
              <div className="mt-4">
                <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </label>
                    <input
                      type="text"
                      value={campaignNameFilter}
                      onChange={(e) => setCampaignNameFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Filter by name…"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Frequency
                    </label>
                    <select
                      value={campaignFrequencyFilter}
                      onChange={(e) => setCampaignFrequencyFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All</option>
                      {portalFrequencyOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </label>
                    <select
                      value={campaignStatusFilter}
                      onChange={(e) => setCampaignStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All</option>
                      {portalStatusOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-12 flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-600">
                      {filteredPortalCampaigns.length} campaign(s)
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCampaignNameFilter("");
                        setCampaignFrequencyFilter("");
                        setCampaignStatusFilter("");
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Theme
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPortalCampaigns.map((c) => {
                      const t = normalizeCampaignType(c.newsletterType);
                      const isMain = t === "main";
                      return (
                        <tr
                          key={c.id}
                          onClick={() => router.push(`${BASE}/campaigns/${c.id}`)}
                          className={rowClass}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isMain
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-yellow-100 text-gray-500"
                              }`}
                            >
                              {t || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{c.contentTheme}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{c.frequency}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{c.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredPortalCampaigns.length === 0 && (
                  <p className="text-sm text-gray-500 py-4">No campaigns match the current filters.</p>
                )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "scheduled" && (
          <div>
            <div className="flex border-b border-gray-200">
              {scheduledPortalTabs.map((portal) => (
                <button
                  key={portal.key}
                  type="button"
                  onClick={() => setActiveScheduledPortalTab(portal.key)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeScheduledPortalTab === portal.key
                      ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {portal.key}
                </button>
              ))}
              {scheduledPortalTabs.length === 0 && (
                <span className="text-sm text-gray-500 py-3 px-2">No scheduled newsletters.</span>
              )}
            </div>

            {activeScheduledPortalTab && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated publish date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User newsletter list</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portalScheduledNewsletters.map((n) => (
                      <tr
                        key={n.id}
                        onClick={() => router.push(`${BASE}/${n.id}`)}
                        className={rowClass}
                      >
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{n.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{n.topic}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{n.estimatedPublishDate}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{n.userNewsletterListId ?? "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{n.portalCode}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{n.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {portalScheduledNewsletters.length === 0 && (
                  <p className="text-sm text-gray-500 py-4">No scheduled newsletters for this portal.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "expired" && (
          <div>
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setExpiredSubTab("published")}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  expiredSubTab === "published"
                    ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setExpiredSubTab("cancelled")}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  expiredSubTab === "cancelled"
                    ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Cancelled
              </button>
            </div>

            <div className="mt-4 flex border-b border-gray-200">
              {expiredPortalTabs.map((portal) => (
                <button
                  key={portal.key}
                  type="button"
                  onClick={() => setActiveExpiredPortalTab(portal.key)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeExpiredPortalTab === portal.key
                      ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {portal.key}
                </button>
              ))}
              {expiredPortalTabs.length === 0 && (
                <span className="text-sm text-gray-500 py-3 px-2">
                  {expiredSubTab === "published"
                    ? "No published newsletters."
                    : "No cancelled newsletters."}
                </span>
              )}
            </div>

            {activeExpiredPortalTab && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated publish date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User newsletter list</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portalExpiredNewsletters.map((n) => (
                      <tr
                        key={n.id}
                        onClick={() => router.push(`${BASE}/${n.id}`)}
                        className={rowClass}
                      >
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{n.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{n.topic}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{n.estimatedPublishDate}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{n.userNewsletterListId ?? "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{n.portalCode}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{n.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {portalExpiredNewsletters.length === 0 && (
                  <p className="text-sm text-gray-500 py-4">No newsletters for this portal.</p>
                )}
              </div>
            )}
          </div>
        )}
            </div>
          </div>
        </div>
      </PageContentSection>
      <GenerateScheduledNewslettersModal
        open={scheduleModalOpen}
        campaigns={campaigns}
        newsletters={newsletters}
        confirming={scheduleConfirming}
        submitError={scheduleError}
        onClose={handleCloseScheduleModal}
        onConfirm={handleGenerateScheduled}
      />
    </>
  );
};

export default NewsletterManagementPage;
