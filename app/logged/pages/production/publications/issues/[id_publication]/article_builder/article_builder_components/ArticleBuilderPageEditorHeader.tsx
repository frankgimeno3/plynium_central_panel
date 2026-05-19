import React, { FC } from "react";

type ArticleBuilderPageEditorHeaderProps = {
  publicationLabel: string;
  publicationPage: number | null;
  slotId: number;
  articleId: string;
  pageIndexInArticle: number;
  totalArticlePages: number;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
};

export const ArticleBuilderPageEditorHeader: FC<ArticleBuilderPageEditorHeaderProps> = ({
  publicationLabel,
  publicationPage,
  slotId,
  articleId,
  pageIndexInArticle,
  totalArticlePages,
  canNavigatePrev,
  canNavigateNext,
  onNavigatePrev,
  onNavigateNext,
}) => {
  const pagePart =
    pageIndexInArticle > 0 && totalArticlePages > 0
      ? `${pageIndexInArticle}/${totalArticlePages}`
      : "—";

  const pageLine = (
    <>
      {publicationLabel ? <span>{publicationLabel}</span> : null}
      {publicationPage != null ? (
        <>
          {publicationLabel ? <span className="text-gray-400"> · </span> : null}
          <span>Publication page {publicationPage}</span>
        </>
      ) : (
        <>
          {publicationLabel ? <span className="text-gray-400"> · </span> : null}
          <span className="text-amber-700">Slot #{slotId} (publication page unavailable)</span>
        </>
      )}
    </>
  );

  const navBtnClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-300";

  return (
    <header className="flex items-center gap-3">
      <button
        type="button"
        className={navBtnClass}
        aria-label="Previous page"
        disabled={!canNavigatePrev}
        onClick={onNavigatePrev}
      >
        <span aria-hidden className="text-lg leading-none">
          ←
        </span>
      </button>

      <div className="min-w-0 flex-1 text-center">
        <p className="text-xs text-gray-500">{pageLine}</p>
        <h1 className="text-xl font-semibold text-gray-900">
          article {articleId} – page {pagePart}
        </h1>
      </div>

      <button
        type="button"
        className={navBtnClass}
        aria-label="Next page"
        disabled={!canNavigateNext}
        onClick={onNavigateNext}
      >
        <span aria-hidden className="text-lg leading-none">
          →
        </span>
      </button>
    </header>
  );
};
