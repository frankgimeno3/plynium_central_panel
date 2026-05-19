import type { ApiMediaItem, MediatecaContent } from "./types";

export function mapMediaToContent(item: ApiMediaItem): MediatecaContent {
  const isPdf =
    item.type === "pdf" ||
    (item.mimeType && item.mimeType.startsWith("application/pdf")) ||
    item.name.toLowerCase().endsWith(".pdf");
  const type = isPdf ? "pdf" : "image";
  const content_type = isPdf ? "json" : "image";
  const cloudFront = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
  const baseUrl = cloudFront ? `https://${String(cloudFront).replace(/^https?:\/\//, "")}` : "";
  const src = item.url || (baseUrl ? `${baseUrl}/${item.s3Key}` : item.s3Key);
  return {
    id: item.id,
    name: item.name,
    folderPath: item.folderPath,
    type,
    content_type,
    publishedAt: "",
    usedIn: [],
    thumbnailUrl: content_type === "image" ? (item.url || (baseUrl ? `${baseUrl}/${item.s3Key}` : null)) : null,
    url: item.url ?? null,
    src,
  };
}

export function getCurrentFolderName(pathSegments: string[]): string {
  if (pathSegments.length === 0) return "Mediateca";
  return pathSegments[pathSegments.length - 1];
}

export function formatFolderLabel(segment: string): string {
  if (!segment) return "Mediateca";
  return segment.replace(/\b\w/g, (char) => char.toUpperCase());
}
