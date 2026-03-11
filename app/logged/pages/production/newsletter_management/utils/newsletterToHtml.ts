import type { NewsletterContentBlock } from "@/app/contents/interfaces";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blockToHtml(block: NewsletterContentBlock): string {
  const d = block.data as Record<string, unknown>;

  switch (block.type) {
    case "header": {
      const title = escapeHtml((d.title as string) ?? "");
      const subtitle = escapeHtml((d.subtitle as string) ?? "");
      const logoUrl = escapeHtml((d.logoUrl as string) ?? "");
      const logo = logoUrl ? `<img src="${logoUrl}" alt="" style="height:40px;margin-bottom:8px;" />` : "";
      return `<header style="border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px;">${logo}<h1 style="font-size:1.25rem;font-weight:600;color:#111827;">${title}</h1>${subtitle ? `<p style="font-size:0.875rem;color:#4b5563;">${subtitle}</p>` : ""}</header>`;
    }
    case "footer": {
      const text = escapeHtml((d.text as string) ?? "");
      const links = (d.links as Array<{ label: string; url: string }>) ?? [];
      const linksHtml = links
        .map((l) => `<a href="${escapeHtml(l.url)}" style="color:#2563eb;">${escapeHtml(l.label)}</a>`)
        .join(" ");
      return `<footer style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:16px;font-size:0.875rem;color:#6b7280;"><p>${text}</p>${links.length ? `<div style="margin-top:8px;">${linksHtml}</div>` : ""}</footer>`;
    }
    case "banner": {
      const imageSrc = escapeHtml((d.imageSrc as string) ?? "");
      const redirectUrl = escapeHtml((d.redirectUrl as string) ?? "#");
      const alt = escapeHtml((d.alt as string) ?? "");
      return `<div style="margin:16px 0;"><a href="${redirectUrl}" target="_blank" rel="noopener"><img src="${imageSrc}" alt="${alt}" style="width:100%;max-height:192px;object-fit:cover;border-radius:8px;" /></a></div>`;
    }
    case "portal_article_preview": {
      const title = escapeHtml((d.title as string) ?? "");
      const briefing = escapeHtml((d.briefing as string) ?? "");
      const imageSrc = (d.imageSrc as string) ?? "";
      const link = escapeHtml((d.link as string) ?? "#");
      const img = imageSrc ? `<img src="${escapeHtml(imageSrc)}" alt="" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px;margin-bottom:12px;" />` : "";
      return `<article style="margin:16px 0;padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;"><a href="${link}" target="_blank" rel="noopener">${img}<h3 style="font-weight:500;color:#111827;">${title}</h3><p style="font-size:0.875rem;color:#4b5563;margin-top:4px;">${briefing}</p></a></article>`;
    }
    case "custom_content": {
      const html = (d.html as string) ?? "";
      return `<div style="margin:16px 0;color:#374151;">${html}</div>`;
    }
    default:
      return `<div style="margin:16px 0;padding:12px;background:#f3f4f6;border-radius:6px;font-size:0.875rem;color:#6b7280;">Unknown block type: ${escapeHtml(block.type)}</div>`;
  }
}

/** Build a full HTML document string from ordered content blocks (for "Download as HTML"). */
export function newsletterBlocksToHtml(blocks: NewsletterContentBlock[]): string {
  const body = blocks
    .sort((a, b) => a.order - b.order)
    .map(blockToHtml)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Newsletter</title>
  <style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#374151;line-height:1.5;} a{color:#2563eb;}</style>
</head>
<body>
${body}
</body>
</html>`;
}
