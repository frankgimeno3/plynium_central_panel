"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { PublicationService } from "@/app/service/PublicationService";
import type { Magazine } from "@/app/contents/interfaces";

import type { PublicationRow } from "./magazine_detail_components/types";
import { DELETE_CONFIRM_WORD, MAGAZINES_BASE as BASE, MAX_ISSUES_PER_YEAR } from "./magazine_detail_components/constants";
import { apiRowToIssue, isExpiredTabStatus, isPlannableStatus } from "./magazine_detail_components/magazineDetailHelpers";
import { DeleteMagazineModal } from "./magazine_detail_components/DeleteMagazineModal";
import { MagazineMetadataSection } from "./magazine_detail_components/MagazineMetadataSection";
import { PlannedIssuesByYearSection } from "./magazine_detail_components/PlannedIssuesByYearSection";
import { MagazinePublicationsSection } from "./magazine_detail_components/MagazinePublicationsSection";

export type MagazineDetailPageProps = {
  magazineId: string;
};

export const MagazineDetailPage: FC<MagazineDetailPageProps> = ({ magazineId: id_magazine }) => {
  const router = useRouter();
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [allPublications, setAllPublications] = useState<PublicationRow[]>([]);
  const [pubsLoading, setPubsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [publicationsTab, setPublicationsTab] = useState<"forecasted" | "expired">("forecasted");
  const { setPageMeta } = usePageContent();

  const [editableName, setEditableName] = useState("");
  const [editableSubtitle, setEditableSubtitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [editablePeriodicity, setEditablePeriodicity] = useState("");
  const [editableSubscriberNumber, setEditableSubscriberNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [issuesDirty, setIssuesDirty] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canSubmitDelete = deleteConfirmInput === DELETE_CONFIRM_WORD && !deleteSubmitting && Boolean(magazine);

  const openDeleteModal = () => {
    setDeleteConfirmInput("");
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setDeleteModalOpen(false);
  };

  const confirmDeleteMagazine = async () => {
    if (!magazine || !canSubmitDelete) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/magazines/${encodeURIComponent(magazine.id_magazine)}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        let serverMessage = "";
        try {
          const payload = (await res.json()) as { message?: unknown };
          if (payload && typeof payload.message === "string") serverMessage = payload.message;
        } catch {}
        throw new Error(serverMessage || `Delete failed (${res.status}).`);
      }
      setDeleteModalOpen(false);
      router.push(BASE);
    } catch (e: unknown) {
      const msg =
        e != null && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : "Could not delete magazine.";
      setDeleteError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const loadPublications = useCallback(async () => {
    setPubsLoading(true);
    try {
      const data = await PublicationService.listPublicationsForMagazine(id_magazine);
      setAllPublications(Array.isArray(data) ? (data as PublicationRow[]) : []);
    } catch {
      setAllPublications([]);
    } finally {
      setPubsLoading(false);
    }
  }, [id_magazine]);

  useEffect(() => {
    let cancelled = false;
    MagazineService.getMagazineById(id_magazine)
      .then((data) => {
        if (!cancelled) setMagazine(data);
      })
      .catch(() => {
        if (!cancelled) setMagazine(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id_magazine]);

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  useEffect(() => {
    if (magazine) {
      setEditableName(magazine.name ?? "");
      setEditableSubtitle(magazine.subtitle ?? "");
      setEditableDescription(magazine.description ?? "");
      setEditablePeriodicity(magazine.periodicity ?? "");
      setEditableSubscriberNumber(magazine.subscriber_number != null ? String(magazine.subscriber_number) : "");
    }
  }, [magazine?.id_magazine, magazine?.name, magazine?.subtitle, magazine?.description, magazine?.periodicity, magazine?.subscriber_number]);

  const hasChanges = Boolean(
    magazine &&
      (editableName !== (magazine.name ?? "") ||
        editableSubtitle !== (magazine.subtitle ?? "") ||
        editableDescription !== (magazine.description ?? "") ||
        editablePeriodicity !== (magazine.periodicity ?? "") ||
        editableSubscriberNumber !== (magazine.subscriber_number != null ? String(magazine.subscriber_number) : ""))
  );

  const yearOptions = useMemo(() => {
    const fromPubs = new Set(
      allPublications.map((p) => (p.publication_year != null ? String(p.publication_year) : "")).filter(Boolean)
    );
    const first = magazine?.first_year ?? new Date().getFullYear();
    const last = new Date().getFullYear();
    const range: string[] = [];
    for (let y = first; y <= last; y++) range.push(String(y));
    const combined = Array.from(new Set([...fromPubs, ...range])).sort((a, b) => Number(b) - Number(a));
    return combined;
  }, [magazine?.first_year, allPublications]);

  useEffect(() => {
    if (selectedYear === "" && yearOptions.length > 0) setSelectedYear(yearOptions[0]);
  }, [yearOptions, selectedYear]);

  const issuesForYear = useMemo(() => {
    const y = Number(selectedYear);
    if (!Number.isInteger(y)) return [];
    return allPublications
      .filter((p) => p.publication_year === y && isPlannableStatus(p.publication_status))
      .map(apiRowToIssue)
      .sort((a, b) => a.issue_number - b.issue_number);
  }, [allPublications, selectedYear]);

  const forecastedPublications = useMemo(() => allPublications.filter((p) => isPlannableStatus(p.publication_status)), [allPublications]);

  const expiredPublications = useMemo(() => allPublications.filter((p) => isExpiredTabStatus(p.publication_status)), [allPublications]);

  const monthsUsedForYear = useMemo(() => {
    const set = new Set<number>();
    issuesForYear.forEach((i) => {
      if (
        i.forecasted_publication_month != null &&
        i.forecasted_publication_month >= 1 &&
        i.forecasted_publication_month <= 12
      ) {
        set.add(i.forecasted_publication_month);
      }
    });
    return set;
  }, [issuesForYear]);

  const issuesMonthValid = useMemo(() => {
    if (issuesForYear.length === 0) return true;
    const filled = issuesForYear.filter(
      (i) =>
        i.forecasted_publication_month != null &&
        i.forecasted_publication_month >= 1 &&
        i.forecasted_publication_month <= 12
    );
    const uniqueMonths = new Set(filled.map((i) => i.forecasted_publication_month));
    const allInOrder = issuesForYear.every((issue, index) => {
      const prev = issuesForYear[index - 1];
      const minMonth =
        index === 0 ? issue.issue_number : Math.max(issue.issue_number, prev?.forecasted_publication_month ?? issue.issue_number);
      return (issue.forecasted_publication_month ?? 0) >= minMonth;
    });
    return filled.length === issuesForYear.length && uniqueMonths.size === issuesForYear.length && allInOrder;
  }, [issuesForYear]);

  const patchLocalRow = (publicationId: string, patch: Partial<PublicationRow>) => {
    setIssuesDirty(true);
    setAllPublications((prev) => prev.map((r) => (r.id_publication === publicationId ? { ...r, ...patch } : r)));
  };

  const toggleSpecialEdition = (publicationId: string) => {
    const row = allPublications.find((r) => r.id_publication === publicationId);
    if (!row) return;
    patchLocalRow(publicationId, { is_special_edition: !row.is_special_edition });
  };

  const setSpecialTopic = (publicationId: string, value: string) => {
    patchLocalRow(publicationId, { publication_theme: value });
  };

  const setPublicationFormat = (publicationId: string, value: "informer" | "flipbook" | "both") => {
    patchLocalRow(publicationId, { publication_format: value });
  };

  const setForecastedMonth = (publicationId: string, value: number | undefined) => {
    patchLocalRow(publicationId, { publication_expected_publication_month: value ?? null });
  };

  const deleteIssue = async (publicationId: string) => {
    try {
      await PublicationService.deletePublication(publicationId);
      setIssuesDirty(false);
      await loadPublications();
    } catch {}
  };

  const addIssue = async () => {
    if (!magazine || !selectedYear) return;
    const y = Number(selectedYear);
    if (issuesForYear.length >= MAX_ISSUES_PER_YEAR) return;
    const inYear = allPublications.filter((p) => p.publication_year === y && isPlannableStatus(p.publication_status));
    const maxNum = inYear.length === 0 ? 0 : Math.max(...inYear.map((p) => p.magazine_this_year_issue ?? 0));
    const nextNum = maxNum + 1;
    try {
      await PublicationService.createMagazinePublication(magazine.id_magazine, {
        publication_year: y,
        magazine_this_year_issue: nextNum,
        publication_expected_publication_month: null,
        is_special_edition: false,
        publication_theme: "",
        publication_format: "flipbook",
      });
      await loadPublications();
    } catch {}
  };

  const handleSaveChanges = async () => {
    if (!magazine || saving) return;
    if (!hasChanges && !issuesDirty) return;
    if (issuesDirty && !issuesMonthValid) return;
    setSaving(true);
    try {
      if (hasChanges) {
        const sn = editableSubscriberNumber.trim();
        let subscriber_number: number | null = sn === "" ? null : Number(sn);
        if (subscriber_number != null && Number.isNaN(subscriber_number)) subscriber_number = null;
        const updated = await MagazineService.updateMagazine(magazine.id_magazine, {
          name: editableName.trim(),
          subtitle: editableSubtitle.trim(),
          description: editableDescription.trim(),
          periodicity: editablePeriodicity.trim(),
          subscriber_number,
        });
        setMagazine(updated);
        setEditableName(updated.name ?? "");
        setEditableSubtitle(updated.subtitle ?? "");
        setEditableDescription(updated.description ?? "");
        setEditablePeriodicity(updated.periodicity ?? "");
        setEditableSubscriberNumber(updated.subscriber_number != null ? String(updated.subscriber_number) : "");
      }
      if (issuesDirty) {
        for (const issue of issuesForYear) {
          if (!issue.publication_id) continue;
          await PublicationService.updatePublication(issue.publication_id, {
            publication_expected_publication_month: issue.forecasted_publication_month ?? null,
            publication_theme: issue.special_topic ?? "",
            is_special_edition: issue.is_special_edition,
            publication_format: issue.publication_format ?? "flipbook",
          });
        }
        setIssuesDirty(false);
        await loadPublications();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (magazine) {
      setPageMeta({
        pageTitle: magazine.name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Magazine titles", href: `${BASE}` },
          { label: magazine.name },
        ],
        buttons: [{ label: "Back to Magazines", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Magazine not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Magazine titles", href: BASE },
        ],
        buttons: [{ label: "Back to Magazines", href: BASE }],
      });
    }
  }, [setPageMeta, magazine]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading magazine…</div>
      </PageContentSection>
    );
  }

  if (!magazine) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="text-gray-500">Magazine not found.</p>
              <button
                type="button"
                onClick={() => router.push(BASE)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Back to Magazines
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const saveBar =
    (hasChanges || issuesDirty) ? (
      <div className="fixed bottom-6 right-6 z-10">
        <button
          type="button"
          onClick={() => void handleSaveChanges()}
          disabled={saving || (issuesDirty && !issuesMonthValid)}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    ) : null;

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <MagazineMetadataSection
          magazine={magazine}
          editableName={editableName}
          editableSubtitle={editableSubtitle}
          editableDescription={editableDescription}
          editablePeriodicity={editablePeriodicity}
          editableSubscriberNumber={editableSubscriberNumber}
          saveBar={saveBar}
          onNameChange={setEditableName}
          onSubtitleChange={setEditableSubtitle}
          onDescriptionChange={setEditableDescription}
          onPeriodicityChange={setEditablePeriodicity}
          onSubscriberNumberChange={setEditableSubscriberNumber}
          onOpenDeleteModal={openDeleteModal}
        />

        <PlannedIssuesByYearSection
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          pubsLoading={pubsLoading}
          onYearChange={setSelectedYear}
          issuesForYear={issuesForYear}
          monthsUsedForYear={monthsUsedForYear}
          issuesMonthDirtyInvalid={Boolean(issuesDirty && !issuesMonthValid && issuesForYear.length > 0)}
          onForecastedMonthChange={setForecastedMonth}
          onToggleSpecialEdition={toggleSpecialEdition}
          onSpecialTopicChange={setSpecialTopic}
          onPublicationFormatChange={setPublicationFormat}
          onDeleteIssue={deleteIssue}
          onAddIssue={addIssue}
        />

        <MagazinePublicationsSection
          publicationsTab={publicationsTab}
          forecastedPublications={forecastedPublications}
          expiredPublications={expiredPublications}
          onPublicationsTabChange={setPublicationsTab}
        />
      </div>

      <DeleteMagazineModal
        open={deleteModalOpen}
        magazineName={magazine?.name}
        deleteConfirmInput={deleteConfirmInput}
        deleteSubmitting={deleteSubmitting}
        deleteError={deleteError}
        canSubmitDelete={canSubmitDelete}
        onConfirmInputChange={setDeleteConfirmInput}
        onClose={closeDeleteModal}
        onConfirmDelete={confirmDeleteMagazine}
      />
    </PageContentSection>
  );
};

export default MagazineDetailPage;
