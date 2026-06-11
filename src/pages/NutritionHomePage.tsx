import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ExercisePicker } from '../components/ExercisePicker';
import { FoodPicker } from '../components/FoodPicker';
import { MacroChart } from '../components/MacroChart';
import { CooldownBanner } from '../components/CooldownBanner';
import { useAuth } from '../contexts/AuthContext';
import { fetchDailyLog, parseDailyLogRow, saveDailyLog } from '../lib/data/dailyLogs';
import { buildSummary } from '../lib/nutrition';
import { getAiCooldown, postAiRecommendations, postNutritionSummary } from '../lib/api';
import { colors } from '../theme/colors';
import type { ExerciseEntry, FoodEntry, NutritionSummary } from '../types/nutrition';

export default function NutritionHomePage() {
  const { session } = useAuth();
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [userGoals, setUserGoals] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcNotice, setCalcNotice] = useState<string | null>(null);
  const [dayLoading, setDayLoading] = useState(true);

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

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setDayLoading(false);
      return;
    }

    let alive = true;
    void (async () => {
      try {
        const row = await fetchDailyLog(userId);
        if (!alive || !row) return;
        const parsed = parseDailyLogRow(row);
        setExercises(parsed.exercises);
        setFoods(parsed.foods);
        setSummary(parsed.summary);
      } catch {
        // mantém estado vazio se falhar
      } finally {
        if (alive) setDayLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const handleCalculate = async () => {
    setCalcLoading(true);
    setCalcNotice(null);
    setAiResponse(null);
    setAiError(null);

    let result: NutritionSummary;
    try {
      result = await postNutritionSummary(exercises, foods);
      setSummary(result);
    } catch (err) {
      result = buildSummary(exercises, foods);
      setSummary(result);
      const message = err instanceof Error ? err.message : 'Falha ao calcular com IA.';
      setCalcNotice(`Cálculo local (offline): ${message}`);
    }

    const userId = session?.user?.id;
    if (userId) {
      const { synced } = await saveDailyLog({
        userId,
        exercises,
        foods,
        summary: result,
      });
      if (!synced) {
        setCalcNotice((prev) =>
          prev ? `${prev} Registro salvo localmente para sincronizar depois.` : 'Registro salvo localmente para sincronizar depois.',
        );
      }
    }

    setCalcLoading(false);
  };

  const handleAiRequest = async () => {
    if (!summary) {
      setAiError('Calcule o resumo antes de solicitar recomendações.');
      return;
    }
    if (cooldownSeconds > 0) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const result = await postAiRecommendations(summary, userGoals.trim());
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

  return (
    <div className="pt-4 space-y-6">
      <div>
        <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
          Seu dia
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Registre exercícios e alimentos para acompanhar calorias e macros.
        </p>
        {dayLoading && (
          <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
            Carregando registro de hoje…
          </p>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
          Exercícios
        </h2>
        <ExercisePicker entries={exercises} onChange={setExercises} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
          Alimentos
        </h2>
        <FoodPicker entries={foods} onChange={setFoods} />
      </section>

      <button
        type="button"
        disabled={calcLoading}
        onClick={() => void handleCalculate()}
        className="w-full rounded-2xl py-3.5 font-semibold disabled:opacity-60"
        style={{ background: colors.accent, color: colors.textPrimary }}
      >
        {calcLoading ? 'Calculando com IA…' : 'Calcular resumo'}
      </button>

      {calcNotice && (
        <p
          className="text-sm rounded-xl px-3 py-2 border"
          style={{
            background: colors.surfaceWarm,
            borderColor: colors.border,
            color: colors.textSecondary,
          }}
        >
          {calcNotice}
        </p>
      )}

      {summary && (
        <section className="space-y-4">
          <div
            className="rounded-2xl border p-4 grid grid-cols-2 gap-3"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <div>
              <p className="text-xs uppercase" style={{ color: colors.textSecondary }}>
                Gastas
              </p>
              <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                {summary.gastas} kcal
              </p>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: colors.textSecondary }}>
                Consumidas
              </p>
              <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                {summary.consumidas} kcal
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase mb-1" style={{ color: colors.textSecondary }}>
                Balanço
              </p>
              <p
                className="text-lg font-semibold"
                style={{
                  color:
                    summary.consumidas - summary.gastas > 0
                      ? colors.accent
                      : colors.points,
                }}
              >
                {summary.consumidas - summary.gastas > 0 ? '+' : ''}
                {Math.round((summary.consumidas - summary.gastas) * 10) / 10} kcal
              </p>
            </div>
          </div>

          <MacroChart summary={summary} />

          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
              Recomendação IA
            </h2>

            {cooldownSeconds > 0 && <CooldownBanner remainingSeconds={cooldownSeconds} />}

            <textarea
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
              rows={3}
              placeholder="Descreva suas metas (ex.: perder peso, ganhar massa, comer mais proteína...)"
              className="w-full rounded-2xl border px-4 py-3 text-sm resize-none"
              style={{
                background: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
            />

            <button
              type="button"
              disabled={aiLoading || cooldownSeconds > 0}
              onClick={() => void handleAiRequest()}
              className="w-full rounded-2xl py-3.5 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: colors.points, color: colors.textPrimary }}
            >
              <Sparkles className="w-4 h-4" />
              {aiLoading ? 'Gerando recomendação…' : 'Pedir recomendação da IA'}
            </button>

            {aiError && (
              <p
                className="text-sm rounded-xl px-3 py-2 border"
                style={{
                  background: colors.surfaceWarm,
                  borderColor: colors.border,
                  color: colors.badge,
                }}
              >
                {aiError}
              </p>
            )}

            {aiResponse && (
              <div
                className="rounded-2xl border p-4 text-sm whitespace-pre-wrap"
                style={{
                  background: colors.surfaceWarm,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
              >
                {aiResponse}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
