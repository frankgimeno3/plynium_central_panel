"use client";

import React, { FC } from "react";
import { ArticleBuilderFlatplanNameField } from "../../ArticleBuilderFlatplanNameField";
import { ArticleBuilderWorkflowStateSection } from "../../ArticleBuilderWorkflowStateSection";
import { PortalOriginalArticlePanel } from "../../PortalOriginalArticlePanel";
import { ArticleSubpagePageFormatSection } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePageFormatSection";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import type { ArticleBuilderGeneralSection } from "../../articleBuilderNavigation";
import type { ArticleMeta, PublicationArticleRow } from "../types";
import { ArticleBuilderPagesManagerTab, type ArticleBuilderPagesManagerTabProps } from "./ArticleBuilderPagesManagerTab";

type ArticleBuilderGeneralDataTabProps = {
  publicationArticle: PublicationArticleRow;
  articleMeta: ArticleMeta | null;
  generalSection: ArticleBuilderGeneralSection;
  magazinePageLayout: MagazinePageLayout;
  pageFormatSaving: boolean;
  portalArticleIdForOriginalTab: string | null;
  onStateChange: (next: string) => void;
  onPageFormatChange: (formatId: string) => void;
  onSelectPagesManager: () => void;
  onSelectOriginal: () => void;
  pagesManagerProps: ArticleBuilderPagesManagerTabProps;
  articleStateSaving: boolean;
  flatplanNameSaving: boolean;
  onFlatplanNameSave: (next: string) => void | Promise<void>;
};

export const ArticleBuilderGeneralDataTab: FC<ArticleBuilderGeneralDataTabProps> = ({
  publicationArticle,
  articleMeta,
  generalSection,
  magazinePageLayout,
  pageFormatSaving,
  portalArticleIdForOriginalTab,
  onStateChange,
  onPageFormatChange,
  onSelectPagesManager,
  onSelectOriginal,
  pagesManagerProps,
  articleStateSaving,
  flatplanNameSaving,
  onFlatplanNameSave,
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

    <div className="flex border-b border-gray-200">
      <button
        type="button"
        onClick={onSelectPagesManager}
        className={`px-5 py-3 text-sm font-medium transition-colors ${
          generalSection === "pages-manager"
            ? "border-b-2 border-blue-700 text-blue-950"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        Article Pages Manager
      </button>
      <button
        type="button"
        onClick={onSelectOriginal}
        className={`px-5 py-3 text-sm font-medium transition-colors ${
          generalSection === "original"
            ? "border-b-2 border-blue-700 text-blue-950"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        Original Article
      </button>
    </div>

    {generalSection === "original" ? (
      <PortalOriginalArticlePanel
        active={generalSection === "original"}
        portalArticleId={portalArticleIdForOriginalTab}
      />
    ) : null}

    {generalSection === "pages-manager" ? (
      <ArticleBuilderPagesManagerTab {...pagesManagerProps} />
    ) : null}
  </>
);
