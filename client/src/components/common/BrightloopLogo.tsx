import React from "react";

interface BrightloopLogoProps {
  /** Size of the icon square in pixels. Default: 36 */
  size?: number;
  /** Show text next to icon. Default: true */
  showText?: boolean;
  className?: string;
}

/**
 * BrightloopLogo — a custom SVG mark + wordmark for BrightLoop.
 * The icon is a circular loop arrow formed from two arcs, representing
 * recurring subscriptions and continuous billing cycles.
 */
export const BrightloopLogo: React.FC<BrightloopLogoProps> = ({
  size = 36,
  showText = true,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Background pill */}
        <rect width="36" height="36" rx="10" fill="#4F46E5" />
        {/* Outer loop arc — top half */}
        <path
          d="M10 18C10 13.582 13.582 10 18 10"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Outer loop arc — bottom half */}
        <path
          d="M18 10C22.418 10 26 13.582 26 18C26 22.418 22.418 26 18 26"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Inner loop arc — top left */}
        <path
          d="M14 18C14 15.791 15.791 14 18 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Inner loop arc — bottom right */}
        <path
          d="M18 14C20.209 14 22 15.791 22 18C22 20.209 20.209 22 18 22"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Arrowhead on outer loop — pointing down-left at ~250° */}
        <path
          d="M16 26.5L18 26L16.5 24.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center dot */}
        <circle cx="18" cy="18" r="2" fill="white" />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span
          style={{ fontSize: size * 0.47, letterSpacing: "-0.02em" }}
          className="font-bold text-white leading-none tracking-tight truncate"
        >
          Bright<span style={{ color: "#a5b4fc" }}>loop</span>
        </span>
      )}
    </div>
  );
};

export default BrightloopLogo;
