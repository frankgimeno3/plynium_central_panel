/** True when the URL path ends with `.pdf` (ignores query string). */
export function isPdfMediaUrl(url: string): boolean {
  const path = String(url ?? "").trim().split("?")[0].toLowerCase();
  return path.endsWith(".pdf");
}
