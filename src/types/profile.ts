export type AppRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: AppRole;
  created_at?: string | null;
}

export function isAdminRole(role: AppRole | null | undefined): boolean {
  return role === 'admin';
}
