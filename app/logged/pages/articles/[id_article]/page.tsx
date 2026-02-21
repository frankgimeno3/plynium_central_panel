"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import EditContentsModal from "@/app/logged/logged_components/modals/EditContentsModal";
import AddTagModal from "@/app/logged/logged_components/modals/AddTagModal";
import DeleteArticleModal from "@/app/logged/logged_components/modals/DeleteArticleModal";
import ArticleMainImage from "./id_article_components/ArticleMainImage";
import ArticleTags from "./id_article_components/ArticleTags";
import ArticleContentsList from "./id_article_components/ArticleContentsList";
import ArticleTitleSection from "./id_article_components/ArticleTitleSection";
import ArticleCompanyDateSection from "./id_article_components/ArticleCompanyDateSection";
import ContentModal from "./id_article_components/ContentModal";
import { useArticlePage } from "./hooks/useArticlePage";

export default function IdArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id_article = params?.id_article as string;
  const [eventIdInput, setEventIdInput] = useState("");

  const {
    articleData,
    contentsData,
    loading,
    error,
    isEditModalOpen,
    modalInitialValue,
    modalTitle,
    isAddTagModalOpen,
    isDeleteModalOpen,
    isSaving,
    isDeleting,
    showContentModal,
    editingContent,
    selectedContentType,
    contentFormData,
    handleSaveEditChanges,
    closeEditModal,
    handleSaveNewTag,
    closeAddTagModal,
    handleRemoveTag,
    handleEditContentField,
    handleEditTitle,
    handleEditSubtitle,
    handleEditMainImage,
    handleEditCompany,
    handleEditDate,
    handleEditHighlitedPosition,
    handleEditIsArticleEvent,
    handleEditEventId,
    handleDeleteArticle,
    closeDeleteModal,
    openContentModal,
    closeContentModal,
    handleContentTypeSelect,
    handleContentConfirm,
    handleEditContentBlock,
    handleDeleteContent,
    openAddTagModal,
    openDeleteModal,
    handleFormDataChange,
    handleContentTypeChange,
  } = useArticlePage(id_article);

  useEffect(() => {
    setEventIdInput(articleData?.event_id ?? "");
  }, [articleData?.event_id]);

  if (loading) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-lg">Loading article...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => router.push("/logged/pages/articles")}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl"
        >
          Back to articles
        </button>
      </main>
    );
  }

  if (!articleData) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-red-500 text-lg">The article you are looking for does not exist.</p>
        <button
          onClick={() => router.push("/logged/pages/articles")}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl"
        >
          Back to articles
        </button>
      </main>
    );
  }

  return (
    <>
      <main className="flex h-full min-h-screen flex-col gap-6 bg-white px-24 py-10 text-gray-600 w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={openDeleteModal}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-xl text-white font-medium ${
              isDeleting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 cursor-pointer"
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete article"}
          </button>
        </div>

        <ArticleTitleSection
          title={articleData.articleTitle}
          subtitle={articleData.articleSubtitle}
          onEditTitle={handleEditTitle}
          onEditSubtitle={handleEditSubtitle}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">
            Main Image URL
          </label>
          <ArticleMainImage
            imageUrl={articleData.article_main_image_url ?? ""}
            onEditMainImage={handleEditMainImage}
          />
        </div>

        <ArticleCompanyDateSection
          company={articleData.company}
          date={articleData.date}
          onEditCompany={handleEditCompany}
          onEditDate={handleEditDate}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">
            Highlighted position
          </label>
          <select
            value={articleData.highlited_position ?? ""}
            onChange={(e) => handleEditHighlitedPosition(e.target.value)}
            disabled={isSaving}
            className="w-full max-w-xs px-4 py-2 border rounded-xl bg-white text-gray-700 disabled:opacity-50"
          >
            <option value="">(None)</option>
            <option value="Main article">Main article</option>
            <option value="Position1">Position1</option>
            <option value="Position2">Position2</option>
            <option value="Position3">Position3</option>
            <option value="Position4">Position4</option>
            <option value="Position5">Position5</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">
            Is this article about an event-fair?
          </label>
          <select
            value={articleData.is_article_event ? "yes" : "no"}
            onChange={(e) => handleEditIsArticleEvent(e.target.value === "yes")}
            disabled={isSaving}
            className="w-full max-w-xs px-4 py-2 border rounded-xl bg-white text-gray-700 disabled:opacity-50"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        {articleData.is_article_event && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500">Event id</label>
            <input
              type="text"
              value={eventIdInput}
              onChange={(e) => setEventIdInput(e.target.value)}
              onBlur={() => {
                const v = eventIdInput.trim();
                if (v !== (articleData.event_id ?? "")) handleEditEventId(v);
              }}
              disabled={isSaving}
              placeholder="e.g. fair-26-0001"
              className="w-full max-w-xs px-4 py-2 border rounded-xl bg-white text-gray-700 disabled:opacity-50"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">Tags</label>
          <ArticleTags
            tags={articleData.article_tags_array ?? []}
            onRemoveTag={handleRemoveTag}
            onAddTag={openAddTagModal}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">Contents</label>
          <ArticleContentsList
            contentsIds={articleData.contents_array ?? []}
            contentsData={contentsData}
            onEditContentField={handleEditContentField}
            onAddContent={openContentModal}
            onEditContentBlock={handleEditContentBlock}
            onDeleteContent={handleDeleteContent}
          />
        </div>
      </main>

      <EditContentsModal
        isOpen={isEditModalOpen}
        initialValue={modalInitialValue}
        title={modalTitle}
        onSave={handleSaveEditChanges}
        onCancel={closeEditModal}
      />

      <AddTagModal
        isOpen={isAddTagModalOpen}
        initialValue=""
        onSave={handleSaveNewTag}
        onCancel={closeAddTagModal}
      />

      <DeleteArticleModal
        isOpen={isDeleteModalOpen}
        articleTitle={articleData.articleTitle || "Untitled"}
        onConfirm={handleDeleteArticle}
        onCancel={closeDeleteModal}
      />

      <ContentModal
        isOpen={showContentModal}
        editingContent={editingContent}
        selectedContentType={selectedContentType}
        contentFormData={contentFormData}
        isSaving={isSaving}
        onClose={closeContentModal}
        onContentTypeSelect={handleContentTypeSelect}
        onContentTypeChange={handleContentTypeChange}
        onFormDataChange={handleFormDataChange}
        onConfirm={handleContentConfirm}
      />
    </>
  );
}
