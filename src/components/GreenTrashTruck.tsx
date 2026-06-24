import React from "react";

interface GreenTrashTruckProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
}

export default function GreenTrashTruck({ className = "", style, size = "100%" }: GreenTrashTruckProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      width={size}
      height={size}
      className={`select-none pointer-events-none ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dropshadow under the truck */}
      <ellipse cx="105" cy="142" rx="75" ry="10" fill="rgba(15, 23, 42, 0.15)" />

      {/* REAR COMPACTOR BODY (Darker Green) */}
      <g id="compactor-body">
        {/* Main compactor shell */}
        <path
          d="M 100,25 
             C 145,20 185,40 188,85 
             L 182,122 
             C 180,128 172,130 165,130 
             L 95,130 
             Z"
          fill="#1E7B34"
          stroke="#145323"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        
        {/* Back door rib segments (ridged texture from user drawing) */}
        <path d="M 125,24 C 145,30 150,60 150,130" fill="none" stroke="#145323" strokeWidth="3" />
        <path d="M 152,28 C 170,35 172,60 172,130" fill="none" stroke="#145323" strokeWidth="3" />
        
        {/* Compactor top ridges */}
        <rect x="110" y="20" width="18" height="6" rx="2" fill="#145323" />
        <rect x="140" y="22" width="18" height="6" rx="2" fill="#145323" />
      </g>

      {/* FRONT CABIN (Main Bright Green) */}
      <g id="front-cabin">
        {/* Cab Main Frame */}
        <path
          d="M 98,34 
             L 42,38 
             C 25,40 18,50 16,74 
             L 12,118 
             C 12,125 18,132 25,132 
             L 132,132 
             C 134,124 135,100 135,74 
             C 135,45 115,35 98,34 
             Z"
          fill="#2CB44B"
          stroke="#1B6E2E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Front Grill Panel Outline */}
        <path
          d="M 14,108 L 115,108"
          stroke="#1B6E2E"
          strokeWidth="2.5"
        />

        {/* Big Windshield (Black screen) */}
        <path
          d="M 96,44 
             L 42,47 
             C 32,48 26,53 25,65 
             L 21,90 
             C 20,95 24,98 30,98 
             L 108,98 
             C 113,98 116,94 116,88 
             L 114,62 
             C 113,50 106,44 96,44 
             Z"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Cute White Eyes (Big and adorable like Tayo/Rogi cartoon truck) */}
        {/* Left Eye */}
        <ellipse cx="44" cy="74" rx="14" ry="14" fill="#FFFFFF" />
        <ellipse cx="42" cy="74" rx="8" ry="8" fill="#000000" />
        <circle cx="39" cy="70" r="3.5" fill="#FFFFFF" /> {/* Sparkle */}

        {/* Right Eye */}
        <ellipse cx="90" cy="74" rx="14" ry="14" fill="#FFFFFF" />
        <ellipse cx="92" cy="74" rx="8" ry="8" fill="#000000" />
        <circle cx="89" cy="70" r="3.5" fill="#FFFFFF" /> {/* Sparkle */}

        {/* Happy Smiling Mouth (on the bumper) */}
        <path
          d="M 44,116 Q 58,127 72,116"
          fill="none"
          stroke="#0F172A"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Left Glowing Headlight */}
        <circle cx="26" cy="116" r="8" fill="#FFFBEB" stroke="#D97706" strokeWidth="2.5" />
        {/* Headlight lens texture lines */}
        <line x1="22" y1="112" x2="26" y2="120" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="26" y1="112" x2="30" y2="120" stroke="#F59E0B" strokeWidth="1.5" />

        {/* Right Glowing Headlight */}
        <circle cx="106" cy="116" r="8" fill="#FFFBEB" stroke="#D97706" strokeWidth="2.5" />
        {/* Headlight lens texture lines */}
        <line x1="102" y1="112" x2="106" y2="120" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="106" y1="112" x2="110" y2="120" stroke="#F59E0B" strokeWidth="1.5" />

        {/* Top Marker Lights (Orange & Yellow roof caps) */}
        <ellipse cx="36" cy="38" rx="6" ry="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
        <ellipse cx="88" cy="35" rx="6" ry="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />

        {/* Left Side Mirror */}
        <g id="left-mirror">
          <path d="M 18,74 L 6,70" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="2" y="60" width="5" height="18" rx="2.5" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
        </g>
        
        {/* Right Side Mirror */}
        <g id="right-mirror">
          <path d="M 114,72 L 124,68" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="122" y="58" width="5" height="18" rx="2.5" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
        </g>
      </g>

      {/* WHEELS & UNDERCARRIAGE */}
      <g id="wheels">
        {/* Back Wheel Left */}
        <circle cx="120" cy="136" r="16" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
        <circle cx="120" cy="136" r="8" fill="#64748B" />
        <circle cx="120" cy="136" r="3" fill="#94A3B8" />

        {/* Back Wheel Right */}
        <circle cx="156" cy="136" r="16" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
        <circle cx="156" cy="136" r="8" fill="#64748B" />
        <circle cx="156" cy="136" r="3" fill="#94A3B8" />

        {/* Front Wheel Left */}
        <circle cx="48" cy="136" r="16" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
        <circle cx="48" cy="136" r="8" fill="#64748B" />
        <circle cx="48" cy="136" r="3" fill="#94A3B8" />
      </g>
    </svg>
  );
}
