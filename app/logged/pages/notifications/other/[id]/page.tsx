"use client";

import { FC, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useOtherRequests, RequestState } from "@/app/logged/pages/network/requests/hooks/useOtherRequests";

const BASE = "/logged/pages/notifications";

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
          { label: "Notifications", href: BASE },
          { label: "Other Communications", href: `${BASE}?tab=other` },
          { label: request.id },
        ],
        buttons: [{ label: "Back to Other Communications", href: `${BASE}?tab=other` }],
      });
    } else {
      setPageMeta({
        pageTitle: "Request Details",
        breadcrumbs: [
          { label: "Notifications", href: BASE },
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
              Back to Notifications
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
    </>
  );
};

export default OtherRequestDetailPage;
