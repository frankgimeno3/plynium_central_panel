"use client";

import React, { FC, useEffect, useState } from "react";

interface User {
  id_user: string;
  user_full_name: string;
  user_name: string;
  user_role: "only articles" | "articles and publications" | "admin";
  user_description: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  initialUser: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

const EditUserModal: FC<EditUserModalProps> = ({
  isOpen,
  initialUser,
  onSave,
  onCancel,
}) => {
  const [userFullName, setUserFullName] = useState<string>(initialUser.user_full_name);
  const [userName, setUserName] = useState<string>(initialUser.user_name);
  const [userRole, setUserRole] = useState<"only articles" | "articles and publications" | "admin">(initialUser.user_role);

  useEffect(() => {
    if (isOpen) {
      setUserFullName(initialUser.user_full_name);
      setUserName(initialUser.user_name);
      setUserRole(initialUser.user_role);
    }
  }, [initialUser, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Enter") {
        // Enter guarda si hay cambios
        const hasChanged = 
          userFullName !== initialUser.user_full_name ||
          userName !== initialUser.user_name ||
          userRole !== initialUser.user_role;
        if (hasChanged) {
          event.preventDefault();
          const roleDescriptions = {
            "only articles": "Acceso a la edición y creación de artículos",
            "articles and publications": "Acceso a la edición y creación de artículos y publicaciones",
            "admin": "lo anterior más edición de roles"
          };
          const updatedUser: User = {
            ...initialUser,
            user_full_name: userFullName,
            user_name: userName,
            user_role: userRole,
            user_description: roleDescriptions[userRole]
          };
          onSave(updatedUser);
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel, userFullName, userName, userRole, initialUser, onSave]);

  if (!isOpen) {
    return null;
  }

  const hasChanged = 
    userFullName !== initialUser.user_full_name ||
    userName !== initialUser.user_name ||
    userRole !== initialUser.user_role;

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleSaveClick = () => {
    if (!hasChanged) {
      return;
    }

    const roleDescriptions = {
      "only articles": "Acceso a la edición y creación de artículos",
      "articles and publications": "Acceso a la edición y creación de artículos y publicaciones",
      "admin": "lo anterior más edición de roles"
    };

    const updatedUser: User = {
      ...initialUser,
      user_full_name: userFullName,
      user_name: userName,
      user_role: userRole,
      user_description: roleDescriptions[userRole]
    };

    onSave(updatedUser);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={handleModalClick}
      >
        {/* Botón de cerrar (X) */}
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onCancel}
          aria-label="Cerrar modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Editar Usuario
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={userFullName}
              onChange={(event) => setUserFullName(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nombre de usuario
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={userRole}
              onChange={(event) => setUserRole(event.target.value as "only articles" | "articles and publications" | "admin")}
            >
              <option value="only articles">only articles</option>
              <option value="articles and publications">articles and publications</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!hasChanged}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white
              ${
                hasChanged
                  ? "cursor-pointer bg-blue-600 hover:bg-blue-700"
                  : "cursor-not-allowed bg-blue-300"
              }`}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;





