import React, { FC } from "react";

type ArticleSubpageHeaderProps = {
  /** Magazine publication display name (edition), or publication id fallback. */
  publicationLabel: string;
  /** `publication_slots_db.publication_page` for this slot. */
  publicationPage: number | null;
  slotId: number;
  articleId: string;
  /** 1-based index of this slot within the article page list; 0 if unknown. */
  pageIndexInArticle: number;
  totalArticlePages: number;
};

export const ArticleSubpageHeader: FC<ArticleSubpageHeaderProps> = ({
  publicationLabel,
  publicationPage,
  slotId,
  articleId,
  pageIndexInArticle,
  totalArticlePages,
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

  return (
    <header className="flex items-baseline justify-between gap-4">
      <div>
        <p className="text-xs text-gray-500">{pageLine}</p>
        <h1 className="text-xl font-semibold text-gray-900">
          article {articleId} – page {pagePart}
        </h1>
      </div>
    </header>
  );
};
