interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * EduAgent AI — logo mark
 *
 * Concept: a mortarboard (education) with a neural-pulse node
 * at the bottom replacing the tassel (AI). Violet gradient background.
 *
 * Use <EduAgentMark /> for just the icon square.
 * Use <EduAgentWordmark /> for icon + text side by side.
 * Use <EduAgentHero />   for the large stacked version (auth pages).
 */
export function EduAgentMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="EduAgent AI"
    >
      <defs>
        <linearGradient id="ea-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <filter id="ea-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="32" height="32" rx="8" fill="url(#ea-bg)" />

      {/* ── Mortarboard diamond (top of cap) ── */}
      <path
        d="M16 6 L25.5 11.5 L16 17 L6.5 11.5 Z"
        fill="white"
      />

      {/* ── Cap band (horizontal strip under diamond) ── */}
      <rect x="11.5" y="17.5" width="9" height="2.2" rx="1.1" fill="white" fillOpacity="0.85" />

      {/* ── Tassel cord ── */}
      <line
        x1="16" y1="19.7"
        x2="16" y2="21.5"
        stroke="white"
        strokeWidth="1.4"
        strokeOpacity="0.55"
        strokeLinecap="round"
      />

      {/* ── Neural node (replaces tassel) ── */}
      {/* outer pulse ring */}
      <circle cx="16" cy="24.2" r="3.2" stroke="white" strokeWidth="0.7" strokeOpacity="0.3" fill="none" />
      {/* mid ring */}
      <circle cx="16" cy="24.2" r="2"   stroke="white" strokeWidth="0.6" strokeOpacity="0.55" fill="none" />
      {/* core dot */}
      <circle cx="16" cy="24.2" r="1.2" fill="white" filter="url(#ea-glow)" />
    </svg>
  );
}

/**
 * Horizontal lockup: mark + "EduAgent AI" text
 * Use in sidebars, headers, compact contexts.
 */
export function EduAgentWordmark({
  size = 28,
  className,
}: LogoMarkProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <EduAgentMark size={size} />
      <span
        style={{ fontSize: size * 0.54, lineHeight: 1 }}
        className="font-bold tracking-tight text-text-primary"
      >
        EduAgent{" "}
        <span className="text-violet-400">AI</span>
      </span>
    </div>
  );
}

/**
 * Stacked hero lockup for auth / onboarding pages.
 * Large mark + two-line text below.
 */
export function EduAgentHero({ size = 56, className }: LogoMarkProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      <EduAgentMark size={size} />
      <div className="text-center leading-tight">
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          EduAgent <span className="text-violet-400">AI</span>
        </p>
        <p className="mt-1 text-xs text-text-muted">Tu tutor inteligente</p>
      </div>
    </div>
  );
}
