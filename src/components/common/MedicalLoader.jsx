import React from 'react';

const MedicalLoader = ({ className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 relative ${className}`}>
      
      {/* Heartbeat ECG Waveform & Rippling Heart (Completely transparent background, no grid, red pulse + faint back trace) */}
      <div className="w-96 h-52 relative overflow-hidden flex items-center justify-center select-none pointer-events-none bg-transparent border-none shadow-none">
        <svg 
          viewBox="0 0 300 150" 
          className="w-full h-full absolute inset-0 z-10 overflow-visible"
        >
          {/* Concentric Rippling Circles (Spreading red waves from the heart) */}
          <circle cx="230" cy="75" className="ripple-circle animation-delay-0" />
          <circle cx="230" cy="75" className="ripple-circle animation-delay-1" />
          <circle cx="230" cy="75" className="ripple-circle animation-delay-2" />

          {/* Back line (Faint red trace line) */}
          <path 
            d="M 0,75 L 40,75 L 45,95 L 53,15 L 61,85 L 65,75 L 85,75 L 90,95 L 98,15 L 106,85 L 110,75 L 130,75 L 135,95 L 143,15 L 151,85 L 155,75 L 175,75 L 180,95 L 188,15 L 196,85 L 200,75 L 220,75" 
            id="back" 
            className="fill-none stroke-round stroke-linejoin-round"
            style={{
              stroke: 'rgba(220, 38, 38, 0.15)',
              strokeWidth: '3px'
            }}
          />

          {/* Front line (Single glowing animating pulse in red) */}
          <path 
            d="M 0,75 L 40,75 L 45,95 L 53,15 L 61,85 L 65,75 L 85,75 L 90,95 L 98,15 L 106,85 L 110,75 L 130,75 L 135,95 L 143,15 L 151,85 L 155,75 L 175,75 L 180,95 L 188,15 L 196,85 L 200,75 L 220,75" 
            id="front" 
            className="fill-none stroke-red-600 stroke-[3.5] stroke-round stroke-linejoin-round"
            style={{
              strokeDasharray: '40, 440',
              strokeDashoffset: 480,
              animation: 'ecg-dash-heart 1.6s infinite linear',
              filter: 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.6))'
            }}
          />

          {/* Heart Shape at the right end (Centered at x=230, y=75 in solid red) */}
          <path 
            d="M 230,72 C 230,72 226,66 221,68 C 216,70 216,77 221,80 L 230,87 L 239,80 C 244,77 244,70 239,68 C 234,66 230,72 230,72 Z"
            className="fill-red-600 stroke-red-600 stroke-[1] stroke-round stroke-linejoin-round heart-static-glow"
          />
        </svg>
      </div>

      {/* Embedded Styles for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ecg-dash-heart {
          to {
            stroke-dashoffset: 0;
          }
        }
        .ripple-circle {
          fill: none;
          stroke: rgba(220, 38, 38, 0.5);
          stroke-width: 2;
          transform-origin: 230px 75px;
          animation: rip 2.2s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
        }
        .animation-delay-0 {
          animation-delay: 0s;
        }
        .animation-delay-1 {
          animation-delay: 0.73s;
        }
        .animation-delay-2 {
          animation-delay: 1.46s;
        }
        @keyframes rip {
          0% {
            r: 4px;
            opacity: 1;
            stroke-width: 2.5;
            filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.3));
          }
          50% {
            opacity: 0.65;
          }
          100% {
            r: 65px;
            opacity: 0;
            stroke-width: 0.5;
          }
        }
        .heart-static-glow {
          filter: drop-shadow(0 0 4px rgba(220, 38, 38, 0.6));
          animation: heart-pulse-glow-red 1.6s infinite ease-in-out;
        }
        @keyframes heart-pulse-glow-red {
          0%, 100% {
            transform: scale(1);
            transform-origin: 230px 75px;
            filter: drop-shadow(0 0 4px rgba(220, 38, 38, 0.6));
          }
          50% {
            transform: scale(1.15);
            transform-origin: 230px 75px;
            filter: drop-shadow(0 0 10px rgba(220, 38, 38, 0.9));
          }
        }
      `}} />
    </div>
  );
};

export default MedicalLoader;
