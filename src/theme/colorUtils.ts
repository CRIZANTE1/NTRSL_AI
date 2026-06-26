export function hexToRgba(hex: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha));
  const clean = hex.replace('#', '').trim();
  const isShort = clean.length === 3;
  const isLong = clean.length === 6;
  if (!isShort && !isLong) return `rgba(0, 0, 0, ${a})`;

  const full = isShort
    ? clean
        .split('')
        .map((c) => c + c)
        .join('')
    : clean;

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

