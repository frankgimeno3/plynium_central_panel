"use client";

import React, { FC, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import EditUserModal from '@/app/logged/logged_components/modals/EditUserModal';
import UserService from '@/app/service/UserSerivce.js';
import { useUsers, type User } from '../hooks/useUsers';
import { ContactService } from '@/app/service/ContactService';

interface UserDetail {
  id_user: string;
  user_full_name: string;
  user_name: string;
  user_surnames?: string;
  user_role: string;
  user_description: string;
  user_main_image_src?: string;
  linkedin_profile?: string | null;
  preferences?: unknown;
  enabled?: boolean;
}

type ContactFromJson = { id_contact: string; name: string; id_user?: string };

const UserDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id_user;
  const id_user = Array.isArray(idParam) ? idParam[0] : (idParam as string) || '';

  const { updateUser } = useUsers();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [contactsData, setContactsData] = useState<ContactFromJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    ContactService.getAllContacts()
      .then((l) => setContactsData(Array.isArray(l) ? l as ContactFromJson[] : []))
      .catch(() => setContactsData([]));
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!id_user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await UserService.getUserById(decodeURIComponent(id_user));
        setUser(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id_user]);

  useEffect(() => {
    if (user) {
      setPageMeta({
        pageTitle: "Detalle del usuario",
        breadcrumbs: [
          { label: "Users", href: "/logged/pages/network/users" },
          { label: user.user_full_name ?? user.id_user },
        ],
        buttons: [{ label: "Back to Users", href: "/logged/pages/network/users" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Detalle del usuario",
        breadcrumbs: [{ label: "Users", href: "/logged/pages/network/users" }],
        buttons: [{ label: "Back to Users", href: "/logged/pages/network/users" }],
      });
    }
  }, [setPageMeta, user]);

  const linkedContact = useMemo(() => {
    if (!user) return null;
    const list = Array.isArray(contactsData) ? contactsData : [];
    return list.find((c) => c.id_user === user.id_user) ?? null;
  }, [user, contactsData]);

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
      setSaveError(e instanceof Error ? e.message : 'Error saving');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setSaveError(null);
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-600">
              <p className="text-lg">Cargando usuario...</p>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (error || !user) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-600">
              <p className="text-red-500 text-lg">{error || 'Usuario no encontrado'}</p>
              <button
                onClick={() => router.push('/logged/pages/network/users')}
                className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-gray-600">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-950/90"
          >
            Editar
          </button>
        </div>
        <div className="flex flex-col w-full">
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
              <label className="text-sm font-medium text-gray-500">Full name</label>
              <p className="text-lg text-gray-900">{user.user_full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
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
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-base text-gray-900">{user.user_description || '-'}</p>
            </div>
            {user.linkedin_profile && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Link to LinkedIn profile</label>
                <p className="text-base text-gray-900 mt-0.5">
                  <a
                    href={user.linkedin_profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {user.linkedin_profile}
                  </a>
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Plynium user profile vinculation</h2>
            {linkedContact ? (
              <>
                <p className="text-sm text-gray-600 mb-2">This user is linked to the following contact:</p>
                <Link
                  href={`/logged/pages/account-management/contacts_db/${encodeURIComponent(linkedContact.id_contact)}`}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-medium"
                >
                  {linkedContact.name} (Contact)
                  <span className="text-gray-400">→</span>
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-500">No contact linked to this Plynium user.</p>
            )}
          </div>

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
          </div>
        </div>
      </PageContentSection>

      {editingUser && (
        <EditUserModal
          isOpen={isModalOpen}
          initialUser={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
          saveError={saveError}
        />
      )}
    </>
  );
};

export default UserDetailPage;
