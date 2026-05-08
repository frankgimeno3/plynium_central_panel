"use client";

import { FC, ReactNode } from "react";

interface PageContentSectionProps {
  children: ReactNode;
  className?: string;
}

const PageContentSection: FC<PageContentSectionProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`px-4 text-slate-600 md:px-6 lg:px-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default PageContentSection;
