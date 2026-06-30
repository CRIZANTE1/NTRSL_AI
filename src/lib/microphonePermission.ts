import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';

/** Solicita permissão de microfone antes do ditado por voz. */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await SpeechRecognition.requestPermissions();
      return perm.speechRecognition === 'granted';
    } catch {
      return false;
    }
  }

  if (typeof navigator === 'undefined') return false;

  try {
    const status = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
    if (status?.state === 'denied') return false;
  } catch {
    // Permissions API indisponível — tenta getUserMedia abaixo.
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return true;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}
