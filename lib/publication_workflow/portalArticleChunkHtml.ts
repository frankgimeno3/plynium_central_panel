/**
 * Converts portal `article_contents` shapes ({ left, right, center }) into magazine `chunk_html`.
 * Shared by Article Builder (client) and PublicationArticleService (server).
 */

export type PortalLrcContent = {
  left?: string;
  right?: string;
  center?: string;
};

function escHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isUsableImageUrl(value: unknown): boolean {
  const v = String(value ?? "").trim();
  if (!v || v === "no") return false;
  return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/");
}

/** File extensions that always identify an image URL. */
const IMAGE_EXTENSION_PATTERN = /\.(?:jpe?g|png|gif|webp|avif|svg|bmp|heic|heif|tiff?)$/i;

/** Hosts whose URLs are virtually always image responses (CDNs, photo services). */
const KNOWN_IMAGE_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "source.unsplash.com",
  "cdn.pixabay.com",
  "images.pexels.com",
];

/**
 * Heuristic check: does this URL look like it points to an image?
 * - Direct image file extensions (jpg/png/webp/...) anywhere in the path.
 * - Known photo CDN hosts (unsplash, pexels, ...).
 */
export function isLikelyImageUrl(url: unknown): boolean {
  const raw = String(url ?? "").trim();
  if (!raw) return false;
  if (!(raw.startsWith("http://") || raw.startsWith("https://"))) return false;
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (
      KNOWN_IMAGE_HOSTS.some(
        (known) => host === known || host.endsWith("." + known)
      )
    ) {
      return true;
    }
    if (IMAGE_EXTENSION_PATTERN.test(parsed.pathname)) return true;
  } catch {
    // Fall through to the regex test on the raw URL.
  }
  // Strip query/hash before extension test for environments without URL().
  const pathOnly = raw.split("#")[0]!.split("?")[0]!;
  return IMAGE_EXTENSION_PATTERN.test(pathOnly);
}

/** Tags whose contents must not be linkified. */
const LINKIFY_SKIP_TAGS = new Set([
  "a",
  "img",
  "figure",
  "picture",
  "video",
  "source",
  "iframe",
  "script",
  "style",
  "code",
  "pre",
]);

/** Trailing characters that should not be considered part of a URL. */
const URL_TRAILING_PUNCTUATION = /[.,;:!?)\]\}>"'`]$/;

function buildAutoImageHtml(url: string): string {
  // `contenteditable="false"` makes the figure atomic inside the rich-text
  // editor (cursor can't enter it, backspace removes the whole block), while
  // having no effect in read-only preview contexts. `data-pmc-src` is mirrored
  // as a CSS-driven caption only inside editor zones (see globals.css).
  const safeUrl = escHtml(url);
  return `<figure class="plyn-mag-chunk__figure" data-pmc-auto-img="1" data-pmc-src="${safeUrl}" contenteditable="false" style="max-width:100%;margin:0.5rem 0"><img src="${safeUrl}" alt="" style="max-width:100%;height:auto;display:block" /></figure>`;
}

function linkifyTextFragment(text: string): string {
  if (!text || !/https?:\/\//i.test(text)) return text;
  return text.replace(/https?:\/\/[^\s<>"'`]+/g, (match) => {
    let url = match;
    let trailing = "";
    while (url.length > 0 && URL_TRAILING_PUNCTUATION.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    if (!url || !isLikelyImageUrl(url)) return match;
    return buildAutoImageHtml(url) + trailing;
  });
}

/**
 * Converts pasted plain text into editor-ready HTML:
 *   - HTML entities are escaped (so "<x>" never becomes a tag),
 *   - double newlines become paragraph breaks (`</p><p>`),
 *   - single newlines become `<br>`,
 *   - URLs that look like images are upgraded to `<figure><img/></figure>`.
 *
 * Used by paste handlers when "strip formatting on paste" is enabled.
 */
export function plainTextToEditorHtml(text: string): string {
  const raw = String(text ?? "");
  if (!raw) return "";
  const normalized = raw.replace(/\r\n?/g, "\n");
  const paragraphs = normalized.split(/\n{2,}/);
  const html = paragraphs
    .map((p) => {
      const escaped = p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const withBreaks = escaped.replace(/\n/g, "<br>");
      return `<p>${withBreaks}</p>`;
    })
    .join("");
  return linkifyImageUrlsInHtml(html);
}

/**
 * Walks an HTML string and replaces bare image URLs (in text positions, outside
 * of `<a>` / `<img>` / `<figure>` / ... contexts) with `<img>` tags wrapped in
 * a `<figure>`. Safe to run on already-linkified HTML (idempotent), since URLs
 * inside attribute values are skipped.
 *
 * Isomorphic: works on both client and server (regex-based tokenizer, no DOM).
 */
export function linkifyImageUrlsInHtml(html: string): string {
  const raw = String(html ?? "");
  if (!raw || !/https?:\/\//i.test(raw)) return raw;

  const TAG_REGEX = /<[^>]*>/g;
  let out = "";
  let lastIndex = 0;
  let skipDepth = 0;
  let skipTag: string | null = null;

  let match: RegExpExecArray | null;
  while ((match = TAG_REGEX.exec(raw)) !== null) {
    const between = raw.slice(lastIndex, match.index);
    out += skipDepth === 0 ? linkifyTextFragment(between) : between;

    const tag = match[0]!;
    out += tag;

    const tagNameMatch = tag.match(/^<\s*(\/?)([a-zA-Z][a-zA-Z0-9]*)/);
    if (tagNameMatch) {
      const isClosing = tagNameMatch[1] === "/";
      const name = tagNameMatch[2]!.toLowerCase();
      const isSelfClosing = /\/\s*>$/.test(tag);
      if (LINKIFY_SKIP_TAGS.has(name) && !isSelfClosing) {
        if (!isClosing) {
          if (skipTag === null) {
            skipTag = name;
            skipDepth = 1;
          } else if (name === skipTag) {
            skipDepth++;
          }
        } else if (skipTag === name) {
          skipDepth = Math.max(0, skipDepth - 1);
          if (skipDepth === 0) skipTag = null;
        }
      }
    }

    lastIndex = TAG_REGEX.lastIndex;
  }

  const tail = raw.slice(lastIndex);
  out += skipDepth === 0 ? linkifyTextFragment(tail) : tail;

  return out;
}

function isUsableHtml(value: unknown): boolean {
  const v = String(value ?? "").trim();
  return Boolean(v) && v !== "no";
}

export function parsePortalLrcContent(content: unknown): PortalLrcContent | null {
  if (content == null) return null;
  if (typeof content === "string") {
    const t = content.trim();
    if (!t || t === "{}") {
      return { left: "no", right: "no", center: "" };
    }
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as PortalLrcContent;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
  if (typeof content === "object" && !Array.isArray(content)) {
    return content as PortalLrcContent;
  }
  return null;
}

export function isEmptyPortalLrc(lrc: PortalLrcContent): boolean {
  if (isUsableImageUrl(lrc.left) || isUsableImageUrl(lrc.right) || isUsableHtml(lrc.center)) {
    return false;
  }
  return true;
}

export function inferPortalLayoutType(lrc: PortalLrcContent, hintType?: string): string {
  const t = String(hintType ?? "")
    .trim()
    .toLowerCase();
  if (t === "just_text" || t === "just_image" || t === "text_image" || t === "image_text") {
    return t;
  }

  const hasLeftImg = isUsableImageUrl(lrc.left);
  const hasRightImg = isUsableImageUrl(lrc.right);
  const hasCenterImg = isUsableImageUrl(lrc.center);
  const hasLeftText = isUsableHtml(lrc.left);
  const hasRightText = isUsableHtml(lrc.right);
  const hasCenterText = isUsableHtml(lrc.center);

  if (hasLeftText && hasRightImg) return "text_image";
  if (hasLeftImg && hasRightText) return "image_text";
  if (hasCenterImg && !hasCenterText) return "just_image";
  if (hasCenterText) return "just_text";
  if (hasLeftImg || hasRightImg) return "just_image";
  return "just_text";
}

function figureHtml(src: string, alt = ""): string {
  const url = String(src ?? "").trim();
  if (!isUsableImageUrl(url)) return "";
  return `<figure class="plyn-mag-chunk__figure"><img src="${escHtml(url)}" alt="${escHtml(alt)}" style="max-width:100%;height:auto" /></figure>`;
}

function splitLayoutHtml(layout: string, textHtml: string, imageSrc: string): string {
  const flexDir = layout === "image_text" ? "row-reverse" : "row";
  const fig = figureHtml(imageSrc);
  return (
    '<div class="plyn-mag-chunk" data-pmc-layout="' +
    layout +
    '" style="display:flex;flex-direction:' +
    flexDir +
    ';flex-wrap:wrap;gap:1rem;align-items:flex-start">' +
    '<div class="plyn-mag-chunk__rt" style="flex:1;min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word">' +
    textHtml +
    "</div>" +
    '<div class="plyn-mag-chunk__media" style="flex:0 0 auto;max-width:100%">' +
    fig +
    "</div></div>"
  );
}

export function portalLrcToMagazineHtml(layout: string, lrc: PortalLrcContent): string {
  const mode = String(layout ?? "").toLowerCase();
  if (mode === "just_text") {
    return isUsableHtml(lrc.center) ? String(lrc.center).trim() : "";
  }
  if (mode === "just_image") {
    const src =
      (isUsableImageUrl(lrc.center) && lrc.center) ||
      (isUsableImageUrl(lrc.left) && lrc.left) ||
      (isUsableImageUrl(lrc.right) && lrc.right) ||
      "";
    return figureHtml(String(src));
  }
  if (mode === "text_image") {
    const text = isUsableHtml(lrc.left) ? String(lrc.left).trim() : "";
    const img = isUsableImageUrl(lrc.right) ? String(lrc.right).trim() : "";
    if (!text && !img) return "";
    if (!img) return text;
    if (!text) return figureHtml(img);
    return splitLayoutHtml("text_image", text, img);
  }
  if (mode === "image_text") {
    const text = isUsableHtml(lrc.right) ? String(lrc.right).trim() : "";
    const img = isUsableImageUrl(lrc.left) ? String(lrc.left).trim() : "";
    if (!text && !img) return "";
    if (!img) return text;
    if (!text) return figureHtml(img);
    return splitLayoutHtml("image_text", text, img);
  }
  return "";
}

export function portalArticleContentToHtml(type: string, content: unknown): string {
  const lrc = parsePortalLrcContent(content);
  if (lrc) {
    if (isEmptyPortalLrc(lrc)) return "";
    const layout = inferPortalLayoutType(lrc, type);
    return portalLrcToMagazineHtml(layout, lrc);
  }

  const t = String(type ?? "").trim().toLowerCase();
  if (content == null) return "";
  if (typeof content === "string") {
    const s = content.trim();
    if (s.startsWith("{") && (s.includes('"left"') || s.includes('"center"'))) {
      return portalArticleContentToHtml(type, s);
    }
    return s;
  }
  if (typeof content !== "object") return String(content);

  const record = content as Record<string, unknown>;
  if (t === "title" || t === "subtitle") {
    const text = String(record.text ?? record.value ?? "").trim();
    return text ? `<p>${escHtml(text)}</p>` : "";
  }
  if (t === "paragraph" || t === "text" || t === "html" || t === "just_text") {
    return String(record.html ?? record.text ?? record.center ?? "").trim();
  }
  if (t === "image" || t === "main_image" || t === "just_image") {
    return figureHtml(String(record.src ?? record.url ?? record.center ?? "").trim());
  }
  if (t === "text_image" || t === "image_text") {
    return portalLrcToMagazineHtml(t, record as PortalLrcContent);
  }

  return "";
}

export function normalizePortalChunkHtmlForPreview(html: string, format?: string): string {
  const raw = String(html ?? "").trim();
  if (!raw) return "";
  const fmt = String(format ?? "only_text").toLowerCase();
  if (fmt === "only_image" && raw.includes("data-pmc-overlay=")) {
    return raw;
  }
  const lrc = parsePortalLrcContent(raw);
  if (lrc) {
    if (isEmptyPortalLrc(lrc)) return "";
    const layout = inferPortalLayoutType(lrc, fmt === "only_text" ? undefined : fmt);
    return linkifyImageUrlsInHtml(portalLrcToMagazineHtml(layout, lrc));
  }
  if (raw === "{}") return "";
  return linkifyImageUrlsInHtml(raw);
}

export function shouldOmitPortalBodyChunkFromFlow(html: string, format?: string): boolean {
  return !normalizePortalChunkHtmlForPreview(html, format).trim();
}
