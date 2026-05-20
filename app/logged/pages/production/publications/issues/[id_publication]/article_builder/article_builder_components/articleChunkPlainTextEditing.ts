/**
 * Helpers to round-trip `publication_article_chunks.chunk_html` against a plain
 * `<textarea>` editor: extract the textual content as plain text (preserving
 * paragraph breaks as newlines), and convert the user's edited plain text back
 * into a valid `chunk_html` payload that respects each chunk's format
 * (only_text vs. text_image / image_text vs. overlay images).
 */

import {
  buildOnlyImageHtml,
  buildSplitChunkHtml,
  extractFirstImgAlt,
  extractFirstImgSrc,
  parseMagazineChunkHtml,
  type MagazineSplitLayout,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/magazineChunkMediaHtml";
import {
  buildOverlayImageHtml,
  isOverlayImageChunk,
  parseOverlayPlacement,
} from "./article_image_manager/articleImagePlacement";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Convert chunk text-HTML (typically `<p>…</p><p>…</p>` from the rich-text
 * editor) into plain text where each block-level break becomes `\n`. Multiple
 * consecutive `<br>` or empty `<p>` produce blank lines.
 */
export function chunkHtmlToPlainText(html: string): string {
  const raw = String(html ?? "");
  if (!raw.trim()) return "";

  if (typeof document !== "undefined") {
    const container = document.createElement("div");
    container.innerHTML = raw;
    const lines: string[] = [];
    const blockTags = new Set([
      "P",
      "DIV",
      "LI",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "BLOCKQUOTE",
    ]);

    const walk = (node: Node, currentLine: string[]): string[] => {
      let buffer = currentLine;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        buffer.push(text);
        return buffer;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return buffer;
      const el = node as Element;
      const tag = el.tagName.toUpperCase();
      if (tag === "BR") {
        lines.push(buffer.join(""));
        return [];
      }
      if (blockTags.has(tag)) {
        if (buffer.length > 0) {
          lines.push(buffer.join(""));
          buffer = [];
        }
        let inner: string[] = [];
        el.childNodes.forEach((child) => {
          inner = walk(child, inner);
        });
        lines.push(inner.join(""));
        return [];
      }
      el.childNodes.forEach((child) => {
        buffer = walk(child, buffer);
      });
      return buffer;
    };

    let tail: string[] = [];
    container.childNodes.forEach((child) => {
      tail = walk(child, tail);
    });
    if (tail.length > 0) lines.push(tail.join(""));

    return lines
      .map((l) => l.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Wrap each line of `text` in `<p>` so the body renderers can style it. */
export function plainTextToChunkHtml(text: string): string {
  const raw = String(text ?? "");
  if (!raw.trim() && !/\n/.test(raw)) return "";
  const lines = raw.split(/\r?\n/);
  if (lines.length === 0) return "";
  return lines
    .map((line) => {
      const trimmed = line.replace(/\u00a0/g, " ");
      if (!trimmed.trim()) return "<p>&nbsp;</p>";
      return `<p>${escapeHtml(trimmed)}</p>`;
    })
    .join("");
}

/** Pull the editable text portion out of a chunk regardless of its format. */
export function readChunkEditableText(
  chunkHtml: string,
  format: string
): string {
  const fmt = String(format ?? "").toLowerCase();
  if (fmt === "only_image") return "";
  if (fmt === "text_image" || fmt === "image_text") {
    const parsed = parseMagazineChunkHtml(chunkHtml, fmt);
    return chunkHtmlToPlainText(parsed.textHtml);
  }
  return chunkHtmlToPlainText(chunkHtml);
}

/** Build a new `chunk_html` payload after the user edits the text portion. */
export function writeChunkEditableText(
  previousChunkHtml: string,
  format: string,
  nextPlainText: string
): string {
  const fmt = String(format ?? "").toLowerCase();
  const nextTextHtml = plainTextToChunkHtml(nextPlainText);
  if (fmt === "only_image") return previousChunkHtml;
  if (fmt === "text_image" || fmt === "image_text") {
    const parsed = parseMagazineChunkHtml(previousChunkHtml, fmt);
    return buildSplitChunkHtml(
      fmt as MagazineSplitLayout,
      nextTextHtml,
      parsed.imageSrc,
      parsed.imageAlt
    );
  }
  return nextTextHtml;
}

/** Replace the image src on any image-bearing chunk format (incl. overlays). */
export function writeChunkImageSrc(
  previousChunkHtml: string,
  format: string,
  nextSrc: string,
  nextAlt: string | null = null
): string {
  const fmt = String(format ?? "").toLowerCase();
  const safeAlt = nextAlt ?? extractFirstImgAlt(previousChunkHtml);
  if (fmt === "only_image") {
    if (isOverlayImageChunk(previousChunkHtml, fmt)) {
      const placement = parseOverlayPlacement(previousChunkHtml);
      if (placement) {
        return buildOverlayImageHtml(nextSrc, placement, safeAlt);
      }
    }
    return buildOnlyImageHtml(nextSrc, safeAlt);
  }
  if (fmt === "text_image" || fmt === "image_text") {
    const parsed = parseMagazineChunkHtml(previousChunkHtml, fmt);
    return buildSplitChunkHtml(
      fmt as MagazineSplitLayout,
      parsed.textHtml,
      nextSrc || null,
      safeAlt
    );
  }
  return previousChunkHtml;
}

export function chunkHasImage(chunkHtml: string, format: string): boolean {
  const fmt = String(format ?? "").toLowerCase();
  if (fmt === "only_image" || fmt === "text_image" || fmt === "image_text") {
    return true;
  }
  return Boolean(extractFirstImgSrc(chunkHtml));
}

export function chunkSupportsTextEditing(format: string): boolean {
  const fmt = String(format ?? "").toLowerCase();
  if (fmt === "only_image") return false;
  return true;
}
