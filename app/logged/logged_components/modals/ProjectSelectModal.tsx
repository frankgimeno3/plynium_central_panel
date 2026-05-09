"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

export interface ProjectRow {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service: string;
  publication_date: string | null;
  publication_id: string | null;
  publication_slot_id: number | null;
}

const DEFAULT_PAGE_SIZE = 10;

interface ProjectSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (project: ProjectRow) => void;
  /** Page size for the table (default 10). */
  pageSize?: number;
  /** Confirm button label (default "Select project"). */
  confirmLabel?: string;
  /** When provided, this id_project is rendered as the current selection. */
  currentProjectId?: string | null;
}

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
  const [filter, setFilter] = useState({
    id: "",
    title: "",
    status: "",
    service: "",
    contract: "",
  });
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
      setFilter({ id: "", title: "", status: "", service: "", contract: "" });
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
            Pick a project to assign to this slot. The slot's customer will be set to the
            customer of the project's contract.
          </p>

          {currentProjectId ? (
            <p className="text-xs text-gray-500">
              Current selection:{" "}
              <span className="font-mono text-gray-700">{currentProjectId}</span>
            </p>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={filter.title}
                onChange={(e) => setFilter((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by title"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <input
                type="text"
                value={filter.status}
                onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by status"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Service</label>
              <input
                type="text"
                value={filter.service}
                onChange={(e) => setFilter((f) => ({ ...f, service: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by service"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Contract</label>
              <input
                type="text"
                value={filter.contract}
                onChange={(e) => setFilter((f) => ({ ...f, contract: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by contract"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publication
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-5 text-center text-gray-500">
                      Loading projects…
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-5 text-center">
                      <p className="text-amber-700 font-medium">Could not load projects</p>
                      <p className="text-sm text-gray-600 mt-1">{loadError}</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-5 text-center text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => {
                    const isSelected = selectedProject?.id_project === p.id_project;
                    const isCurrent = currentProjectId === p.id_project;
                    return (
                      <tr
                        key={p.id_project}
                        onClick={() => setSelectedProject(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-100 hover:bg-blue-100"
                            : isCurrent
                              ? "bg-amber-50 hover:bg-amber-100"
                              : "hover:bg-gray-100"
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                          {p.id_project}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{p.title || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {p.status || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {p.service || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {p.id_contract || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {p.publication_id || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedProject}
              className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectModal;
