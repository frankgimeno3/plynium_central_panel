"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { PortalService } from "@/app/service/PortalService";
import { PublicationService } from "@/app/service/PublicationService";

interface MagazineRow {
  id: string;
  name: string;
  portalId: number;
  description: string;
}

const CreateMagazine: FC = () => {
  const [magazines, setMagazines] = useState<MagazineRow[]>([]);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [fromPublications, setFromPublications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [portalId, setPortalId] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const loadMagazines = useCallback(async () => {
    try {
      const list = await MagazineService.getAllMagazines();
      setMagazines(Array.isArray(list) ? list : []);
    } catch {
      setMagazines([]);
    }
  }, []);

  const loadPortals = useCallback(async () => {
    try {
      const list = await PortalService.getAllPortals();
      setPortals(
        Array.isArray(list)
          ? list.map((p: any) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
          : []
      );
      if (list?.length && portalId === "") {
        setPortalId(list[0].id);
      }
    } catch {
      setPortals([]);
    }
  }, [portalId]);

  const loadFromPublications = useCallback(async () => {
    try {
      const pubs = await PublicationService.getAllPublications();
      const revistas = new Set<string>();
      (Array.isArray(pubs) ? pubs : []).forEach((p: any) => {
        if (p.revista) revistas.add(p.revista);
      });
      setFromPublications(Array.from(revistas).sort());
    } catch {
      setFromPublications([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMagazines(), loadPortals(), loadFromPublications()]).finally(
      () => setLoading(false)
    );
  }, [loadMagazines, loadPortals, loadFromPublications]);

  useEffect(() => {
    if (portals.length > 0 && portalId === "") {
      setPortalId(portals[0].id);
    }
  }, [portals, portalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portalId === "" || !name.trim()) return;
    setSubmitting(true);
    try {
      await MagazineService.createMagazine({
        name: name.trim(),
        portalId: Number(portalId),
        description: description.trim(),
      });
      setName("");
      setDescription("");
      await loadMagazines();
    } catch (err) {
      console.error("Error creating magazine:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: "Publications", href: "/logged/pages/network/contents/publications" },
    { label: "Create magazine" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create magazine",
      breadcrumbs,
    });
  }, [setPageMeta]);

  const portalNameById = (id: number) =>
    portals.find((p) => p.id === id)?.name ?? String(id);

  return (
    <>
      <PageContentSection>
        <div className="mb-4">
          <Link
            href="/logged/pages/network/contents/publications"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Publications
          </Link>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create a new magazine
        </h2>
        <form
          onSubmit={handleSubmit}
          className="border border-gray-200 rounded-lg shadow-sm bg-white p-4 mb-8 max-w-xl"
        >
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Magazine name"
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portal
              </label>
              <select
                value={portalId === "" ? "" : portalId}
                onChange={(e) =>
                  setPortalId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Select portal</option>
                {portals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || portalId === ""}
                className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating…" : "Create magazine"}
              </button>
            </div>
          </div>
        </form>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Current magazines
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : (
          <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Portal</th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {magazines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-gray-500 text-center"
                    >
                      No magazines created yet. Use the form above to add one.
                    </td>
                  </tr>
                ) : (
                  magazines.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 text-gray-900">{m.name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {portalNameById(m.portalId)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {m.description || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {fromPublications.length > 0 && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mt-8 mb-2">
              Magazine names in use (from publications)
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              These names appear as revista on existing publications.
            </p>
            <div className="flex flex-wrap gap-2">
              {fromPublications.map((rev) => (
                <span
                  key={rev}
                  className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm"
                >
                  {rev}
                </span>
              ))}
            </div>
          </>
        )}
      </PageContentSection>
    </>
  );
};

export default CreateMagazine;
