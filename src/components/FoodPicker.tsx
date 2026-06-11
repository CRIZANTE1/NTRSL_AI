import React, { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { getFoodNames } from '../lib/nutrition';
import { colors } from '../theme/colors';
import type { FoodEntry } from '../types/nutrition';

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

export function FoodPicker({ entries, onChange }: FoodPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const allNames = useMemo(() => getFoodNames(), []);

  const fuse = useMemo(
    () => new Fuse(allNames, { threshold: 0.35, ignoreLocation: true }),
    [allNames],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allNames.slice(0, 12);
    return fuse.search(query.trim()).map((r) => r.item).slice(0, 12);
  }, [allNames, fuse, query]);

  const selectedSet = useMemo(() => new Set(entries.map((e) => e.name)), [entries]);

  const addFood = (name: string) => {
    if (selectedSet.has(name)) return;
    onChange([...entries, { name, quantity: defaultQuantity(name) }]);
    setQuery('');
    setOpen(false);
  };

  const removeFood = (name: string) => {
    onChange(entries.filter((e) => e.name !== name));
  };

  const updateQuantity = (name: string, quantity: number) => {
    onChange(entries.map((e) => (e.name === name ? { ...e, quantity } : e)));
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
                onClick={() => addFood(name)}
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
          Nenhum alimento selecionado.
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
                  Quantidade ({quantityUnit(entry.name)})
                </span>
                <input
                  type="number"
                  min={0.1}
                  step={entry.name.toLowerCase() === 'água' ? 0.1 : 1}
                  value={entry.quantity}
                  onChange={(e) =>
                    updateQuantity(entry.name, Math.max(0.1, Number(e.target.value) || 0.1))
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
              onClick={() => removeFood(entry.name)}
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
