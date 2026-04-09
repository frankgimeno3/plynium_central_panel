"use client";

import React, { FC, use, useEffect, useMemo, useState, useCallback } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { Newsletter, NewsletterCampaign, NewsletterContentBlock } from "@/app/contents/interfaces";
import NewsletterContentBlockRenderer from "../components/NewsletterContentBlockRenderer";
import NewsletterBlockEditModal from "../components/NewsletterBlockEditModal";
import { newsletterBlocksToHtml } from "../utils/newsletterToHtml";
import { NewsletterService } from "@/app/service/NewsletterService";

const BASE = "/logged/pages/production/newsletters";

const NewsletterDetailPage: FC<{ params: Promise<{ id_newsletter: string }> }> = ({ params }) => {
  const { id_newsletter } = use(params);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [blocks, setBlocks] = useState<NewsletterContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<NewsletterContentBlock | null>(null);

  const campaign = useMemo(() => {
    if (!newsletter) return null;
    return campaigns.find((c) => c.id === newsletter.campaignId) ?? null;
  }, [campaigns, newsletter]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignsRes, newsletterRes, blocksRes] = await Promise.all([
        NewsletterService.getNewsletterCampaigns(),
        NewsletterService.getNewsletterById(id_newsletter),
        NewsletterService.getNewsletterBlocks(id_newsletter),
      ]);

      setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
      setNewsletter(newsletterRes);
      setBlocks(Array.isArray(blocksRes) ? blocksRes : []);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load newsletter");
      setCampaigns([]);
      setNewsletter(null);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [id_newsletter]);

  useEffect(() => {
    reload();
  }, [reload]);

  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (loading) return;
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
  }, [setPageMeta, newsletter, loading]);

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

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-gray-600">Loading newsletter…</div>
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

  if (!newsletter) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-500">Newsletter not found.</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const statusOptions: Array<{ value: Newsletter["status"]; label: string }> = [
    { value: "calendarized", label: "Calendarized" },
    { value: "pending", label: "Pending" },
    { value: "published", label: "Published" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const allSentListIds = [
    ...(newsletter.userNewsletterListId ? [newsletter.userNewsletterListId] : []),
    ...(newsletter.sentToLists ?? []),
  ];
  const isSent = newsletter.status === "published" && allSentListIds.length > 0;

  const handleStatusChange = async (newStatus: Newsletter["status"]) => {
    if (isSavingStatus) return;
    setIsSavingStatus(true);
    try {
      const updated = await NewsletterService.updateNewsletterStatus(id_newsletter, {
        status: newStatus,
        userNewsletterListId: newsletter.userNewsletterListId ?? null,
      });
      setNewsletter(updated);
    } catch (e: any) {
      alert(e?.message ? String(e.message) : "Failed to update newsletter status");
    } finally {
      setIsSavingStatus(false);
    }
  };

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Newsletter data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">Estimated publish date</p>
            <p className="font-medium text-gray-900">{newsletter.estimatedPublishDate}</p>
          </div>
          {newsletter.realPublicationDate ? (
            <div>
              <p className="text-xs text-gray-500 uppercase">Real publication date</p>
              <p className="font-medium text-gray-900">{newsletter.realPublicationDate}</p>
            </div>
          ) : null}
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
            <select
              value={newsletter.status}
              onChange={(e) => handleStatusChange(e.target.value as Newsletter["status"])}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSavingStatus}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {isSent && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase">Sent to lists</p>
              <p className="font-medium text-gray-900">{allSentListIds.join(", ")}</p>
            </div>
          )}
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Newsletter content</h2>
        <div className="space-y-4">
          {blocks.map((block) => (
            <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-medium text-blue-950 border border-blue-200 rounded-lg hover:bg-blue-50"
                  onClick={() => {
                    setEditingBlock(block);
                    setIsBlockModalOpen(true);
                  }}
                >
                  Edit
                </button>
              </div>
              <NewsletterContentBlockRenderer block={block} />
            </div>
          ))}
        </div>
        {blocks.length === 0 && (
          <p className="text-sm text-gray-500">No content blocks.</p>
        )}
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <button
          type="button"
          onClick={handleDownloadHtml}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Download as HTML
        </button>
            </div>
          </div>
        </div>
      </PageContentSection>

      <NewsletterBlockEditModal
        open={isBlockModalOpen}
        block={editingBlock}
        onClose={() => {
          setIsBlockModalOpen(false);
          setEditingBlock(null);
        }}
        onSave={async ({ blockType, order, data }) => {
          if (!editingBlock) return;
          await NewsletterService.updateNewsletterContentBlock(id_newsletter, editingBlock.id, {
            blockType,
            order,
            data,
          });
          await reload();
        }}
      />
    </>
  );
};

export default NewsletterDetailPage;
