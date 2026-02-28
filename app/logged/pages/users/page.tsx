"use client";

import React, { FC } from 'react';
import { useRouter } from 'next/navigation';
import { useUsers } from './hooks/useUsers';

interface UsersProps {}

const Users: FC<UsersProps> = () => {
  const router = useRouter();
  const { users, loading, error, refetch } = useUsers();

  const handleRowClick = (id_user: string) => {
    router.push(`/logged/pages/users/${encodeURIComponent(id_user)}`);
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id_user}
                    onClick={() => handleRowClick(user.id_user)}
                    className="hover:bg-gray-100 cursor-pointer transition-colors"
                  >
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
