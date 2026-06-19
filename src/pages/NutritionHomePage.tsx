import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain, CloudOff, Flame, Loader2, RotateCcw } from 'lucide-react';
import { ExercisePicker } from '../components/ExercisePicker';
import { FoodPicker } from '../components/FoodPicker';
import { MacroChart } from '../components/MacroChart';
import { DaySummaryBar } from '../components/DaySummaryBar';
import { CoachSection } from '../components/CoachSection';
import { AiRefineResultCard } from '../components/AiRefineResultCard';
import { Skeleton } from '../components/ui/Skeleton';
import CalendarStrip from '../components/CalendarStrip';
import { useAuth } from '../contexts/AuthContext';
import {
  computeStreak,
  localLogDate,
  parseDailyLogRow,
  parseLogDateString,
} from '../lib/data/dailyLogs';
import { buildSummary, mergeNutritionSummary } from '../lib/nutrition';
import {
  applyLiveDayToWeeklyContext,
  buildWeeklyCoachContext,
} from '../lib/coachContext';
import { getAiCooldown, postAiRecommendations, postNutritionSummary } from '../lib/api';
import { hapticsSuccess } from '../lib/haptics';
import { useDailyLog, useSaveDailyLog } from '../hooks/useDailyLog';
import { useDailyLogHistory } from '../hooks/useDailyLogHistory';
import { useUserGoals } from '../hooks/useUserGoals';
import {
  getSectionMode,
  setSectionMode,
  type SectionMode,
} from '../lib/recentItems';
import { colors } from '../theme/colors';
import type { CoachRecommendationStructured, ExerciseEntry, FoodEntry, FoodItemStatus, NutritionSummary } from '../types/nutrition';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'pending-sync';

const SECTION_OPTIONS: { id: SectionMode; label: string }[] = [
  { id: 'ambos', label: 'Ambos' },
  { id: 'alimentos', label: 'Só alimentos' },
  { id: 'exercicios', label: 'Só exercícios' },
];

export default function NutritionHomePage() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedKey = localLogDate(selectedDate);
  const isToday = selectedKey === localLogDate();

  const { data: dayData, isLoading: dayLoading } = useDailyLog(userId, selectedKey);
  const { data: historyRows = [] } = useDailyLogHistory(userId, 30);
  const { goals } = useUserGoals();
  const saveMutation = useSaveDailyLog();

  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [sectionMode, setSectionModeState] = useState<SectionMode>(() => getSectionMode());
  const [summaryPulseKey, setSummaryPulseKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<(() => void) | null>(null);
  const prevBalanceRef = useRef<number | null>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const exerciseInputRef = useRef<HTMLInputElement>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiStructured, setAiStructured] = useState<CoachRecommendationStructured | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [aiCalcLoading, setAiCalcLoading] = useState(false);
  const [foodStatuses, setFoodStatuses] = useState<Record<string, FoodItemStatus>>({});
  const [exerciseStatuses, setExerciseStatuses] = useState<Record<string, FoodItemStatus>>({});
  const [aiRefineResult, setAiRefineResult] = useState<{
    before: NutritionSummary;
    after: NutritionSummary;
  } | null>(null);

  useEffect(() => {
    if (!userId) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      pendingSaveRef.current = null;
      prevBalanceRef.current = null;
      setExercises([]);
      setFoods([]);
      setSummary(null);
      setSaveStatus('idle');
      setAiLoading(false);
      setAiCalcLoading(false);
      setAiResponse(null);
      setAiStructured(null);
      setAiError(null);
      setAiRefineResult(null);
      setCooldownSeconds(0);
    }
  }, [userId]);

  useEffect(() => {
    if (dayLoading) return;
    setExercises(dayData?.exercises ?? []);
    setFoods(dayData?.foods ?? []);
    setSummary(dayData?.summary ?? null);
    setSaveStatus('idle');
    setAiResponse(null);
    setAiStructured(null);
    setAiError(null);
    setAiRefineResult(null);
    setFoodStatuses({});
    setExerciseStatuses({});
  }, [dayData, dayLoading]);

  const liveSummary = useMemo(() => {
    if (exercises.length === 0 && foods.length === 0) return summary;
    return buildSummary(exercises, foods);
  }, [exercises, foods, summary]);

  useEffect(() => {
    if (!liveSummary) return;
    const balance = liveSummary.gastas - liveSummary.consumidas;
    if (prevBalanceRef.current !== null && prevBalanceRef.current !== balance) {
      setSummaryPulseKey((k) => k + 1);
    }
    prevBalanceRef.current = balance;
  }, [liveSummary]);

  useEffect(() => {
    if (sectionMode === 'alimentos') {
      foodInputRef.current?.focus();
    } else if (sectionMode === 'exercicios') {
      exerciseInputRef.current?.focus();
    }
  }, [sectionMode]);

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

  const executeSave = useCallback(
    (nextExercises: ExerciseEntry[], nextFoods: FoodEntry[]) => {
      if (!userId) return;

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
            if (synced) void hapticsSuccess();
            setTimeout(() => setSaveStatus('idle'), 3000);
          },
          onError: () => {
            setSaveStatus('pending-sync');
          },
        },
      );
    },
    [userId, selectedKey, saveMutation],
  );

  const triggerAutoSave = useCallback(
    (nextExercises: ExerciseEntry[], nextFoods: FoodEntry[]) => {
      if (!userId) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      setSaveStatus('saving');
      pendingSaveRef.current = () => executeSave(nextExercises, nextFoods);
      debounceRef.current = setTimeout(() => {
        pendingSaveRef.current?.();
        pendingSaveRef.current = null;
        debounceRef.current = null;
      }, 1500);
    },
    [userId, executeSave],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        pendingSaveRef.current?.();
        pendingSaveRef.current = null;
      }
    };
  }, []);

  const handleExercisesChange = (next: ExerciseEntry[]) => {
    setExercises(next);
    triggerAutoSave(next, foods);
  };

  const handleFoodsChange = (next: FoodEntry[]) => {
    setFoods(next);
    triggerAutoSave(exercises, next);
  };

  const handleSectionModeChange = (mode: SectionMode) => {
    setSectionModeState(mode);
    setSectionMode(mode);
  };

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return localLogDate(d);
  }, []);

  const yesterdayRow = useMemo(
    () => historyRows.find((row) => row.log_date === yesterdayKey),
    [historyRows, yesterdayKey],
  );

  const canRepeatYesterday =
    isToday &&
    exercises.length === 0 &&
    foods.length === 0 &&
    yesterdayRow != null;

  const handleRepeatYesterday = () => {
    if (!yesterdayRow) return;
    const parsed = parseDailyLogRow(yesterdayRow);
    handleExercisesChange(parsed.exercises);
    handleFoodsChange(parsed.foods);
  };

  const hasItems = exercises.length > 0 || foods.length > 0;

  const handleAiCalculate = async () => {
    if (!userId || !hasItems) return;
    setAiCalcLoading(true);
    setAiError(null);

    setFoodStatuses((prev) => ({
      ...prev,
      ...foods
        .filter((f) => !f.per100g?.calorias)
        .reduce<Record<string, FoodItemStatus>>(
          (acc, f) => ({ ...acc, [f.localKey ?? f.name]: 'calculating' }),
          {},
        ),
    }));
    setExerciseStatuses((prev) => ({
      ...prev,
      ...exercises
        .filter((e) => !e.caloriasPorMinuto)
        .reduce<Record<string, FoodItemStatus>>(
          (acc, e) => ({ ...acc, [e.localKey ?? e.name]: 'calculating' }),
          {},
        ),
    }));

    const localResult = buildSummary(exercises, foods);
    let result = localResult;

    try {
      const aiResult = await postNutritionSummary(exercises, foods);
      result = mergeNutritionSummary(localResult, aiResult);
      setSummary(result);
      setAiRefineResult({ before: localResult, after: result });
    } catch (err) {
      setSummary(localResult);
      const message = err instanceof Error ? err.message : 'Falha ao calcular com IA.';
      setAiError(`Cálculo local (offline): ${message}`);
    } finally {
      setFoodStatuses((prev) =>
        Object.fromEntries(Object.keys(prev).map((k) => [k, 'resolved' as FoodItemStatus])),
      );
      setExerciseStatuses((prev) =>
        Object.fromEntries(Object.keys(prev).map((k) => [k, 'resolved' as FoodItemStatus])),
      );
    }

    setSaveStatus('saving');
    saveMutation.mutate(
      { userId, logDate: selectedKey, exercises, foods, summary: result },
      {
        onSuccess: ({ synced }) => {
          setSaveStatus(synced ? 'saved' : 'pending-sync');
          if (synced) void hapticsSuccess();
          setTimeout(() => setSaveStatus('idle'), 3000);
        },
        onError: () => setSaveStatus('pending-sync'),
      },
    );

    setAiCalcLoading(false);
  };

  const weeklyCoachContext = useMemo(() => {
    const base = buildWeeklyCoachContext(historyRows, selectedDate);
    if (liveSummary && (exercises.length > 0 || foods.length > 0)) {
      return applyLiveDayToWeeklyContext(base, selectedKey, liveSummary, foods, exercises);
    }
    return base;
  }, [historyRows, selectedDate, selectedKey, liveSummary, exercises, foods]);

  const handleAiRecommendation = async (goalsText: string) => {
    const coachSummary = summary ?? liveSummary;
    if (!coachSummary) {
      setAiError('Adicione alimentos ou exercícios antes de pedir recomendações.');
      return;
    }
    if (cooldownSeconds > 0) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const result = await postAiRecommendations({
        resumo: coachSummary,
        userGoals: goalsText,
        logDate: selectedKey,
        weeklyContext: weeklyCoachContext,
        profileGoals: goals,
      });
      setAiResponse(result.recommendation);
      setAiStructured(result.structured ?? null);
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

  const streak = useMemo(() => computeStreak(historyRows), [historyRows]);

  const eventDates = historyRows
    .filter((row) => row.summary != null)
    .map((row) => parseLogDateString(row.log_date));

  const saveLabel: Record<SaveStatus, string | null> = {
    idle: null,
    saving: 'Salvando…',
    saved: 'Salvo ✓',
    'pending-sync': 'No celular — sincroniza online',
  };

  const saveLabelColor: Record<SaveStatus, string> = {
    idle: colors.textMuted,
    saving: colors.textMuted,
    saved: colors.points,
    'pending-sync': colors.accent,
  };

  const showExercises = sectionMode === 'ambos' || sectionMode === 'exercicios';
  const showFoods = sectionMode === 'ambos' || sectionMode === 'alimentos';

  const aiCalcLabel = !hasItems
    ? 'Adicione itens para calcular com IA'
    : summary
      ? 'Refinar com IA'
      : 'Calcular com IA';

  return (
    <div className="pt-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 justify-between min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
              Seu dia
            </h1>
            {streak > 0 && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                style={{ background: colors.accentSoft, color: colors.accent }}
              >
                <Flame className="w-3 h-3" aria-hidden />
                {streak} {streak === 1 ? 'dia' : 'dias'}
              </span>
            )}
            {saveStatus !== 'idle' && (
              <span
                className="text-xs font-medium transition-colors inline-flex items-center gap-1"
                style={{ color: saveLabelColor[saveStatus] }}
                aria-live="polite"
              >
                {saveStatus === 'pending-sync' && (
                  <CloudOff className="w-3 h-3 shrink-0" aria-hidden />
                )}
                {saveLabel[saveStatus]}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={aiCalcLoading || dayLoading || !hasItems}
            onClick={() => void handleAiCalculate()}
            className="shrink-0 p-2 rounded-xl border disabled:opacity-40"
            style={{
              background: hasItems ? colors.accentSoft : colors.surfaceWarm,
              borderColor: hasItems ? colors.accent : colors.border,
              color: hasItems ? colors.accent : colors.textMuted,
            }}
            aria-label={aiCalcLabel}
            title={aiCalcLabel}
          >
            {aiCalcLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : (
              <Brain className="w-5 h-5" aria-hidden />
            )}
          </button>
        </div>

        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          eventDates={eventDates}
        />

        <div
          className="flex rounded-xl border p-0.5 gap-0.5"
          style={{ background: colors.surfaceWarm, borderColor: colors.border }}
          role="tablist"
          aria-label="O que registrar"
        >
          {SECTION_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={sectionMode === id}
              onClick={() => handleSectionModeChange(id)}
              className="flex-1 text-[11px] font-semibold py-2 px-1 rounded-lg transition-colors"
              style={{
                background: sectionMode === id ? colors.surface : 'transparent',
                color: sectionMode === id ? colors.textPrimary : colors.textSecondary,
                boxShadow: sectionMode === id ? `0 1px 2px ${colors.border}` : undefined,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {canRepeatYesterday && (
          <button
            type="button"
            onClick={handleRepeatYesterday}
            className="w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium"
            style={{
              background: colors.surfaceWarm,
              borderColor: colors.border,
              color: colors.textSecondary,
            }}
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
            Repetir ontem
          </button>
        )}
      </div>

      {liveSummary && (
        <DaySummaryBar
          summary={liveSummary}
          showDashboardLink
          dashboardDate={selectedKey}
          goals={goals}
          pulseKey={summaryPulseKey}
        />
      )}

      {dayLoading ? (
        <div className="space-y-3" aria-label="Carregando registro do dia…">
          <Skeleton className="h-10 rounded-xl w-1/3" />
          <Skeleton className="h-20 rounded-2xl w-full" />
          <Skeleton className="h-10 rounded-xl w-1/3 mt-2" />
          <Skeleton className="h-20 rounded-2xl w-full" />
        </div>
      ) : (
        <>
          {showExercises && (
            <section className="space-y-3">
              <h2
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Exercícios
              </h2>
              <ExercisePicker
                entries={exercises}
                onChange={handleExercisesChange}
                inputRef={exerciseInputRef}
                statuses={exerciseStatuses}
              />
            </section>
          )}

          {showFoods && (
            <section className="space-y-3">
              <h2
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Alimentos
              </h2>
              <FoodPicker entries={foods} onChange={handleFoodsChange} inputRef={foodInputRef} statuses={foodStatuses} />
            </section>
          )}
        </>
      )}

      {liveSummary && !dayLoading && <MacroChart summary={liveSummary} />}

      {!dayLoading && (
        <CoachSection
          onRequest={handleAiRecommendation}
          isLoading={aiLoading}
          cooldownSeconds={cooldownSeconds}
          response={aiResponse}
          structured={aiStructured}
          error={aiError}
          hasSummary={Boolean(summary ?? liveSummary)}
        />
      )}

      {aiRefineResult && (
        <AiRefineResultCard
          before={aiRefineResult.before}
          after={aiRefineResult.after}
          onConfirm={() => {
            void hapticsSuccess();
            setAiRefineResult(null);
          }}
        />
      )}
    </div>
  );
}
