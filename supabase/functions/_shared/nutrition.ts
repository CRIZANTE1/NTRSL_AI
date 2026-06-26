import caloriasData from './data/calorias.json' with { type: 'json' };
import exerciciosData from './data/exercicios.json' with { type: 'json' };

interface FoodPer100g {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
}

interface FoodInfo {
  calorias: number;
  proteína: number;
  carboidratos: number;
  gordura: number;
}

export interface FoodInput {
  name: string;
  quantity: number;
  localKey?: string | null;
  per100g?: FoodPer100g;
}

export interface ExerciseInput {
  name: string;
  durationMinutes: number;
  localKey?: string | null;
  caloriasPorMinuto?: number;
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

type CaloriasJson = { nutritional_info: Record<string, FoodInfo> };
type ExerciciosJson = { physical_activity_info: Record<string, { calorias_queimadas_por_minuto: number }> };

const calorias = (caloriasData as CaloriasJson).nutritional_info;
const exercicios = (exerciciosData as ExerciciosJson).physical_activity_info;

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function scalePer100g(
  alimento: string,
  quantidade: number,
  per100g: FoodPer100g,
): { calorias: number; proteina: number; carboidratos: number; gordura: number } {
  let qty = quantidade;
  if (alimento.toLowerCase() === 'água') {
    qty = quantidade * 1000;
  }
  const factor = qty / 100;
  return {
    calorias: per100g.calorias * factor,
    proteina: per100g.proteina * factor,
    carboidratos: per100g.carboidratos * factor,
    gordura: per100g.gordura * factor,
  };
}

function calcularNutricao(alimento: string, quantidade: number) {
  const info = calorias[alimento] ?? { calorias: 0, proteína: 0, carboidratos: 0, gordura: 0 };
  return scalePer100g(alimento, quantidade, {
    calorias: info.calorias,
    proteina: info.proteína,
    carboidratos: info.carboidratos,
    gordura: info.gordura,
  });
}

function calcularNutricaoFromEntry(food: FoodInput) {
  if (food.per100g) {
    return scalePer100g(food.name, food.quantity, food.per100g);
  }
  return calcularNutricao(food.localKey ?? food.name, food.quantity);
}

function calcularCaloriasExercicio(
  exercicio: string,
  duracao: number,
  caloriasPorMinutoOverride?: number,
): number {
  const caloriasPorMinuto =
    caloriasPorMinutoOverride ??
    exercicios[exercicio]?.calorias_queimadas_por_minuto ??
    0;
  return caloriasPorMinuto * duracao;
}

export function buildSummaryFromEntries(
  exercises: ExerciseInput[],
  foods: FoodInput[],
): NutritionSummary {
  let gastas = 0;
  let duracao = 0;
  const exercicioNomes: string[] = [];

  for (const ex of exercises) {
    gastas += calcularCaloriasExercicio(
      ex.localKey ?? ex.name,
      ex.durationMinutes,
      ex.caloriasPorMinuto,
    );
    duracao += ex.durationMinutes;
    exercicioNomes.push(`${ex.name} (${ex.durationMinutes} min)`);
  }

  let consumidas = 0;
  let proteina = 0;
  let carboidratos = 0;
  let gordura = 0;
  const alimentoNomes: string[] = [];

  for (const food of foods) {
    const macros = calcularNutricaoFromEntry(food);
    consumidas += macros.calorias;
    proteina += macros.proteina;
    carboidratos += macros.carboidratos;
    gordura += macros.gordura;
    const unit = food.name.toLowerCase() === 'água' ? 'L' : 'g';
    alimentoNomes.push(`${food.name} (${food.quantity} ${unit})`);
  }

  return {
    gastas: round(gastas),
    consumidas: round(consumidas),
    exercicios: exercicioNomes,
    duracao,
    alimentos: alimentoNomes,
    proteina: round(proteina),
    carboidratos: round(carboidratos),
    gordura: round(gordura),
  };
}

function hasLocalFoodData(food: FoodInput): boolean {
  if (food.per100g && food.per100g.calorias + food.per100g.proteina > 0) return true;
  const key = food.localKey ?? food.name;
  return key in calorias;
}

function hasLocalExerciseData(exercise: ExerciseInput): boolean {
  if (exercise.caloriasPorMinuto && exercise.caloriasPorMinuto > 0) return true;
  const key = exercise.localKey ?? exercise.name;
  return key in exercicios;
}

export function needsAiRefinement(exercises: ExerciseInput[], foods: FoodInput[]): boolean {
  return (
    foods.some((f) => !hasLocalFoodData(f)) ||
    exercises.some((e) => !hasLocalExerciseData(e))
  );
}

function pickMetric(localVal: number, aiVal: number): number {
  if (localVal > 0 && (aiVal <= 0 || aiVal < localVal * 0.5)) return localVal;
  if (localVal <= 0 && aiVal > 0) return aiVal;
  if (localVal > 0 && aiVal > 0) return aiVal;
  return localVal;
}

export function mergeNutritionSummary(
  local: NutritionSummary,
  ai: NutritionSummary,
): NutritionSummary {
  return {
    gastas: pickMetric(local.gastas, ai.gastas),
    consumidas: pickMetric(local.consumidas, ai.consumidas),
    proteina: pickMetric(local.proteina, ai.proteina),
    carboidratos: pickMetric(local.carboidratos, ai.carboidratos),
    gordura: pickMetric(local.gordura, ai.gordura),
    duracao: ai.duracao > 0 ? ai.duracao : local.duracao,
    exercicios: ai.exercicios.length > 0 ? ai.exercicios : local.exercicios,
    alimentos: ai.alimentos.length > 0 ? ai.alimentos : local.alimentos,
  };
}
