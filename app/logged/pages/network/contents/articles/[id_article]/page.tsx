"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import EditContentsModal from "@/app/logged/logged_components/modals/EditContentsModal";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import EventSelectModal from "@/app/logged/logged_components/modals/EventSelectModal";
import CompanySelectModal from "@/app/logged/logged_components/modals/CompanySelectModal";
import AddTagModal from "@/app/logged/logged_components/modals/AddTagModal";
import DeleteArticleModal from "@/app/logged/logged_components/modals/DeleteArticleModal";
import ArticleMainImage from "./id_article_components/ArticleMainImage";
import ArticleTags from "./id_article_components/ArticleTags";
import ArticleContentsList from "./id_article_components/ArticleContentsList";
import ArticleTitleSection from "./id_article_components/ArticleTitleSection";
import ArticleCompanyDateSection from "./id_article_components/ArticleCompanyDateSection";
import ArticlePublicationPortalsSection from "./id_article_components/ArticlePublicationPortalsSection";
import ContentModal from "./id_article_components/ContentModal";
import { useArticlePage } from "./hooks/useArticlePage";

const ARTICLES_MEDIA_LIBRARY_PATH =
  "Structural media/Network media/content media/articles media";

export default function IdArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id_article = params?.id_article as string;
  const [eventSelectModalOpen, setEventSelectModalOpen] = useState(false);
  const [companySelectModalOpen, setCompanySelectModalOpen] = useState(false);

  const {
    articleData,
    contentsData,
    loading,
    error,
    isEditModalOpen,
    isMediatecaModalOpen,
    closeMediatecaModal,
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
    handleSaveTitleSubtitle,
    handleEditMainImage,
    openMediatecaForContentImage,
    handleSaveContentField,
    handleRemoveCompany,
    handleAddCompany,
    handleAddCompanyFromDirectory,
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
    publications,
    allPortals,
    isPortalActionLoading,
    handleAddArticleToPortal,
    handleRemoveArticleFromPortal,
    handleUpdatePublicationPublication,
  } = useArticlePage(id_article);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (articleData) {
      setPageMeta({
        pageTitle: `Article: ${articleData.articleTitle ?? "Article"}`,
        breadcrumbs: [
          { label: "Articles", href: "/logged/pages/network/contents/articles" },
          { label: articleData.articleTitle ?? "Article" },
        ],
        buttons: [],
      });
    } else {
      setPageMeta({
        pageTitle: "Article",
        breadcrumbs: [
          { label: "Articles", href: "/logged/pages/network/contents/articles" },
        ],
        buttons: [],
      });
    }
  }, [setPageMeta, articleData]);

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
          onClick={() => router.push("/logged/pages/network/contents/articles")}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl"
        >
          Go to articles
        </button>
      </main>
    );
  }

  if (!articleData) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-red-500 text-lg">The article you are looking for does not exist.</p>
        <button
          onClick={() => router.push("/logged/pages/network/contents/articles")}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl"
        >
          Go to articles
        </button>
      </main>
    );
  }

  const breadcrumbs = [
    { label: "Articles", href: "/logged/pages/network/contents/articles" },
    { label: articleData.articleTitle ?? "Article" },
  ];

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
      <main className="flex flex-col gap-6 text-gray-600 w-full">
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
          onSaveTitleSubtitle={handleSaveTitleSubtitle}
          isSaving={isSaving}
        />

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-gray-800">
            Main Image
          </label>
          <ArticleMainImage
            imageUrl={articleData.article_main_image_url ?? ""}
            onEditMainImage={handleEditMainImage}
          />
        </div>

        <ArticleCompanyDateSection
          companyNames={articleData.article_company_names_array ?? (articleData.company ? [articleData.company] : [])}
          companyIds={articleData.article_company_id_array ?? []}
          onRemoveCompany={handleRemoveCompany}
          onAddCompany={handleAddCompany}
          onOpenDirectory={() => setCompanySelectModalOpen(true)}
          date={articleData.date}
          onEditDate={handleEditDate}
          isSaving={isSaving}
        />

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-gray-800">
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
          <label className="text-lg font-bold text-gray-800">
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
            <label className="text-lg font-bold text-gray-800">Event</label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-700">
                {articleData.event_id ? `Event ID: ${articleData.event_id}` : "No event selected"}
              </span>
              <button
                type="button"
                onClick={() => setEventSelectModalOpen(true)}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-950 text-white font-medium rounded-xl hover:bg-blue-900 disabled:opacity-50"
              >
                Select event
              </button>
            </div>
          </div>
        )}

        <ArticlePublicationPortalsSection
          publications={publications}
          allPortals={allPortals}
          isPortalActionLoading={isPortalActionLoading}
          onAddToPortal={handleAddArticleToPortal}
          onRemoveFromPortal={handleRemoveArticleFromPortal}
          onUpdatePublication={handleUpdatePublicationPublication}
        />

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-gray-800">Tags</label>
          <ArticleTags
            tags={articleData.article_tags_array ?? []}
            onRemoveTag={handleRemoveTag}
            onAddTag={openAddTagModal}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-gray-800">Contents</label>
          <ArticleContentsList
            contentsIds={articleData.contents_array ?? []}
            contentsData={contentsData}
            onSaveContentField={handleSaveContentField}
            onOpenMediatecaForImage={openMediatecaForContentImage}
            onAddContent={openContentModal}
            onEditContentBlock={handleEditContentBlock}
            onDeleteContent={handleDeleteContent}
            isSaving={isSaving}
          />
        </div>

        <div className="flex flex-col gap-2 pt-6 border-t border-gray-200">
          <label className="text-lg font-bold text-gray-800">In this article</label>
          <p className="text-sm text-gray-500 mb-2">Redirections to related companies, products and event.</p>
          <div className="flex flex-wrap gap-3">
            {(articleData.article_company_redirections ?? []).map((companyId) => (
              <Link
                key={companyId}
                href={`/logged/pages/network/directory/companies/${encodeURIComponent(companyId)}`}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 text-sm font-medium"
              >
                Company: {companyId}
              </Link>
            ))}
            {(articleData.article_product_redirections ?? []).map((productId) => (
              <Link
                key={productId}
                href={`/logged/pages/network/directory/products/${encodeURIComponent(productId)}`}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 text-sm font-medium"
              >
                Product: {productId}
              </Link>
            ))}
            {articleData.is_article_event && (articleData.event_id ?? "").trim() ? (
              <Link
                href={`/logged/pages/network/contents/events/${encodeURIComponent(articleData.event_id!.trim())}`}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 text-sm font-medium"
              >
                Event: {articleData.event_id}
              </Link>
            ) : null}
          </div>
          {(articleData.article_company_redirections ?? []).length === 0 &&
            (articleData.article_product_redirections ?? []).length === 0 &&
            !(articleData.is_article_event && (articleData.event_id ?? "").trim()) ? (
            <p className="text-sm text-gray-400">No redirections in this article.</p>
          ) : null}
        </div>
      </main>
            </div>
          </div>
        </div>
      </PageContentSection>

      <EditContentsModal
        isOpen={isEditModalOpen}
        initialValue={modalInitialValue}
        title={modalTitle}
        onSave={handleSaveEditChanges}
        onCancel={closeEditModal}
      />

      <MediatecaModal
        open={isMediatecaModalOpen}
        onClose={closeMediatecaModal}
        onSelectImage={(imageSrc) => {
          handleSaveEditChanges(imageSrc);
        }}
        initialPath={ARTICLES_MEDIA_LIBRARY_PATH}
      />

      <EventSelectModal
        open={eventSelectModalOpen}
        onClose={() => setEventSelectModalOpen(false)}
        onSelectEvent={(eventIdSelected) => {
          handleEditEventId(eventIdSelected);
          setEventSelectModalOpen(false);
        }}
      />

      <CompanySelectModal
        open={companySelectModalOpen}
        onClose={() => setCompanySelectModalOpen(false)}
        onSelectCompany={(payload) => {
          handleAddCompanyFromDirectory(payload);
        }}
        publications={publications.map((p) => ({ portalId: p.portalId, portalName: p.portalName }))}
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
