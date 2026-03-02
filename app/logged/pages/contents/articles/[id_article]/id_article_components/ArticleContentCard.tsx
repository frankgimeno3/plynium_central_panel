"use client";

import React, { FC, ReactNode } from "react";

interface ArticleContentCardProps {
  children: ReactNode;
}

const ArticleContentCard: FC<ArticleContentCardProps> = ({ children }) => {
  return (
    <div className="flex flex-col gap-4 rounded-md bg-gray-100 p-6 shadow">
      {children}
    </div>
  );
};

export default ArticleContentCard;
