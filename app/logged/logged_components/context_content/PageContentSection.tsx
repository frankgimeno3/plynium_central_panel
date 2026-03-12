"use client";

import { FC, ReactNode } from "react";

interface PageContentSectionProps {
  children: ReactNode;
  className?: string;
}

const PageContentSection: FC<PageContentSectionProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`px-12 text-slate-600 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default PageContentSection;
