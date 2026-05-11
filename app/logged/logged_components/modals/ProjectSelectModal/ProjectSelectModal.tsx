"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import ProjectSelectModalFilters from "./modal_project_select_components/ProjectSelectModalFilters";
import ProjectSelectModalTable from "./modal_project_select_components/ProjectSelectModalTable";
import ProjectSelectModalPagination from "./modal_project_select_components/ProjectSelectModalPagination";
import ProjectSelectModalFooter from "./modal_project_select_components/ProjectSelectModalFooter";
import { DEFAULT_PAGE_SIZE } from "./modal_project_select_components/constants";
import type {
  ProjectRow,
  ProjectSelectFilter,
  ProjectSelectModalProps,
} from "./modal_project_select_components/types";

export type { ProjectRow };

const INITIAL_FILTER: ProjectSelectFilter = {
  id: "",
  title: "",
  status: "",
  service: "",
  contract: "",
};

/**
 * Modal to pick a single project from `projects_db`.
 *
 * - Closes on backdrop click, the X button, ESC, or the Cancel button.
 * - Filters by id, title, status, service, and contract.
 * - Confirm calls `onSelectProject` with the picked row.
 */
const ProjectSelectModal: FC<ProjectSelectModalProps> = ({
  open,
  onClose,
  onSelectProject,
  pageSize: pageSizeProp,
  confirmLabel = "Select project",
  currentProjectId = null,
}) => {
  const pageSize = pageSizeProp ?? DEFAULT_PAGE_SIZE;
  const [allProjects, setAllProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [filter, setFilter] = useState<ProjectSelectFilter>(INITIAL_FILTER);
  const [currentPage, setCurrentPage] = useState(1);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/v1/projects", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
      const data = (await res.json()) as ProjectRow[];
      setAllProjects(
        Array.isArray(data) ? data.filter((p) => p && typeof p.id_project === "string") : []
      );
    } catch (err) {
      setAllProjects([]);
      const message = err instanceof Error ? err.message : "Could not load projects.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadProjects();
  }, [open, loadProjects]);

  useEffect(() => {
    if (!open) {
      setSelectedProject(null);
      setFilter(INITIAL_FILTER);
      setCurrentPage(1);
      setLoadError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    let list = [...allProjects];
    if (filter.id)
      list = list.filter((p) => p.id_project.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.title)
      list = list.filter((p) => (p.title || "").toLowerCase().includes(filter.title.toLowerCase()));
    if (filter.status)
      list = list.filter((p) =>
        (p.status || "").toLowerCase().includes(filter.status.toLowerCase())
      );
    if (filter.service)
      list = list.filter((p) =>
        (p.service || "").toLowerCase().includes(filter.service.toLowerCase())
      );
    if (filter.contract)
      list = list.filter((p) =>
        (p.id_contract || "").toLowerCase().includes(filter.contract.toLowerCase())
      );
    return list;
  }, [allProjects, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter.id, filter.title, filter.status, filter.service, filter.contract]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleConfirm = () => {
    if (!selectedProject) return;
    onSelectProject(selectedProject);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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
          <h2
            id="project-select-modal-title"
            className="text-xl font-bold text-gray-800"
          >
            Select project
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
          <p className="text-sm text-gray-600">
            {
              "Pick a project to assign to this slot. The slot's customer will be set to the customer of the project's contract."
            }
          </p>

          {currentProjectId ? (
            <p className="text-xs text-gray-500">
              Current selection:{" "}
              <span className="font-mono text-gray-700">{currentProjectId}</span>
            </p>
          ) : null}

          <ProjectSelectModalFilters filter={filter} onFilterChange={setFilter} />

          <ProjectSelectModalTable
            loading={loading}
            loadError={loadError}
            projects={paginated}
            selectedProject={selectedProject}
            currentProjectId={currentProjectId ?? null}
            onSelectProject={setSelectedProject}
          />

          <ProjectSelectModalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

          <ProjectSelectModalFooter
            confirmLabel={confirmLabel}
            canConfirm={!!selectedProject}
            onClose={onClose}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectModal;
