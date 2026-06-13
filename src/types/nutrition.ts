export interface FoodInfo {
  calorias: number;
  proteína: number;
  carboidratos: number;
  gordura: number;
}

export interface ExerciseInfo {
  calorias_queimadas_por_minuto: number;
}

export interface FoodPer100g {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
}

export interface FoodEntry {
  name: string;
  quantity: number;
  foodCatalogId?: string | null;
  fdcId?: number | null;
  localKey?: string | null;
  source?: 'local' | 'fdc' | 'cache';
  per100g?: FoodPer100g;
}

export interface FoodSearchResult {
  id: string | null;
  name: string;
  nameEn: string | null;
  source: 'local' | 'fdc' | 'cache';
  fdcId: number | null;
  localKey: string | null;
  matchScore: number;
  per100g: FoodPer100g;
}

export interface FoodSearchResponse {
  results: FoodSearchResult[];
  meta: {
    query: string;
    translatedTerms: string[];
    fromLocal: number;
    fromCache: number;
    fromFdc: number;
  };
}

export interface ExerciseSearchResult {
  id: string | null;
  name: string;
  nameEn: string | null;
  source: 'local' | 'wger' | 'cache';
  wgerId: number | null;
  localKey: string | null;
  matchScore: number;
  caloriasPorMinuto: number;
  category: string | null;
}

export interface ExerciseSearchResponse {
  results: ExerciseSearchResult[];
  meta: {
    query: string;
    translatedTerms: string[];
    fromLocal: number;
    fromCache: number;
    fromWger: number;
  };
}

export interface ExerciseEntry {
  name: string;
  durationMinutes: number;
  exerciseCatalogId?: string | null;
  wgerId?: number | null;
  localKey?: string | null;
  source?: 'local' | 'wger' | 'cache';
  caloriasPorMinuto?: number;
}

export interface MacroTotals {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
}

export interface NutritionSummary {
  gastas: number;
  consumidas: number;
  exercicios: string[];
  duracao: number;
  alimentos: string[];
  proteina: number;
  carboidratos: number;
  gordura: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  exercises: ExerciseEntry[];
  foods: FoodEntry[];
  summary: NutritionSummary | null;
  created_at: string;
}

export interface AISummary {
  recommendation: string;
  elapsedSeconds?: number;
}

export interface CooldownStatus {
  remainingSeconds: number;
  allowed: boolean;
}
