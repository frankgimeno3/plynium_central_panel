"use client";

import React, { FC, use, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { NewsletterCampaign, Newsletter } from "@/app/contents/interfaces";
import AddScheduledNewsletterModal, { type AddScheduledNewsletterForm } from "../../components/AddScheduledNewsletterModal";
import { NewsletterService } from "@/app/service/NewsletterService";

const BASE = "/logged/pages/production/newsletters";

function nextNewsletterId(existing: Newsletter[]): string {
  const nums = existing
    .map((n) => (n.id.startsWith("nl-") ? parseInt(n.id.replace("nl-", ""), 10) : 0))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `nl-${String(max + 1).padStart(3, "0")}`;
}

const CampaignDetailPage: FC<{ params: Promise<{ id_campaign: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_campaign } = use(params);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campaign = campaigns.find((c) => c.id === id_campaign);

  const campaignNewsletters = useMemo(
    () =>
      newsletters
        .filter((n) => n.campaignId === id_campaign)
        .sort((a, b) => a.estimatedPublishDate.localeCompare(b.estimatedPublishDate)),
    [newsletters, id_campaign]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [campaignsRes, newslettersRes] = await Promise.all([
      NewsletterService.getNewsletterCampaigns(),
      NewsletterService.getNewsletters(),
    ]);
    setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
    setNewsletters(Array.isArray(newslettersRes) ? newslettersRes : []);
    setLoading(false);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const handleAddScheduled = useCallback(
    async (data: AddScheduledNewsletterForm) => {
      if (!campaign) return;
      const id = nextNewsletterId(newsletters);
      await NewsletterService.createNewsletter(id, {
        idCampaign: id_campaign,
        portalCode: campaign.portalCode,
        estimatedPublishDate: data.estimatedPublishDate,
        topic: data.topic,
        status: "calendarized",
        userNewsletterListId: data.userNewsletterListId,
      });
      await reload();
    },
    [campaign, id_campaign, newsletters, reload]
  );

  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (campaign) {
      setPageMeta({
        // Midnav title format: "NEWSLETTER CAMPAIGN - NAME"
        pageTitle: `NEWSLETTER CAMPAIGN - ${campaign.name}`,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Newsletters", href: BASE },
          { label: campaign.name },
        ],
        buttons: [{ label: "Back to Newsletters", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "NEWSLETTER CAMPAIGN - Campaign not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Newsletters", href: BASE },
        ],
        buttons: [{ label: "Back to Newsletters", href: BASE }],
      });
    }
  }, [setPageMeta, campaign]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-gray-600">Loading campaign…</div>
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

  if (!campaign) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-500">Campaign not found.</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-medium text-gray-900">{campaign.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Portal</p>
            <p className="font-medium text-gray-900">{campaign.portalCode}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Content theme</p>
            <p className="font-medium text-gray-900">{campaign.contentTheme}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Frequency</p>
            <p className="font-medium text-gray-900">{campaign.frequency}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Period</p>
            <p className="font-medium text-gray-900">{campaign.startDate} – {campaign.endDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <p className="font-medium text-gray-900">{campaign.status}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500 uppercase">Description</p>
            <p className="text-gray-700">{campaign.description}</p>
          </div>
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Related newsletters</h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add scheduled newsletter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated publish date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User newsletter list</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignNewsletters.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => router.push(`${BASE}/${n.id}`)}
                  className={rowClass}
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{n.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{n.topic}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{n.estimatedPublishDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{n.userNewsletterListId ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{n.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {campaignNewsletters.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No newsletters in this campaign.</p>
        )}
            </div>
          </div>
        </div>
      </PageContentSection>

      <AddScheduledNewsletterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddScheduled}
      />
    </>
  );
};

export default CampaignDetailPage;
