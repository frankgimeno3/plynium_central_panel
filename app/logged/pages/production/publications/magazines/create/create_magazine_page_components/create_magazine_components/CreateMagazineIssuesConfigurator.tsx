"use client";

import React, { FC } from "react";
import type { IssueFormRow } from "./types";
import { MAX_ISSUES_PER_YEAR } from "./constants";

type Props = {
  formNumIssues: number;
  issues: IssueFormRow[];
  monthsUsed: Set<number>;
  hasDuplicateMonths: boolean;
  onNumIssuesChange: (n: number) => void;
  doNotAutoCreateNextYearIssues: boolean;
  onDoNotAutoToggle: (checked: boolean) => void;
  setIssue: (index: number, patch: Partial<IssueFormRow>) => void;
  removeIssue: (index: number) => void;
};

export const CreateMagazineIssuesConfigurator: FC<Props> = ({
  formNumIssues,
  issues,
  monthsUsed,
  hasDuplicateMonths,
  onNumIssuesChange,
  doNotAutoCreateNextYearIssues,
  onDoNotAutoToggle,
  setIssue,
  removeIssue,
}) => (
  <div className="border-t border-gray-200 pt-6">
    <h3 className="text-base font-semibold text-gray-800 mb-3">Issues this year</h3>
    <p className="text-sm text-gray-600 mb-4">
      Enter how many issues to plan. For each issue you can mark it as a special edition and set a special edition topic.
    </p>

    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <label htmlFor="create-mag-num-issues" className="block text-xs font-medium text-gray-600 mb-1">
            Number of issues (max {MAX_ISSUES_PER_YEAR})
          </label>
          <input
            id="create-mag-num-issues"
            type="number"
            min={0}
            max={MAX_ISSUES_PER_YEAR}
            value={formNumIssues || ""}
            onChange={(e) =>
              onNumIssuesChange(Math.max(0, Math.min(MAX_ISSUES_PER_YEAR, parseInt(e.target.value, 10) || 0)))
            }
            className="w-full max-w-[120px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div className="sm:ml-auto sm:max-w-md rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-700 mb-3">
            By default, new planned issues for the next year will be created at the end of this one, unless you check the box below.
          </p>
          <label htmlFor="create-mag-auto-next-year" className="flex items-start gap-2 cursor-pointer">
            <input
              id="create-mag-auto-next-year"
              type="checkbox"
              checked={doNotAutoCreateNextYearIssues}
              onChange={(e) => onDoNotAutoToggle(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <span className="text-sm text-gray-800">Click if you DON&apos;t want new issues to be created automatically at the end of the year</span>
          </label>
          <p className="mt-3 text-xs font-medium text-gray-500 uppercase tracking-wide border-t border-blue-100 pt-3">Current state</p>
          <p
            className={`mt-1.5 inline-block rounded-md px-3 py-2 text-sm font-medium ${
              doNotAutoCreateNextYearIssues ? "bg-red-100 text-red-900" : "bg-green-100 text-green-900"
            }`}
          >
            {doNotAutoCreateNextYearIssues ? (
              <>
                New issues <strong>will not be created automatically</strong>; the administrator will need to configure them manually if they want them to be created.
              </>
            ) : (
              <>
                New issues for next year <strong>will be created automatically</strong> at the end of this year based on the current configuration.
              </>
            )}
          </p>
        </div>
      </div>
    </div>

    {issues.length > 0 && (
      <div className="mt-6 space-y-4">
        <p className="text-sm font-medium text-gray-700">Issues</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {issues.map((issue, index) => {
            const firstDecemberIndex = issues.findIndex((i) => i.forecasted_publication_month === 12);
            const isFromDecemberOn = firstDecemberIndex >= 0 && index >= firstDecemberIndex;
            return (
              <div key={issue.key} className={`rounded-lg border p-4 space-y-3 ${isFromDecemberOn ? "bg-red-50 border-red-300" : "bg-gray-50/50 border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Issue #{issue.issue_number}</span>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeIssue(index)}
                      className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      title="Remove issue"
                      aria-label="Remove issue"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                        aria-hidden={true}
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor={`create-mag-issue-month-${issue.key}`} className="block text-xs text-gray-600 mb-1">
                    Forecasted publication month <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`create-mag-issue-month-${issue.key}`}
                    value={(() => {
                      const prev = issues[index - 1];
                      const minMonth =
                        index === 0 ? issue.issue_number : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
                      const month = issue.forecasted_publication_month;
                      return month != null && month >= minMonth ? month : "";
                    })()}
                    onChange={(e) => setIssue(index, { forecasted_publication_month: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">— Select month —</option>
                    {(() => {
                      const prev = issues[index - 1];
                      const minMonth =
                        index === 0 ? issue.issue_number : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
                      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                        .filter((m) => m >= minMonth)
                        .map((m) => (
                          <option key={m} value={m} disabled={monthsUsed.has(m) && issue.forecasted_publication_month !== m}>
                            {new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}
                          </option>
                        ));
                    })()}
                  </select>
                  {hasDuplicateMonths && (
                    <p className="text-xs text-red-600 mt-1">Each issue must have a different forecasted month.</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Is this a special edition?</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={issue.is_special_edition}
                    aria-label={`Special edition for issue ${issue.issue_number}`}
                    onClick={() =>
                      setIssue(index, {
                        is_special_edition: !issue.is_special_edition,
                        ...(!issue.is_special_edition ? {} : { special_topic: undefined }),
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      issue.is_special_edition ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                        issue.is_special_edition ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">{issue.is_special_edition ? "Yes" : "No"}</span>
                </div>
                {issue.is_special_edition && (
                  <div>
                    <label htmlFor={`create-mag-issue-topic-${issue.key}`} className="block text-xs text-gray-600 mb-1">
                      Special Edition Topic
                    </label>
                    <input
                      id={`create-mag-issue-topic-${issue.key}`}
                      type="text"
                      value={issue.special_topic ?? ""}
                      onChange={(e) => setIssue(index, { special_topic: e.target.value || undefined })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Sustainable construction"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
);
