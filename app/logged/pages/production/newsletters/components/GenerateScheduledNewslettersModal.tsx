"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import type { NewsletterCampaign, Newsletter } from "@/app/contents/interfaces";
import { PortalService } from "@/app/service/PortalService";

export interface ScheduledNewsletterDraft {
  key: string;
  campaignId: string;
  campaignName: string;
  portalCode: string;
  topic: string;
  estimatedPublishDate: string;
}

interface GenerateScheduledNewslettersModalProps {
  open: boolean;
  campaigns: NewsletterCampaign[];
  newsletters: Newsletter[];
  confirming?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onConfirm: (items: ScheduledNewsletterDraft[]) => Promise<void> | void;
}

type PreviewItem = ScheduledNewsletterDraft & {
  existingNewsletterId: string | null;
};

type PreviewSection = {
  campaign: NewsletterCampaign;
  frequencyLabel: string;
  items: PreviewItem[];
};

type PortalSection = {
  portalCode: string;
  campaigns: PreviewSection[];
};

const INACTIVE_CAMPAIGN_STATUSES = new Set(["finished", "cancelled", "inactive", "archived"]);

const FREQUENCY_CONFIG: Record<
  string,
  { label: string; unit: "days" | "months"; amount: number }
> = {
  daily: { label: "Daily", unit: "days", amount: 1 },
  weekly: { label: "Weekly", unit: "days", amount: 7 },
  biweekly: { label: "Biweekly", unit: "days", amount: 14 },
  monthly: { label: "Monthly", unit: "months", amount: 1 },
  bimonthly: { label: "Bimonthly", unit: "months", amount: 2 },
  quarterly: { label: "Quarterly", unit: "months", amount: 3 },
  biannual: { label: "Biannual", unit: "months", amount: 6 },
  annual: { label: "Yearly", unit: "months", amount: 12 },
  yearly: { label: "Yearly", unit: "months", amount: 12 },
};

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(isoDate: string) {
  const s = String(isoDate ?? "").trim();
  // Expecting YYYY-MM-DD, keep fallback to original.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy}`;
}

function addToDate(base: Date, unit: "days" | "months", amount: number) {
  const next = new Date(base);
  if (unit === "days") {
    next.setDate(next.getDate() + amount);
    return next;
  }
  next.setMonth(next.getMonth() + amount);
  return next;
}

function normalizeFrequency(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function isCampaignActive(campaign: NewsletterCampaign) {
  return !INACTIVE_CAMPAIGN_STATUSES.has(String(campaign.status ?? "").trim().toLowerCase());
}

function buildOccurrenceDates(from: string, to: string, frequency: string) {
  const config = FREQUENCY_CONFIG[normalizeFrequency(frequency)];
  if (!config || !from || !to) return [];

  const current = new Date(`${from}T00:00:00`);
  const limit = new Date(`${to}T00:00:00`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(limit.getTime()) || current >= limit) {
    return [];
  }

  const dates: string[] = [];
  let cursor = current;
  while (cursor < limit) {
    dates.push(formatDate(cursor));
    cursor = addToDate(cursor, config.unit, config.amount);
  }

  return dates;
}

function campaignTopic(campaign: NewsletterCampaign) {
  return campaign.contentTheme?.trim() || campaign.name;
}

const GenerateScheduledNewslettersModal: FC<GenerateScheduledNewslettersModalProps> = ({
  open,
  campaigns,
  newsletters,
  confirming = false,
  submitError = null,
  onClose,
  onConfirm,
}) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [expandedCampaignIds, setExpandedCampaignIds] = useState<string[]>([]);
  const [expandedPortalCodes, setExpandedPortalCodes] = useState<string[]>([]);
  const [portals, setPortals] = useState<{ id: number; key: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFromDate(formatDate(today));
    setToDate(formatDate(nextYear));
    setSelectedKeys([]);
    setExpandedCampaignIds([]);
    setExpandedPortalCodes([]);

    PortalService.getAllPortals()
      .then((list) => setPortals(Array.isArray(list) ? list : []))
      .catch(() => setPortals([]));
  }, [open]);

  useEffect(() => {
    if (!open || confirming) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, confirming, onClose]);

  const activeCampaigns = useMemo(
    () =>
      campaigns
        .filter(isCampaignActive)
        .sort((a, b) => `${a.portalCode}-${a.name}`.localeCompare(`${b.portalCode}-${b.name}`)),
    [campaigns]
  );

  const sections = useMemo<PreviewSection[]>(() => {
    return activeCampaigns.map((campaign) => {
      const occurrenceDates = buildOccurrenceDates(fromDate, toDate, campaign.frequency);
      const items = occurrenceDates.map((estimatedPublishDate) => {
        const existing = newsletters.find(
          (newsletter) =>
            newsletter.campaignId === campaign.id &&
            newsletter.estimatedPublishDate === estimatedPublishDate
        );
        return {
          key: `${campaign.id}__${estimatedPublishDate}`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          portalCode: campaign.portalCode,
          topic: campaignTopic(campaign),
          estimatedPublishDate,
          existingNewsletterId: existing?.id ?? null,
        };
      });
      const frequencyLabel =
        FREQUENCY_CONFIG[normalizeFrequency(campaign.frequency)]?.label ?? campaign.frequency;
      return { campaign, frequencyLabel, items };
    });
  }, [activeCampaigns, fromDate, newsletters, toDate]);

  const creatableItems = useMemo(
    () => sections.flatMap((section) => section.items.filter((item) => !item.existingNewsletterId)),
    [sections]
  );

  const selectedItems = useMemo(() => {
    const selectedSet = new Set(selectedKeys);
    return creatableItems.filter((item) => selectedSet.has(item.key));
  }, [creatableItems, selectedKeys]);

  const allCreatableSelected =
    creatableItems.length > 0 && selectedItems.length === creatableItems.length;

  const existingCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.items.filter((item) => item.existingNewsletterId).length, 0),
    [sections]
  );

  const handleToggleAll = () => {
    if (allCreatableSelected) {
      setSelectedKeys([]);
      return;
    }
    setSelectedKeys(creatableItems.map((item) => item.key));
  };

  const handleToggleItem = (key: string) => {
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((value) => value !== key) : [...current, key]
    );
  };

  const creatableKeysForSection = (section: PreviewSection) =>
    section.items.filter((x) => !x.existingNewsletterId).map((x) => x.key);

  const creatableKeysForPortal = (portal: PortalSection) =>
    portal.campaigns.flatMap((s) => creatableKeysForSection(s));

  const groupSelectState = (keys: string[], selectedSet: Set<string>): "none" | "some" | "all" => {
    if (keys.length === 0) return "none";
    let n = 0;
    for (const k of keys) {
      if (selectedSet.has(k)) n += 1;
    }
    if (n === 0) return "none";
    if (n === keys.length) return "all";
    return "some";
  };

  const toggleKeysInSelection = (keys: string[]) => {
    if (keys.length === 0) return;
    setSelectedKeys((current) => {
      const set = new Set(current);
      const allSelected = keys.every((k) => set.has(k));
      if (allSelected) keys.forEach((k) => set.delete(k));
      else keys.forEach((k) => set.add(k));
      return Array.from(set);
    });
  };

  const handleToggleCampaign = (id: string) => {
    setExpandedCampaignIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const handleTogglePortal = (portalCode: string) => {
    setExpandedPortalCodes((current) =>
      current.includes(portalCode)
        ? current.filter((value) => value !== portalCode)
        : [...current, portalCode]
    );
  };

  const handleConfirm = async () => {
    if (selectedItems.length === 0 || confirming) return;
    await onConfirm(
      selectedItems.map(({ existingNewsletterId: _existingNewsletterId, ...item }) => item)
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={() => (!confirming ? onClose() : null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-scheduled-newsletters-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2
              id="generate-scheduled-newsletters-title"
              className="text-xl font-semibold text-gray-900"
            >
              Automated generation of scheduled newsletters
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select the newsletters you want to create as calendarized.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(90vh-152px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="scheduled-from" className="mb-1 block text-sm font-medium text-gray-700">
                From
              </label>
              <input
                id="scheduled-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={confirming}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="scheduled-to" className="mb-1 block text-sm font-medium text-gray-700">
                To
              </label>
              <input
                id="scheduled-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={confirming}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAll}
                disabled={creatableItems.length === 0 || confirming}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {allCreatableSelected ? "Clear selection" : "Select all"}
              </button>
              <div className="text-sm text-gray-600">
                {selectedItems.length} selected · {existingCount} already created · {creatableItems.length} available to create
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900">
              Portals
            </div>

            <div className="divide-y divide-gray-200">
              {(() => {
                const selectedSet = new Set(selectedKeys);
                const byPortal = new Map<string, PreviewSection[]>();
                for (const section of sections) {
                  const key = String(section.campaign.portalCode ?? "").trim() || "unknown";
                  const list = byPortal.get(key) ?? [];
                  list.push(section);
                  byPortal.set(key, list);
                }
                const portalIdByKey = new Map(
                  (Array.isArray(portals) ? portals : []).map((p) => [String(p.key ?? "").trim(), Number(p.id)])
                );
                const portalSections: PortalSection[] = Array.from(byPortal.entries())
                  .map(([portalCode, campaignSections]) => ({
                    portalCode,
                    campaigns: campaignSections.slice().sort((a, b) =>
                      `${a.campaign.name}`.localeCompare(`${b.campaign.name}`)
                    ),
                  }))
                  .sort((a, b) => {
                    const ida = portalIdByKey.get(a.portalCode);
                    const idb = portalIdByKey.get(b.portalCode);
                    if (ida != null && idb != null && ida !== idb) return ida - idb;
                    if (ida != null && idb == null) return -1;
                    if (ida == null && idb != null) return 1;
                    return a.portalCode.localeCompare(b.portalCode);
                  });

                return portalSections.map((portal) => {
                  const portalExpanded = expandedPortalCodes.includes(portal.portalCode);
                  const portalExisting = portal.campaigns.reduce(
                    (sum, c) => sum + c.items.filter((x) => x.existingNewsletterId).length,
                    0
                  );
                  const portalCreatable = portal.campaigns.reduce(
                    (sum, c) => sum + c.items.filter((x) => !x.existingNewsletterId).length,
                    0
                  );
                  const portalMasterKeys = creatableKeysForPortal(portal);
                  const portalMasterState = groupSelectState(portalMasterKeys, selectedSet);

                  return (
                    <div key={portal.portalCode}>
                      <div className="flex w-full items-stretch gap-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                        <div className="flex shrink-0 items-center pl-3 pr-1">
                          <input
                            type="checkbox"
                            checked={portalMasterState === "all"}
                            ref={(el) => {
                              if (el) el.indeterminate = portalMasterState === "some";
                            }}
                            onChange={() => toggleKeysInSelection(portalMasterKeys)}
                            disabled={portalCreatable === 0 || confirming}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            aria-label={`Select or clear all creatable newsletter slots for portal ${portal.portalCode}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePortal(portal.portalCode)}
                          className="flex min-w-0 flex-1 items-center justify-between gap-4 py-3 pr-4 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {portal.portalCode}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {portal.campaigns.length} active campaign(s) · {portalExisting} already created ·{" "}
                              {portalCreatable} to create
                            </p>
                          </div>

                          <span className="shrink-0 text-gray-400">{portalExpanded ? "▴" : "▾"}</span>
                        </button>
                      </div>

                      {portalExpanded && (
                        <div className="bg-white px-4 pb-4">
                          <div className="space-y-3 pt-2">
                            {portal.campaigns.map((section) => {
                              const isExpanded = expandedCampaignIds.includes(section.campaign.id);
                              const existingInCampaign = section.items.filter((x) => x.existingNewsletterId).length;
                              const creatableInCampaign = section.items.length - existingInCampaign;
                              const campaignMasterKeys = creatableKeysForSection(section);
                              const campaignMasterState = groupSelectState(campaignMasterKeys, selectedSet);
                              return (
                                <div
                                  key={section.campaign.id}
                                  className="rounded-lg border border-gray-200"
                                >
                                  <div className="flex w-full items-stretch gap-2 hover:bg-gray-50">
                                    <div className="flex shrink-0 items-center pl-3 pr-1">
                                      <input
                                        type="checkbox"
                                        checked={campaignMasterState === "all"}
                                        ref={(el) => {
                                          if (el) el.indeterminate = campaignMasterState === "some";
                                        }}
                                        onChange={() => toggleKeysInSelection(campaignMasterKeys)}
                                        disabled={creatableInCampaign === 0 || confirming}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                        aria-label={`Select or clear all creatable newsletter slots for campaign ${section.campaign.name}`}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCampaign(section.campaign.id)}
                                      className="flex min-w-0 flex-1 items-center justify-between gap-4 py-3 pr-4 text-left"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900">
                                          {section.campaign.name}
                                        </p>
                                        <p className="mt-0.5 text-sm text-gray-500">
                                          {section.campaign.newsletterType} · {existingInCampaign} already created ·{" "}
                                          {creatableInCampaign} to create
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-3">
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                                          {section.frequencyLabel}
                                        </span>
                                        <span className="text-gray-400">{isExpanded ? "▴" : "▾"}</span>
                                      </div>
                                    </button>
                                  </div>

                                  {isExpanded && (
                                    <div className="border-t border-gray-200 bg-white">
                                      {section.items.length === 0 ? (
                                        <p className="px-4 py-3 text-sm text-gray-500">
                                          No newsletters fall inside the selected range.
                                        </p>
                                      ) : (
                                        <div className="divide-y divide-gray-100">
                                          {section.items.map((item) => {
                                            const selected = selectedKeys.includes(item.key);
                                            const existing = Boolean(item.existingNewsletterId);
                                            return (
                                              <button
                                                key={item.key}
                                                type="button"
                                                onClick={() =>
                                                  !existing && !confirming ? handleToggleItem(item.key) : null
                                                }
                                                className={`flex w-full items-center gap-4 px-4 py-3 text-left ${
                                                  existing
                                                    ? "bg-green-50"
                                                    : selected
                                                      ? "bg-blue-50"
                                                      : "bg-white hover:bg-gray-50"
                                                } ${existing || confirming ? "cursor-default" : "cursor-pointer"}`}
                                              >
                                                <div className="w-6">
                                                  {existing ? (
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                                                      ✓
                                                    </div>
                                                  ) : (
                                                    <input
                                                      type="checkbox"
                                                      checked={selected}
                                                      onChange={() => handleToggleItem(item.key)}
                                                      onClick={(e) => e.stopPropagation()}
                                                      disabled={confirming}
                                                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                  )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                      {formatDisplayDate(item.estimatedPublishDate)}
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-500">
                                                      {existing
                                                        ? `Already created${item.existingNewsletterId ? ` · ${item.existingNewsletterId}` : ""}`
                                                        : "Will be created after accepting"}
                                                    </p>
                                                  </div>
                                                  <p className="mt-1 text-sm text-gray-600">{item.topic}</p>
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {sections.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">No active newsletter campaigns found.</div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedItems.length === 0 || confirming}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? "Creating…" : "Confirm selection"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateScheduledNewslettersModal;
