"use client";

import React, { FC, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CreateCustomerPage: FC = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    id_customer: "",
    name: "",
    cif: "",
    country: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    industry: "",
    segment: "",
    owner: "",
    source: "",
    status: "",
    contact_name: "",
    contact_role: "",
    contact_email: "",
    contact_phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sin funcionalidad real: solo navegar atrás
    router.push("/logged/pages/management/sm/customers_db");
  };

  return (
    <div className="flex flex-col w-full min-w-0 bg-white">
      <div className="w-full flex items-center justify-between gap-4 bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Nueva cuenta (Customer)</p>
        <Link
          href="/logged/pages/management/sm/customers_db"
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          ← Volver
        </Link>
      </div>

      <div className="p-12 w-full">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Datos generales</p>
          <div>
            <label className="block text-xs text-gray-600 mb-1">ID cliente</label>
            <input
              type="text"
              name="id_customer"
              value={form.id_customer}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. cust-005"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nombre / Razón social</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de la empresa"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">CIF</label>
            <input
              type="text"
              name="cif"
              value={form.cif}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="B12345678"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">País</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="España"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dirección</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dirección fiscal"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+34 912 345 670"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="info@empresa.es"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Web</label>
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sector / Industria</label>
            <input
              type="text"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Vidrio y cristal"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Segmento</label>
            <input
              type="text"
              name="segment"
              value={form.segment}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Empresa"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Propietario</label>
            <input
              type="text"
              name="owner"
              value={form.owner}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Laura Martínez"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Origen</label>
            <input
              type="text"
              name="source"
              value={form.source}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Web, Feria, Referido..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Estado</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar</option>
              <option value="activo">Activo</option>
              <option value="prospecto">Prospecto</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <p className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 pt-4">Contacto principal</p>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nombre contacto</label>
            <input
              type="text"
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del contacto"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Rol</label>
            <input
              type="text"
              name="contact_role"
              value={form.contact_role}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Directora Comercial"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email contacto</label>
            <input
              type="email"
              name="contact_email"
              value={form.contact_email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contacto@empresa.es"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Teléfono contacto</label>
            <input
              type="text"
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+34 912 345 678"
            />
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => router.push("/logged/pages/management/sm/customers_db")}
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

export default CreateCustomerPage;
