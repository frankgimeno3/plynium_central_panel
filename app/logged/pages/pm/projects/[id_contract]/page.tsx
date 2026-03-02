"use client";

import React, { FC, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import projectsData from "@/app/contents/projects.json";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";

type Project = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
};

type Contract = {
  id_contract: string;
  id_customer: string;
  title: string;
};

type Customer = {
  id_customer: string;
  name: string;
};

const ProjectDetailPage: FC<{ params: Promise<{ id_contract: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_contract } = use(params);
  // id_contract param holds the project id when viewing a project
  const project = (projectsData as Project[]).find((p) => p.id_project === id_contract);
  const contract = project
    ? (contractsData as Contract[]).find((c) => c.id_contract === project.id_contract)
    : null;
  const customer = contract
    ? (customersData as Customer[]).find((c) => c.id_customer === contract.id_customer)
    : null;

  if (!project) {
    return (
      <div className="flex flex-col w-full p-12">
        <p className="text-gray-500">Project not found.</p>
        <Link href="/logged/pages/pm/projects" className="text-blue-600 hover:underline mt-4">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    calendarized: "bg-gray-100 text-gray-800",
    pending_materials: "bg-amber-100 text-amber-800",
    ok_production: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/logged/pages/pm/projects")}
          className="text-white/90 hover:text-white text-sm"
        >
          ← Back
        </button>
        <p className="text-2xl">Project: {project.title}</p>
      </div>

      <div className="p-12 max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{project.id_project}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-sm ${statusColors[project.status] || "bg-gray-100"}`}>
              {project.status.replace("_", " ")}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Start date</p>
            <p className="font-medium">{project.start_date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">End date</p>
            <p className="font-medium">{project.end_date}</p>
          </div>
        </div>

        {contract && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Contract</p>
            <Link href={`/logged/pages/pm/contracts/${contract.id_contract}`} className="text-blue-600 hover:underline">
              {contract.title} ({contract.id_contract})
            </Link>
          </div>
        )}

        {customer && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
            <Link href={`/logged/pages/pm/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline">
              {customer.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
