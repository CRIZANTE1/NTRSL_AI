import React, { useCallback, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { SkeletonText } from './SkeletonText';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { colors } from '../theme/colors';

interface DiaryInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function DiaryInput({ onSubmit, disabled = false }: DiaryInputProps) {
  const [value, setValue] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTranscript = useCallback((text: string) => {
    if (text) setValue(text);
  }, []);

  const handleSpeechError = useCallback((error: string) => {
    if (error === 'not-allowed') {
      setSpeechError('Permissão de microfone negada. Ative nas configurações do dispositivo.');
      return;
    }
    if (error === 'unsupported') {
      setSpeechError('Ditado por voz indisponível neste dispositivo. Instale o app Google e os serviços de voz.');
      return;
    }
    setSpeechError('Não foi possível iniciar o ditado. Tente novamente.');
  }, []);

  const { isSupported, isListening, startListening, stopListening } =
    useSpeechRecognition({ onTranscript: handleTranscript, onError: handleSpeechError });

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleMicClick = () => {
    if (disabled) return;
    if (isListening) {
      void stopListening();
      return;
    }
    setSpeechError(null);
    void startListening();
    inputRef.current?.focus();
  };

  const isTyping = value.trim().length > 0;
  const showMic = !isTyping && isSupported;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '13px 0',
          gap: 8,
        }}
      >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          if (isListening) void stopListening();
          setSpeechError(null);
          setValue(e.target.value);
        }}
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
      {showMic && (
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled}
          aria-label={isListening ? 'Parar ditado por voz' : 'Ditar por voz'}
          className="diary-mic-btn shrink-0 flex items-center justify-center border-none bg-transparent p-1 disabled:opacity-50"
          style={{
            color: isListening ? colors.accent : colors.iconInactive,
            animation: isListening ? 'mic-pulse 1.2s ease-in-out infinite' : 'none',
          }}
        >
          <Mic size={18} strokeWidth={1.75} />
        </button>
      )}
      <style>{`
        .diary-inline-input::placeholder { color: ${colors.textMuted}; opacity: 1; }
        @keyframes mic-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
      </div>
      {speechError && (
        <p
          className="text-xs leading-snug pb-1"
          style={{ color: colors.textSecondary }}
          role="status"
        >
          {speechError}
        </p>
      )}
    </div>
  );
}
