"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArticleService } from "@/app/service/ArticleService";
import { ContentService } from "@/app/service/ContentService";
import { EventsService } from "@/app/service/EventsService";
import type { Content, ArticleData } from "./types";
import ArticlePhase1 from "./ArticlePhase1";
import ArticlePhase2 from "./ArticlePhase2";
import ArticlePhase3 from "./ArticlePhase3";
import ContentModal from "./ContentModal";
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
  const [company, setCompany] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [highlitedPosition, setHighlitedPosition] = useState("");
  const [isArticleEvent, setIsArticleEvent] = useState(false);
  const [eventId, setEventId] = useState("");
  const [tags, setTags] = useState("");
  const [tagsArray, setTagsArray] = useState<string[]>([]);

  const [contents, setContents] = useState<Content[]>([]);
  const [showContentModal, setShowContentModal] = useState(false);
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
    const loadArticleId = async () => {
      setIsGeneratingId(true);
      const generatedId = await generateArticleId();
      setIdArticle(generatedId);
      setIsGeneratingId(false);
    };
    loadArticleId();
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

  const handlePhase1Next = async () => {
    if (!articleTitle || !date) return;
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
    setShowContentModal(true);
  };

  const closeContentModal = useCallback(() => {
    setShowContentModal(false);
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
      const contentIds: string[] = [];
      if (contents.length > 0) {
        for (const content of contents) {
          try {
            await ContentService.createContent(content);
            contentIds.push(content.content_id);
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
            throw new Error(`Error al crear contenido: ${errorMessage}`);
          }
        }
      }
      const articleData: ArticleData = {
        id_article: idArticle,
        articleTitle,
        articleSubtitle,
        article_main_image_url: articleMainImageUrl,
        company,
        date,
        article_tags_array: tagsArray,
        contents_array: contentIds,
        highlited_position: highlitedPosition || undefined,
        is_article_event: isArticleEvent,
        event_id: isArticleEvent ? eventId.trim() : "",
      };
      await ArticleService.createArticle(articleData);
      alert("Article created successfully!");
      router.push("/logged/pages/articles");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating article:", error);
      let errorMessage = "Error desconocido";
      if (typeof error === "string") errorMessage = error;
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

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Create New Article</p>
        <p className="text-sm mt-2">Phase {currentPhase} of 3</p>
      </div>

      <div className="flex flex-col p-8 max-w-4xl mx-auto w-full">
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
            company={company}
            setCompany={setCompany}
            date={date}
            setDate={setDate}
            highlitedPosition={highlitedPosition}
            setHighlitedPosition={setHighlitedPosition}
            isArticleEvent={isArticleEvent}
            setIsArticleEvent={setIsArticleEvent}
            eventId={eventId}
            setEventId={setEventId}
            tags={tags}
            setTags={setTags}
            tagsArray={tagsArray}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onNext={handlePhase1Next}
          />
        )}

        {currentPhase === 2 && (
          <ArticlePhase2
            contents={contents}
            onOpenModal={openContentModal}
            onDeleteContent={handleDeleteContent}
            onBack={handlePhase2Back}
            onNext={handlePhase2Next}
          />
        )}

        {currentPhase === 3 && (
          <ArticlePhase3
            idArticle={idArticle}
            articleTitle={articleTitle}
            articleSubtitle={articleSubtitle}
            company={company}
            date={date}
            tagsArray={tagsArray}
            articleMainImageUrl={articleMainImageUrl}
            contents={contents}
            isSubmitting={isSubmitting}
            onBack={handlePhase3Back}
            onSubmit={handleFinalSubmit}
          />
        )}

        {showContentModal && (
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
      </div>
    </div>
  );
}
