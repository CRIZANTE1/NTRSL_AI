import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Dumbbell,
  Flame,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchDailyLogCount,
  fetchDailyLogHistory,
  fetchDailyLogsByRange,
  localLogDate,
  parseDailyLogRow,
} from '../lib/data/dailyLogs';
import { MacroChart } from '../components/MacroChart';
import { Skeleton } from '../components/ui/Skeleton';
import { colors } from '../theme/colors';
import type { Database } from '../types/supabase';
import type { NutritionSummary } from '../types/nutrition';

type DailyLogRow = Database['public']['Tables']['daily_logs']['Row'];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

function monthRangeFromYearMonth(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function formatLogDate(logDate: string): { weekday: string; dayMonth: string } {
  const [y, m, d] = logDate.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  return { weekday, dayMonth };
}

function computeStreak(rows: DailyLogRow[]): number {
  const withSummary = rows
    .filter((r) => r.summary != null)
    .map((r) => r.log_date)
    .sort()
    .reverse();

  const dateSet = new Set(withSummary);
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = localLogDate(cursor);
    if (!dateSet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function avgCalories(rows: DailyLogRow[]): number {
  const withSummary = rows
    .map((r) => parseDailyLogRow(r).summary)
    .filter((s): s is NutritionSummary => s !== null);
  if (withSummary.length === 0) return 0;
  return Math.round(withSummary.reduce((acc, s) => acc + s.consumidas, 0) / withSummary.length);
}

// ── Skeleton de carregamento ────────────────────────────────────────────────
function HistoricoSkeleton() {
  return (
    <div className="space-y-3 pt-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border p-4"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="h-3.5 w-24 rounded mb-2" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Card de um dia ──────────────────────────────────────────────────────────
function LogCard({ row }: { row: DailyLogRow }) {
  const [open, setOpen] = useState(false);
  const parsed = parseDailyLogRow(row);
  const summary = parsed.summary as NutritionSummary | null;
  const { weekday, dayMonth } = formatLogDate(row.log_date);

  const balance = summary ? summary.consumidas - summary.gastas : null;
  const balanceColor =
    balance === null
      ? colors.textMuted
      : balance > 0
        ? colors.accent
        : colors.points;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left"
      >
        {/* data */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
            style={{ background: colors.surfaceWarm }}
          >
            <span className="text-[9px] uppercase font-semibold leading-none" style={{ color: colors.textSecondary }}>
              {weekday}
            </span>
            <span className="text-sm font-bold leading-tight capitalize" style={{ color: colors.textPrimary }}>
              {dayMonth.split(' ')[0]}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold capitalize leading-tight" style={{ color: colors.textPrimary }}>
              {dayMonth}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {summary ? (
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {summary.consumidas} kcal consumidas
                </span>
              ) : (
                <span className="text-xs" style={{ color: colors.textMuted }}>
                  Sem resumo
                </span>
              )}
              {parsed.exercises.length > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: colors.surfaceWarm, color: colors.textSecondary }}
                >
                  <Dumbbell className="w-2.5 h-2.5" />
                  {parsed.exercises.length}
                </span>
              )}
              {parsed.foods.length > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: colors.surfaceWarm, color: colors.textSecondary }}
                >
                  <UtensilsCrossed className="w-2.5 h-2.5" />
                  {parsed.foods.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* balanço + toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {balance !== null && (
            <span
              className="text-xs font-bold tabular-nums px-2 py-1 rounded-full"
              style={{
                background: balance > 0
                  ? `${colors.accent}22`
                  : `${colors.points}22`,
                color: balanceColor,
              }}
            >
              {balance > 0 ? '+' : ''}{Math.round(balance)}
            </span>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4" style={{ color: colors.textMuted }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: colors.textMuted }} />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: colors.border }}>
          {/* resumo calórico */}
          {summary && (
            <div className="pt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Consumidas', value: `${summary.consumidas}`, unit: 'kcal', color: colors.accent },
                { label: 'Gastas', value: `${summary.gastas}`, unit: 'kcal', color: colors.points },
                {
                  label: 'Balanço',
                  value: `${balance! > 0 ? '+' : ''}${Math.round(balance!)}`,
                  unit: 'kcal',
                  color: balanceColor,
                },
              ].map(({ label, value, unit, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-2 text-center"
                  style={{ background: colors.surfaceWarm }}
                >
                  <p className="text-[9px] uppercase font-semibold mb-0.5" style={{ color: colors.textSecondary }}>
                    {label}
                  </p>
                  <p className="text-sm font-bold tabular-nums leading-none" style={{ color }}>
                    {value}
                  </p>
                  <p className="text-[9px]" style={{ color: colors.textMuted }}>{unit}</p>
                </div>
              ))}
            </div>
          )}

          {parsed.exercises.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textSecondary }}>
                Exercícios
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textPrimary }}>
                {parsed.exercises.map((ex) => (
                  <li
                    key={`${ex.name}-${ex.durationMinutes}`}
                    className="flex items-center justify-between"
                  >
                    <span>{ex.name}</span>
                    <span className="text-xs tabular-nums" style={{ color: colors.textSecondary }}>
                      {ex.durationMinutes} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.foods.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textSecondary }}>
                Alimentos
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textPrimary }}>
                {parsed.foods.map((food) => (
                  <li
                    key={`${food.name}-${food.quantity}`}
                    className="flex items-center justify-between"
                  >
                    <span>{food.name}</span>
                    <span className="text-xs tabular-nums" style={{ color: colors.textSecondary }}>
                      {food.quantity}
                      {food.name.toLowerCase().includes('água') ? ' L' : ' g'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary && <MacroChart summary={summary} />}
        </div>
      )}
    </div>
  );
}

// ── Cards de stats ──────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex-1 rounded-xl border p-3 flex flex-col items-center gap-1"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: colors.surfaceWarm }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <p className="text-sm font-bold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-[9px] uppercase font-medium text-center leading-tight" style={{ color: colors.textMuted }}>
        {label}
      </p>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function HistoricoPage() {
  const { session } = useAuth();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [monthLogs, setMonthLogs] = useState<DailyLogRow[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLogRow[]>([]);
  const [totalDays, setTotalDays] = useState<number | null>(null);

  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id ?? null;

  // carrega stats gerais (uma vez só)
  useEffect(() => {
    if (!userId) { setLoadingStats(false); return; }
    let alive = true;
    void (async () => {
      try {
        const [count, recent] = await Promise.all([
          fetchDailyLogCount(userId),
          fetchDailyLogHistory(userId, 60),
        ]);
        if (!alive) return;
        setTotalDays(count);
        setRecentLogs(recent);
      } catch {
        // ignora — stats são opcionais
      } finally {
        if (alive) setLoadingStats(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  // carrega logs do mês selecionado
  const loadMonth = useCallback(async () => {
    if (!userId) { setLoadingMonth(false); return; }
    setLoadingMonth(true);
    setError(null);
    try {
      const { start, end } = monthRangeFromYearMonth(viewYear, viewMonth);
      const rows = await fetchDailyLogsByRange(userId, start, end);
      setMonthLogs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar registros.');
    } finally {
      setLoadingMonth(false);
    }
  }, [userId, viewYear, viewMonth]);

  useEffect(() => { void loadMonth(); }, [loadMonth]);

  const streak = useMemo(() => computeStreak(recentLogs), [recentLogs]);
  const avg = useMemo(() => avgCalories(monthLogs), [monthLogs]);

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <div className="pt-4 pb-8 space-y-5">
      {/* cabeçalho */}
      <div>
        <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
          Histórico
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Todos os seus registros diários.
        </p>
      </div>

      {/* stats gerais */}
      {loadingStats ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="flex-1 h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          <StatPill
            icon={CalendarDays}
            label="dias registrados"
            value={String(totalDays ?? 0)}
            color={colors.accent}
          />
          <StatPill
            icon={UtensilsCrossed}
            label={`média ${MONTH_NAMES[viewMonth]}`}
            value={avg > 0 ? `${avg}` : '—'}
            color={colors.gradientMid}
          />
          <StatPill
            icon={Flame}
            label="sequência atual"
            value={`${streak} ${streak === 1 ? 'dia' : 'dias'}`}
            color={colors.points}
          />
        </div>
      )}

      {/* navegação de mês */}
      <div
        className="flex items-center justify-between rounded-2xl border px-4 py-3"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: colors.surfaceWarm }}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: colors.textPrimary }} />
        </button>

        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>

        <button
          type="button"
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30"
          style={{ background: colors.surfaceWarm }}
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" style={{ color: colors.textPrimary }} />
        </button>
      </div>

      {/* erro */}
      {error && (
        <p
          className="text-sm rounded-xl px-3 py-2 border"
          style={{ background: colors.surfaceWarm, borderColor: colors.border, color: colors.badge }}
        >
          {error}
        </p>
      )}

      {/* lista */}
      {loadingMonth ? (
        <HistoricoSkeleton />
      ) : monthLogs.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
            Nenhum registro em {MONTH_NAMES[viewMonth]}
          </p>
          <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
            Calcule o resumo na aba <strong>Seu dia</strong> para salvar automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
            {monthLogs.length} {monthLogs.length === 1 ? 'registro' : 'registros'} em {MONTH_NAMES[viewMonth]}
          </p>
          {monthLogs.map((row) => (
            <LogCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
