/**
 * KOKAMDO Logo Component
 * Based on the new brand identity - geometric chevron + diamond symbol
 */

interface LogoProps {
  variant?: "full" | "symbol" | "wordmark";
  color?: string;
  className?: string;
  height?: number;
}

export default function Logo({ variant = "full", color = "currentColor", className = "", height = 32 }: LogoProps) {
  const symbolWidth = height * 1.1;
  const fullWidth = variant === "full" ? height * 4.5 : variant === "symbol" ? symbolWidth : height * 3.5;

  if (variant === "wordmark") {
    return (
      <span
        className={`font-heading font-bold tracking-tight ${className}`}
        style={{ fontSize: height * 0.85, color, lineHeight: 1 }}
      >
        KOKAMDO
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Symbol Mark - Chevron + Diamond */}
      <svg
        width={symbolWidth}
        height={height}
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="KOKAMDO 로고"
      >
        {/* Left chevron - two parallelograms forming < shape */}
        <path
          d="M8 20 L38 50 L8 80 L22 80 L52 50 L22 20 Z"
          fill={color}
        />
        {/* Right diamond/hexagon with internal diagonal */}
        <path
          d="M52 20 L52 50 L82 20 Z"
          fill={color}
        />
        <path
          d="M52 50 L52 80 L82 80 Z"
          fill={color}
        />
        <path
          d="M82 20 L82 80 L112 50 Z"
          fill={color}
        />
      </svg>

      {/* Wordmark */}
      {variant === "full" && (
        <span
          className="font-heading font-bold tracking-tight"
          style={{ fontSize: height * 0.65, color, lineHeight: 1 }}
        >
          KOKAMDO
        </span>
      )}
    </span>
  );
}

/**
 * Logo as favicon-ready SVG string
 */
export function getLogoSvgString(color: string = "#111111"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" fill="none">
    <path d="M8 20 L38 50 L8 80 L22 80 L52 50 L22 20 Z" fill="${color}"/>
    <path d="M52 20 L52 50 L82 20 Z" fill="${color}"/>
    <path d="M52 50 L52 80 L82 80 Z" fill="${color}"/>
    <path d="M82 20 L82 80 L112 50 Z" fill="${color}"/>
  </svg>`;
}
