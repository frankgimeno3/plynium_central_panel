"use client";

import React, { FC, useState } from 'react';
import EditUserModal from '@/app/logged/logged_components/modals/EditUserModal';
import { useUsers, type User } from './hooks/useUsers';

interface UsersProps {}

const Users: FC<UsersProps> = () => {
  const { users, loading, error, refetch, updateUser } = useUsers();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
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
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setSaveError(null);
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Users</p>
      </div>

      <div className="flex flex-col p-12">
        <p className="text-2xl font-bold">My user</p>
        <p>Tu name, email, role y descripcion de tu role</p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-red-700">
            {error}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-gray-500">Cargando usuarios...</p>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    id_usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Nombre completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id_user} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                      {user.id_user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                      {user.user_full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                      {user.user_role}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                      {user.user_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-b border-gray-200">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
};

export default Users;
