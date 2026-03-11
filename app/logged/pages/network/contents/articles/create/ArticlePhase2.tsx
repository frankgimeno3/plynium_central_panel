"use client";

import React from "react";
import type { Content } from "./types";
import InlineContentEditor from "./InlineContentEditor";

interface ArticlePhase2Props {
  contents: Content[];
  articleTitle: string;
  articleMainImageUrl: string;
  onOpenModal: (position: number | null, content?: Content) => void;
  onDeleteContent: (contentId: string) => void;
  onBack: () => void;
  onNext: () => void;
  contentEditorOpen: boolean;
  contentModalPosition: number | null;
  editingContent: Content | null;
  selectedContentType: Content["content_type"] | "";
  contentFormData: { left: string; right: string; center: string };
  setContentFormData: React.Dispatch<
    React.SetStateAction<{ left: string; right: string; center: string }>
  >;
  onContentTypeSelect: (type: Content["content_type"]) => void;
  onBackToTypeSelect: () => void;
  onConfirmContent: () => void;
  onCancelContent: () => void;
  onOpenMediaLibraryForField: (field: "left" | "right" | "center") => void;
}

const ArticlePhase2: React.FC<ArticlePhase2Props> = ({
  contents,
  articleTitle,
  articleMainImageUrl,
  onOpenModal,
  onDeleteContent,
  onBack,
  onNext,
  contentEditorOpen,
  contentModalPosition,
  editingContent,
  selectedContentType,
  contentFormData,
  setContentFormData,
  onContentTypeSelect,
  onBackToTypeSelect,
  onConfirmContent,
  onCancelContent,
  onOpenMediaLibraryForField,
}) => {
  const editingIndex =
    editingContent != null
      ? contents.findIndex((c) => c.content_id === editingContent.content_id)
      : -1;

  const renderInlineEditorSlot = () => (
    <InlineContentEditor
      editingContent={editingContent}
      selectedContentType={selectedContentType}
      onContentTypeSelect={onContentTypeSelect}
      onBackToTypeSelect={onBackToTypeSelect}
      contentFormData={contentFormData}
      setContentFormData={setContentFormData}
      onConfirm={onConfirmContent}
      onCancel={onCancelContent}
      onOpenMediaLibraryForField={onOpenMediaLibraryForField}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Selected from Phase 1
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Title</p>
            <p className="font-semibold text-gray-900 truncate" title={articleTitle || undefined}>
              {articleTitle || "— No title —"}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <p className="text-xs text-gray-500 hidden sm:block">Main Image</p>
            {articleMainImageUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={articleMainImageUrl}
                  alt="Main"
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-xs text-gray-600 max-w-[120px] truncate" title={articleMainImageUrl}>
                  Image selected
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">No main image</span>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold">Article Contents</h2>
      <p className="text-sm text-gray-600">
        Hover between contents to add a new one. Click on a content to edit it.
      </p>

      <div className="flex flex-col gap-4">
        {contents.length === 0 ? (
          contentEditorOpen ? (
            renderInlineEditorSlot()
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-950 hover:bg-blue-50"
              onClick={() => onOpenModal(null)}
            >
              <p className="text-gray-500">Click to add the first content</p>
            </div>
          )
        ) : (
          contents.map((content, index) => (
            <React.Fragment key={content.content_id}>
              <div
                className={`group relative -mb-2 z-10 ${contentEditorOpen && contentModalPosition === index && editingContent === null ? "" : "h-4"}`}
                onMouseEnter={(e) => {
                  if (contentEditorOpen && contentModalPosition === index && !editingContent) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (rect.height < 20) {
                    e.currentTarget.style.height = "40px";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.height = "16px";
                }}
              >
                {contentEditorOpen &&
                contentModalPosition === index &&
                editingContent === null ? (
                  <div className="pb-2">{renderInlineEditorSlot()}</div>
                ) : contentEditorOpen && editingIndex === index ? null : (
                  <div className="hidden group-hover:flex items-center justify-center h-full bg-blue-100 border-2 border-dashed border-blue-300 rounded cursor-pointer min-h-[40px]">
                    <button
                      onClick={() => onOpenModal(index)}
                      className="text-blue-950 font-semibold"
                    >
                      + Add content here
                    </button>
                  </div>
                )}
              </div>

              {contentEditorOpen && editingIndex === index ? (
                renderInlineEditorSlot()
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                          {content.content_type}
                        </span>
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {content.content_type === "text_image" && (
                          <p>Text: {content.content_content.left.substring(0, 50)}...</p>
                        )}
                        {content.content_type === "image_text" && (
                          <p>Image: {content.content_content.left}</p>
                        )}
                        {content.content_type === "just_image" && (
                          <p>Image: {content.content_content.center}</p>
                        )}
                        {content.content_type === "just_text" && (
                          <p>Text: {content.content_content.center.substring(0, 50)}...</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onOpenModal(null, content)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteContent(content.content_id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        )}

        {contents.length > 0 && (
          contentEditorOpen && contentModalPosition === null && editingContent === null ? (
            renderInlineEditorSlot()
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-950 hover:bg-blue-50"
              onClick={() => onOpenModal(null)}
            >
              <p className="text-gray-500">+ Add content at the end</p>
            </div>
          )
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-300 py-2 rounded-xl"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-blue-950 text-white py-2 rounded-xl"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ArticlePhase2;
