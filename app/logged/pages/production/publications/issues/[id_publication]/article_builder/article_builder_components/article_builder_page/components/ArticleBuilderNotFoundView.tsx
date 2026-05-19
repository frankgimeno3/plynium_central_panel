"use client";

import Link from "next/link";
import React, { FC } from "react";
import { issuePublicationSelectedContentsHref } from "../issueNavigation";

type ArticleBuilderNotFoundViewProps = {
  idPublication: string;
  error: string | null;
};

export const ArticleBuilderNotFoundView: FC<ArticleBuilderNotFoundViewProps> = ({
  idPublication,
  error,
}) => (
  <div className="p-6 text-center">
    <p className="text-gray-600">{error ?? "publication_article not found."}</p>
    <Link
      href={issuePublicationSelectedContentsHref(idPublication)}
      className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Back to publication
    </Link>
  </div>
);
