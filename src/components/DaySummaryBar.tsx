import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { colors } from '../theme/colors';
import type { NutritionSummary } from '../types/nutrition';
import type { UserGoals } from '../types/profile';

interface DaySummaryBarProps {
  summary: NutritionSummary;
  showDashboardLink?: boolean;
  dashboardDate?: string;
  goals?: UserGoals;
  /** Anima brevemente quando o balanço muda */
  pulseKey?: string | number;
}

function MiniProgress({
  value,
  goal,
  color,
}: {
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min(Math.round((value / goal) * 100), 100) : 0;
  return (
    <div
      className="h-1 rounded-full overflow-hidden"
      style={{ background: colors.border }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={goal}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function DaySummaryBar({
  summary,
  showDashboardLink = false,
  dashboardDate,
  goals,
  pulseKey,
}: DaySummaryBarProps) {
  // Com meta: restante = meta - (consumidas - gastas); sem meta: líquido = consumidas - gastas
  const netConsumed = summary.consumidas - summary.gastas;
  const hasGoal = goals != null && goals.kcal > 0;
  const balanceValue = hasGoal ? goals.kcal - netConsumed : netConsumed;
  const balanceLabel = hasGoal ? 'Restante' : 'Líquido';
  // Verde quando ainda tem saldo disponível (ou, sem meta, déficit = queimou mais)
  const balanceOk = hasGoal ? balanceValue >= 0 : balanceValue <= 0;

  return (
    <div
      className="sticky top-0 z-10 rounded-xl border px-4 py-3 flex items-center gap-3 transition-shadow duration-300"
      style={{
        background: colors.surface,
        borderColor: colors.border,
        boxShadow: pulseKey ? `0 0 0 2px ${colors.points}` : undefined,
      }}
      key={pulseKey}
    >
      <div className="flex-1 grid grid-cols-3 gap-3 text-center min-w-0">
        <div className="px-1 min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Gastas
          </p>
          <p className="text-sm font-bold tabular-nums leading-tight" style={{ color: colors.points }}>
            {Math.round(summary.gastas)}
            <span className="text-[9px] font-normal ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
          </p>
        </div>

        <div className="px-1 min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Consumidas
          </p>
          <p className="text-sm font-bold tabular-nums leading-tight" style={{ color: colors.accent }}>
            {Math.round(summary.consumidas)}
            <span className="text-[9px] font-normal ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
          </p>
          {goals && (
            <div className="mt-2.5 space-y-2 px-2.5 pb-0.5">
              <p className="text-[8px] tabular-nums leading-none" style={{ color: colors.textMuted }}>
                / {goals.kcal} kcal
              </p>
              <MiniProgress value={summary.consumidas} goal={goals.kcal} color={colors.accent} />
            </div>
          )}
        </div>

        <div className="px-1 min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            {balanceLabel}
          </p>
          <p
            className="text-sm font-bold tabular-nums leading-tight"
            style={{ color: balanceOk ? colors.points : colors.badge }}
          >
            {hasGoal && balanceValue > 0 ? '+' : ''}{Math.round(balanceValue)}
            <span className="text-[9px] font-normal ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
          </p>
          {goals && summary.proteina > 0 && (
            <div className="mt-2.5 space-y-2 px-2.5 pb-0.5">
              <p className="text-[8px] tabular-nums leading-none" style={{ color: colors.textMuted }}>
                P: {Math.round(summary.proteina)}/{goals.proteina}g
              </p>
              <MiniProgress value={summary.proteina} goal={goals.proteina} color={colors.points} />
            </div>
          )}
        </div>
      </div>

      {showDashboardLink && (
        <Link
          to={dashboardDate ? `/dashboard?date=${dashboardDate}` : '/dashboard'}
          className="shrink-0 flex items-center gap-0.5 text-[10px] font-medium"
          style={{ color: colors.textSecondary }}
          aria-label="Ver resumo completo no Dashboard"
        >
          Ver
          <ArrowRight className="w-3 h-3" aria-hidden />
        </Link>
      )}
    </div>
  );
}
