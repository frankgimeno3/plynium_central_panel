"use client";

import React, { FC } from "react";

interface ContentNotFoundProps {
  contentId: string;
}

const ContentNotFound: FC<ContentNotFoundProps> = ({ contentId }) => {
  return (
    <div className="rounded-md bg-red-100 p-4 text-red-700">
      ❌ Content not found: {contentId}
    </div>
  );
};

export default ContentNotFound;
