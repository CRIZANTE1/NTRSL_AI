import React, { useCallback, useRef, useState } from 'react';
import { Camera, Mic } from 'lucide-react';
import { SkeletonText } from './SkeletonText';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { postDecipherFoodImage } from '../lib/api';
import { captureFoodPhotoBase64 } from '../lib/cameraCapture';
import { colors } from '../theme/colors';

interface DiaryInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function DiaryInput({ onSubmit, disabled = false }: DiaryInputProps) {
  const [value, setValue] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    if (!trimmed || disabled || isAnalyzing) return;
    onSubmit(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleMicClick = () => {
    if (disabled || isAnalyzing) return;
    if (isListening) {
      void stopListening();
      return;
    }
    setSpeechError(null);
    setCameraError(null);
    void startListening();
    inputRef.current?.focus();
  };

  const handleCameraClick = async () => {
    if (disabled || isAnalyzing || isListening) return;
    setSpeechError(null);
    setCameraError(null);

    const photo = await captureFoodPhotoBase64();
    if (!photo) {
      setCameraError('Não foi possível acessar a câmera ou selecionar a foto.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { identified, description } = await postDecipherFoodImage(photo.base64, photo.mimeType);
      if (!identified) {
        setCameraError('Não identificamos alimentos na foto. Tente outra imagem ou digite manualmente.');
        return;
      }
      setValue(description.trim());
      inputRef.current?.focus();
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : 'Erro ao analisar a foto.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isTyping = value.trim().length > 0;
  const showMic = !isTyping && isSupported && !isAnalyzing;
  const showCamera = !isTyping && !isListening && !isAnalyzing;
  const showSkeleton = isTyping || isAnalyzing;

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
          setCameraError(null);
          setValue(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={disabled || isAnalyzing}
        placeholder={isAnalyzing ? 'Analisando foto…' : 'O que você comeu ou fez hoje...'}
        className="diary-inline-input flex-1 min-w-0 bg-transparent text-[15px] leading-snug outline-none disabled:opacity-50"
        style={{ color: colors.textPrimary }}
        aria-label="Adicionar ao diário"
      />
      {showSkeleton && <SkeletonText />}
      {showCamera && (
        <button
          type="button"
          onClick={() => void handleCameraClick()}
          disabled={disabled}
          aria-label="Fotografar refeição"
          className="diary-action-btn shrink-0 flex items-center justify-center border-none bg-transparent p-1 disabled:opacity-50"
          style={{ color: colors.iconInactive }}
        >
          <Camera size={18} strokeWidth={1.75} />
        </button>
      )}
      {showMic && (
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled}
          aria-label={isListening ? 'Parar ditado por voz' : 'Ditar por voz'}
          className="diary-action-btn shrink-0 flex items-center justify-center border-none bg-transparent p-1 disabled:opacity-50"
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
      {(speechError || cameraError) && (
        <p
          className="text-xs leading-snug pb-1"
          style={{ color: colors.textSecondary }}
          role="status"
        >
          {speechError ?? cameraError}
        </p>
      )}
    </div>
  );
}
