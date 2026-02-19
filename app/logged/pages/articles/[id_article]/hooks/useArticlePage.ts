import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { articleInterface } from "@/app/contents/interfaces";
import { ArticleService } from "@/app/service/ArticleService";
import { ContentService } from "@/app/service/ContentService";
import { EventsService } from "@/app/service/EventsService";
import { isRichTextEmpty } from "@/app/logged/logged_components/RichTextEditor";

type EditTarget =
  | { kind: "articleTitle" }
  | { kind: "articleSubtitle" }
  | { kind: "articleMainImage" }
  | { kind: "company" }
  | { kind: "date" }
  | { kind: "content"; contentId: string; field: "center" | "left" | "right" };

export function useArticlePage(id_article: string) {
  const router = useRouter();

  const [articleData, setArticleData] = useState<articleInterface | null>(null);
  const [contentsData, setContentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [modalInitialValue, setModalInitialValue] = useState<string>("");
  const [modalTitle, setModalTitle] = useState<string>("Edit contents");
  const [currentEditTarget, setCurrentEditTarget] = useState<EditTarget | null>(null);

  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [showContentModal, setShowContentModal] = useState<boolean>(false);
  const [contentModalPosition, setContentModalPosition] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<
    "text_image" | "image_text" | "just_image" | "just_text" | ""
  >("");
  const [contentFormData, setContentFormData] = useState({
    left: "",
    right: "",
    center: "",
  });

  const normalizeArticle = (raw: any): articleInterface => {
    return {
      id_article: String(raw?.id_article ?? ""),
      articleTitle: String(raw?.articleTitle ?? ""),
      articleSubtitle: String(raw?.articleSubtitle ?? ""),
      article_main_image_url: String(raw?.article_main_image_url ?? ""),
      company: String(raw?.company ?? ""),
      date: String(raw?.date ?? ""),
      article_tags_array: Array.isArray(raw?.article_tags_array)
        ? raw.article_tags_array
        : [],
      contents_array: Array.isArray(raw?.contents_array) ? raw.contents_array : [],
      highlited_position: String(raw?.highlited_position ?? ""),
      is_article_event: raw?.is_article_event === true,
      event_id: String(raw?.event_id ?? ""),
    };
  };

  useEffect(() => {
    const loadArticleData = async () => {
      setLoading(true);
      setError(null);

      try {
        const articleRaw = await ArticleService.getArticleById(id_article);

        if (!articleRaw) {
          setError("El artículo que buscas no existe.");
          setArticleData(null);
          setContentsData([]);
          return;
        }

        const article = normalizeArticle(articleRaw);
        setArticleData(article);

        const allContents = await ContentService.getAllContents();
        const articleContents = allContents.filter((content: any) =>
          (article.contents_array ?? []).includes(content.content_id)
        );

        setContentsData(articleContents);
      } catch (err: any) {
        let errorMessage = "Error al cargar el artículo";
        if (err?.status === 500 || err?.status === 404) {
          errorMessage = "El artículo que buscas no existe o ha sido eliminado.";
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (err?.data?.message) {
          errorMessage = err.data.message;
        }

        setError(errorMessage);
        setArticleData(null);
        setContentsData([]);
      } finally {
        setLoading(false);
      }
    };

    if (id_article) {
      loadArticleData();
    } else {
      setLoading(false);
      setError("ID de artículo no válido.");
      setArticleData(null);
      setContentsData([]);
    }
  }, [id_article]);

  const createArticleUpdateData = (updates: Partial<articleInterface>) => {
    if (!articleData) {
      throw new Error("Article data not loaded");
    }
    const isEvent = updates.is_article_event ?? articleData.is_article_event ?? false;
    return {
      articleTitle: updates.articleTitle ?? articleData.articleTitle,
      articleSubtitle: updates.articleSubtitle ?? articleData.articleSubtitle,
      article_main_image_url:
        updates.article_main_image_url ?? articleData.article_main_image_url,
      company: updates.company ?? articleData.company,
      date: updates.date ?? articleData.date,
      article_tags_array: updates.article_tags_array ?? articleData.article_tags_array,
      contents_array: updates.contents_array ?? articleData.contents_array,
      highlited_position: updates.highlited_position ?? articleData.highlited_position ?? "",
      is_article_event: isEvent,
      event_id: isEvent ? (updates.event_id ?? articleData.event_id ?? "") : "",
    };
  };

  const openEditModal = (
    editTarget: EditTarget,
    value: string,
    title: string = "Edit contents"
  ) => {
    setCurrentEditTarget(editTarget);
    setModalInitialValue(value);
    setModalTitle(title);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentEditTarget(null);
  };

  const handleSaveEditChanges = async (newValue: string) => {
    if (!currentEditTarget || !articleData) return;

    setIsSaving(true);
    try {
      if (currentEditTarget.kind === "articleTitle") {
        const updateData = createArticleUpdateData({ articleTitle: newValue });
        await ArticleService.updateArticle(id_article, updateData);
        setArticleData({ ...articleData, articleTitle: newValue });
      } else if (currentEditTarget.kind === "articleSubtitle") {
        const updateData = createArticleUpdateData({ articleSubtitle: newValue });
        await ArticleService.updateArticle(id_article, updateData);
        setArticleData({ ...articleData, articleSubtitle: newValue });
      } else if (currentEditTarget.kind === "articleMainImage") {
        const updateData = createArticleUpdateData({
          article_main_image_url: newValue,
        });
        await ArticleService.updateArticle(id_article, updateData);
        setArticleData({ ...articleData, article_main_image_url: newValue });
      } else if (currentEditTarget.kind === "company") {
        const updateData = createArticleUpdateData({ company: newValue });
        await ArticleService.updateArticle(id_article, updateData);
        setArticleData({ ...articleData, company: newValue });
      } else if (currentEditTarget.kind === "date") {
        const updateData = createArticleUpdateData({ date: newValue });
        await ArticleService.updateArticle(id_article, updateData);
        setArticleData({ ...articleData, date: newValue });
      } else if (currentEditTarget.kind === "content") {
        const contentToUpdate = contentsData.find(
          (c) => c.content_id === currentEditTarget.contentId
        );

        if (contentToUpdate) {
          const contentUpdateData = {
            content_type: contentToUpdate.content_type,
            content_content: {
              ...contentToUpdate.content_content,
              [currentEditTarget.field]: newValue,
            },
          };

          await ContentService.updateContent(
            currentEditTarget.contentId,
            contentUpdateData
          );

          const allContents = await ContentService.getAllContents();
          const articleContents = allContents.filter((content: any) =>
            (articleData.contents_array ?? []).includes(content.content_id)
          );
          setContentsData(articleContents);
        }
      }

      closeEditModal();
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al guardar cambios: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddTagModal = () => setIsAddTagModalOpen(true);
  const closeAddTagModal = () => setIsAddTagModalOpen(false);

  const handleSaveNewTag = async (newTag: string) => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag || !articleData) {
      closeAddTagModal();
      return;
    }

    setIsSaving(true);
    try {
      const updateData = createArticleUpdateData({
        article_tags_array: [...(articleData.article_tags_array ?? []), trimmedTag],
      });
      await ArticleService.updateArticle(id_article, updateData);
      setArticleData({
        ...articleData,
        article_tags_array: updateData.article_tags_array,
      });
      closeAddTagModal();
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al agregar tag: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!articleData) return;

    setIsSaving(true);
    try {
      const updateData = createArticleUpdateData({
        article_tags_array: (articleData.article_tags_array ?? []).filter(
          (tag) => tag !== tagToRemove
        ),
      });
      await ArticleService.updateArticle(id_article, updateData);
      setArticleData({
        ...articleData,
        article_tags_array: updateData.article_tags_array,
      });
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al eliminar tag: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditContentField = (args: {
    contentId: string;
    field: "center" | "left" | "right";
    initialValue: string;
    modalTitle: string;
  }) => {
    const { contentId, field, initialValue, modalTitle } = args;

    openEditModal(
      {
        kind: "content",
        contentId,
        field,
      },
      initialValue,
      modalTitle
    );
  };

  const handleEditTitle = () => {
    if (!articleData) return;
    openEditModal(
      { kind: "articleTitle" },
      articleData.articleTitle ?? "",
      "Edit article title"
    );
  };

  const handleEditSubtitle = () => {
    if (!articleData) return;
    openEditModal(
      { kind: "articleSubtitle" },
      articleData.articleSubtitle ?? "",
      "Edit article subtitle"
    );
  };

  const handleEditMainImage = () => {
    if (!articleData) return;
    openEditModal(
      { kind: "articleMainImage" },
      articleData.article_main_image_url ?? "",
      "Edit main image url"
    );
  };

  const handleEditCompany = () => {
    if (!articleData) return;
    openEditModal({ kind: "company" }, articleData.company ?? "", "Edit company");
  };

  const handleEditDate = () => {
    if (!articleData) return;
    openEditModal({ kind: "date" }, articleData.date ?? "", "Edit date");
  };

  const handleEditHighlitedPosition = async (newValue: string) => {
    if (!articleData) return;
    const value = (newValue || "").trim();
    if (value === (articleData.highlited_position ?? "")) return;
    setIsSaving(true);
    try {
      const updateData = createArticleUpdateData({ highlited_position: value });
      await ArticleService.updateArticle(id_article, updateData);
      setArticleData({ ...articleData, highlited_position: value });
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al guardar posición destacada: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditIsArticleEvent = async (value: boolean) => {
    if (!articleData) return;
    if (value === (articleData.is_article_event ?? false)) return;
    setIsSaving(true);
    try {
      const updateData = createArticleUpdateData({
        is_article_event: value,
        event_id: value ? (articleData.event_id ?? "") : "",
      });
      await ArticleService.updateArticle(id_article, updateData);
      setArticleData({
        ...articleData,
        is_article_event: value,
        event_id: value ? (articleData.event_id ?? "") : "",
      });
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al guardar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEventId = async (newValue: string) => {
    if (!articleData) return;
    const value = (newValue || "").trim();
    if (value === (articleData.event_id ?? "")) return;
    try {
      await EventsService.getEventById(value);
    } catch {
      alert("El evento con ese ID no existe. Compruebe el Event id.");
      return;
    }
    setIsSaving(true);
    try {
      const updateData = createArticleUpdateData({ event_id: value });
      await ArticleService.updateArticle(id_article, updateData);
      setArticleData({ ...articleData, event_id: value });
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al guardar Event id: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleDeleteArticle = async () => {
    setIsDeleting(true);
    try {
      await ArticleService.deleteArticle(id_article);
      router.push("/logged/pages/articles");
      router.refresh();
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al eliminar el artículo: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateContentId = () => {
    return `id_content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const openContentModal = (position: number | null, content?: any) => {
    setContentModalPosition(position);
    if (content) {
      setEditingContent(content);
      setSelectedContentType(content.content_type);
      setContentFormData({
        left: content.content_content?.left ?? "",
        right: content.content_content?.right ?? "",
        center: content.content_content?.center ?? "",
      });
    } else {
      setEditingContent(null);
      setSelectedContentType("");
      setContentFormData({ left: "", right: "", center: "" });
    }
    setShowContentModal(true);
  };

  const handleEditContentBlock = (content: any) => {
    openContentModal(null, content);
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!articleData) return;
    if (!confirm("¿Eliminar este contenido del artículo?")) return;

    setIsSaving(true);
    try {
      const newContentsArray = (articleData.contents_array ?? []).filter(
        (id) => id !== contentId
      );
      const updateData = createArticleUpdateData({
        contents_array: newContentsArray,
      });
      await ArticleService.updateArticle(id_article, updateData);
      setArticleData({ ...articleData, contents_array: newContentsArray });

      const allContents = await ContentService.getAllContents();
      const articleContents = allContents.filter((content: any) =>
        newContentsArray.includes(content.content_id)
      );
      setContentsData(articleContents);

      try {
        await ContentService.deleteContent(contentId);
      } catch {
        // Content removed from article; deletion from contents API is best-effort
      }
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al eliminar contenido: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const closeContentModal = () => {
    setShowContentModal(false);
    setContentModalPosition(null);
    setEditingContent(null);
    setSelectedContentType("");
    setContentFormData({ left: "", right: "", center: "" });
  };

  const handleContentTypeSelect = (
    type: "text_image" | "image_text" | "just_image" | "just_text"
  ) => {
    setSelectedContentType(type);
    setContentFormData({ left: "", right: "", center: "" });
  };

  const handleContentConfirm = async () => {
    if (!selectedContentType || !articleData) return;

    let isValid = false;
    if (selectedContentType === "text_image") {
      isValid =
        !isRichTextEmpty(contentFormData.left) && contentFormData.right.trim() !== "";
    } else if (selectedContentType === "image_text") {
      isValid =
        contentFormData.left.trim() !== "" && !isRichTextEmpty(contentFormData.right);
    } else if (selectedContentType === "just_image") {
      isValid = contentFormData.center.trim() !== "";
    } else if (selectedContentType === "just_text") {
      isValid = !isRichTextEmpty(contentFormData.center);
    }

    if (!isValid) {
      alert("Por favor, complete todos los campos requeridos");
      return;
    }

    setIsSaving(true);
    try {
      const newContent = {
        content_id: editingContent?.content_id || generateContentId(),
        content_type: selectedContentType,
        content_content: { ...contentFormData },
      };

      if (editingContent) {
        await ContentService.updateContent(editingContent.content_id, {
          content_type: selectedContentType,
          content_content: contentFormData,
        });

        const allContents = await ContentService.getAllContents();
        const articleContents = allContents.filter((content: any) =>
          (articleData.contents_array ?? []).includes(content.content_id)
        );
        setContentsData(articleContents);
      } else {
        await ContentService.createContent(newContent);

        const currentContentsArray = articleData.contents_array ?? [];
        let newContentsArray: string[];

        if (contentModalPosition === null) {
          newContentsArray = [...currentContentsArray, newContent.content_id];
        } else {
          newContentsArray = [...currentContentsArray];
          newContentsArray.splice(contentModalPosition, 0, newContent.content_id);
        }

        const updateData = createArticleUpdateData({
          contents_array: newContentsArray,
        });
        await ArticleService.updateArticle(id_article, updateData);
        setArticleData({ ...articleData, contents_array: newContentsArray });

        const allContents = await ContentService.getAllContents();
        const articleContents = allContents.filter((content: any) =>
          newContentsArray.includes(content.content_id)
        );
        setContentsData(articleContents);
      }

      closeContentModal();
    } catch (error: any) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
            ? error.message
            : error?.data?.message
              ? error.data.message
              : "Error desconocido";
      alert(`Error al guardar contenido: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormDataChange = (data: { left?: string; right?: string; center?: string }) => {
    setContentFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const handleContentTypeChange = () => {
    setSelectedContentType("");
  };

  return {
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
    contentModalPosition,
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
  };
}

