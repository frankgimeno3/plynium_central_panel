"use client";

import React, { FC, useState, useEffect, useRef } from "react";
import Link from "next/link";
import notificationsData from "@/app/contents/notifications.json";
import otherRequestsData from "@/app/contents/otherRequests.json";
import companyRequestData from "@/app/contents/companyRequest.json";
import advertisementRequestData from "@/app/contents/advertisementRequest.json";

type NotificationState = "unread" | "read" | "solved";

interface Notification {
  notification_id: string;
  notification_brief_description: string;
  notification_time: string;
  notification_state: NotificationState;
  notification_description: string;
}

const formatNotificationTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

interface NotificationsDropdownProps {
  onClose?: () => void;
}

const NotificationsDropdown: FC<NotificationsDropdownProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"unread" | "other">("unread");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loaded = Array.isArray(notificationsData)
      ? (notificationsData as Notification[]).map((n: Notification) => ({
          ...n,
          notification_state: n.notification_state as NotificationState,
        }))
      : [];
    setNotifications(loaded);
  }, []);

  const unreadNotifications = notifications.filter((n) => n.notification_state === "unread");
  const displayNotifications = unreadNotifications.slice(0, 5);

  const pendingOtherFull = (otherRequestsData as { id: string; author: string; content: string; request_state: string }[]).filter(
    (r) => r.request_state === "Pending"
  );
  const pendingCompanyFull = (companyRequestData as { companyRequestId: string; content: { nombre_comercial: string }; request_state: string }[]).filter(
    (r) => r.request_state === "Pending"
  );
  const pendingAdvertisementFull = (advertisementRequestData as {
    idAdvReq: string;
    senderCompany: string;
    requestDescription: string;
    advReqState: string;
  }[]).filter((r) => r.advReqState === "pending");
  const allPendingItems = [
    ...pendingOtherFull.map((r) => ({ type: "other" as const, ...r })),
    ...pendingCompanyFull.map((r) => ({ type: "company" as const, ...r })),
    ...pendingAdvertisementFull.map((r) => ({ type: "advertisement" as const, ...r })),
  ];
  const pendingItemsFirst5 = allPendingItems.slice(0, 5);

  return (
    <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[420px] flex flex-col rounded-lg border border-gray-200 bg-white shadow-xl z-50">
      <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`flex-1 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "unread" ? "bg-white text-blue-950 border-b-2 border-blue-950 shadow-sm" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Unread
          {unreadNotifications.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded">
              {unreadNotifications.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("other")}
          className={`flex-1 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "other" ? "bg-white text-blue-950 border-b-2 border-blue-950 shadow-sm" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Other
        </button>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">
        {activeTab === "unread" ? (
          <>
            {displayNotifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No unread notifications</p>
            ) : (
              displayNotifications.map((n) => (
                <Link
                  key={n.notification_id}
                  href={`/logged/pages/notifications/${n.notification_id}`}
                  onClick={onClose}
                  className="flex flex-row justify-between bg-white p-4 border-b border-gray-100 hover:bg-gray-50"
                >
                  <p className="text-sm text-gray-900 flex-1 line-clamp-2">{n.notification_brief_description}</p>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{formatNotificationTime(n.notification_time)}</span>
                </Link>
              ))
            )}
            <div className="p-2 border-t border-gray-100">
              <Link
                href="/logged/pages/notifications"
                onClick={onClose}
                className="block w-full text-center py-2 text-sm font-medium text-blue-950 hover:bg-blue-50 rounded"
              >
                See all notifications
              </Link>
            </div>
          </>
        ) : (
          <>
            {pendingItemsFirst5.map((item) =>
              item.type === "other" ? (
                <Link
                  key={item.id}
                  href={`/logged/pages/account-management/requests/requests/${encodeURIComponent(item.id)}`}
                  onClick={onClose}
                  className="flex flex-row justify-between bg-white p-4 border-b border-gray-100 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.author}</p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{item.content}</p>
                  </div>
                  <span className="shrink-0 ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">Other - Pending</span>
                </Link>
              ) : item.type === "company" ? (
                <Link
                  key={item.companyRequestId}
                  href={`/logged/pages/account-management/requests/company/${encodeURIComponent(item.companyRequestId)}`}
                  onClick={onClose}
                  className="flex flex-row justify-between bg-white p-4 border-b border-gray-100 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.content.nombre_comercial}</p>
                    <p className="text-sm text-gray-600 mt-0.5">Company registration request</p>
                  </div>
                  <span className="shrink-0 ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">Company - Pending</span>
                </Link>
              ) : (
                <Link
                  key={item.idAdvReq}
                  href={`/logged/pages/account-management/requests/quotations/${encodeURIComponent(item.idAdvReq)}`}
                  onClick={onClose}
                  className="flex flex-row justify-between bg-white p-4 border-b border-gray-100 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.senderCompany}</p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{item.requestDescription}</p>
                  </div>
                  <span className="shrink-0 ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">Advertisement - Pending</span>
                </Link>
              )
            )}
            {allPendingItems.length === 0 && <p className="p-4 text-sm text-gray-500 text-center">No pending requests</p>}
            <div className="p-2 border-t border-gray-100">
              <Link
                href="/logged/pages/notifications?tab=other"
                onClick={onClose}
                className="block w-full text-center py-2 text-sm font-medium text-blue-950 hover:bg-blue-50 rounded"
              >
                See all other
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
