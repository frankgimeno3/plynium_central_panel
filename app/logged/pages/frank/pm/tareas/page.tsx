"use client";

import { FC, useEffect } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

const FrankPmTareasPage: FC = () => {
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    setPageMeta({
      pageTitle: "Tareas",
      breadcrumbs: [
        { label: "Frank" },
        { label: "PM" },
        { label: "Tareas" },
      ],
      buttons: [],
    });
  }, [setPageMeta]);

  return (
    <PageContentSection>
      <div className="flex w-full flex-col gap-3 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Tareas</h1>
        <p className="text-sm text-gray-600">Pagina de tareas de PM.</p>
      </div>
    </PageContentSection>
  );
};

export default FrankPmTareasPage;
