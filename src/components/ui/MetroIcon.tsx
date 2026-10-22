// Знак метро: белая «М» в круге цвета линии. «Петроградская» на 2-й, синей линии.
export function MetroIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} role="img" aria-label="Метро">
      <circle cx="12" cy="12" r="12" fill="#0a6fc2" />
      <path
        d="M4.6 17.2 L8.1 6.6 L12 13.3 L15.9 6.6 L19.4 17.2 L16.9 17.2 L15.2 11.6 L12 17.2 L8.8 11.6 L7.1 17.2 Z"
        fill="#fff"
      />
    </svg>
  );
}
