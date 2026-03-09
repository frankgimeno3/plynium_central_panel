"use client";

import React, { FC } from "react";
import TagChip from "./TagChip";

interface ArticleTagsProps {
  tags: string[];
  onRemoveTag: (tag: string) => void;
  onAddTag: () => void;
}

const ArticleTags: FC<ArticleTagsProps> = ({
  tags,
  onRemoveTag,
  onAddTag,
}) => {
  return (
    <section className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <TagChip
          key={tag}
          tag={tag}
          onRemove={() => onRemoveTag(tag)}
        />
      ))}

      <button
        className="flex flex-row rounded-full bg-blue-950 px-3 py-1 text-sm text-white hover:bg-blue-900 cursor-pointer"
        type="button"
        onClick={onAddTag}
      >
        Add tags
      </button>
    </section>
  );
};

export default ArticleTags;
