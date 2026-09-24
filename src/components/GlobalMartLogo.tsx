import React from 'react';

interface GlobalMartLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'icon';
}

export const GlobalMartLogo: React.FC<GlobalMartLogoProps> = ({ 
  className = "h-11", 
  variant = 'full' 
}) => {
  if (variant === 'icon') {
    return (
      <svg 
        viewBox="0 0 160 300" 
        className={className} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Balinese Udeng Headcloth */}
        <path d="M45 42 C45 20, 60 10, 85 10 C110 10, 130 20, 135 38 C145 35, 155 45, 150 65 C145 78, 135 85, 130 90 L35 90 C30 85, 20 75, 25 55 C28 42, 38 35, 45 42 Z" fill="#E61A1A" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M40 22 C55 12, 70 8, 88 12 C72 25, 58 35, 40 22 Z" fill="#B91212" stroke="#000000" strokeWidth="3" />
        <path d="M90 10 C98 5, 115 5, 125 18 C115 28, 105 32, 90 10 Z" fill="#FF4D4D" stroke="#000000" strokeWidth="3" />
        <path d="M30 65 C45 55, 125 55, 140 65 L135 85 C120 78, 45 78, 32 85 Z" fill="#C51313" stroke="#000000" strokeWidth="3" />
        
        {/* Flower on Ear */}
        <g transform="translate(132, 60) scale(0.65)">
          <path d="M0 0 C-10 -15, 10 -25, 0 -35 C-10 -25, -20 -15, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
          <path d="M0 0 C15 -10, 25 10, 35 0 C25 -10, 15 -20, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
          <path d="M0 0 C10 15, -10 25, 0 35 C10 25, 20 15, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
          <path d="M0 0 C-15 10, -25 -10, -35 0 C-25 10, -15 20, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
          <circle cx="0" cy="0" r="7" fill="#FACC15" stroke="#000000" strokeWidth="3" />
        </g>

        {/* Head / Face */}
        <rect x="36" y="85" width="94" height="65" fill="#FFFBEB" stroke="#000000" strokeWidth="4" />

        {/* Eyes */}
        <ellipse cx="62" cy="115" rx="14" ry="17" fill="#FFFFFF" stroke="#000000" strokeWidth="4" />
        <ellipse cx="102" cy="115" rx="14" ry="17" fill="#FFFFFF" stroke="#000000" strokeWidth="4" />
        <ellipse cx="64" cy="116" rx="6" ry="8" fill="#000000" />
        <ellipse cx="100" cy="116" rx="6" ry="8" fill="#000000" />
        <circle cx="61" cy="112" r="2.5" fill="#FFFFFF" />
        <circle cx="97" cy="112" r="2.5" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M50 95 C56 90, 68 90, 74 95" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M92 95 C98 90, 110 90, 116 95" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />

        {/* Smile */}
        <path d="M60 132 Q82 152 104 132 Z" fill="#000000" stroke="#000000" strokeWidth="3" />
        <path d="M68 138 Q82 152 96 138 Z" fill="#EF4444" />
        <path d="M60 132 Q82 135 104 132" stroke="#FFFFFF" strokeWidth="4" fill="none" />

        {/* Body & Clothes */}
        <rect x="36" y="150" width="94" height="65" fill="#E60000" stroke="#000000" strokeWidth="4" />
        {/* Balinese gold pattern on vest */}
        <path d="M48 150 L60 215 M118 150 L106 215" stroke="#FFE800" strokeWidth="5" />
        <path d="M62 170 Q83 185 104 170 M60 195 Q83 205 106 195" stroke="#FFE800" strokeWidth="4" fill="none" />
        <rect x="70" y="160" width="26" height="40" fill="#FFE800" stroke="#000000" strokeWidth="2.5" />

        {/* Blue arms & Greeting Hands (Panganjali / Namaste) */}
        <path d="M36 160 C20 165, 20 200, 48 200 L56 185 C42 185, 38 175, 42 165 Z" fill="#0088FF" stroke="#000000" strokeWidth="3.5" />
        <path d="M130 160 C146 165, 146 200, 118 200 L110 185 C124 185, 128 175, 124 165 Z" fill="#0088FF" stroke="#000000" strokeWidth="3.5" />
        <path d="M72 195 C70 178, 83 162, 83 162 C83 162, 96 178, 94 195 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M83 164 L83 195" stroke="#000000" strokeWidth="2.5" />

        {/* Pencil Wood Tip & Lead */}
        <path d="M36 215 L83 275 L130 215 Z" fill="#FFFBEB" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M36 215 Q59 228 83 215 Q107 228 130 215" stroke="#000000" strokeWidth="3.5" fill="none" />
        <path d="M68 256 L83 275 L98 256 Z" fill="#000000" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg 
        viewBox="0 0 540 180" 
        className="h-full w-auto max-w-full drop-shadow-sm overflow-visible" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Yellow Banner Box */}
        <g id="banner">
          <rect 
            x="105" 
            y="46" 
            width="425" 
            height="88" 
            rx="2"
            fill="#FFFF00" 
            stroke="#000000" 
            strokeWidth="3.5" 
          />
          {/* Main Blue Text: GLOBAL MART */}
          <text 
            x="318" 
            y="96" 
            textAnchor="middle" 
            fontFamily="'Arial Black', Impact, -apple-system, sans-serif" 
            fontSize="48" 
            fontWeight="900" 
            letterSpacing="1.5"
            fill="#0000EE"
            style={{ fontStretch: 'condensed' }}
          >
            GLOBAL MART
          </text>
          
          {/* Sub Red Text: ALAT TULIS KANTOR & SEKOLAH */}
          <text 
            x="318" 
            y="124" 
            textAnchor="middle" 
            fontFamily="'Arial Black', Impact, -apple-system, sans-serif" 
            fontSize="18.5" 
            fontWeight="900" 
            letterSpacing="1"
            fill="#EE0000"
          >
            ALAT TULIS KANTOR &amp; SEKOLAH
          </text>
        </g>

        {/* Mascot Pencil Character */}
        <g id="mascot" transform="translate(12, -10) scale(0.70)">
          {/* Balinese Udeng Headcloth */}
          <path d="M45 42 C45 20, 60 10, 85 10 C110 10, 130 20, 135 38 C145 35, 155 45, 150 65 C145 78, 135 85, 130 90 L35 90 C30 85, 20 75, 25 55 C28 42, 38 35, 45 42 Z" fill="#EE0000" stroke="#000000" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M40 22 C55 12, 70 8, 88 12 C72 25, 58 35, 40 22 Z" fill="#BB0000" stroke="#000000" strokeWidth="3" />
          <path d="M90 10 C98 5, 115 5, 125 18 C115 28, 105 32, 90 10 Z" fill="#FF3333" stroke="#000000" strokeWidth="3" />
          <path d="M30 65 C45 55, 125 55, 140 65 L135 85 C120 78, 45 78, 32 85 Z" fill="#CC0000" stroke="#000000" strokeWidth="3" />
          
          {/* Flower on Ear */}
          <g transform="translate(132, 60) scale(0.65)">
            <path d="M0 0 C-10 -15, 10 -25, 0 -35 C-10 -25, -20 -15, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
            <path d="M0 0 C15 -10, 25 10, 35 0 C25 -10, 15 -20, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
            <path d="M0 0 C10 15, -10 25, 0 35 C10 25, 20 15, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
            <path d="M0 0 C-15 10, -25 -10, -35 0 C-25 10, -15 20, 0 0 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3.5" />
            <circle cx="0" cy="0" r="7" fill="#FFFF00" stroke="#000000" strokeWidth="3.5" />
          </g>

          {/* Head / Face */}
          <rect x="36" y="85" width="94" height="65" fill="#FFFBEB" stroke="#000000" strokeWidth="4.5" />

          {/* Eyes */}
          <ellipse cx="62" cy="115" rx="14" ry="17" fill="#FFFFFF" stroke="#000000" strokeWidth="4.5" />
          <ellipse cx="102" cy="115" rx="14" ry="17" fill="#FFFFFF" stroke="#000000" strokeWidth="4.5" />
          <ellipse cx="64" cy="116" rx="6" ry="8" fill="#000000" />
          <ellipse cx="100" cy="116" rx="6" ry="8" fill="#000000" />
          <circle cx="61" cy="112" r="2.5" fill="#FFFFFF" />
          <circle cx="97" cy="112" r="2.5" fill="#FFFFFF" />

          {/* Eyebrows */}
          <path d="M50 95 C56 90, 68 90, 74 95" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
          <path d="M92 95 C98 90, 110 90, 116 95" stroke="#000000" strokeWidth="4" strokeLinecap="round" />

          {/* Smile */}
          <path d="M60 132 Q82 152 104 132 Z" fill="#000000" stroke="#000000" strokeWidth="3.5" />
          <path d="M68 138 Q82 152 96 138 Z" fill="#EE0000" />
          <path d="M60 132 Q82 135 104 132" stroke="#FFFFFF" strokeWidth="4" fill="none" />

          {/* Body & Clothes */}
          <rect x="36" y="150" width="94" height="65" fill="#EE0000" stroke="#000000" strokeWidth="4.5" />
          {/* Balinese gold pattern on vest */}
          <path d="M48 150 L60 215 M118 150 L106 215" stroke="#FFFF00" strokeWidth="5.5" />
          <path d="M62 170 Q83 185 104 170 M60 195 Q83 205 106 195" stroke="#FFFF00" strokeWidth="4.5" fill="none" />
          <rect x="70" y="160" width="26" height="40" fill="#FFFF00" stroke="#000000" strokeWidth="3" />

          {/* Blue arms & Greeting Hands (Panganjali / Namaste) */}
          <path d="M36 160 C18 165, 18 200, 48 200 L56 185 C42 185, 38 175, 42 165 Z" fill="#0088FF" stroke="#000000" strokeWidth="4" />
          <path d="M130 160 C148 165, 148 200, 118 200 L110 185 C124 185, 128 175, 124 165 Z" fill="#0088FF" stroke="#000000" strokeWidth="4" />
          <path d="M72 195 C70 178, 83 162, 83 162 C83 162, 96 178, 94 195 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
          <path d="M83 164 L83 195" stroke="#000000" strokeWidth="3" />

          {/* Pencil Wood Tip & Lead */}
          <path d="M36 215 L83 275 L130 215 Z" fill="#FFFBEB" stroke="#000000" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M36 215 Q59 228 83 215 Q107 228 130 215" stroke="#000000" strokeWidth="4" fill="none" />
          <path d="M68 256 L83 275 L98 256 Z" fill="#000000" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
};
