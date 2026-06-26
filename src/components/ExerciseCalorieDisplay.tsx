import React from 'react';
import { SkeletonBox } from './SkeletonBox';
import { colors } from '../theme/colors';
import type { FoodItemStatus } from '../types/nutrition';

interface ExerciseCalorieDisplayProps {
  kcal: number;
  status?: FoodItemStatus;
}

export function ExerciseCalorieDisplay({ kcal, status }: ExerciseCalorieDisplayProps) {
  if (status === 'calculating') {
    return <SkeletonBox width={80} />;
  }

  if (status === 'resolved') {
    return (
      <span className="text-xs font-semibold shrink-0" style={{ color: colors.accent }}>
        -{kcal} kcal
      </span>
    );
  }

  if (kcal > 0) {
    return (
      <span className="text-xs shrink-0" style={{ color: colors.textSecondary }}>
        -{kcal} kcal
      </span>
    );
  }

  return null;
}
