"use client";

import React, { FC } from "react";
import { ArticleBuilderFlatplanNameField } from "../../ArticleBuilderFlatplanNameField";
import { ArticleBuilderWorkflowStateSection } from "../../ArticleBuilderWorkflowStateSection";
import { ArticleBuilderTitleSubtitleEditor } from "../../ArticleBuilderTitleSubtitleEditor";
import { ArticleSubpagePageFormatSection } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePageFormatSection";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "../../magazineArticleColumnFlow";
import type { ArticleMeta, PublicationArticleChunk, PublicationArticleRow } from "../types";

type ArticleBuilderGeneralDataTabProps = {
  publicationArticle: PublicationArticleRow;
  articleMeta: ArticleMeta | null;
  magazinePageLayout: MagazinePageLayout;
  pageFormatSaving: boolean;
  onStateChange: (next: string) => void;
  onPageFormatChange: (formatId: string) => void;
  articleStateSaving: boolean;
  flatplanNameSaving: boolean;
  onFlatplanNameSave: (next: string) => void | Promise<void>;
  chunks: PublicationArticleChunk[];
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  articleFlowPages: MagazineArticleFlowPageInput[];
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
};

export const ArticleBuilderGeneralDataTab: FC<ArticleBuilderGeneralDataTabProps> = ({
  publicationArticle,
  articleMeta,
  magazinePageLayout,
  pageFormatSaving,
  onStateChange,
  onPageFormatChange,
  articleStateSaving,
  flatplanNameSaving,
  onFlatplanNameSave,
  chunks,
  setChunks,
  articleFlowPages,
  onSaveMessage,
  onSaveError,
}) => (
  <>
    <header className="flex items-start gap-4">
      {articleMeta?.article_main_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={articleMeta.article_main_image_url}
          alt={articleMeta.article_title}
          className="h-20 w-32 rounded-md border border-gray-200 object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-gray-500">{publicationArticle.article_id}</p>
        <h1 className="text-xl font-semibold text-gray-900">
          {articleMeta?.article_title || publicationArticle.article_id}
        </h1>
        {articleMeta?.article_subtitle ? (
          <p className="text-sm text-gray-600">{articleMeta.article_subtitle}</p>
        ) : null}
        <ArticleBuilderFlatplanNameField
          value={publicationArticle.publication_art_name}
          saving={flatplanNameSaving}
          onSave={onFlatplanNameSave}
        />
      </div>
    </header>

    <ArticleBuilderWorkflowStateSection
      publicationArticleState={publicationArticle.publication_article_state}
      articleStateSaving={articleStateSaving}
      onStateChange={onStateChange}
    />

    <ArticleSubpagePageFormatSection
      pageFormatDraft={magazinePageLayout}
      onPageFormatChange={onPageFormatChange}
    />
    {pageFormatSaving ? (
      <p className="text-[10px] text-blue-600">Saving article page format…</p>
    ) : null}

    <ArticleBuilderTitleSubtitleEditor
      publicationArticleId={publicationArticle.publication_article_id}
      chunks={chunks}
      setChunks={setChunks}
      articleFlowPages={articleFlowPages}
      onSaveMessage={onSaveMessage}
      onSaveError={onSaveError}
    />
  </>
);
