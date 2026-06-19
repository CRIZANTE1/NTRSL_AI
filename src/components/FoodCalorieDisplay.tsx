import React from 'react';
import { SkeletonText } from './SkeletonText';
import { colors } from '../theme/colors';
import type { FoodItemStatus } from '../types/nutrition';

interface FoodCalorieDisplayProps {
  kcal: number;
  status?: FoodItemStatus;
}

export function FoodCalorieDisplay({ kcal, status }: FoodCalorieDisplayProps) {
  if (status === 'calculating') {
    return <SkeletonText />;
  }

  if (status === 'resolved') {
    return (
      <span
        style={{
          color: colors.accent,
          fontSize: 14,
          fontWeight: 500,
          minWidth: 90,
          textAlign: 'right',
          display: 'inline-block',
        }}
      >
        +{kcal} cal
      </span>
    );
  }

  if (kcal > 0) {
    return (
      <span
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          minWidth: 90,
          textAlign: 'right',
          display: 'inline-block',
        }}
      >
        {kcal} cal
      </span>
    );
  }

  return (
    <span
      style={{
        color: colors.textMuted,
        fontSize: 14,
        minWidth: 90,
        textAlign: 'right',
        display: 'inline-block',
      }}
    >
      0 cal
    </span>
  );
}
