"use client";

import { FC, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useCompanyRequests, RequestState } from "@/app/logged/pages/network/requests/hooks/useCompanyRequests";

const BASE = "/logged/pages/communications";

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

const stateOptions: RequestState[] = ["Pending", "In Process", "Other"];

const CompanyRequestDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : (idParam as string) || "";

  const { getById, updateState } = useCompanyRequests();
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
        pageTitle: "Company Request Details",
        breadcrumbs: [
          { label: "Communications", href: BASE },
          { label: "Company Creation Requests", href: BASE },
          { label: request.companyRequestId },
        ],
        buttons: [{ label: "Back to Company Requests", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Company Request Details",
        breadcrumbs: [
          { label: "Communications", href: BASE },
          { label: "Company Creation Requests", href: BASE },
        ],
        buttons: [{ label: "Back to Company Requests", href: BASE }],
      });
    }
  }, [setPageMeta, request]);

  const handleStateChange = (newState: RequestState) => {
    if (!request) return;
    updateState(request.companyRequestId, newState);
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
              onClick={() => router.push(`${BASE}`)}
              className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
            >
              Back to Communications
            </button>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const { content } = request;

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6 text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Request ID</label>
              <p className="text-lg text-gray-900 font-mono">{request.companyRequestId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">State</label>
              <select
                value={request.request_state}
                onChange={(e) => handleStateChange(e.target.value as RequestState)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-950 focus:border-blue-950 text-gray-900"
              >
                {stateOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="text-lg text-gray-900">{request.userId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Request Date</label>
              <p className="text-lg text-gray-900">{formatDate(request.request_date)}</p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Trading name</label>
              <p className="text-base text-gray-900">{content.nombre_comercial}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Legal name</label>
              <p className="text-base text-gray-900">{content.nombre_fiscal}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tax ID</label>
              <p className="text-base text-gray-900">{content.tax_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Cargo del creador</label>
              <p className="text-base text-gray-900">{content.cargo_creador}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Web de la empresa</label>
              <p className="text-base text-gray-900">{content.web_empresa}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Company country</label>
              <p className="text-base text-gray-900">{content.pais_empresa}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Company description</label>
              <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">
                {content.descripcion_empresa}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t uppercase">
            <Link
              href="/logged/pages/network/directory/companies/create"
              className="inline-flex px-4 py-2 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors"
            >
              Create company
            </Link>
          </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default CompanyRequestDetailPage;
