"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ArticleService } from "@/app/service/ArticleService";
import { ContentService } from "@/app/service/ContentService";
import { EventsService } from "@/app/service/EventsService";
import { PortalService } from "@/app/service/PortalService";
import { ContentTopicService } from "@/app/service/ContentTopicService";
import type { Content, ArticleData } from "./types";
import ArticlePhase1 from "./ArticlePhase1";
import ArticlePhase2 from "./ArticlePhase2";
import ArticlePhase3 from "./ArticlePhase3";
import ContentModal from "./ContentModal";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import EventSelectModal from "@/app/logged/logged_components/modals/EventSelectModal";
import { isRichTextEmpty } from "@/app/logged/logged_components/RichTextEditor";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CreateArticlePage() {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);

  const [idArticle, setIdArticle] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSubtitle, setArticleSubtitle] = useState("");
  const [articleMainImageUrl, setArticleMainImageUrl] = useState("");
  const [companyPairs, setCompanyPairs] = useState<{ name: string; id: string }[]>([]);
  const [isArticleRelatedToCompany, setIsArticleRelatedToCompany] = useState(false);
    const [date, setDate] = useState(getTodayDate());
  const [highlitedPosition, setHighlitedPosition] = useState("");
  const [isArticleEvent, setIsArticleEvent] = useState(false);
  const [eventId, setEventId] = useState("");
  const [tags, setTags] = useState("");
  const [tagsArray, setTagsArray] = useState<string[]>([]);

  const [contents, setContents] = useState<Content[]>([]);
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentEditorOpen, setContentEditorOpen] = useState(false);
  const [mediatecaModalOpen, setMediatecaModalOpen] = useState(false);
  const [contentImageLibraryTarget, setContentImageLibraryTarget] = useState<
    "left" | "right" | "center" | null
  >(null);
  const [eventSelectModalOpen, setEventSelectModalOpen] = useState(false);
  const [contentModalPosition, setContentModalPosition] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<Content["content_type"] | "">("");
  const [contentFormData, setContentFormData] = useState({
    left: "",
    right: "",
    center: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const [portalTopics, setPortalTopics] = useState<{ topic_id: number; topic_name: string }[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);

  useEffect(() => {
    PortalService.getAllPortals().then((list: any[]) => {
      const rows = Array.isArray(list) ? list : [];
      const normalized = rows
        .map((p) => {
          const raw = p?.id ?? p?.portal_id;
          const id =
            typeof raw === "number" && Number.isFinite(raw)
              ? raw
              : parseInt(String(raw ?? ""), 10);
          return {
            id,
            name: p?.name != null ? String(p.name) : String(p?.key ?? raw ?? ""),
          };
        })
        .filter((p) => Number.isInteger(p.id));
      setPortals(normalized);
    }).catch(() => setPortals([]));
  }, []);

  const handleTogglePortal = (portalId: number) => {
    const id = Number(portalId);
    if (!Number.isInteger(id)) return;
    if (highlitedPosition) {
      // When highlighted position is set, only one portal allowed
      setSelectedPortalIds((prev) => (prev.includes(id) ? prev : [id]));
    } else {
      setSelectedPortalIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  // When user selects a highlighted position while multiple portals are selected, keep only the first
  useEffect(() => {
    if (highlitedPosition && selectedPortalIds.length > 1) {
      setSelectedPortalIds((prev) => [prev[0]]);
    }
  }, [highlitedPosition, selectedPortalIds.length]);

  useEffect(() => {
    if (selectedPortalIds.length === 0) {
      setPortalTopics([]);
      setTopicsLoading(false);
      return;
    }
    let cancelled = false;
    setTopicsLoading(true);
    (async () => {
      try {
        const merged = new Map<number, { topic_id: number; topic_name: string }>();
        for (const pid of selectedPortalIds) {
          const list = await ContentTopicService.getTopics(pid);
          if (!Array.isArray(list)) continue;
          for (const row of list) {
            if (row && typeof row.topic_id === "number" && !merged.has(row.topic_id)) {
              merged.set(row.topic_id, {
                topic_id: row.topic_id,
                topic_name: typeof row.topic_name === "string" ? row.topic_name : String(row.topic_id),
              });
            }
          }
        }
        if (!cancelled) {
          setPortalTopics([...merged.values()].sort((a, b) => a.topic_name.localeCompare(b.topic_name)));
        }
      } catch {
        if (!cancelled) setPortalTopics([]);
      } finally {
        if (!cancelled) setTopicsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPortalIds]);

  useEffect(() => {
    const valid = new Set(portalTopics.map((t) => t.topic_id));
    setSelectedTopicIds((prev) => prev.filter((id) => valid.has(id)));
  }, [portalTopics]);

  const handleToggleTopic = (topicId: number) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const topicSummary = useMemo(() => {
    const map = new Map(portalTopics.map((t) => [t.topic_id, t.topic_name]));
    return selectedTopicIds
      .map((id) => map.get(id))
      .filter((n): n is string => typeof n === "string" && n.length > 0)
      .join(", ");
  }, [selectedTopicIds, portalTopics]);

  const generateArticleId = useCallback(async (): Promise<string> => {
    try {
      const allArticles = await ArticleService.getAllArticles();
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      const pattern = new RegExp(`^article_${yearSuffix}_\\d{9}$`);
      const currentYearArticles = allArticles.filter((article: any) =>
        pattern.test(article.id_article)
      );
      let maxOrdinal = 0;
      currentYearArticles.forEach((article: any) => {
        const match = article.id_article.match(/^article_\d{2}_(\d{9})$/);
        if (match) {
          const ordinal = parseInt(match[1], 10);
          if (ordinal > maxOrdinal) maxOrdinal = ordinal;
        }
      });
      const nextOrdinal = maxOrdinal + 1;
      const ordinalString = nextOrdinal.toString().padStart(9, "0");
      return `article_${yearSuffix}_${ordinalString}`;
    } catch (error) {
      console.error("Error generating article ID:", error);
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      const timestamp = Date.now();
      const ordinalString = (timestamp % 1000000000).toString().padStart(9, "0");
      return `article_${yearSuffix}_${ordinalString}`;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadArticleId = async () => {
      setIsGeneratingId(true);
      try {
        const generatedId = await generateArticleId();
        if (!cancelled) setIdArticle(generatedId);
      } finally {
        if (!cancelled) setIsGeneratingId(false);
      }
    };
    loadArticleId();
    return () => {
      cancelled = true;
    };
  }, [generateArticleId]);

  const handleAddTag = () => {
    if (tags.trim()) {
      setTagsArray([...tagsArray, tags.trim()]);
      setTags("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTagsArray(tagsArray.filter((_, i) => i !== index));
  };

  const handleAddCompanyPair = (name: string, id: string) => {
    setCompanyPairs((prev) => [...prev, { name, id }]);
  };

  const handleRemoveCompanyPair = (index: number) => {
    setCompanyPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhase1Next = async (resolvedDate: string) => {
    const d = (resolvedDate ?? "").trim();
    if (!articleTitle?.trim() || !d) return;
    if (isArticleRelatedToCompany && companyPairs.length < 1) {
      alert("Please add at least one company (Companies).");
      return;
    }
    setDate(d);
    if (isArticleEvent && eventId.trim()) {
      try {
        await EventsService.getEventById(eventId.trim());
      } catch {
        alert("The event with that ID does not exist. Check the Event id or uncheck \"Is this article about an event-fair?\".");
        return;
      }
    }
    setCurrentPhase(2);
  };

  const openContentModal = (position: number | null, content?: Content) => {
    setContentModalPosition(position);
    if (content) {
      setEditingContent(content);
      setSelectedContentType(content.content_type);
      setContentFormData(content.content_content);
    } else {
      setEditingContent(null);
      setSelectedContentType("");
      setContentFormData({ left: "", right: "", center: "" });
    }
    setContentEditorOpen(true);
    if (currentPhase !== 2) setShowContentModal(true);
  };

  const closeContentModal = useCallback(() => {
    setShowContentModal(false);
    setContentEditorOpen(false);
    setContentModalPosition(null);
    setEditingContent(null);
    setSelectedContentType("");
    setContentFormData({ left: "", right: "", center: "" });
  }, []);

  const generateContentId = () =>
    `id_content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleContentTypeSelect = (type: Content["content_type"]) => {
    setSelectedContentType(type);
    if (type === "text_image" || type === "image_text") {
      setContentFormData({ left: "", right: "", center: "no" });
    } else {
      setContentFormData({ left: "no", right: "no", center: "" });
    }
  };

  const handleBackToTypeSelect = () => {
    setSelectedContentType("");
  };

  const handleContentConfirm = () => {
    if (!selectedContentType) return;
    let isValid = false;
    if (selectedContentType === "text_image") {
      isValid = !isRichTextEmpty(contentFormData.left) && contentFormData.right.trim() !== "";
    } else if (selectedContentType === "image_text") {
      isValid = contentFormData.left.trim() !== "" && !isRichTextEmpty(contentFormData.right);
    } else if (selectedContentType === "just_text") {
      isValid = !isRichTextEmpty(contentFormData.center);
    } else {
      isValid = contentFormData.center.trim() !== "";
    }
    if (!isValid) {
      alert("Por favor, complete todos los campos requeridos");
      return;
    }
    const newContent: Content = {
      content_id: editingContent?.content_id || generateContentId(),
      content_type: selectedContentType,
      content_content: { ...contentFormData },
    };
    if (editingContent) {
      setContents((prev) =>
        prev.map((c) => (c.content_id === editingContent.content_id ? newContent : c))
      );
    } else {
      if (contentModalPosition === null) {
        setContents((prev) => [...prev, newContent]);
      } else {
        setContents((prev) => {
          const next = [...prev];
          next.splice(contentModalPosition, 0, newContent);
          return next;
        });
      }
    }
    closeContentModal();
  };

  const handleDeleteContent = (contentId: string) => {
    if (confirm("Are you sure you want to delete this content?")) {
      setContents((prev) => prev.filter((c) => c.content_id !== contentId));
    }
  };

  const handlePhase2Next = () => setCurrentPhase(3);
  const handlePhase2Back = () => setCurrentPhase(1);
  const handlePhase3Back = () => setCurrentPhase(2);

  const handleFinalSubmit = async () => {
    if (isArticleEvent && eventId.trim()) {
      try {
        await EventsService.getEventById(eventId.trim());
      } catch {
        alert("The event with that ID does not exist. Check the Event id or uncheck \"Is this article about an event-fair?\".");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      if (selectedPortalIds.length === 0) {
        alert("Please select at least one portal (Phase 1).");
        setIsSubmitting(false);
        return;
      }
      if (isArticleRelatedToCompany && companyPairs.length === 0) {
        alert("Please add at least one company (Companies).");
        setIsSubmitting(false);
        return;
      }
      // Create article first (contents require article_id)
      const articleData: ArticleData = {
        id_article: idArticle,
        articleTitle,
        articleSubtitle,
        article_main_image_url: articleMainImageUrl,
        article_company_names_array: isArticleRelatedToCompany
          ? companyPairs.map((p) => p.name.trim()).filter(Boolean)
          : [],
        article_company_id_array: isArticleRelatedToCompany
          ? companyPairs.map((p) => p.id.trim())
          : [],
        date,
        article_tags_array: tagsArray,
        contents_array: [],
        highlited_position: highlitedPosition || undefined,
        is_article_event: isArticleEvent,
        event_id: isArticleEvent ? eventId.trim() : "",
        portalIds: selectedPortalIds,
        topic_ids_array: selectedTopicIds,
      };
      await ArticleService.createArticle(articleData);

      // Then create contents with article_id and position
      if (contents.length > 0) {
        for (let i = 0; i < contents.length; i++) {
          const content = contents[i];
          try {
            await ContentService.createContent({
              ...content,
              article_id: idArticle,
              position: i,
            });
          } catch (contentError: any) {
            let errorMessage = "Error desconocido";
            if (typeof contentError === "string") errorMessage = contentError;
            else if (contentError?.message) errorMessage = contentError.message;
            else if (contentError?.data?.message) errorMessage = contentError.data.message;
            else if (contentError?.status)
              errorMessage = `Error ${contentError.status}: ${contentError.message || "Server error"}`;
            else if (contentError?.data)
              errorMessage =
                typeof contentError.data === "string"
                  ? contentError.data
                  : JSON.stringify(contentError.data);
            else errorMessage = JSON.stringify(contentError);
            throw new Error(`Error creating content: ${errorMessage}`);
          }
        }
      }
      alert("Article created successfully!");
      router.push("/logged/pages/account-management/contents/articles");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating article:", error);
      let errorMessage = "Error desconocido";
      if (typeof error === "string") errorMessage = error;
      else if (typeof error?.data === "string" && error.data.trim())
        errorMessage = error.data.trim();
      else if (error?.message) errorMessage = error.message;
      else if (error?.data?.message) errorMessage = error.data.message;
      else if (error?.status)
        errorMessage = `Error ${error.status}: ${error.message || "Server error"}`;
      else if (error?.data)
        errorMessage =
          typeof error.data === "string" ? error.data : JSON.stringify(error.data);
      else errorMessage = JSON.stringify(error);
      alert(`Error creating article: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: "Articles", href: "/logged/pages/network/contents/articles" },
    { label: "Create article" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: `Create New Article · Phase ${currentPhase} of 3`,
      breadcrumbs,
      buttons: [],
    });
  }, [setPageMeta, breadcrumbs, currentPhase]);

  return (
    <>
      <PageContentSection>
      <div className="flex flex-col max-w-4xl mx-auto w-full py-12">
        {currentPhase === 1 && (
          <ArticlePhase1
            idArticle={idArticle}
            isGeneratingId={isGeneratingId}
            articleTitle={articleTitle}
            setArticleTitle={setArticleTitle}
            articleSubtitle={articleSubtitle}
            setArticleSubtitle={setArticleSubtitle}
            articleMainImageUrl={articleMainImageUrl}
            setArticleMainImageUrl={setArticleMainImageUrl}
            onOpenMediaLibrary={() => setMediatecaModalOpen(true)}
            companyPairs={companyPairs}
            onAddCompanyPair={handleAddCompanyPair}
            onRemoveCompanyPair={handleRemoveCompanyPair}
            isArticleRelatedToCompany={isArticleRelatedToCompany}
            setIsArticleRelatedToCompany={(v) => {
              setIsArticleRelatedToCompany(v);
              if (!v) setCompanyPairs([]);
            }}
            date={date}
            setDate={setDate}
            highlitedPosition={highlitedPosition}
            setHighlitedPosition={setHighlitedPosition}
            isArticleEvent={isArticleEvent}
            setIsArticleEvent={setIsArticleEvent}
            eventId={eventId}
            setEventId={setEventId}
            onOpenEventSelect={() => setEventSelectModalOpen(true)}
            tags={tags}
            setTags={setTags}
            tagsArray={tagsArray}
            portals={portals}
            selectedPortalIds={selectedPortalIds}
            onTogglePortal={handleTogglePortal}
            portalTopics={portalTopics}
            topicsLoading={topicsLoading}
            selectedTopicIds={selectedTopicIds}
            onToggleTopic={handleToggleTopic}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onNext={handlePhase1Next}
          />
        )}

        {currentPhase === 2 && (
          <ArticlePhase2
            contents={contents}
            articleTitle={articleTitle}
            articleMainImageUrl={articleMainImageUrl}
            onOpenModal={openContentModal}
            onDeleteContent={handleDeleteContent}
            onBack={handlePhase2Back}
            onNext={handlePhase2Next}
            contentEditorOpen={contentEditorOpen}
            contentModalPosition={contentModalPosition}
            editingContent={editingContent}
            selectedContentType={selectedContentType}
            contentFormData={contentFormData}
            setContentFormData={setContentFormData}
            onContentTypeSelect={handleContentTypeSelect}
            onBackToTypeSelect={handleBackToTypeSelect}
            onConfirmContent={handleContentConfirm}
            onCancelContent={closeContentModal}
            onOpenMediaLibraryForField={(field) => {
              setContentImageLibraryTarget(field);
              setMediatecaModalOpen(true);
            }}
          />
        )}

        {currentPhase === 3 && (
          <ArticlePhase3
            idArticle={idArticle}
            articleTitle={articleTitle}
            articleSubtitle={articleSubtitle}
            companySummary={companyPairs.map((p) => p.name).join(", ")}
            date={date}
            tagsArray={tagsArray}
            topicSummary={topicSummary}
            articleMainImageUrl={articleMainImageUrl}
            contents={contents}
            isSubmitting={isSubmitting}
            onBack={handlePhase3Back}
            onSubmit={handleFinalSubmit}
          />
        )}

        {showContentModal && currentPhase !== 2 && (
          <ContentModal
            onClose={closeContentModal}
            editingContent={editingContent}
            selectedContentType={selectedContentType}
            onContentTypeSelect={handleContentTypeSelect}
            onBackToTypeSelect={handleBackToTypeSelect}
            contentFormData={contentFormData}
            setContentFormData={setContentFormData}
            onConfirm={handleContentConfirm}
          />
        )}

        <MediatecaModal
          open={mediatecaModalOpen}
          onClose={() => {
            setMediatecaModalOpen(false);
            setContentImageLibraryTarget(null);
          }}
          onSelectImage={(imageSrc) => {
            if (contentImageLibraryTarget !== null) {
              setContentFormData((prev) => ({
                ...prev,
                [contentImageLibraryTarget]: imageSrc,
              }));
              setContentImageLibraryTarget(null);
            } else {
              setArticleMainImageUrl(imageSrc);
            }
            setMediatecaModalOpen(false);
          }}
        />

        <EventSelectModal
          open={eventSelectModalOpen}
          onClose={() => setEventSelectModalOpen(false)}
          onSelectEvent={(eventIdSelected) => {
            setEventId(eventIdSelected);
            setEventSelectModalOpen(false);
          }}
        />
      </div>
      </PageContentSection>
    </>
  );
}
