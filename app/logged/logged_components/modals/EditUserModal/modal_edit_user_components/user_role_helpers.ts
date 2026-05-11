import type { User } from "./types";

const KNOWN_ROLE_DESCRIPTIONS: Record<string, string> = {
  "only articles": "Access to edit and create articles",
  "articles and publications": "Access to edit and create articles and publications",
  admin: "All of the above plus role editing",
};

export function descriptionForSavedRole(role: string, fallbackDescription: string): string {
  const preset = KNOWN_ROLE_DESCRIPTIONS[role];
  return preset !== undefined ? preset : fallbackDescription;
}

export function buildUpdatedUserFromForm(
  initialUser: User,
  userFullName: string,
  userName: string,
  userRole: string
): User {
  return {
    ...initialUser,
    user_full_name: userFullName,
    user_name: userName,
    user_role: userRole,
    user_description: descriptionForSavedRole(userRole, initialUser.user_description),
  };
}
