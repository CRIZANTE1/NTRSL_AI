import { callEdgeFunction } from './edgeFunctions';
import type {
  AISummary,
  CooldownStatus,
  ExerciseSearchResponse,
  FoodSearchResponse,
  NutritionSummary,
} from '../types/nutrition';

export async function postNutritionSummary(
  exercises: { name: string; durationMinutes: number }[],
  foods: { name: string; quantity: number }[],
): Promise<NutritionSummary> {
  return callEdgeFunction<NutritionSummary>('nutrition-summary', {
    body: { exercises, foods },
  });
}

export async function postAiRecommendations(
  resumo: NutritionSummary,
  userGoals: string,
): Promise<AISummary> {
  return callEdgeFunction<AISummary>('ai-recommendations', {
    body: { resumo, userGoals },
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
