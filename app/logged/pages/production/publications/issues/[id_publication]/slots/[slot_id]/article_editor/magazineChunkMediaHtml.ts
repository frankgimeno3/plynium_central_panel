/**
 * Serialization for magazine article chunks that combine rich text + mediateca image.
 * `only_image` uses a simple figure; `text_image` / `image_text` wrap layout metadata
 * plus base64-encoded UTF-8 text so chunk_html stays a single string without ambiguous
 * nested-markup parsing.
 */

export type MagazineSplitLayout = "text_image" | "image_text";

const PMC_MARK = "plyn-mag-chunk";
const PMC_VER = "1";

function escAttr(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/\r|\n/g, " ");
}

export function utf8ToBase64(s: string): string {
  try {
    return btoa(unescape(encodeURIComponent(s)));
  } catch {
    return "";
  }
}

export function base64ToUtf8(b64: string): string {
  const raw = String(b64 ?? "").trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(escape(atob(raw)));
  } catch {
    return "";
  }
}

export function buildOnlyImageHtml(src: string, alt = ""): string {
  if (!src?.trim()) return "";
  return `<figure class="${PMC_MARK}__figure"><img src="${escAttr(src)}" alt="${escAttr(alt)}" /></figure>`;
}

/** First img[src] in HTML, or null. */
export function extractFirstImgSrc(html: string): string | null {
  const m = String(html ?? "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

export function extractFirstImgAlt(html: string): string {
  const m = String(html ?? "").match(/<img[^>]+alt=["']([^"']*)["']/i);
  return m?.[1] != null ? String(m[1]) : "";
}

function splitFigureHtml(src: string | null, alt: string): string {
  if (src?.trim()) {
    return `<figure class="${PMC_MARK}__figure" style="margin:0"><img src="${escAttr(
      src.trim()
    )}" alt="${escAttr(alt)}" style="max-width:100%;height:auto;border-radius:0.375rem" /></figure>`;
  }
  return `<div class="${PMC_MARK}__figure ${PMC_MARK}__figure--empty" style="min-height:7rem;border:1px dashed #d1d5db;border-radius:0.375rem;background:#f9fafb"></div>`;
}

export function buildSplitChunkHtml(
  layout: MagazineSplitLayout,
  textHtml: string,
  imageSrc: string | null,
  imageAlt = ""
): string {
  const b64 = utf8ToBase64(textHtml ?? "");
  const flexDir = layout === "image_text" ? "row-reverse" : "row";
  const figure = splitFigureHtml(imageSrc, imageAlt);
  return `<div class="${PMC_MARK}" data-pmc-v="${PMC_VER}" data-pmc-layout="${layout}" data-pmc-text-b64="${escAttr(
    b64
  )}" style="display:flex;flex-direction:${flexDir};flex-wrap:wrap;gap:1rem;align-items:flex-start">
  <div class="${PMC_MARK}__rt" style="flex:1;min-width:min(100%,14rem)"></div>
  <div class="${PMC_MARK}__media" style="flex:0 0 auto;width:11rem;max-width:100%">${figure}</div>
</div>`;
}

export type ParsedMagazineChunk =
  | { kind: "plain"; textHtml: string; imageSrc: string | null; imageAlt: string }
  | {
      kind: "split";
      layout: MagazineSplitLayout;
      textHtml: string;
      imageSrc: string | null;
      imageAlt: string;
    };

export function parseMagazineChunkHtml(html: string, format: string): ParsedMagazineChunk {
  const raw = String(html ?? "");
  if (format === "only_image") {
    return {
      kind: "plain",
      textHtml: "",
      imageSrc: extractFirstImgSrc(raw),
      imageAlt: extractFirstImgAlt(raw),
    };
  }
  if (format !== "text_image" && format !== "image_text") {
    return { kind: "plain", textHtml: raw, imageSrc: null, imageAlt: "" };
  }
  const layoutMatch = raw.match(/data-pmc-layout="(text_image|image_text)"/);
  const b64Match = raw.match(/data-pmc-text-b64="([^"]*)"/);
  if (layoutMatch?.[1] && b64Match) {
    const layout = layoutMatch[1] as MagazineSplitLayout;
    const textHtml = base64ToUtf8(b64Match[1]);
    return {
      kind: "split",
      layout,
      textHtml,
      imageSrc: extractFirstImgSrc(raw),
      imageAlt: extractFirstImgAlt(raw),
    };
  }
  return {
    kind: "plain",
    textHtml: raw,
    imageSrc: extractFirstImgSrc(raw),
    imageAlt: extractFirstImgAlt(raw),
  };
}

export function buildChunkHtmlForFormat(
  format: string,
  textHtml: string,
  imageSrc: string | null,
  imageAlt: string
): string {
  if (format === "only_image") {
    return buildOnlyImageHtml(imageSrc ?? "", imageAlt);
  }
  if (format === "text_image" || format === "image_text") {
    return buildSplitChunkHtml(format, textHtml, imageSrc, imageAlt);
  }
  return textHtml ?? "";
}
