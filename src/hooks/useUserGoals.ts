import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DEFAULT_USER_GOALS, type UserGoals } from '../types/profile';

export const userGoalsKey = (userId: string | undefined) => ['userGoals', userId] as const;

function rowToGoals(row: {
  goal_kcal: number | null;
  goal_proteina: number | null;
  goal_carbs: number | null;
} | null): UserGoals {
  if (!row) return DEFAULT_USER_GOALS;
  return {
    kcal: row.goal_kcal ?? DEFAULT_USER_GOALS.kcal,
    proteina: row.goal_proteina ?? DEFAULT_USER_GOALS.proteina,
    carbs: row.goal_carbs ?? DEFAULT_USER_GOALS.carbs,
  };
}

export function useUserGoals() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: userGoalsKey(userId),
    queryFn: async (): Promise<UserGoals> => {
      if (!userId) return DEFAULT_USER_GOALS;
      const { data, error } = await supabase
        .from('profiles')
        .select('goal_kcal, goal_proteina, goal_carbs')
        .eq('id', userId)
        .single();
      if (error) throw new Error(error.message);
      return rowToGoals(data);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: async (goals: UserGoals) => {
      if (!userId) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('profiles')
        .update({
          goal_kcal: goals.kcal,
          goal_proteina: goals.proteina,
          goal_carbs: goals.carbs,
        })
        .eq('id', userId);
      if (error) throw new Error(error.message);
      return goals;
    },
    onSuccess: (goals) => {
      queryClient.setQueryData(userGoalsKey(userId), goals);
    },
  });

  return {
    goals: query.data ?? DEFAULT_USER_GOALS,
    isLoading: query.isLoading,
    updateGoals: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
