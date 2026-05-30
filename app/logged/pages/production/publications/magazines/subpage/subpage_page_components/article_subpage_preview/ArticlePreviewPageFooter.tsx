"use client";

import React, { FC } from "react";

export const ArticlePreviewPageFooter: FC<{
  isLeftPage: boolean;
  footerNumber: string | null;
}> = ({ isLeftPage, footerNumber }) => {
  const links = (
    <div className="flex flex-col text-right text-xl leading-snug text-amber-300">
      <span>Go to contents</span>
      <span>Go to advertiser index</span>
    </div>
  );

  const numberEl = footerNumber ? (
    <span className="text-3xl font-semibold tabular-nums text-white">{footerNumber}</span>
  ) : (
    <span aria-hidden="true" />
  );

  return (
    <footer className="flex h-[8%] shrink-0 items-center justify-between bg-black px-6 py-2 text-white">
      {isLeftPage ? (
        <>
          {numberEl}
          {links}
        </>
      ) : (
        <>
          {links}
          {numberEl}
        </>
      )}
    </footer>
  );
};
