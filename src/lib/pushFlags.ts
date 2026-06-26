/**
 * Push nativo só é ativado com VITE_ENABLE_PUSH=true (requer google-services.json + FCM).
 * Sem Firebase, PushNotifications.register() derruba o processo Android (crash nativo).
 */
export function isNativePushEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PUSH === 'true';
}
