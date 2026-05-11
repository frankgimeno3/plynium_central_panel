export interface User {
  id_user: string;
  user_full_name: string;
  user_name: string;
  user_role: string;
  user_description: string;
}

export interface EditUserModalProps {
  isOpen: boolean;
  initialUser: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
  saveError?: string | null;
}
