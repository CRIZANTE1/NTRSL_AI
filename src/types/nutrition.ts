export interface FoodInfo {
  calorias: number;
  proteína: number;
  carboidratos: number;
  gordura: number;
}

export interface ExerciseInfo {
  calorias_queimadas_por_minuto: number;
}

export interface FoodEntry {
  name: string;
  quantity: number;
}

export interface ExerciseEntry {
  name: string;
  durationMinutes: number;
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
