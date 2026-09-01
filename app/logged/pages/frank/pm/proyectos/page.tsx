"use client";

import { FC, useEffect } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

const FrankPmProyectosPage: FC = () => {
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    setPageMeta({
      pageTitle: "Proyectos",
      breadcrumbs: [
        { label: "Frank" },
        { label: "PM" },
        { label: "Proyectos" },
      ],
      buttons: [],
    });
  }, [setPageMeta]);

  return (
    <PageContentSection>
      <div className="flex w-full flex-col gap-3 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Proyectos</h1>
        <p className="text-sm text-gray-600">Pagina de proyectos de PM.</p>
      </div>
    </PageContentSection>
  );
};

export default FrankPmProyectosPage;
