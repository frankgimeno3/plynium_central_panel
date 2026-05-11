"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Newsletter, NewsletterCampaign, NewsletterContentBlock } from "@/app/contents/interfaces";
import type { NewsletterCampaignLayoutConfig } from "@/app/contents/newsletterCampaignLayout";
import { NewsletterService } from "@/app/service/NewsletterService";
import { COLOR_OPTIONS, FONT_OPTIONS } from "../../../campaigns/[id_campaign]/_layout/designerOptions";
import { NewsletterComposedView } from "../../../components/NewsletterComposedView";
import {
  mapBlocksToContentItems,
  resolveCampaignLayout,
  resolveEffectiveNewsletterLayout,
} from "../../../utils/newsletterLayoutModel";
type EditionTabProps = {
  newsletter: Newsletter;
  campaign: NewsletterCampaign | null;
  blocks: NewsletterContentBlock[];
  config: NewsletterCampaignLayoutConfig;
  onConfigChange: (config: NewsletterCampaignLayoutConfig) => void;
  onNewsletterUpdated: (newsletter: Newsletter) => void;
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase mb-1">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

export function EditionTab({
  newsletter,
  campaign,
  blocks,
  config,
  onConfigChange,
  onNewsletterUpdated,
}: EditionTabProps) {
  const campaignLayout = useMemo(() => resolveCampaignLayout(campaign), [campaign]);
  const persistedLayout = useMemo(
    () => resolveEffectiveNewsletterLayout(campaign, newsletter),
    [campaign, newsletter]
  );
  const contentItems = useMemo(() => mapBlocksToContentItems(blocks), [blocks]);

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSaveError(null);
    setAutoSaveStatus("idle");
  }, [newsletter.id, newsletter.updatedAt]);

  const hasChanges = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(persistedLayout),
    [config, persistedLayout]
  );

  const differsFromCampaign = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(campaignLayout),
    [config, campaignLayout]
  );

  const patch = (next: Partial<NewsletterCampaignLayoutConfig>) => {
    onConfigChange({ ...config, ...next });
  };

  const saveEdition = useCallback(async () => {
    setAutoSaveStatus("saving");
    setSaveError(null);
    try {
      const updated = await NewsletterService.updateNewsletter(newsletter.id, {
        layoutEditionConfig: differsFromCampaign ? config : null,
      });
      onNewsletterUpdated(updated);
      setAutoSaveStatus("saved");
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        savedFlashTimerRef.current = null;
        setAutoSaveStatus((status) => (status === "saved" ? "idle" : status));
      }, 1500);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Failed to save edition");
      setAutoSaveStatus("error");
    }
  }, [config, differsFromCampaign, newsletter.id, onNewsletterUpdated]);

  useEffect(() => {
    if (!hasChanges) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      void saveEdition();
    }, 600);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [hasChanges, config, saveEdition]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    },
    []
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Edition</h3>
            <p className="text-sm text-gray-500">
              Override the campaign layout for this newsletter. Changes are saved automatically.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {autoSaveStatus === "saving"
              ? "Saving edition…"
              : autoSaveStatus === "saved"
                ? "Edition saved"
                : autoSaveStatus === "error"
                  ? "Edition save failed"
                  : hasChanges
                    ? "Unsaved changes"
                    : differsFromCampaign
                      ? "Edition differs from campaign"
                      : "Matches campaign layout"}
          </p>
        </div>

        {saveError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        ) : null}

        <section className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Header</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Header background"
              value={config.headerBackground}
              onChange={(value) => patch({ headerBackground: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <TextField
              label="Header logo"
              value={config.headerLogoLabel}
              onChange={(value) => patch({ headerLogoLabel: value })}
            />
            <TextField
              label="Header text right"
              value={config.headerTextRight}
              onChange={(value) => patch({ headerTextRight: value })}
            />
            <TextField
              label="Header subtitle"
              value={config.headerSubtitle}
              onChange={(value) => patch({ headerSubtitle: value })}
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Content cards</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Content section background color"
              value={config.contentSectionBackground}
              onChange={(value) => patch({ contentSectionBackground: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <SelectField
              label="Title font"
              value={config.titleFont}
              onChange={(value) => patch({ titleFont: value })}
              options={FONT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <SelectField
              label="Subtitle font"
              value={config.subtitleFont}
              onChange={(value) => patch({ subtitleFont: value })}
              options={FONT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <SelectField
              label="Title text color"
              value={config.titleTextColor}
              onChange={(value) => patch({ titleTextColor: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <SelectField
              label="Subtitle text color"
              value={config.subtitleTextColor}
              onChange={(value) => patch({ subtitleTextColor: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <SelectField
              label="Button color"
              value={config.buttonColor}
              onChange={(value) => patch({ buttonColor: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <SelectField
              label="Button text color"
              value={config.buttonTextColor}
              onChange={(value) => patch({ buttonTextColor: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Footer</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Footer color"
              value={config.footerColor}
              onChange={(value) => patch({ footerColor: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <SelectField
              label="Footer text color"
              value={config.footerTextColor}
              onChange={(value) => patch({ footerTextColor: value })}
              options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
            <TextField
              label="Footer contact email"
              value={config.footerContactEmail}
              onChange={(value) => patch({ footerContactEmail: value })}
            />
            <TextField
              label="Footer LinkedIn link"
              value={config.footerLinkedinLink}
              onChange={(value) => patch({ footerLinkedinLink: value })}
            />
            <TextField
              label="Footer website"
              value={config.footerWebsite}
              onChange={(value) => patch({ footerWebsite: value })}
            />
            <TextField
              label="Footer contact phone"
              value={config.footerContactPhone}
              onChange={(value) => patch({ footerContactPhone: value })}
            />
            <TextField
              label="Footer unsubscribe email"
              value={config.footerUnsubscribeEmail}
              onChange={(value) => patch({ footerUnsubscribeEmail: value })}
            />
          </div>
        </section>
      </div>

      <NewsletterComposedView config={config} contentItems={contentItems} />
    </div>
  );
}
