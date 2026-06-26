import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Droplets, Dumbbell, Sparkles, UtensilsCrossed } from 'lucide-react';
import { CooldownBanner } from './CooldownBanner';
import { getCoachGoals, setCoachGoals } from '../lib/recentItems';
import { formatCountdown, useCountdown } from '../hooks/useCountdown';
import { colors } from '../theme/colors';
import type { CoachRecommendationStructured } from '../types/nutrition';

const GOAL_CHIPS = ['Perder peso', 'Ganhar massa', 'Mais proteína', 'Mais energia'] as const;

interface CoachSectionProps {
  onRequest: (goals: string) => Promise<void>;
  isLoading: boolean;
  cooldownSeconds: number;
  response: string | null;
  structured?: CoachRecommendationStructured | null;
  error: string | null;
  hasSummary: boolean;
}

function CoachBlock({
  icon: Icon,
  title,
  items,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  items: string[];
  iconColor: string;
}) {
  return (
    <section
      className="rounded-xl border px-3 py-2.5 space-y-1.5"
      style={{ background: colors.surfaceWarm, borderColor: colors.border }}
    >
      <h3
        className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5"
        style={{ color: colors.textSecondary }}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: iconColor }} aria-hidden />
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm flex gap-2" style={{ color: colors.textPrimary }}>
            <span className="shrink-0" style={{ color: colors.textMuted }} aria-hidden>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StructuredCoachResponse({ data }: { data: CoachRecommendationStructured }) {
  return (
    <div className="space-y-2.5" aria-label="Recomendação do coach">
      <section
        className="rounded-xl border px-3 py-2.5"
        style={{ background: colors.surfaceWarm, borderColor: colors.border }}
      >
        <h3
          className="text-[10px] font-bold uppercase tracking-wide mb-1"
          style={{ color: colors.textSecondary }}
        >
          Visão da semana
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
          {data.visaoSemanal}
        </p>
      </section>

      <CoachBlock
        icon={UtensilsCrossed}
        title="Alimentos"
        items={data.alimentos}
        iconColor={colors.accent}
      />
      <CoachBlock icon={Droplets} title="Água" items={data.agua} iconColor={colors.points} />
      <CoachBlock
        icon={Dumbbell}
        title="Exercícios"
        items={data.exercicios}
        iconColor={colors.accent}
      />

      <section
        className="rounded-xl border px-3 py-2.5"
        style={{ background: colors.accentSoft, borderColor: colors.accent }}
      >
        <h3
          className="text-[10px] font-bold uppercase tracking-wide mb-1"
          style={{ color: colors.textPrimary }}
        >
          Próximo passo
        </h3>
        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          {data.proximoPasso}
        </p>
      </section>
    </div>
  );
}

export function CoachSection({
  onRequest,
  isLoading,
  cooldownSeconds,
  response,
  structured,
  error,
  hasSummary,
}: CoachSectionProps) {
  const [open, setOpen] = useState(false);
  const [userGoals, setUserGoals] = useState(() => getCoachGoals());
  const localSeconds = useCountdown(cooldownSeconds);

  useEffect(() => {
    setCoachGoals(userGoals);
  }, [userGoals]);

  const handleRequest = () => {
    void onRequest(userGoals.trim());
  };

  const selectChip = (chip: string) => {
    setUserGoals(chip);
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
        <span className="flex items-center gap-2">
          {!open && localSeconds > 0 && (
            <span className="text-xs tabular-nums" style={{ color: colors.textMuted }}>
              {formatCountdown(localSeconds)}
            </span>
          )}
          {open
            ? <ChevronUp className="w-4 h-4" style={{ color: colors.textMuted }} aria-hidden />
            : <ChevronDown className="w-4 h-4" style={{ color: colors.textMuted }} aria-hidden />
          }
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: colors.border }}>
          {!hasSummary && (
            <p className="text-xs pt-3" style={{ color: colors.textMuted }}>
              Adicione alimentos ou exercícios para receber uma recomendação personalizada com contexto
              semanal.
            </p>
          )}

          {cooldownSeconds > 0 && <div className="pt-2"><CooldownBanner remainingSeconds={cooldownSeconds} /></div>}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {GOAL_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => selectChip(chip)}
                className="text-xs px-2.5 py-1 rounded-full border font-medium"
                style={{
                  background: userGoals === chip ? colors.accentSoft : colors.surfaceWarm,
                  borderColor: userGoals === chip ? colors.accent : colors.border,
                  color: colors.textPrimary,
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <textarea
            value={userGoals}
            onChange={(e) => setUserGoals(e.target.value)}
            rows={3}
            placeholder="Descreva suas metas (ex.: perder peso, ganhar massa, comer mais proteína…)"
            className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none"
            style={{
              background: colors.surfaceWarm,
              borderColor: colors.border,
              color: colors.textPrimary,
            }}
          />

          <button
            type="button"
            disabled={isLoading || cooldownSeconds > 0 || !hasSummary}
            onClick={handleRequest}
            className="w-full rounded-xl py-3 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: colors.points, color: colors.surface }}
          >
            <Sparkles className="w-4 h-4" aria-hidden />
            {isLoading ? 'Analisando sua semana…' : 'Pedir recomendação'}
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

          {structured && <StructuredCoachResponse data={structured} />}

          {!structured && response && (
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
