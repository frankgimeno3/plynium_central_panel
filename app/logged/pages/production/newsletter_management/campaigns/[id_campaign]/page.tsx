"use client";

import React, { FC, use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { NewsletterCampaign, Newsletter } from "@/app/contents/interfaces";
import campaignsData from "@/app/contents/newsletterCampaigns.json";
import newslettersData from "@/app/contents/newsletters.json";

const BASE = "/logged/pages/production/newsletter_management";

const CampaignDetailPage: FC<{ params: Promise<{ id_campaign: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_campaign } = use(params);
  const campaigns = campaignsData as NewsletterCampaign[];
  const newsletters = newslettersData as Newsletter[];
  const campaign = campaigns.find((c) => c.id === id_campaign);
  const campaignNewsletters = useMemo(
    () => newsletters.filter((n) => n.campaignId === id_campaign).sort((a, b) => a.estimatedPublishDate.localeCompare(b.estimatedPublishDate)),
    [newsletters, id_campaign]
  );

  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (campaign) {
      setPageMeta({
        pageTitle: campaign.name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Newsletter management", href: BASE },
          { label: campaign.name },
        ],
        buttons: [{ label: "Back to Newsletter management", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Campaign not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Newsletter management", href: BASE },
        ],
        buttons: [{ label: "Back to Newsletter management", href: BASE }],
      });
    }
  }, [setPageMeta, campaign]);

  if (!campaign) {
    return (
      <PageContentSection>
        <p className="text-gray-500">Campaign not found.</p>
      </PageContentSection>
    );
  }

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <>
      <PageContentSection>
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
      </PageContentSection>

      <PageContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Related newsletters</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated publish date</th>
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
                  <td className="px-6 py-4 text-sm text-gray-600">{n.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {campaignNewsletters.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No newsletters in this campaign.</p>
        )}
      </PageContentSection>
    </>
  );
};

export default CampaignDetailPage;
