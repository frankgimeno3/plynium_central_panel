"use client";

import { FC, Suspense, useEffect, useState } from "react";
import Link from "next/link";

import PublicationFilter from "./publication_components/PublicationFilter";
import { PublicationService } from "@/app/service/PublicationService";

interface PublicationsProps {}

const Publications: FC<PublicationsProps> = ({}) => {
  const [allPublications, setAllPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublications = async () => {
    try {
      // Obtener todas las publicaciones del API (ya incluye todas, creadas y originales)
      // El API lee directamente del archivo JSON, así que refleja el estado actual
      // incluyendo las eliminaciones
      const apiPublications = await PublicationService.getAllPublications();
      
      // Usar solo las publicaciones del API (ya no incluye las eliminadas)
      setAllPublications(Array.isArray(apiPublications) ? apiPublications : []);
    } catch (error) {
      console.error("Error fetching publications:", error);
      // En caso de error, usar array vacío
      setAllPublications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">All publications</p>
        <Link
          href="/logged/pages/publications/create"
          className="bg-blue-950 text-white text-xs px-4 py-1 rounded-xl shadow cursor-pointer w-36 mx-auto mt-2 hover:bg-blue-950/80 inline-block"
        >
          Create publication  
        </Link>
      </div>

      <Suspense fallback={<div className='px-36 mx-7'><div className='flex flex-col border border-gray-100 shadow-xl text-center py-2 text-xs'><p>Loading filter...</p></div></div>}>
        <PublicationFilter />
      </Suspense>

      <div className="flex flex-wrap py-5 gap-12 justify-center">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Cargando publicaciones...</p>
          </div>
        ) : allPublications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 w-full">
            <p className="text-gray-500 text-lg">No results found for your query</p>
          </div>
        ) : (
          allPublications.map((pub: any, index: number) => ( 
          <Link
            key={index}
            href={`/logged/pages/publications/${pub.id_publication}`}
            className="flex flex-col shadow-xl w-80 p-2 border-t border-gray-100 bg-gray-100/50 hover:bg-white min-h-[500px] cursor-pointer"
          >
            <div className="w-full h-60 bg-gray-300 overflow-hidden rounded-t-lg">
              <img
                src={pub.publication_main_image_url && pub.publication_main_image_url.trim() !== "" 
                  ? pub.publication_main_image_url 
                  : "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                alt={`${pub.revista} - ${pub.número}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") {
                    target.src = "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                  }
                }}
              />
            </div>

            <div className="flex flex-col p-3 flex-grow">
              <p className="font-semibold line-clamp-4">{pub.revista} - {pub.número}</p>
              <p className="text-sm text-gray-400 italic pt-2">{pub.date}</p>
              <div className="flex flex-row flex-wrap gap-2 pt-4">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {pub.revista}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {pub.número}
                </span>
              </div>
            </div>
          </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Publications;