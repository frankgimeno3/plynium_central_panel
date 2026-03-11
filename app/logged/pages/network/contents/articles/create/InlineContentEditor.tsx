"use client";

import React from "react";
import type { Content } from "./types";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

interface ContentFormData {
  left: string;
  right: string;
  center: string;
}

interface InlineContentEditorProps {
  editingContent: Content | null;
  selectedContentType: Content["content_type"] | "";
  onContentTypeSelect: (type: Content["content_type"]) => void;
  onBackToTypeSelect: () => void;
  contentFormData: ContentFormData;
  setContentFormData: React.Dispatch<React.SetStateAction<ContentFormData>>;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenMediaLibraryForField: (field: "left" | "right" | "center") => void;
}

const InlineContentEditor: React.FC<InlineContentEditorProps> = ({
  editingContent,
  selectedContentType,
  onContentTypeSelect,
  onBackToTypeSelect,
  contentFormData,
  setContentFormData,
  onConfirm,
  onCancel,
  onOpenMediaLibraryForField,
}) => {
  return (
    <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50/30 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-blue-200">
        <h3 className="text-lg font-bold text-gray-900">
          {editingContent ? "Edit Content" : "New Content"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!selectedContentType ? (
        <div className="flex flex-col gap-3">
          <p className="font-bold text-gray-800">Select the content type:</p>
          <div className="grid grid-cols-2 gap-3">
            {(["text_image", "image_text", "just_image", "just_text"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onContentTypeSelect(type)}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-950 hover:bg-blue-50 text-left"
              >
                <p className="font-semibold text-gray-900">{type.replace("_", " ").toUpperCase()}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {type === "text_image" && "Text on the left, image on the right"}
                  {type === "image_text" && "Image on the left, text on the right"}
                  {type === "just_image" && "Image only, centered"}
                  {type === "just_text" && "Text only, centered"}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-800">Type: {selectedContentType}</p>
            <button
              type="button"
              onClick={onBackToTypeSelect}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Change type
            </button>
          </div>

          {(selectedContentType === "text_image" || selectedContentType === "image_text") && (
            <>
              <div className="space-y-2">
                <label className="font-bold text-gray-800">
                  {selectedContentType === "text_image" ? "Text (left)" : "Image (left)"} *
                </label>
                {selectedContentType === "text_image" ? (
                  <RichTextEditor
                    value={contentFormData.left}
                    onChange={(html) => setContentFormData((prev) => ({ ...prev, left: html }))}
                    placeholder="Enter text..."
                    minHeight="100px"
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenMediaLibraryForField("left")}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                    >
                      Select or add image from Media Library
                    </button>
                    {contentFormData.left && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 truncate flex-1" title={contentFormData.left}>
                          {contentFormData.left}
                        </span>
                        <button
                          type="button"
                          onClick={() => setContentFormData((prev) => ({ ...prev, left: "" }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="font-bold text-gray-800">
                  {selectedContentType === "text_image" ? "Image (right)" : "Text (right)"} *
                </label>
                {selectedContentType === "text_image" ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenMediaLibraryForField("right")}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                    >
                      Select or add image from Media Library
                    </button>
                    {contentFormData.right && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 truncate flex-1" title={contentFormData.right}>
                          {contentFormData.right}
                        </span>
                        <button
                          type="button"
                          onClick={() => setContentFormData((prev) => ({ ...prev, right: "" }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <RichTextEditor
                    value={contentFormData.right}
                    onChange={(html) => setContentFormData((prev) => ({ ...prev, right: html }))}
                    placeholder="Enter text..."
                    minHeight="100px"
                  />
                )}
              </div>
            </>
          )}

          {(selectedContentType === "just_image" || selectedContentType === "just_text") && (
            <div className="space-y-2">
              <label className="font-bold text-gray-800">
                {selectedContentType === "just_image" ? "Image (centered)" : "Text (centered)"} *
              </label>
              {selectedContentType === "just_image" ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenMediaLibraryForField("center")}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                  >
                    Select or add image from Media Library
                  </button>
                  {contentFormData.center && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 truncate flex-1" title={contentFormData.center}>
                        {contentFormData.center}
                      </span>
                      <button
                        type="button"
                        onClick={() => setContentFormData((prev) => ({ ...prev, center: "" }))}
                        className="text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <RichTextEditor
                  value={contentFormData.center}
                  onChange={(html) => setContentFormData((prev) => ({ ...prev, center: html }))}
                  placeholder="Enter text..."
                  minHeight="150px"
                />
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 py-2 rounded-xl text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 bg-blue-950 text-white py-2 rounded-xl font-medium"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineContentEditor;
