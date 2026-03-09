"use client";

import { FC, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContentLayout from '@/app/logged/logged_components/PageContentLayout';
import PageContentSection from '@/app/logged/logged_components/PageContentSection';
import { useCompanyRequests, RequestState } from '../../hooks/useCompanyRequests';

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

const stateOptions: RequestState[] = ['Pending', 'In Process', 'Other'];

const CompanyRequestDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : (idParam as string) || '';

  const { getById, updateState } = useCompanyRequests();
  const [request, setRequest] = useState<ReturnType<typeof getById>>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decodedId = decodeURIComponent(id).trim();
    const found = getById(decodedId);
    setRequest(found ?? undefined);
    setLoading(false);
  }, [id, getById]);

  const handleStateChange = (newState: RequestState) => {
    if (!request) return;
    updateState(request.companyRequestId, newState);
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
          onClick={() => router.push('/logged/pages/network/requests/company')}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
        >
          Back to Company Requests
        </button>
      </main>
    );
  }

  const { content } = request;

  const breadcrumbs = [
    { label: "Requests", href: "/logged/pages/network/requests" },
    { label: "Company requests", href: "/logged/pages/network/requests/company" },
    { label: request.companyRequestId },
  ];

  return (
    <PageContentLayout
      pageTitle="Company Request Details"
      breadcrumbs={breadcrumbs}
      buttons={[{ label: "Back to Company Requests", href: "/logged/pages/network/requests/company" }]}
    >
      <PageContentSection>
        <div className="flex flex-col w-full text-gray-600">
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
                  <option key={s} value={s}>{s}</option>
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
              <label className="text-sm font-medium text-gray-500">Nombre comercial</label>
              <p className="text-base text-gray-900">{content.nombre_comercial}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre fiscal</label>
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
              <label className="text-sm font-medium text-gray-500">País de la empresa</label>
              <p className="text-base text-gray-900">{content.pais_empresa}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Descripción de la empresa</label>
              <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{content.descripcion_empresa}</p>
            </div>
          </div>
        </div>
      </PageContentSection>
    </PageContentLayout>
  );
};

export default CompanyRequestDetailPage;
