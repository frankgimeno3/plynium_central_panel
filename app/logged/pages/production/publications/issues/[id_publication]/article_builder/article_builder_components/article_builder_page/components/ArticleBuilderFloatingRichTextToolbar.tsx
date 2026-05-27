"use client";

import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { RichTextToolbar } from "@/app/logged/logged_components/RichTextEditor";

export type ActiveChunkRichEditor = {
  chunkId: string;
  editorRef: RefObject<HTMLDivElement | null>;
  isLeftPage: boolean;
  onAfterCommand: () => void;
};

type ArticleBuilderRichTextToolbarContextValue = {
  registerActiveChunkEditor: (editor: ActiveChunkRichEditor) => void;
  clearActiveChunkEditor: (chunkId: string) => void;
  /** Chunk currently tied to the floating toolbar (may differ from focus while formatting). */
  activeChunkId: string | null;
};

const ArticleBuilderRichTextToolbarContext =
  createContext<ArticleBuilderRichTextToolbarContextValue | null>(null);

export function useArticleBuilderRichTextToolbar(): ArticleBuilderRichTextToolbarContextValue {
  const ctx = useContext(ArticleBuilderRichTextToolbarContext);
  if (!ctx) {
    return {
      registerActiveChunkEditor: () => {},
      clearActiveChunkEditor: () => {},
      activeChunkId: null,
    };
  }
  return ctx;
}

const SaveChangesButton: FC<{
  saving: boolean;
  onClick: () => void;
}> = ({ saving, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    disabled={saving}
    data-pmc-save-article-changes=""
    className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {saving ? "Guardando…" : "Guardar cambios"}
  </button>
);

const FloatingEditorChrome: FC<{
  active: ActiveChunkRichEditor | null;
  toolbarOnRight: boolean;
  hasUnsavedChanges: boolean;
  savingChanges: boolean;
  onSaveChanges: () => void;
}> = ({ active, toolbarOnRight, hasUnsavedChanges, savingChanges, onSaveChanges }) => {
  const positionClass = toolbarOnRight
    ? "fixed bottom-6 right-6"
    : "fixed bottom-6 left-6";

  const showToolbar = active != null;
  const showSave = hasUnsavedChanges;

  if (!showToolbar && !showSave) return null;

  return createPortal(
    <div
      className={`${positionClass} z-[200] flex max-w-[calc(100vw-3rem)] items-center gap-2`}
      data-pmc-floating-rich-toolbar=""
    >
      {toolbarOnRight && showSave ? (
        <SaveChangesButton saving={savingChanges} onClick={onSaveChanges} />
      ) : null}
      {showToolbar ? (
        <RichTextToolbar
          variant="floating"
          editorRef={active!.editorRef}
          onCommand={active!.onAfterCommand}
        />
      ) : null}
      {!toolbarOnRight && showSave ? (
        <SaveChangesButton saving={savingChanges} onClick={onSaveChanges} />
      ) : null}
    </div>,
    document.body
  );
};

export const ArticleBuilderFloatingRichTextToolbarProvider: FC<{
  children: ReactNode;
  hasUnsavedChanges?: boolean;
  savingChanges?: boolean;
  onSaveChanges?: () => void | Promise<void>;
}> = ({
  children,
  hasUnsavedChanges = false,
  savingChanges = false,
  onSaveChanges,
}) => {
  const [active, setActive] = useState<ActiveChunkRichEditor | null>(null);
  const [toolbarOnRight, setToolbarOnRight] = useState(true);
  const activeRef = useRef<ActiveChunkRichEditor | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const registerActiveChunkEditor = useCallback((editor: ActiveChunkRichEditor) => {
    setActive(editor);
    setToolbarOnRight(editor.isLeftPage);
  }, []);

  const clearActiveChunkEditor = useCallback((chunkId: string) => {
    setActive((prev) => (prev?.chunkId === chunkId ? null : prev));
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const current = activeRef.current;
      if (!current) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      const chrome = document.querySelector("[data-pmc-floating-rich-toolbar]");
      if (chrome?.contains(target)) return;
      if (document.querySelector("[data-pmc-save-article-changes]")?.contains(target)) {
        return;
      }
      if (current.editorRef.current?.contains(target)) return;
      setActive(null);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const handleSave = useCallback(() => {
    void onSaveChanges?.();
  }, [onSaveChanges]);

  const value: ArticleBuilderRichTextToolbarContextValue = {
    registerActiveChunkEditor,
    clearActiveChunkEditor,
    activeChunkId: active?.chunkId ?? null,
  };

  return (
    <ArticleBuilderRichTextToolbarContext.Provider value={value}>
      {children}
      <FloatingEditorChrome
        active={active}
        toolbarOnRight={toolbarOnRight}
        hasUnsavedChanges={hasUnsavedChanges}
        savingChanges={savingChanges}
        onSaveChanges={handleSave}
      />
    </ArticleBuilderRichTextToolbarContext.Provider>
  );
};
