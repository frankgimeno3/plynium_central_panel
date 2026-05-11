"use client";

import React from "react";
import type { NewsletterCampaignLayoutConfig } from "@/app/contents/newsletterCampaignLayout";
import { RichTextContent } from "@/app/logged/logged_components/RichTextEditor";
import type { NewsletterContentItem } from "../utils/newsletterLayoutModel";

const LOREM_SUMMARY_ITEMS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
  "Duis aute irure dolor in reprehenderit in voluptate velit.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa.",
];

type NewsletterComposedViewProps = {
  config: NewsletterCampaignLayoutConfig;
  contentItems: NewsletterContentItem[];
  publicationCoverUrl?: string | null;
  publicationTitle?: string;
  magazineLabel?: string;
  portalLabel?: string;
  framed?: boolean;
};

function CoverPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-40 w-32 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-100 px-2 text-center text-xs text-gray-500">
      {label}
    </div>
  );
}

export function NewsletterComposedView({
  config,
  contentItems,
  publicationCoverUrl = null,
  publicationTitle = "",
  magazineLabel = "",
  portalLabel = "",
  framed = true,
}: NewsletterComposedViewProps) {
  const isMagazine = config.newsletterType === "magazine";
  const magazineAsHeader = isMagazine && config.magazineHeaderMode === "magazine_as_header";
  const showNormalHeader = !isMagazine || config.magazineHeaderMode === "normal_header_and_magazine_in_content";
  const showMagazineInContent =
    isMagazine && config.magazineHeaderMode === "normal_header_and_magazine_in_content";
  const showArticleCards = config.newsletterType === "main" || config.newsletterType === "specific";

  const body = (
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
          <RichTextContent
            htmlOrPlain={config.headerSubtitle}
            className="mt-2 border-t border-white/20 pt-2 text-[11px]"
            as="p"
          />
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
          {contentItems.length > 0 ? (
            contentItems.map((item) => {
              if (item.kind === "banner") {
                return (
                  <a
                    key={item.id}
                    href={item.redirection || "#"}
                    className="block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    {item.imageSrc ? (
                      <img src={item.imageSrc} alt={item.title} className="h-32 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-gray-200 text-sm text-gray-500">
                        Banner
                      </div>
                    )}
                  </a>
                );
              }

              const cardClassName =
                item.kind === "sponsored"
                  ? "flex gap-3 rounded border-2 border-amber-400 bg-white p-3 shadow-md"
                  : "flex gap-3 rounded border border-gray-200 bg-white p-3";

              return (
                <div key={item.id} className={cardClassName}>
                  {item.imageSrc ? (
                    <img src={item.imageSrc} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-20 w-20 shrink-0 rounded bg-gray-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div style={{ fontFamily: config.titleFont, color: config.titleTextColor }}>
                      <RichTextContent
                        htmlOrPlain={item.title || "Untitled article"}
                        className="text-sm font-semibold"
                        as="p"
                      />
                    </div>
                    <div style={{ fontFamily: config.subtitleFont, color: config.subtitleTextColor }}>
                      <RichTextContent
                        htmlOrPlain={item.subtitle || "No subtitle"}
                        className="mt-1 text-xs leading-relaxed"
                        as="p"
                      />
                    </div>
                    <a
                      href={item.redirection || "#"}
                      className="mt-2 inline-block rounded px-2 py-1 text-[10px] font-semibold uppercase"
                      style={{ backgroundColor: config.buttonColor, color: config.buttonTextColor }}
                    >
                      Read more
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">No specific contents added yet.</p>
          )}
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
  );

  if (!framed) return body;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Newsletter HTML view</p>
      {body}
    </div>
  );
}
