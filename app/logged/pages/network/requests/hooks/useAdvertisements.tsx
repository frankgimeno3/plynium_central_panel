"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import advertisementRequest from '@/app/contents/advertisementRequest.json';

export type AdvertisementState =
  | 'pending'
  | 'in process'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface AdvertisementComment {
  date: string;
  content: string;
}

export interface AdvertisementRequest {
  idAdvReq: string;
  senderEmail: string;
  senderDate: string;
  senderCompany: string;
  advReqState: AdvertisementState;
  requestDescription: string;
  companyCountry: string;
  senderContactPhone: string;
  commentsArray: AdvertisementComment[];
}

export type TabFilter = 'pending' | 'in process' | 'other';

interface AdvertisementsContextValue {
  advertisements: AdvertisementRequest[];
  loading: boolean;
  currentTab: TabFilter;
  setCurrentTab: (t: TabFilter) => void;
  currentPage: number;
  setCurrentPage: (p: number | ((prev: number) => number)) => void;
  paginatedAdvertisements: AdvertisementRequest[];
  filteredAdvertisements: AdvertisementRequest[];
  counts: { pending: number; 'in process': number; other: number };
  totalPages: number;
  itemsPerPage: number;
  updateAdvertisementState: (idAdvReq: string, newState: AdvertisementState) => void;
  addComment: (idAdvReq: string, content: string) => void;
  getAdvertisementById: (idAdvReq: string) => AdvertisementRequest | undefined;
}

const AdvertisementsContext = createContext<AdvertisementsContextValue | null>(null);

export function AdvertisementsProvider({ children }: { children: ReactNode }) {
  const [advertisements, setAdvertisements] = useState<AdvertisementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabFilter>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    try {
      const loadedAdvertisements = Array.isArray(advertisementRequest)
        ? advertisementRequest.map((a: any) => ({
            idAdvReq: String(a.idAdvReq ?? ''),
            senderEmail: String(a.senderEmail ?? ''),
            senderDate: String(a.senderDate ?? ''),
            senderCompany: String(a.senderCompany ?? ''),
            advReqState: String(a.advReqState ?? 'pending') as AdvertisementState,
            requestDescription: String(a.requestDescription ?? ''),
            companyCountry: String(a.companyCountry ?? ''),
            senderContactPhone: String(a.senderContactPhone ?? ''),
            commentsArray: Array.isArray(a.commentsArray)
              ? a.commentsArray.map((c: any) => ({
                  date: String(c.date ?? ''),
                  content: String(c.content ?? '')
                }))
              : []
          }))
        : [];
      setAdvertisements(loadedAdvertisements);
    } catch (error) {
      console.error('Error loading advertisements:', error);
      setAdvertisements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredAdvertisements = useMemo(() => {
    let filtered: AdvertisementRequest[] = [];
    switch (currentTab) {
      case 'pending':
        filtered = advertisements.filter(a => a.advReqState === 'pending');
        break;
      case 'in process':
        filtered = advertisements.filter(a => a.advReqState === 'in process');
        break;
      case 'other':
        filtered = advertisements.filter(a =>
          !['pending', 'in process'].includes(a.advReqState)
        );
        break;
    }
    return filtered.sort((a, b) => {
      const dateA = new Date(a.senderDate).getTime();
      const dateB = new Date(b.senderDate).getTime();
      return dateB - dateA;
    });
  }, [advertisements, currentTab]);

  const paginatedAdvertisements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAdvertisements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAdvertisements, currentPage, itemsPerPage]);

  const counts = useMemo(
    () => ({
      pending: advertisements.filter(a => a.advReqState === 'pending').length,
      'in process': advertisements.filter(a => a.advReqState === 'in process').length,
      other: advertisements.filter(a => !['pending', 'in process'].includes(a.advReqState)).length
    }),
    [advertisements]
  );

  const totalPages = Math.ceil(filteredAdvertisements.length / itemsPerPage);

  const updateAdvertisementState = useCallback((idAdvReq: string, newState: AdvertisementState) => {
    setAdvertisements(prev =>
      prev.map(a => (a.idAdvReq === idAdvReq ? { ...a, advReqState: newState } : a))
    );
  }, []);

  const addComment = useCallback((idAdvReq: string, content: string) => {
    const newComment: AdvertisementComment = { date: new Date().toISOString(), content };
    setAdvertisements(prev =>
      prev.map(a =>
        a.idAdvReq === idAdvReq ? { ...a, commentsArray: [...a.commentsArray, newComment] } : a
      )
    );
  }, []);

  const getAdvertisementById = useCallback(
    (idAdvReq: string) => advertisements.find(a => a.idAdvReq === idAdvReq),
    [advertisements]
  );

  const value = useMemo(
    () => ({
      advertisements,
      loading,
      currentTab,
      setCurrentTab,
      currentPage,
      setCurrentPage,
      paginatedAdvertisements,
      filteredAdvertisements,
      counts,
      totalPages,
      itemsPerPage,
      updateAdvertisementState,
      addComment,
      getAdvertisementById
    }),
    [
      advertisements,
      loading,
      currentTab,
      currentPage,
      paginatedAdvertisements,
      filteredAdvertisements,
      counts,
      totalPages,
      updateAdvertisementState,
      addComment,
      getAdvertisementById
    ]
  );

  return (
    <AdvertisementsContext.Provider value={value}>{children}</AdvertisementsContext.Provider>
  );
}

export const useAdvertisements = () => {
  const ctx = useContext(AdvertisementsContext);
  if (!ctx) throw new Error('useAdvertisements must be used within AdvertisementsProvider');
  return ctx;
};
