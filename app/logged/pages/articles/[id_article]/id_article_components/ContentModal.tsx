"use client";

import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

interface ContentModalProps {
  isOpen: boolean;
  editingContent: any | null;
  selectedContentType: "text_image" | "image_text" | "just_image" | "just_text" | "";
  contentFormData: {
    left: string;
    right: string;
    center: string;
  };
  isSaving: boolean;
  onClose: () => void;
  onContentTypeSelect: (type: "text_image" | "image_text" | "just_image" | "just_text") => void;
  onContentTypeChange: () => void;
  onFormDataChange: (data: { left?: string; right?: string; center?: string }) => void;
  onConfirm: () => void;
}

export default function ContentModal({
  isOpen,
  editingContent,
  selectedContentType,
  contentFormData,
  isSaving,
  onClose,
  onContentTypeSelect,
  onContentTypeChange,
  onFormDataChange,
  onConfirm,
}: ContentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col p-6 bg-white shadow-xl rounded-xl gap-6 text-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-xl font-bold">
            {editingContent ? "Edit Content" : "New Content"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!selectedContentType ? (
          <div className="flex flex-col gap-3">
            <p className="font-bold">Select the content type:</p>
            <div className="grid grid-cols-2 gap-3">
              {(["text_image", "image_text", "just_image", "just_text"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onContentTypeSelect(type)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-950 hover:bg-blue-50 text-left"
                >
                  <p className="font-semibold">
                    {type.replace("_", " ").toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {type === "text_image" &&
                      "Text on the left, image on the right"}
                    {type === "image_text" &&
                      "Image on the left, text on the right"}
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
              <p className="font-bold">Tipo: {selectedContentType}</p>
              <button
                onClick={onContentTypeChange}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Change type
              </button>
            </div>

            {(selectedContentType === "text_image" ||
              selectedContentType === "image_text") && (
              <>
                <div className="space-y-2">
                  <label className="font-bold">
                    {selectedContentType === "text_image"
                      ? "Text (left)"
                      : "Image (left)"}{" "}
                    *
                  </label>
                  {selectedContentType === "text_image" ? (
                    <RichTextEditor
                      value={contentFormData.left}
                      onChange={(html) => onFormDataChange({ left: html })}
                      placeholder="Enter text..."
                      minHeight="100px"
                    />
                  ) : (
                    <input
                      type="text"
                      value={contentFormData.left}
                      onChange={(e) =>
                        onFormDataChange({ left: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-xl"
                      placeholder="Image URL..."
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="font-bold">
                    {selectedContentType === "text_image"
                      ? "Image (right)"
                      : "Text (right)"}{" "}
                    *
                  </label>
                  {selectedContentType === "text_image" ? (
                    <input
                      type="text"
                      value={contentFormData.right}
                      onChange={(e) =>
                        onFormDataChange({ right: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-xl"
                      placeholder="Image URL..."
                    />
                  ) : (
                    <RichTextEditor
                      value={contentFormData.right}
                      onChange={(html) => onFormDataChange({ right: html })}
                      placeholder="Enter text..."
                      minHeight="100px"
                    />
                  )}
                </div>
              </>
            )}

            {(selectedContentType === "just_image" ||
              selectedContentType === "just_text") && (
              <div className="space-y-2">
                <label className="font-bold">
                  {selectedContentType === "just_image"
                    ? "Image (centered)"
                    : "Text (centered)"}{" "}
                  *
                </label>
                {selectedContentType === "just_image" ? (
                  <input
                    type="text"
                    value={contentFormData.center}
                    onChange={(e) =>
                      onFormDataChange({ center: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-xl"
                    placeholder="Image URL..."
                  />
                ) : (
                  <RichTextEditor
                    value={contentFormData.center}
                    onChange={(html) => onFormDataChange({ center: html })}
                    placeholder="Enter text..."
                    minHeight="150px"
                  />
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 bg-gray-300 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className={`flex-1 py-2 rounded-xl ${
                  isSaving ? "bg-gray-400 text-gray-600" : "bg-blue-950 text-white"
                }`}
              >
                {isSaving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

