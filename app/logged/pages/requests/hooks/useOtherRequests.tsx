"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import otherRequests from '@/app/contents/otherRequests.json';

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
    try {
      const loaded = Array.isArray(otherRequests)
        ? otherRequests.map((r: any) => ({
            id: String(r.id ?? ''),
            author: String(r.author ?? ''),
            content: String(r.content ?? ''),
            request_state: String(r.request_state ?? 'Pending') as RequestState
          }))
        : [];
      setRequests(loaded);
    } catch {
      setRequests([]);
    }
  }, []);

  const updateState = useCallback((id: string, newState: RequestState) => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, request_state: newState } : r))
    );
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
