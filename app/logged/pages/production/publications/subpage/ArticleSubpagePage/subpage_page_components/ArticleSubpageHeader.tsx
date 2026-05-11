import React, { FC } from "react";

type ArticleSubpageHeaderProps = {
  articleId: string;
  slotId: number;
  pageIndex: number;
};

export const ArticleSubpageHeader: FC<ArticleSubpageHeaderProps> = ({
  articleId,
  slotId,
  pageIndex,
}) => {
  return (
    <header className="flex items-baseline justify-between gap-4">
      <div>
        <p className="text-xs text-gray-500">
          {articleId} · slot #{slotId}
        </p>
        <h1 className="text-xl font-semibold text-gray-900">Page {pageIndex || "?"}</h1>
      </div>
    </header>
  );
};
