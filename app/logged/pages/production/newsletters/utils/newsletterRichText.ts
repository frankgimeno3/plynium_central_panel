function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function looksLikeNewsletterRichText(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /<[a-zA-Z/][^>]*>/.test(value);
}

export function newsletterRichTextToHtml(value: string): string {
  if (!value) return "";
  if (looksLikeNewsletterRichText(value)) return value;
  return escapeHtml(value);
}
