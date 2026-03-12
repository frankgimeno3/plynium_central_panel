"use client";

import { FC, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useOtherRequests, RequestState } from "@/app/logged/pages/network/requests/hooks/useOtherRequests";

const BASE = "/logged/pages/communications";

const stateOptions: RequestState[] = ["Pending", "In Process", "Other"];

const OtherRequestDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : (idParam as string) || "";

  const { getById, updateState } = useOtherRequests();
  const [request, setRequest] = useState<ReturnType<typeof getById>>(undefined);
  const [loading, setLoading] = useState(true);
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
          { label: "Communications", href: BASE },
          { label: "Other Communications", href: BASE },
          { label: request.id },
        ],
        buttons: [{ label: "Back to Other Communications", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Request Details",
        breadcrumbs: [
          { label: "Communications", href: BASE },
          { label: "Other Communications", href: BASE },
        ],
        buttons: [{ label: "Back to Other Communications", href: BASE }],
      });
    }
  }, [setPageMeta, request]);

  const handleStateChange = (newState: RequestState) => {
    if (!request) return;
    updateState(request.id, newState);
    setRequest({ ...request, request_state: newState });
  };

  if (loading) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600">
        <p className="text-lg">Loading request...</p>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600">
        <p className="text-red-500 text-lg">Request not found.</p>
        <button
          onClick={() => router.push(BASE)}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
        >
          Back to Communications
        </button>
      </main>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="space-y-4 text-gray-600">
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
      </PageContentSection>
    </>
  );
};

export default OtherRequestDetailPage;
