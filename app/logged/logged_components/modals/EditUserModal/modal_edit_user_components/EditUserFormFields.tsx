"use client";

import type { EditUserModalProps } from "./types";

type Props = Pick<EditUserModalProps, "saveError"> & {
  userFullName: string;
  userName: string;
  userRole: string;
  onChangeFullName: (v: string) => void;
  onChangeUsername: (v: string) => void;
  onChangeRole: (v: string) => void;
};

export function EditUserFormFields({
  saveError,
  userFullName,
  userName,
  userRole,
  onChangeFullName,
  onChangeUsername,
  onChangeRole,
}: Props) {
  return (
    <>
      {saveError && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{saveError}</p>
      )}
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={userFullName}
            onChange={(event) => onChangeFullName(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={userName}
            onChange={(event) => onChangeUsername(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={userRole}
            onChange={(event) => onChangeRole(event.target.value)}
          />
        </div>
      </div>
    </>
  );
}
