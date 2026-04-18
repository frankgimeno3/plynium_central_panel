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

const BASE = "/logged/pages/production/newsletters";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "bimonthly", label: "Bimonthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Biannual" },
  { value: "annual", label: "Yearly" },
];

function nextNewsletterId(existing: Newsletter[]): string {
  const nums = existing
    .map((n) => (n.id.startsWith("nl-") ? parseInt(n.id.replace("nl-", ""), 10) : 0))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `nl-${String(max + 1).padStart(3, "0")}`;
}

type CampaignFormState = {
  name: string;
  description: string;
  newsletterType: "main" | "specific";
  contentTheme: string;
  frequency: string;
  status: string;
};

type PortalTag = { id: number; key: string; name: string };

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
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Campaign data</h2>
            <p className="text-sm text-gray-500">Edit and save campaign fields.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={openDeleteCampaign}
              disabled={saving || removing || relatedLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Delete Newsletter Campaign
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={!isDirty || saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving || !form?.name.trim() || !form?.frequency.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={form?.name ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Portal</label>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              {campaignPortals.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 border border-gray-200"
                >
                  {p.key}
                  <button
                    type="button"
                    onClick={() => openRemovePortal(p)}
                    className="text-gray-500 hover:text-gray-800"
                    aria-label={`Remove ${p.key}`}
                    disabled={saving}
                  >
                    ×
                  </button>
                </span>
              ))}
              {campaignPortals.length === 0 && (
                <span className="text-sm text-gray-500">No portals</span>
              )}
              <button
                type="button"
                onClick={() => setPortalsModalOpen(true)}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Add portal"
                disabled={saving}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Type</label>
            <select
              value={form?.newsletterType ?? "main"}
              onChange={(e) =>
                setForm((f) =>
                  f
                    ? { ...f, newsletterType: (e.target.value === "specific" ? "specific" : "main") }
                    : f
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
            >
              <option value="main">main</option>
              <option value="specific">specific</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Status</label>
            <input
              type="text"
              value={form?.status ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, status: e.target.value } : f))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Content theme</label>
            <input
              type="text"
              value={form?.contentTheme ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, contentTheme: e.target.value } : f))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Frequency</label>
            <select
              value={form?.frequency ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, frequency: e.target.value } : f))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
              required
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              {form?.frequency &&
                !FREQUENCY_OPTIONS.some((opt) => opt.value === form.frequency) && (
                  <option value={form.frequency}>{form.frequency}</option>
                )}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 uppercase mb-1">Description</label>
            <textarea
              value={form?.description ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={4}
              disabled={saving}
            />
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
