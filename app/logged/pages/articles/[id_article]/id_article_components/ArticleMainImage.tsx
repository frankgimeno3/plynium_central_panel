"use client";

import React, { FC, useState } from "react";
import PencilSvg from "@/app/logged/logged_components/svg/PencilSvg";
import ArticleImagePlaceholder from "../../article_components/ArticleImagePlaceholder";

interface ArticleMainImageProps {
  imageUrl: string;
  onEditMainImage: () => void;
}

const ArticleMainImage: FC<ArticleMainImageProps> = ({
  imageUrl,
  onEditMainImage,
}) => {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !imageUrl?.trim() || imgError;

  return (
    <section className="relative w-full min-h-[12.5rem]">
      {showPlaceholder ? (
        <ArticleImagePlaceholder className="w-full min-h-50 rounded-lg" />
      ) : (
        <img
          src={imageUrl}
          alt="Article main image"
          className="min-h-50 w-full rounded-lg shadow-md text-right text-xs object-cover"
          onError={() => setImgError(true)}
        />
      )}
      <div className="absolute bottom-2 right-2 z-20">
        <PencilSvg size="10" onClick={onEditMainImage} />
      </div>
    </section>
  );
};

export default ArticleMainImage;
