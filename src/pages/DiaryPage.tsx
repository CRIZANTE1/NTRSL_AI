import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloudOff, Flame } from 'lucide-react';
import { DiaryInput } from '../components/DiaryInput';
import { DiaryLine } from '../components/DiaryLine';
import { DiaryTotalsBar } from '../components/DiaryTotalsBar';
import { Skeleton } from '../components/ui/Skeleton';
import CalendarStrip from '../components/CalendarStrip';
import { useAuth } from '../contexts/AuthContext';
import {
  computeStreak,
  localLogDate,
  parseLogDateString,
} from '../lib/data/dailyLogs';
import {
  buildSummaryFromDiary,
  diaryEntriesToPersistence,
  parseDiaryFromStoredEntries,
} from '../lib/diary';
import { hapticsSuccess } from '../lib/haptics';
import { generateUUID } from '../lib/uuid';
import { useDailyLog, useSaveDailyLog } from '../hooks/useDailyLog';
import { useDailyLogHistory } from '../hooks/useDailyLogHistory';
import { useDiaryProcessor } from '../hooks/useDiaryProcessor';
import { colors } from '../theme/colors';
import type { DiaryEntry } from '../types/nutrition';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'pending-sync';

export default function DiaryPage() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedKey = localLogDate(selectedDate);

  const { data: dayData, isLoading: dayLoading } = useDailyLog(userId, selectedKey);
  const { data: historyRows = [] } = useDailyLogHistory(userId, 30);
  const saveMutation = useSaveDailyLog();

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      pendingSaveRef.current = null;
      setDiaryEntries([]);
      setSaveStatus('idle');
    }
  }, [userId]);

  useEffect(() => {
    if (dayLoading) return;
    const foods = dayData?.foods ?? [];
    const exercises = dayData?.exercises ?? [];
    setDiaryEntries(parseDiaryFromStoredEntries(foods, exercises));
    setSaveStatus('idle');
  }, [dayData, dayLoading]);

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

  const executeSave = useCallback(
    (entries: DiaryEntry[]) => {
      if (!userId) return;
      const { foods, exercises } = diaryEntriesToPersistence(entries);
      const localSummary = buildSummaryFromDiary(entries);

      saveMutation.mutate(
        { userId, logDate: selectedKey, exercises, foods, summary: localSummary },
        {
          onSuccess: ({ synced }) => {
            setSaveStatus(synced ? 'saved' : 'pending-sync');
            if (synced) void hapticsSuccess();
            setTimeout(() => setSaveStatus('idle'), 3000);
          },
          onError: () => setSaveStatus('pending-sync'),
        },
      );
    },
    [userId, selectedKey, saveMutation],
  );

  const triggerAutoSave = useCallback(
    (entries: DiaryEntry[]) => {
      if (!userId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveStatus('saving');
      pendingSaveRef.current = () => executeSave(entries);
      debounceRef.current = setTimeout(() => {
        pendingSaveRef.current?.();
        pendingSaveRef.current = null;
        debounceRef.current = null;
      }, 1500);
    },
    [userId, executeSave],
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<DiaryEntry>) => {
      setDiaryEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        const stillCalculating = next.some((e) => e.status === 'calculating');
        if (!stillCalculating) triggerAutoSave(next);
        return next;
      });
    },
    [triggerAutoSave],
  );

  useDiaryProcessor(diaryEntries, updateEntry);

  const handleAddEntry = (rawText: string) => {
    const newEntry: DiaryEntry = {
      id: generateUUID(),
      rawText,
      status: 'calculating',
      createdAt: new Date().toISOString(),
    };
    setDiaryEntries((prev) => [...prev, newEntry]);
  };

  const handleDeleteEntry = useCallback(
    (id: string) => {
      setDiaryEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        triggerAutoSave(next);
        return next;
      });
    },
    [triggerAutoSave],
  );

  const handleEditEntry = useCallback(
    (id: string, newText: string) => {
      setDiaryEntries((prev) => {
        const next = prev.map((e) =>
          e.id === id
            ? { ...e, rawText: newText, status: 'calculating' as const, kcal: undefined, isNew: undefined }
            : e,
        );
        return next;
      });
    },
    [],
  );

  const liveSummary = useMemo(
    () => buildSummaryFromDiary(diaryEntries),
    [diaryEntries],
  );

  const hasTotals =
    liveSummary.consumidas > 0 ||
    liveSummary.gastas > 0 ||
    liveSummary.proteina > 0;

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

  const totalKcal = liveSummary.consumidas - liveSummary.gastas;

  return (
    <div className="pt-4 pb-32 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
            Diário
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

        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          eventDates={eventDates}
          compact
        />
      </div>

      {dayLoading ? (
        <div className="space-y-3" aria-label="Carregando diário…">
          <Skeleton className="h-10 rounded-xl w-2/3" />
          <Skeleton className="h-10 rounded-xl w-full" />
          <Skeleton className="h-10 rounded-xl w-1/2" />
        </div>
      ) : (
        <div>
          {diaryEntries.map((entry) => (
            <DiaryLine
              key={entry.id}
              entry={entry}
              onDelete={handleDeleteEntry}
              onEdit={handleEditEntry}
            />
          ))}
          <DiaryInput onSubmit={handleAddEntry} disabled={dayLoading} />
        </div>
      )}

      {hasTotals && (
        <DiaryTotalsBar
          kcal={totalKcal}
          carbs={liveSummary.carboidratos}
          protein={liveSummary.proteina}
          fat={liveSummary.gordura}
        />
      )}
    </div>
  );
}
