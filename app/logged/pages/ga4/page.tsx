"use client";

import { useState } from "react";
import Link from "next/link";
import ga4Data from "@/app/contents/ga4.json";

interface Ga4Data {
  portals: { id: string; name: string }[];
  summaryByPortal: Record<string, {
    users: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    avgEngagementSeconds: number;
    newUsers: number;
    conversions: number;
  }>;
  tableRowsByPortal: Record<string, { page: string; users: number; sessions: number; pageViews: number; avgTime: number; bounceRate: number }[]>;
  detailByPortal: Record<string, {
    trafficSource: { source: string; users: number; sessions: number; percentage: number }[];
    deviceBreakdown: { device: string; users: number; sessions: number; percentage: number }[];
    topPagesDetail: { page: string; users: number; sessions: number; pageViews: number; avgTime: number; bounceRate: number; entrances: number; exits: number }[];
  }>;
}

export default function GA4Page() {
  const data = ga4Data as Ga4Data;
  const portals = data.portals ?? [];
  const [activePortalIdx, setActivePortalIdx] = useState(0);
  const currentPortal = portals[activePortalIdx];
  const summary = currentPortal ? data.summaryByPortal?.[currentPortal.id] : null;
  const detail = currentPortal ? data.detailByPortal?.[currentPortal.id] : null;
  const tableRows = currentPortal ? (data.tableRowsByPortal?.[currentPortal.id] ?? []) : [];
  const detailedRows = detail?.topPagesDetail ?? tableRows.map((r) => ({ ...r, entrances: 0, exits: 0 }));

  return (
    <div className="flex flex-col w-full bg-white p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Google Analytics 4</h1>
        <Link
          href="/logged"
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
        >
          ← Back to dashboard
        </Link>
      </div>

      {/* Portal tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {portals.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActivePortalIdx(i)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activePortalIdx === i
                ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!currentPortal ? (
        <p className="text-gray-500">No portal selected</p>
      ) : (
        <>
          {/* Metrics cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            {summary && (
              <>
                <MetricCard label="Users" value={summary.users.toLocaleString()} />
                <MetricCard label="Sessions" value={summary.sessions.toLocaleString()} />
                <MetricCard label="Page views" value={summary.pageViews.toLocaleString()} />
                <MetricCard label="Bounce rate" value={`${summary.bounceRate}%`} />
                <MetricCard label="Avg. engagement" value={`${summary.avgEngagementSeconds}s`} />
                <MetricCard label="New users" value={summary.newUsers.toLocaleString()} />
                <MetricCard label="Conversions" value={summary.conversions.toString()} />
              </>
            )}
          </div>

          {/* Table - more detail */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top pages (detailed)</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Page</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Users</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Sessions</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Page views</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Avg. time (s)</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Bounce rate %</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Entrances</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Exits</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedRows.map((row, i) => (
                    <tr key={i} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{row.page}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.users.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.sessions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.pageViews.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.avgTime}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.bounceRate}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {"entrances" in row && row.entrances != null ? row.entrances.toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {"exits" in row && row.exits != null ? row.exits.toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Typical GA4 analytics panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Traffic source */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Traffic source</h2>
              <div className="space-y-3">
                {detail?.trafficSource?.map((ts, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="flex-1 text-sm text-gray-700">{ts.source}</span>
                    <span className="text-sm font-medium text-gray-900">{ts.sessions.toLocaleString()} sessions</span>
                    <span className="text-sm text-gray-500 w-14 text-right">{ts.percentage}%</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${ts.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Device breakdown</h2>
              <div className="space-y-3">
                {detail?.deviceBreakdown?.map((d, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="flex-1 text-sm text-gray-700">{d.device}</span>
                    <span className="text-sm font-medium text-gray-900">{d.users.toLocaleString()} users</span>
                    <span className="text-sm text-gray-500 w-14 text-right">{d.percentage}%</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Engagement overview (mock chart area) */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Engagement over time</h2>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Chart placeholder (mock data)</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
