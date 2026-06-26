import type {
  DiaryEntry,
  ExerciseEntry,
  FoodEntry,
  NutritionSummary,
} from '../types/nutrition';
import {
  calcularCaloriasExercicioFromEntry,
  calcularNutricaoFromEntry,
} from './nutrition';

export function buildSummaryFromDiary(entries: DiaryEntry[]): NutritionSummary {
  const settled = entries.filter((e) => e.status !== 'calculating');
  const foodEntries = settled.filter((e) => e.type !== 'exercise');
  const exerciseEntries = settled.filter((e) => e.type === 'exercise');

  return {
    gastas: exerciseEntries.reduce((s, e) => s + (e.kcal ?? 0), 0),
    consumidas: foodEntries.reduce((s, e) => s + (e.kcal ?? 0), 0),
    proteina: foodEntries.reduce((s, e) => s + (e.protein ?? 0), 0),
    carboidratos: foodEntries.reduce((s, e) => s + (e.carbs ?? 0), 0),
    gordura: foodEntries.reduce((s, e) => s + (e.fat ?? 0), 0),
    duracao: exerciseEntries.length,
    exercicios: exerciseEntries.map((e) => e.rawText),
    alimentos: foodEntries.map((e) => e.rawText),
  };
}

export function diaryEntriesToPersistence(entries: DiaryEntry[]): {
  foods: FoodEntry[];
  exercises: ExerciseEntry[];
} {
  const foods: FoodEntry[] = [];
  const exercises: ExerciseEntry[] = [];

  for (const entry of entries) {
    if (entry.type === 'exercise') {
      exercises.push({
        name: entry.rawText,
        durationMinutes: 1,
        localKey: entry.id,
        caloriasPorMinuto: entry.kcal ?? 0,
      });
    } else {
      foods.push({
        name: entry.rawText,
        quantity: 100,
        localKey: entry.id,
        per100g: {
          calorias: entry.kcal ?? 0,
          proteina: entry.protein ?? 0,
          carboidratos: entry.carbs ?? 0,
          gordura: entry.fat ?? 0,
        },
      });
    }
  }

  return { foods, exercises };
}

export function parseDiaryFromStoredEntries(
  foods: FoodEntry[],
  exercises: ExerciseEntry[],
): DiaryEntry[] {
  const now = new Date().toISOString();

  const foodDiaryEntries: DiaryEntry[] = foods.map((f) => {
    const macros = calcularNutricaoFromEntry(f);
    return {
      id: f.localKey ?? f.name,
      rawText: f.name,
      type: 'food' as const,
      kcal: Math.round(macros.calorias),
      protein: macros.proteina,
      carbs: macros.carboidratos,
      fat: macros.gordura,
      status: 'idle' as const,
      isNew: false,
      createdAt: now,
    };
  });

  const exerciseDiaryEntries: DiaryEntry[] = exercises.map((e) => ({
    id: e.localKey ?? e.name,
    rawText: e.name,
    type: 'exercise' as const,
    kcal: Math.round(calcularCaloriasExercicioFromEntry(e)),
    status: 'idle' as const,
    isNew: false,
    createdAt: now,
  }));

  return [...foodDiaryEntries, ...exerciseDiaryEntries];
}
