"use client";

import React, { FC, use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { fetchFlatplans, getFlatplans } from "@/app/contents/publicationsHelpers";
import type { Flatplan, FlatplanSlot } from "@/app/contents/interfaces";
import { CustomerService } from "@/app/service/CustomerService";
import { ProjectService } from "@/app/service/ProjectService";

const BASE = "/logged/pages/production/publications/flatplans";

const SLOT_ORDER: (keyof Flatplan)[] = [
  "cover",
  "inside_cover",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "end",
];

function slotLabel(key: string): string {
  if (key === "cover") return "Página 0 (Portada)";
  if (key === "inside_cover") return "Contracubierta";
  if (key === "end") return "Contraportada";
  return `Página ${key}`;
}

/** Placeholder article/editorial content for demo when slot has article. */
const SAMPLE_ARTICLE = {
  title: "Innovación en el vidrio arquitectónico",
  subtitle: "Tendencias y soluciones para fachadas y cerramientos",
  lead: "El sector del vidrio estructural sigue evolucionando hacia soluciones más ligeras, seguras y sostenibles. Repasamos los avances recientes y las expectativas para los próximos años.",
  body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Las empresas líderes del sector apuestan por I+D y por acuerdos con centros tecnológicos para ofrecer productos cada vez más adaptados a la normativa y a las demandas de los prescriptores.",
  author: "Redacción Glass Today",
  date: "Marzo 2025",
};

/** Placeholder ad content for demo when slot has advert/cover/inside_cover/end. */
const SAMPLE_AD = {
  headline: "Vidrios del Norte",
  tagline: "Calidad y servicio en distribución de vidrio",
  cta: "Visita nuestra web",
  imagePlaceholder: "https://placehold.co/600x400/e2e8f0/64748b?text=Anuncio",
};

const FlatplanPageDetailPage: FC<{
  params: Promise<{ id_flatplan: string; id_flatplan_page: string }>;
}> = ({ params }) => {
  const { id_flatplan, id_flatplan_page } = use(params);
  const [publicationsData, setPublicationsData] = useState<import("@/app/contents/interfaces").PublicationUnified[]>([]);

  useEffect(() => {
    fetchFlatplans()
      .then(setPublicationsData)
      .catch(() => setPublicationsData([]));
  }, []);

  const flatplans = React.useMemo(() => getFlatplans(publicationsData), [publicationsData]);
  const flatplan = flatplans.find((f) => f.id_flatplan === id_flatplan);
  const [projects, setProjects] = useState<{ id_project: string; title: string }[]>([]);
  const loadProjects = useCallback(async () => {
    try {
      const list = await ProjectService.getAllProjects();
      setProjects(Array.isArray(list) ? list : []);
    } catch {
      setProjects([]);
    }
  }, []);
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  const [customers, setCustomers] = useState<{ id_customer: string; name: string }[]>([]);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
  }, []);

  const isValidSlot = SLOT_ORDER.includes(id_flatplan_page as keyof Flatplan);
  const slot = flatplan && isValidSlot
    ? (flatplan as unknown as Record<string, FlatplanSlot>)[id_flatplan_page]
    : undefined;

  const { setPageMeta } = usePageContent();
  React.useEffect(() => {
    const pageTitle = flatplan
      ? `${slotLabel(id_flatplan_page)} — ${flatplan.edition_name}`
      : "Página no encontrada";
    setPageMeta({
      pageTitle,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: BASE },
        { label: "Flatplans", href: BASE },
        { label: flatplan?.edition_name ?? id_flatplan, href: `${BASE}/${id_flatplan}` },
        { label: slotLabel(id_flatplan_page) },
      ],
    });
  }, [setPageMeta, flatplan, id_flatplan, id_flatplan_page]);

  if (!flatplan) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-500">Flatplan no encontrado.</p>
          <Link href={BASE} className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Volver a Flatplans
          </Link>
        </div>
      </PageContentSection>
    );
  }

  if (!isValidSlot) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-500">Página del planillo no válida.</p>
          <Link href={`${BASE}/${id_flatplan}`} className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Volver al planillo
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const customerName = slot?.id_advertiser
    ? customers.find((c) => c.id_customer === slot.id_advertiser)?.name ?? slot.id_advertiser
    : null;
  const projectTitle = slot?.id_project
    ? projects.find((p) => p.id_project === slot.id_project)?.title ?? slot.id_project
    : null;

  const isArticle = slot?.content_type === "article";

  return (
    <PageContentSection>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 text-sm text-gray-500">
          {flatplan.edition_name} · {slotLabel(id_flatplan_page)}
          {slot && (
            <>
              {" · "}
              <span className="capitalize">{slot.content_type}</span>
              {slot.state && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {slot.state}
                </span>
              )}
            </>
          )}
        </div>

        {!slot ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-500">Esta página del planillo aún no tiene contenido asignado.</p>
            <Link
              href={`${BASE}/${id_flatplan}`}
              className="mt-4 inline-block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Asignar contenido desde el planillo
            </Link>
          </div>
        ) : isArticle ? (
          <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {SAMPLE_ARTICLE.title}
              </h1>
              <p className="text-lg text-gray-600 mb-4">{SAMPLE_ARTICLE.subtitle}</p>
              <p className="text-gray-700 leading-relaxed mb-6">{SAMPLE_ARTICLE.lead}</p>
              <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap">
                {SAMPLE_ARTICLE.body}
              </div>
              <footer className="mt-8 pt-4 border-t border-gray-100 text-sm text-gray-500">
                {SAMPLE_ARTICLE.author} · {SAMPLE_ARTICLE.date}
              </footer>
              {projectTitle && (
                <p className="mt-4 text-xs text-gray-400">
                  Proyecto: {projectTitle}
                  {customerName && ` · Anunciante: ${customerName}`}
                </p>
              )}
            </div>
          </article>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="aspect-[3/2] bg-gray-100 flex items-center justify-center overflow-hidden">
              {slot.image_src ? (
                <img
                  src={slot.image_src}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={SAMPLE_AD.imagePlaceholder}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">{SAMPLE_AD.headline}</h2>
              <p className="text-gray-600 mt-1">{SAMPLE_AD.tagline}</p>
              <p className="mt-4 text-sm font-medium text-blue-600">{SAMPLE_AD.cta}</p>
              {customerName && (
                <p className="mt-4 text-sm text-gray-500">Anunciante: {customerName}</p>
              )}
              {projectTitle && (
                <p className="text-xs text-gray-400 mt-1">Proyecto: {projectTitle}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContentSection>
  );
};

export default FlatplanPageDetailPage;
