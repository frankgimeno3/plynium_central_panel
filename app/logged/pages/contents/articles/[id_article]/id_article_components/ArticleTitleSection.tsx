"use client";

import PencilSvg from "@/app/logged/logged_components/svg/PencilSvg";
import { RichTextContent } from "@/app/logged/logged_components/RichTextEditor";

interface ArticleTitleSectionProps {
  title: string;
  subtitle: string;
  onEditTitle: () => void;
  onEditSubtitle: () => void;
}

export default function ArticleTitleSection({
  title,
  subtitle,
  onEditTitle,
  onEditSubtitle,
}: ArticleTitleSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-500">
        Article Title
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex flex-row justify-left items-start gap-2">
          <h1 className="text-4xl font-bold flex-1 min-w-0 article-content-display">
            <RichTextContent htmlOrPlain={title ?? ""} as="span" />
          </h1>
          <div className="flex-shrink-0">
            <PencilSvg size="10" onClick={onEditTitle} />
          </div>
        </div>

        <div className="flex flex-row justify-left items-start gap-2">
          <h2 className="text-xl text-gray-500 flex-1 min-w-0 article-content-display">
            <RichTextContent htmlOrPlain={subtitle ?? ""} as="span" />
          </h2>
          <div className="flex-shrink-0">
            <PencilSvg size="10" onClick={onEditSubtitle} />
          </div>
        </div>
      </div>
    </div>
  );
}

