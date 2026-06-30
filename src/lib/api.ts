import { callEdgeFunction } from './edgeFunctions';
import type {
  AISummary,
  CooldownStatus,
  ExerciseEntry,
  ExerciseSearchResponse,
  FoodEntry,
  FoodSearchResponse,
  NutritionSummary,
} from '../types/nutrition';
import type { UserGoals } from '../types/profile';
import type { WeeklyCoachContext } from './coachContext';

export interface AiRecommendationsParams {
  resumo: NutritionSummary;
  userGoals: string;
  logDate: string;
  weeklyContext: WeeklyCoachContext;
  profileGoals: UserGoals;
}

export async function postNutritionSummary(
  exercises: ExerciseEntry[],
  foods: FoodEntry[],
): Promise<NutritionSummary> {
  return callEdgeFunction<NutritionSummary>('nutrition-summary', {
    body: { exercises, foods },
  });
}

export async function postAiRecommendations(params: AiRecommendationsParams): Promise<AISummary> {
  return callEdgeFunction<AISummary>('ai-recommendations', {
    body: params,
  });
}

export async function getAiCooldown(): Promise<CooldownStatus> {
  return callEdgeFunction<CooldownStatus>('ai-cooldown', { method: 'GET' });
}

export async function postFoodSearch(query: string, limit = 12): Promise<FoodSearchResponse> {
  return callEdgeFunction<FoodSearchResponse>('food-search', {
    body: { query, limit },
  });
}

export async function postExerciseSearch(
  query: string,
  limit = 12,
): Promise<ExerciseSearchResponse> {
  return callEdgeFunction<ExerciseSearchResponse>('exercise-search', {
    body: { query, limit },
  });
}

export async function postDecipherFoodImage(
  imageBase64: string,
  mimeType: string,
): Promise<{ identified: boolean; description: string }> {
  return callEdgeFunction<{ identified: boolean; description: string }>('decipher-food-image', {
    body: { imageBase64, mimeType },
  });
}
