interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Google Gemini logo — four-pointed star with blue background
 * Approximates the official Gemini mark as an SVG component
 */
export function GeminiIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Gemini"
    >
      <defs>
        <linearGradient id="gemini-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="100%" stopColor="#1B6BF0" />
        </linearGradient>
        <linearGradient id="gemini-star" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="8" fill="url(#gemini-bg)" />

      {/* Gemini four-pointed star — smooth cubic bezier curves */}
      <path
        d="M16 3 C16.6 11 21 15.4 29 16 C21 16.6 16.6 21 16 29 C15.4 21 11 16.6 3 16 C11 15.4 15.4 11 16 3 Z"
        fill="url(#gemini-star)"
      />
    </svg>
  );
}
