"use client";

import React, { FC } from "react";
import PencilSvg from "@/app/logged/logged_components/svg/PencilSvg";
import { RichTextContent } from "@/app/logged/logged_components/RichTextEditor";

interface ContentRendererProps {
  contentId: string;
  contentType: string;
  contentContent: any;
  onEditField: (args: {
    contentId: string;
    field: "center" | "left" | "right";
    value: string;
    isImage?: boolean;
  }) => void;
}

const ContentRenderer: FC<ContentRendererProps> = ({
  contentId,
  contentType,
  contentContent,
  onEditField,
}) => {
  // === JUST TEXT ===
  if (contentType === "just_text") {
    const textValue: string = contentContent?.center ?? "";

    const handleEditText = () => {
      onEditField({
        contentId,
        field: "center",
        value: textValue,
        isImage: false,
      });
    };

    return (
      <div className="relative flex w-full justify-center">
        <RichTextContent
          htmlOrPlain={textValue}
          className="max-w-2xl article-content-display"
          as="div"
        />
        <div className="absolute bottom-1 right-1 z-20">
          <PencilSvg size="10" onClick={handleEditText} />
        </div>
      </div>
    );
  }

  // === JUST IMAGE ===
  if (contentType === "just_image") {
    const imageUrl: string = contentContent?.center ?? "";

    const handleEditImage = () => {
      onEditField({
        contentId,
        field: "center",
        value: imageUrl,
        isImage: true,
      });
    };

    return (
      <div className="relative flex w-full justify-center">
        <img
          src={imageUrl}
          alt="content image"
          className="w-full max-w-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://source.unsplash.com/800x600/?nature";
          }}
        />
        <div className="absolute bottom-1 right-1 z-20">
          <PencilSvg size="10" onClick={handleEditImage} />
        </div>
      </div>
    );
  }

  // === TEXT + IMAGE ===
  if (contentType === "text_image") {
    const leftText: string = contentContent?.left ?? "";
    const rightImageUrl: string = contentContent?.right ?? "";

    const handleEditLeftText = () => {
      onEditField({
        contentId,
        field: "left",
        value: leftText,
        isImage: false,
      });
    };

    const handleEditRightImage = () => {
      onEditField({
        contentId,
        field: "right",
        value: rightImageUrl,
        isImage: true,
      });
    };

    return (
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
        {/* LEFT TEXT with pencil */}
        <div className="relative w-full">
          <RichTextContent
            htmlOrPlain={leftText}
            className="article-content-display"
            as="div"
          />
          <div className="absolute bottom-1 right-1 z-20">
            <PencilSvg size="10" onClick={handleEditLeftText} />
          </div>
        </div>

        {/* RIGHT IMAGE with pencil */}
        <div className="relative w-full">
          <img
            src={rightImageUrl}
            alt="content image"
            className="w-full rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://source.unsplash.com/800x600/?nature";
            }}
          />
          <div className="absolute bottom-1 right-1 z-20">
            <PencilSvg size="10" onClick={handleEditRightImage} />
          </div>
        </div>
      </div>
    );
  }

  // === IMAGE + TEXT ===
  if (contentType === "image_text") {
    const leftImageUrl: string = contentContent?.left ?? "";
    const rightText: string = contentContent?.right ?? "";

    const handleEditLeftImage = () => {
      onEditField({
        contentId,
        field: "left",
        value: leftImageUrl,
        isImage: true,
      });
    };

    const handleEditRightText = () => {
      onEditField({
        contentId,
        field: "right",
        value: rightText,
        isImage: false,
      });
    };

    return (
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
        {/* LEFT IMAGE with pencil */}
        <div className="relative w-full">
          <img
            src={leftImageUrl}
            alt="content image"
            className="w-full rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://source.unsplash.com/800x600/?nature";
            }}
          />
          <div className="absolute bottom-1 right-1 z-20">
            <PencilSvg size="10" onClick={handleEditLeftImage} />
          </div>
        </div>

        {/* RIGHT TEXT with pencil */}
        <div className="relative w-full">
          <RichTextContent
            htmlOrPlain={rightText}
            className="article-content-display"
            as="div"
          />
          <div className="absolute bottom-1 right-1 z-20">
            <PencilSvg size="10" onClick={handleEditRightText} />
          </div>
        </div>
      </div>
    );
  }

  // === UNKNOWN TYPE ===
  return (
    <div className="rounded-md bg-yellow-100 p-4 text-yellow-700">
      ⚠ Unknown content type: {contentType}
    </div>
  );
};

export default ContentRenderer;
