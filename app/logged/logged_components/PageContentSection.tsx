"use client";

import { FC, ReactNode } from "react";

interface PageContentSectionProps {
  children: ReactNode;
  className?: string;
}

const PageContentSection: FC<PageContentSectionProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow p-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default PageContentSection;
