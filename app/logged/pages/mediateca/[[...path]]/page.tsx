"use client";

import React, { FC, use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import foldersData from "@/app/contents/mediatecaFolders.json";
import contentsData from "@/app/contents/mediatecaContents.json";
import CreateFolderModal from "@/app/logged/pages/mediateca/CreateFolderModal";
import AddFileModal from "@/app/logged/pages/mediateca/AddFileModal";

export type MediatecaFolder = { id: string; name: string; path: string };
export type MediatecaContent = {
  id: string;
  name: string;
  folderPath: string;
  type: "pdf" | "image";
  content_type: "json" | "image";
  publishedAt: string;
  usedIn: string[];
  thumbnailUrl: string | null;
  url?: string | null;
  src: string;
};

const folders = foldersData as MediatecaFolder[];
const contents = contentsData as MediatecaContent[];

function getSubfolders(currentPath: string): MediatecaFolder[] {
  const prefix = currentPath ? `${currentPath}/` : "";
  return folders.filter((f) => f.path.startsWith(prefix) && !f.path.slice(prefix.length).includes("/"));
}

function getContentsInFolder(currentPath: string): MediatecaContent[] {
  return contents.filter((c) => c.folderPath === currentPath);
}

function getCurrentFolderName(pathSegments: string[]): string {
  if (pathSegments.length === 0) return "Mediateca";
  return pathSegments[pathSegments.length - 1];
}

const MediatecaPage: FC<{ params: Promise<{ path?: string[] }> }> = ({ params }) => {
  const router = useRouter();
  const resolved = use(params);
  const pathSegments = resolved.path ?? [];
  const currentPath = pathSegments.join("/");

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);

  const subfolders = useMemo(() => getSubfolders(currentPath), [currentPath]);
  const folderContents = useMemo(() => getContentsInFolder(currentPath), [currentPath]);
  const folderName = useMemo(() => getCurrentFolderName(pathSegments), [pathSegments]);

  const baseHref = "/logged/pages/mediateca";
  const breadcrumbs = useMemo(() => {
    const items: { label: string; href?: string }[] = [{ label: "Mediateca", href: baseHref }];
    pathSegments.forEach((seg, i) => {
      const href = `${baseHref}/${pathSegments.slice(0, i + 1).join("/")}`;
      items.push({ label: seg, href: i < pathSegments.length - 1 ? href : undefined });
    });
    return items;
  }, [pathSegments]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    const items: { label: string; href?: string }[] = [{ label: "Mediateca", href: baseHref }];
    pathSegments.forEach((seg, i) => {
      const href = `${baseHref}/${pathSegments.slice(0, i + 1).join("/")}`;
      items.push({ label: seg, href: i < pathSegments.length - 1 ? href : undefined });
    });
    setPageMeta({
      pageTitle: folderName,
      breadcrumbs: items,
      buttons: [
        { label: "Create folder", href: "#", onClick: () => setCreateFolderOpen(true) },
        { label: "Add file", href: "#", onClick: () => setAddFileOpen(true) },
      ],
    });
  }, [setPageMeta, folderName, currentPath]);

  const handleCreateFolderSuccess = () => {
    setCreateFolderOpen(false);
    router.refresh();
  };

  const handleAddFileSuccess = () => {
    setAddFileOpen(false);
    router.refresh();
  };

  return (
    <>
      <CreateFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        parentPath={currentPath}
        onSuccess={handleCreateFolderSuccess}
      />
      <AddFileModal
        open={addFileOpen}
        onClose={() => setAddFileOpen(false)}
        folderPath={currentPath}
        onSuccess={handleAddFileSuccess}
      />

      <PageContentSection>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{folderName}</h2>
        <p className="text-xs text-gray-500 mb-4">Subfolders</p>
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subfolders.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-500">
                    No subfolders in this folder.
                  </td>
                </tr>
              ) : (
                subfolders.map((f) => (
                  <tr key={f.id} className="cursor-pointer hover:bg-blue-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`${baseHref}/${f.path}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {f.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{f.path}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageContentSection>

      <PageContentSection>
        <p className="text-xs text-gray-500 mb-4">Contents</p>
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Thumbnail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {folderContents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">
                    No contents in this folder.
                  </td>
                </tr>
              ) : (
                folderContents.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {c.content_type === "image" && c.src ? (
                          <img src={c.src} alt="" className="w-full h-full object-cover" />
                        ) : c.content_type === "json" || c.type === "pdf" ? (
                          <span className="text-red-600 text-xs font-bold">PDF</span>
                        ) : (
                          <span className="text-gray-400 text-xs">img</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">{c.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.publishedAt}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {c.usedIn.length === 0 ? "—" : c.usedIn.join(", ")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/logged/pages/mediateca/asset/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View
                        </a>
                        <span className="text-gray-300">|</span>
                        <a
                          href={c.src ?? `/logged/pages/mediateca/asset/${c.id}`}
                          download={c.src ? c.name : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageContentSection>
    </>
  );
};

export default MediatecaPage;
