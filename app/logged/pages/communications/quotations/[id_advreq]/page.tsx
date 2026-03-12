"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import {
  useAdvertisements,
  AdvertisementState,
} from "@/app/logged/pages/network/requests/hooks/useAdvertisements";

const BASE = "/logged/pages/communications";

export default function AdvertisementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const advReqIdParam = params?.id_advreq;
  const advReqId = Array.isArray(advReqIdParam)
    ? advReqIdParam[0]
    : (advReqIdParam as string) || "";

  const {
    advertisements,
    loading: advertisementsLoading,
    updateAdvertisementState,
    addComment,
  } = useAdvertisements();
  const [advertisement, setAdvertisement] = useState<
    ReturnType<typeof useAdvertisements>["advertisements"][0] | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [selectedState, setSelectedState] = useState<AdvertisementState>("pending");
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (advertisementsLoading) return;

    if (!advReqId) {
      setError("Advertisement Request ID is missing");
      setLoading(false);
      return;
    }

    const decodedAdvReqId = decodeURIComponent(advReqId).trim();
    let foundAdvertisement = advertisements.find((a) => a.idAdvReq === decodedAdvReqId);
    if (!foundAdvertisement) {
      foundAdvertisement = advertisements.find(
        (a) => a.idAdvReq.toLowerCase() === decodedAdvReqId.toLowerCase()
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

  useEffect(() => {
    if (advertisement) {
      setPageMeta({
        pageTitle: "Advertisement Request Details",
        breadcrumbs: [
          { label: "Communications", href: BASE },
          { label: "Advertisement quotations", href: BASE },
          { label: advertisement.idAdvReq },
        ],
        buttons: [{ label: "Back to Advertisement Quotations", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Advertisement Request Details",
        breadcrumbs: [
          { label: "Communications", href: BASE },
          { label: "Advertisement quotations", href: BASE },
        ],
        buttons: [{ label: "Back to Advertisement Quotations", href: BASE }],
      });
    }
  }, [setPageMeta, advertisement]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatState = (state: string): string => {
    return state
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  /** Same style as Leftnav selected item: border-blue-500, bg-blue-950/40, text-blue-300 */
  const stateBadgeClass = (): string =>
    "border-blue-500 bg-blue-950/40 font-medium text-blue-300";

  const handleStateChange = async (newState: AdvertisementState) => {
    if (!advertisement) return;
    const decodedId = decodeURIComponent(advReqId).trim();
    updateAdvertisementState(decodedId, newState);
    setAdvertisement({ ...advertisement, advReqState: newState });
    setSelectedState(newState);
  };

  const handleAddComment = async () => {
    if (!advertisement || !newComment.trim()) return;
    setIsAddingComment(true);
    try {
      const decodedId = decodeURIComponent(advReqId).trim();
      addComment(decodedId, newComment.trim());
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment. Please try again.");
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
    "pending",
    "in process",
    "accepted",
    "rejected",
    "expired",
  ];

  if (loading || advertisementsLoading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6 flex flex-col items-center justify-center text-gray-600 min-h-[200px] w-full">
            <p className="text-lg">Loading advertisement request...</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (error || !advertisement) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6 flex flex-col items-center justify-center text-gray-600 min-h-[200px] w-full">
            <p className="text-red-500 text-lg">
              {error || "The advertisement request you are looking for does not exist."}
            </p>
            <button
              onClick={() => router.push(BASE)}
              className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
            >
              Back to Communications
            </button>
          </div>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500">Current State:</span>
          <span
            className={`inline-flex rounded-r-md border-l-2 py-1.5 pl-2 pr-3 text-sm font-medium uppercase ${stateBadgeClass()}`}
          >
            {formatState(advertisement.advReqState)}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Details</h1>

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
                <option key={state} value={state}>
                  {formatState(state)}
                </option>
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
            <p className="text-lg text-gray-900 mt-1">
              {formatDate(advertisement.senderDate)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-500">Request Description</label>
          <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">
            {advertisement.requestDescription}
          </p>
        </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments</h2>
        <div className="mb-6">
          <label
            htmlFor="newComment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Add Comment
          </label>
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
            className={`mt-3 px-4 py-2 rounded-md text-white font-medium ${
              !newComment.trim() || isAddingComment
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-950 hover:bg-blue-950/80 cursor-pointer"
            }`}
          >
            {isAddingComment ? "Adding..." : "Add Comment"}
          </button>
        </div>
        <div className="space-y-4">
          {sortedComments.length === 0 ? (
            <p className="text-gray-500 italic">No comments yet.</p>
          ) : (
            sortedComments.map((comment, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-950 pl-4 py-2 bg-gray-50 rounded-r"
              >
                <p className="text-sm font-medium text-gray-900">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(comment.date)}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t">
          <Link
            href="/logged/pages/account-management/proposals/create"
            className="inline-flex px-4 py-2 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors"
          >
            Create proposal
          </Link>
        </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
}
