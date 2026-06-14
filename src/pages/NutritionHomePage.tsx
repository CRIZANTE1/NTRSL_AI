import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExercisePicker } from '../components/ExercisePicker';
import { FoodPicker } from '../components/FoodPicker';
import { MacroChart } from '../components/MacroChart';
import { DaySummaryBar } from '../components/DaySummaryBar';
import { CoachSection } from '../components/CoachSection';
import { Skeleton } from '../components/ui/Skeleton';
import CalendarStrip from '../components/CalendarStrip';
import { useAuth } from '../contexts/AuthContext';
import { localLogDate } from '../lib/data/dailyLogs';
import { buildSummary } from '../lib/nutrition';
import { getAiCooldown, postAiRecommendations, postNutritionSummary } from '../lib/api';
import { useDailyLog, useSaveDailyLog } from '../hooks/useDailyLog';
import { useDailyLogHistory } from '../hooks/useDailyLogHistory';
import { colors } from '../theme/colors';
import { CTA_BOTTOM_CLASS, SECTION_WITH_CTA_PADDING_CLASS } from '../lib/layout';
import type { ExerciseEntry, FoodEntry, NutritionSummary } from '../types/nutrition';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'pending-sync';

function parseLogDate(logDate: string): Date {
  const [y, m, d] = logDate.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function NutritionHomePage() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedKey = localLogDate(selectedDate);

  const { data: dayData, isLoading: dayLoading } = useDailyLog(userId, selectedKey);
  const { data: historyRows = [] } = useDailyLogHistory(userId, 30);
  const saveMutation = useSaveDailyLog();

  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [aiCalcLoading, setAiCalcLoading] = useState(false);

  // Populate pickers when day data loads (or changes due to date nav)
  useEffect(() => {
    if (dayLoading) return;
    setExercises(dayData?.exercises ?? []);
    setFoods(dayData?.foods ?? []);
    setSummary(dayData?.summary ?? null);
    setSaveStatus('idle');
    setAiResponse(null);
    setAiError(null);
  }, [dayData, dayLoading]);

  const loadCooldown = useCallback(async () => {
    try {
      const status = await getAiCooldown();
      setCooldownSeconds(status.remainingSeconds ?? 0);
    } catch {
      setCooldownSeconds(0);
    }
  }, []);

  useEffect(() => {
    void loadCooldown();
  }, [loadCooldown]);

  // Auto-save with debounce when pickers change
  const triggerAutoSave = useCallback(
    (nextExercises: ExerciseEntry[], nextFoods: FoodEntry[]) => {
      if (!userId) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      setSaveStatus('saving');
      debounceRef.current = setTimeout(() => {
        const localSummary = buildSummary(nextExercises, nextFoods);
        setSummary(localSummary);

        saveMutation.mutate(
          {
            userId,
            logDate: selectedKey,
            exercises: nextExercises,
            foods: nextFoods,
            summary: localSummary,
          },
          {
            onSuccess: ({ synced }) => {
              setSaveStatus(synced ? 'saved' : 'pending-sync');
              setTimeout(() => setSaveStatus('idle'), 3000);
            },
            onError: () => {
              setSaveStatus('pending-sync');
            },
          },
        );
      }, 1500);
    },
    [userId, selectedKey, saveMutation],
  );

  const handleExercisesChange = (next: ExerciseEntry[]) => {
    setExercises(next);
    triggerAutoSave(next, foods);
  };

  const handleFoodsChange = (next: FoodEntry[]) => {
    setFoods(next);
    triggerAutoSave(exercises, next);
  };

  // "Calcular com IA" — sends to Gemini and saves the enriched summary
  const handleAiCalculate = async () => {
    if (!userId) return;
    setAiCalcLoading(true);
    setAiError(null);

    let result: NutritionSummary;
    try {
      result = await postNutritionSummary(exercises, foods);
      setSummary(result);
    } catch (err) {
      result = buildSummary(exercises, foods);
      setSummary(result);
      const message = err instanceof Error ? err.message : 'Falha ao calcular com IA.';
      setAiError(`Cálculo local (offline): ${message}`);
    }

    setSaveStatus('saving');
    saveMutation.mutate(
      { userId, logDate: selectedKey, exercises, foods, summary: result },
      {
        onSuccess: ({ synced }) => {
          setSaveStatus(synced ? 'saved' : 'pending-sync');
          setTimeout(() => setSaveStatus('idle'), 3000);
        },
        onError: () => setSaveStatus('pending-sync'),
      },
    );

    setAiCalcLoading(false);
  };

  const handleAiRecommendation = async (goals: string) => {
    if (!summary) {
      setAiError('Adicione alimentos ou exercícios antes de pedir recomendações.');
      return;
    }
    if (cooldownSeconds > 0) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const result = await postAiRecommendations(summary, goals);
      setAiResponse(result.recommendation);
      await loadCooldown();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao obter recomendação.';
      setAiError(message);
      if (message.includes('429') || message.toLowerCase().includes('cooldown')) {
        await loadCooldown();
      }
    } finally {
      setAiLoading(false);
    }
  };

  const eventDates = historyRows
    .filter((row) => row.summary != null)
    .map((row) => parseLogDate(row.log_date));

  const saveLabel: Record<SaveStatus, string | null> = {
    idle: null,
    saving: 'Salvando…',
    saved: 'Salvo ✓',
    'pending-sync': 'Pendente sync',
  };

  const saveLabelColor: Record<SaveStatus, string> = {
    idle: colors.textMuted,
    saving: colors.textMuted,
    saved: colors.points,
    'pending-sync': colors.accent,
  };

  return (
    <div className={`pt-4 space-y-4 ${SECTION_WITH_CTA_PADDING_CLASS}`}>
      {/* Header + CalendarStrip */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
            Seu dia
          </h1>
          {saveStatus !== 'idle' && (
            <span
              className="text-xs font-medium transition-colors"
              style={{ color: saveLabelColor[saveStatus] }}
              aria-live="polite"
            >
              {saveLabel[saveStatus]}
            </span>
          )}
        </div>

        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
          }}
          eventDates={eventDates}
        />
      </div>

      {/* Resumo sticky */}
      {summary && (
        <DaySummaryBar summary={summary} showDashboardLink />
      )}

      {/* Pickers */}
      {dayLoading ? (
        <div className="space-y-3" aria-label="Carregando registro do dia…">
          <Skeleton className="h-10 rounded-xl w-1/3" />
          <Skeleton className="h-20 rounded-2xl w-full" />
          <Skeleton className="h-10 rounded-xl w-1/3 mt-2" />
          <Skeleton className="h-20 rounded-2xl w-full" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Exercícios
            </h2>
            <ExercisePicker entries={exercises} onChange={handleExercisesChange} />
          </section>

          <section className="space-y-3">
            <h2
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Alimentos
            </h2>
            <FoodPicker entries={foods} onChange={handleFoodsChange} />
          </section>
        </>
      )}

      {/* Macros chart — só exibe quando há summary */}
      {summary && !dayLoading && <MacroChart summary={summary} />}

      {/* Coach IA colapsável */}
      {!dayLoading && (
        <CoachSection
          summary={summary}
          onRequest={handleAiRecommendation}
          isLoading={aiLoading}
          cooldownSeconds={cooldownSeconds}
          response={aiResponse}
          error={aiError}
        />
      )}

      {/* CTA fixo — "Calcular com IA" */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-full max-w-md px-6 ${CTA_BOTTOM_CLASS}`}
        style={{ zIndex: 20 }}
      >
        <button
          type="button"
          disabled={aiCalcLoading || dayLoading}
          onClick={() => void handleAiCalculate()}
          className="w-full rounded-2xl py-3.5 font-semibold shadow-lg disabled:opacity-60"
          style={{ background: colors.accent, color: colors.textPrimary }}
        >
          {aiCalcLoading
            ? 'Calculando com IA…'
            : summary
            ? 'Atualizar com IA'
            : 'Calcular com IA'}
        </button>
      </div>
    </div>
  );
}
