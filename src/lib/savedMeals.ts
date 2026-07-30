import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type SavedMealRow = Database['public']['Tables']['saved_meals']['Row'];

const MAX_SAVED_MEALS = 20;

export function mealLabel(text: string, max = 30): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export async function fetchSavedMeals(userId: string): Promise<SavedMealRow[]> {
  const { data, error } = await supabase
    .from('saved_meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_SAVED_MEALS);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSavedMeal(userId: string, text: string): Promise<SavedMealRow> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Texto da refeição não pode ser vazio.');

  const { data, error } = await supabase
    .from('saved_meals')
    .insert({ user_id: userId, text: trimmed })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSavedMeal(id: string): Promise<void> {
  const { error } = await supabase.from('saved_meals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
