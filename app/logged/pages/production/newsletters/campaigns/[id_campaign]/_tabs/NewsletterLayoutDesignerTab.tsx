"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PortalService } from "@/app/service/PortalService";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";
import { NewsletterService } from "@/app/service/NewsletterService";
import type { Magazine } from "@/app/contents/interfaces";
import { COLOR_OPTIONS, FONT_OPTIONS } from "../_layout/designerOptions";
import {
  normalizeLayoutDesignerConfig,
  type LayoutDesignerConfig,
} from "../_layout/layoutDesignerTypes";
import { NewsletterLayoutPreview } from "./NewsletterLayoutPreview";
import { NewsletterRichTextField } from "../../../components/NewsletterRichTextField";

type PortalOption = { id: number; key: string; name: string };

type PublicationOption = {
  id_publication: string;
  publication_edition_name: string;
  publication_main_image_url?: string;
};

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase mb-1">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
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

type NewsletterLayoutDesignerTabProps = {
  campaignId: string;
  layoutConfig: LayoutDesignerConfig;
  campaignNewsletterType: string;
  persistedUpdatedAt: string;
  onLayoutConfigSaved: (next: { layoutConfig: LayoutDesignerConfig; updatedAt: string }) => void;
};

export function NewsletterLayoutDesignerTab({
  campaignId,
  layoutConfig,
  campaignNewsletterType,
  persistedUpdatedAt,
  onLayoutConfigSaved,
}: NewsletterLayoutDesignerTabProps) {
  const [config, setConfig] = useState<LayoutDesignerConfig>(() =>
    normalizeLayoutDesignerConfig(layoutConfig, campaignNewsletterType)
  );
  const [portals, setPortals] = useState<PortalOption[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [publications, setPublications] = useState<PublicationOption[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setConfig(normalizeLayoutDesignerConfig(layoutConfig, campaignNewsletterType));
    setSaveError(null);
    setAutoSaveStatus("idle");
  }, [campaignId, campaignNewsletterType, layoutConfig, persistedUpdatedAt]);

  useEffect(() => {
    PortalService.getAllPortals()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPortals(
          list
            .map((row) => ({
              id: Number((row as { id?: number }).id),
              key: String((row as { key?: string }).key ?? ""),
              name: String((row as { name?: string }).name ?? ""),
            }))
            .filter((row) => Number.isFinite(row.id))
        );
      })
      .catch(() => setPortals([]));

    MagazineService.getAllMagazines()
      .then((data) => setMagazines(Array.isArray(data) ? data : []))
      .catch(() => setMagazines([]));
  }, []);

  useEffect(() => {
    if (!config.magazineId) {
      setPublications([]);
      return;
    }
    PublicationService.listPublicationsForMagazine(config.magazineId)
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setPublications(
          rows.map((row) => {
            const item = row as Record<string, unknown>;
            return {
              id_publication: String(item.id_publication ?? ""),
              publication_edition_name: String(item.publication_edition_name ?? ""),
              publication_main_image_url: String(item.publication_main_image_url ?? ""),
            };
          })
        );
      })
      .catch(() => setPublications([]));
  }, [config.magazineId]);

  const patch = (next: Partial<LayoutDesignerConfig>) => {
    setConfig((prev) => ({ ...prev, ...next }));
  };

  const persistedConfig = useMemo(
    () => normalizeLayoutDesignerConfig(layoutConfig, campaignNewsletterType),
    [campaignNewsletterType, layoutConfig]
  );

  const hasLayoutChanges = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(persistedConfig),
    [config, persistedConfig]
  );

  const saveLayout = useCallback(async () => {
    setAutoSaveStatus("saving");
    setSaveError(null);
    try {
      const updated = await NewsletterService.updateNewsletterCampaign(campaignId, {
        layoutConfig: config,
      });
      onLayoutConfigSaved({
        layoutConfig: updated.layoutConfig,
        updatedAt: updated.updatedAt,
      });
      setAutoSaveStatus("saved");
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        savedFlashTimerRef.current = null;
        setAutoSaveStatus((status) => (status === "saved" ? "idle" : status));
      }, 1500);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Failed to save layout");
      setAutoSaveStatus("error");
    }
  }, [campaignId, config, onLayoutConfigSaved]);

  useEffect(() => {
    if (!hasLayoutChanges) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      void saveLayout();
    }, 600);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [hasLayoutChanges, config, saveLayout]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    },
    []
  );

  const isMagazine = config.newsletterType === "magazine";
  const magazineAsHeader = isMagazine && config.magazineHeaderMode === "magazine_as_header";
  const showNormalHeaderFields =
    config.newsletterType === "main" ||
    config.newsletterType === "specific" ||
    (isMagazine && config.magazineHeaderMode === "normal_header_and_magazine_in_content");
  const showMagazineContentBlock =
    isMagazine && config.magazineHeaderMode === "normal_header_and_magazine_in_content";
  const showArticleCardFields = config.newsletterType === "main" || config.newsletterType === "specific";

  const portalOptions = useMemo(
    () => portals.map((portal) => ({ value: String(portal.id), label: portal.key || portal.name || String(portal.id) })),
    [portals]
  );

  const magazineOptions = useMemo(() => {
    return magazines.map((magazine) => ({
      value: magazine.id_magazine,
      label: magazine.name || magazine.id_magazine,
    }));
  }, [magazines]);

  const publicationOptions = useMemo(
    () =>
      publications.map((publication) => ({
        value: publication.id_publication,
        label: publication.publication_edition_name || publication.id_publication,
      })),
    [publications]
  );

  const selectedPublication = publications.find((row) => row.id_publication === config.magazinePublicationId);
  const selectedPortal = portals.find((portal) => String(portal.id) === config.magazinePortalId);
  const selectedMagazine = magazines.find((magazine) => magazine.id_magazine === config.magazineId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Newsletter layout designer</h2>
            <p className="text-sm text-gray-500">
              Configure the campaign template preview. Example content uses lorem ipsum.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {autoSaveStatus === "saving"
              ? "Saving layout…"
              : autoSaveStatus === "saved"
                ? "Layout saved"
                : autoSaveStatus === "error"
                  ? "Layout save failed"
                  : hasLayoutChanges
                    ? "Unsaved changes"
                    : "Layout up to date"}
          </p>
        </div>
        {saveError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        ) : null}

        <SelectField
          label="Newsletter type"
          value={config.newsletterType}
          onChange={(value) =>
            patch({
              newsletterType: value === "magazine" || value === "specific" ? value : "main",
            })
          }
          options={[
            { value: "main", label: "Main" },
            { value: "specific", label: "Specific" },
            { value: "magazine", label: "Magazine" },
          ]}
          placeholder="Select newsletter type"
        />

        <section className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Header</h3>

          {isMagazine ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => patch({ magazineHeaderMode: "magazine_as_header" })}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  magazineAsHeader
                    ? "bg-blue-950 text-white border-blue-950"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Magazine as header
              </button>
              <button
                type="button"
                onClick={() => patch({ magazineHeaderMode: "normal_header_and_magazine_in_content" })}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  !magazineAsHeader
                    ? "bg-blue-950 text-white border-blue-950"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Normal header and magazine in content
              </button>
            </div>
          ) : null}

          {magazineAsHeader ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Header background"
                value={config.headerBackground}
                onChange={(value) => patch({ headerBackground: value })}
                options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
              <SelectField
                label="Header text color"
                value={config.headerTextColor}
                onChange={(value) => patch({ headerTextColor: value })}
                options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
              <TextField
                label="Header text"
                value={config.headerTextRight}
                onChange={(value) => patch({ headerTextRight: value })}
              />
              <SelectField
                label="Portal"
                value={config.magazinePortalId}
                onChange={(value) => patch({ magazinePortalId: value, magazineId: "", magazinePublicationId: "" })}
                options={portalOptions}
              />
              <SelectField
                label="Magazine"
                value={config.magazineId}
                onChange={(value) => patch({ magazineId: value, magazinePublicationId: "" })}
                options={magazineOptions}
              />
              <SelectField
                label="Publication"
                value={config.magazinePublicationId}
                onChange={(value) => patch({ magazinePublicationId: value })}
                options={publicationOptions}
              />
            </div>
          ) : null}

          {showNormalHeaderFields ? (
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
              <NewsletterRichTextField
                label="Header subtitle"
                labelClassName="block text-xs text-gray-500 uppercase mb-1"
                value={config.headerSubtitle}
                onChange={(value) => patch({ headerSubtitle: value })}
                minHeight="100px"
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Content</h3>

          {showMagazineContentBlock ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Magazine section background"
                value={config.magazineContentBackground}
                onChange={(value) => patch({ magazineContentBackground: value })}
                options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
              <SelectField
                label="Magazine section text color"
                value={config.magazineContentTextColor}
                onChange={(value) => patch({ magazineContentTextColor: value })}
                options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
              <SelectField
                label="Portal"
                value={config.magazinePortalId}
                onChange={(value) => patch({ magazinePortalId: value, magazineId: "", magazinePublicationId: "" })}
                options={portalOptions}
              />
              <SelectField
                label="Magazine"
                value={config.magazineId}
                onChange={(value) => patch({ magazineId: value, magazinePublicationId: "" })}
                options={magazineOptions}
              />
              <SelectField
                label="Publication"
                value={config.magazinePublicationId}
                onChange={(value) => patch({ magazinePublicationId: value })}
                options={publicationOptions}
              />
            </div>
          ) : null}

          {isMagazine ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Summary background"
                value={config.summaryBackground}
                onChange={(value) => patch({ summaryBackground: value })}
                options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
              <SelectField
                label="Summary text color"
                value={config.summaryTextColor}
                onChange={(value) => patch({ summaryTextColor: value })}
                options={COLOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
            </div>
          ) : null}

          {showArticleCardFields ? (
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
          ) : null}
        </section>

        <section className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Footer</h3>
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

      <NewsletterLayoutPreview
        config={config}
        publicationCoverUrl={selectedPublication?.publication_main_image_url || null}
        publicationTitle={selectedPublication?.publication_edition_name || ""}
        portalLabel={selectedPortal?.key || selectedPortal?.name || ""}
        magazineLabel={selectedMagazine?.name || ""}
      />
    </div>
  );
}
