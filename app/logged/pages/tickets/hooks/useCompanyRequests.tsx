"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addNotificationComment,
  fetchNotifications,
  type NotificationComment,
  type NotificationState,
  unifiedToCompany,
  updateNotificationApi,
} from "@/app/contents/notifications.types";

export type RequestState = "Pending" | "In Process" | "Other" | "Done";

export interface CompanyContent {
  nombre_comercial: string;
  nombre_fiscal: string;
  tax_id: string;
  cargo_creador: string;
  web_empresa: string;
  pais_empresa: string;
  descripcion_empresa: string;
  /** Directory request: show as visible employee */
  list_as_employee?: boolean;
}

export interface CompanyRequest {
  companyRequestId: string;
  userId: string;
  request_date: string;
  request_state: RequestState;
  content: CompanyContent;
  commentsArray: NotificationComment[];
}

interface CompanyRequestsContextValue {
  requests: CompanyRequest[];
  updateState: (id: string, newState: RequestState) => void;
  addComment: (id: string, content: string) => Promise<void>;
  getById: (id: string) => CompanyRequest | undefined;
  refetch: () => Promise<void>;
}

const CompanyRequestsContext = createContext<CompanyRequestsContextValue | null>(null);

export function CompanyRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<CompanyRequest[]>([]);

  const refetch = useCallback(() => {
    return fetchNotifications({ notification_type: "company" })
      .then((data) => {
        const loaded = data.map(unifiedToCompany);
        setRequests(loaded);
      })
      .catch(() => {
        setRequests([]);
      });
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const updateState = useCallback((id: string, newState: RequestState) => {
    const stateMap: Record<RequestState, NotificationState> = {
      Pending: "pending",
      "In Process": "in_process",
      Other: "other",
      Done: "solved",
    };
    updateNotificationApi(id, { state: stateMap[newState] })
      .then(() => {
        setRequests((prev) => prev.map((r) => (r.companyRequestId === id ? { ...r, request_state: newState } : r)));
      })
      .catch(console.error);
  }, []);

  const getById = useCallback((id: string) => {
    return requests.find((r) => r.companyRequestId === id);
  }, [requests]);

  const addComment = useCallback(async (id: string, content: string) => {
    await addNotificationComment(id, content);
    const newComment: NotificationComment = { date: new Date().toISOString(), content };
    setRequests((prev) =>
      prev.map((r) =>
        r.companyRequestId === id ? { ...r, commentsArray: [...(r.commentsArray ?? []), newComment] } : r
      )
    );
  }, []);

  const value = useMemo(
    () => ({ requests, updateState, addComment, getById, refetch }),
    [requests, updateState, addComment, getById, refetch]
  );

  return <CompanyRequestsContext.Provider value={value}>{children}</CompanyRequestsContext.Provider>;
}

export function useCompanyRequests() {
  const ctx = useContext(CompanyRequestsContext);
  if (!ctx) throw new Error("useCompanyRequests must be used within CompanyRequestsProvider");
  return ctx;
}

