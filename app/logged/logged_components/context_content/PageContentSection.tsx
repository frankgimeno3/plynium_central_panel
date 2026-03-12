"use client";

import { FC, ReactNode } from "react";

interface PageContentSectionProps {
  children: ReactNode;
  className?: string;
}

const PageContentSection: FC<PageContentSectionProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-slate-800/80 rounded-lg border border-slate-600 shadow p-6 text-slate-200 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default PageContentSection;
