"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";

import type { SlotRow } from "@/app/logged/pages/production/publications/publication_components/_shared";

import { buildFlatplanArticleDragPayload } from "./flatplanArticleDrag";

import {
  canDropArticleOnGutter,
  type FlatplanArticleDragPayload,
  type FlatplanArticleDropTarget,
} from "./flatplanArticleDrag";
import type { FlatplanInsertAdjacentSide } from "./flatplanInsertPlacement";

const FLATPLAN_DRAG_BODY_CLASS = "flatplan-article-drag-active";

type FlatplanArticleDragContextValue = {
  activeDrag: FlatplanArticleDragPayload | null;
  /** Synchronous drag payload (HTML5 drag events fire before React re-renders). */
  getActiveDrag: () => FlatplanArticleDragPayload | null;
  /** Entry key of the article tile armed via “Click to drag” (handle stays on top). */
  armedEntryKey: string | null;
  hoveredDrop: FlatplanArticleDropTarget | null;
  isDragging: boolean;
  beginDrag: (slot: SlotRow) => void;
  armDrag: (slot: SlotRow) => void;
  clearArmedDrag: () => void;
  endDrag: () => void;
  setHoveredDrop: (target: FlatplanArticleDropTarget | null) => void;
  canDropOn: (entryKey: string, side: FlatplanInsertAdjacentSide) => boolean;
  completeDrop: (entryKey: string, side: FlatplanInsertAdjacentSide) => void;
};

const FlatplanArticleDragContext = createContext<FlatplanArticleDragContextValue | null>(null);

export function useFlatplanArticleDrag(): FlatplanArticleDragContextValue | null {
  return useContext(FlatplanArticleDragContext);
}

type FlatplanArticleDragProviderProps = {
  sortedSlots: SlotRow[];
  onRelocateArticle: (
    publicationArticleId: string,
    entryKey: string,
    side: FlatplanInsertAdjacentSide
  ) => void | Promise<void>;
  children: ReactNode;
};

export const FlatplanArticleDragProvider: FC<FlatplanArticleDragProviderProps> = ({
  sortedSlots,
  onRelocateArticle,
  children,
}) => {
  const [activeDrag, setActiveDrag] = useState<FlatplanArticleDragPayload | null>(null);
  const [armedEntryKey, setArmedEntryKey] = useState<string | null>(null);
  const [hoveredDrop, setHoveredDrop] = useState<FlatplanArticleDropTarget | null>(null);
  const activeDragRef = useRef<FlatplanArticleDragPayload | null>(null);

  const getActiveDrag = useCallback(() => activeDragRef.current, []);

  const beginDrag = useCallback((slot: SlotRow) => {
    const payload = buildFlatplanArticleDragPayload(slot);
    if (!payload) return;
    activeDragRef.current = payload;
    setActiveDrag(payload);
    if (typeof document !== "undefined") {
      document.body.classList.add(FLATPLAN_DRAG_BODY_CLASS);
    }
  }, []);

  const armDrag = useCallback((slot: SlotRow) => {
    const payload = buildFlatplanArticleDragPayload(slot);
    if (!payload) return;
    setArmedEntryKey(payload.entryKey);
  }, []);

  const clearArmedDrag = useCallback(() => {
    setArmedEntryKey(null);
  }, []);

  const endDrag = useCallback(() => {
    activeDragRef.current = null;
    setActiveDrag(null);
    setArmedEntryKey(null);
    setHoveredDrop(null);
    if (typeof document !== "undefined") {
      document.body.classList.remove(FLATPLAN_DRAG_BODY_CLASS);
    }
  }, []);

  const canDropOn = useCallback(
    (entryKey: string, side: FlatplanInsertAdjacentSide) =>
      canDropArticleOnGutter(sortedSlots, activeDragRef.current, { entryKey, side }),
    [sortedSlots]
  );

  const completeDrop = useCallback(
    (entryKey: string, side: FlatplanInsertAdjacentSide) => {
      const drag = activeDragRef.current;
      if (!drag) return;
      if (!canDropArticleOnGutter(sortedSlots, drag, { entryKey, side })) {
        endDrag();
        return;
      }
      void Promise.resolve(onRelocateArticle(drag.publicationArticleId, entryKey, side)).finally(endDrag);
    },
    [sortedSlots, onRelocateArticle, endDrag]
  );

  const value = useMemo(
    () => ({
      activeDrag,
      getActiveDrag,
      armedEntryKey,
      hoveredDrop,
      isDragging: activeDrag != null,
      beginDrag,
      armDrag,
      clearArmedDrag,
      endDrag,
      setHoveredDrop,
      canDropOn,
      completeDrop,
    }),
    [
      activeDrag,
      getActiveDrag,
      armedEntryKey,
      hoveredDrop,
      beginDrag,
      armDrag,
      clearArmedDrag,
      endDrag,
      canDropOn,
      completeDrop,
    ]
  );

  return (
    <FlatplanArticleDragContext.Provider value={value}>{children}</FlatplanArticleDragContext.Provider>
  );
};
