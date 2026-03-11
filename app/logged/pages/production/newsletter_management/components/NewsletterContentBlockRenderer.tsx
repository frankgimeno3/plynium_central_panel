"use client";

import React, { FC } from "react";
import type { NewsletterContentBlock } from "@/app/contents/interfaces";

interface NewsletterContentBlockRendererProps {
  block: NewsletterContentBlock;
}

const NewsletterContentBlockRenderer: FC<NewsletterContentBlockRendererProps> = ({ block }) => {
  const d = block.data as Record<string, unknown>;

  switch (block.type) {
    case "header": {
      const title = (d.title as string) ?? "";
      const subtitle = (d.subtitle as string) ?? "";
      const logoUrl = (d.logoUrl as string) ?? "";
      return (
        <header className="border-b border-gray-200 pb-4 mb-4">
          {logoUrl && <img src={logoUrl} alt="" className="h-10 mb-2" />}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </header>
      );
    }
    case "footer": {
      const text = (d.text as string) ?? "";
      const links = (d.links as Array<{ label: string; url: string }>) ?? [];
      return (
        <footer className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-500">
          <p>{text}</p>
          {links.length > 0 && (
            <div className="flex gap-4 mt-2">
              {links.map((l, i) => (
                <a key={i} href={l.url} className="text-blue-600 hover:underline">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </footer>
      );
    }
    case "banner": {
      const imageSrc = (d.imageSrc as string) ?? "";
      const redirectUrl = (d.redirectUrl as string) ?? "#";
      const alt = (d.alt as string) ?? "";
      return (
        <div className="my-4">
          <a href={redirectUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img src={imageSrc} alt={alt} className="w-full max-h-48 object-cover rounded-lg" />
          </a>
        </div>
      );
    }
    case "portal_article_preview": {
      const title = (d.title as string) ?? "";
      const briefing = (d.briefing as string) ?? "";
      const imageSrc = (d.imageSrc as string) ?? "";
      const link = (d.link as string) ?? "#";
      return (
        <article className="my-4 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
          <a href={link} target="_blank" rel="noopener noreferrer" className="block">
            {imageSrc && (
              <img src={imageSrc} alt="" className="w-full aspect-video object-cover rounded mb-3" />
            )}
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{briefing}</p>
          </a>
        </article>
      );
    }
    case "custom_content": {
      const html = (d.html as string) ?? "";
      return (
        <div
          className="my-4 prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    default:
      return (
        <div className="my-4 p-3 bg-gray-100 rounded text-sm text-gray-500">
          Unknown block type: {block.type}
        </div>
      );
  }
};

export default NewsletterContentBlockRenderer;
