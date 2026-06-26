import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SkeletonText } from './SkeletonText';
import { colors } from '../theme/colors';
import type { DiaryEntry } from '../types/nutrition';

interface DiaryLineProps {
  entry: DiaryEntry;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
}

function CalorieDisplay({ entry }: { entry: DiaryEntry }) {
  if (entry.status === 'calculating') {
    return <SkeletonText />;
  }

  const kcal = entry.kcal ?? 0;
  const isExercise = entry.type === 'exercise';
  const prefix = isExercise ? '-' : '+';
  const color = isExercise ? colors.points : entry.isNew ? colors.accent : colors.textSecondary;

  return (
    <span
      style={{
        color: kcal === 0 ? colors.textMuted : color,
        fontSize: 14,
        fontWeight: kcal > 0 ? 500 : 400,
        minWidth: 90,
        textAlign: 'right',
        display: 'inline-block',
      }}
    >
      {kcal > 0 ? `${prefix}${kcal}` : '0'} cal
    </span>
  );
}

export function DiaryLine({ entry, onDelete, onEdit }: DiaryLineProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.rawText);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (entry.status === 'calculating') return;
    setDraft(entry.rawText);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== entry.rawText) {
      onEdit?.(entry.id, trimmed);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(entry.rawText);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '13px 0',
        borderBottom: `1px solid ${colors.border}`,
        gap: 8,
      }}
    >
      {/* texto / input inline */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
            if (e.key === 'Escape') cancelEdit();
          }}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 15,
            color: colors.textPrimary,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
          }}
        />
      ) : (
        <span
          role="button"
          tabIndex={0}
          onClick={startEdit}
          onKeyDown={(e) => e.key === 'Enter' && startEdit()}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.textPrimary,
            minWidth: 0,
            cursor: entry.status === 'calculating' ? 'default' : 'text',
          }}
        >
          {entry.rawText}
        </span>
      )}

      {/* calorias ou botão X durante edição */}
      {editing ? (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onDelete?.(entry.id); }}
          aria-label={`Remover ${entry.rawText}`}
          style={{
            flexShrink: 0,
            padding: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      ) : (
        <CalorieDisplay entry={entry} />
      )}
    </div>
  );
}
