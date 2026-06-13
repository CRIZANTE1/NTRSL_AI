import React, { useEffect, useMemo, useState } from 'react';
import { colors } from '../theme/colors';

export interface CalendarStripProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  /** Dias visíveis. Default: 7 (hoje ±3) */
  visibleDays?: number;
  /** Datas com dot (registro existente). Sem essa prop, nenhum dot é exibido. */
  eventDates?: Date[];
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
  onClick: () => void;
}> = ({ date, isSelected, hasDot, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 w-[56px] flex-shrink-0 rounded-3xl transition-all"
      style={{
        background: isSelected ? colors.textPrimary : colors.surface,
        border: `1px solid ${colors.border}`,
        padding: isSelected ? '20px 12px' : '16px 12px',
        cursor: 'pointer',
      }}
    >
      {hasDot && !isSelected && (
        <div
          className="w-1.5 h-1.5 rounded-full mb-[-2px]"
          style={{ background: colors.badge }}
        />
      )}
      <span
        className="text-[10px] font-semibold uppercase truncate w-full text-center"
        style={{ color: isSelected ? colors.accentSoft : colors.textMuted }}
      >
        {formatWeekdayShort(date)}
      </span>
      <span
        className="text-base font-bold"
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
      className="flex items-center gap-3 overflow-x-auto pb-2 px-1 -mx-1"
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
            onClick={() => handleDateClick(date)}
          />
        );
      })}
    </div>
  );
}
