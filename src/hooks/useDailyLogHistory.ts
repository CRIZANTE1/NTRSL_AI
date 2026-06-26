import { useQuery } from '@tanstack/react-query';
import { fetchDailyLogHistory } from '../lib/data/dailyLogs';

export function useDailyLogHistory(userId: string | undefined, limit = 30) {
  return useQuery({
    queryKey: ['dailyLogHistory', userId],
    queryFn: async () => {
      if (!userId) return [];
      return fetchDailyLogHistory(userId, limit);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
