"use client";

import { FC, useEffect } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

const FrankAutoWikiEstadoActualTemasPage: FC = () => {
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    setPageMeta({
      pageTitle: "Estado actual temas",
      breadcrumbs: [
        { label: "Frank" },
        { label: "Auto-Wiki" },
        { label: "Estado actual temas" },
      ],
      buttons: [],
    });
  }, [setPageMeta]);

  return (
    <PageContentSection>
      <div className="flex w-full flex-col gap-3 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Estado actual temas</h1>
        <p className="text-sm text-gray-600">Página de estado actual de temas de Auto-Wiki.</p>
      </div>
    </PageContentSection>
  );
};

export default FrankAutoWikiEstadoActualTemasPage;
