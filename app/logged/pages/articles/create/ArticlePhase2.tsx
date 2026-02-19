"use client";

import React from "react";
import type { Content } from "./types";

interface ArticlePhase2Props {
  contents: Content[];
  onOpenModal: (position: number | null, content?: Content) => void;
  onDeleteContent: (contentId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const ArticlePhase2: React.FC<ArticlePhase2Props> = ({
  contents,
  onOpenModal,
  onDeleteContent,
  onBack,
  onNext,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Contenidos del Artículo</h2>
      <p className="text-sm text-gray-600">
        Pase el mouse entre los contenidos para agregar uno nuevo. Haga clic en un contenido para editarlo.
      </p>

      <div className="flex flex-col gap-4">
        {contents.length === 0 ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-950 hover:bg-blue-50"
            onClick={() => onOpenModal(null)}
          >
            <p className="text-gray-500">Haga clic para agregar el primer contenido</p>
          </div>
        ) : (
          contents.map((content, index) => (
            <React.Fragment key={content.content_id}>
              <div
                className="group relative h-4 -mb-2 z-10"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (rect.height < 20) {
                    e.currentTarget.style.height = "40px";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.height = "16px";
                }}
              >
                <div className="hidden group-hover:flex items-center justify-center h-full bg-blue-100 border-2 border-dashed border-blue-300 rounded cursor-pointer">
                  <button
                    onClick={() => onOpenModal(index)}
                    className="text-blue-950 font-semibold"
                  >
                    + Agregar contenido aquí
                  </button>
                </div>
              </div>

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
                        <p>Texto: {content.content_content.left.substring(0, 50)}...</p>
                      )}
                      {content.content_type === "image_text" && (
                        <p>Imagen: {content.content_content.left}</p>
                      )}
                      {content.content_type === "just_image" && (
                        <p>Imagen: {content.content_content.center}</p>
                      )}
                      {content.content_type === "just_text" && (
                        <p>Texto: {content.content_content.center.substring(0, 50)}...</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenModal(null, content)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteContent(content.content_id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))
        )}

        {contents.length > 0 && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-950 hover:bg-blue-50"
            onClick={() => onOpenModal(null)}
          >
            <p className="text-gray-500">+ Agregar contenido al final</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-300 py-2 rounded-xl"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-blue-950 text-white py-2 rounded-xl"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ArticlePhase2;
