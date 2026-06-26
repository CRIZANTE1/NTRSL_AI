/**
 * Gera um UUID v4 compatível com iOS WKWebView.
 *
 * `crypto.randomUUID()` não está disponível em todas as versões do iOS WebView.
 * Esta função usa `crypto.getRandomValues()` — amplamente suportado — com
 * fallback para `Math.random()`.
 */
export function generateUUID(): string {
  // Tenta crypto.randomUUID() primeiro (disponível em navegadores modernos)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback via crypto.getRandomValues() — compatível com iOS WKWebView
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    // UUID v4: bytes 6 e 8 têm bits fixos
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante 1
    return bytesToUUID(bytes);
  }

  // Fallback último caso — Math.random()
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUUID(bytes);
}

function bytesToUUID(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex[0] + hex[1] + hex[2] + hex[3],
    hex[4] + hex[5],
    hex[6] + hex[7],
    hex[8] + hex[9],
    hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15],
  ].join('-');
}
