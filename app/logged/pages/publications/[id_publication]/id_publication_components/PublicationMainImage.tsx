"use client";

import React, { FC } from "react";
import PencilSvg from "@/app/logged/logged_components/svg/PencilSvg";

interface PublicationMainImageProps {
  imageUrl: string;
  onEditMainImage: () => void;
}

const PublicationMainImage: FC<PublicationMainImageProps> = ({
  imageUrl,
  onEditMainImage,
}) => {
  return (
    <section className="relative w-full max-w-md">
      <div className="relative w-full h-64 bg-gray-200 rounded-lg shadow-md overflow-hidden">
        <img
          src={imageUrl && imageUrl.trim() !== "" 
            ? imageUrl 
            : "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
          alt="Publication main image"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") {
              target.src = "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
            }
          }}
        />
        <div className="absolute bottom-2 right-2 z-20 bg-white/80 rounded-full p-1 shadow-sm">
          <PencilSvg size="10" onClick={onEditMainImage} />
        </div>
      </div>
    </section>
  );
};

export default PublicationMainImage;

