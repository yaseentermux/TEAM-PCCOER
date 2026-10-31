import React from "react";

interface BrightloopLogoProps {
  /** Size of the icon square in pixels. Default: 36 */
  size?: number;
  /** Show text next to icon. Default: true */
  showText?: boolean;
  className?: string;
  theme?: "dark" | "light";
}

/**
 * Modern High-Impact Brand Logo for Brightloop
 * Uses a vibrant continuous spiral loop mark (infinity-style continuous billing)
 * with multi-shade violet/indigo gradients and refined typography.
 */
export const BrightloopLogo: React.FC<BrightloopLogoProps> = ({
  size = 36,
  showText = true,
  className = "",
  theme = "dark",
}) => {
  const isLight = theme === "light";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Premium SVG Loop Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="blGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id="blLoopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <filter id="blShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#312E81" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Squircle base */}
        <rect
          width="44"
          height="44"
          rx="12"
          fill="url(#blGradient1)"
          filter="url(#blShadow)"
        />

        {/* Orbit loop mark */}
        <path
          d="M13 22C13 16.5 17 12.5 22 12.5C27 12.5 31 16.5 31 22C31 27.5 27 31.5 22 31.5C18.5 31.5 15.5 29.5 14 26.5"
          stroke="url(#blLoopGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Inner dynamic swirl arrow */}
        <path
          d="M18 22C18 19.8 19.8 18 22 18C24.2 18 26 19.8 26 22C26 24.2 24.2 26 22 26"
          stroke="#E0E7FF"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Glowing forward arrow pulse */}
        <circle cx="22" cy="22" r="2.2" fill="#FFFFFF" />
        <path
          d="M12.5 29L14 26.5L16.5 28.5"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Brand Name Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            style={{ fontSize: size * 0.48, letterSpacing: "-0.03em" }}
            className={`font-black tracking-tight ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            Bright<span className="text-indigo-400 font-extrabold">loop</span>
          </span>
          <span
            style={{ fontSize: Math.max(9, size * 0.22) }}
            className={`uppercase tracking-widest font-semibold mt-0.5 ${
              isLight ? "text-slate-400" : "text-indigo-200/70"
            }`}
          >
            Subscriptions
          </span>
        </div>
      )}
    </div>
  );
};

export default BrightloopLogo;
