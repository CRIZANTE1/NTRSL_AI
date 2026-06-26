const EVT = 'ntrsl-offline-data-changed';

export function notifyOfflineDataChanged() {
  try {
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore */
  }
}

export function subscribeOfflineDataChanged(handler: () => void): () => void {
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
