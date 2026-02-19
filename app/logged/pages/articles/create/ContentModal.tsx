"use client";

import React, { useEffect } from "react";
import type { Content } from "./types";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

interface ContentFormData {
  left: string;
  right: string;
  center: string;
}

interface ContentModalProps {
  onClose: () => void;
  editingContent: Content | null;
  selectedContentType: Content["content_type"] | "";
  onContentTypeSelect: (type: Content["content_type"]) => void;
  onBackToTypeSelect: () => void;
  contentFormData: ContentFormData;
  setContentFormData: React.Dispatch<React.SetStateAction<ContentFormData>>;
  onConfirm: () => void;
}

const ContentModal: React.FC<ContentModalProps> = ({
  onClose,
  editingContent,
  selectedContentType,
  onContentTypeSelect,
  onBackToTypeSelect,
  contentFormData,
  setContentFormData,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
            {editingContent ? "Editar Contenido" : "Nuevo Contenido"}
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
            <p className="font-bold">Seleccione el tipo de contenido:</p>
            <div className="grid grid-cols-2 gap-3">
              {(["text_image", "image_text", "just_image", "just_text"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onContentTypeSelect(type)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-950 hover:bg-blue-50 text-left"
                >
                  <p className="font-semibold">{type.replace("_", " ").toUpperCase()}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {type === "text_image" && "Texto a la izquierda, imagen a la derecha"}
                    {type === "image_text" && "Imagen a la izquierda, texto a la derecha"}
                    {type === "just_image" && "Solo imagen centrada"}
                    {type === "just_text" && "Solo texto centrado"}
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
                onClick={onBackToTypeSelect}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Cambiar tipo
              </button>
            </div>

            {(selectedContentType === "text_image" || selectedContentType === "image_text") && (
              <>
                <div className="space-y-2">
                  <label className="font-bold">
                    {selectedContentType === "text_image" ? "Texto (izquierda)" : "Imagen (izquierda)"} *
                  </label>
                  {selectedContentType === "text_image" ? (
                    <RichTextEditor
                      value={contentFormData.left}
                      onChange={(html) => setContentFormData((prev) => ({ ...prev, left: html }))}
                      placeholder="Ingrese el texto..."
                      minHeight="100px"
                    />
                  ) : (
                    <input
                      type="text"
                      value={contentFormData.left}
                      onChange={(e) => setContentFormData((prev) => ({ ...prev, left: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-xl"
                      placeholder="URL de la imagen..."
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="font-bold">
                    {selectedContentType === "text_image" ? "Imagen (derecha)" : "Texto (derecha)"} *
                  </label>
                  {selectedContentType === "text_image" ? (
                    <input
                      type="text"
                      value={contentFormData.right}
                      onChange={(e) => setContentFormData((prev) => ({ ...prev, right: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-xl"
                      placeholder="URL de la imagen..."
                    />
                  ) : (
                    <RichTextEditor
                      value={contentFormData.right}
                      onChange={(html) => setContentFormData((prev) => ({ ...prev, right: html }))}
                      placeholder="Ingrese el texto..."
                      minHeight="100px"
                    />
                  )}
                </div>
              </>
            )}

            {(selectedContentType === "just_image" || selectedContentType === "just_text") && (
              <div className="space-y-2">
                <label className="font-bold">
                  {selectedContentType === "just_image" ? "Imagen (centrada)" : "Texto (centrado)"} *
                </label>
                {selectedContentType === "just_image" ? (
                  <input
                    type="text"
                    value={contentFormData.center}
                    onChange={(e) => setContentFormData((prev) => ({ ...prev, center: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-xl"
                    placeholder="URL de la imagen..."
                  />
                ) : (
                    <RichTextEditor
                      value={contentFormData.center}
                      onChange={(html) => setContentFormData((prev) => ({ ...prev, center: html }))}
                      placeholder="Ingrese el texto..."
                      minHeight="150px"
                    />
                  )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 py-2 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-blue-950 text-white py-2 rounded-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentModal;
