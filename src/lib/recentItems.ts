import type { ExerciseSearchResult, FoodSearchResult } from '../types/nutrition';

const FOODS_KEY = 'ntrsl_recent_foods_v1';
const EXERCISES_KEY = 'ntrsl_recent_exercises_v1';
const MAX_RECENT = 10;

function foodKey(r: Pick<FoodSearchResult, 'name' | 'fdcId' | 'localKey'>): string {
  return `${r.fdcId ?? ''}:${r.localKey ?? r.name}`;
}

function exerciseKey(r: Pick<ExerciseSearchResult, 'name' | 'wgerId' | 'localKey'>): string {
  return `${r.wgerId ?? ''}:${r.localKey ?? r.name}`;
}

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function getRecentFoods(): FoodSearchResult[] {
  return readJson<FoodSearchResult>(FOODS_KEY);
}

export function pushRecentFood(result: FoodSearchResult): void {
  const key = foodKey(result);
  const filtered = getRecentFoods().filter((r) => foodKey(r) !== key);
  writeJson(FOODS_KEY, [result, ...filtered].slice(0, MAX_RECENT));
}

export function getRecentExercises(): ExerciseSearchResult[] {
  return readJson<ExerciseSearchResult>(EXERCISES_KEY);
}

export function pushRecentExercise(result: ExerciseSearchResult): void {
  const key = exerciseKey(result);
  const filtered = getRecentExercises().filter((r) => exerciseKey(r) !== key);
  writeJson(EXERCISES_KEY, [result, ...filtered].slice(0, MAX_RECENT));
}

export function isUiCompact(): boolean {
  try {
    return localStorage.getItem('ntrsl_ui_compact') === '1';
  } catch {
    return false;
  }
}

export type SectionMode = 'ambos' | 'alimentos' | 'exercicios';

const SECTION_MODE_KEY = 'ntrsl_section_mode';

export function getSectionMode(): SectionMode {
  try {
    const v = localStorage.getItem(SECTION_MODE_KEY);
    if (v === 'alimentos' || v === 'exercicios' || v === 'ambos') return v;
  } catch {
    // ignore
  }
  return 'ambos';
}

export function setSectionMode(mode: SectionMode): void {
  try {
    localStorage.setItem(SECTION_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

const COACH_GOALS_KEY = 'ntrsl_coach_goals';

export function getCoachGoals(): string {
  try {
    return localStorage.getItem(COACH_GOALS_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setCoachGoals(text: string): void {
  try {
    localStorage.setItem(COACH_GOALS_KEY, text);
  } catch {
    // ignore
  }
}

export function clearRecentItems(): void {
  try {
    localStorage.removeItem(FOODS_KEY);
    localStorage.removeItem(EXERCISES_KEY);
    localStorage.removeItem(SECTION_MODE_KEY);
    localStorage.removeItem(COACH_GOALS_KEY);
  } catch {
    // ignore
  }
}
