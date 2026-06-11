import React, { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { getExerciseNames } from '../lib/nutrition';
import { colors } from '../theme/colors';
import type { ExerciseEntry } from '../types/nutrition';

interface ExercisePickerProps {
  entries: ExerciseEntry[];
  onChange: (entries: ExerciseEntry[]) => void;
}

export function ExercisePicker({ entries, onChange }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const allNames = useMemo(() => getExerciseNames(), []);

  const fuse = useMemo(
    () => new Fuse(allNames, { threshold: 0.35, ignoreLocation: true }),
    [allNames],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allNames.slice(0, 12);
    return fuse.search(query.trim()).map((r) => r.item).slice(0, 12);
  }, [allNames, fuse, query]);

  const selectedSet = useMemo(() => new Set(entries.map((e) => e.name)), [entries]);

  const addExercise = (name: string) => {
    if (selectedSet.has(name)) return;
    onChange([...entries, { name, durationMinutes: 30 }]);
    setQuery('');
    setOpen(false);
  };

  const removeExercise = (name: string) => {
    onChange(entries.filter((e) => e.name !== name));
  };

  const updateDuration = (name: string, durationMinutes: number) => {
    onChange(
      entries.map((e) => (e.name === name ? { ...e, durationMinutes } : e)),
    );
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
          placeholder="Buscar exercício..."
          className="w-full rounded-2xl border pl-10 pr-4 py-3 text-sm"
          style={{
            background: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
        />
        {open && filtered.length > 0 && (
          <div
            className="absolute z-20 mt-1 w-full rounded-2xl border shadow-lg max-h-48 overflow-y-auto"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                disabled={selectedSet.has(name)}
                onClick={() => addExercise(name)}
                className="w-full text-left px-4 py-2.5 text-sm disabled:opacity-40 hover:brightness-95"
                style={{ color: colors.textPrimary }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {entries.length === 0 && (
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Nenhum exercício selecionado.
        </p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center gap-2 rounded-2xl border p-3"
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
                  type="number"
                  min={1}
                  max={600}
                  value={entry.durationMinutes}
                  onChange={(e) =>
                    updateDuration(entry.name, Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-20 rounded-lg border px-2 py-1 text-sm"
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
              onClick={() => removeExercise(entry.name)}
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
