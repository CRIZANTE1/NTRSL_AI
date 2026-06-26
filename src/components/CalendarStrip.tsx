import React, { useEffect, useMemo, useState } from 'react';
import { colors } from '../theme/colors';

export interface CalendarStripProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  /** Dias visíveis. Default: 7 (hoje ±3) */
  visibleDays?: number;
  /** Datas com dot (registro existente). Sem essa prop, nenhum dot é exibido. */
  eventDates?: Date[];
  /** Versão menor para telas compactas (ex: Diário) */
  compact?: boolean;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatWeekdayShort(date: Date) {
  const raw = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date);
  return raw.replace('.', '').slice(0, 3).toUpperCase();
}

const Day: React.FC<{
  date: Date;
  isSelected: boolean;
  hasDot?: boolean;
  compact?: boolean;
  onClick: () => void;
}> = ({ date, isSelected, hasDot, compact = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-all ${
        compact ? 'w-[40px] rounded-2xl' : 'w-[56px] rounded-3xl gap-1'
      }`}
      style={{
        background: isSelected ? colors.textPrimary : colors.surface,
        border: `1px solid ${colors.border}`,
        padding: compact
          ? isSelected ? '8px 6px' : '6px 6px'
          : isSelected ? '20px 12px' : '16px 12px',
        cursor: 'pointer',
      }}
    >
      {hasDot && !isSelected && (
        <div
          className={`rounded-full mb-[-2px] ${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}
          style={{ background: colors.badge }}
        />
      )}
      <span
        className={`font-semibold uppercase truncate w-full text-center ${
          compact ? 'text-[8px]' : 'text-[10px]'
        }`}
        style={{ color: isSelected ? colors.accentSoft : colors.textMuted }}
      >
        {formatWeekdayShort(date)}
      </span>
      <span
        className={`font-bold ${compact ? 'text-sm' : 'text-base'}`}
        style={{ color: isSelected ? colors.surface : colors.textPrimary }}
      >
        {date.getDate()}
      </span>
    </button>
  );
};

export default function CalendarStrip({
  onDateSelect,
  selectedDate: propSelectedDate,
  visibleDays = 7,
  eventDates,
  compact = false,
}: CalendarStripProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(propSelectedDate ?? today));
  const [days, setDays] = useState<Date[]>([]);

  useEffect(() => {
    const half = Math.floor(visibleDays / 2);
    const newDays: Date[] = [];
    for (let i = -half; i <= half; i++) {
      newDays.push(addDays(today, i));
    }
    setDays(newDays);
  }, [today, visibleDays]);

  useEffect(() => {
    if (propSelectedDate) setSelectedDate(startOfDay(propSelectedDate));
  }, [propSelectedDate]);

  const events = useMemo(() => (eventDates ?? []).map(startOfDay), [eventDates]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  return (
    <div
      className={`flex items-center overflow-x-auto px-1 -mx-1 ${compact ? 'gap-1.5 pb-1' : 'gap-3 pb-2'}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      {days.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const hasDot = events.length > 0
          ? events.some((d) => isSameDay(d, date)) && !isSelected
          : false;
        return (
          <Day
            key={date.toISOString()}
            date={date}
            isSelected={isSelected}
            hasDot={hasDot}
            compact={compact}
            onClick={() => handleDateClick(date)}
          />
        );
      })}
    </div>
  );
}
