"use client";

import React, { FC } from "react";

/**
 * Renders stored content as HTML when it looks like HTML, otherwise as plain text.
 * Use for displaying content from the rich text editor (backward compatible with plain text).
 */
interface RichTextContentProps {
  htmlOrPlain: string;
  className?: string;
  as?: "div" | "p" | "span";
}

/** True if the string should be rendered as HTML (rich text / magazine chunk markup). */
const looksLikeHtml = (s: string): boolean => {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (t.includes("data-pmc-layout=") || t.includes("plyn-mag-chunk")) return true;
  const i = t.indexOf("<");
  if (i === -1 || i >= t.length - 1) return false;
  const next = t.charAt(i + 1);
  return /[a-zA-Z/!]/.test(next);
};

const RichTextContent: FC<RichTextContentProps> = ({
  htmlOrPlain,
  className = "",
  as: Tag = "div",
}) => {
  if (!htmlOrPlain || !htmlOrPlain.trim()) {
    return <Tag className={className} />;
  }
  if (looksLikeHtml(htmlOrPlain)) {
    return (
      <Tag
        className={`${className} max-w-full break-words [overflow-wrap:anywhere] [&_*]:max-w-full [&_*]:break-words`.trim()}
        dangerouslySetInnerHTML={{ __html: htmlOrPlain }}
      />
    );
  }
  return (
    <Tag className={`${className} max-w-full break-words [overflow-wrap:anywhere]`.trim()}>
      {htmlOrPlain}
    </Tag>
  );
};

export default RichTextContent;
