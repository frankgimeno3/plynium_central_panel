"use client";

import { toPng } from "html-to-image";

/** Editor thumbnail uses `scale-[0.38]` and `w-[263%]` — layout width ≈ 2.63× cell width. */
const EDITOR_INNER_WIDTH_FACTOR = 263 / 100;

/**
 * Fallback capture width when the editor preview is not in the DOM yet
 * (~49% grid column × 263% inner at a 1280px viewport).
 */
export const ARTICLE_FLATPLAN_CAPTURE_WIDTH_PX = Math.round(
  1280 * 0.49 * EDITOR_INNER_WIDTH_FACTOR
);

export const ARTICLE_FLATPLAN_CAPTURE_HEIGHT_PX = Math.round(
  ARTICLE_FLATPLAN_CAPTURE_WIDTH_PX * (297 / 228)
);

export const ARTICLE_FLATPLAN_CAPTURE_SELECTOR = "[data-article-flatplan-capture]";

const CAPTURE_TO_PNG_OPTIONS = {
  pixelRatio: 1,
  cacheBust: true,
  includeQueryParams: true,
  skipFonts: true,
  backgroundColor: "#ffffff",
  filter: (node: Node) => {
    if (node instanceof HTMLElement && node.dataset.excludeFromFlatplanCapture === "true") {
      return false;
    }
    return true;
  },
} as const;

async function waitForImagesInElement(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

function captureSizeFromElement(el: HTMLElement): { width: number; height: number } {
  const width = Math.max(el.scrollWidth, el.clientWidth, el.offsetWidth);
  const height = Math.max(el.scrollHeight, el.clientHeight, el.offsetHeight);
  return {
    width: Math.max(ARTICLE_FLATPLAN_CAPTURE_WIDTH_PX, Math.round(width)),
    height: Math.max(ARTICLE_FLATPLAN_CAPTURE_HEIGHT_PX, Math.round(height)),
  };
}

export function findVisibleEditorPageCard(slotId: number): HTMLElement | null {
  return document.querySelector(
    `[data-article-editor-preview="${slotId}"] [data-article-preview-page-card]`
  ) as HTMLElement | null;
}

export async function waitForFlatplanCaptureNode(
  slotId: number,
  maxMs = 8000
): Promise<HTMLElement | null> {
  const selector = `${ARTICLE_FLATPLAN_CAPTURE_SELECTOR}[data-article-flatplan-capture="${slotId}"]`;
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) return el;
    await new Promise((r) => setTimeout(r, 80));
  }
  return null;
}

async function capturePageCardElement(card: HTMLElement): Promise<string> {
  await waitForImagesInElement(card);
  const { width, height } = captureSizeFromElement(card);
  return toPng(card, {
    ...CAPTURE_TO_PNG_OPTIONS,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      margin: "0",
      padding: "0",
    },
  });
}

/**
 * Captures the same layout the user sees in the editor (scaled thumbnail), falling
 * back to the off-screen capture stage at matching proportions.
 */
export async function captureArticlePageForSlot(slotId: number): Promise<string> {
  const visibleCard = findVisibleEditorPageCard(slotId);
  if (visibleCard) {
    return capturePageCardElement(visibleCard);
  }

  const offscreenRoot = await waitForFlatplanCaptureNode(slotId);
  if (!offscreenRoot) {
    throw new Error(`capture node missing for slot ${slotId}`);
  }
  const card =
    (offscreenRoot.querySelector("[data-article-preview-page-card]") as HTMLElement | null) ??
    offscreenRoot;
  return capturePageCardElement(card);
}

/** @deprecated Use {@link captureArticlePageForSlot}. */
export async function captureElementToPngDataUrl(el: HTMLElement): Promise<string> {
  return capturePageCardElement(el);
}

export async function uploadArticleSlotFlatplanComposite(options: {
  slotId: number;
  publicationArticleId: string;
  articlePageIndex: number;
  imagePngBase64: string;
}): Promise<{ slot_flatplan_image_url: string }> {
  const res = await fetch(
    `/api/v1/publication-slots/${encodeURIComponent(String(options.slotId))}/article-flatplan-composite`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        image_png_base64: options.imagePngBase64,
        publication_article_id: options.publicationArticleId,
        article_page_index: options.articlePageIndex,
      }),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to upload flatplan preview");
  }
  const json = (await res.json()) as {
    slot_flatplan_image_url?: string;
    image_url?: string;
  };
  return {
    slot_flatplan_image_url:
      String(json.slot_flatplan_image_url ?? json.image_url ?? "").trim(),
  };
}

/** Avoid stale browser cache when the same mediateca URL is overwritten. */
export function flatplanImageUrlWithCacheBust(
  url: string,
  bust: string | number = Date.now()
): string {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return trimmed;
  const sep = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${sep}v=${encodeURIComponent(String(bust))}`;
}

export type FlatplanScreenshotSlotSpec = {
  slotId: number;
  articlePageIndex: number;
};

/**
 * Capture and upload flatplan PNGs for every article page (manual save only).
 */
export async function runArticleSlotFlatplanScreenshots(options: {
  publicationArticleId: string;
  slotSpecs: FlatplanScreenshotSlotSpec[];
  /** Wait for layout/paint before capture (ms). */
  settleMs?: number;
}): Promise<{ failures: string[] }> {
  const { publicationArticleId, slotSpecs, settleMs = 600 } = options;
  const failures: string[] = [];

  if (!slotSpecs.length) return { failures };

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, settleMs));

  for (const spec of slotSpecs) {
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
        e instanceof Error ? e.message : `Failed flatplan capture for slot ${spec.slotId}`
      );
    }
  }

  if (failures.length < slotSpecs.length) {
    try {
      await pruneArticleScreenshots(publicationArticleId, slotSpecs.length);
    } catch (e: unknown) {
      failures.push(
        e instanceof Error ? e.message : "Failed to prune removed page screenshots"
      );
    }
  }

  return { failures };
}

export async function pruneArticleScreenshots(publicationArticleId: string, pageCount: number) {
  const res = await fetch(
    `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/screenshots/prune`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_count: pageCount }),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to prune article screenshots");
  }
}
