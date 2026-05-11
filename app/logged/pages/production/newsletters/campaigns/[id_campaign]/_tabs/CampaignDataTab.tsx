"use client";

import React from "react";
import type { Newsletter } from "@/app/contents/interfaces";
import { NewsletterRichTextField } from "../../../components/NewsletterRichTextField";

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

export type CampaignFormState = {
  name: string;
  description: string;
  newsletterType: "main" | "specific";
  contentTheme: string;
  frequency: string;
  status: string;
};

type PortalTag = { id: number; key: string; name: string };

type CampaignDataTabProps = {
  form: CampaignFormState;
  setForm: React.Dispatch<React.SetStateAction<CampaignFormState | null>>;
  campaignPortals: PortalTag[];
  saving: boolean;
  saveError: string | null;
  isDirty: boolean;
  relatedLoading: boolean;
  removing: boolean;
  onSave: () => void;
  onCancelEdit: () => void;
  onDeleteCampaign: () => void;
  onOpenPortalsModal: () => void;
  onRemovePortal: (portal: PortalTag) => void;
  campaignNewsletters: Newsletter[];
  newslettersBase: string;
  onOpenAddScheduled: () => void;
  onOpenNewsletter: (newsletterId: string) => void;
};

export function CampaignDataTab({
  form,
  setForm,
  campaignPortals,
  saving,
  saveError,
  isDirty,
  relatedLoading,
  removing,
  onSave,
  onCancelEdit,
  onDeleteCampaign,
  onOpenPortalsModal,
  onRemovePortal,
  campaignNewsletters,
  newslettersBase,
  onOpenAddScheduled,
  onOpenNewsletter,
}: CampaignDataTabProps) {
  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Campaign data</h2>
            <p className="text-sm text-gray-500">Edit and save campaign fields.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onDeleteCampaign}
              disabled={saving || removing || relatedLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Delete Newsletter Campaign
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={!isDirty || saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!isDirty || saving || !form.name.trim() || !form.frequency.trim()}
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
              value={form.name}
              onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Portal</label>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              {campaignPortals.map((portal) => (
                <span
                  key={portal.id}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 border border-gray-200"
                >
                  {portal.key}
                  <button
                    type="button"
                    onClick={() => onRemovePortal(portal)}
                    className="text-gray-500 hover:text-gray-800"
                    aria-label={`Remove ${portal.key}`}
                    disabled={saving}
                  >
                    ×
                  </button>
                </span>
              ))}
              {campaignPortals.length === 0 && <span className="text-sm text-gray-500">No portals</span>}
              <button
                type="button"
                onClick={onOpenPortalsModal}
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
              value={form.newsletterType}
              onChange={(event) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, newsletterType: event.target.value === "specific" ? "specific" : "main" }
                    : prev
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
              value={form.status}
              onChange={(event) => setForm((prev) => (prev ? { ...prev, status: event.target.value } : prev))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Content theme</label>
            <input
              type="text"
              value={form.contentTheme}
              onChange={(event) => setForm((prev) => (prev ? { ...prev, contentTheme: event.target.value } : prev))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Frequency</label>
            <select
              value={form.frequency}
              onChange={(event) => setForm((prev) => (prev ? { ...prev, frequency: event.target.value } : prev))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={saving}
              required
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {form.frequency && !FREQUENCY_OPTIONS.some((option) => option.value === form.frequency) && (
                <option value={form.frequency}>{form.frequency}</option>
              )}
            </select>
          </div>
          <div className="md:col-span-2">
            <NewsletterRichTextField
              label="Description"
              value={form.description}
              onChange={(value) => setForm((prev) => (prev ? { ...prev, description: value } : prev))}
              minHeight="140px"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Related newsletters</h2>
          <button
            type="button"
            onClick={onOpenAddScheduled}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publication date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User newsletter list
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignNewsletters.map((newsletter) => (
                <tr
                  key={newsletter.id}
                  onClick={() => onOpenNewsletter(newsletter.id)}
                  className={rowClass}
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{newsletter.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{newsletter.topic}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{newsletter.estimatedPublishDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{newsletter.userNewsletterListId ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{newsletter.status}</td>
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
  );
}
