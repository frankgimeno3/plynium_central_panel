"use client";

import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import UserService from '@/app/service/UserSerivce.js';
import { ContactService } from '@/app/service/ContactService';
import apiClient from "@/app/apiClient";
import SelectContactModal from "@/app/logged/logged_components/modals/SelectContactModal";
import SelectNewsletterListModal, { type NewsletterListRow } from "@/app/logged/logged_components/modals/SelectNewsletterListModal";
import ConfirmActionModal from "@/app/logged/logged_components/modals/ConfirmActionModal";
import { PortalService } from "@/app/service/PortalService";

type PortalRow = { id: number; key: string; name: string };

interface UserDetail {
  id?: string;
  id_user: string; // email
  user_full_name: string;
  user_name: string;
  user_surnames?: string;
  user_role: string;
  user_description: string;
  user_main_image_src?: string;
  linkedin_profile?: string | null;
  userListArray?: string[];
  enabled?: boolean;
  contact_id_array?: string[];
}

type ContactFromJson = {
  id_contact: string;
  name?: string;
  email?: string;
  id_user?: string;
  userListArray?: string[];
};
type ExperienceRow = {
  employee_rel_id: string;
  employee_company_id: string;
  employee_role: string;
  employee_rel_status?: string | null;
  employee_rel_start_date?: string | null;
  employee_rel_end_date?: string | null;
  company_commercial_name?: string | null;
};

type UserListSubscriptionRow = {
  user_list_subscription_id: string;
  user_id: string;
  newsletter_user_list_id: string;
  created_at?: string | null;
  newsletter_user_list_name?: string | null;
};

type EnrichedSubscriptionRow = UserListSubscriptionRow & {
  portalId: number | null;
  newsletterListType: "main" | "specific";
  displayName: string;
};

type SubPortalFilter = { name: string; id: string; listType: "all" | "main" | "specific" };

type UserFeedPreferenceRow = {
  user_feed_preference_id: string;
  user_id: string;
  topic_id: number;
  preference_state: string;
  topic_name?: string | null;
  /** Portal from `topic_portals`; null if topic has no portal rows (shown under Other). */
  portal_id?: number | null;
};

const USER_LIST_DETAIL_BASE = "/logged/pages/network/users/lists";
const TOPICS_PAGE_HREF = "/logged/pages/network/contents/topics";
const SUBSCRIPTIONS_PAGE_SIZE = 10;

const UserDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id_user;
  const id_user = Array.isArray(idParam) ? idParam[0] : (idParam as string) || '';

  const [user, setUser] = useState<UserDetail | null>(null);
  const [contactsData, setContactsData] = useState<ContactFromJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setPageMeta } = usePageContent();
  const [experience, setExperience] = useState<ExperienceRow[]>([]);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactsLinkError, setContactsLinkError] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id_contact: string; label: string } | null>(null);
  const [unlinkingContact, setUnlinkingContact] = useState(false);
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);
  const [savingNewsletter, setSavingNewsletter] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [allLists, setAllLists] = useState<NewsletterListRow[]>([]);
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [newsletterPortalTab, setNewsletterPortalTab] = useState<number | "other" | null>(null);
  const [newsletterUnsubTarget, setNewsletterUnsubTarget] = useState<{
    userList_id: string;
    userListName: string;
  } | null>(null);
  const [unsubscribingNewsletter, setUnsubscribingNewsletter] = useState(false);
  const [listSubscriptions, setListSubscriptions] = useState<UserListSubscriptionRow[]>([]);
  const [listSubscriptionsLoading, setListSubscriptionsLoading] = useState(false);
  const [listSubscriptionsError, setListSubscriptionsError] = useState<string | null>(null);
  const [feedPreferences, setFeedPreferences] = useState<UserFeedPreferenceRow[]>([]);
  const [feedPreferencesLoading, setFeedPreferencesLoading] = useState(false);
  const [feedPreferencesError, setFeedPreferencesError] = useState<string | null>(null);
  const [feedPrefPortalTab, setFeedPrefPortalTab] = useState<number | "other" | null>(null);
  const [subscriptionPortalTab, setSubscriptionPortalTab] = useState<number | "other" | null>(null);
  const [subFiltersByPortal, setSubFiltersByPortal] = useState<Record<string, SubPortalFilter>>({});
  const [subsMainPage, setSubsMainPage] = useState(1);
  const [subsSpecificPage, setSubsSpecificPage] = useState(1);

  const [form, setForm] = useState({
    user_full_name: "",
    user_name: "",
    user_surnames: "",
    user_role: "",
    user_description: "",
    linkedin_profile: "",
  });

  useEffect(() => {
    ContactService.getAllContacts()
      .then((l) => setContactsData(Array.isArray(l) ? l as ContactFromJson[] : []))
      .catch(() => setContactsData([]));
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!id_user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await UserService.getUserById(decodeURIComponent(id_user));
        setUser(data);
        setForm({
          user_full_name: String(data?.user_full_name ?? ""),
          user_name: String(data?.user_name ?? ""),
          user_surnames: String(data?.user_surnames ?? ""),
          user_role: String(data?.user_role ?? ""),
          user_description: String(data?.user_description ?? ""),
          linkedin_profile: String(data?.linkedin_profile ?? ""),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id_user]);

  useEffect(() => {
    if (!id_user) return;
    setListSubscriptionsLoading(true);
    setListSubscriptionsError(null);
    setFeedPreferencesLoading(true);
    setFeedPreferencesError(null);
    const encoded = encodeURIComponent(id_user);
    Promise.all([
      apiClient
        .get(`/api/v1/admin/user/${encoded}/list-subscriptions`)
        .then((res) => {
          const list = Array.isArray(res.data) ? (res.data as UserListSubscriptionRow[]) : [];
          setListSubscriptions(list);
        })
        .catch((e: unknown) => {
          const message =
            e && typeof e === "object" && "message" in e
              ? String((e as { message: unknown }).message)
              : "Error loading user subscriptions";
          setListSubscriptionsError(message);
          setListSubscriptions([]);
        }),
      apiClient
        .get(`/api/v1/admin/user/${encoded}/feed-preferences`)
        .then((res) => {
          const list = Array.isArray(res.data) ? (res.data as UserFeedPreferenceRow[]) : [];
          setFeedPreferences(list);
        })
        .catch((e: unknown) => {
          const message =
            e && typeof e === "object" && "message" in e
              ? String((e as { message: unknown }).message)
              : "Error loading user preferences";
          setFeedPreferencesError(message);
          setFeedPreferences([]);
        }),
    ]).finally(() => {
      setListSubscriptionsLoading(false);
      setFeedPreferencesLoading(false);
    });
  }, [id_user]);

  useEffect(() => {
    if (!user?.id) return;
    setExperienceLoading(true);
    setExperienceError(null);
    apiClient
      .get("/api/v1/employee-relations", {
        params: { userId: user.id, status: "" },
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? (res.data as ExperienceRow[]) : [];
        setExperience(list);
      })
      .catch((e: unknown) => {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Error loading experience";
        setExperienceError(message);
        setExperience([]);
      })
      .finally(() => setExperienceLoading(false));
  }, [user?.id]);

  const refreshUserLists = useCallback(() => {
    apiClient
      .get("/api/v1/user-lists")
      .then((res) => setAllLists(Array.isArray(res.data) ? (res.data as NewsletterListRow[]) : []))
      .catch(() => setAllLists([]));
  }, []);

  useEffect(() => {
    refreshUserLists();
  }, [refreshUserLists]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const plist = await PortalService.getAllPortals();
        if (cancelled) return;
        const sorted = [...(Array.isArray(plist) ? plist : [])].sort(
          (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
        ) as PortalRow[];
        setPortals(sorted);
      } catch {
        if (!cancelled) setPortals([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const portalTabsSorted = useMemo(
    () => [...portals].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)),
    [portals]
  );

  const portalIdSet = useMemo(
    () => new Set(portalTabsSorted.map((p) => Number(p.id))),
    [portalTabsSorted]
  );

  useEffect(() => {
    if (portalTabsSorted.length === 0) {
      setNewsletterPortalTab(null);
      return;
    }
    setNewsletterPortalTab((prev) => {
      if (prev === "other") return prev;
      if (prev != null && portalTabsSorted.some((p) => Number(p.id) === Number(prev))) return prev;
      return Number(portalTabsSorted[0].id);
    });
  }, [portalTabsSorted]);

  useEffect(() => {
    if (portalTabsSorted.length === 0) {
      setSubscriptionPortalTab(null);
      return;
    }
    setSubscriptionPortalTab((prev) => {
      if (prev === "other") return prev;
      if (prev != null && portalTabsSorted.some((p) => Number(p.id) === Number(prev))) return prev;
      return Number(portalTabsSorted[0].id);
    });
  }, [portalTabsSorted]);

  useEffect(() => {
    if (portalTabsSorted.length === 0) {
      setFeedPrefPortalTab(null);
      return;
    }
    setFeedPrefPortalTab((prev) => {
      if (prev === "other") return prev;
      if (prev != null && portalTabsSorted.some((p) => Number(p.id) === Number(prev))) return prev;
      return Number(portalTabsSorted[0].id);
    });
  }, [portalTabsSorted]);

  const enrichedSubscriptionRows = useMemo((): EnrichedSubscriptionRow[] => {
    return listSubscriptions.map((row) => {
      const lid = String(row.newsletter_user_list_id);
      const meta = allLists.find((l) => String(l.userList_id) === lid);
      const rawType = meta?.newsletterListType;
      const newsletterListType: "main" | "specific" =
        rawType === "main" ? "main" : "specific";
      const portalId =
        meta?.portalId != null && Number.isFinite(Number(meta.portalId))
          ? Number(meta.portalId)
          : null;
      const displayName =
        String(meta?.userListName ?? "").trim() ||
        String(row.newsletter_user_list_name ?? "").trim() ||
        `${lid.slice(0, 8)}…`;
      return {
        ...row,
        portalId,
        newsletterListType,
        displayName,
      };
    });
  }, [listSubscriptions, allLists]);

  const showOtherSubscriptionTab = useMemo(
    () =>
      enrichedSubscriptionRows.some(
        (r) => r.portalId == null || !portalIdSet.has(Number(r.portalId))
      ),
    [enrichedSubscriptionRows, portalIdSet]
  );

  const rowsInActiveSubscriptionView = useMemo(() => {
    if (portalTabsSorted.length === 0) return enrichedSubscriptionRows;
    if (subscriptionPortalTab === "other") {
      return enrichedSubscriptionRows.filter(
        (r) => r.portalId == null || !portalIdSet.has(Number(r.portalId))
      );
    }
    if (subscriptionPortalTab == null) return [];
    return enrichedSubscriptionRows.filter(
      (r) => Number(r.portalId) === Number(subscriptionPortalTab)
    );
  }, [
    enrichedSubscriptionRows,
    subscriptionPortalTab,
    portalIdSet,
    portalTabsSorted,
  ]);

  const subscriptionFilterTabKey =
    portalTabsSorted.length === 0
      ? "all"
      : subscriptionPortalTab === "other"
        ? "other"
        : String(subscriptionPortalTab ?? "");

  const activeSubscriptionFilter = useMemo(
    () =>
      subFiltersByPortal[subscriptionFilterTabKey] ?? {
        name: "",
        id: "",
        listType: "all" as const,
      },
    [subFiltersByPortal, subscriptionFilterTabKey]
  );

  const setActiveSubscriptionFilter = useCallback(
    (patch: Partial<SubPortalFilter>) => {
      setSubFiltersByPortal((prev) => ({
        ...prev,
        [subscriptionFilterTabKey]: {
          ...(prev[subscriptionFilterTabKey] ?? {
            name: "",
            id: "",
            listType: "all",
          }),
          ...patch,
        },
      }));
    },
    [subscriptionFilterTabKey]
  );

  const filteredSubscriptionsInView = useMemo(() => {
    const nameQ = activeSubscriptionFilter.name.trim().toLowerCase();
    const idQ = activeSubscriptionFilter.id.trim().toLowerCase();
    const lt = activeSubscriptionFilter.listType;
    return rowsInActiveSubscriptionView.filter((r) => {
      if (nameQ && !r.displayName.toLowerCase().includes(nameQ)) return false;
      if (idQ && !String(r.newsletter_user_list_id).toLowerCase().includes(idQ)) return false;
      if (lt === "main" && r.newsletterListType !== "main") return false;
      if (lt === "specific" && r.newsletterListType === "main") return false;
      return true;
    });
  }, [rowsInActiveSubscriptionView, activeSubscriptionFilter]);

  const filteredMainSubscriptions = useMemo(
    () =>
      [...filteredSubscriptionsInView]
        .filter((r) => r.newsletterListType === "main")
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
        ),
    [filteredSubscriptionsInView]
  );

  const filteredSpecificSubscriptions = useMemo(
    () =>
      [...filteredSubscriptionsInView]
        .filter((r) => r.newsletterListType !== "main")
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
        ),
    [filteredSubscriptionsInView]
  );

  useEffect(() => {
    setSubsMainPage(1);
    setSubsSpecificPage(1);
  }, [subscriptionPortalTab, subscriptionFilterTabKey, subFiltersByPortal]);

  const mainSubsPagination = useMemo(() => {
    const total = filteredMainSubscriptions.length;
    if (total === 0) {
      return { page: 1, lastPage: 1, from: 0, to: 0, total: 0, rows: [] as EnrichedSubscriptionRow[] };
    }
    const lastPage = Math.max(1, Math.ceil(total / SUBSCRIPTIONS_PAGE_SIZE));
    const page = Math.min(Math.max(1, subsMainPage), lastPage);
    const from = (page - 1) * SUBSCRIPTIONS_PAGE_SIZE + 1;
    const to = Math.min(total, page * SUBSCRIPTIONS_PAGE_SIZE);
    const rows = filteredMainSubscriptions.slice(from - 1, from - 1 + SUBSCRIPTIONS_PAGE_SIZE);
    return { page, lastPage, from, to, total, rows };
  }, [filteredMainSubscriptions, subsMainPage]);

  const specificSubsPagination = useMemo(() => {
    const total = filteredSpecificSubscriptions.length;
    if (total === 0) {
      return { page: 1, lastPage: 1, from: 0, to: 0, total: 0, rows: [] as EnrichedSubscriptionRow[] };
    }
    const lastPage = Math.max(1, Math.ceil(total / SUBSCRIPTIONS_PAGE_SIZE));
    const page = Math.min(Math.max(1, subsSpecificPage), lastPage);
    const from = (page - 1) * SUBSCRIPTIONS_PAGE_SIZE + 1;
    const to = Math.min(total, page * SUBSCRIPTIONS_PAGE_SIZE);
    const rows = filteredSpecificSubscriptions.slice(from - 1, from - 1 + SUBSCRIPTIONS_PAGE_SIZE);
    return { page, lastPage, from, to, total, rows };
  }, [filteredSpecificSubscriptions, subsSpecificPage]);

  const assignedNewsletterRows = useMemo(() => {
    const ids = new Set((user?.userListArray ?? []).map(String));
    return allLists.filter((l) => ids.has(String(l.userList_id)));
  }, [user?.userListArray, allLists]);

  const showOtherNewsletterTab = useMemo(
    () =>
      assignedNewsletterRows.some(
        (l) => l.portalId == null || !portalIdSet.has(Number(l.portalId))
      ),
    [assignedNewsletterRows, portalIdSet]
  );

  const rowsInActiveNewsletterView = useMemo(() => {
    if (portalTabsSorted.length === 0) return assignedNewsletterRows;
    if (newsletterPortalTab === "other") {
      return assignedNewsletterRows.filter(
        (l) => l.portalId == null || !portalIdSet.has(Number(l.portalId))
      );
    }
    if (newsletterPortalTab == null) return [];
    return assignedNewsletterRows.filter((l) => Number(l.portalId) === Number(newsletterPortalTab));
  }, [assignedNewsletterRows, newsletterPortalTab, portalIdSet, portalTabsSorted]);

  const mainNewsletterRows = useMemo(
    () =>
      [...rowsInActiveNewsletterView]
        .filter((l) => l.newsletterListType === "main")
        .sort((a, b) =>
          String(a.userListName ?? "").localeCompare(String(b.userListName ?? ""), undefined, {
            sensitivity: "base",
          })
        ),
    [rowsInActiveNewsletterView]
  );

  const specificNewsletterRows = useMemo(
    () =>
      [...rowsInActiveNewsletterView]
        .filter((l) => l.newsletterListType !== "main")
        .sort((a, b) =>
          String(a.userListName ?? "").localeCompare(String(b.userListName ?? ""), undefined, {
            sensitivity: "base",
          })
        ),
    [rowsInActiveNewsletterView]
  );

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return String(iso);
    }
  };

  const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(iso);
    }
  };

  const portalNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of portals) {
      const id = Number(p.id);
      if (Number.isFinite(id)) m.set(id, p.name || p.key || String(id));
    }
    return m;
  }, [portals]);

  const showOtherFeedPrefTab = useMemo(
    () =>
      feedPreferences.some(
        (r) =>
          r.portal_id == null ||
          !Number.isFinite(Number(r.portal_id)) ||
          !portalIdSet.has(Number(r.portal_id))
      ),
    [feedPreferences, portalIdSet]
  );

  const rowsInActiveFeedPrefView = useMemo(() => {
    if (portalTabsSorted.length === 0) return feedPreferences;
    if (feedPrefPortalTab === "other") {
      return feedPreferences.filter(
        (r) =>
          r.portal_id == null ||
          !Number.isFinite(Number(r.portal_id)) ||
          !portalIdSet.has(Number(r.portal_id))
      );
    }
    if (feedPrefPortalTab == null) return [];
    return feedPreferences.filter((r) => Number(r.portal_id) === Number(feedPrefPortalTab));
  }, [feedPreferences, feedPrefPortalTab, portalIdSet, portalTabsSorted]);

  const sortedFeedPrefRowsInView = useMemo(
    () =>
      [...rowsInActiveFeedPrefView].sort((a, b) => {
        const na = String(a.topic_name ?? "").toLowerCase();
        const nb = String(b.topic_name ?? "").toLowerCase();
        if (na !== nb) return na.localeCompare(nb, undefined, { sensitivity: "base" });
        return Number(a.topic_id) - Number(b.topic_id);
      }),
    [rowsInActiveFeedPrefView]
  );

  useEffect(() => {
    if (user) {
      setPageMeta({
        pageTitle: "User details",
        breadcrumbs: [
          { label: "Users", href: "/logged/pages/network/users" },
          { label: user.user_full_name ?? user.id_user },
        ],
        buttons: [{ label: "Back to Users", href: "/logged/pages/network/users" }],
      });
    } else {
      setPageMeta({
        pageTitle: "User details",
        breadcrumbs: [{ label: "Users", href: "/logged/pages/network/users" }],
        buttons: [{ label: "Back to Users", href: "/logged/pages/network/users" }],
      });
    }
  }, [setPageMeta, user]);

  const linkedContacts = useMemo(() => {
    if (!user?.id) return [];
    const uid = String(user.id);
    const list = Array.isArray(contactsData) ? contactsData : [];
    return list.filter((c) =>
      Array.isArray(c.userListArray) ? c.userListArray.map(String).includes(uid) : false
    );
  }, [user?.id, contactsData]);

  const isDirty =
    !!user &&
    (form.user_full_name !== String(user.user_full_name ?? "") ||
      form.user_name !== String(user.user_name ?? "") ||
      form.user_surnames !== String(user.user_surnames ?? "") ||
      form.user_role !== String(user.user_role ?? "") ||
      form.user_description !== String(user.user_description ?? "") ||
      form.linkedin_profile !== String(user.linkedin_profile ?? ""));

  const linkedinError = useMemo(() => {
    const val = form.linkedin_profile.trim();
    if (!val) return null;
    try {
      const u = new URL(val);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "LinkedIn profile must be a valid URL.";
      return null;
    } catch {
      return "LinkedIn profile must be a valid URL.";
    }
  }, [form.linkedin_profile]);

  const canSave = isDirty && !linkedinError;

  const executeSave = async () => {
    if (!user) return;
    if (linkedinError) {
      setSaveError(linkedinError);
      setConfirmOpen(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (!user.id) {
        throw new Error("Missing user id");
      }
      const uid = encodeURIComponent(user.id);

      // RDS users_db (name, surnames, description, role) + optional Cognito "name" on the server.
      // Avoids PUT /api/v1/admin/user which requires Cognito group "admin".
      await apiClient.patch(`/api/v1/admin/user/${uid}/profile`, {
        user_full_name: form.user_full_name,
        user_name: form.user_name,
        user_surnames: form.user_surnames,
        user_role: form.user_role,
        user_description: form.user_description,
      });

      await apiClient.patch(`/api/v1/admin/user/${uid}/linkedin`, {
        linkedin_profile: form.linkedin_profile,
      });

      window.location.reload();
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Error saving";
      setSaveError(message);
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-600">
              <p className="text-lg">Loading user...</p>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (error || !user) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-600">
              <p className="text-red-500 text-lg">{error || 'User not found'}</p>
              <button
                onClick={() => router.push('/logged/pages/network/users')}
                className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-gray-600">
        {isDirty && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!canSave}
            className="fixed bottom-6 right-6 z-50 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save changes
          </button>
        )}
        <div className="flex flex-col w-full">
          {user.user_main_image_src && (
            <div className="mb-6">
              <img
                src={user.user_main_image_src}
                alt={user.user_full_name}
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="text-lg text-gray-900 font-mono">{user.id ?? "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg text-gray-900 font-mono">{user.id_user}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Full name</label>
              <input
                type="text"
                value={form.user_full_name}
                onChange={(e) => setForm((f) => ({ ...f, user_full_name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <input
                type="text"
                value={form.user_name}
                onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last name</label>
              <input
                type="text"
                value={form.user_surnames}
                onChange={(e) => setForm((f) => ({ ...f, user_surnames: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <input
                type="text"
                value={form.user_role}
                onChange={(e) => setForm((f) => ({ ...f, user_role: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <input
                type="text"
                value={form.user_description}
                onChange={(e) => setForm((f) => ({ ...f, user_description: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">LinkedIn profile</label>
              <input
                type="url"
                value={form.linkedin_profile}
                onChange={(e) => setForm((f) => ({ ...f, linkedin_profile: e.target.value }))}
                placeholder="https://www.linkedin.com/in/username"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {linkedinError && (
                <p className="mt-1 text-xs text-red-600">{linkedinError}</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Plynium Account Contact</h2>
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Add contact"
              >
                [ + ]
              </button>
            </div>

            {contactsLinkError && (
              <p className="text-sm text-red-600 mb-3">{contactsLinkError}</p>
            )}

            {linkedContacts.length === 0 ? (
              <p className="text-sm text-gray-500">No contacts linked.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {linkedContacts.map((c) => {
                  const href = `/logged/pages/account-management/contacts_db/${encodeURIComponent(
                    c.id_contact
                  )}`;
                  const title =
                    String(c.name ?? "").trim() ||
                    c.email ||
                    c.id_contact;
                  return (
                    <div
                      key={c.id_contact}
                      className="relative rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(href)}
                        className="block w-full text-left"
                      >
                        <p className="text-sm font-semibold text-gray-900 truncate pr-10">{title}</p>
                        <p className="mt-1 text-xs font-mono text-gray-500 truncate pr-10">{c.id_contact}</p>
                        {c.email ? (
                          <p className="mt-1 text-xs text-gray-600 truncate pr-10">{c.email}</p>
                        ) : null}
                      </button>

                      <div className="absolute top-3 right-3">
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => setUnlinkTarget({ id_contact: c.id_contact, label: title })}
                            className="w-8 h-8 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                            aria-label="Unlink contact from user"
                          >
                            ×
                          </button>
                          <div className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block">
                            <div className="whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow">
                              Unlink contact from user
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Newsletter Lists</h2>
              <button
                type="button"
                onClick={() => setNewsletterModalOpen(true)}
                className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Add newsletter list"
              >
                [ + ]
              </button>
            </div>

            {newsletterError && <p className="text-sm text-red-600 mb-3">{newsletterError}</p>}

            {Array.isArray(user.userListArray) && user.userListArray.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {portalTabsSorted.length > 0 ? (
                  <div className="flex border-b border-gray-200 bg-gray-50 flex-wrap shrink-0">
                    {portalTabsSorted.map((p) => {
                      const pid = Number(p.id);
                      const count = assignedNewsletterRows.filter((l) => Number(l.portalId) === pid).length;
                      const active = newsletterPortalTab !== "other" && Number(newsletterPortalTab) === pid;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewsletterPortalTab(pid)}
                          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                            active
                              ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <span className="truncate max-w-[10rem]">{p.name || p.key}</span>
                          <span className="text-xs font-normal text-gray-500 tabular-nums">({count})</span>
                        </button>
                      );
                    })}
                    {showOtherNewsletterTab ? (
                      <button
                        type="button"
                        onClick={() => setNewsletterPortalTab("other")}
                        className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                          newsletterPortalTab === "other"
                            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        Other
                        <span className="text-xs font-normal text-gray-500 tabular-nums">
                          (
                          {
                            assignedNewsletterRows.filter(
                              (l) => l.portalId == null || !portalIdSet.has(Number(l.portalId))
                            ).length
                          }
                          )
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="p-4">
                  {portalTabsSorted.length === 0 ? (
                    <p className="text-xs text-gray-500 mb-4">
                      No portals in <span className="font-mono">portals_db</span>; showing all assigned lists.
                    </p>
                  ) : null}

                  <div>
                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Main
                    </h3>
                    {mainNewsletterRows.length === 0 ? (
                      <p className="text-sm text-gray-500 mb-6">No main lists for this view.</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Topic
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Description
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[1%] whitespace-nowrap">
                                Subscription
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {mainNewsletterRows.map((row) => {
                              const href = `/logged/pages/network/users/lists/${encodeURIComponent(row.userList_id)}`;
                              return (
                                <tr
                                  key={row.userList_id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => router.push(href)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      router.push(href);
                                    }
                                  }}
                                  className="hover:bg-gray-50 cursor-pointer"
                                >
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900 max-w-[14rem] truncate">
                                    {row.userListName || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700 max-w-[10rem] truncate">
                                    {row.userListTopic || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600 max-w-md truncate">
                                    {row.userListDescription || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNewsletterUnsubTarget({
                                          userList_id: String(row.userList_id),
                                          userListName: String(row.userListName ?? row.userList_id),
                                        });
                                      }}
                                      className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                    >
                                      Cancel subscription
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 mt-2">
                      Specific
                    </h3>
                    {specificNewsletterRows.length === 0 ? (
                      <p className="text-sm text-gray-500">No specific lists for this view.</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Topic
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Description
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[1%] whitespace-nowrap">
                                Subscription
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {specificNewsletterRows.map((row) => {
                              const href = `/logged/pages/network/users/lists/${encodeURIComponent(row.userList_id)}`;
                              return (
                                <tr
                                  key={row.userList_id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => router.push(href)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      router.push(href);
                                    }
                                  }}
                                  className="hover:bg-gray-50 cursor-pointer"
                                >
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900 max-w-[14rem] truncate">
                                    {row.userListName || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700 max-w-[10rem] truncate">
                                    {row.userListTopic || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600 max-w-md truncate">
                                    {row.userListDescription || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNewsletterUnsubTarget({
                                          userList_id: String(row.userList_id),
                                          userListName: String(row.userListName ?? row.userList_id),
                                        });
                                      }}
                                      className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                    >
                                      Cancel subscription
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No newsletter lists assigned.</p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>

            {experienceError && (
              <p className="text-sm text-red-600 mb-3">{experienceError}</p>
            )}

            {experienceLoading ? (
              <p className="text-sm text-gray-500">Loading experience...</p>
            ) : experience.length === 0 ? (
              <p className="text-sm text-gray-500">No experience records.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        From
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {experience.map((er) => {
                      const companyHref = `/logged/pages/network/directory/companies/${encodeURIComponent(
                        er.employee_company_id
                      )}`;
                      const companyLabel =
                        er.company_commercial_name?.trim() || er.employee_company_id;
                      return (
                        <tr
                          key={er.employee_rel_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(companyHref)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(companyHref);
                            }
                          }}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {er.employee_role || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                            {companyLabel}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(er.employee_rel_start_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {er.employee_rel_end_date ? formatDate(er.employee_rel_end_date) : "Present"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {er.employee_rel_status ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">User subscriptions</h3>
            <p className="text-sm text-gray-500 mb-3">
              Rows from <code className="rounded bg-gray-100 px-1">user_list_subscriptions</code>, grouped by
              portal (metadata from newsletter lists). Main lists first, then specific.
            </p>
            {listSubscriptionsError && (
              <p className="text-sm text-red-600 mb-3">{listSubscriptionsError}</p>
            )}
            {listSubscriptionsLoading ? (
              <p className="text-sm text-gray-500">Loading subscriptions…</p>
            ) : listSubscriptions.length === 0 ? (
              <p className="text-sm text-gray-500">No newsletter list subscriptions.</p>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {portalTabsSorted.length > 0 ? (
                  <div className="flex border-b border-gray-200 bg-gray-50 flex-wrap shrink-0">
                    {portalTabsSorted.map((p) => {
                      const pid = Number(p.id);
                      const count = enrichedSubscriptionRows.filter(
                        (r) => Number(r.portalId) === pid
                      ).length;
                      const active =
                        subscriptionPortalTab !== "other" &&
                        Number(subscriptionPortalTab) === pid;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSubscriptionPortalTab(pid)}
                          className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                            active
                              ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <span className="truncate max-w-[10rem]">{p.name || p.key}</span>
                          <span className="text-xs font-normal text-gray-500 tabular-nums">({count})</span>
                        </button>
                      );
                    })}
                    {showOtherSubscriptionTab ? (
                      <button
                        type="button"
                        onClick={() => setSubscriptionPortalTab("other")}
                        className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                          subscriptionPortalTab === "other"
                            ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        Other
                        <span className="text-xs font-normal text-gray-500 tabular-nums">
                          (
                          {
                            enrichedSubscriptionRows.filter(
                              (r) => r.portalId == null || !portalIdSet.has(Number(r.portalId))
                            ).length
                          }
                          )
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 px-4 py-2 bg-gray-50 border-b border-gray-200">
                    No portals in <span className="font-mono">portals_db</span>; showing all subscriptions in one
                    view.
                  </p>
                )}

                <div className="p-4 space-y-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                    <div className="min-w-[12rem] flex-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                        Filter by name
                      </label>
                      <input
                        type="search"
                        value={activeSubscriptionFilter.name}
                        onChange={(e) => setActiveSubscriptionFilter({ name: e.target.value })}
                        placeholder="List name…"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="min-w-[12rem] flex-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                        Filter by list ID
                      </label>
                      <input
                        type="search"
                        value={activeSubscriptionFilter.id}
                        onChange={(e) => setActiveSubscriptionFilter({ id: e.target.value })}
                        placeholder="UUID substring…"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="min-w-[10rem]">
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                        List type
                      </label>
                      <select
                        value={activeSubscriptionFilter.listType}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "all" || v === "main" || v === "specific") {
                            setActiveSubscriptionFilter({ listType: v });
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All types</option>
                        <option value="main">Main only</option>
                        <option value="specific">Specific only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Main</h4>
                    {filteredMainSubscriptions.length === 0 ? (
                      <p className="text-sm text-gray-500 mb-4">No main list subscriptions in this view.</p>
                    ) : (
                      <div className="mb-6 flex flex-col overflow-hidden rounded-lg border border-gray-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  List
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  List ID
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Subscribed at
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {mainSubsPagination.rows.map((row) => {
                                const listHref = `${USER_LIST_DETAIL_BASE}/${encodeURIComponent(
                                  String(row.newsletter_user_list_id)
                                )}`;
                                return (
                                  <tr
                                    key={String(row.user_list_subscription_id)}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => router.push(listHref)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        router.push(listHref);
                                      }
                                    }}
                                    className="cursor-pointer bg-blue-950 transition-colors hover:bg-blue-900"
                                  >
                                    <td className="px-4 py-2 text-sm">
                                      <span className="font-medium text-white">{row.displayName}</span>
                                      <span className="ml-2 inline-flex rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                                        main
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs font-mono text-blue-100">
                                      {String(row.newsletter_user_list_id)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-blue-100">
                                      {formatDateTime(
                                        row.created_at != null ? String(row.created_at) : undefined
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-gray-600">
                            {mainSubsPagination.from === mainSubsPagination.to
                              ? `Showing ${mainSubsPagination.from} of ${mainSubsPagination.total}`
                              : `Showing ${mainSubsPagination.from}–${mainSubsPagination.to} of ${mainSubsPagination.total}`}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={mainSubsPagination.page <= 1}
                              onClick={() => setSubsMainPage((p) => Math.max(1, p - 1))}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={mainSubsPagination.page >= mainSubsPagination.lastPage}
                              onClick={() => setSubsMainPage((p) => p + 1)}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Specific
                    </h4>
                    {filteredSpecificSubscriptions.length === 0 ? (
                      <p className="text-sm text-gray-500">No specific list subscriptions in this view.</p>
                    ) : (
                      <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  List
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  List ID
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Subscribed at
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {specificSubsPagination.rows.map((row) => {
                                const listHref = `${USER_LIST_DETAIL_BASE}/${encodeURIComponent(
                                  String(row.newsletter_user_list_id)
                                )}`;
                                return (
                                  <tr
                                    key={String(row.user_list_subscription_id)}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => router.push(listHref)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        router.push(listHref);
                                      }
                                    }}
                                    className="cursor-pointer bg-blue-950 transition-colors hover:bg-blue-900"
                                  >
                                    <td className="px-4 py-2 text-sm">
                                      <span className="font-medium text-white">{row.displayName}</span>
                                      <span className="ml-2 inline-flex rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                                        specific
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs font-mono text-blue-100">
                                      {String(row.newsletter_user_list_id)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-blue-100">
                                      {formatDateTime(
                                        row.created_at != null ? String(row.created_at) : undefined
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-gray-600">
                            {specificSubsPagination.from === specificSubsPagination.to
                              ? `Showing ${specificSubsPagination.from} of ${specificSubsPagination.total}`
                              : `Showing ${specificSubsPagination.from}–${specificSubsPagination.to} of ${specificSubsPagination.total}`}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={specificSubsPagination.page <= 1}
                              onClick={() => setSubsSpecificPage((p) => Math.max(1, p - 1))}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              disabled={specificSubsPagination.page >= specificSubsPagination.lastPage}
                              onClick={() => setSubsSpecificPage((p) => p + 1)}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">User preferences</h3>
            <p className="text-sm text-gray-500 mb-3">
              From <code className="rounded bg-gray-100 px-1">user_feed_preferences</code> for this user,
              joined through <code className="rounded bg-gray-100 px-1">topic_portals</code> to show one tab per
              portal.
            </p>
            <p className="text-sm mb-3">
              <Link href={TOPICS_PAGE_HREF} className="text-blue-600 hover:underline">
                Open topics directory
              </Link>
            </p>
            {feedPreferencesError && (
              <p className="text-sm text-red-600 mb-3">{feedPreferencesError}</p>
            )}
            {feedPreferencesLoading ? (
              <p className="text-sm text-gray-500">Loading preferences…</p>
            ) : feedPreferences.length === 0 ? (
              <p className="text-sm text-gray-500">No feed preference rows.</p>
            ) : portalTabsSorted.length === 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <p className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                  No portals in <span className="font-mono">portals_db</span>; showing all preference rows with
                  portal from <span className="font-mono">topic_portals</span>.
                </p>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Portal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Topic
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedFeedPrefRowsInView.map((row) => {
                      const pid =
                        row.portal_id != null && Number.isFinite(Number(row.portal_id))
                          ? Number(row.portal_id)
                          : null;
                      const portalLabel =
                        pid != null ? portalNameById.get(pid) ?? `Portal ${pid}` : "— (no topic_portals link)";
                      return (
                        <tr
                          key={`${row.user_feed_preference_id}-${pid ?? "none"}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">{portalLabel}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.topic_name?.trim() || `Topic ${row.topic_id}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.preference_state ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
                  {portalTabsSorted.map((p) => {
                    const pid = Number(p.id);
                    const count = feedPreferences.filter((r) => Number(r.portal_id) === pid).length;
                    const active =
                      feedPrefPortalTab !== "other" && Number(feedPrefPortalTab) === pid;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFeedPrefPortalTab(pid)}
                        className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                          active
                            ? "border-b-2 border-blue-950 bg-white text-blue-950"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <span className="max-w-[10rem] truncate">{p.name || p.key}</span>
                        <span className="tabular-nums text-xs font-normal text-gray-500">({count})</span>
                      </button>
                    );
                  })}
                  {showOtherFeedPrefTab ? (
                    <button
                      type="button"
                      onClick={() => setFeedPrefPortalTab("other")}
                      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        feedPrefPortalTab === "other"
                          ? "border-b-2 border-blue-950 bg-white text-blue-950"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      Other
                      <span className="tabular-nums text-xs font-normal text-gray-500">
                        (
                        {
                          feedPreferences.filter(
                            (r) =>
                              r.portal_id == null ||
                              !Number.isFinite(Number(r.portal_id)) ||
                              !portalIdSet.has(Number(r.portal_id))
                          ).length
                        }
                        )
                      </span>
                    </button>
                  ) : null}
                </div>
                <div className="overflow-x-auto p-4">
                  {sortedFeedPrefRowsInView.length === 0 ? (
                    <p className="text-sm text-gray-500">No preferences for this portal.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Topic
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            State
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {sortedFeedPrefRowsInView.map((row) => {
                          const pid =
                            row.portal_id != null && Number.isFinite(Number(row.portal_id))
                              ? Number(row.portal_id)
                              : null;
                          return (
                            <tr key={`${row.user_feed_preference_id}-${pid ?? "none"}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {row.topic_name?.trim() || `Topic ${row.topic_id}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {row.preference_state ?? "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => (saving ? null : setConfirmOpen(false))}
              aria-label="Close"
              disabled={saving}
            >
              ×
            </button>

            <h2 className="mb-2 text-xl font-semibold text-gray-900">Confirm changes</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to save these changes? This will update the user and reload the page.
            </p>

            {saveError && (
              <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">
                {saveError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                onClick={executeSave}
                disabled={saving || !canSave}
              >
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
        )}

      <SelectContactModal
        open={contactModalOpen}
        onClose={() => (savingContacts ? null : setContactModalOpen(false))}
        onConfirm={async (contact) => {
          if (!user?.id) return;
          setSavingContacts(true);
          setContactsLinkError(null);
          try {
            // Link by writing the current user's UUID into contacts_db.contact_user_id_array
            const updatedContact = await ContactService.updateContact(String(contact.id_contact), {
              id_user: String(user.id),
            });
            setContactsData((prev) => {
              const next = Array.isArray(prev) ? [...prev] : [];
              const idx = next.findIndex((c) => String(c.id_contact) === String(contact.id_contact));
              if (idx >= 0) next[idx] = updatedContact;
              else next.unshift(updatedContact);
              return next;
            });
            setContactModalOpen(false);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e
                ? String((e as { message: unknown }).message)
                : "Failed to link contact";
            setContactsLinkError(message);
          } finally {
            setSavingContacts(false);
          }
        }}
      />

      <ConfirmActionModal
        open={!!unlinkTarget}
        title="Unlink contact"
        message={
          unlinkTarget
            ? `Are you sure you want to unlink "${unlinkTarget.label}" from this user?`
            : "Are you sure you want to unlink this contact?"
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirming={unlinkingContact}
        onClose={() => (unlinkingContact ? null : setUnlinkTarget(null))}
        onConfirm={async () => {
          if (!unlinkTarget || !user?.id) return;
          setUnlinkingContact(true);
          setContactsLinkError(null);
          try {
            const existing = contactsData.find((c) => String(c.id_contact) === String(unlinkTarget.id_contact));
            const currentArr = Array.isArray(existing?.userListArray) ? existing!.userListArray.map(String) : [];
            const nextArr = currentArr.filter((x) => x !== String(user.id));
            const updatedContact = await ContactService.updateContact(String(unlinkTarget.id_contact), {
              userListArray: nextArr,
            });
            setContactsData((prev) => {
              const next = Array.isArray(prev) ? [...prev] : [];
              const idx = next.findIndex((c) => String(c.id_contact) === String(unlinkTarget.id_contact));
              if (idx >= 0) next[idx] = updatedContact;
              return next;
            });
            setUnlinkTarget(null);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e
                ? String((e as { message: unknown }).message)
                : "Failed to unlink contact";
            setContactsLinkError(message);
          } finally {
            setUnlinkingContact(false);
          }
        }}
      />

      <ConfirmActionModal
        open={!!newsletterUnsubTarget}
        title="Cancel subscription"
        message={
          newsletterUnsubTarget
            ? `Remove this user from the newsletter list "${newsletterUnsubTarget.userListName}"? They will stop receiving mailings from that list.`
            : ""
        }
        confirmLabel="Cancel subscription"
        cancelLabel="Keep subscription"
        confirming={unsubscribingNewsletter}
        onClose={() => (unsubscribingNewsletter ? null : setNewsletterUnsubTarget(null))}
        onConfirm={async () => {
          if (!newsletterUnsubTarget || !user?.id) return;
          setUnsubscribingNewsletter(true);
          setNewsletterError(null);
          try {
            const lid = String(newsletterUnsubTarget.userList_id);
            const current = Array.isArray(user.userListArray) ? user.userListArray.map(String) : [];
            const next = current.filter((id) => id !== lid);
            await apiClient.patch(
              `/api/v1/admin/user/${encodeURIComponent(user.id)}/newsletter-lists`,
              { newsletter_user_lists_id_array: next }
            );
            window.location.reload();
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e
                ? String((e as { message: unknown }).message)
                : "Failed to cancel subscription";
            setNewsletterError(message);
          } finally {
            setUnsubscribingNewsletter(false);
          }
        }}
      />

      <SelectNewsletterListModal
        open={newsletterModalOpen}
        onClose={() => (savingNewsletter ? null : setNewsletterModalOpen(false))}
        portalIdFilter={typeof newsletterPortalTab === "number" ? newsletterPortalTab : null}
        onConfirm={async (list) => {
          if (!user?.id) return;
          setSavingNewsletter(true);
          setNewsletterError(null);
          try {
            const current = Array.isArray(user.userListArray) ? user.userListArray : [];
            const next = Array.from(new Set([...current.map(String), String(list.userList_id)]));
            const updated = await apiClient.patch(
              `/api/v1/admin/user/${encodeURIComponent(user.id)}/newsletter-lists`,
              { newsletter_user_lists_id_array: next }
            );
            setUser(updated?.data ?? user);
            refreshUserLists();
            try {
              const subRes = await apiClient.get(
                `/api/v1/admin/user/${encodeURIComponent(id_user)}/list-subscriptions`
              );
              setListSubscriptions(
                Array.isArray(subRes.data) ? (subRes.data as UserListSubscriptionRow[]) : []
              );
              setListSubscriptionsError(null);
            } catch {
              /* leave table as-is */
            }
            setNewsletterModalOpen(false);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e
                ? String((e as { message: unknown }).message)
                : "Failed to assign newsletter list";
            setNewsletterError(message);
          } finally {
            setSavingNewsletter(false);
          }
        }}
      />
    </>
  );
};

export default UserDetailPage;
