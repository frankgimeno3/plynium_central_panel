"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { fetchNotifications, updateNotificationApi, unifiedToOther, type UnifiedNotification } from '@/app/contents/notifications.types';

export type RequestState = 'Pending' | 'In Process' | 'Other';

export interface OtherRequest {
  id: string;
  author: string;
  content: string;
  request_state: RequestState;
}

interface OtherRequestsContextValue {
  requests: OtherRequest[];
  updateState: (id: string, newState: RequestState) => void;
  getById: (id: string) => OtherRequest | undefined;
}

const OtherRequestsContext = createContext<OtherRequestsContextValue | null>(null);

export function OtherRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<OtherRequest[]>([]);

  useEffect(() => {
    fetchNotifications({ notification_type: 'other' })
      .then((data) => {
        const loaded = data.map(unifiedToOther);
        setRequests(loaded);
      })
      .catch(() => {
        setRequests([]);
      });
  }, []);

  const updateState = useCallback((id: string, newState: RequestState) => {
    const stateMap: Record<RequestState, string> = {
      'Pending': 'pending',
      'In Process': 'in_process',
      'Other': 'other'
    };
    updateNotificationApi(id, { state: stateMap[newState] as any })
      .then(() => {
        setRequests(prev =>
          prev.map(r => (r.id === id ? { ...r, request_state: newState } : r))
        );
      })
      .catch(console.error);
  }, []);

  const getById = useCallback((id: string) => {
    return requests.find(r => r.id === id);
  }, [requests]);

  const value = useMemo(
    () => ({ requests, updateState, getById }),
    [requests, updateState, getById]
  );

  return (
    <OtherRequestsContext.Provider value={value}>
      {children}
    </OtherRequestsContext.Provider>
  );
}

export function useOtherRequests() {
  const ctx = useContext(OtherRequestsContext);
  if (!ctx) throw new Error('useOtherRequests must be used within OtherRequestsProvider');
  return ctx;
}
