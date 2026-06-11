import { supabase } from './supabase';
import type { AISummary, CooldownStatus, NutritionSummary } from '../types/nutrition';

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  return base || 'http://localhost:8000';
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string; message?: string };
      message = body.detail ?? body.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function postNutritionSummary(
  exercises: { name: string; durationMinutes: number }[],
  foods: { name: string; quantity: number }[],
): Promise<NutritionSummary> {
  const res = await fetch(`${getApiBaseUrl()}/api/nutrition/summary`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ exercises, foods }),
  });
  return handleResponse<NutritionSummary>(res);
}

export async function postAiRecommendations(
  resumo: NutritionSummary,
  userGoals: string,
): Promise<AISummary> {
  const res = await fetch(`${getApiBaseUrl()}/api/ai/recommendations`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ resumo, userGoals }),
  });
  return handleResponse<AISummary>(res);
}

export async function getAiCooldown(): Promise<CooldownStatus> {
  const res = await fetch(`${getApiBaseUrl()}/api/ai/cooldown`, {
    headers: await authHeaders(),
  });
  return handleResponse<CooldownStatus>(res);
}
