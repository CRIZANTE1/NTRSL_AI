import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildSummary } from '../lib/nutrition';
import {
  fetchDailyLog,
  localLogDate,
  parseDailyLogRow,
  saveDailyLog,
} from '../lib/data/dailyLogs';
import type { ExerciseEntry, FoodEntry, NutritionSummary } from '../types/nutrition';

export const dailyLogKey = (userId: string | undefined, logDate: string) =>
  ['dailyLog', userId, logDate] as const;

export function useDailyLog(userId: string | undefined, logDate = localLogDate()) {
  return useQuery({
    queryKey: dailyLogKey(userId, logDate),
    queryFn: async () => {
      if (!userId) return null;
      const row = await fetchDailyLog(userId, logDate);
      if (!row) return null;
      return parseDailyLogRow(row);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export interface SaveDailyLogParams {
  userId: string;
  logDate: string;
  exercises: ExerciseEntry[];
  foods: FoodEntry[];
  summary?: NutritionSummary | null;
}

export function useSaveDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveDailyLogParams) => {
      const summary = params.summary ?? buildSummary(params.exercises, params.foods);
      const result = await saveDailyLog({ ...params, summary });
      return { ...result, summary };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: dailyLogKey(variables.userId, variables.logDate),
      });
      void queryClient.invalidateQueries({
        queryKey: ['dailyLogHistory', variables.userId],
      });
    },
  });
}
