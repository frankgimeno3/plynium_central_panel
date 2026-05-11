"use client";

import React, { FC } from "react";
import type { MagazineIssue } from "@/app/contents/interfaces";
import { FORMAT_OPTIONS, MAX_ISSUES_PER_YEAR, MONTH_OPTIONS } from "./constants";

type Props = {
  selectedYear: string;
  yearOptions: string[];
  pubsLoading: boolean;
  onYearChange: (year: string) => void;
  issuesForYear: MagazineIssue[];
  monthsUsedForYear: Set<number>;
  issuesMonthDirtyInvalid: boolean;
  onForecastedMonthChange: (publicationId: string, value: number | undefined) => void;
  onToggleSpecialEdition: (publicationId: string) => void;
  onSpecialTopicChange: (publicationId: string, value: string) => void;
  onPublicationFormatChange: (publicationId: string, value: "informer" | "flipbook" | "both") => void;
  onDeleteIssue: (publicationId: string) => void | Promise<void>;
  onAddIssue: () => void | Promise<void>;
};

export const PlannedIssuesByYearSection: FC<Props> = ({
  selectedYear,
  yearOptions,
  pubsLoading,
  onYearChange,
  issuesForYear,
  monthsUsedForYear,
  issuesMonthDirtyInvalid,
  onForecastedMonthChange,
  onToggleSpecialEdition,
  onSpecialTopicChange,
  onPublicationFormatChange,
  onDeleteIssue,
  onAddIssue,
}) => (
  <div className="mt-6 bg-white rounded-b-lg overflow-hidden border border-gray-200 border-t-0">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Planned issues by year</h2>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label htmlFor="mag-planned-issue-year" className="text-sm font-medium text-gray-700">
          Year
        </label>
        <select
          id="mag-planned-issue-year"
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {pubsLoading && <span className="text-sm text-gray-500">Loading issues…</span>}
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Forecasted month</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special edition</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Special topic</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issuesForYear.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-sm">
                  No issues planned for this year. Add one below (max {MAX_ISSUES_PER_YEAR}).
                </td>
              </tr>
            ) : (
              issuesForYear.map((issue, index) => {
                const prevIssue = issuesForYear[index - 1];
                const minMonth =
                  index === 0
                    ? issue.issue_number
                    : Math.max(issue.issue_number, prevIssue?.forecasted_publication_month ?? issue.issue_number);
                const allowedMonthOptions = MONTH_OPTIONS.filter((opt) => opt.value >= minMonth);
                const pubId = issue.publication_id ?? "";
                return (
                  <tr key={pubId || issue.issue_number} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.issue_number}</td>
                    <td className="px-4 py-3">
                      <select
                        value={
                          issue.forecasted_publication_month != null && issue.forecasted_publication_month >= minMonth
                            ? issue.forecasted_publication_month
                            : ""
                        }
                        onChange={(e) => onForecastedMonthChange(pubId, e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                      >
                        <option value="">—</option>
                        {allowedMonthOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} disabled={monthsUsedForYear.has(opt.value) && issue.forecasted_publication_month !== opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={issue.is_special_edition}
                        onClick={() => onToggleSpecialEdition(pubId)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          issue.is_special_edition ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            issue.is_special_edition ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-sm text-gray-600">{issue.is_special_edition ? "Yes" : "No"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={issue.special_topic ?? ""}
                        onChange={(e) => onSpecialTopicChange(pubId, e.target.value)}
                        className="w-full max-w-xs px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Special topic"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={issue.publication_format ?? "flipbook"}
                        onChange={(e) => onPublicationFormatChange(pubId, e.target.value as "informer" | "flipbook" | "both")}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[110px]"
                      >
                        {FORMAT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => void onDeleteIssue(pubId)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {issuesMonthDirtyInvalid && issuesForYear.length > 0 && (
        <p className="mt-2 text-sm text-red-600">
          Set a unique forecasted publication month (1–12) for each issue; issue #n must be at least month n, and months must be in order.
        </p>
      )}
      {(() => {
        const lastIssue = issuesForYear.length > 0 ? issuesForYear[issuesForYear.length - 1] : null;
        const lastIssueIsDecember = lastIssue?.forecasted_publication_month === 12;
        const cannotAddMore = issuesForYear.length >= MAX_ISSUES_PER_YEAR || lastIssueIsDecember || pubsLoading;
        return (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void onAddIssue()}
              disabled={cannotAddMore}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add issue
            </button>
            {issuesForYear.length >= MAX_ISSUES_PER_YEAR && (
              <span className="text-sm text-gray-500">Max {MAX_ISSUES_PER_YEAR} issues per year.</span>
            )}
            {lastIssueIsDecember && (
              <span className="text-sm text-amber-700">
                It is not possible to add more issues for this year if there is already an issue scheduled for December.
              </span>
            )}
          </div>
        );
      })()}
    </div>
  </div>
);
