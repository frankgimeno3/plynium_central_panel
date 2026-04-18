"use client";

import { FC, useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useOtherRequests, RequestState } from "@/app/logged/pages/network/requests/hooks/useOtherRequests";
import type { NotificationComment as PanelTicketComment } from "@/app/contents/notifications.types";

const BASE = "/logged/pages/tickets";

const stateOptions: RequestState[] = ["Pending", "In Process", "Other", "Done"];

const OtherRequestDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : (idParam as string) || "";

  const { getById, updateState, addComment } = useOtherRequests();
  const [request, setRequest] = useState<ReturnType<typeof getById>>(undefined);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    const decodedId = decodeURIComponent(id).trim();
    const found = getById(decodedId);
    setRequest(found ?? undefined);
    setLoading(false);
  }, [id, getById]);

  useEffect(() => {
    if (request) {
      setPageMeta({
        pageTitle: "Request Details",
        breadcrumbs: [
          { label: "Tickets", href: BASE },
          { label: "Other Communications", href: `${BASE}?tab=other` },
          { label: request.id },
        ],
        buttons: [{ label: "Back to Other Communications", href: `${BASE}?tab=other` }],
      });
    } else {
      setPageMeta({
        pageTitle: "Request Details",
        breadcrumbs: [
          { label: "Tickets", href: BASE },
          { label: "Other Communications", href: `${BASE}?tab=other` },
        ],
        buttons: [{ label: "Back to Other Communications", href: `${BASE}?tab=other` }],
      });
    }
  }, [setPageMeta, request]);

  const handleStateChange = (newState: RequestState) => {
    if (!request) return;
    updateState(request.id, newState);
    setRequest({ ...request, request_state: newState });
  };

  const sortedComments: PanelTicketComment[] = useMemo(() => {
    const list = request?.commentsArray ?? [];
    return [...list].sort((a, b) => {
      const ta = Date.parse(a.date || "") || 0;
      const tb = Date.parse(b.date || "") || 0;
      return ta - tb;
    });
  }, [request?.commentsArray]);

  const handleAddComment = async () => {
    if (!request || !newComment.trim()) return;
    setIsAddingComment(true);
    try {
      await addComment(request.id, newComment.trim());
      setNewComment("");
      const refreshed = getById(request.id);
      setRequest(refreshed ?? request);
    } finally {
      setIsAddingComment(false);
    }
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6 flex flex-col items-center justify-center text-gray-600 min-h-[200px]">
            <p className="text-lg">Loading request...</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (!request) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6 flex flex-col items-center justify-center text-gray-600 min-h-[200px]">
            <p className="text-red-500 text-lg">Request not found.</p>
            <button
              onClick={() => router.push(`${BASE}?tab=other`)}
              className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
            >
              Back to Tickets
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
          <div className="bg-white rounded-b-lg overflow-hidden p-6 space-y-4 text-gray-600">
          <div>
            <label className="text-sm font-medium text-gray-500">ID</label>
            <p className="text-lg text-gray-900 font-mono">{request.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Author</label>
            <p className="text-lg text-gray-900">{request.author}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">State</label>
            <select
              value={request.request_state}
              onChange={(e) => handleStateChange(e.target.value as RequestState)}
              className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-950 focus:border-blue-950 text-gray-900"
            >
              {stateOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Content</label>
            <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{request.content}</p>
          </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments</h2>
            <div className="mb-6">
              <label htmlFor="newComment" className="block text-sm font-medium text-gray-700 mb-2">
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
                    key={`${comment.date}-${index}`}
                    className="border-l-4 border-blue-950 pl-4 py-2 bg-gray-50 rounded-r"
                  >
                    <p className="text-sm font-medium text-gray-900">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{comment.date}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default OtherRequestDetailPage;
