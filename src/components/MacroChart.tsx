import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { colors } from '../theme/colors';
import type { NutritionSummary } from '../types/nutrition';

interface MacroChartProps {
  summary: NutritionSummary;
}

export function MacroChart({ summary }: MacroChartProps) {
  const data = [
    { name: 'Proteína', valor: summary.proteina, fill: colors.points },
    { name: 'Carboidratos', valor: summary.carboidratos, fill: colors.accent },
    { name: 'Gordura', valor: summary.gordura, fill: colors.gradientMid },
  ];

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
        Macronutrientes (g)
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: colors.textSecondary, fontSize: 11 }}
              axisLine={{ stroke: colors.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: colors.textSecondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                color: colors.textPrimary,
              }}
            />
            <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
