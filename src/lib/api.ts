import { callEdgeFunction } from './edgeFunctions';
import type { AISummary, CooldownStatus, NutritionSummary } from '../types/nutrition';

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
