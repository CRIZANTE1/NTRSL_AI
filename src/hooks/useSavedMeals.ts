import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSavedMeal,
  deleteSavedMeal,
  fetchSavedMeals,
} from '../lib/savedMeals';

export const savedMealsKey = (userId: string | undefined) =>
  ['saved_meals', userId] as const;

export function useSavedMeals(userId: string | undefined) {
  return useQuery({
    queryKey: savedMealsKey(userId),
    queryFn: async () => {
      if (!userId) return [];
      return fetchSavedMeals(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, text }: { userId: string; text: string }) =>
      createSavedMeal(userId, text),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: savedMealsKey(variables.userId),
      });
    },
  });
}

export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; userId: string }) => deleteSavedMeal(id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: savedMealsKey(variables.userId),
      });
    },
  });
}
