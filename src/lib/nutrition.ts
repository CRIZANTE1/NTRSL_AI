import caloriasData from '../data/calorias.json';
import exerciciosData from '../data/exercicios.json';
import type {
  ExerciseEntry,
  FoodEntry,
  FoodInfo,
  MacroTotals,
  NutritionSummary,
} from '../types/nutrition';

type CaloriasJson = {
  nutritional_info: Record<string, FoodInfo>;
};

type ExerciciosJson = {
  physical_activity_info: Record<string, { calorias_queimadas_por_minuto: number }>;
};

const calorias = (caloriasData as CaloriasJson).nutritional_info;
const exercicios = (exerciciosData as ExerciciosJson).physical_activity_info;

export function getFoodNames(): string[] {
  return Object.keys(calorias).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function getExerciseNames(): string[] {
  return Object.keys(exercicios).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function calcularCaloriasExercicio(
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

export function calcularCaloriasExercicioFromEntry(exercise: ExerciseEntry): number {
  return calcularCaloriasExercicio(
    exercise.localKey ?? exercise.name,
    exercise.durationMinutes,
    exercise.caloriasPorMinuto,
  );
}

function scalePer100g(
  alimento: string,
  quantidade: number,
  per100g: { calorias: number; proteina: number; carboidratos: number; gordura: number },
): MacroTotals {
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

export function calcularNutricao(alimento: string, quantidade: number): MacroTotals {
  const info = calorias[alimento] ?? {
    calorias: 0,
    proteína: 0,
    carboidratos: 0,
    gordura: 0,
  };

  return scalePer100g(alimento, quantidade, {
    calorias: info.calorias,
    proteina: info.proteína,
    carboidratos: info.carboidratos,
    gordura: info.gordura,
  });
}

export function calcularNutricaoFromEntry(food: FoodEntry): MacroTotals {
  if (food.per100g) {
    return scalePer100g(food.name, food.quantity, food.per100g);
  }
  return calcularNutricao(food.localKey ?? food.name, food.quantity);
}

export function buildSummary(
  exercises: ExerciseEntry[],
  foods: FoodEntry[],
): NutritionSummary {
  let gastas = 0;
  let duracao = 0;
  const exercicioNomes: string[] = [];

  for (const ex of exercises) {
    gastas += calcularCaloriasExercicioFromEntry(ex);
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

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
