"use client";

import React, { FC, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CreateServicePage: FC = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    id_service: "",
    name: "",
    display_name: "",
    description: "",
    tariff_price_eur: "",
    unit: "",
    delivery_days: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/logged/pages/production/services");
  };

  const backUrl = "/logged/pages/production/services";

  return (
    <div className="flex flex-col w-full min-w-0 bg-white">
      <div className="w-full flex items-center justify-between gap-4 bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Nuevo servicio</p>
        <Link
          href={backUrl}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          ← Volver
        </Link>
      </div>

      <div className="p-12 w-full">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">ID servicio</label>
            <input
              type="text"
              name="id_service"
              value={form.id_service}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. srv-007"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nombre (interno)</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. newsletter, portal_article"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nombre para mostrar</label>
            <input
              type="text"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. Newsletter banner"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del servicio"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Precio tarifa (€)</label>
            <input
              type="number"
              name="tariff_price_eur"
              min={0}
              step={0.01}
              value={form.tariff_price_eur}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="450"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Unidad</label>
            <input
              type="text"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. inserción, artículo, banner/mes"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Días de entrega</label>
            <input
              type="number"
              name="delivery_days"
              min={0}
              value={form.delivery_days}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Crear servicio
            </button>
            <button
              type="button"
              onClick={() => router.push(backUrl)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServicePage;
