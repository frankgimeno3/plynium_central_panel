"use client";

import { FC, useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import {
  useCompanyRequests,
  RequestState,
  type CompanyContent,
} from "@/app/logged/pages/tickets/hooks/useCompanyRequests";
import type { NotificationComment as PanelTicketComment } from "@/app/contents/notifications.types";
import {
  fulfilledCompanyIdFromPanelTicketUpdates,
  fetchNotificationById,
  updateNotificationApi,
} from "@/app/contents/notifications.types";
import UserSerivce from "@/app/service/UserSerivce.js";
import { PortalService } from "@/app/service/PortalService";
import CompanyCountryAutocomplete, {
  isValidPanelCountryName,
} from "@/app/logged/pages/tickets/components/CompanyCountryAutocomplete";
import CompanyRequestCommentsSection from "./company_request_detail_components/CompanyRequestCommentsSection";

const BASE = "/logged/pages/tickets";

const COUNTRY_NOT_IN_LIST =
  "Company country must be chosen from the list: type to filter, then select a country name (exact match from the Glassinformer list).";

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

/** Matches list tabs; maps to `panel_ticket_state` (e.g. Done → solved). */
const stateOptions: RequestState[] = ["Pending", "In Process", "Other", "Done"];

type UserCardUser = {
  id?: string;
  user_full_name: string;
  user_name: string;
  user_main_image_src?: string;
};

const CompanyRequestDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : (idParam as string) || "";

  const { getById, updateState, addComment, refetch } = useCompanyRequests();
  const [request, setRequest] = useState<ReturnType<typeof getById>>(undefined);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [draftContent, setDraftContent] = useState<CompanyContent | null>(null);
  const [userCard, setUserCard] = useState<UserCardUser | null>(null);
  const [userCardLoading, setUserCardLoading] = useState(false);
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    const decodedId = decodeURIComponent(id).trim();
    const found = getById(decodedId);
    setRequest(found ?? undefined);
    setLoading(false);
  }, [id, getById]);

  useEffect(() => {
    if (!request) return;
    setDraftContent({
      nombre_comercial: request.content.nombre_comercial ?? "",
      nombre_fiscal: request.content.nombre_fiscal ?? "",
      tax_id: request.content.tax_id ?? "",
      cargo_creador: request.content.cargo_creador ?? "",
      web_empresa: request.content.web_empresa ?? "",
      pais_empresa: request.content.pais_empresa ?? "",
      descripcion_empresa: request.content.descripcion_empresa ?? "",
      list_as_employee: Boolean(request.content.list_as_employee),
    });
  }, [request?.companyRequestId]);

  useEffect(() => {
    if (!request?.userId?.trim()) {
      setUserCard(null);
      return;
    }
    let cancelled = false;
    setUserCardLoading(true);
    UserSerivce.getUserById(request.userId.trim())
      .then((u: UserCardUser) => {
        if (!cancelled && u) setUserCard(u);
      })
      .catch(() => {
        if (!cancelled) setUserCard(null);
      })
      .finally(() => {
        if (!cancelled) setUserCardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [request?.userId]);

  useEffect(() => {
    let cancelled = false;
    PortalService.getAllPortals()
      .then((list: { id?: number; portal_id?: number; name?: string; key?: string }[]) => {
        if (cancelled || !Array.isArray(list)) return;
        const mapped = list
          .map((p) => ({
            id: Number(p.id ?? p.portal_id ?? 0),
            name: String(p.name ?? p.key ?? p.id ?? ""),
          }))
          .filter((p) => p.id > 0);
        setPortals(mapped);
        setSelectedPortalIds((prev) => {
          const kept = prev.filter((pid) => mapped.some((m) => m.id === pid));
          if (kept.length > 0) return [...new Set(kept)].sort((a, b) => a - b);
          return mapped[0] ? [mapped[0].id] : [];
        });
      })
      .catch(() => {
        if (!cancelled) setPortals([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (request) {
      setPageMeta({
        pageTitle: "Company Request Details",
        breadcrumbs: [
          { label: "Tickets", href: BASE },
          { label: "Company Creation Requests", href: `${BASE}?tab=company` },
          { label: request.companyRequestId },
        ],
        buttons: [{ label: "Back to Company Requests", href: `${BASE}?tab=company` }],
      });
    } else {
      setPageMeta({
        pageTitle: "Company Request Details",
        breadcrumbs: [
          { label: "Tickets", href: BASE },
          { label: "Company Creation Requests", href: `${BASE}?tab=company` },
        ],
        buttons: [{ label: "Back to Company Requests", href: `${BASE}?tab=company` }],
      });
    }
  }, [setPageMeta, request]);

  const patchDraft = useCallback((patch: Partial<CompanyContent>) => {
    setDraftContent((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const togglePortalSelection = useCallback((portalId: number, nextChecked: boolean) => {
    setSelectedPortalIds((prev) => {
      if (nextChecked) {
        if (prev.includes(portalId)) return prev;
        return [...prev, portalId].sort((a, b) => a - b);
      }
      if (prev.length <= 1) return prev;
      return prev.filter((pid) => pid !== portalId);
    });
  }, []);

  const handleStateChange = (newState: RequestState) => {
    if (!request) return;
    updateState(request.companyRequestId, newState);
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
      await addComment(request.companyRequestId, newComment.trim());
      setNewComment("");
      const refreshed = getById(request.companyRequestId);
      setRequest(refreshed ?? request);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!request || !draftContent) return;
    const name = draftContent.nombre_comercial?.trim();
    if (!name) {
      setCreateError("Trading name is required.");
      return;
    }
    if (draftContent.list_as_employee && !draftContent.cargo_creador?.trim()) {
      setCreateError("Creator role is required when listing as an employee on the directory.");
      return;
    }
    if (selectedPortalIds.length < 1) {
      setCreateError("Select at least one portal for the directory and notifications.");
      return;
    }
    const countryTrim = draftContent.pais_empresa?.trim() ?? "";
    if (!countryTrim || !isValidPanelCountryName(countryTrim)) {
      setCreateError(COUNTRY_NOT_IN_LIST);
      return;
    }
    setCreateError(null);
    setCreateLoading(true);
    try {
      const updated = await updateNotificationApi(request.companyRequestId, {
        state: "solved",
        company_content: draftContent,
        fulfill_portal_ids: [...selectedPortalIds].sort((a, b) => a - b),
      });
      let newCompanyId =
        (typeof updated.fulfilled_company_id === "string" && updated.fulfilled_company_id.trim()
          ? updated.fulfilled_company_id.trim()
          : null) ?? fulfilledCompanyIdFromPanelTicketUpdates(updated.panel_ticket_updates_array);
      if (!newCompanyId) {
        try {
          const again = await fetchNotificationById(request.companyRequestId);
          newCompanyId =
            (typeof again.fulfilled_company_id === "string" && again.fulfilled_company_id.trim()
              ? again.fulfilled_company_id.trim()
              : null) ?? fulfilledCompanyIdFromPanelTicketUpdates(again.panel_ticket_updates_array);
        } catch {
          /* keep null */
        }
      }
      if (newCompanyId) {
        const path = `/logged/pages/network/directory/companies/${encodeURIComponent(newCompanyId)}`;
        window.location.assign(path);
        return;
      }
      await refetch();
      const refreshed = getById(request.companyRequestId);
      if (refreshed) {
        setRequest(refreshed);
        setDraftContent({
          nombre_comercial: refreshed.content.nombre_comercial ?? "",
          nombre_fiscal: refreshed.content.nombre_fiscal ?? "",
          tax_id: refreshed.content.tax_id ?? "",
          cargo_creador: refreshed.content.cargo_creador ?? "",
          web_empresa: refreshed.content.web_empresa ?? "",
          pais_empresa: refreshed.content.pais_empresa ?? "",
          descripcion_empresa: refreshed.content.descripcion_empresa ?? "",
          list_as_employee: Boolean(refreshed.content.list_as_employee),
        });
      }
      setCreateError(
        "The ticket was closed but no new company ID was returned. Open Directory → Companies to find the company, or check server logs for this ticket."
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create company.";
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const profileHref = request?.userId
    ? `/logged/pages/network/users/${encodeURIComponent(request.userId.trim())}`
    : "#";

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

  if (!request || !draftContent) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6 flex flex-col items-center justify-center text-gray-600 min-h-[200px]">
            <p className="text-red-500 text-lg">Request not found.</p>
            <button
              type="button"
              onClick={() => router.push(`${BASE}?tab=company`)}
              className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const isDone = request.request_state === "Done";

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
                <label className="text-sm font-medium text-gray-500 block mb-2">Requester</label>
                {userCardLoading ? (
                  <p className="text-sm text-gray-500">Loading user…</p>
                ) : (
                  <Link
                    href={profileHref}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-950 hover:bg-slate-50 transition-colors max-w-md"
                  >
                    <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-gray-200">
                      {userCard?.user_main_image_src ? (
                        <img
                          src={userCard.user_main_image_src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-medium text-gray-600">
                          {(userCard?.user_full_name || request.userId || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userCard?.user_full_name?.trim() || "User profile"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{userCard?.user_name || request.userId}</p>
                    </div>
                  </Link>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Request Date</label>
                <p className="text-lg text-gray-900">{formatDate(request.request_date)}</p>
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Trading name</label>
                <input
                  type="text"
                  value={draftContent.nombre_comercial}
                  onChange={(e) => patchDraft({ nombre_comercial: e.target.value })}
                  disabled={isDone}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Legal name</label>
                <input
                  type="text"
                  value={draftContent.nombre_fiscal}
                  onChange={(e) => patchDraft({ nombre_fiscal: e.target.value })}
                  disabled={isDone}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tax ID</label>
                <input
                  type="text"
                  value={draftContent.tax_id}
                  onChange={(e) => patchDraft({ tax_id: e.target.value })}
                  disabled={isDone}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Cargo del creador</label>
                <input
                  type="text"
                  value={draftContent.cargo_creador}
                  onChange={(e) => patchDraft({ cargo_creador: e.target.value })}
                  disabled={isDone}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Web de la empresa</label>
                <input
                  type="url"
                  value={draftContent.web_empresa}
                  onChange={(e) => patchDraft({ web_empresa: e.target.value })}
                  disabled={isDone}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="list_as_employee"
                  type="checkbox"
                  checked={Boolean(draftContent.list_as_employee)}
                  onChange={(e) => patchDraft({ list_as_employee: e.target.checked })}
                  disabled={isDone}
                  className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-950"
                />
                <label htmlFor="list_as_employee" className="text-sm font-medium text-gray-700">
                  List as employee on directory
                </label>
              </div>
              {draftContent.list_as_employee && (
                <p className="text-xs text-gray-500 pl-6">
                  Visible role uses &quot;Cargo del creador&quot; above.
                </p>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Company country</label>
                <CompanyCountryAutocomplete
                  value={draftContent.pais_empresa}
                  onChange={(pais_empresa) => patchDraft({ pais_empresa })}
                  disabled={isDone}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Type to filter names from the shared country list; pick one option—free text is not accepted on create.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Company description</label>
                <textarea
                  value={draftContent.descripcion_empresa}
                  onChange={(e) => patchDraft({ descripcion_empresa: e.target.value })}
                  disabled={isDone}
                  rows={5}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100 whitespace-pre-wrap"
                />
              </div>
              {!isDone && portals.length > 0 && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-gray-500">
                    Portals for directory &amp; notifications
                  </legend>
                  <p className="text-xs text-gray-500">Select at least one. Each portal gets a directory entry and a user notification.</p>
                  <div className="mt-2 flex flex-col gap-2 max-w-md">
                    {portals.map((p) => {
                      const checked = selectedPortalIds.includes(p.id);
                      const onlySelected = selectedPortalIds.length === 1 && checked;
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 cursor-pointer text-sm text-gray-900"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={onlySelected}
                            onChange={(e) => togglePortalSelection(p.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-950 disabled:opacity-50"
                          />
                          <span>
                            {p.name} <span className="text-gray-500">(id {p.id})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>

            {createError && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {createError}
              </p>
            )}

            <div className="mt-8 pt-6 border-t uppercase">
              <button
                type="button"
                onClick={() => void handleCreateCompany()}
                disabled={isDone || createLoading}
                className={`inline-flex px-4 py-2 font-medium rounded-lg transition-colors ${
                  isDone || createLoading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-950 text-white hover:bg-blue-900 cursor-pointer"
                }`}
              >
                {createLoading ? "Creating…" : isDone ? "Company created" : "Create company"}
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <CompanyRequestCommentsSection
          sortedComments={sortedComments}
          newComment={newComment}
          onNewCommentChange={setNewComment}
          onAddComment={handleAddComment}
          isAddingComment={isAddingComment}
          formatDate={formatDate}
        />
      </PageContentSection>
    </>
  );
};

export default CompanyRequestDetailPage;