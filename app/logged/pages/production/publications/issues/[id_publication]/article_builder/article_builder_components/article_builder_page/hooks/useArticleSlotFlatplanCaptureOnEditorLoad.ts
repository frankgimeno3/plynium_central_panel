"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  captureArticlePageForSlot,
  pruneArticleScreenshots,
  uploadArticleSlotFlatplanComposite,
} from "../../articleSlotFlatplanCapture";
import type { FlatplanCaptureSlotSpec } from "../components/ArticleSlotFlatplanCaptureStage";

/**
 * On Article Builder editor mount, capture each article page once and upload
 * to mediateca `Screenshots/Screenshot-p{n}.png` (and `slot_flatplan_image_url`).
 */
export function useArticleSlotFlatplanCaptureOnEditorLoad(options: {
  enabled: boolean;
  publicationArticleId: string;
  slotSpecs: FlatplanCaptureSlotSpec[];
  onComplete?: () => void;
  onError?: (message: string) => void;
}) {
  const { enabled, publicationArticleId, slotSpecs, onComplete, onError } = options;
  const slotIdKey = useMemo(
    () => slotSpecs.map((s) => s.slotId).join(","),
    [slotSpecs]
  );
  const captureRunKeyRef = useRef<string | null>(null);
  const captureSessionRef = useRef(
    typeof performance !== "undefined" ? performance.timeOrigin : Date.now()
  );

  useEffect(() => {
    if (!enabled || !publicationArticleId || slotSpecs.length === 0) return;
    const runKey = `${publicationArticleId}:${slotIdKey}:${captureSessionRef.current}`;
    if (captureRunKeyRef.current === runKey) return;
    captureRunKeyRef.current = runKey;

    let cancelled = false;

    void (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 2200));

      const failures: string[] = [];

      for (const spec of slotSpecs) {
        if (cancelled) break;
        try {
          const dataUrl = await captureArticlePageForSlot(spec.slotId);
          await uploadArticleSlotFlatplanComposite({
            slotId: spec.slotId,
            publicationArticleId,
            articlePageIndex: spec.articlePageIndex,
            imagePngBase64: dataUrl,
          });
        } catch (e: unknown) {
          failures.push(
            e instanceof Error ? e.message : `Failed slot ${spec.slotId}`
          );
        }
      }

      if (cancelled) return;

      if (!cancelled && failures.length < slotSpecs.length) {
        try {
          await pruneArticleScreenshots(publicationArticleId, slotSpecs.length);
        } catch (e: unknown) {
          failures.push(
            e instanceof Error ? e.message : "Failed to prune removed page screenshots"
          );
        }
      }

      if (failures.length > 0) {
        onError?.(
          failures.length === slotSpecs.length
            ? "Could not refresh flatplan previews."
            : `Some flatplan previews failed (${failures.length}/${slotSpecs.length}).`
        );
      } else {
        onComplete?.();
      }
    })();

    return () => {
      cancelled = true;
      captureRunKeyRef.current = null;
    };
  }, [enabled, publicationArticleId, slotIdKey, slotSpecs, onComplete, onError]);
}
