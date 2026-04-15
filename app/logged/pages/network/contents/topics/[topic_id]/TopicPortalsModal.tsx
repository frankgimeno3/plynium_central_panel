import React, { FC, useEffect, useMemo, useState } from "react";
import { PortalService } from "@/app/service/PortalService";

type PortalRow = {
  id: number;
  key?: string;
  name?: string;
  domain?: string;
};

function normalizePortal(raw: any): PortalRow | null {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id;
  if (!Number.isFinite(Number(id))) return null;
  return {
    id: Number(id),
    key: typeof raw.key === "string" ? raw.key : undefined,
    name: typeof raw.name === "string" ? raw.name : undefined,
    domain: typeof raw.domain === "string" ? raw.domain : undefined,
  };
}

export const TopicPortalsModal: FC<{
  open: boolean;
  title?: string;
  initialSelectedIds: number[];
  onClose: () => void;
  onApply: (selectedIds: number[]) => void;
}> = ({ open, title = "Seleccionar portales", initialSelectedIds, onClose, onApply }) => {
  const [loading, setLoading] = useState(false);
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelected(Array.isArray(initialSelectedIds) ? initialSelectedIds.slice() : []);
  }, [open, initialSelectedIds]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await PortalService.getAllPortals();
        const rows = Array.isArray(list) ? list.map(normalizePortal).filter(Boolean) : [];
        if (!cancelled) setPortals(rows as PortalRow[]);
      } catch {
        if (!cancelled) setPortals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando portales…</p>
          ) : portals.length === 0 ? (
            <p className="text-sm text-gray-600">No hay portales disponibles.</p>
          ) : (
            <div className="space-y-2">
              {portals.map((p) => {
                const checked = selectedSet.has(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={(e) => {
                        const nextChecked = e.target.checked;
                        setSelected((prev) => {
                          const base = Array.isArray(prev) ? prev : [];
                          if (nextChecked) return base.includes(p.id) ? base : [...base, p.id];
                          return base.filter((id) => id !== p.id);
                        });
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {p.name?.trim() ? p.name : `Portal ${p.id}`}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">ID {p.id}</span>
                        {p.key ? (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{p.key}</span>
                        ) : null}
                      </div>
                      {p.domain ? <div className="text-xs text-gray-500">{p.domain}</div> : null}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onApply(selected)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

