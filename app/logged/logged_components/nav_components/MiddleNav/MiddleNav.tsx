"use client";

import { FC } from "react";
import MiddleNavBreadcrumbs from "./nav_middle_components/MiddleNavBreadcrumbs";
import MiddleNavTitle from "./nav_middle_components/MiddleNavTitle";
import type { BreadcrumbItem, MiddleNavProps } from "./nav_middle_components/types";

export type { BreadcrumbItem };

const MiddleNav: FC<MiddleNavProps> = ({ pageTitle, breadcrumbs }) => (
  <div className="flex flex-row items-center justify-between bg-gradient-to-r from-zinc-700 to-gray-800 px-4 py-2.5 text-white md:px-6">
    <MiddleNavTitle pageTitle={pageTitle} />
    <MiddleNavBreadcrumbs breadcrumbs={breadcrumbs} />
  </div>
);

export default MiddleNav;
