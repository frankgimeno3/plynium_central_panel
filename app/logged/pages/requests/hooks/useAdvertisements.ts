import { useState, useEffect, useMemo } from 'react';
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

export const useAdvertisements = () => {
  const [advertisements, setAdvertisements] = useState<AdvertisementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabFilter>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    // Load advertisements from JSON
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

  // Filter advertisements by tab
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

    // Sort by senderDate (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.senderDate).getTime();
      const dateB = new Date(b.senderDate).getTime();
      return dateB - dateA;
    });
  }, [advertisements, currentTab]);

  // Paginate filtered advertisements
  const paginatedAdvertisements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAdvertisements.slice(startIndex, endIndex);
  }, [filteredAdvertisements, currentPage]);

  // Counts for each tab
  const counts = useMemo(() => {
    return {
      pending: advertisements.filter(a => a.advReqState === 'pending').length,
      'in process': advertisements.filter(a => a.advReqState === 'in process').length,
      other: advertisements.filter(a => 
        !['pending', 'in process'].includes(a.advReqState)
      ).length
    };
  }, [advertisements]);

  // Total pages for current filter
  const totalPages = Math.ceil(filteredAdvertisements.length / itemsPerPage);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab]);

  // Update advertisement state
  const updateAdvertisementState = (idAdvReq: string, newState: AdvertisementState) => {
    setAdvertisements(prev => 
      prev.map(a => 
        a.idAdvReq === idAdvReq 
          ? { ...a, advReqState: newState }
          : a
      )
    );
  };

  // Add comment to advertisement
  const addComment = (idAdvReq: string, content: string) => {
    const newComment: AdvertisementComment = {
      date: new Date().toISOString(),
      content
    };

    setAdvertisements(prev =>
      prev.map(a =>
        a.idAdvReq === idAdvReq
          ? { ...a, commentsArray: [...a.commentsArray, newComment] }
          : a
      )
    );
  };

  // Get advertisement by ID
  const getAdvertisementById = (idAdvReq: string): AdvertisementRequest | undefined => {
    return advertisements.find(a => a.idAdvReq === idAdvReq);
  };

  return {
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
  };
};
