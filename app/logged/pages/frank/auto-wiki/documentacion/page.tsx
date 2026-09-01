"use client";

import { FC, useEffect } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

const FrankAutoWikiDocumentacionPage: FC = () => {
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    setPageMeta({
      pageTitle: "Documentación",
      breadcrumbs: [
        { label: "Frank" },
        { label: "Auto-Wiki" },
        { label: "Documentación" },
      ],
      buttons: [],
    });
  }, [setPageMeta]);

  return (
    <PageContentSection>
      <div className="flex w-full flex-col gap-3 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Documentación</h1>
        <p className="text-sm text-gray-600">Página de documentación de Auto-Wiki.</p>
      </div>
    </PageContentSection>
  );
};

export default FrankAutoWikiDocumentacionPage;
