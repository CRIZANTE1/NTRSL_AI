import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { logger } from './logger';

const SOUNDS_ENABLED_KEY = 'ntrsl_ui_sounds_enabled';

let audioCtx: AudioContext | null = null;

export async function getUiSoundsEnabled(): Promise<boolean> {
  try {
    const { value } = await Preferences.get({ key: SOUNDS_ENABLED_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setUiSoundsEnabled(enabled: boolean): Promise<void> {
  await Preferences.set({ key: SOUNDS_ENABLED_KEY, value: String(enabled) });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(frequency: number, durationMs: number, volume = 0.08): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

async function playIfEnabled(kind: 'success' | 'error' | 'tap'): Promise<void> {
  try {
    if (!(await getUiSoundsEnabled())) return;
    if (Capacitor.getPlatform() === 'web' && typeof window !== 'undefined') {
      // Web pode exigir gesto do usuário — falha silenciosa fora de interação
    }
    switch (kind) {
      case 'success':
        playTone(880, 90);
        window.setTimeout(() => playTone(1175, 110), 95);
        break;
      case 'error':
        playTone(220, 140);
        break;
      case 'tap':
        playTone(640, 40, 0.05);
        break;
    }
  } catch (e) {
    logger.warn('sounds', 'Falha ao reproduzir som', e);
  }
}

export function soundSuccess(): void {
  void playIfEnabled('success');
}

export function soundError(): void {
  void playIfEnabled('error');
}

export function soundTap(): void {
  void playIfEnabled('tap');
}
