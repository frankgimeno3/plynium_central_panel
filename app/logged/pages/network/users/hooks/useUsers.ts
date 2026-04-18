import { useState, useEffect, useCallback } from 'react';
import UserService from '@/app/service/UserSerivce.js';

export interface User {
  id?: string;
  id_user: string;
  user_full_name: string;
  user_name: string;
  user_role: string;
  user_description: string;
  enabled?: boolean;
  userListArray?: string[];
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await UserService.getAllUsers();
      const list = Array.isArray(data) ? (data as User[]) : [];
      setUsers(list);
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Error loading users';
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(async (
    user: User,
    updates: { user_full_name?: string; user_name?: string; user_role?: string; password?: string }
  ) => {
    try {
      await UserService.updateUser(
        user.user_name, // username (identifier in Cognito)
        updates.user_full_name ?? user.user_full_name,
        user.user_name, // email (Cognito username = email)
        updates.password,
        user.enabled
      );
      await fetchUsers();
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Error updating';
      throw new Error(message);
    }
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers, updateUser };
}
