"use client";

import React, { FC, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { Newsletter, NewsletterCampaign, NewsletterContentBlock } from "@/app/contents/interfaces";
import type { NewsletterCampaignLayoutConfig } from "@/app/contents/newsletterCampaignLayout";
import type { NewsletterListRow } from "@/app/logged/logged_components/modals/SelectNewsletterListModal";
import { NewsletterService } from "@/app/service/NewsletterService";
import apiClient from "@/app/apiClient";
import { DataTab, type NewsletterDataDraft, type NewsletterRelatedProject } from "./_tabs/DataTab";
import { ContentsManagerTab } from "./_tabs/ContentsManagerTab";
import SelectNewsletterListsModal from "./_components/SelectNewsletterListsModal";
import ConfirmUnassignNewsletterListModal from "./_components/ConfirmUnassignNewsletterListModal";
import NewsletterHtmlPreviewModal from "./_components/NewsletterHtmlPreviewModal";
import { newsletterLayoutToHtml } from "../utils/newsletterLayoutToHtml";
import {
  mapBlocksToContentItems,
  resolveEffectiveNewsletterLayout,
} from "../utils/newsletterLayoutModel";

const BASE = "/logged/pages/production/newsletters";

type TabId = "data" | "contentsManager";

function getAssignedListIds(newsletter: Newsletter): string[] {
  if (Array.isArray(newsletter.userNewsletterListIds) && newsletter.userNewsletterListIds.length > 0) {
    return newsletter.userNewsletterListIds;
  }
  return [
    ...(newsletter.userNewsletterListId ? [newsletter.userNewsletterListId] : []),
    ...(newsletter.sentToLists ?? []),
  ];
}

function buildDraft(newsletter: Newsletter): NewsletterDataDraft {
  return {
    publicationDate: newsletter.estimatedPublishDate ?? "",
    topic: newsletter.topic ?? "",
    status: newsletter.status,
    assignedListIds: getAssignedListIds(newsletter),
  };
}

const NewsletterDetailPage: FC<{ params: Promise<{ id_newsletter: string }> }> = ({ params }) => {
  const { id_newsletter } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("data");
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [blocks, setBlocks] = useState<NewsletterContentBlock[]>([]);
  const [relatedProjects, setRelatedProjects] = useState<NewsletterRelatedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<NewsletterDataDraft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [userLists, setUserLists] = useState<NewsletterListRow[]>([]);
  const [selectListsModalOpen, setSelectListsModalOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<{ id: string; name: string } | null>(null);
  const [editionLayoutConfig, setEditionLayoutConfig] = useState<NewsletterCampaignLayoutConfig | null>(
    null
  );
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);
  const openHtmlPreviewRef = useRef<() => void>(() => {});

  const campaign = useMemo(() => {
    if (!newsletter) return null;
    return campaigns.find((item) => item.id === newsletter.campaignId) ?? null;
  }, [campaigns, newsletter]);

  const persistedEditionLayout = useMemo(() => {
    if (!newsletter) return null;
    return resolveEffectiveNewsletterLayout(campaign, newsletter);
  }, [campaign, newsletter]);

  const contentItems = useMemo(() => mapBlocksToContentItems(blocks), [blocks]);

  const editionPreviewHtml = useMemo(() => {
    if (!editionLayoutConfig) return "";
    return newsletterLayoutToHtml(editionLayoutConfig, contentItems);
  }, [editionLayoutConfig, contentItems]);

  useEffect(() => {
    if (!persistedEditionLayout) return;
    setEditionLayoutConfig(persistedEditionLayout);
  }, [newsletter?.id, newsletter?.updatedAt, persistedEditionLayout]);

  openHtmlPreviewRef.current = () => {
    if (!editionLayoutConfig) return;
    setHtmlPreviewOpen(true);
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignsRes, newsletterRes, blocksRes, relatedProjectsRes] = await Promise.all([
        NewsletterService.getNewsletterCampaigns(),
        NewsletterService.getNewsletterById(id_newsletter),
        NewsletterService.getNewsletterBlocks(id_newsletter),
        NewsletterService.getNewsletterRelatedProjects(id_newsletter),
      ]);

      setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
      setNewsletter(newsletterRes);
      setBlocks(Array.isArray(blocksRes) ? blocksRes : []);
      setRelatedProjects(
        Array.isArray(relatedProjectsRes?.items)
          ? (relatedProjectsRes.items as NewsletterRelatedProject[])
          : []
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load newsletter");
      setCampaigns([]);
      setNewsletter(null);
      setBlocks([]);
      setRelatedProjects([]);
    } finally {
      setLoading(false);
    }
  }, [id_newsletter]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!newsletter) return;
    NewsletterService.getNewsletterRelatedProjects(newsletter.id)
      .then((response) => {
        setRelatedProjects(
          Array.isArray(response?.items) ? (response.items as NewsletterRelatedProject[]) : []
        );
      })
      .catch(() => setRelatedProjects([]));
  }, [newsletter?.id, blocks]);

  useEffect(() => {
    if (!newsletter) {
      setDraft(null);
      return;
    }
    setDraft(buildDraft(newsletter));
    setSaveError(null);
  }, [newsletter?.id, newsletter?.updatedAt]);

  useEffect(() => {
    apiClient
      .get<NewsletterListRow[]>("/api/v1/user-lists")
      .then((res) => setUserLists(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUserLists([]));
  }, []);

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
        buttons: [
          { label: "Back to Newsletters", href: BASE },
          { label: "Download as HTML", onClick: () => openHtmlPreviewRef.current() },
        ],
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

  const persistedDraft = useMemo(
    () => (newsletter ? buildDraft(newsletter) : null),
    [newsletter]
  );

  const hasDraftChanges = useMemo(() => {
    if (!draft || !persistedDraft) return false;
    return JSON.stringify(draft) !== JSON.stringify(persistedDraft);
  }, [draft, persistedDraft]);

  const saveDraft = useCallback(async () => {
    if (!draft || !newsletter) return;
    setAutoSaveStatus("saving");
    setSaveError(null);
    try {
      const updated = await NewsletterService.updateNewsletter(id_newsletter, {
        estimatedPublishDate: draft.publicationDate || null,
        topic: draft.topic,
        status: draft.status,
        userNewsletterListIds: draft.assignedListIds,
      });
      setNewsletter(updated);
      setAutoSaveStatus("saved");
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        savedFlashTimerRef.current = null;
        setAutoSaveStatus((status) => (status === "saved" ? "idle" : status));
      }, 1500);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save newsletter");
      setAutoSaveStatus("error");
    }
  }, [draft, id_newsletter, newsletter]);

  useEffect(() => {
    if (!hasDraftChanges) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      void saveDraft();
    }, 600);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [hasDraftChanges, draft, saveDraft]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    },
    []
  );

  const assignedLists = useMemo(() => {
    if (!draft) return [];
    return draft.assignedListIds.map((listId) => {
      const row = userLists.find((list) => String(list.userList_id) === String(listId));
      return {
        id: listId,
        name: row?.userListName?.trim() || listId,
        subscriberCount: Array.isArray(row?.listUserIdsArray) ? row.listUserIdsArray.length : null,
      };
    });
  }, [draft, userLists]);

  const handleDraftChange = (patch: Partial<NewsletterDataDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleAddLists = (lists: NewsletterListRow[]) => {
    if (!draft || lists.length === 0) return;
    const nextIds = [...draft.assignedListIds];
    lists.forEach((list) => {
      if (!nextIds.includes(list.userList_id)) nextIds.push(list.userList_id);
    });
    handleDraftChange({ assignedListIds: nextIds });
    setSelectListsModalOpen(false);
  };

  const handleConfirmUnassign = () => {
    if (!draft || !unassignTarget) return;
    handleDraftChange({
      assignedListIds: draft.assignedListIds.filter((id) => id !== unassignTarget.id),
    });
    setUnassignTarget(null);
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-gray-600">Loading newsletter…</div>
      </PageContentSection>
    );
  }

  if (error) {
    return (
      <PageContentSection>
        <div className="p-6 text-red-600">{error}</div>
      </PageContentSection>
    );
  }

  if (!newsletter || !draft) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Newsletter not found.</div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection className="pt-4">
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-hidden px-2">
            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "data"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contentsManager")}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "contentsManager"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Contents Manager
            </button>
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {activeTab === "data" ? (
                <DataTab
                  draft={draft}
                  onDraftChange={handleDraftChange}
                  campaign={campaign}
                  campaignId={newsletter.campaignId}
                  portalCode={newsletter.portalCode}
                  realPublicationDate={newsletter.realPublicationDate}
                  autoSaveStatus={autoSaveStatus}
                  saveError={saveError}
                  assignedLists={assignedLists}
                  relatedProjects={relatedProjects}
                  onOpenSelectLists={() => setSelectListsModalOpen(true)}
                  onRequestUnassignList={(list) => setUnassignTarget({ id: list.id, name: list.name })}
                />
              ) : editionLayoutConfig ? (
                <ContentsManagerTab
                  newsletter={newsletter}
                  campaign={campaign}
                  blocks={blocks}
                  editionLayoutConfig={editionLayoutConfig}
                  onEditionLayoutChange={setEditionLayoutConfig}
                  onBlocksChange={setBlocks}
                  onNewsletterUpdated={setNewsletter}
                />
              ) : (
                <div className="text-sm text-gray-500">Loading contents manager…</div>
              )}
            </div>
          </div>
        </div>
      </PageContentSection>

      <SelectNewsletterListsModal
        open={selectListsModalOpen}
        onClose={() => setSelectListsModalOpen(false)}
        onConfirm={handleAddLists}
        assignedListIds={draft.assignedListIds}
      />

      <ConfirmUnassignNewsletterListModal
        open={Boolean(unassignTarget)}
        listName={unassignTarget?.name ?? ""}
        onClose={() => setUnassignTarget(null)}
        onConfirm={handleConfirmUnassign}
      />

      <NewsletterHtmlPreviewModal
        open={htmlPreviewOpen}
        html={editionPreviewHtml}
        onClose={() => setHtmlPreviewOpen(false)}
      />

    </>
  );
};

export default NewsletterDetailPage;
