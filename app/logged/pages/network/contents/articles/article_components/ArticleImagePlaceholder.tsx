"use client";

import React, { FC } from "react";

interface ArticleImagePlaceholderProps {
  className?: string;
}

const ArticleImagePlaceholder: FC<ArticleImagePlaceholderProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-gray-300 text-gray-500 ${className}`}
      aria-label="No image"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-1/3 h-1/3 max-w-24 max-h-24"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
};

export default ArticleImagePlaceholder;
