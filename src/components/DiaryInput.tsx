import React, { useRef, useState } from 'react';
import { SkeletonText } from './SkeletonText';
import { colors } from '../theme/colors';

interface DiaryInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function DiaryInput({ onSubmit, disabled = false }: DiaryInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const isTyping = value.trim().length > 0;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '13px 0',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={disabled}
        placeholder="O que você comeu ou fez hoje..."
        className="diary-inline-input flex-1 min-w-0 bg-transparent text-[15px] leading-snug outline-none disabled:opacity-50"
        style={{ color: colors.textPrimary }}
        aria-label="Adicionar ao diário"
      />
      {isTyping && <SkeletonText />}
      <style>{`.diary-inline-input::placeholder { color: ${colors.textMuted}; opacity: 1; }`}</style>
    </div>
  );
}
