/**
 * Push nativo pode ser desativado com VITE_ENABLE_PUSH=false (builds sem FCM ou diagnóstico).
 * Por omissão o fluxo tenta registar; falhas nunca devem impedir o resto da app.
 */
export function isNativePushEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PUSH !== 'false';
}
