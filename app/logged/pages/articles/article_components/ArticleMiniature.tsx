"use client"

import Link from "next/link";
import React, { FC, useState } from "react";
import ArticleImagePlaceholder from "./ArticleImagePlaceholder";

interface HighlightInfo {
  portalName: string;
  highlightPosition: string;
}

interface ArticleMiniatureProps {
  id_article: string;
  titulo: string;
  company: string;
  date: string;
  imageUrl: string;
  highlightByPortal?: HighlightInfo[];
}

const ArticleMiniature: FC<ArticleMiniatureProps> = ({
  id_article,
  titulo,
  company,
  date,
  imageUrl,
  highlightByPortal = [],
}) => {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imageUrl?.trim() || imgError;

  return (
    <Link href={`/logged/pages/articles/${id_article}`} className="flex flex-col shadow-xl cursor-pointer w-80 p-2 border-t border-gray-100 bg-gray-100/50 hover:bg-white h-96">
      <div className="h-56 overflow-hidden">
        {showPlaceholder ? (
          <ArticleImagePlaceholder className="w-full h-full" />
        ) : (
          <img
            src={imageUrl}
            alt={titulo}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="flex flex-col p-3">
        <p className="font-semibold line-clamp-2">{titulo}</p>

        <div className="flex flex-row justify-between text-sm pt-6">
          <p className="text-gray-400 italic">{date}</p>
          <p>{company}</p>
        </div>

        {highlightByPortal.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {highlightByPortal.map((h, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 bg-blue-950/15 text-blue-950 rounded"
              >
                {h.highlightPosition} · {h.portalName}
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-400 mt-3">ID: {id_article}</p>
      </div>
    </Link>
  );
};

export default ArticleMiniature;
