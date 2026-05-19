"use client";

import React, { FC } from "react";
import type { ArticleBuilderTab } from "../../articleBuilderNavigation";

type ArticleBuilderMainTabsProps = {
  mainTab: ArticleBuilderTab;
  onSelectGeneral: () => void;
  onSelectEditor: () => void;
};

export const ArticleBuilderMainTabs: FC<ArticleBuilderMainTabsProps> = ({
  mainTab,
  onSelectGeneral,
  onSelectEditor,
}) => (
  <div className="flex border-b border-gray-200">
    <button
      type="button"
      onClick={onSelectGeneral}
      className={`px-5 py-3 text-sm font-medium transition-colors ${
        mainTab === "general"
          ? "border-b-2 border-blue-700 text-blue-950"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      Article general data
    </button>
    <button
      type="button"
      onClick={onSelectEditor}
      className={`px-5 py-3 text-sm font-medium transition-colors ${
        mainTab === "editor"
          ? "border-b-2 border-blue-700 text-blue-950"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      Article editor
    </button>
  </div>
);
