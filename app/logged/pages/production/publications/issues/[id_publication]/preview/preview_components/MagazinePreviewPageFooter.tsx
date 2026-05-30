"use client";

import React, { FC } from "react";

type MagazinePreviewPageFooterProps = {
  isLeftPage: boolean;
  pageNumber: string;
};

/** Black magazine footer bar with the issue page number (preferential 1–9, editorial 10+). */
export const MagazinePreviewPageFooter: FC<MagazinePreviewPageFooterProps> = ({
  isLeftPage,
  pageNumber,
}) => {
  const numberEl = (
    <span className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">{pageNumber}</span>
  );

  return (
    <footer className="flex h-[8%] min-h-[1.75rem] shrink-0 items-center justify-between bg-black px-4 py-1.5 text-white sm:px-6 sm:py-2">
      {isLeftPage ? (
        <>
          {numberEl}
          <span aria-hidden="true" />
        </>
      ) : (
        <>
          <span aria-hidden="true" />
          {numberEl}
        </>
      )}
    </footer>
  );
};
