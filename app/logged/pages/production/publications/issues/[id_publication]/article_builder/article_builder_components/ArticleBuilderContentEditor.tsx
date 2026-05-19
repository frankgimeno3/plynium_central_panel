"use client";

import React, { FC } from "react";
import { ArticleSubpageChunkHtmlEditor } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpageChunkHtmlEditor";
import { ArticleBuilderPagedBodyRichTextEditor } from "./ArticleBuilderPagedBodyRichTextEditor";
import type { MagazinePageLayout } from "./magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "./magazineArticleColumnFlow";

type ArticleBuilderContentEditorProps = {
  titleHtml: string;
  subtitleHtml: string;
  bodyHtml: string;
  savingField: "title" | "subtitle" | "content" | null;
  articleFlowPages: MagazineArticleFlowPageInput[];
  pageFormat: MagazinePageLayout;
  onTitleChange: (html: string) => void;
  onSubtitleChange: (html: string) => void;
  onBodyChange: (html: string) => void;
  /** Trash icon on an empty article-page zone clicked. */
  onRequestDeleteEmptyPage?: (slotId: number, pageIndex: number) => void;
};

function ContentCard({
  label,
  children,
  saving,
}: {
  label: string;
  children: React.ReactNode;
  saving?: boolean;
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

export const ArticleBuilderContentEditor: FC<ArticleBuilderContentEditorProps> = ({
  titleHtml,
  subtitleHtml,
  bodyHtml,
  savingField,
  articleFlowPages,
  pageFormat,
  onTitleChange,
  onSubtitleChange,
  onBodyChange,
  onRequestDeleteEmptyPage,
}) => {
  const multiPage = articleFlowPages.length > 1;
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-base font-semibold text-gray-900">Content editor</h2>
        <p className="mt-1 text-xs text-gray-600">
          Title and subtitle apply to the whole article. Body text is one flow;{" "}
          {multiPage
            ? "colored sections show which part lands on each article page (same rules as the preview)."
            : "it is split into column chunks automatically when you save."}
        </p>
      </header>

      <h3 className="text-sm font-semibold text-gray-800">Content on this article</h3>

      <ContentCard label="Title" saving={savingField === "title"}>
        <ArticleSubpageChunkHtmlEditor
          chunkFormat="title"
          chunkHtml={titleHtml}
          onHtmlChange={onTitleChange}
        />
      </ContentCard>

      <ContentCard label="Subtitle" saving={savingField === "subtitle"}>
        <ArticleSubpageChunkHtmlEditor
          chunkFormat="subtitle"
          chunkHtml={subtitleHtml}
          onHtmlChange={onSubtitleChange}
        />
      </ContentCard>

      <ContentCard label="Content" saving={savingField === "content"}>
        <div className="mt-2 min-w-0">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500">
            Text
          </label>
          <ArticleBuilderPagedBodyRichTextEditor
            value={bodyHtml}
            onChange={onBodyChange}
            articleFlowPages={articleFlowPages}
            pageFormat={pageFormat}
            minHeight="200px"
            placeholder="Write body text…"
            className="min-w-0"
            onRequestDeleteEmptyPage={onRequestDeleteEmptyPage}
          />
        </div>
      </ContentCard>
    </div>
  );
};
