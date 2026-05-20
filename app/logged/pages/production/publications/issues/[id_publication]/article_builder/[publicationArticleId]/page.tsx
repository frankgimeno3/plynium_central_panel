"use client";

import React, { FC, Suspense, use } from "react";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ArticleBuilderAddPageConfirmModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticleBuilderAddPageConfirmModal";
import { ArticleBuilderDeletePageConfirmModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticleBuilderDeletePageConfirmModal";
import { ArticleBuilderLoadingView } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticleBuilderLoadingView";
import { ArticlePageFormatChangeConfirmModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticlePageFormatChangeConfirmModal";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { ArticleBuilderGeneralDataTab } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderGeneralDataTab";
import { ArticleBuilderEditorPagesView } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderEditorPagesView";
import { ArticleBuilderMainTabs } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderMainTabs";
import { ArticleBuilderNotFoundView } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderNotFoundView";
import { useArticleBuilderPage } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/hooks/useArticleBuilderPage";
import type { MagazinePageLayout } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";

const ArticleBuilderPageContent: FC<{
  params: Promise<{ id_publication: string; publicationArticleId: string }>;
}> = ({ params }) => {
  const { id_publication, publicationArticleId } = use(params);
  const builder = useArticleBuilderPage(id_publication, publicationArticleId);

  if (builder.loading) {
    return (
      <PageContentSection>
        <ArticleBuilderLoadingView />
      </PageContentSection>
    );
  }

  if (!builder.publicationArticle) {
    return (
      <PageContentSection>
        <ArticleBuilderNotFoundView
          idPublication={builder.idPublication}
          error={builder.error}
        />
      </PageContentSection>
    );
  }

  return (
    <PageContentSection>
      <div className="space-y-6 p-4">
        <ArticleBuilderMainTabs
          mainTab={builder.mainTab}
          onSelectGeneral={() => builder.setMainTab("general")}
          onSelectEditor={() => builder.setMainTab("editor")}
        />

        {builder.mainTab === "general" ? (
          <ArticleBuilderGeneralDataTab
            publicationArticle={builder.publicationArticle}
            articleMeta={builder.articleMeta}
            magazinePageLayout={builder.magazinePageLayout}
            pageFormatSaving={builder.pageFormatSaving}
            articleStateSaving={builder.articleStateSaving}
            onStateChange={(next) => void builder.handlePublicationArticleStateChange(next)}
            flatplanNameSaving={builder.flatplanNameSaving}
            onFlatplanNameSave={(next) => void builder.handlePublicationArtNameSave(next)}
            onPageFormatChange={(formatId) =>
              builder.requestPageFormatChange(formatId as MagazinePageLayout)
            }
            chunks={builder.chunks}
            setChunks={builder.setChunks}
            articleFlowPages={builder.articleFlowPages}
            onSaveMessage={builder.setActionMessage}
            onSaveError={builder.setActionError}
          />
        ) : null}

        {builder.mainTab === "editor" ? (
          <ArticleBuilderEditorPagesView
            publicationArticle={builder.publicationArticle}
            articleMeta={builder.articleMeta}
            chunks={builder.chunks}
            setChunks={builder.setChunks}
            articleFlowPages={builder.articleFlowPages}
            magazinePageLayout={builder.magazinePageLayout}
            slotPublicationPageBySlotId={builder.slotPublicationPageBySlotId}
            addingPage={builder.addingPage}
            deletingPage={builder.deletingPage}
            onAddPage={builder.requestAddArticlePage}
            onDeletePage={builder.requestDeleteArticlePage}
            onSaveMessage={builder.setActionMessage}
            onSaveError={builder.setActionError}
          />
        ) : null}
      </div>

      <ArticlePageFormatChangeConfirmModal
        open={builder.pendingPageFormat != null}
        currentLayout={builder.magazinePageLayout}
        nextLayout={builder.pendingPageFormat ?? builder.magazinePageLayout}
        saving={builder.pageFormatSaving}
        error={builder.actionError}
        onClose={builder.cancelPageFormatChange}
        onConfirm={() => void builder.confirmPageFormatChange()}
      />

      <ArticleBuilderAddPageConfirmModal
        open={builder.addPageModalOpen}
        nextArticlePageNumber={
          (Array.isArray(builder.publicationArticle.publication_slots_id_array)
            ? builder.publicationArticle.publication_slots_id_array.length
            : 0) + 1
        }
        saving={builder.addingPage}
        error={builder.addPageError}
        onClose={builder.cancelAddArticlePage}
        onConfirm={() => void builder.confirmAddArticlePage()}
      />

      {(() => {
        const slotId = builder.pendingDeleteSlotId;
        if (slotId == null) {
          return (
            <ArticleBuilderDeletePageConfirmModal
              open={false}
              articlePageNumber={1}
              totalPages={1}
              chunkCount={0}
              onClose={builder.cancelDeleteArticlePage}
              onConfirm={() => void builder.confirmDeleteArticlePage()}
            />
          );
        }
        const slotIds = (
          Array.isArray(builder.publicationArticle.publication_slots_id_array)
            ? builder.publicationArticle.publication_slots_id_array
            : []
        )
          .map(Number)
          .filter((sid) => Number.isFinite(sid) && sid > 0);
        const idx = slotIds.findIndex((sid) => sid === slotId);
        const total = slotIds.length;
        const articlePageNumber = idx >= 0 ? idx + 1 : 1;
        const chunkCount = builder.chunks.filter(
          (ch) => chunkPublicationSlotId(ch) === slotId
        ).length;
        return (
          <ArticleBuilderDeletePageConfirmModal
            open
            articlePageNumber={articlePageNumber}
            totalPages={total}
            chunkCount={chunkCount}
            saving={builder.deletingPage}
            error={builder.deletePageError}
            onClose={builder.cancelDeleteArticlePage}
            onConfirm={() => void builder.confirmDeleteArticlePage()}
          />
        );
      })()}
    </PageContentSection>
  );
};

const ArticleBuilderPage: FC<{
  params: Promise<{ id_publication: string; publicationArticleId: string }>;
}> = (props) => (
  <Suspense
    fallback={
      <PageContentSection>
        <ArticleBuilderLoadingView />
      </PageContentSection>
    }
  >
    <ArticleBuilderPageContent {...props} />
  </Suspense>
);

export default ArticleBuilderPage;
