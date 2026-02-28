"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import companyRequest from '@/app/contents/companyRequest.json';

export type RequestState = 'Pending' | 'In Process' | 'Other';

export interface CompanyContent {
  nombre_comercial: string;
  nombre_fiscal: string;
  tax_id: string;
  cargo_creador: string;
  web_empresa: string;
  pais_empresa: string;
  descripcion_empresa: string;
}

export interface CompanyRequest {
  companyRequestId: string;
  userId: string;
  request_date: string;
  request_state: RequestState;
  content: CompanyContent;
}

interface CompanyRequestsContextValue {
  requests: CompanyRequest[];
  updateState: (id: string, newState: RequestState) => void;
  getById: (id: string) => CompanyRequest | undefined;
}

const CompanyRequestsContext = createContext<CompanyRequestsContextValue | null>(null);

export function CompanyRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<CompanyRequest[]>([]);

  useEffect(() => {
    try {
      const loaded = Array.isArray(companyRequest)
        ? companyRequest.map((r: any) => ({
            companyRequestId: String(r.companyRequestId ?? ''),
            userId: String(r.userId ?? ''),
            request_date: String(r.request_date ?? ''),
            request_state: String(r.request_state ?? 'Pending') as RequestState,
            content: {
              nombre_comercial: String(r.content?.nombre_comercial ?? ''),
              nombre_fiscal: String(r.content?.nombre_fiscal ?? ''),
              tax_id: String(r.content?.tax_id ?? ''),
              cargo_creador: String(r.content?.cargo_creador ?? ''),
              web_empresa: String(r.content?.web_empresa ?? ''),
              pais_empresa: String(r.content?.pais_empresa ?? ''),
              descripcion_empresa: String(r.content?.descripcion_empresa ?? '')
            }
          }))
        : [];
      setRequests(loaded);
    } catch {
      setRequests([]);
    }
  }, []);

  const updateState = useCallback((id: string, newState: RequestState) => {
    setRequests(prev =>
      prev.map(r =>
        r.companyRequestId === id ? { ...r, request_state: newState } : r
      )
    );
  }, []);

  const getById = useCallback((id: string) => {
    return requests.find(r => r.companyRequestId === id);
  }, [requests]);

  const value = useMemo(
    () => ({ requests, updateState, getById }),
    [requests, updateState, getById]
  );

  return (
    <CompanyRequestsContext.Provider value={value}>
      {children}
    </CompanyRequestsContext.Provider>
  );
}

export function useCompanyRequests() {
  const ctx = useContext(CompanyRequestsContext);
  if (!ctx) throw new Error('useCompanyRequests must be used within CompanyRequestsProvider');
  return ctx;
}
