import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { CooldownBanner } from './CooldownBanner';
import { colors } from '../theme/colors';
import type { NutritionSummary } from '../types/nutrition';

interface CoachSectionProps {
  summary: NutritionSummary | null;
  onRequest: (goals: string) => Promise<void>;
  isLoading: boolean;
  cooldownSeconds: number;
  response: string | null;
  error: string | null;
}

export function CoachSection({
  summary,
  onRequest,
  isLoading,
  cooldownSeconds,
  response,
  error,
}: CoachSectionProps) {
  const [open, setOpen] = useState(false);
  const [userGoals, setUserGoals] = useState('');

  const handleRequest = () => {
    void onRequest(userGoals.trim());
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>
          <Sparkles className="w-4 h-4" style={{ color: colors.accent }} aria-hidden />
          Coach IA
        </span>
        {open
          ? <ChevronUp className="w-4 h-4" style={{ color: colors.textMuted }} aria-hidden />
          : <ChevronDown className="w-4 h-4" style={{ color: colors.textMuted }} aria-hidden />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: colors.border }}>
          {!summary && (
            <p className="text-xs pt-3" style={{ color: colors.textMuted }}>
              Adicione alimentos ou exercícios para receber uma recomendação personalizada.
            </p>
          )}

          {cooldownSeconds > 0 && <div className="pt-2"><CooldownBanner remainingSeconds={cooldownSeconds} /></div>}

          <textarea
            value={userGoals}
            onChange={(e) => setUserGoals(e.target.value)}
            rows={3}
            placeholder="Descreva suas metas (ex.: perder peso, ganhar massa, comer mais proteína…)"
            className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none mt-3"
            style={{
              background: colors.surfaceWarm,
              borderColor: colors.border,
              color: colors.textPrimary,
            }}
          />

          <button
            type="button"
            disabled={isLoading || cooldownSeconds > 0 || !summary}
            onClick={handleRequest}
            className="w-full rounded-xl py-3 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: colors.points, color: colors.surface }}
          >
            <Sparkles className="w-4 h-4" aria-hidden />
            {isLoading ? 'Gerando recomendação…' : 'Pedir recomendação'}
          </button>

          {error && (
            <p
              className="text-sm rounded-xl px-3 py-2 border"
              style={{
                background: colors.surfaceWarm,
                borderColor: colors.border,
                color: colors.badge,
              }}
            >
              {error}
            </p>
          )}

          {response && (
            <div
              className="rounded-xl border p-3 text-sm whitespace-pre-wrap"
              style={{
                background: colors.surfaceWarm,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
            >
              {response}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
