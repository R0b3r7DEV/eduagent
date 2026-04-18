interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Anthropic Claude logo — amber/orange brand colors
 * Approximates the official Claude mark as an SVG component
 */
export function ClaudeIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Claude"
    >
      <rect width="32" height="32" rx="8" fill="#CC785C" />
      {/* Anthropic-style abstract lines mark */}
      <path
        d="M19.2 8h-2.56l-4.8 16h2.56l1.12-3.84h4.8L21.44 24H24L19.2 8zm-3.04 9.92 1.76-6.08 1.76 6.08h-3.52z"
        fill="white"
      />
    </svg>
  );
}
