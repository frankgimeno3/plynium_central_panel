"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { publicationInterface } from "@/app/contents/interfaces";
import { PublicationService } from "@/app/service/PublicationService";
import { PortalService } from "@/app/service/PortalService";
import EditContentsModal from "@/app/logged/logged_components/modals/EditContentsModal";
import DeletePublicationModal from "@/app/logged/logged_components/modals/DeletePublicationModal";
import PublicationHeader from "./id_publication_components/PublicationHeader";
import PublicationInfo from "./id_publication_components/PublicationInfo";
import PublicationMainImage from "./id_publication_components/PublicationMainImage";

type EditTarget =
  | { kind: "redirectionLink" }
  | { kind: "date" }
  | { kind: "revista" }
  | { kind: "número" }
  | { kind: "publicationMainImage" };

export default function IdPubblicationPage() {
  const params = useParams();
  const router = useRouter();
  const id_publication = params?.id_publication as string;

  const [publicationData, setPublicationData] = useState<publicationInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [modalInitialValue, setModalInitialValue] = useState<string>("");
  const [modalTitle, setModalTitle] = useState<string>("Edit contents");
  const [currentEditTarget, setCurrentEditTarget] = useState<EditTarget | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [publicationPortals, setPublicationPortals] = useState<
    { portalId: number; portalName: string; slug: string; redirectUrl: string; status: string }[]
  >([]);
  const [allPortals, setAllPortals] = useState<{ id: number; name: string }[]>([]);
  const [portalActionLoading, setPortalActionLoading] = useState<boolean>(false);

  const normalizePublication = (raw: any): publicationInterface => {
    return {
      id_publication: String(raw?.id_publication ?? ""),
      redirectionLink: String(raw?.redirectionLink ?? ""),
      date: String(raw?.date ?? ""),
      revista: String(raw?.revista ?? ""),
      número: typeof raw?.número === "number" ? raw.número : String(raw?.número ?? ""),
      publication_main_image_url: String(raw?.publication_main_image_url ?? ""),
    };
  };

  useEffect(() => {
    const loadPublicationData = async () => {
      console.log("[IdPublicationPage] Starting to load publication data, id_publication:", id_publication);
      setLoading(true);
      setError(null);

      try {
        console.log("[IdPublicationPage] Calling PublicationService.getPublicationById with:", id_publication);
        const [publicationRaw, portalsList, portalsListData] = await Promise.all([
          PublicationService.getPublicationById(id_publication),
          PortalService.getAllPortals(),
          PublicationService.getPublicationPortals(id_publication).catch(() => []),
        ]);
        console.log("[IdPublicationPage] Raw publication data received:", publicationRaw);

        setAllPortals(
          Array.isArray(portalsList)
            ? portalsList.map((p: any) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
            : []
        );
        setPublicationPortals(Array.isArray(portalsListData) ? portalsListData : []);

        if (!publicationRaw) {
          console.warn("[IdPublicationPage] No publication found for id:", id_publication);
          setError("La publicación que buscas no existe.");
          setPublicationData(null);
          return;
        }

        const publication = normalizePublication(publicationRaw);
        console.log("[IdPublicationPage] Normalized publication:", publication);
        setPublicationData(publication);
      } catch (err: any) {
        console.error("[IdPublicationPage] Error loading publication:", err);
        console.error("[IdPublicationPage] Error details:", {
          message: err?.message,
          stack: err?.stack,
          response: err?.response,
          data: err?.data,
          status: err?.status
        });
        
        // Determinar el mensaje de error apropiado
        let errorMessage = "Error al cargar la publicación";
        if (err?.status === 500 || err?.status === 404) {
          errorMessage = "La publicación que buscas no existe o ha sido eliminada.";
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (err?.data?.message) {
          errorMessage = err.data.message;
        }
        
        setError(errorMessage);
        setPublicationData(null);
      } finally {
        console.log("[IdPublicationPage] Setting loading to false");
        setLoading(false);
      }
    };

    if (id_publication) {
      loadPublicationData();
    } else {
      console.warn("[IdPublicationPage] No id_publication provided");
      setLoading(false);
      setError("ID de publicación no válido.");
      setPublicationData(null);
    }
  }, [id_publication]);

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

  const createPublicationUpdateData = (updates: Partial<publicationInterface>) => {
    if (!publicationData) {
      throw new Error("Publication data not loaded");
    }
    return {
      redirectionLink: updates.redirectionLink ?? publicationData.redirectionLink,
      date: updates.date ?? publicationData.date,
      revista: updates.revista ?? publicationData.revista,
      número: updates.número ?? publicationData.número,
      publication_main_image_url: updates.publication_main_image_url ?? publicationData.publication_main_image_url,
    };
  };

  const handleSaveEditChanges = async (newValue: string) => {
    if (!currentEditTarget || !publicationData) return;

    setIsSaving(true);
    try {
      if (currentEditTarget.kind === "redirectionLink") {
        const updateData = createPublicationUpdateData({ redirectionLink: newValue });
        await PublicationService.updatePublication(id_publication, updateData);
        setPublicationData({ ...publicationData, redirectionLink: newValue });
      } else if (currentEditTarget.kind === "date") {
        const updateData = createPublicationUpdateData({ date: newValue });
        await PublicationService.updatePublication(id_publication, updateData);
        setPublicationData({ ...publicationData, date: newValue });
      } else if (currentEditTarget.kind === "revista") {
        const updateData = createPublicationUpdateData({ revista: newValue });
        await PublicationService.updatePublication(id_publication, updateData);
        setPublicationData({ ...publicationData, revista: newValue });
      } else if (currentEditTarget.kind === "número") {
        const updateData = createPublicationUpdateData({ número: newValue });
        await PublicationService.updatePublication(id_publication, updateData);
        setPublicationData({ ...publicationData, número: newValue });
      } else if (currentEditTarget.kind === "publicationMainImage") {
        const updateData = createPublicationUpdateData({
          publication_main_image_url: newValue,
        });
        await PublicationService.updatePublication(id_publication, updateData);
        setPublicationData({ ...publicationData, publication_main_image_url: newValue });
      }

      closeEditModal();
    } catch (error: any) {
      console.error("Error saving changes:", error);
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

  const handleEditName = () => {
    if (!publicationData) return;
    openEditModal(
      { kind: "redirectionLink" },
      publicationData.redirectionLink ?? "",
      "Edit redirection link"
    );
  };

  const handleEditDate = () => {
    if (!publicationData) return;
    openEditModal(
      { kind: "date" },
      publicationData.date ?? "",
      "Edit date"
    );
  };

  const handleEditRevista = () => {
    if (!publicationData) return;
    openEditModal(
      { kind: "revista" },
      publicationData.revista ?? "",
      "Edit revista"
    );
  };

  const handleEditNumber = () => {
    if (!publicationData) return;
    openEditModal(
      { kind: "número" },
      String(publicationData.número ?? ""),
      "Edit número"
    );
  };

  const handleEditMainImage = () => {
    if (!publicationData) return;
    openEditModal(
      { kind: "publicationMainImage" },
      publicationData.publication_main_image_url ?? "",
      "Edit main image url"
    );
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleDeletePublication = async () => {
    setIsDeleting(true);
    try {
      await PublicationService.deletePublication(id_publication);
      router.push("/logged/pages/publications");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting publication:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message
          ? error.message
          : error?.data?.message
          ? error.data.message
          : "Error desconocido";
      alert(`Error al eliminar la publicación: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-lg">Cargando publicación...</p>
      </main>
    );
  }

  if (error || !publicationData) {
    return (
      <main className="flex h-full min-h-screen flex-col items-center justify-center bg-white px-24 py-10 text-gray-600 w-full">
        <p className="text-red-500 text-lg">
          {error || "La publicación que buscas no existe."}
        </p>
        <button
          onClick={() => router.push("/logged/pages/publications")}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl"
        >
          Volver a publicaciones
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
            {isDeleting ? "Eliminando..." : "Eliminar publicación"}
          </button>
        </div>

        <PublicationHeader
          redirectionLink={publicationData.redirectionLink}
          onEditName={handleEditName}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">
            URL de Imagen Principal
          </label>
          <PublicationMainImage
            imageUrl={publicationData.publication_main_image_url ?? ""}
            onEditMainImage={handleEditMainImage}
          />
        </div>

        <PublicationInfo
          date={publicationData.date}
          revista={publicationData.revista}
          número={publicationData.número}
          onEditDate={handleEditDate}
          onEditRevista={handleEditRevista}
          onEditNumero={handleEditNumber}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">
            Visible en portales
          </label>
          <div className="flex flex-col gap-2">
            {publicationPortals.length === 0 ? (
              <p className="text-sm text-gray-400">No visible en ningún portal aún.</p>
            ) : (
              <ul className="list-none flex flex-wrap gap-2">
                {publicationPortals.map((pp) => (
                  <li
                    key={pp.portalId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                  >
                    <span>{pp.portalName}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (portalActionLoading) return;
                        setPortalActionLoading(true);
                        try {
                          const list = await PublicationService.removePublicationFromPortal(
                            id_publication,
                            pp.portalId
                          );
                          setPublicationPortals(Array.isArray(list) ? list : []);
                        } catch (e: any) {
                          alert(
                            e?.message || e?.data?.message || "Error al quitar del portal"
                          );
                        } finally {
                          setPortalActionLoading(false);
                        }
                      }}
                      disabled={portalActionLoading}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 text-xs font-medium"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {allPortals.filter((p) => !publicationPortals.some((pp) => pp.portalId === p.id)).length >
              0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  id="add-publication-portal-select"
                  disabled={portalActionLoading}
                  className="px-3 py-2 border rounded-xl bg-white text-gray-700 text-sm disabled:opacity-50 max-w-xs"
                  defaultValue=""
                >
                  <option value="">Seleccionar portal para añadir…</option>
                  {allPortals
                    .filter((p) => !publicationPortals.some((pp) => pp.portalId === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={portalActionLoading}
                  onClick={async () => {
                    const sel = document.getElementById(
                      "add-publication-portal-select"
                    ) as HTMLSelectElement;
                    const portalId = sel?.value ? Number(sel.value) : 0;
                    if (portalId && id_publication) {
                      setPortalActionLoading(true);
                      try {
                        const list = await PublicationService.addPublicationToPortal(
                          id_publication,
                          portalId
                        );
                        setPublicationPortals(Array.isArray(list) ? list : []);
                        sel.value = "";
                      } catch (e: any) {
                        alert(
                          e?.message || e?.data?.message || "Error al añadir al portal"
                        );
                      } finally {
                        setPortalActionLoading(false);
                      }
                    }
                  }}
                  className="px-3 py-2 text-xs rounded-xl bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50"
                >
                  {portalActionLoading ? "…" : "Añadir al portal"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <EditContentsModal
        isOpen={isEditModalOpen}
        initialValue={modalInitialValue}
        title={modalTitle}
        onSave={handleSaveEditChanges}
        onCancel={closeEditModal}
      />

      <DeletePublicationModal
        isOpen={isDeleteModalOpen}
        publicationName={publicationData.redirectionLink || "Sin nombre"}
        onConfirm={handleDeletePublication}
        onCancel={closeDeleteModal}
      />
    </>
  );
}
