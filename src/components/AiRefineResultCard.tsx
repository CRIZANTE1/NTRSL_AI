import React from 'react';
import { Brain, Check } from 'lucide-react';
import { getSummaryAdjustments, type SummaryAdjustment } from '../lib/nutrition';
import { makeGlassSurfaceStyle } from '../theme/glass';
import { hexToRgba } from '../theme/colorUtils';
import { colors } from '../theme/colors';
import type { NutritionSummary } from '../types/nutrition';

interface AiRefineResultCardProps {
  before: NutritionSummary;
  after: NutritionSummary;
  onConfirm: () => void;
}

function formatDelta(adj: SummaryAdjustment): string {
  const diff = Math.round((adj.after - adj.before) * 10) / 10;
  const sign = diff > 0 ? '+' : '';
  return `${Math.round(adj.before)} → ${Math.round(adj.after)} (${sign}${diff} ${adj.unit})`;
}

export function AiRefineResultCard({ before, after, onConfirm }: AiRefineResultCardProps) {
  const adjustments = getSummaryAdjustments(before, after);
  const balance = after.gastas - after.consumidas;
  const balancePositive = balance >= 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{
        background: hexToRgba(colors.background, 0.72),
        backdropFilter: 'blur(10px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-refine-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl border p-5 space-y-4"
        style={makeGlassSurfaceStyle(0.88, { blurPx: 20, shadow: 'strong' })}
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 p-2.5 rounded-2xl"
            style={{ background: colors.accentSoft, color: colors.accent }}
          >
            <Brain className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2
              id="ai-refine-title"
              className="text-base font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Estimativas refinadas
            </h2>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              A IA ajustou seu resumo do dia. Confira abaixo.
            </p>
          </div>
        </div>

        {adjustments.length > 0 ? (
          <ul className="space-y-2" aria-label="Ajustes realizados">
            {adjustments.map((adj) => (
              <li
                key={adj.label}
                className="rounded-xl border px-3 py-2.5"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
                  {adj.label}
                </p>
                <p className="text-sm font-medium tabular-nums mt-0.5" style={{ color: colors.textPrimary }}>
                  {formatDelta(adj)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="text-sm rounded-xl border px-3 py-2.5"
            style={{
              background: colors.surfaceWarm,
              borderColor: colors.border,
              color: colors.textSecondary,
            }}
          >
            Nenhum ajuste necessário — seus valores já estavam corretos.
          </p>
        )}

        <div
          className="rounded-xl border px-3 py-2.5 grid grid-cols-3 gap-1 text-center"
          style={{ background: colors.surfaceWarm, borderColor: colors.border }}
        >
          <div>
            <p className="text-[9px] uppercase font-semibold" style={{ color: colors.textMuted }}>
              Gastas
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: colors.points }}>
              {Math.round(after.gastas)}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-semibold" style={{ color: colors.textMuted }}>
              Consumidas
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: colors.accent }}>
              {Math.round(after.consumidas)}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-semibold" style={{ color: colors.textMuted }}>
              Balanço
            </p>
            <p
              className="text-sm font-bold tabular-nums"
              style={{ color: balancePositive ? colors.points : colors.accent }}
            >
              {balancePositive ? '+' : ''}
              {Math.round(balance)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-2xl py-3 font-semibold inline-flex items-center justify-center gap-2"
          style={{ background: colors.accent, color: colors.textPrimary }}
        >
          <Check className="w-4 h-4" aria-hidden />
          Confirmar
        </button>
      </div>
    </div>
  );
}
