"use client";

import React, { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PublicationService } from "@/app/service/PublicationService";
import DatePicker from "@/app/logged/logged_components/DatePicker";

interface PublicationData {
  id_publication: string;
  redirectionLink: string;
  date: string;
  magazine: string;
  número: number;
  publication_main_image_url: string;
}

const CreatePublication: FC = () => {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);
  
  const [idPublication, setIdPublication] = useState("");
  const [redirectionLink, setRedirectionLink] = useState("");
  const [date, setDate] = useState("");
  const [magazine, setMagazine] = useState("");
  const [numero, setNumero] = useState<string>("");
  const [publicationMainImageUrl, setPublicationMainImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);

  // Establecer fecha por defecto como hoy
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para generar el ID automáticamente
  const generatePublicationId = async (): Promise<string> => {
    try {
      // Obtener todas las publicaciones existentes
      const allPublications = await PublicationService.getAllPublications();
      
      // Obtener el año actual (últimos 2 dígitos)
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      
      // Patrón regex para encontrar publicaciones del año actual
      const pattern = new RegExp(`^publication_${yearSuffix}_\\d{9}$`);
      
      // Filtrar publicaciones que coincidan con el patrón del año actual
      const currentYearPublications = allPublications.filter((pub: any) => 
        pattern.test(pub.id_publication)
      );
      
      // Extraer los números ordinales y encontrar el máximo
      let maxOrdinal = 0;
      currentYearPublications.forEach((pub: any) => {
        const match = pub.id_publication.match(/^publication_\d{2}_(\d{9})$/);
        if (match) {
          const ordinal = parseInt(match[1], 10);
          if (ordinal > maxOrdinal) {
            maxOrdinal = ordinal;
          }
        }
      });
      
      // Generar el siguiente ID
      const nextOrdinal = maxOrdinal + 1;
      const ordinalString = nextOrdinal.toString().padStart(9, '0');
      
      return `publication_${yearSuffix}_${ordinalString}`;
    } catch (error) {
      console.error("Error generating publication ID:", error);
      // En caso de error, generar un ID basado en timestamp como fallback
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      const timestamp = Date.now();
      const ordinalString = (timestamp % 1000000000).toString().padStart(9, '0');
      return `publication_${yearSuffix}_${ordinalString}`;
    }
  };

  // Generar ID automáticamente al cargar el componente
  useEffect(() => {
    const loadPublicationId = async () => {
      setIsGeneratingId(true);
      const generatedId = await generatePublicationId();
      setIdPublication(generatedId);
      setIsGeneratingId(false);
    };
    
    loadPublicationId();
    setDate(getTodayDate());
  }, []);

  const handlePhase1Next = () => {
    // Validar campos requeridos (imageUrl es opcional)
    if (idPublication && redirectionLink && date && magazine && numero) {
      setCurrentPhase(2);
    }
  };

  const handlePhase2Back = () => {
    setCurrentPhase(1);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const publicationData: PublicationData = {
        id_publication: idPublication,
        redirectionLink,
        date,
        magazine,
        número: Number(numero),
        publication_main_image_url: publicationMainImageUrl,
      };

      console.log("Creating publication:", JSON.stringify(publicationData, null, 2));
      await PublicationService.createPublication(publicationData);
      console.log("Publication created successfully");

      alert("¡Publicación creada exitosamente!");
      router.push("/logged/pages/publications");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating publication - full error:", error);
      // Extract error message properly
      let errorMessage = "Error desconocido";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.status) {
        errorMessage = `Error ${error.status}: ${error.message || "Error del servidor"}`;
      } else if (error?.data) {
        errorMessage = typeof error.data === "string" 
          ? error.data 
          : JSON.stringify(error.data);
      } else {
        errorMessage = JSON.stringify(error);
      }
      alert(`Error al crear la publicación: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    idPublication && redirectionLink && date && magazine && numero;

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Crear Nueva Publicación</p>
        <p className="text-sm mt-2">Fase {currentPhase} de 2</p>
      </div>

      <div className="flex flex-col p-8 max-w-4xl mx-auto w-full">
        {/* FASE 1: Datos de la Publicación */}
        {currentPhase === 1 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold">Datos de la Publicación</h2>

            <div className="space-y-2">
              <label className="font-bold text-lg">ID de Publicación *</label>
              <input
                type="text"
                value={isGeneratingId ? "Generando..." : idPublication}
                readOnly
                disabled={isGeneratingId}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="publication_25_000000001"
              />
              {isGeneratingId && (
                <p className="text-sm text-gray-500">Generando ID automáticamente...</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="font-bold text-lg">Enlace de Redirección *</label>
              <input
                type="text"
                value={redirectionLink}
                onChange={(e) => setRedirectionLink(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-lg">Revista *</label>
              <input
                type="text"
                value={magazine}
                onChange={(e) => setMagazine(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="Nombre de la revista"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-lg">Número *</label>
              <input
                type="number"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="Número de la publicación"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-lg">Fecha *</label>
              <DatePicker
                value={date}
                onChange={setDate}
                className="w-full"
                placeholder="Seleccionar fecha"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-lg">URL de Imagen Principal</label>
              <input
                type="text"
                value={publicationMainImageUrl}
                onChange={(e) => setPublicationMainImageUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => router.push("/logged/pages/publications")}
                className="flex-1 bg-gray-300 py-2 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handlePhase1Next}
                disabled={isGeneratingId || !isFormValid}
                className={`flex-1 py-2 rounded-xl ${
                  !isGeneratingId && isFormValid
                    ? "bg-blue-950 text-white"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* FASE 2: Revisión Final */}
        {currentPhase === 2 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold">Revisión Final</h2>

            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <h3 className="font-bold text-lg mb-4">Datos de la Publicación</h3>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {idPublication}</p>
                <p><strong>Enlace de Redirección:</strong> {redirectionLink}</p>
                <p><strong>Revista:</strong> {magazine}</p>
                <p><strong>Número:</strong> {numero}</p>
                <p><strong>Fecha:</strong> {date}</p>
                <p><strong>URL de Imagen:</strong> {publicationMainImageUrl || "No especificada"}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handlePhase2Back}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 py-2 rounded-xl"
              >
                Atrás
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-2 rounded-xl ${
                  isSubmitting
                    ? "bg-gray-400 text-gray-600"
                    : "bg-blue-950 text-white"
                }`}
              >
                {isSubmitting ? "Creando..." : "Finalizar y Crear Publicación"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePublication;

