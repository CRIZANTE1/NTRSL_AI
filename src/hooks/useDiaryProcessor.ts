import { useEffect, useRef } from 'react';
import { postNutritionSummary } from '../lib/api';
import type { DiaryEntry } from '../types/nutrition';

export function useDiaryProcessor(
  entries: DiaryEntry[],
  onUpdate: (id: string, updates: Partial<DiaryEntry>) => void,
): void {
  const processingIds = useRef(new Set<string>());
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const pending = entries.filter(
      (e) => e.status === 'calculating' && !processingIds.current.has(e.id),
    );

    for (const entry of pending) {
      processingIds.current.add(entry.id);

      void (async () => {
        try {
          const result = await postNutritionSummary(
            [],
            [{ name: entry.rawText, quantity: 100 }],
          );

          const isExercise = result.gastas > 0 && result.consumidas === 0;

          onUpdateRef.current(entry.id, {
            type: isExercise ? 'exercise' : 'food',
            kcal: isExercise
              ? Math.round(result.gastas)
              : Math.round(result.consumidas),
            protein: isExercise ? undefined : result.proteina,
            carbs: isExercise ? undefined : result.carboidratos,
            fat: isExercise ? undefined : result.gordura,
            status: 'resolved',
            isNew: true,
          });
        } catch {
          onUpdateRef.current(entry.id, { status: 'resolved', kcal: 0 });
        } finally {
          processingIds.current.delete(entry.id);
        }
      })();
    }
  }, [entries]);
}
