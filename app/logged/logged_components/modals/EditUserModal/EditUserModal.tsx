"use client";

import React, { FC, useEffect, useState } from "react";
import { EditUserFormFields } from "./modal_edit_user_components/EditUserFormFields";
import { EditUserModalFooter } from "./modal_edit_user_components/EditUserModalFooter";
import type { EditUserModalProps } from "./modal_edit_user_components/types";
import { buildUpdatedUserFromForm } from "./modal_edit_user_components/user_role_helpers";

export type { EditUserModalProps, User } from "./modal_edit_user_components/types";

const EditUserModal: FC<EditUserModalProps> = ({
  isOpen,
  initialUser,
  onSave,
  onCancel,
  saveError,
}) => {
  const [userFullName, setUserFullName] = useState<string>(initialUser.user_full_name);
  const [userName, setUserName] = useState<string>(initialUser.user_name);
  const [userRole, setUserRole] = useState<string>(initialUser.user_role);

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
        const hasChanged =
          userFullName !== initialUser.user_full_name ||
          userName !== initialUser.user_name ||
          userRole !== initialUser.user_role;
        if (hasChanged) {
          event.preventDefault();
          onSave(buildUpdatedUserFromForm(initialUser, userFullName, userName, userRole));
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
    if (!hasChanged) return;
    onSave(buildUpdatedUserFromForm(initialUser, userFullName, userName, userRole));
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
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onCancel}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">Edit user</h2>

        <EditUserFormFields
          saveError={saveError}
          userFullName={userFullName}
          userName={userName}
          userRole={userRole}
          onChangeFullName={setUserFullName}
          onChangeUsername={setUserName}
          onChangeRole={setUserRole}
        />

        <EditUserModalFooter hasChanged={hasChanged} onCancel={onCancel} onSave={handleSaveClick} />
      </div>
    </div>
  );
};

export default EditUserModal;
