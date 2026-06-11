import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDailyLogHistory, parseDailyLogRow } from '../lib/data/dailyLogs';
import { MacroChart } from '../components/MacroChart';
import { colors } from '../theme/colors';
import type { Database } from '../types/supabase';
import type { NutritionSummary } from '../types/nutrition';

type DailyLogRow = Database['public']['Tables']['daily_logs']['Row'];

function formatLogDate(logDate: string): string {
  const [y, m, d] = logDate.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function LogCard({ row }: { row: DailyLogRow }) {
  const [open, setOpen] = useState(false);
  const parsed = parseDailyLogRow(row);
  const summary = parsed.summary as NutritionSummary | null;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: colors.surface, borderColor: colors.border }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="font-medium capitalize" style={{ color: colors.textPrimary }}>
            {formatLogDate(row.log_date)}
          </p>
          {summary ? (
            <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
              {summary.consumidas} kcal consumidas · {summary.gastas} kcal gastas
            </p>
          ) : (
            <p className="text-sm mt-0.5" style={{ color: colors.textMuted }}>
              Registro sem resumo calculado
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0" style={{ color: colors.textMuted }} />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0" style={{ color: colors.textMuted }} />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: colors.border }}>
          {parsed.exercises.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: colors.textSecondary }}>
                Exercícios
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textPrimary }}>
                {parsed.exercises.map((ex) => (
                  <li key={`${ex.name}-${ex.durationMinutes}`}>
                    {ex.name} — {ex.durationMinutes} min
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.foods.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: colors.textSecondary }}>
                Alimentos
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textPrimary }}>
                {parsed.foods.map((food) => (
                  <li key={`${food.name}-${food.quantity}`}>
                    {food.name} — {food.quantity}
                    {food.name.toLowerCase() === 'água' ? ' L' : ' g'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary && <MacroChart summary={summary} />}
        </div>
      )}
    </div>
  );
}

export default function HistoricoPage() {
  const { session } = useAuth();
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchDailyLogHistory(session.user.id);
      setLogs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <div className="pt-4 pb-8">
      <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
        Histórico
      </h1>
      <p className="text-sm mt-1 mb-6" style={{ color: colors.textSecondary }}>
        Seus registros diários sincronizados com a nuvem.
      </p>

      {loading && (
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Carregando…
        </p>
      )}

      {error && (
        <p
          className="text-sm rounded-xl px-3 py-2 border mb-4"
          style={{ background: colors.surfaceWarm, borderColor: colors.border, color: colors.badge }}
        >
          {error}
        </p>
      )}

      {!loading && !error && logs.length === 0 && (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <CalendarDays
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: colors.textMuted }}
          />
          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
            Nenhum registro salvo ainda
          </p>
          <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
            Calcule o resumo na Home para salvar o dia automaticamente.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {logs.map((row) => (
          <LogCard key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
