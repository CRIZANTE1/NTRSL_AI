import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { Clock, Loader2, Search, X } from 'lucide-react';
import { UndoToast } from './UndoToast';
import { postExerciseSearch } from '../lib/api';
import { hapticsImpactLight } from '../lib/haptics';
import { getRecentExercises, isUiCompact, pushRecentExercise } from '../lib/recentItems';
import { calcularCaloriasExercicioFromEntry, getExerciseNames } from '../lib/nutrition';
import { colors } from '../theme/colors';
import { ExerciseCalorieDisplay } from './ExerciseCalorieDisplay';
import type { ExerciseEntry, ExerciseSearchResult, FoodItemStatus } from '../types/nutrition';

interface ExercisePickerProps {
  entries: ExerciseEntry[];
  onChange: (entries: ExerciseEntry[]) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  statuses?: Record<string, FoodItemStatus>;
}

function sourceLabel(result: Pick<ExerciseSearchResult, 'caloriasPorMinuto'>): string {
  if (result.caloriasPorMinuto > 0) return 'c/ macros';
  return 'estimado';
}

function entryKey(entry: Pick<ExerciseEntry, 'name' | 'wgerId' | 'localKey'>): string {
  return `${entry.wgerId ?? ''}:${entry.localKey ?? entry.name}`;
}

function parseDecimalInput(raw: string): number {
  const normalized = raw.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function ResultButton({
  result,
  disabled,
  onSelect,
}: {
  result: ExerciseSearchResult;
  disabled: boolean;
  onSelect: (r: ExerciseSearchResult) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(result)}
      className="w-full text-left px-4 py-2.5 text-sm disabled:opacity-40 hover:brightness-95"
      style={{ color: colors.textPrimary }}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate">{result.name}</span>
        <span
          className="shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md"
          style={{ background: colors.surfaceWarm, color: colors.textSecondary }}
        >
          {sourceLabel(result)}
        </span>
      </span>
      {result.nameEn && result.nameEn !== result.name && (
        <span className="block text-xs truncate mt-0.5" style={{ color: colors.textMuted }}>
          {result.nameEn}
        </span>
      )}
    </button>
  );
}

export function ExercisePicker({ entries, onChange, inputRef, statuses }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [remoteResults, setRemoteResults] = useState<ExerciseSearchResult[]>([]);
  const [undoEntry, setUndoEntry] = useState<ExerciseEntry | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const compact = isUiCompact();
  const allNames = useMemo(() => getExerciseNames(), []);

  const fuse = useMemo(
    () => new Fuse(allNames, { threshold: 0.35, ignoreLocation: true }),
    [allNames],
  );

  const localFallback = useMemo(() => {
    if (!query.trim()) return allNames.slice(0, 12);
    return fuse.search(query.trim()).map((r) => r.item).slice(0, 12);
  }, [allNames, fuse, query]);

  useEffect(() => {
    function handleClose() {
      setOpen(false);
    }

    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleClose, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleClose, { capture: true });
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRemoteResults([]);
      setSearchError(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setSearchError(null);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await postExerciseSearch(trimmed, 12);
          if (!alive) return;
          setRemoteResults(response.results);
        } catch (err) {
          if (!alive) return;
          setRemoteResults([]);
          setSearchError(err instanceof Error ? err.message : 'Falha na busca.');
        } finally {
          if (alive) setLoading(false);
        }
      })();
    }, 400);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const selectedKeys = useMemo(() => new Set(entries.map((e) => entryKey(e))), [entries]);

  const recentExercises = useMemo(
    () => getRecentExercises().filter((r) => !selectedKeys.has(entryKey(r))),
    [selectedKeys],
  );

  const displayResults = useMemo((): ExerciseSearchResult[] => {
    if (query.trim().length >= 2) {
      if (remoteResults.length > 0) return remoteResults;
      if (!loading) {
        return localFallback.map((name) => ({
          id: null,
          name,
          nameEn: null,
          source: 'local' as const,
          wgerId: null,
          localKey: name,
          matchScore: 1,
          caloriasPorMinuto: 0,
          category: null,
        }));
      }
      return [];
    }
    return localFallback.map((name) => ({
      id: null,
      name,
      nameEn: null,
      source: 'local' as const,
      wgerId: null,
      localKey: name,
      matchScore: 1,
      caloriasPorMinuto: 0,
      category: null,
    }));
  }, [localFallback, loading, query, remoteResults]);

  const addExercise = (result: ExerciseSearchResult) => {
    const key = entryKey({
      name: result.name,
      wgerId: result.wgerId,
      localKey: result.localKey,
    });
    if (selectedKeys.has(key)) return;

    const hasRemoteCalorias = result.source !== 'local' || result.caloriasPorMinuto > 0;

    pushRecentExercise(result);
    void hapticsImpactLight();

    onChange([
      ...entries,
      {
        name: result.name,
        durationMinutes: 30,
        exerciseCatalogId: result.id,
        wgerId: result.wgerId,
        localKey: result.localKey,
        source: result.source,
        ...(hasRemoteCalorias ? { caloriasPorMinuto: result.caloriasPorMinuto } : {}),
      },
    ]);
    setQuery('');
    setOpen(false);
  };

  const removeExercise = (entry: ExerciseEntry) => {
    onChange(entries.filter((e) => entryKey(e) !== entryKey(entry)));
    setUndoEntry(entry);
  };

  const handleUndo = useCallback(() => {
    if (!undoEntry) return;
    onChange([...entries, undoEntry]);
    setUndoEntry(null);
  }, [undoEntry, entries, onChange]);

  const dismissUndo = useCallback(() => setUndoEntry(null), []);

  const updateDuration = (entry: ExerciseEntry, durationMinutes: number) => {
    const key = entryKey(entry);
    onChange(
      entries.map((e) => (entryKey(e) === key ? { ...e, durationMinutes } : e)),
    );
  };

  const entryPadding = compact ? 'p-2' : 'p-3';
  const inputPadding = compact ? 'py-2' : 'py-3';

  return (
    <div className="space-y-3">
      <div className="relative" ref={containerRef}>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: colors.textMuted }}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar exercício..."
          className={`w-full rounded-2xl border pl-10 pr-10 text-sm ${inputPadding}`}
          style={{
            background: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
            style={{ color: colors.textMuted }}
          />
        )}
        {open && (recentExercises.length > 0 || displayResults.length > 0) && (
          <div
            className="absolute z-20 mt-1 w-full rounded-2xl border shadow-lg max-h-56 overflow-y-auto"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            {!query.trim() && recentExercises.length > 0 && (
              <>
                <p
                  className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase flex items-center gap-1"
                  style={{ color: colors.textMuted }}
                >
                  <Clock className="w-3 h-3" aria-hidden />
                  Recentes
                </p>
                {recentExercises.map((result) => (
                  <ResultButton
                    key={`recent:${result.wgerId ?? result.localKey ?? result.name}`}
                    result={result}
                    disabled={false}
                    onSelect={addExercise}
                  />
                ))}
              </>
            )}
            {displayResults.map((result) => {
              const disabled = selectedKeys.has(
                entryKey({
                  name: result.name,
                  wgerId: result.wgerId,
                  localKey: result.localKey,
                }),
              );
              return (
                <ResultButton
                  key={`${result.source}:${result.wgerId ?? result.localKey ?? result.name}`}
                  result={result}
                  disabled={disabled}
                  onSelect={addExercise}
                />
              );
            })}
          </div>
        )}
      </div>

      {searchError && query.trim().length >= 2 && (
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          Busca online indisponível ({searchError}). Mostrando sugestões locais.
        </p>
      )}

      {entries.length === 0 && (
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Nenhum exercício selecionado.
        </p>
      )}

      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {entries.map((entry) => (
          <div
            key={entryKey(entry)}
            className={`flex items-center gap-2 rounded-2xl border ${entryPadding}`}
            style={{ background: colors.surfaceWarm, borderColor: colors.border }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                {entry.name}
              </p>
              <label className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  Duração (min)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={entry.durationMinutes}
                  onChange={(e) => {
                    const parsed = parseDecimalInput(e.target.value);
                    if (!Number.isNaN(parsed)) {
                      updateDuration(entry, Math.max(1, Math.min(600, Math.round(parsed))));
                    }
                  }}
                  className="w-20 rounded-lg border px-2 py-1 text-sm"
                  style={{
                    background: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </label>
            </div>
            <ExerciseCalorieDisplay
              kcal={Math.round(calcularCaloriasExercicioFromEntry(entry))}
              status={statuses?.[entry.localKey ?? entry.name]}
            />
            <button
              type="button"
              onClick={() => removeExercise(entry)}
              className="p-2 rounded-xl"
              aria-label={`Remover ${entry.name}`}
            >
              <X className="w-4 h-4" style={{ color: colors.textMuted }} />
            </button>
          </div>
        ))}
      </div>

      {undoEntry && (
        <UndoToast
          message={`${undoEntry.name} removido`}
          onUndo={handleUndo}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  );
}
