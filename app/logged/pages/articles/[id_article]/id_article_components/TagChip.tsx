"use client";

import React, { FC } from "react";

interface TagChipProps {
  tag: string;
  onRemove: () => void;
}

const TagChip: FC<TagChipProps> = ({ tag,  onRemove }) => {
  return (
    <div className="flex flex-row items-center rounded-full bg-gray-200 px-3 py-1 text-sm">
      <button
        type="button"
      >
        {tag}
      </button>

      <button
        type="button"
        className="ml-2 cursor-pointer rounded-full bg-red-600 px-2 font-bold text-white shadow hover:bg-red-500"
        onClick={onRemove}
      >
        x
      </button>
    </div>
  );
};

export default TagChip;
