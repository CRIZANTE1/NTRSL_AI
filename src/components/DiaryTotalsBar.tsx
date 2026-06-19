import React from 'react';
import { Flame, Wheat, Beef, Droplets } from 'lucide-react';
import { colors } from '../theme/colors';

interface DiaryTotalsBarProps {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

function Stat({ icon, value, color }: { icon: React.ReactNode; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color }}>{icon}</span>
      <span className="tabular-nums font-semibold" style={{ color: colors.textPrimary, fontSize: 14 }}>
        {Math.round(value)}
      </span>
    </div>
  );
}

const Sep = () => (
  <span style={{ color: colors.textMuted, fontSize: 14 }}>·</span>
);

export function DiaryTotalsBar({ kcal, carbs, protein, fat }: DiaryTotalsBarProps) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(11rem+env(safe-area-inset-bottom,0px))] flex items-center gap-3 whitespace-nowrap"
      style={{
        zIndex: 50,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        padding: '10px 24px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}
      aria-label="Totais do dia"
    >
      <Stat icon={<Flame className="w-4 h-4" />} value={kcal} color={colors.accent} />
      <Sep />
      <Stat icon={<Wheat className="w-4 h-4" />} value={carbs} color={colors.gradientMid} />
      <Sep />
      <Stat icon={<Beef className="w-4 h-4" />} value={protein} color={colors.points} />
      <Sep />
      <Stat icon={<Droplets className="w-4 h-4" />} value={fat} color={colors.gradientEnd} />
    </div>
  );
}
