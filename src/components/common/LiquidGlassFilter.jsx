import React from 'react';

/**
 * LiquidGlassFilter
 * ------------------------------------------------------------------
 * A single, app-wide hidden <svg> that hosts the SVG filters used to
 * fake "water drop / liquid glass" refraction. Mount this ONCE at the
 * root of the app (see App.jsx). The filters are referenced from CSS
 * via `filter: url(#liquid-distortion)` / `backdrop-filter: url(...)`.
 *
 * Two filters are provided:
 *  - #liquid-distortion : gentle, always-available ripple. Used for the
 *    resting / hover state of interactive glass surfaces.
 *  - #liquid-distortion-strong : a heavier displacement used while the
 *    user is actively pressing / dragging (the "water drop flattening").
 *
 * The <feTurbulence> baseFrequency is animated so the noise field slowly
 * drifts, which makes the refraction feel alive (a living liquid) instead
 * of a static frozen distortion.
 */
export default function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <defs>
        {/* ---- Gentle, ambient refraction ---- */}
        <filter
          id="liquid-distortion"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.014"
            numOctaves="2"
            seed="7"
            stitchTiles="stitch"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="20s"
              values="0.012 0.014; 0.018 0.020; 0.010 0.012; 0.012 0.014"
              repeatCount="indefinite"
            />
          </feTurbulence>
          {/* Soften the noise so edges read like rounded liquid, not static */}
          <feGaussianBlur in="noise" stdDeviation="1.1" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* ---- Heavy "drop flattening" refraction (active / drag) ---- */}
        <filter
          id="liquid-distortion-strong"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.022"
            numOctaves="3"
            seed="14"
            stitchTiles="stitch"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="9s"
              values="0.018 0.022; 0.030 0.026; 0.016 0.020; 0.018 0.022"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feGaussianBlur in="noise" stdDeviation="1.6" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="42"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Specular sheen gradient reused by the ::after refraction sheet */}
        <radialGradient id="liquid-sheen" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
        </radialGradient>
      </defs>
    </svg>
  );
}
