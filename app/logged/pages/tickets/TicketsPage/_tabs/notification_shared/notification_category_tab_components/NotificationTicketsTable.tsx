"use client";

import { useRouter } from "next/navigation";

export type MappedNotificationRow = {
  notification_id: string;
  notification_brief_description: string;
  notification_time: string;
  notification_state: "unread" | "read" | "solved";
  notification_description: string;
};

type Props = {
  rows: MappedNotificationRow[];
  formatNotificationTime: (dateStr: string) => string;
};

export default function NotificationTicketsTable({ rows, formatNotificationTime }: Props) {
  const router = useRouter();

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-5 text-center text-gray-500">
              No tickets in this category.
            </td>
          </tr>
        ) : (
          rows.map((n) => (
            <tr
              key={n.notification_id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/logged/pages/tickets/${n.notification_id}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/logged/pages/tickets/${n.notification_id}`)}
              className="hover:bg-gray-100 cursor-pointer"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{n.notification_id}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{n.notification_brief_description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatNotificationTime(n.notification_time)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    n.notification_state === "unread"
                      ? "bg-amber-100 text-amber-800"
                      : n.notification_state === "read"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {n.notification_state}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
