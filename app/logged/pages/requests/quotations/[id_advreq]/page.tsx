"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdvertisements, AdvertisementState } from '../../hooks/useAdvertisements';

export default function AdvertisementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const advReqIdParam = params?.id_advreq;
  const advReqId = Array.isArray(advReqIdParam)
    ? advReqIdParam[0]
    : (advReqIdParam as string) || '';

  const { advertisements, loading: advertisementsLoading, updateAdvertisementState, addComment } = useAdvertisements();
  const [advertisement, setAdvertisement] = useState<ReturnType<typeof useAdvertisements>['advertisements'][0] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [selectedState, setSelectedState] = useState<AdvertisementState>('pending');

  useEffect(() => {
    if (advertisementsLoading) return;

    if (!advReqId) {
      setError('Advertisement Request ID is missing');
      setLoading(false);
      return;
    }

    const decodedAdvReqId = decodeURIComponent(advReqId).trim();
    let foundAdvertisement = advertisements.find(a => a.idAdvReq === decodedAdvReqId);
    if (!foundAdvertisement) {
      foundAdvertisement = advertisements.find(a =>
        a.idAdvReq.toLowerCase() === decodedAdvReqId.toLowerCase()
      );
    }

    if (foundAdvertisement) {
      setAdvertisement(foundAdvertisement);
      setSelectedState(foundAdvertisement.advReqState);
      setError(null);
    } else {
      setError(`Advertisement request not found: ${decodedAdvReqId}`);
    }
    setLoading(false);
  }, [advReqId, advertisements, advertisementsLoading]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatState = (state: string): string => {
    return state
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const handleStateChange = async (newState: AdvertisementState) => {
    if (!advertisement) return;
    updateAdvertisementState(advReqId, newState);
    setAdvertisement({ ...advertisement, advReqState: newState });
    setSelectedState(newState);
  };

  const handleAddComment = async () => {
    if (!advertisement || !newComment.trim()) return;
    setIsAddingComment(true);
    try {
      addComment(advReqId, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsAddingComment(false);
    }
  };

  const sortedComments = advertisement?.commentsArray
    ? [...advertisement.commentsArray].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      })
    : [];

  const stateOptions: AdvertisementState[] = [
    'pending',
    'in process',
    'accepted',
    'rejected',
    'expired'
  ];

  if (loading || advertisementsLoading) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-lg">Loading advertisement request...</p>
      </main>
    );
  }

  if (error || !advertisement) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-red-500 text-lg">
          {error || 'The advertisement request you are looking for does not exist.'}
        </p>
        <button
          onClick={() => router.push('/logged/pages/requests/quotations')}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
        >
          Back to Advertisement Quotations
        </button>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-screen flex-col gap-6 bg-white px-24 py-10 text-gray-600 w-full">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => router.push('/logged/pages/requests/quotations')}
          className="px-4 py-2 text-blue-950 hover:text-blue-800 font-medium"
        >
          ← Back to Advertisement Quotations
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Current State:</span>
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            {formatState(advertisement.advReqState)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Advertisement Request Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Request ID</label>
            <p className="text-lg text-gray-900 mt-1">{advertisement.idAdvReq}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">State</label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value as AdvertisementState)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-950 focus:border-blue-950 text-gray-900"
            >
              {stateOptions.map((state) => (
                <option key={state} value={state}>{formatState(state)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Sender Email</label>
            <p className="text-lg text-gray-900 mt-1">{advertisement.senderEmail}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Sender Company</label>
            <p className="text-lg text-gray-900 mt-1">{advertisement.senderCompany}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Company Country</label>
            <p className="text-lg text-gray-900 mt-1">{advertisement.companyCountry}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Contact Phone</label>
            <p className="text-lg text-gray-900 mt-1">{advertisement.senderContactPhone}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Request Date</label>
            <p className="text-lg text-gray-900 mt-1">{formatDate(advertisement.senderDate)}</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-500">Request Description</label>
          <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">
            {advertisement.requestDescription}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments</h2>
        <div className="mb-6">
          <label htmlFor="newComment" className="block text-sm font-medium text-gray-700 mb-2">Add Comment</label>
          <textarea
            id="newComment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-950 focus:border-blue-950 text-gray-900"
            placeholder="Enter your comment here..."
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isAddingComment}
            className={`mt-3 px-4 py-2 rounded-md text-white font-medium ${!newComment.trim() || isAddingComment ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-950 hover:bg-blue-950/80 cursor-pointer'}`}
          >
            {isAddingComment ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
        <div className="space-y-4">
          {sortedComments.length === 0 ? (
            <p className="text-gray-500 italic">No comments yet.</p>
          ) : (
            sortedComments.map((comment, index) => (
              <div key={index} className="border-l-4 border-blue-950 pl-4 py-2 bg-gray-50 rounded-r">
                <p className="text-sm font-medium text-gray-900">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(comment.date)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
