"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { fetchNotifications, updateNotificationApi, addNotificationComment, unifiedToAdvertisement, type UnifiedNotification } from '@/app/contents/notifications.types';

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
  addComment: (idAdvReq: string, content: string) => Promise<void>;
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
    fetchNotifications({ notification_type: 'advertisement' })
      .then((data) => {
        const loadedAdvertisements = data.map(unifiedToAdvertisement);
        setAdvertisements(loadedAdvertisements);
      })
      .catch((error) => {
        console.error('Error loading advertisements:', error);
        setAdvertisements([]);
      })
      .finally(() => {
        setLoading(false);
      });
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

  const idMatches = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

  const updateAdvertisementState = useCallback((idAdvReq: string, newState: AdvertisementState) => {
    const stateMap: Record<AdvertisementState, string> = {
      'pending': 'pending',
      'in process': 'in_process',
      'accepted': 'accepted',
      'rejected': 'rejected',
      'expired': 'expired'
    };
    updateNotificationApi(idAdvReq, { state: stateMap[newState] as any })
      .then(() => {
        setAdvertisements(prev =>
          prev.map(a => (idMatches(a.idAdvReq, idAdvReq) ? { ...a, advReqState: newState } : a))
        );
      })
      .catch(console.error);
  }, []);

  const addComment = useCallback(async (idAdvReq: string, content: string) => {
    await addNotificationComment(idAdvReq, content);
    const newComment: AdvertisementComment = { date: new Date().toISOString(), content };
    setAdvertisements(prev =>
      prev.map(a =>
        idMatches(a.idAdvReq, idAdvReq) ? { ...a, commentsArray: [...a.commentsArray, newComment] } : a
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
