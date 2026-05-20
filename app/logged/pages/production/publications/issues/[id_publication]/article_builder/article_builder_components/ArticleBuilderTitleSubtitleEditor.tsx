"use client";

import React, { FC } from "react";
import { ArticleSubpageChunkHtmlEditor } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpageChunkHtmlEditor";
import { useArticleHeadingsSave } from "./useArticleHeadingsSave";
import type { MagazineArticleFlowPageInput } from "./magazineArticleColumnFlow";
import type { PublicationArticleChunk } from "./article_builder_page/types";

type ArticleBuilderTitleSubtitleEditorProps = {
  publicationArticleId: string;
  chunks: PublicationArticleChunk[];
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  articleFlowPages: MagazineArticleFlowPageInput[];
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
};

function HeadingCard({
  label,
  saving,
  children,
}: {
  label: string;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        {saving ? (
          <span className="text-[10px] font-medium text-blue-600">Saving…</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Title + subtitle inline editors used on the Article general data tab. Saves
 * via the shared `useArticleHeadingsSave` hook.
 */
export const ArticleBuilderTitleSubtitleEditor: FC<ArticleBuilderTitleSubtitleEditorProps> = ({
  publicationArticleId,
  chunks,
  setChunks,
  articleFlowPages,
  onSaveMessage,
  onSaveError,
}) => {
  const { titleHtml, subtitleHtml, savingField, scheduleTitleChange, scheduleSubtitleChange } =
    useArticleHeadingsSave({
      publicationArticleId,
      chunks,
      articleFlowPages,
      setChunks,
      onSaveMessage,
      onSaveError,
    });

  return (
    <div className="space-y-4">
      <HeadingCard label="Title" saving={savingField === "title"}>
        <ArticleSubpageChunkHtmlEditor
          chunkFormat="title"
          chunkHtml={titleHtml}
          onHtmlChange={scheduleTitleChange}
        />
      </HeadingCard>

      <HeadingCard label="Subtitle" saving={savingField === "subtitle"}>
        <ArticleSubpageChunkHtmlEditor
          chunkFormat="subtitle"
          chunkHtml={subtitleHtml}
          onHtmlChange={scheduleSubtitleChange}
        />
      </HeadingCard>
    </div>
  );
};
