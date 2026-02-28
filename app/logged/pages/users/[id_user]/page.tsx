"use client";

import React, { FC, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EditUserModal from '@/app/logged/logged_components/modals/EditUserModal';
import UserService from '@/app/service/UserSerivce.js';
import { useUsers, type User } from '../hooks/useUsers';

interface UserDetail {
  id_user: string;
  user_full_name: string;
  user_name: string;
  user_surnames?: string;
  user_role: string;
  user_description: string;
  user_main_image_src?: string;
  user_current_company?: { id_company?: string; userPosition?: string } | null;
  experience_array?: unknown[];
  preferences?: unknown;
  enabled?: boolean;
}

const UserDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id_user;
  const id_user = Array.isArray(idParam) ? idParam[0] : (idParam as string) || '';

  const { updateUser } = useUsers();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!id_user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await UserService.getUserById(decodeURIComponent(id_user));
        setUser(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar usuario');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id_user]);

  const handleEditClick = () => {
    if (!user) return;
    const modalUser: User = {
      id_user: user.id_user,
      user_full_name: user.user_full_name,
      user_name: user.user_name,
      user_role: user.user_role as User['user_role'],
      user_description: user.user_description,
      enabled: user.enabled,
    };
    setEditingUser(modalUser);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedUser: User) => {
    if (!editingUser) return;
    setSaveError(null);
    try {
      await updateUser(editingUser, {
        user_full_name: updatedUser.user_full_name,
        user_name: updatedUser.user_name,
        user_role: updatedUser.user_role,
      });
      setIsModalOpen(false);
      setEditingUser(null);
      setUser(prev => prev ? { ...prev, ...updatedUser } : null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setSaveError(null);
  };

  if (loading) {
    return (
      <main className="flex w-full h-full min-h-screen flex-col items-center justify-center bg-white px-6 py-10 text-gray-600">
        <p className="text-lg">Cargando usuario...</p>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex w-full h-full min-h-screen flex-col items-center justify-center bg-white px-6 py-10 text-gray-600">
        <p className="text-red-500 text-lg">{error || 'Usuario no encontrado'}</p>
        <button
          onClick={() => router.push('/logged/pages/users')}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
        >
          Volver a Usuarios
        </button>
      </main>
    );
  }

  const company = user.user_current_company;
  const companyStr = company
    ? [company.id_company, company.userPosition].filter(Boolean).join(' · ')
    : '-';

  return (
    <main className="flex flex-col w-full min-h-screen bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Detalle del usuario</p>
      </div>
      <div className="flex flex-col flex-1 w-full px-6 py-6 text-gray-600">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/logged/pages/users')}
            className="px-4 py-2 text-blue-950 hover:text-blue-800 font-medium"
          >
            ← Volver a Usuarios
          </button>
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-950/90"
          >
            Editar
          </button>
        </div>

        <div className="flex flex-col w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          {user.user_main_image_src && (
            <div className="mb-6">
              <img
                src={user.user_main_image_src}
                alt={user.user_full_name}
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">ID Usuario</label>
              <p className="text-lg text-gray-900 font-mono">{user.id_user}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre completo</label>
              <p className="text-lg text-gray-900">{user.user_full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre</label>
              <p className="text-lg text-gray-900">{user.user_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Apellidos</label>
              <p className="text-lg text-gray-900">{user.user_surnames ?? '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Rol</label>
              <p className="text-lg text-gray-900">{user.user_role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Descripción</label>
              <p className="text-base text-gray-900">{user.user_description || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Empresa actual</label>
              <p className="text-base text-gray-900">{companyStr}</p>
            </div>
          </div>

          {user.experience_array && Array.isArray(user.experience_array) && user.experience_array.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500">Experiencia</label>
              <pre className="mt-2 text-sm text-gray-900 bg-gray-50 p-4 rounded overflow-x-auto">
                {JSON.stringify(user.experience_array, null, 2)}
              </pre>
            </div>
          )}

          {user.preferences != null && user.preferences !== undefined && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500">Preferencias</label>
              <pre className="mt-2 text-sm text-gray-900 bg-gray-50 p-4 rounded overflow-x-auto">
                {JSON.stringify(user.preferences, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          isOpen={isModalOpen}
          initialUser={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
          saveError={saveError}
        />
      )}
    </main>
  );
};

export default UserDetailPage;
