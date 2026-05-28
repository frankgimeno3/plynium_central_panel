"use client";

import React, { FC } from "react";
import {
  isRichTextEmpty,
  RichTextContent,
} from "@/app/logged/logged_components/RichTextEditor";
import { MAGAZINE_HEADER_PAD_CLASS } from "./constants";
import type { ArticlePreviewBodyTextStyles } from "./bodyTextStyles";

export const ArticlePreviewPageHeader: FC<{
  showHeadline: boolean;
  showSubtitle: boolean;
  headlineHtml: string;
  subtitleHtml: string;
  styles: ArticlePreviewBodyTextStyles;
}> = ({ showHeadline, showSubtitle, headlineHtml, subtitleHtml, styles }) => (
  <header
    className={`flex h-[13%] shrink-0 flex-col justify-center bg-black text-white ${MAGAZINE_HEADER_PAD_CLASS}`}
  >
    {showHeadline ? (
      isRichTextEmpty(headlineHtml) ? (
        <div className={styles.headerTitleClass}>Feature headline</div>
      ) : (
        <RichTextContent htmlOrPlain={headlineHtml} className={styles.headerTitleClass} as="div" />
      )
    ) : null}
    {showSubtitle ? (
      isRichTextEmpty(subtitleHtml) ? (
        <div className={styles.headerSubtitleClass}>Subtitle</div>
      ) : (
        <RichTextContent
          htmlOrPlain={subtitleHtml}
          className={styles.headerSubtitleClass}
          as="div"
        />
      )
    ) : null}
  </header>
);
