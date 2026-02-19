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

/** True if the string contains HTML tags (so it should be rendered as HTML, not plain text). */
const looksLikeHtml = (s: string): boolean => {
  if (!s || typeof s !== "string") return false;
  return /<[a-zA-Z\/][^>]*>/.test(s);
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
        className={className}
        dangerouslySetInnerHTML={{ __html: htmlOrPlain }}
      />
    );
  }
  return <Tag className={className}>{htmlOrPlain}</Tag>;
};

export default RichTextContent;
