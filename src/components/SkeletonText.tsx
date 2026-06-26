import { useEffect } from 'react';

interface SkeletonTextProps {
  text?: string;
  fontSize?: number;
}

export function SkeletonText({ text = 'Calculando...', fontSize = 14 }: SkeletonTextProps) {
  useEffect(() => {
    if (document.getElementById('shimmer-text-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'shimmer-text-keyframes';
    style.textContent = `
      @keyframes shimmer-text {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <span
      style={{
        background: 'linear-gradient(90deg, #aaa 20%, #eee 50%, #aaa 80%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'shimmer-text 1.6s linear infinite',
        fontSize,
        fontWeight: 400,
        display: 'inline-block',
        minWidth: 90,
        textAlign: 'right',
      }}
    >
      {text}
    </span>
  );
}
