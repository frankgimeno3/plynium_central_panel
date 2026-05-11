"use client";

import React, { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { NewsletterCampaign } from "@/app/contents/interfaces";
import { NewsletterService } from "@/app/service/NewsletterService";
import { NewsletterRichTextField } from "../components/NewsletterRichTextField";

const BASE = "/logged/pages/production/newsletters";

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Biannual" },
  { value: "annual", label: "Annual" },
];

function nextCampaignId(existingCampaigns: NewsletterCampaign[]): string {
  const nums = existingCampaigns
    .map((c) => (c.id.startsWith("camp-") ? parseInt(c.id.replace("camp-", ""), 10) : 0))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `camp-${String(max + 1).padStart(3, "0")}`;
}

type FormState = {
  name: string;
  description: string;
  portalCode: string;
  newsletterType: "main" | "specific";
  contentTheme: string;
  frequency: string;
  startDate: string;
  endDate: string;
  status: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  portalCode: "plynium",
  newsletterType: "main",
  contentTheme: "",
  frequency: "quarterly",
  startDate: "",
  endDate: "",
  status: "draft",
};

const CreateNewsletterCampaignPage: FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Newsletters", href: BASE },
    { label: "Create newsletter campaign" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create newsletter campaign",
      breadcrumbs,
      buttons: [{ label: "Back to Newsletters", href: BASE }],
    });
  }, [setPageMeta]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    NewsletterService.getNewsletterCampaigns()
      .then((list) => {
        if (cancelled) return;
        setCampaigns(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCampaigns([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.frequency.trim() || submitting) return;

    const id = nextCampaignId(campaigns);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await NewsletterService.createNewsletterCampaign({
        id,
        name: form.name.trim(),
        description: form.description,
        portalCode: form.portalCode.trim(),
        newsletterType: form.newsletterType,
        contentTheme: form.contentTheme,
        frequency: form.frequency,
        status: form.status,
      });
      router.push(`${BASE}/campaigns/${created.id}`);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create campaign");
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New newsletter campaign</h2>
        {submitError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <div>
            <label htmlFor="camp-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="camp-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Facades & Curtain Wall 2025"
              required
            />
          </div>
          <NewsletterRichTextField
            label="Description"
            labelClassName="block text-sm font-medium text-gray-700 mb-1"
            value={form.description}
            onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
            placeholder="Quarterly newsletter on..."
            minHeight="120px"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="camp-portal" className="block text-sm font-medium text-gray-700 mb-1">
                Portal code
              </label>
              <input
                id="camp-portal"
                type="text"
                value={form.portalCode}
                onChange={(e) => setForm((f) => ({ ...f, portalCode: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="plynium"
              />
            </div>
            <div>
              <label htmlFor="camp-theme" className="block text-sm font-medium text-gray-700 mb-1">
                Content theme
              </label>
              <input
                id="camp-theme"
                type="text"
                value={form.contentTheme}
                onChange={(e) => setForm((f) => ({ ...f, contentTheme: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Ventilated facades and curtain wall"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="camp-type" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign type
              </label>
              <select
                id="camp-type"
                value={form.newsletterType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    newsletterType: e.target.value === "specific" ? "specific" : "main",
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="main">Main</option>
                <option value="specific">Specific</option>
              </select>
            </div>
            <div>
              <label htmlFor="camp-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                id="camp-frequency"
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="camp-start" className="block text-sm font-medium text-gray-700 mb-1">
                Start date
              </label>
              <input
                id="camp-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="camp-end" className="block text-sm font-medium text-gray-700 mb-1">
                End date
              </label>
              <input
                id="camp-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="camp-status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="camp-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(BASE)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim() || !form.frequency.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create campaign"}
            </button>
          </div>
        </form>
        <p className="mt-4 text-xs text-gray-500">
          New campaign ID: {loading ? "…" : nextCampaignId(campaigns)}. A default newsletter layout template is created
          with the campaign.
        </p>
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default CreateNewsletterCampaignPage;
