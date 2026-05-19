"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import ContractSelectModalFilters from "./modal_project_select_components/ContractSelectModalFilters";
import ContractSelectModalTable from "./modal_project_select_components/ContractSelectModalTable";
import ProjectSelectModalFilters from "./modal_project_select_components/ProjectSelectModalFilters";
import ProjectSelectModalTable from "./modal_project_select_components/ProjectSelectModalTable";
import ProjectSelectModalPagination from "./modal_project_select_components/ProjectSelectModalPagination";
import ProjectSelectModalFooter from "./modal_project_select_components/ProjectSelectModalFooter";
import { DEFAULT_PAGE_SIZE } from "./modal_project_select_components/constants";
import type {
  ContractRow,
  ContractSelectFilter,
  ProjectRow,
  ProjectSelectFilter,
  ProjectSelectModalProps,
} from "./modal_project_select_components/types";

export type { ProjectRow };

const INITIAL_PROJECT_FILTER: ProjectSelectFilter = {
  id: "",
  title: "",
  status: "",
  service: "",
  contract: "",
};

const INITIAL_CONTRACT_FILTER: ContractSelectFilter = {
  id: "",
  title: "",
  customer: "",
  processState: "",
  paymentState: "",
};

function normalizeContractRow(raw: unknown): ContractRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id_contract ?? "").trim();
  if (!id) return null;
  return {
    id_contract: id,
    id_proposal: String(o.id_proposal ?? "").trim(),
    id_customer: String(o.id_customer ?? "").trim(),
    agent: String(o.agent ?? "").trim(),
    process_state: String(o.process_state ?? "").trim(),
    payment_state: String(o.payment_state ?? "").trim(),
    title: String(o.title ?? "").trim(),
    amount_eur: typeof o.amount_eur === "number" && Number.isFinite(o.amount_eur) ? o.amount_eur : 0,
  };
}

function normalizeProjectRow(raw: unknown): ProjectRow | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const id = String(p.id_project ?? p.project_id ?? "").trim();
  if (!id) return null;
  return {
    id_project: id,
    id_contract: String(p.id_contract ?? p.contract_id ?? "").trim(),
    title: String(p.title ?? p.project_title ?? "").trim(),
    status: String(p.status ?? p.project_status ?? "").trim(),
    service: String(p.service ?? p.service_id ?? "").trim(),
    publication_date:
      p.publication_date != null && p.publication_date !== ""
        ? String(p.publication_date)
        : p.project_publication_date != null && p.project_publication_date !== ""
          ? String(p.project_publication_date)
          : null,
    publication_id: String(p.publication_id ?? "").trim() || null,
    publication_slot_id:
      p.publication_slot_id != null && Number.isFinite(Number(p.publication_slot_id))
        ? Number(p.publication_slot_id)
        : null,
  };
}

/**
 * Modal to pick a project for a publication slot.
 *
 * Two steps: (1) search and select a contract, (2) pick a project under that contract.
 * Uses `GET /api/v1/contracts` and `GET /api/v1/contracts/:id` (projects included).
 */
const ProjectSelectModal: FC<ProjectSelectModalProps> = ({
  open,
  onClose,
  onSelectProject,
  pageSize: pageSizeProp,
  confirmLabel = "Select project",
  currentProjectId = null,
  overlayZIndexClass = "z-50",
}) => {
  const pageSize = pageSizeProp ?? DEFAULT_PAGE_SIZE;
  const [step, setStep] = useState<1 | 2>(1);
  const [allContracts, setAllContracts] = useState<ContractRow[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsLoadError, setContractsLoadError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);
  const [contractFilter, setContractFilter] = useState<ContractSelectFilter>(INITIAL_CONTRACT_FILTER);

  const [contractProjects, setContractProjects] = useState<ProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsLoadError, setProjectsLoadError] = useState<string | null>(null);
  const [advancingToProjects, setAdvancingToProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectSelectFilter>(INITIAL_PROJECT_FILTER);
  /** Separate pagination per step avoids feedback loops between `currentPage` and `totalPages`. */
  const [contractPage, setContractPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);

  const loadContracts = useCallback(async () => {
    setContractsLoading(true);
    setContractsLoadError(null);
    try {
      const res = await fetch("/api/v1/contracts", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load contracts (${res.status})`);
      const data = (await res.json()) as unknown[];
      const list = Array.isArray(data)
        ? data.map(normalizeContractRow).filter((c): c is ContractRow => c != null)
        : [];
      setAllContracts(list);
    } catch (err) {
      setAllContracts([]);
      const message = err instanceof Error ? err.message : "Could not load contracts.";
      setContractsLoadError(message);
    } finally {
      setContractsLoading(false);
    }
  }, []);

  const loadProjectsForContract = useCallback(async (contract: ContractRow) => {
    setProjectsLoading(true);
    setProjectsLoadError(null);
    setContractProjects([]);
    try {
      const res = await fetch(`/api/v1/contracts/${encodeURIComponent(contract.id_contract)}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
      const body = (await res.json()) as { projects?: unknown[] };
      const raw = Array.isArray(body?.projects) ? body.projects : [];
      setContractProjects(raw.map(normalizeProjectRow).filter((p): p is ProjectRow => p != null));
    } catch (err) {
      setContractProjects([]);
      const message = err instanceof Error ? err.message : "Could not load projects for this contract.";
      setProjectsLoadError(message);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadContracts();
  }, [open, loadContracts]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedContract(null);
      setSelectedProject(null);
      setContractProjects([]);
      setContractFilter(INITIAL_CONTRACT_FILTER);
      setProjectFilter(INITIAL_PROJECT_FILTER);
      setContractPage(1);
      setProjectPage(1);
      setContractsLoadError(null);
      setProjectsLoadError(null);
      setAdvancingToProjects(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !currentProjectId) return;
    let cancelled = false;
    void (async () => {
      try {
        const pr = await fetch(`/api/v1/projects/${encodeURIComponent(currentProjectId)}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!pr.ok || cancelled) return;
        const project = (await pr.json()) as ProjectRow;
        const cid = String(project?.id_contract ?? "").trim();
        if (!cid || cancelled) return;
        const cr = await fetch(`/api/v1/contracts/${encodeURIComponent(cid)}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!cr.ok || cancelled) return;
        const body = (await cr.json()) as { contract?: unknown; projects?: unknown[] };
        const contract = normalizeContractRow(body?.contract);
        if (!contract || cancelled) return;
        const projects = Array.isArray(body?.projects)
          ? body.projects.map(normalizeProjectRow).filter((p): p is ProjectRow => p != null)
          : [];
        if (cancelled) return;
        setSelectedContract(contract);
        setContractProjects(projects);
        setStep(2);
        const match = projects.find((p) => p.id_project === currentProjectId);
        setSelectedProject(match ?? null);
        setProjectFilter({ ...INITIAL_PROJECT_FILTER, contract: "" });
        setContractPage(1);
        setProjectPage(1);
      } catch {
        /* stay on step 1 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, currentProjectId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filteredContracts = useMemo(() => {
    let list = [...allContracts];
    if (contractFilter.id)
      list = list.filter((c) => c.id_contract.toLowerCase().includes(contractFilter.id.toLowerCase()));
    if (contractFilter.title)
      list = list.filter((c) => (c.title || "").toLowerCase().includes(contractFilter.title.toLowerCase()));
    if (contractFilter.customer)
      list = list.filter((c) =>
        (c.id_customer || "").toLowerCase().includes(contractFilter.customer.toLowerCase())
      );
    if (contractFilter.processState)
      list = list.filter((c) =>
        (c.process_state || "").toLowerCase().includes(contractFilter.processState.toLowerCase())
      );
    if (contractFilter.paymentState)
      list = list.filter((c) =>
        (c.payment_state || "").toLowerCase().includes(contractFilter.paymentState.toLowerCase())
      );
    return list;
  }, [allContracts, contractFilter]);

  const filteredProjects = useMemo(() => {
    let list = [...contractProjects];
    if (projectFilter.id)
      list = list.filter((p) => p.id_project.toLowerCase().includes(projectFilter.id.toLowerCase()));
    if (projectFilter.title)
      list = list.filter((p) => (p.title || "").toLowerCase().includes(projectFilter.title.toLowerCase()));
    if (projectFilter.status)
      list = list.filter((p) =>
        (p.status || "").toLowerCase().includes(projectFilter.status.toLowerCase())
      );
    if (projectFilter.service)
      list = list.filter((p) =>
        (p.service || "").toLowerCase().includes(projectFilter.service.toLowerCase())
      );
    return list;
  }, [contractProjects, projectFilter]);

  const contractTotalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
  const projectTotalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));

  const safeContractPage = Math.min(contractPage, contractTotalPages);
  const safeProjectPage = Math.min(projectPage, projectTotalPages);

  const paginatedContracts = useMemo(() => {
    const start = (safeContractPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, safeContractPage, pageSize]);

  const paginatedProjects = useMemo(() => {
    const start = (safeProjectPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safeProjectPage, pageSize]);

  useEffect(() => {
    setContractPage(1);
  }, [
    contractFilter.id,
    contractFilter.title,
    contractFilter.customer,
    contractFilter.processState,
    contractFilter.paymentState,
  ]);

  useEffect(() => {
    setProjectPage(1);
  }, [projectFilter.id, projectFilter.title, projectFilter.status, projectFilter.service]);

  const handleConfirmProject = () => {
    if (!selectedProject) return;
    onSelectProject(selectedProject);
    onClose();
  };

  const handleNextToProjects = async () => {
    if (!selectedContract || advancingToProjects) return;
    setSelectedProject(null);
    setProjectFilter({ ...INITIAL_PROJECT_FILTER, contract: "" });
    setProjectPage(1);
    setAdvancingToProjects(true);
    try {
      await loadProjectsForContract(selectedContract);
      setStep(2);
    } finally {
      setAdvancingToProjects(false);
    }
  };

  const handleBackToContracts = () => {
    setStep(1);
    setSelectedProject(null);
    setContractProjects([]);
    setProjectsLoadError(null);
    setProjectFilter(INITIAL_PROJECT_FILTER);
    setProjectPage(1);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const modalTitle = step === 1 ? "Select contract" : "Select project";

  return (
    <div
      className={`fixed inset-0 ${overlayZIndexClass} flex items-center justify-center bg-black/50`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="project-select-modal-title" className="text-xl font-bold text-gray-800">
            {modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {step === 1 ? (
            <p className="text-sm text-gray-600">
              First, find and select the contract. On the next step you will choose a project linked to
              that contract. The slot&apos;s customer follows the contract&apos;s customer.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Choose a project under the selected contract. The slot will be assigned to this
                project.
              </p>
              {selectedContract ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                  <span className="text-gray-500">Contract: </span>
                  <span className="font-mono font-medium">{selectedContract.id_contract}</span>
                  {selectedContract.title ? (
                    <span className="text-gray-700"> · {selectedContract.title}</span>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {currentProjectId ? (
            <p className="text-xs text-gray-500">
              Current project:{" "}
              <span className="font-mono text-gray-700">{currentProjectId}</span>
            </p>
          ) : null}

          {step === 1 ? (
            <>
              <ContractSelectModalFilters filter={contractFilter} onFilterChange={setContractFilter} />
              <ContractSelectModalTable
                loading={contractsLoading}
                loadError={contractsLoadError}
                contracts={paginatedContracts}
                selectedContract={selectedContract}
                onSelectContract={setSelectedContract}
              />
            </>
          ) : (
            <>
              <ProjectSelectModalFilters
                filter={projectFilter}
                onFilterChange={setProjectFilter}
                omitContractField
              />
              <ProjectSelectModalTable
                loading={projectsLoading}
                loadError={projectsLoadError}
                projects={paginatedProjects}
                selectedProject={selectedProject}
                currentProjectId={currentProjectId ?? null}
                onSelectProject={setSelectedProject}
                hideContractColumn
              />
            </>
          )}

          {step === 1 ? (
            <ProjectSelectModalPagination
              currentPage={safeContractPage}
              totalPages={contractTotalPages}
              onPageChange={setContractPage}
            />
          ) : (
            <ProjectSelectModalPagination
              currentPage={safeProjectPage}
              totalPages={projectTotalPages}
              onPageChange={setProjectPage}
            />
          )}

          {step === 1 ? (
            <ProjectSelectModalFooter
              confirmLabel={advancingToProjects ? "Loading…" : "Continue"}
              canConfirm={!!selectedContract && !contractsLoading && !advancingToProjects}
              onClose={onClose}
              onConfirm={() => void handleNextToProjects()}
            />
          ) : (
            <ProjectSelectModalFooter
              confirmLabel={confirmLabel}
              canConfirm={!!selectedProject && !projectsLoading}
              onClose={onClose}
              onConfirm={handleConfirmProject}
              onBack={handleBackToContracts}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectModal;
