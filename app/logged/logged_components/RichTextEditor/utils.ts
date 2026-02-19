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
