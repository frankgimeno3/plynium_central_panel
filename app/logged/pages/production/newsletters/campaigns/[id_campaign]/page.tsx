"use client";

import React, { FC, use, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { NewsletterCampaign, Newsletter } from "@/app/contents/interfaces";
import AddScheduledNewsletterModal, { type AddScheduledNewsletterForm } from "../../components/AddScheduledNewsletterModal";
import AddCampaignPortalsModal from "../../components/AddCampaignPortalsModal";
import ConfirmRemoveCampaignPortalModal from "../../components/ConfirmRemoveCampaignPortalModal";
import { NewsletterService } from "@/app/service/NewsletterService";
import { CampaignDataTab, type CampaignFormState } from "./_tabs/CampaignDataTab";
import { NewsletterLayoutDesignerTab } from "./_tabs/NewsletterLayoutDesignerTab";

const BASE = "/logged/pages/production/newsletters";

function nextNewsletterId(existing: Newsletter[]): string {
  const nums = existing
    .map((n) => (n.id.startsWith("nl-") ? parseInt(n.id.replace("nl-", ""), 10) : 0))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `nl-${String(max + 1).padStart(3, "0")}`;
}

type PortalTag = { id: number; key: string; name: string };
type CampaignTabId = "data" | "layoutDesigner";

function toFormState(c: NewsletterCampaign): CampaignFormState {
  const t = String(c.newsletterType ?? "main").trim().toLowerCase();
  return {
    name: c.name ?? "",
    description: c.description ?? "",
    newsletterType: (t === "specific" ? "specific" : "main") as "main" | "specific",
    contentTheme: c.contentTheme ?? "",
    frequency: c.frequency ?? "",
    status: c.status ?? "",
  };
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

  const [form, setForm] = useState<CampaignFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [campaignPortals, setCampaignPortals] = useState<PortalTag[]>([]);
  const [portalsModalOpen, setPortalsModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"portal" | "campaign">("portal");
  const [removePortal, setRemovePortal] = useState<PortalTag | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [relatedNewsletters, setRelatedNewsletters] = useState<Newsletter[]>([]);
  const [removing, setRemoving] = useState(false);

  const resetConfirmModal = useCallback(() => {
    setRemoveModalOpen(false);
    setConfirmMode("portal");
    setRemovePortal(null);
    setRelatedError(null);
    setRelatedNewsletters([]);
    setRelatedLoading(false);
    setRemoving(false);
  }, []);

  useEffect(() => {
    if (!campaign) return;
    setForm(toFormState(campaign));
    setSaveError(null);
  }, [campaign?.id]);

  useEffect(() => {
    if (!campaign) return;
    NewsletterService.getNewsletterCampaignPortals(campaign.id)
      .then((list) => setCampaignPortals(Array.isArray(list) ? list : []))
      .catch(() => setCampaignPortals([]));
  }, [campaign?.id]);

  const isDirty = useMemo(() => {
    if (!campaign || !form) return false;
    const original = toFormState(campaign);
    return JSON.stringify(original) !== JSON.stringify(form);
  }, [campaign, form]);

  const handleSave = useCallback(async () => {
    if (!campaign || !form || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await NewsletterService.updateNewsletterCampaign(id_campaign, {
        name: form.name,
        description: form.description,
        newsletterType: form.newsletterType,
        contentTheme: form.contentTheme,
        frequency: form.frequency,
        status: form.status,
      });
      await reload();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }, [campaign, form, id_campaign, reload, saving]);

  const handleCancelEdit = useCallback(() => {
    if (!campaign) return;
    setForm(toFormState(campaign));
    setSaveError(null);
  }, [campaign]);

  const handleAddPortals = useCallback(
    async (portalIds: number[]) => {
      if (!campaign) return;
      await NewsletterService.addNewsletterCampaignPortals(campaign.id, portalIds);
      const list = await NewsletterService.getNewsletterCampaignPortals(campaign.id);
      setCampaignPortals(Array.isArray(list) ? list : []);
      setPortalsModalOpen(false);
      await reload();
    },
    [campaign, reload]
  );

  const openRemovePortal = useCallback(
    async (portal: PortalTag) => {
      if (!campaign) return;
      setConfirmMode("portal");
      setRemovePortal(portal);
      setRemoveModalOpen(true);
      setRelatedLoading(true);
      setRelatedError(null);
      setRelatedNewsletters([]);
      try {
        const list = await NewsletterService.getRelatedNewslettersForCampaignPortal(campaign.id, portal.id);
        setRelatedNewsletters(Array.isArray(list) ? list : []);
      } catch (e: unknown) {
        setRelatedError(e instanceof Error ? e.message : "Failed to load related newsletters");
      } finally {
        setRelatedLoading(false);
      }
    },
    [campaign]
  );

  const openDeleteCampaign = useCallback(async () => {
    if (!campaign) return;
    setConfirmMode("campaign");
    setRemovePortal(null);
    setRemoveModalOpen(true);
    setRelatedLoading(true);
    setRelatedError(null);
    setRelatedNewsletters([]);
    try {
      const list = await NewsletterService.getNewslettersByCampaign(campaign.id);
      setRelatedNewsletters(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      setRelatedError(e instanceof Error ? e.message : "Failed to load newsletters");
    } finally {
      setRelatedLoading(false);
    }
  }, [campaign]);

  const handleConfirmModal = useCallback(async () => {
    if (!campaign) return;
    if (confirmMode === "portal" && !removePortal) return;
    setRemoving(true);
    try {
      if (confirmMode === "portal") {
        if (!removePortal) return;
        await NewsletterService.removeNewsletterCampaignPortal(campaign.id, removePortal.id);
        const list = await NewsletterService.getNewsletterCampaignPortals(campaign.id);
        setCampaignPortals(Array.isArray(list) ? list : []);
        resetConfirmModal();
        await reload();
        return;
      }

      await NewsletterService.deleteNewsletterCampaign(campaign.id);
      resetConfirmModal();
      router.push(BASE);
    } catch (e: unknown) {
      setRelatedError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setRemoving(false);
    }
  }, [BASE, campaign, confirmMode, removePortal, reload, resetConfirmModal, router]);

  const [activeTab, setActiveTab] = useState<CampaignTabId>("data");
  const [modalOpen, setModalOpen] = useState(false);
  const handleLayoutConfigSaved = useCallback(
    (next: { layoutConfig: NewsletterCampaign["layoutConfig"]; updatedAt: string }) => {
      setCampaigns((prev) =>
        prev.map((item) =>
          item.id === id_campaign
            ? { ...item, layoutConfig: next.layoutConfig, updatedAt: next.updatedAt }
            : item
        )
      );
    },
    [id_campaign]
  );

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
              Campaign data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("layoutDesigner")}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "layoutDesigner"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Newsletter Layout Designer
            </button>
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {activeTab === "data" && form ? (
                <CampaignDataTab
                  form={form}
                  setForm={setForm}
                  campaignPortals={campaignPortals}
                  saving={saving}
                  saveError={saveError}
                  isDirty={isDirty}
                  relatedLoading={relatedLoading}
                  removing={removing}
                  onSave={handleSave}
                  onCancelEdit={handleCancelEdit}
                  onDeleteCampaign={openDeleteCampaign}
                  onOpenPortalsModal={() => setPortalsModalOpen(true)}
                  onRemovePortal={openRemovePortal}
                  campaignNewsletters={campaignNewsletters}
                  newslettersBase={BASE}
                  onOpenAddScheduled={() => setModalOpen(true)}
                  onOpenNewsletter={(newsletterId) => router.push(`${BASE}/${newsletterId}`)}
                />
              ) : campaign ? (
                <NewsletterLayoutDesignerTab
                  campaignId={id_campaign}
                  layoutConfig={campaign.layoutConfig}
                  campaignNewsletterType={campaign.newsletterType}
                  persistedUpdatedAt={campaign.updatedAt}
                  onLayoutConfigSaved={handleLayoutConfigSaved}
                />
              ) : null}
            </div>
          </div>
        </div>
      </PageContentSection>

      <AddScheduledNewsletterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddScheduled}
      />

      <AddCampaignPortalsModal
        open={portalsModalOpen}
        existingPortalIds={campaignPortals.map((p) => p.id)}
        onClose={() => setPortalsModalOpen(false)}
        onAdd={handleAddPortals}
      />

      <ConfirmRemoveCampaignPortalModal
        open={removeModalOpen}
        mode={confirmMode}
        portal={removePortal}
        campaignName={form?.name ?? campaign.name}
        loading={relatedLoading}
        newsletters={relatedNewsletters}
        error={relatedError}
        confirming={removing}
        onClose={() => {
          if (removing) return;
          resetConfirmModal();
        }}
        onConfirm={handleConfirmModal}
      />
    </>
  );
};

export default CampaignDetailPage;
