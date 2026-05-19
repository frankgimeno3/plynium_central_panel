"use client";

import React, { FC } from "react";
import type { ProjectRow } from "./types";

type ProjectSelectModalTableProps = {
  loading: boolean;
  loadError: string | null;
  projects: ProjectRow[];
  selectedProject: ProjectRow | null;
  currentProjectId: string | null;
  onSelectProject: (project: ProjectRow) => void;
  /** When true, contract is fixed by context — hide the Contract column. */
  hideContractColumn?: boolean;
};

const ProjectSelectModalTable: FC<ProjectSelectModalTableProps> = ({
  loading,
  loadError,
  projects,
  selectedProject,
  currentProjectId,
  onSelectProject,
  hideContractColumn = false,
}) => (
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
          {hideContractColumn ? null : (
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contract
            </th>
          )}
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Publication
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan={hideContractColumn ? 5 : 6} className="px-4 py-5 text-center text-gray-500">
              Loading projects…
            </td>
          </tr>
        ) : loadError ? (
          <tr>
            <td colSpan={hideContractColumn ? 5 : 6} className="px-4 py-5 text-center">
              <p className="text-amber-700 font-medium">Could not load projects</p>
              <p className="text-sm text-gray-600 mt-1">{loadError}</p>
            </td>
          </tr>
        ) : projects.length === 0 ? (
          <tr>
            <td colSpan={hideContractColumn ? 5 : 6} className="px-4 py-5 text-center text-gray-500">
              No projects found.
            </td>
          </tr>
        ) : (
          projects.map((project) => {
            const isSelected = selectedProject?.id_project === project.id_project;
            const isCurrent = currentProjectId === project.id_project;
            return (
              <tr
                key={project.id_project}
                onClick={() => onSelectProject(project)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-100 hover:bg-blue-100"
                    : isCurrent
                      ? "bg-amber-50 hover:bg-amber-100"
                      : "hover:bg-gray-100"
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                  {project.id_project}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{project.title || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {project.status || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                  {project.service || "—"}
                </td>
                {hideContractColumn ? null : (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {project.id_contract || "—"}
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {project.publication_id || "—"}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export default ProjectSelectModalTable;
