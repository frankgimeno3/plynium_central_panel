"use client";

import React, { FC, useState } from 'react';
import userContents from '@/app/contents/userContents.json';
import EditUserModal from '@/app/logged/logged_components/modals/EditUserModal';

interface User {
  id_user: string;
  user_full_name: string;
  user_name: string;
  user_role: "only articles" | "articles and publications" | "admin";
  user_description: string;
}

interface UsersProps {
  
}

const Users: FC<UsersProps> = ({ }) => {
  const [users, setUsers] = useState<User[]>(userContents as User[]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSave = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id_user === updatedUser.id_user ? updatedUser : user
    ));
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Users</p>
      </div>

      <div className="flex flex-col p-12">
        <p className='text-2xl font-bold'>My user</p>
        <p>Tu name, email, role y descripcion de tu role</p>

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
      </div>

      {editingUser && (
        <EditUserModal
          isOpen={isModalOpen}
          initialUser={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default Users;