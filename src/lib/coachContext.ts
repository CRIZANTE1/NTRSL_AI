import { localLogDate, parseDailyLogRow, parseLogDateString } from './data/dailyLogs';
import type { ExerciseEntry, FoodEntry, NutritionSummary } from '../types/nutrition';
import type { Database } from '../types/supabase';

type DailyLogRow = Database['public']['Tables']['daily_logs']['Row'];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface WeeklyCoachDay {
  logDate: string;
  dayLabel: string;
  hasLog: boolean;
  consumidas: number;
  gastas: number;
  proteina: number;
  duracaoMin: number;
  aguaLitros: number;
  alimentos: string[];
  exercicios: string[];
}

export interface WeeklyCoachTotals {
  diasComRegistro: number;
  mediaConsumidas: number;
  mediaGastas: number;
  totalMinutosExercicio: number;
  totalAguaLitros: number;
}

export interface WeeklyCoachContext {
  anchorDate: string;
  days: WeeklyCoachDay[];
  totals: WeeklyCoachTotals;
}

function buildLast7DayKeys(anchor: Date): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    days.push(localLogDate(d));
  }
  return days;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function waterLitersFromFoods(foods: FoodEntry[]): number {
  return foods
    .filter((f) => {
      const name = f.name.toLowerCase();
      return name.includes('água') || name.includes('agua');
    })
    .reduce((sum, f) => sum + f.quantity, 0);
}

function dayFromRow(logDate: string, row: DailyLogRow | undefined): WeeklyCoachDay {
  const dayLabel = DAY_LABELS[parseLogDateString(logDate).getDay()];

  if (!row?.summary) {
    return {
      logDate,
      dayLabel,
      hasLog: false,
      consumidas: 0,
      gastas: 0,
      proteina: 0,
      duracaoMin: 0,
      aguaLitros: 0,
      alimentos: [],
      exercicios: [],
    };
  }

  const parsed = parseDailyLogRow(row);
  const s = parsed.summary!;

  return {
    logDate,
    dayLabel,
    hasLog: true,
    consumidas: s.consumidas,
    gastas: s.gastas,
    proteina: s.proteina,
    duracaoMin: s.duracao,
    aguaLitros: waterLitersFromFoods(parsed.foods),
    alimentos: s.alimentos,
    exercicios: s.exercicios,
  };
}

export function buildWeeklyCoachContext(
  rows: DailyLogRow[],
  anchorDate: Date = new Date(),
): WeeklyCoachContext {
  const byDate = new Map(rows.map((r) => [r.log_date, r]));
  const days = buildLast7DayKeys(anchorDate).map((logDate) => dayFromRow(logDate, byDate.get(logDate)));

  const logged = days.filter((d) => d.hasLog);
  const diasComRegistro = logged.length;

  return {
    anchorDate: localLogDate(anchorDate),
    days,
    totals: {
      diasComRegistro,
      mediaConsumidas: diasComRegistro
        ? round1(logged.reduce((s, d) => s + d.consumidas, 0) / diasComRegistro)
        : 0,
      mediaGastas: diasComRegistro
        ? round1(logged.reduce((s, d) => s + d.gastas, 0) / diasComRegistro)
        : 0,
      totalMinutosExercicio: logged.reduce((s, d) => s + d.duracaoMin, 0),
      totalAguaLitros: round1(logged.reduce((s, d) => s + d.aguaLitros, 0)),
    },
  };
}

/** Substitui o dia âncora pelos dados ao vivo (pickers ainda não salvos no histórico). */
export function applyLiveDayToWeeklyContext(
  context: WeeklyCoachContext,
  logDate: string,
  summary: NutritionSummary,
  foods: FoodEntry[],
  exercises: ExerciseEntry[],
): WeeklyCoachContext {
  const dayLabel = DAY_LABELS[parseLogDateString(logDate).getDay()];
  const liveDay: WeeklyCoachDay = {
    logDate,
    dayLabel,
    hasLog: true,
    consumidas: summary.consumidas,
    gastas: summary.gastas,
    proteina: summary.proteina,
    duracaoMin: summary.duracao,
    aguaLitros: waterLitersFromFoods(foods),
    alimentos: summary.alimentos,
    exercicios: summary.exercicios,
  };

  const days = context.days.map((d) => (d.logDate === logDate ? liveDay : d));
  const logged = days.filter((d) => d.hasLog);
  const diasComRegistro = logged.length;

  return {
    ...context,
    days,
    totals: {
      diasComRegistro,
      mediaConsumidas: diasComRegistro
        ? round1(logged.reduce((s, d) => s + d.consumidas, 0) / diasComRegistro)
        : 0,
      mediaGastas: diasComRegistro
        ? round1(logged.reduce((s, d) => s + d.gastas, 0) / diasComRegistro)
        : 0,
      totalMinutosExercicio: logged.reduce((s, d) => s + d.duracaoMin, 0),
      totalAguaLitros: round1(logged.reduce((s, d) => s + d.aguaLitros, 0)),
    },
  };
}
