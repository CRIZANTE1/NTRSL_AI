import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capgo/capacitor-speech-recognition';
import type { PluginListenerHandle } from '@capacitor/core';
import { requestMicrophonePermission } from '../lib/microphonePermission';
import { logger } from '../lib/logger';

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getWebSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const nativeListenersRef = useRef<PluginListenerHandle[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  useEffect(() => {
    let cancelled = false;

    const checkSupport = async () => {
      if (isNative) {
        try {
          const { available } = await NativeSpeechRecognition.available();
          if (!cancelled) setIsSupported(available);
        } catch (e) {
          logger.warn('speech', 'available() falhou', e);
          if (!cancelled) setIsSupported(false);
        }
        return;
      }

      if (!cancelled) {
        setIsSupported(getWebSpeechRecognitionCtor() !== null);
      }
    };

    void checkSupport();

    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const clearNativeListeners = useCallback(async () => {
    await Promise.all(nativeListenersRef.current.map((handle) => handle.remove()));
    nativeListenersRef.current = [];
  }, []);

  const stopListening = useCallback(async () => {
    if (isNative) {
      try {
        await NativeSpeechRecognition.stop();
      } catch (e) {
        logger.warn('speech', 'stop() falhou', e);
      }
      await clearNativeListeners();
      setIsListening(false);
      return;
    }

    recognitionRef.current?.stop();
    setIsListening(false);
  }, [clearNativeListeners, isNative]);

  const startNativeListening = useCallback(async () => {
    const granted = await requestMicrophonePermission();
    if (!granted) {
      onErrorRef.current?.('not-allowed');
      return;
    }

    const { available } = await NativeSpeechRecognition.available();
    if (!available) {
      onErrorRef.current?.('unsupported');
      return;
    }

    await clearNativeListeners();

    const partialHandle = await NativeSpeechRecognition.addListener('partialResults', (event) => {
      const text = event.accumulatedText ?? event.matches?.[0] ?? '';
      if (text) onTranscriptRef.current(text, Boolean(event.forced));
    });

    const errorHandle = await NativeSpeechRecognition.addListener('error', (event) => {
      logger.warn('speech', 'erro nativo', event);
      onErrorRef.current?.(event.code);
      setIsListening(false);
    });

    const stateHandle = await NativeSpeechRecognition.addListener('listeningState', (event) => {
      if (event.state === 'stopped' || event.status === 'stopped') {
        setIsListening(false);
      }
    });

    nativeListenersRef.current = [partialHandle, errorHandle, stateHandle];

    try {
      await NativeSpeechRecognition.start({
        language: 'pt-BR',
        partialResults: true,
        popup: false,
      });
      setIsListening(true);
    } catch (e) {
      logger.warn('speech', 'start() falhou', e);
      await clearNativeListeners();
      onErrorRef.current?.('start-failed');
      setIsListening(false);
    }
  }, [clearNativeListeners]);

  const startWebListening = useCallback(async () => {
    const Ctor = getWebSpeechRecognitionCtor();
    if (!Ctor) return;

    const granted = await requestMicrophonePermission();
    if (!granted) {
      onErrorRef.current?.('not-allowed');
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new Ctor();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }

      const lastResult = event.results[event.results.length - 1];
      onTranscriptRef.current(transcript.trim(), lastResult?.isFinal ?? false);
    };

    recognition.onerror = (event) => {
      onErrorRef.current?.(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      logger.warn('speech', 'Web Speech start() falhou', e);
      setIsListening(false);
      onErrorRef.current?.('start-failed');
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isNative) {
      await startNativeListening();
      return;
    }
    await startWebListening();
  }, [isNative, startNativeListening, startWebListening]);

  useEffect(() => {
    return () => {
      if (isNative) {
        void NativeSpeechRecognition.stop().catch(() => undefined);
        void clearNativeListeners();
      } else {
        recognitionRef.current?.abort();
        recognitionRef.current = null;
      }
    };
  }, [clearNativeListeners, isNative]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
}
