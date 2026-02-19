"use client";

import React, { FC } from "react";
import PencilSvg from "@/app/logged/logged_components/svg/PencilSvg";

interface ArticleHeaderProps {
  title: string;
  subtitle: string;
  onEditTitle: () => void;
  onEditSubtitle: () => void;
}

const ArticleHeader: FC<ArticleHeaderProps> = ({
  title,
  subtitle,
  onEditTitle,
  onEditSubtitle,
}) => {
  // Asegurar que title y subtitle siempre sean strings
  const safeTitle = title ?? "";
  const safeSubtitle = subtitle ?? "";
  
  return (
    <div className="flex flex-col gap-3">
    {/* Título con Pencil */}
    <div className="relative flex flex-row">
      <h1 className="text-4xl font-bold">{safeTitle}</h1>
      <div className="absolute bottom-0 right-[-35px]">
        <PencilSvg size="10" onClick={onEditTitle} />
      </div>
    </div>

    {/* Subtítulo con Pencil */}
    <div className="relative flex flex-row">
      <h2 className="text-xl text-gray-500">{safeSubtitle}</h2>
      <div className="absolute bottom-0 right-[-25px]">
        <PencilSvg size="10" onClick={onEditSubtitle} />
      </div>
    </div>
  </div>
  );
};

export default ArticleHeader;
