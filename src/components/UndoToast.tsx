import React, { useEffect } from 'react';
import { colors } from '../theme/colors';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [onDismiss, duration]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg max-w-[calc(100%-2rem)]"
      style={{ bottom: '6.5rem', background: colors.textPrimary, color: colors.surface }}
      role="status"
      aria-live="polite"
    >
      <span className="text-sm flex-1 min-w-0 truncate">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 text-sm font-semibold px-2 py-1 rounded-lg"
        style={{ color: colors.accent }}
      >
        Desfazer
      </button>
    </div>
  );
}
