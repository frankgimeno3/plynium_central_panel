"use client";

import React, { FC, useState, useEffect } from "react";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

interface ContentRendererProps {
  contentId: string;
  contentType: string;
  contentContent: any;
  onSaveContentField: (contentId: string, field: "center" | "left" | "right", value: string) => void;
  onOpenMediatecaForImage: (contentId: string, field: "center" | "left" | "right") => void;
  isSaving?: boolean;
}

const JustTextBlock: FC<{
  contentId: string;
  initialCenter: string;
  onSave: (contentId: string, field: "center", value: string) => void;
  isSaving: boolean;
}> = ({ contentId, initialCenter, onSave, isSaving }) => {
  const [centerLocal, setCenterLocal] = useState(initialCenter);
  useEffect(() => {
    setCenterLocal(initialCenter);
  }, [initialCenter]);
  const isDirty = centerLocal !== initialCenter;
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-bold text-gray-700">Text (centered)</label>
      <RichTextEditor
        value={centerLocal}
        onChange={setCenterLocal}
        placeholder="Enter text..."
        minHeight="120px"
      />
      {isDirty && (
        <button
          type="button"
          onClick={() => onSave(contentId, "center", centerLocal)}
          disabled={isSaving}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      )}
    </div>
  );
};

const JustImageBlock: FC<{
  contentId: string;
  imageUrl: string;
  onOpenMediateca: (contentId: string, field: "center") => void;
}> = ({ contentId, imageUrl, onOpenMediateca }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-sm font-bold text-gray-700">Image (centered)</label>
    {imageUrl ? (
      <img
        src={imageUrl}
        alt="content"
        className="w-full max-w-md rounded-lg border border-gray-200"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://source.unsplash.com/800x600/?nature";
        }}
      />
    ) : (
      <div className="w-full max-w-md h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm">
        No image
      </div>
    )}
    <button
      type="button"
      onClick={() => onOpenMediateca(contentId, "center")}
      className="self-start px-4 py-2 bg-blue-950 text-white font-medium rounded-xl hover:bg-blue-900"
    >
      Change image
    </button>
  </div>
);

const TextImageBlock: FC<{
  contentId: string;
  initialLeft: string;
  rightImageUrl: string;
  onSaveContentField: (contentId: string, field: "center" | "left" | "right", value: string) => void;
  onOpenMediatecaForImage: (contentId: string, field: "center" | "left" | "right") => void;
  isSaving: boolean;
}> = ({ contentId, initialLeft, rightImageUrl, onSaveContentField, onOpenMediatecaForImage, isSaving }) => {
  const [leftLocal, setLeftLocal] = useState(initialLeft);
  useEffect(() => {
    setLeftLocal(initialLeft);
  }, [initialLeft]);
  const leftDirty = leftLocal !== initialLeft;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Text (left)</label>
        <RichTextEditor
          value={leftLocal}
          onChange={setLeftLocal}
          placeholder="Enter text..."
          minHeight="100px"
        />
        {leftDirty && (
          <button
            type="button"
            onClick={() => onSaveContentField(contentId, "left", leftLocal)}
            disabled={isSaving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Image (right)</label>
        {rightImageUrl ? (
          <img
            src={rightImageUrl}
            alt="content"
            className="w-full rounded-md border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://source.unsplash.com/800x600/?nature";
            }}
          />
        ) : (
          <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm">
            No image
          </div>
        )}
        <button
          type="button"
          onClick={() => onOpenMediatecaForImage(contentId, "right")}
          className="self-start px-4 py-2 bg-blue-950 text-white font-medium rounded-xl hover:bg-blue-900"
        >
          Change image
        </button>
      </div>
    </div>
  );
};

const ImageTextBlock: FC<{
  contentId: string;
  leftImageUrl: string;
  initialRight: string;
  onSaveContentField: (contentId: string, field: "center" | "left" | "right", value: string) => void;
  onOpenMediatecaForImage: (contentId: string, field: "center" | "left" | "right") => void;
  isSaving: boolean;
}> = ({ contentId, leftImageUrl, initialRight, onSaveContentField, onOpenMediatecaForImage, isSaving }) => {
  const [rightLocal, setRightLocal] = useState(initialRight);
  useEffect(() => {
    setRightLocal(initialRight);
  }, [initialRight]);
  const rightDirty = rightLocal !== initialRight;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Image (left)</label>
        {leftImageUrl ? (
          <img
            src={leftImageUrl}
            alt="content"
            className="w-full rounded-md border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://source.unsplash.com/800x600/?nature";
            }}
          />
        ) : (
          <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm">
            No image
          </div>
        )}
        <button
          type="button"
          onClick={() => onOpenMediatecaForImage(contentId, "left")}
          className="self-start px-4 py-2 bg-blue-950 text-white font-medium rounded-xl hover:bg-blue-900"
        >
          Change image
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700">Text (right)</label>
        <RichTextEditor
          value={rightLocal}
          onChange={setRightLocal}
          placeholder="Enter text..."
          minHeight="100px"
        />
        {rightDirty && (
          <button
            type="button"
            onClick={() => onSaveContentField(contentId, "right", rightLocal)}
            disabled={isSaving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        )}
      </div>
    </div>
  );
};

const ContentRenderer: FC<ContentRendererProps> = ({
  contentId,
  contentType,
  contentContent,
  onSaveContentField,
  onOpenMediatecaForImage,
  isSaving = false,
}) => {
  if (contentType === "just_text") {
    return (
      <JustTextBlock
        contentId={contentId}
        initialCenter={contentContent?.center ?? ""}
        onSave={onSaveContentField}
        isSaving={isSaving}
      />
    );
  }
  if (contentType === "just_image") {
    return (
      <JustImageBlock
        contentId={contentId}
        imageUrl={contentContent?.center ?? ""}
        onOpenMediateca={onOpenMediatecaForImage}
      />
    );
  }
  if (contentType === "text_image") {
    return (
      <TextImageBlock
        contentId={contentId}
        initialLeft={contentContent?.left ?? ""}
        rightImageUrl={contentContent?.right ?? ""}
        onSaveContentField={onSaveContentField}
        onOpenMediatecaForImage={onOpenMediatecaForImage}
        isSaving={isSaving}
      />
    );
  }
  if (contentType === "image_text") {
    return (
      <ImageTextBlock
        contentId={contentId}
        leftImageUrl={contentContent?.left ?? ""}
        initialRight={contentContent?.right ?? ""}
        onSaveContentField={onSaveContentField}
        onOpenMediatecaForImage={onOpenMediatecaForImage}
        isSaving={isSaving}
      />
    );
  }
  return (
    <div className="rounded-md bg-yellow-100 p-4 text-yellow-700">
      ⚠ Unknown content type: {contentType}
    </div>
  );
};

export default ContentRenderer;
