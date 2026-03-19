"use client";

import React, { FC, use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";
import { CustomerService } from "@/app/service/CustomerService";
import { ProjectService } from "@/app/service/ProjectService";
import { ContractService } from "@/app/service/ContractService";
import { PmEventService } from "@/app/service/PmEventService";

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

const ProjectDetailPage: FC<{ params: Promise<{ id_project: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_project } = use(params);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [linkedEvents, setLinkedEvents] = useState<PmEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l: Customer[]) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
  }, []);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const p = await ProjectService.getProjectById(id_project);
      setProject(p ?? null);
      if (p?.id_contract) {
        const c = await ContractService.getContractById(p.id_contract);
        setContract(c?.contract ?? null);
      } else {
        setContract(null);
      }
      const events = await PmEventService.getPmEventsByProjectId(id_project);
      setLinkedEvents(Array.isArray(events) ? events : []);
    } catch {
      setProject(null);
      setContract(null);
      setLinkedEvents([]);
    } finally {
      setLoading(false);
    }
  }, [id_project]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => {
    ServiceService.getAllServices().then((list) => setServices(Array.isArray(list) ? list : [])).catch(() => setServices([]));
  }, []);
  const getServiceName = (idService: string) =>
    services.find((s) => s.id_service === idService)?.name?.replace(/_/g, " ") ?? idService;
  const customer = contract
    ? customers.find((c) => c.id_customer === contract.id_customer)
    : null;

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (project) {
      setPageMeta({
        pageTitle: `Project: ${project.title}`,
        breadcrumbs: [
          { label: "Account Management", href: "/logged/pages/account-management" },
          { label: "Projects", href: "/logged/pages/account-management/projects" },
          { label: project.title },
        ],
        buttons: [{ label: "Back to Projects", href: "/logged/pages/account-management/projects" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Project not found",
        breadcrumbs: [
          { label: "Account Management", href: "/logged/pages/account-management" },
          { label: "Projects", href: "/logged/pages/account-management/projects" },
        ],
        buttons: [{ label: "Back to Projects", href: "/logged/pages/account-management/projects" }],
      });
    }
  }, [setPageMeta, project]);

  if (!project) {
    return (
      <>
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
              <p className="text-gray-500">{loading ? "Loading project…" : "Project not found."}</p>
            </div>
          </div>
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
    { label: "Account Management", href: "/logged/pages/account-management" },
    { label: "Projects", href: "/logged/pages/account-management/projects" },
    { label: project.title },
  ];

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
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
          </div>
        </div>
      </PageContentSection>

      {contract && (
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Contract</p>
            <Link href={`/logged/pages/account-management/contracts/${contract.id_contract}`} className="text-blue-600 hover:underline">
              {contract.title} ({contract.id_contract})
            </Link>
          </div>
            </div>
          </div>
        </PageContentSection>
      )}

      {customer && (
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
            <Link href={`/logged/pages/account-management/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline">
              {customer.name}
            </Link>
          </div>
            </div>
          </div>
        </PageContentSection>
      )}

      {linkedEvents.length > 0 && (
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-4">Project Tasks</p>
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
            </div>
          </div>
        </PageContentSection>
      )}
    </>
  );
};

export default ProjectDetailPage;
