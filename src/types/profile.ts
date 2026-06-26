export type AppRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: AppRole;
  created_at?: string | null;
  goal_kcal?: number | null;
  goal_proteina?: number | null;
  goal_carbs?: number | null;
}

export interface UserGoals {
  kcal: number;
  proteina: number;
  carbs: number;
}

export const DEFAULT_USER_GOALS: UserGoals = {
  kcal: 2000,
  proteina: 50,
  carbs: 250,
};

export function isAdminRole(role: AppRole | null | undefined): boolean {
  return role === 'admin';
}
