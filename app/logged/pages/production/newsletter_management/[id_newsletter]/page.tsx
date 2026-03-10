"use client";

import React, { FC, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import plannedNewslettersData from "@/app/contents/planned_newsletters.json";

type NewsletterBanner = {
  newsletter_banner_id: string;
  id_advertiser: string;
  id_project: string;
  banner_position: number;
  image_src: string;
  image_redirection: string;
};

type NewsletterContent = {
  newsletter_content_id: string;
  id_advertiser: string;
  article_id: string;
  position: number;
  image_src: string;
  content_title: string;
  content_briefing: string;
  redirection_link: string;
};

type PlannedNewsletter = {
  id_newsletter: string;
  edition_name: string;
  theme: string;
  publication_date: string;
  header_format?: string;
  footer_format?: string;
  newsletter_banners?: NewsletterBanner[];
  newsletter_contents?: NewsletterContent[];
};

const NewsletterDetailPage: FC<{ params: Promise<{ id_newsletter: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_newsletter } = use(params);
  const newsletter = (plannedNewslettersData as PlannedNewsletter[]).find((n) => n.id_newsletter === id_newsletter);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (newsletter) {
      setPageMeta({
        pageTitle: newsletter.edition_name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Planned Newsletters", href: "/logged/pages/production/newsletter_management" },
          { label: newsletter.edition_name },
        ],
        buttons: [{ label: "Back to Planned Newsletters", href: "/logged/pages/production/newsletter_management" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Newsletter not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Planned Newsletters", href: "/logged/pages/production/newsletter_management" },
        ],
        buttons: [{ label: "Back to Planned Newsletters", href: "/logged/pages/production/newsletter_management" }],
      });
    }
  }, [setPageMeta, newsletter]);

  if (!newsletter) {
    return (
      <>
        <PageContentSection>
          <p className="text-gray-500">Newsletter not found.</p>
        </PageContentSection>
      </>
    );
  }

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/projects" },
    { label: "Planned Newsletters", href: "/logged/pages/production/newsletter_management" },
    { label: newsletter.edition_name },
  ];

  return (
    <>
      <PageContentSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{newsletter.id_newsletter}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Edition name</p>
            <p className="font-medium">{newsletter.edition_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Theme</p>
            <p className="font-medium">{newsletter.theme}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Publication date</p>
            <p className="font-medium">{newsletter.publication_date}</p>
          </div>
          {newsletter.header_format && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Header format</p>
              <p className="font-medium">{newsletter.header_format}</p>
            </div>
          )}
          {newsletter.footer_format && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Footer format</p>
              <p className="font-medium">{newsletter.footer_format}</p>
            </div>
          )}
        </div>
      </PageContentSection>

      {newsletter.newsletter_banners && newsletter.newsletter_banners.length > 0 && (
        <PageContentSection>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Banners</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {newsletter.newsletter_banners
                .sort((a, b) => a.banner_position - b.banner_position)
                .map((b) => (
                  <div key={b.newsletter_banner_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-600">{b.newsletter_banner_id}</span>
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">Position {b.banner_position}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2 text-xs text-gray-500">
                      {b.id_advertiser && <span><span className="uppercase">Advertiser:</span> <span className="font-mono">{b.id_advertiser}</span></span>}
                      {b.id_project && <span><span className="uppercase">Project:</span> <span className="font-mono">{b.id_project}</span></span>}
                    </div>
                    <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center overflow-hidden">
                      <img src={b.image_src} alt="" className="w-full h-full object-cover" />
                    </div>
                    <a href={b.image_redirection} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block" title={b.image_redirection}>
                      {b.image_redirection}
                    </a>
                  </div>
                ))}
            </div>
          </div>
        </PageContentSection>
      )}

      {newsletter.newsletter_contents && newsletter.newsletter_contents.length > 0 && (
        <PageContentSection>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contents</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {newsletter.newsletter_contents
                .sort((a, b) => a.position - b.position)
                .map((c) => (
                  <div key={c.newsletter_content_id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-600">{c.newsletter_content_id}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Position {c.position}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2 text-xs text-gray-500">
                      {c.id_advertiser && <span><span className="uppercase">Advertiser:</span> <span className="font-mono">{c.id_advertiser}</span></span>}
                      {c.article_id && <span><span className="uppercase">Article:</span> <span className="font-mono">{c.article_id}</span></span>}
                    </div>
                    <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                      <img src={c.image_src} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{c.content_title}</p>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{c.content_briefing}</p>
                    <a href={c.redirection_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block" title={c.redirection_link}>
                      {c.redirection_link}
                    </a>
                  </div>
                ))}
            </div>
          </div>
        </PageContentSection>
      )}
    </>
  );
};

export default NewsletterDetailPage;
