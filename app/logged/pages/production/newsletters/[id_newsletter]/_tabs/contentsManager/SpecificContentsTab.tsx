"use client";

import React, { useMemo, useState } from "react";
import type { NewsletterContentBlock } from "@/app/contents/interfaces";
import { NewsletterService } from "@/app/service/NewsletterService";
import { mapBlocksToContentItems } from "../../../utils/newsletterLayoutModel";
import { AddContentsModal } from "./AddContentsModal";
import type { AddContentSelection } from "./addContentTypes";

type SpecificContentsTabProps = {
  newsletterId: string;
  blocks: NewsletterContentBlock[];
  onBlocksChange: (blocks: NewsletterContentBlock[]) => void;
};

function nextBlockId(newsletterId: string, index: number): string {
  return `nlb-${newsletterId}-${Date.now()}-${index}`;
}

function contentKindLabel(kind: string): string {
  if (kind === "banner") return "Banner";
  if (kind === "sponsored") return "Sponsored content";
  return "Article";
}

export function SpecificContentsTab({ newsletterId, blocks, onBlocksChange }: SpecificContentsTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentItems = useMemo(() => mapBlocksToContentItems(blocks), [blocks]);

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= contentItems.length) return;

    const orderedIds = contentItems.map((item) => item.id);
    const [moved] = orderedIds.splice(index, 1);
    orderedIds.splice(targetIndex, 0, moved);

    setSaving(true);
    setError(null);
    try {
      const updated = await NewsletterService.reorderNewsletterContentBlocks(newsletterId, orderedIds);
      onBlocksChange(updated);
    } catch (moveError: unknown) {
      setError(moveError instanceof Error ? moveError.message : "Failed to reorder contents");
    } finally {
      setSaving(false);
    }
  };

  const handleAddContent = async (selection: AddContentSelection) => {
    const startOrder = blocks.reduce((max, block) => Math.max(max, block.order), -1) + 1;

    let payload: Array<{
      id: string;
      blockType: "portal_article_preview" | "banner";
      order: number;
      data: Record<string, unknown>;
    }> = [];

    if (selection.kind === "banner") {
      const projectPath = `/logged/pages/account-management/projects/${selection.project.id_project}`;
      payload = [
        {
          id: nextBlockId(newsletterId, 0),
          blockType: "banner",
          order: startOrder,
          data: {
            imageSrc: selection.imageUrl,
            redirectUrl: projectPath,
            alt: selection.mediaName || selection.project.title,
            projectId: selection.project.id_project,
            projectTitle: selection.project.title,
            mediatecaContentId: selection.mediaId,
          },
        },
      ];
    } else {
      payload = selection.articles.map((article, index) => ({
        id: nextBlockId(newsletterId, index),
        blockType: "portal_article_preview" as const,
        order: startOrder + index,
        data: {
          title: article.articleTitle,
          briefing: article.articleSubtitle,
          imageSrc: article.article_main_image_url,
          link: `/logged/pages/network/contents/articles/${article.id_article}`,
          articleId: article.id_article,
          isSponsored: selection.kind === "sponsored",
          contentKind: selection.kind,
        },
      }));
    }

    if (payload.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await NewsletterService.createNewsletterContentBlocks(newsletterId, payload);
      onBlocksChange(updated);
    } catch (addError: unknown) {
      setError(addError instanceof Error ? addError.message : "Failed to add contents");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Specific contents</h3>
          <p className="text-sm text-gray-500">
            Manage articles, sponsored content, and banners in the order they appear in the newsletter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add contents
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {contentItems.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-lg bg-white p-4 ${
              item.kind === "sponsored"
                ? "border-2 border-amber-400 shadow-md"
                : "border border-gray-200"
            }`}
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => void moveItem(index, -1)}
                  disabled={saving || index === 0}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Move content up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => void moveItem(index, 1)}
                  disabled={saving || index === contentItems.length - 1}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Move content down"
                >
                  ↓
                </button>
              </div>

              {item.kind === "banner" ? (
                item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    className="h-20 w-40 rounded object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-20 w-40 rounded bg-gray-200" />
                )
              ) : item.imageSrc ? (
                <img src={item.imageSrc} alt="" className="h-20 w-20 rounded object-cover" />
              ) : (
                <div className="h-20 w-20 rounded bg-gray-200" />
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs uppercase text-gray-500">
                  Position {item.position} · {contentKindLabel(item.kind)}
                </p>
                <p className="text-sm font-semibold text-gray-900">{item.title || "Untitled content"}</p>
                <p className="text-sm text-gray-600">{item.subtitle || "No subtitle"}</p>
                {item.projectId ? (
                  <p className="text-xs text-gray-500">
                    Project: {item.projectTitle || item.projectId}
                  </p>
                ) : null}
                <p className="text-xs text-blue-700 break-all">{item.redirection || "No redirection"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {contentItems.length === 0 ? (
        <p className="text-sm text-gray-500">
          No specific contents yet. Use Add contents to include articles, sponsored content, or banners.
        </p>
      ) : null}

      <AddContentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(selection) => void handleAddContent(selection)}
      />
    </div>
  );
}
