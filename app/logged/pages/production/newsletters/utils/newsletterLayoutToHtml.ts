import type { NewsletterCampaignLayoutConfig } from "@/app/contents/newsletterCampaignLayout";
import type { NewsletterContentItem } from "./newsletterLayoutModel";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function newsletterLayoutToHtml(
  config: NewsletterCampaignLayoutConfig,
  contentItems: NewsletterContentItem[]
): string {
  const isMagazine = config.newsletterType === "magazine";
  const magazineAsHeader = isMagazine && config.magazineHeaderMode === "magazine_as_header";
  const showNormalHeader = !isMagazine || config.magazineHeaderMode === "normal_header_and_magazine_in_content";
  const showArticleCards = config.newsletterType === "main" || config.newsletterType === "specific";

  const sections: string[] = [];

  if (magazineAsHeader) {
    sections.push(
      `<section style="padding:20px 16px;text-align:center;background:${escapeHtml(config.headerBackground)};color:${escapeHtml(config.headerTextColor)};"><h1 style="margin:0;font-size:18px;text-transform:uppercase;">${escapeHtml(config.headerTextRight || "Read now")}</h1></section>`
    );
  }

  if (showNormalHeader) {
    sections.push(
      `<header style="padding:16px;background:${escapeHtml(config.headerBackground)};color:${escapeHtml(config.headerTextColor)};"><div style="display:flex;justify-content:space-between;gap:12px;"><strong>${escapeHtml(config.headerLogoLabel)}</strong><span style="font-size:12px;text-transform:uppercase;">${escapeHtml(config.headerTextRight)}</span></div><p style="margin:8px 0 0;font-size:11px;">${escapeHtml(config.headerSubtitle)}</p></header>`
    );
  }

  if (showArticleCards) {
    const cards = contentItems
      .map((item) => {
        if (item.kind === "banner") {
          const image = item.imageSrc
            ? `<img src="${escapeHtml(item.imageSrc)}" alt="${escapeHtml(item.title)}" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;" />`
            : `<div style="height:160px;background:#e5e7eb;border-radius:8px;"></div>`;
          return `<a href="${escapeHtml(item.redirection || "#")}" style="display:block;margin-bottom:12px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;text-decoration:none;">${image}</a>`;
        }

        const image = item.imageSrc
          ? `<img src="${escapeHtml(item.imageSrc)}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:6px;" />`
          : `<div style="width:80px;height:80px;background:#e5e7eb;border-radius:6px;"></div>`;
        const borderStyle =
          item.kind === "sponsored"
            ? "border:2px solid #f59e0b;box-shadow:0 8px 20px rgba(0,0,0,0.12);"
            : "border:1px solid #e5e7eb;";
        return `<article style="display:flex;gap:12px;padding:12px;${borderStyle}border-radius:8px;background:#fff;margin-bottom:12px;">${image}<div><h3 style="margin:0;font-family:${escapeHtml(config.titleFont)};color:${escapeHtml(config.titleTextColor)};">${escapeHtml(item.title || "Untitled article")}</h3><p style="margin:8px 0 0;font-size:12px;font-family:${escapeHtml(config.subtitleFont)};color:${escapeHtml(config.subtitleTextColor)};">${escapeHtml(item.subtitle || "")}</p><a href="${escapeHtml(item.redirection || "#")}" style="display:inline-block;margin-top:8px;padding:4px 8px;font-size:10px;text-transform:uppercase;text-decoration:none;background:${escapeHtml(config.buttonColor)};color:${escapeHtml(config.buttonTextColor)};">Read more</a></div></article>`;
      })
      .join("");
    sections.push(
      `<section style="padding:16px;background:${escapeHtml(config.contentSectionBackground)};">${cards || "<p>No specific contents added yet.</p>"}</section>`
    );
  }

  sections.push(
    `<footer style="padding:16px;font-size:12px;background:${escapeHtml(config.footerColor)};color:${escapeHtml(config.footerTextColor)};"><p>${escapeHtml(config.footerContactEmail)}</p><p>${escapeHtml(config.footerContactPhone)}</p><p>${escapeHtml(config.footerWebsite)}</p><p>${escapeHtml(config.footerLinkedinLink)}</p><p style="margin-top:12px;font-size:10px;">To unsubscribe, email ${escapeHtml(config.footerUnsubscribeEmail)}</p></footer>`
  );

  const body = sections.join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Newsletter</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:0 auto;padding:0;color:#111827;line-height:1.5;} a{color:inherit;}</style>
</head>
<body>
${body}
</body>
</html>`;
}
