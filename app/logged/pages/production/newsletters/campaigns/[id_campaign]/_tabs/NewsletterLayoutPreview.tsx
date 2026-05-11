"use client";

import React from "react";
import type { LayoutDesignerConfig } from "../_layout/layoutDesignerTypes";

const LOREM_TITLE = "Lorem ipsum dolor sit amet";
const LOREM_SUBTITLE =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const LOREM_SUMMARY_ITEMS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
  "Duis aute irure dolor in reprehenderit in voluptate velit.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa.",
];

type NewsletterLayoutPreviewProps = {
  config: LayoutDesignerConfig;
  publicationCoverUrl: string | null;
  publicationTitle: string;
  portalLabel: string;
  magazineLabel: string;
};

function CoverPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-40 w-32 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-100 px-2 text-center text-xs text-gray-500">
      {label}
    </div>
  );
}

export function NewsletterLayoutPreview({
  config,
  publicationCoverUrl,
  publicationTitle,
  portalLabel,
  magazineLabel,
}: NewsletterLayoutPreviewProps) {
  const isMagazine = config.newsletterType === "magazine";
  const magazineAsHeader = isMagazine && config.magazineHeaderMode === "magazine_as_header";
  const showNormalHeader = !isMagazine || config.magazineHeaderMode === "normal_header_and_magazine_in_content";
  const showMagazineInContent =
    isMagazine && config.magazineHeaderMode === "normal_header_and_magazine_in_content";
  const showArticleCards = config.newsletterType === "main" || config.newsletterType === "specific";

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Live preview</p>
      <div className="mx-auto max-w-[420px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        {magazineAsHeader ? (
          <div className="px-4 py-5 text-center" style={{ backgroundColor: config.headerBackground }}>
            <p className="text-lg font-bold uppercase" style={{ color: config.headerTextColor }}>
              {config.headerTextRight || "Read now"}
            </p>
            <div className="mt-4 flex justify-center">
              {publicationCoverUrl ? (
                <img
                  src={publicationCoverUrl}
                  alt={publicationTitle || "Magazine cover"}
                  className="h-48 w-36 rounded object-cover shadow-md"
                />
              ) : (
                <CoverPlaceholder label={publicationTitle || magazineLabel || "Magazine cover"} />
              )}
            </div>
          </div>
        ) : null}

        {showNormalHeader ? (
          <div className="px-4 py-4" style={{ backgroundColor: config.headerBackground, color: config.headerTextColor }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{config.headerLogoLabel}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">{config.headerTextRight}</span>
            </div>
            <p className="mt-2 border-t border-white/20 pt-2 text-[11px]">{config.headerSubtitle}</p>
          </div>
        ) : null}

        {showMagazineInContent ? (
          <div className="px-4 py-4" style={{ backgroundColor: config.magazineContentBackground }}>
            <p className="text-sm font-semibold" style={{ color: config.magazineContentTextColor }}>
              {publicationTitle || magazineLabel || "Selected publication"}
            </p>
            <div className="mt-3 flex justify-center">
              {publicationCoverUrl ? (
                <img
                  src={publicationCoverUrl}
                  alt={publicationTitle || "Publication cover"}
                  className="h-44 w-32 rounded object-cover shadow"
                />
              ) : (
                <CoverPlaceholder label={publicationTitle || "Publication cover"} />
              )}
            </div>
          </div>
        ) : null}

        {isMagazine ? (
          <div className="px-4 py-4" style={{ backgroundColor: config.summaryBackground }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold uppercase" style={{ color: config.summaryTextColor }}>
                Summary {magazineLabel || portalLabel}
              </p>
              <span className="text-xs text-blue-700">View online</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs" style={{ color: config.summaryTextColor }}>
              {LOREM_SUMMARY_ITEMS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showArticleCards ? (
          <div className="space-y-3 px-4 py-4" style={{ backgroundColor: config.contentSectionBackground }}>
            {[1, 2].map((index) => (
              <div key={index} className="flex gap-3 rounded border border-gray-200 bg-white p-3">
                <div className="h-20 w-20 shrink-0 rounded bg-gray-200" />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: config.titleFont, color: config.titleTextColor }}
                  >
                    {LOREM_TITLE}
                  </p>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ fontFamily: config.subtitleFont, color: config.subtitleTextColor }}
                  >
                    {LOREM_SUBTITLE}
                  </p>
                  <span
                    className="mt-2 inline-block rounded px-2 py-1 text-[10px] font-semibold uppercase"
                    style={{ backgroundColor: config.buttonColor, color: config.buttonTextColor }}
                  >
                    Read more
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="px-4 py-4 text-xs" style={{ backgroundColor: config.footerColor, color: config.footerTextColor }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-semibold">Follow us</p>
              <p className="mt-1 break-all">{config.footerLinkedinLink}</p>
              <p className="mt-2">{config.footerWebsite}</p>
            </div>
            <div>
              <p>{config.footerContactEmail}</p>
              <p className="mt-1">{config.footerContactPhone}</p>
            </div>
          </div>
          <p className="mt-3 border-t border-white/20 pt-2 text-[10px]">
            To unsubscribe, email {config.footerUnsubscribeEmail}
          </p>
        </div>
      </div>
    </div>
  );
}
