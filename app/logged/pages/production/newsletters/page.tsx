"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { NewsletterCampaign, Newsletter } from "@/app/contents/interfaces";
import { NewsletterService } from "@/app/service/NewsletterService";

const BASE = "/logged/pages/production/newsletters";

const SCHEDULED_STATUSES: string[] = ["calendarized", "pending"];
const FINISHED_STATUSES: string[] = ["published", "cancelled"];

type TabId = "campaigns" | "scheduled" | "finished";

const NewsletterManagementPage: FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("campaigns");

  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scheduledNewsletters = useMemo(
    () => newsletters.filter((n) => SCHEDULED_STATUSES.includes(n.status)),
    [newsletters]
  );
  const finishedNewsletters = useMemo(
    () => newsletters.filter((n) => FINISHED_STATUSES.includes(n.status)),
    [newsletters]
  );

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Newsletters" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Newsletters",
      breadcrumbs,
      buttons: [{ label: "Create newsletter campaign", href: `${BASE}/create` }],
    });
  }, [setPageMeta, breadcrumbs]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      NewsletterService.getNewsletterCampaigns(),
      NewsletterService.getNewsletters(),
    ])
      .then(([campaignsRes, newslettersRes]) => {
        if (cancelled) return;
        setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
        setNewsletters(Array.isArray(newslettersRes) ? newslettersRes : []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ? String(e.message) : "Failed to load newsletters");
        setCampaigns([]);
        setNewsletters([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "campaigns", label: "Campaigns" },
    { id: "scheduled", label: "Scheduled newsletters" },
    { id: "finished", label: "Finished newsletters" },
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`${BASE}/campaigns/${c.id}`)}
                    className={rowClass}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.portalCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.contentTheme}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.frequency}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{c.startDate} – {c.endDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "scheduled" && (
          <div className="overflow-x-auto">
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
                {scheduledNewsletters.map((n) => (
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
          </div>
        )}

        {activeTab === "finished" && (
          <div className="overflow-x-auto">
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
                {finishedNewsletters.map((n) => (
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
          </div>
        )}

        {activeTab === "campaigns" && campaigns.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No campaigns.</p>
        )}
        {activeTab === "scheduled" && scheduledNewsletters.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No scheduled newsletters.</p>
        )}
        {activeTab === "finished" && finishedNewsletters.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No finished newsletters.</p>
        )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default NewsletterManagementPage;
