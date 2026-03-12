"use client";

import React, { FC, use, useEffect, useMemo } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { Newsletter, NewsletterCampaign, NewsletterContentBlock } from "@/app/contents/interfaces";
import campaignsData from "@/app/contents/newsletterCampaigns.json";
import newslettersData from "@/app/contents/newsletters.json";
import contentBlocksData from "@/app/contents/newsletterContentBlocks.json";
import NewsletterContentBlockRenderer from "../components/NewsletterContentBlockRenderer";
import { newsletterBlocksToHtml } from "../utils/newsletterToHtml";

const BASE = "/logged/pages/production/newsletters";

const NewsletterDetailPage: FC<{ params: Promise<{ id_newsletter: string }> }> = ({ params }) => {
  const { id_newsletter } = use(params);
  const campaigns = campaignsData as NewsletterCampaign[];
  const newsletters = newslettersData as Newsletter[];
  const allBlocks = contentBlocksData as NewsletterContentBlock[];

  const newsletter = newsletters.find((n) => n.id === id_newsletter);
  const campaign = newsletter
    ? (campaigns.find((c) => c.id === newsletter.campaignId) ?? null)
    : null;
  const blocks = useMemo(
    () => allBlocks.filter((b) => b.newsletterId === id_newsletter).sort((a, b) => a.order - b.order),
    [allBlocks, id_newsletter]
  );

  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (newsletter) {
      setPageMeta({
        pageTitle: newsletter.topic,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Newsletters", href: BASE },
          { label: newsletter.topic },
        ],
        buttons: [{ label: "Back to Newsletters", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Newsletter not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Newsletters", href: BASE },
        ],
        buttons: [{ label: "Back to Newsletters", href: BASE }],
      });
    }
  }, [setPageMeta, newsletter]);

  const handleDownloadHtml = () => {
    const html = newsletterBlocksToHtml(blocks);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${id_newsletter}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!newsletter) {
    return (
      <PageContentSection>
        <p className="text-gray-500">Newsletter not found.</p>
      </PageContentSection>
    );
  }

  const isSent = newsletter.status === "published" && newsletter.sentToLists != null && newsletter.sentToLists.length > 0;

  return (
    <>
      <PageContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Newsletter data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">Estimated publish date</p>
            <p className="font-medium text-gray-900">{newsletter.estimatedPublishDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Topic</p>
            <p className="font-medium text-gray-900">{newsletter.topic}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Campaign</p>
            <p className="font-medium text-gray-900">
              {campaign ? (
                <a href={`${BASE}/campaigns/${campaign.id}`} className="text-blue-600 hover:underline">
                  {campaign.name}
                </a>
              ) : (
                newsletter.campaignId
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Portal</p>
            <p className="font-medium text-gray-900">{newsletter.portalCode}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">User newsletter list</p>
            <p className="font-medium text-gray-900">{newsletter.userNewsletterListId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <p className="font-medium text-gray-900">{newsletter.status}</p>
          </div>
          {isSent && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase">Sent to lists</p>
              <p className="font-medium text-gray-900">{newsletter.sentToLists!.join(", ")}</p>
            </div>
          )}
        </div>
      </PageContentSection>

      <PageContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Newsletter content</h2>
        <div className="space-y-0">
          {blocks.map((block) => (
            <NewsletterContentBlockRenderer key={block.id} block={block} />
          ))}
        </div>
        {blocks.length === 0 && (
          <p className="text-sm text-gray-500">No content blocks.</p>
        )}
      </PageContentSection>

      <PageContentSection>
        <button
          type="button"
          onClick={handleDownloadHtml}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Download as HTML
        </button>
      </PageContentSection>
    </>
  );
};

export default NewsletterDetailPage;
