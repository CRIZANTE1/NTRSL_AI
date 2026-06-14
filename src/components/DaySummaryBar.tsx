import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { colors } from '../theme/colors';
import type { NutritionSummary } from '../types/nutrition';

interface DaySummaryBarProps {
  summary: NutritionSummary;
  showDashboardLink?: boolean;
}

export function DaySummaryBar({ summary, showDashboardLink = false }: DaySummaryBarProps) {
  const balance = summary.gastas - summary.consumidas;
  const balancePositive = balance >= 0;

  return (
    <div
      className="sticky top-0 z-10 rounded-xl border px-3 py-2.5 flex items-center gap-2"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <div className="flex-1 grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Gastas
          </p>
          <p className="text-sm font-bold tabular-nums leading-tight" style={{ color: colors.points }}>
            {Math.round(summary.gastas)}
            <span className="text-[9px] font-normal ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
          </p>
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Consumidas
          </p>
          <p className="text-sm font-bold tabular-nums leading-tight" style={{ color: colors.accent }}>
            {Math.round(summary.consumidas)}
            <span className="text-[9px] font-normal ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
          </p>
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Balanço
          </p>
          <p
            className="text-sm font-bold tabular-nums leading-tight"
            style={{ color: balancePositive ? colors.points : colors.accent }}
          >
            {balancePositive ? '+' : ''}{Math.round(balance)}
            <span className="text-[9px] font-normal ml-0.5" style={{ color: colors.textMuted }}>kcal</span>
          </p>
        </div>
      </div>

      {showDashboardLink && (
        <Link
          to="/dashboard"
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
