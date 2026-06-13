import React, { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Loader2, Search, X } from 'lucide-react';
import { postFoodSearch } from '../lib/api';
import { getFoodNames } from '../lib/nutrition';
import { colors } from '../theme/colors';
import type { FoodEntry, FoodSearchResult } from '../types/nutrition';

interface FoodPickerProps {
  entries: FoodEntry[];
  onChange: (entries: FoodEntry[]) => void;
}

function defaultQuantity(name: string): number {
  return name.toLowerCase() === 'água' ? 0.5 : 100;
}

function quantityUnit(name: string): string {
  return name.toLowerCase() === 'água' ? 'L' : 'g';
}

function sourceLabel(source: FoodSearchResult['source']): string {
  if (source === 'local') return 'Local';
  if (source === 'cache') return 'Cache';
  return 'USDA';
}

function entryKey(entry: Pick<FoodEntry, 'name' | 'fdcId' | 'localKey'>): string {
  return `${entry.fdcId ?? ''}:${entry.localKey ?? entry.name}`;
}

export function FoodPicker({ entries, onChange }: FoodPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [remoteResults, setRemoteResults] = useState<FoodSearchResult[]>([]);
  const allNames = useMemo(() => getFoodNames(), []);

  const fuse = useMemo(
    () => new Fuse(allNames, { threshold: 0.35, ignoreLocation: true }),
    [allNames],
  );

  const localFallback = useMemo(() => {
    if (!query.trim()) return allNames.slice(0, 12);
    return fuse.search(query.trim()).map((r) => r.item).slice(0, 12);
  }, [allNames, fuse, query]);

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
          const response = await postFoodSearch(trimmed, 12);
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

  const displayResults = useMemo((): FoodSearchResult[] => {
    if (query.trim().length >= 2) {
      if (remoteResults.length > 0) return remoteResults;
      if (!loading) {
        return localFallback.map((name) => ({
          id: null,
          name,
          nameEn: null,
          source: 'local' as const,
          fdcId: null,
          localKey: name,
          matchScore: 1,
          per100g: { calorias: 0, proteina: 0, carboidratos: 0, gordura: 0 },
        }));
      }
      return [];
    }
    return localFallback.map((name) => ({
      id: null,
      name,
      nameEn: null,
      source: 'local' as const,
      fdcId: null,
      localKey: name,
      matchScore: 1,
      per100g: { calorias: 0, proteina: 0, carboidratos: 0, gordura: 0 },
    }));
  }, [localFallback, loading, query, remoteResults]);

  const addFood = (result: FoodSearchResult) => {
    const key = entryKey({
      name: result.name,
      fdcId: result.fdcId,
      localKey: result.localKey,
    });
    if (selectedKeys.has(key)) return;

    const hasRemoteMacros =
      result.source !== 'local' ||
      (result.per100g.calorias + result.per100g.proteina + result.per100g.carboidratos + result.per100g.gordura) > 0;

    onChange([
      ...entries,
      {
        name: result.name,
        quantity: defaultQuantity(result.name),
        foodCatalogId: result.id,
        fdcId: result.fdcId,
        localKey: result.localKey,
        source: result.source,
        ...(hasRemoteMacros ? { per100g: result.per100g } : {}),
      },
    ]);
    setQuery('');
    setOpen(false);
  };

  const removeFood = (entry: FoodEntry) => {
    onChange(entries.filter((e) => entryKey(e) !== entryKey(entry)));
  };

  const updateQuantity = (entry: FoodEntry, quantity: number) => {
    const key = entryKey(entry);
    onChange(entries.map((e) => (entryKey(e) === key ? { ...e, quantity } : e)));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: colors.textMuted }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar alimento..."
          className="w-full rounded-2xl border pl-10 pr-10 py-3 text-sm"
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
        {open && displayResults.length > 0 && (
          <div
            className="absolute z-20 mt-1 w-full rounded-2xl border shadow-lg max-h-56 overflow-y-auto"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            {displayResults.map((result) => {
              const disabled = selectedKeys.has(
                entryKey({
                  name: result.name,
                  fdcId: result.fdcId,
                  localKey: result.localKey,
                }),
              );
              return (
                <button
                  key={`${result.source}:${result.fdcId ?? result.localKey ?? result.name}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => addFood(result)}
                  className="w-full text-left px-4 py-2.5 text-sm disabled:opacity-40 hover:brightness-95"
                  style={{ color: colors.textPrimary }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">{result.name}</span>
                    <span
                      className="shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md"
                      style={{
                        background: colors.surfaceWarm,
                        color: colors.textSecondary,
                      }}
                    >
                      {sourceLabel(result.source)}
                    </span>
                  </span>
                  {result.nameEn && result.nameEn !== result.name && (
                    <span className="block text-xs truncate mt-0.5" style={{ color: colors.textMuted }}>
                      {result.nameEn}
                    </span>
                  )}
                </button>
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
          Nenhum alimento selecionado.
        </p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entryKey(entry)}
            className="flex items-center gap-2 rounded-2xl border p-3"
            style={{ background: colors.surfaceWarm, borderColor: colors.border }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                {entry.name}
              </p>
              <label className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  Quantidade ({quantityUnit(entry.name)})
                </span>
                <input
                  type="number"
                  min={0.1}
                  step={entry.name.toLowerCase() === 'água' ? 0.1 : 1}
                  value={entry.quantity}
                  onChange={(e) =>
                    updateQuantity(entry, Math.max(0.1, Number(e.target.value) || 0.1))
                  }
                  className="w-24 rounded-lg border px-2 py-1 text-sm"
                  style={{
                    background: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => removeFood(entry)}
              className="p-2 rounded-xl"
              aria-label={`Remover ${entry.name}`}
            >
              <X className="w-4 h-4" style={{ color: colors.textMuted }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
