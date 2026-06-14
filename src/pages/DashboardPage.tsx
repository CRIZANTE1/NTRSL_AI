import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { Flame, TrendingDown, TrendingUp, Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { localLogDate, parseDailyLogRow } from '../lib/data/dailyLogs';
import { colors } from '../theme/colors';
import CalendarStrip from '../components/CalendarStrip';
import { useDailyLog } from '../hooks/useDailyLog';
import { useDailyLogHistory } from '../hooks/useDailyLogHistory';
import type { ExerciseEntry, NutritionSummary } from '../types/nutrition';
import type { Database } from '../types/supabase';

type DailyLogRow = Database['public']['Tables']['daily_logs']['Row'];

const GOALS = {
  calorias: 2000,
  proteina: 50,
  carboidratos: 250,
} as const;

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

function parseLogDate(logDate: string): Date {
  const [y, m, d] = logDate.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function dayLabelFromLogDate(logDate: string): string {
  return DAY_LABELS[parseLogDate(logDate).getDay()];
}

function buildLast7Days(anchor = new Date()): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    days.push(localLogDate(d));
  }
  return days;
}

function computeStreak(rows: DailyLogRow[]): number {
  const byDate = new Map(
    rows
      .filter((row) => row.summary != null)
      .map((row) => [row.log_date, row]),
  );

  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = localLogDate(cursor);
    if (!byDate.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function totalExerciseMinutes(exercises: ExerciseEntry[]): number {
  return exercises.reduce((sum, ex) => sum + ex.durationMinutes, 0);
}

interface RingMetric {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit: string;
}

function ProgressRings({ metrics }: { metrics: RingMetric[] }) {
  const size = 128;
  const center = size / 2;
  const strokeWidth = 16;
  const gap = 3;
  const radii = [
    center - strokeWidth / 2,
    center - strokeWidth / 2 - (strokeWidth + gap),
    center - strokeWidth / 2 - 2 * (strokeWidth + gap),
  ];

  return (
    <div className="flex items-center gap-4 min-w-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label={`Anéis de progresso: ${metrics.map((m) => `${m.label} ${Math.round(m.value)} ${m.unit}`).join(', ')}`}
      >
        {metrics.map((metric, index) => {
          const radius = radii[index];
          const circumference = 2 * Math.PI * radius;
          const progress = Math.min(metric.value / metric.goal, 1);
          const offset = circumference * (1 - progress);

          return (
            <g key={metric.label} transform={`rotate(-90 ${center} ${center})`}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={colors.border}
                strokeWidth={strokeWidth}
                aria-hidden
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={metric.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                aria-label={`${metric.label}: ${Math.round((metric.value / metric.goal) * 100)}%`}
              />
            </g>
          );
        })}
      </svg>

      <div className="flex-1 space-y-2.5 min-w-0">
        {metrics.map((metric) => {
          const pct = Math.min(Math.round((metric.value / metric.goal) * 100), 100);
          return (
            <div key={metric.label} className="min-w-0">
              <div className="flex items-baseline justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>
                  {metric.label}
                </span>
                <span className="text-xs font-bold tabular-nums" style={{ color: metric.color }}>
                  {Math.round(metric.value)}
                  <span className="text-[9px] font-normal" style={{ color: colors.textMuted }}>
                    {' '}{metric.unit}
                  </span>
                </span>
              </div>
              <div
                className="h-3 rounded-full overflow-hidden"
                style={{ background: colors.border }}
                role="progressbar"
                aria-valuenow={Math.round(metric.value)}
                aria-valuemin={0}
                aria-valuemax={metric.goal}
                aria-label={metric.label}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: metric.color,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WeeklyBar {
  label: string;
  value: number;
  isToday: boolean;
}

function WeeklyMiniChart({
  title,
  data,
  barColor,
  todayHighlight,
}: {
  title: string;
  data: WeeklyBar[];
  barColor: string;
  todayHighlight: string;
}) {
  const todayValue = data.find((d) => d.isToday)?.value ?? 0;

  return (
    <div
      className="relative rounded-xl border min-h-0 h-full overflow-hidden"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <div className="absolute top-2 left-3 right-3 z-10 flex items-baseline justify-between pointer-events-none">
        <p className="text-[10px] font-semibold" style={{ color: colors.textMuted }}>
          {title}
        </p>
        <p className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
          {todayValue}
          <span className="text-[9px] font-normal ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
        </p>
      </div>

      <div className="absolute inset-0 pt-6 pb-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 4, left: -32, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: colors.textMuted, fontSize: 8 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: colors.surfaceWarm }}
              contentStyle={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                color: colors.textPrimary,
                fontSize: 11,
                padding: '4px 8px',
              }}
              formatter={(value: number) => [`${value} kcal`, '']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.isToday ? todayHighlight : barColor}
                  opacity={entry.isToday ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accentColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-xl border p-2.5 flex flex-col items-center justify-center gap-1 min-h-0 h-full overflow-hidden text-center"
      style={{ background: colors.surface, borderColor: colors.border }}
      aria-label={`${title}: ${value}`}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: colors.surfaceWarm }}
      >
        <Icon className="w-4 h-4" style={{ color: accentColor }} aria-hidden />
      </div>
      <p className="text-sm font-bold leading-none tabular-nums" style={{ color: accentColor }}>
        {value}
      </p>
      <p className="text-[9px] font-medium uppercase tracking-wide leading-none" style={{ color: colors.textMuted }}>
        {title}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedKey = localLogDate(selectedDate);

  const { data: dayData, isFetching: dayLoading } = useDailyLog(userId, selectedKey);
  const { data: historyRows = [] } = useDailyLogHistory(userId, 30);

  const summary: NutritionSummary | null = dayData?.summary ?? null;
  const exercises: ExerciseEntry[] = dayData?.exercises ?? [];

  const ringMetrics = useMemo<RingMetric[]>(
    () => [
      {
        label: 'Consumidas',
        value: summary?.consumidas ?? 0,
        goal: GOALS.calorias,
        color: colors.accent,
        unit: 'KCAL',
      },
      {
        label: 'Proteína',
        value: summary?.proteina ?? 0,
        goal: GOALS.proteina,
        color: colors.points,
        unit: 'G',
      },
      {
        label: 'Carboidratos',
        value: summary?.carboidratos ?? 0,
        goal: GOALS.carboidratos,
        color: colors.gradientMid,
        unit: 'G',
      },
    ],
    [summary],
  );

  const weeklyData = useMemo(() => {
    const byDate = new Map(historyRows.map((row) => [row.log_date, parseDailyLogRow(row)]));
    const last7 = buildLast7Days(selectedDate);

    const consumidas: WeeklyBar[] = last7.map((date) => ({
      label: dayLabelFromLogDate(date),
      value: byDate.get(date)?.summary?.consumidas ?? 0,
      isToday: date === selectedKey,
    }));

    const gastas: WeeklyBar[] = last7.map((date) => ({
      label: dayLabelFromLogDate(date),
      value: byDate.get(date)?.summary?.gastas ?? 0,
      isToday: date === selectedKey,
    }));

    return { consumidas, gastas };
  }, [historyRows, selectedDate, selectedKey]);

  const streak = useMemo(() => computeStreak(historyRows), [historyRows]);

  const eventDatesFromHistory = useMemo(
    () => historyRows.filter((row) => row.summary != null).map((row) => parseLogDate(row.log_date)),
    [historyRows],
  );

  const exerciseMinutes = totalExerciseMinutes(exercises);
  const balance = summary ? summary.gastas - summary.consumidas : 0;
  const balancePositive = balance >= 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-1 gap-2">
      <header className="shrink-0">
        <h1 className="text-lg font-bold leading-tight mb-2" style={{ color: colors.textPrimary }}>
          Resumo
        </h1>
        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          eventDates={eventDatesFromHistory}
        />
      </header>

      <section
        className="shrink-0 rounded-xl border p-3"
        style={{
          background: colors.surface,
          borderColor: colors.border,
          opacity: dayLoading ? 0.6 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        <ProgressRings metrics={ringMetrics} />
      </section>

      <section className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        <WeeklyMiniChart
          title="Consumido"
          data={weeklyData.consumidas}
          barColor={colors.points}
          todayHighlight={colors.accent}
        />
        <WeeklyMiniChart
          title="Gasto"
          data={weeklyData.gastas}
          barColor={colors.accent}
          todayHighlight={colors.points}
        />
      </section>

      <section className="shrink-0 grid grid-cols-3 gap-2 h-[84px]">
        <StatCard
          title="Exercícios"
          value={`${exerciseMinutes} min`}
          icon={Dumbbell}
          accentColor={colors.points}
        />
        <StatCard
          title="Balanço"
          value={`${balancePositive ? '+' : ''}${Math.round(balance)} kcal`}
          icon={balancePositive ? TrendingDown : TrendingUp}
          accentColor={balancePositive ? colors.points : colors.accent}
        />
        <StatCard
          title="Sequência"
          value={`${streak} ${streak === 1 ? 'dia' : 'dias'}`}
          icon={Flame}
          accentColor={colors.accent}
        />
      </section>
    </div>
  );
}
