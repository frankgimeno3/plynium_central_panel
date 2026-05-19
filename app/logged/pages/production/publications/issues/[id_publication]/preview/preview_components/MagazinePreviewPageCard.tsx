"use client";

import React, { FC } from "react";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import type { PublicationArticleChunk as PreviewPublicationArticleChunk } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import { FlatplanAdvertMediaThumbnail } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanAdvertMediaThumbnail";
import {
    buildArticleFlowPagesFromPublicationSlots,
    type FlowPublicationArticleChunk,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import { normalizeMagazinePageLayout } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";
import {
    normalizeSlotContentType,
    type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

/** Page aspect for the magazine preview (228×297 mm portrait). */
const PAGE_ASPECT = "228 / 297";

/** Pick the URL that should fill the page (cover composite, advert media, summary/index PDF). */
function previewMediaUrl(slot: SlotRow): string {
    const contentType = normalizeSlotContentType(slot.slot_content_type);
    if (contentType === "summary") {
        return String(slot.flatplan_summary_pdf_url ?? "").trim();
    }
    if (contentType === "index") {
        return String(slot.flatplan_index_pdf_url ?? "").trim();
    }
    const slotKey = String(slot.slot_key ?? "").trim().toLowerCase();
    if (slotKey === "cover") {
        const composite = String(slot.flatplan_cover_composite_url ?? "").trim();
        if (composite) return composite;
    }
    return String(slot.slot_media_url ?? "").trim();
}

function badgeLabelForSlot(slot: SlotRow): string {
    const contentType = normalizeSlotContentType(slot.slot_content_type);
    if (contentType === "summary") return "Summary";
    if (contentType === "index") return "Advertiser index";
    if (contentType === "article") return "Article";
    if (contentType === "advert") return "Advert";
    return String(slot.slot_content_type ?? "").trim() || "Page";
}

type MagazinePreviewPageCardProps = {
    slot: SlotRow | null;
    /** Position label rendered as the page footer (publication_page or "0"/"end"). */
    pageLabel: string | null;
    /** Whether this page renders on the left side of the spread. */
    isLeftPage: boolean;
};

/**
 * Single magazine page rendered at full preview size. Reuses the same thumbnail
 * primitives the flatplan tiles use (advert image / PDF / article body) but
 * fills the entire 228×297 page without the flatplan tile decorations.
 */
export const MagazinePreviewPageCard: FC<MagazinePreviewPageCardProps> = ({
    slot,
    pageLabel,
    isLeftPage,
}) => {
    const cardClass =
        "relative flex w-full max-w-[min(46vw,40rem)] min-w-[16rem] flex-col overflow-hidden rounded-md border border-gray-300 bg-white shadow-2xl";
    const cardStyle: React.CSSProperties = { aspectRatio: PAGE_ASPECT };

    if (!slot) {
        return (
            <div className={`${cardClass} items-center justify-center bg-gray-50`} style={cardStyle} aria-hidden>
                <span className="text-xs uppercase tracking-wider text-gray-300">Blank</span>
            </div>
        );
    }

    const contentType = normalizeSlotContentType(slot.slot_content_type);
    const mediaUrl = previewMediaUrl(slot);
    const articleChunks =
        contentType === "article" && Array.isArray(slot.flatplan_preview_chunks)
            ? (slot.flatplan_preview_chunks as FlowPublicationArticleChunk[])
            : [];

    if (articleChunks.length > 0) {
        const pageIndex = slot.flatplan_article_page_index ?? 1;
        const pageFormat = normalizeMagazinePageLayout(slot.magazine_page_layout);
        const articleFlowPages = buildArticleFlowPagesFromPublicationSlots(
            [{ publication_slot_id: slot.publication_slot_id }],
            articleChunks
        );
        return (
            <div className={cardClass} style={cardStyle}>
                <div className="absolute inset-0">
                    <ArticleSubpagePagePreview
                        hideHeading
                        chunks={articleChunks as unknown as PreviewPublicationArticleChunk[]}
                        pageIndex={pageIndex}
                        isLeftPage={isLeftPage}
                        publicationPage={
                            Number.isFinite(Number(slot.publication_page))
                                ? Math.round(Number(slot.publication_page))
                                : null
                        }
                        pageFormat={pageFormat}
                        articleFlowPages={articleFlowPages}
                        currentSlotContentId={slot.publication_slot_id}
                    />
                </div>
            </div>
        );
    }

    if (mediaUrl) {
        return (
            <div className={cardClass} style={cardStyle}>
                <FlatplanAdvertMediaThumbnail
                    url={mediaUrl}
                    className="absolute inset-0 h-full w-full object-contain"
                />
                {pageLabel ? (
                    <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                        {pageLabel}
                    </div>
                ) : null}
            </div>
        );
    }

    return (
        <div className={`${cardClass} items-stretch`} style={cardStyle}>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-gray-50 px-4 py-6 text-center">
                <span className="rounded-sm border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                    {badgeLabelForSlot(slot)}
                </span>
                <span className="text-[11px] text-gray-500">No materials uploaded yet</span>
            </div>
            {pageLabel ? (
                <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                    {pageLabel}
                </div>
            ) : null}
        </div>
    );
};
