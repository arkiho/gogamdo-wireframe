/**
 * KOKAMDO Logo Component
 * Uses actual brand logo images from CDN
 */

const LOGO_DARK = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/YPvjJaHufGOhnzia.png";
const LOGO_WHITE = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/avyBjfVmpnrZSajo.png";
const LOGO_SYMBOL = "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/SfHLuQGAjxPTrVWr.png";

interface LogoProps {
  variant?: "full" | "symbol" | "wordmark";
  color?: string;
  className?: string;
  height?: number;
}

export default function Logo({ variant = "full", color = "currentColor", className = "", height = 32 }: LogoProps) {
  const isWhite = color === "#ffffff" || color === "white" || color === "#fff";

  if (variant === "symbol") {
    return (
      <img
        src={LOGO_SYMBOL}
        alt="KOKAMDO"
        className={`object-contain ${className}`}
        style={{ height, width: "auto", filter: isWhite ? "invert(1) brightness(2)" : "none" }}
      />
    );
  }

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

  // Full logo - symbol + wordmark image
  const logoSrc = isWhite ? LOGO_WHITE : LOGO_DARK;

  return (
    <img
      src={logoSrc}
      alt="KOKAMDO 고감도"
      className={`object-contain ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}

/**
 * Logo CDN URLs for external use
 */
export const LOGO_URLS = {
  dark: LOGO_DARK,
  white: LOGO_WHITE,
  symbol: LOGO_SYMBOL,
  favicon32: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/sxFLBDGEinEorgzx.png",
  favicon180: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/JqpxUMGoCvqxVnlx.png",
  favicon512: "https://files.manuscdn.com/user_upload_by_module/session_file/98603122/sjVFuJSyMZqDtKdZ.png",
};
