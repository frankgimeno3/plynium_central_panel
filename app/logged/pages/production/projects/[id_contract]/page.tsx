"use client";

import React, { FC, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import projectsData from "@/app/contents/projects.json";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";
import servicesData from "@/app/contents/services.json";
import pmEventsData from "@/app/contents/pm_events.json";

type Project = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service?: string;
  publication_date?: string;
  publication_id?: string;
  pm_events_array?: string[];
};

type Service = { id_service: string; name: string };

type Contract = {
  id_contract: string;
  id_customer: string;
  title: string;
};

type Customer = {
  id_customer: string;
  name: string;
};

type PmEvent = {
  id_event: string;
  id_project: string;
  event_type: string;
  date: string;
  event_description: string;
  event_state: string;
};

const ProjectDetailPage: FC<{ params: Promise<{ id_contract: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_contract } = use(params);
  const project = (projectsData as Project[]).find((p) => p.id_project === id_contract);
  const services = servicesData as Service[];
  const getServiceName = (idService: string) =>
    services.find((s) => s.id_service === idService)?.name?.replace(/_/g, " ") ?? idService;
  const contract = project
    ? (contractsData as Contract[]).find((c) => c.id_contract === project.id_contract)
    : null;
  const customer = contract
    ? (customersData as Customer[]).find((c) => c.id_customer === contract.id_customer)
    : null;

  const linkedEvents = project?.pm_events_array
    ? (pmEventsData as PmEvent[]).filter((e) => project.pm_events_array!.includes(e.id_event))
    : [];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (project) {
      setPageMeta({
        pageTitle: `Project: ${project.title}`,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Projects", href: "/logged/pages/production/projects" },
          { label: project.title },
        ],
        buttons: [{ label: "Back to Projects", href: "/logged/pages/production/projects" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Project not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/projects" },
          { label: "Projects", href: "/logged/pages/production/projects" },
        ],
        buttons: [{ label: "Back to Projects", href: "/logged/pages/production/projects" }],
      });
    }
  }, [setPageMeta, project]);

  if (!project) {
    return (
      <>
        <PageContentSection>
          <p className="text-gray-500">Project not found.</p>
        </PageContentSection>
      </>
    );
  }

  const statusColors: Record<string, string> = {
    calendarized: "bg-gray-100 text-gray-800",
    pending_materials: "bg-amber-100 text-amber-800",
    ok_production: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  const eventTypeLabel: Record<string, string> = {
    ask_materials: "Ask materials",
    send_preview: "Send preview",
    publication_date: "Publication date",
  };

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/projects" },
    { label: "Projects", href: "/logged/pages/production/projects" },
    { label: project.title },
  ];

  return (
    <>
      <PageContentSection>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{project.id_project}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Service</p>
            <p className="font-medium">{project.service ? getServiceName(project.service) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-sm ${statusColors[project.status] ?? "bg-gray-100"}`}>
              {project.status.replace("_", " ")}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Publication date</p>
            <p className="font-medium">{project.publication_date ?? "—"}</p>
          </div>
          {project.publication_id && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Publication ID</p>
              <p className="font-medium">{project.publication_id}</p>
            </div>
          )}
        </div>
      </PageContentSection>

      {contract && (
        <PageContentSection>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Contract</p>
            <Link href={`/logged/pages/account-management/contracts/${contract.id_contract}`} className="text-blue-600 hover:underline">
              {contract.title} ({contract.id_contract})
            </Link>
          </div>
        </PageContentSection>
      )}

      {customer && (
        <PageContentSection>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
            <Link href={`/logged/pages/account-management/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline">
              {customer.name}
            </Link>
          </div>
        </PageContentSection>
      )}

      {linkedEvents.length > 0 && (
        <PageContentSection>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-4">Events</p>
            <div className="space-y-2">
              {linkedEvents
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((ev) => (
                  <div key={ev.id_event} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{eventTypeLabel[ev.event_type] ?? ev.event_type}</p>
                      <p className="text-xs text-gray-500">{ev.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${ev.event_state === "done" ? "bg-green-100" : "bg-amber-100"}`}>
                      {ev.event_state}
                    </span>
                  </div>
                ))}
            </div>
            <Link href="/logged" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              View in Dashboard →
            </Link>
          </div>
        </PageContentSection>
      )}
    </>
  );
};

export default ProjectDetailPage;
