"use client";

import React from "react";
import Link from "next/link";
import type { Newsletter, NewsletterCampaign } from "@/app/contents/interfaces";
const BASE = "/logged/pages/production/newsletters";
const CONTRACT_BASE = "/logged/pages/account-management/contracts";

export type NewsletterDataDraft = {
  publicationDate: string;
  topic: string;
  status: Newsletter["status"];
  assignedListIds: string[];
};

type AssignedListCard = {
  id: string;
  name: string;
  subscriberCount: number | null;
};

export type NewsletterRelatedProject = {
  project_id: string;
  contract_id: string;
  project_title: string;
  project_status: string;
  service_id: string;
  service_full_name: string | null;
  project_publication_date: string | null;
  customer_name: string;
  contract_title: string;
};

type DataTabProps = {
  draft: NewsletterDataDraft;
  onDraftChange: (patch: Partial<NewsletterDataDraft>) => void;
  campaign: NewsletterCampaign | null;
  campaignId: string;
  portalCode: string;
  realPublicationDate?: string;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  assignedLists: AssignedListCard[];
  relatedProjects: NewsletterRelatedProject[];
  onOpenSelectLists: () => void;
  onRequestUnassignList: (list: AssignedListCard) => void;
};

const statusOptions: Array<{ value: Newsletter["status"]; label: string }> = [
  { value: "calendarized", label: "Calendarized" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
];

export function DataTab({
  draft,
  onDraftChange,
  campaign,
  campaignId,
  portalCode,
  realPublicationDate,
  autoSaveStatus,
  saveError,
  assignedLists,
  relatedProjects,
  onOpenSelectLists,
  onRequestUnassignList,
}: DataTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Newsletter data</h2>
        <p className="text-xs text-gray-500">
          {autoSaveStatus === "saving" && "Saving…"}
          {autoSaveStatus === "saved" && "Saved"}
          {autoSaveStatus === "error" && "Save failed"}
        </p>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">{saveError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">Publication date</label>
          <input
            type="date"
            value={draft.publicationDate}
            onChange={(event) => onDraftChange({ publicationDate: event.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {realPublicationDate ? (
          <div>
            <p className="text-xs text-gray-500 uppercase">Real publication date</p>
            <p className="font-medium text-gray-900">{realPublicationDate}</p>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 uppercase mb-1">Topic</label>
          <input
            type="text"
            value={draft.topic}
            onChange={(event) => onDraftChange({ topic: event.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase">Campaign</p>
          <p className="font-medium text-gray-900">
            {campaign ? (
              <a href={`${BASE}/campaigns/${campaign.id}`} className="text-blue-600 hover:underline">
                {campaign.name}
              </a>
            ) : (
              campaignId
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase">Portal</p>
          <p className="font-medium text-gray-900">{portalCode}</p>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs text-gray-500 uppercase">User newsletter lists</p>
            <button
              type="button"
              onClick={onOpenSelectLists}
              className="px-3 py-1.5 text-sm font-medium text-blue-950 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              Select lists
            </button>
          </div>
          {assignedLists.length === 0 ? (
            <p className="text-sm text-gray-500">No user newsletter lists assigned.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignedLists.map((list) => (
                <div key={list.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{list.name}</p>
                      <p className="mt-1 text-xs font-mono text-gray-600">{list.id}</p>
                      {list.subscriberCount != null ? (
                        <p className="mt-2 text-sm text-gray-600">
                          Subscribers: <span className="font-semibold text-gray-900">{list.subscriberCount}</span>
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRequestUnassignList(list)}
                      className="text-gray-500 hover:text-red-600 p-1"
                      aria-label={`Unassign ${list.name}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <p className="mb-2 text-xs text-gray-500 uppercase">Projects</p>
          {relatedProjects.length === 0 ? (
            <p className="text-sm text-gray-500">No related projects for this newsletter.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {relatedProjects.map((project) => (
                <Link
                  key={project.project_id}
                  href={`${CONTRACT_BASE}/${encodeURIComponent(project.contract_id)}`}
                  className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {project.project_title || "Untitled project"}
                  </p>
                  <p className="mt-1 text-xs font-mono text-gray-600">{project.project_id}</p>
                  {project.contract_title ? (
                    <p className="mt-2 text-sm text-gray-700">{project.contract_title}</p>
                  ) : null}
                  {project.customer_name ? (
                    <p className="mt-1 text-sm text-gray-600">{project.customer_name}</p>
                  ) : null}
                  <p className="mt-2 text-xs uppercase tracking-wide text-blue-950">
                    {project.service_full_name || project.service_id || "Project"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Status: <span className="font-medium text-gray-800">{project.project_status}</span>
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">Status</label>
          <select
            value={draft.status}
            onChange={(event) => onDraftChange({ status: event.target.value as Newsletter["status"] })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
