"use client";

import React, { FC, Suspense, use } from "react";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ArticleBuilderLoadingView } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticleBuilderLoadingView";
import { ArticleBuilderPageEditorPanel } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticleBuilderPageEditorPanel";
import { ArticlePageFormatChangeConfirmModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticlePageFormatChangeConfirmModal";
import { ArticleBuilderGeneralDataTab } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderGeneralDataTab";
import { ArticleBuilderMainTabs } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderMainTabs";
import { ArticleBuilderNotFoundView } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderNotFoundView";
import { DeleteChunkModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/DeleteChunkModal";
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

  const pagesManagerProps = {
    pages: builder.pages,
    chunks: builder.chunks,
    pageOptions: builder.pageOptions,
    articleFlowPages: builder.articleFlowPages,
    magazinePageLayout: builder.magazinePageLayout,
    pageCountInput: builder.pageCountInput,
    syncing: builder.syncing,
    actionMessage: builder.actionMessage,
    actionError: builder.actionError,
    busyChunkId: builder.busyChunkId,
    bulkChunkMoveBusy: builder.bulkChunkMoveBusy,
    chunksUnassigned: builder.chunksUnassigned,
    unassignedWeightOverflowIds: builder.unassignedWeightOverflowIds,
    portalArticleIdForOriginalTab: builder.portalArticleIdForOriginalTab,
    editorPageHref: builder.editorPageHref,
    onPageCountInputChange: builder.setPageCountInput,
    onSyncPages: () => void builder.handleSyncPages(),
    onInitializeChunks: () => void builder.handleInitializeChunks(),
    onAddBlankChunk: () => void builder.handleAddBlankChunk(),
    onAssignChunk: builder.handleAssignChunkToPage,
    onRequestDelete: builder.setDeleteChunkModal,
    onWeightCommit: builder.handleUpdateChunkPageWeight,
    onMoveRestForward: builder.handleMoveRestToNextSlot,
  };

  return (
    <PageContentSection>
      <div className="space-y-6 p-4">
        <ArticleBuilderMainTabs
          mainTab={builder.mainTab}
          onSelectGeneral={() => builder.setMainTab("general")}
          onSelectEditor={() => {
            builder.setMainTab("editor");
            if (builder.pages.length > 0 && builder.editorPageIndex < 0) {
              builder.navigateEditorPage(0);
            }
          }}
        />

        {builder.mainTab === "general" ? (
          <ArticleBuilderGeneralDataTab
            publicationArticle={builder.publicationArticle}
            articleMeta={builder.articleMeta}
            generalSection={builder.generalSection}
            magazinePageLayout={builder.magazinePageLayout}
            pageFormatSaving={builder.pageFormatSaving}
            portalArticleIdForOriginalTab={builder.portalArticleIdForOriginalTab}
            articleStateSaving={builder.articleStateSaving}
            onStateChange={(next) => void builder.handlePublicationArticleStateChange(next)}
            flatplanNameSaving={builder.flatplanNameSaving}
            onFlatplanNameSave={(next) => void builder.handlePublicationArtNameSave(next)}
            onPageFormatChange={(formatId) =>
              builder.requestPageFormatChange(formatId as MagazinePageLayout)
            }
            onSelectPagesManager={() => builder.setGeneralSection("pages-manager")}
            onSelectOriginal={() => builder.setGeneralSection("original")}
            pagesManagerProps={pagesManagerProps}
          />
        ) : null}

        {builder.mainTab === "editor" ? (
          <ArticleBuilderPageEditorPanel
            publicationId={builder.idPublication}
            publicationArticleId={publicationArticleId}
            pageFormat={builder.magazinePageLayout}
            pageParam={builder.editorPageParam}
            canNavigatePrev={builder.canEditorPrev}
            canNavigateNext={builder.canEditorNext}
            onNavigatePrev={() => builder.navigateEditorPage(builder.editorPageIndex - 1)}
            onNavigateNext={() => builder.navigateEditorPage(builder.editorPageIndex + 1)}
            onChunksChanged={() => void builder.load({ silent: true })}
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

      <DeleteChunkModal
        chunk={builder.deleteChunkModal}
        busyChunkId={builder.busyChunkId}
        onClose={() => builder.setDeleteChunkModal(null)}
        onConfirm={() => void builder.handleConfirmDeleteChunk()}
      />
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
