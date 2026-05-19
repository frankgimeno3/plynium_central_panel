const NAMED_ENTITY_FALLBACK: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Plain text from stored rich HTML (tags removed, entities decoded). */
export function htmlToPlainText(html: string): string {
  const raw = String(html ?? "").trim();
  if (!raw) return "";

  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = raw;
    const text = div.textContent ?? "";
    return text.replace(/\s+/g, " ").trim();
  }

  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (full, name: string) => NAMED_ENTITY_FALLBACK[name.toLowerCase()] ?? full)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns true if the HTML content has no meaningful text (empty or only tags/whitespace).
 */
export function isRichTextEmpty(html: string): boolean {
  if (!html || !html.trim()) return true;
  if (typeof document === "undefined") {
    return !html.replace(/<[^>]*>/g, "").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return !div.textContent?.trim();
}
