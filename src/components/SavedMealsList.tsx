import React from 'react';
import { X } from 'lucide-react';
import { mealLabel, type SavedMealRow } from '../lib/savedMeals';
import { colors } from '../theme/colors';

interface SavedMealsListProps {
  meals: SavedMealRow[];
  onSelect: (text: string) => void;
  onDelete: (id: string) => void;
}

export function SavedMealsList({ meals, onSelect, onDelete }: SavedMealsListProps) {
  if (meals.length === 0) return null;

  return (
    <div className="pb-1">
      <p
        className="text-[11px] font-medium uppercase tracking-wide mb-2"
        style={{ color: colors.textMuted }}
      >
        Refeições salvas
      </p>
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="shrink-0 flex items-center gap-1 rounded-full border pl-3 pr-1 py-1"
            style={{
              background: colors.surface,
              borderColor: colors.border,
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(meal.text)}
              className="text-xs font-medium max-w-[180px] truncate border-none bg-transparent p-0"
              style={{ color: colors.textSecondary }}
              title={meal.text}
              aria-label={`Adicionar refeição salva: ${meal.text}`}
            >
              {mealLabel(meal.text)}
            </button>
            <button
              type="button"
              onClick={() => onDelete(meal.id)}
              className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-none bg-transparent p-0"
              style={{ color: colors.textMuted }}
              aria-label={`Remover refeição salva: ${meal.text}`}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
