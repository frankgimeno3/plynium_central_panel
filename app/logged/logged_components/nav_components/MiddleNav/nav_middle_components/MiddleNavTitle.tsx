"use client";

import { FC } from "react";

type MiddleNavTitleProps = {
  pageTitle: string;
};

const MiddleNavTitle: FC<MiddleNavTitleProps> = ({ pageTitle }) => (
  <p className="text-sm font-semibold uppercase text-zinc-100 md:text-base" aria-label="Main navigation">
    {pageTitle}
  </p>
);

export default MiddleNavTitle;
