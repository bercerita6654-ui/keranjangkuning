import React from 'react';

interface GlobalMartLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'icon';
}

export const GlobalMartLogo: React.FC<GlobalMartLogoProps> = ({ 
  className = "h-12 sm:h-16", 
  variant = 'full' 
}) => {
  const gifUrl = "https://lottie.host/bc8f3db1-1bac-476d-b41e-8d96a9557932/EGztHdMO4m.gif";

  const renderIcon = () => {
    return (
      <img
        src={gifUrl}
        alt="Yuk belanja"
        loading="lazy"
        className="h-full w-auto object-contain transform scale-130 min-h-[50px] sm:min-h-[64px]"
      />
    );
  };

  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        {renderIcon()}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Animated Icon GIF Container */}
      <div className="h-full aspect-square relative shrink-0 flex items-center justify-center p-0.5">
        {renderIcon()}
      </div>

      {/* Yellow Brand Banner Box */}
      <svg 
        viewBox="0 0 425 88" 
        className="h-full w-auto max-w-full drop-shadow-sm overflow-visible shrink-0" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="banner">
          <rect 
            x="0" 
            y="0" 
            width="425" 
            height="88" 
            rx="6"
            fill="#FFFF00" 
            stroke="#000000" 
            strokeWidth="3.5" 
          />
          {/* Main Blue Text: GLOBAL MART */}
          <text 
            x="212.5" 
            y="52" 
            textAnchor="middle" 
            fontFamily="'Arial Black', Impact, -apple-system, sans-serif" 
            fontSize="44" 
            fontWeight="900" 
            letterSpacing="1.5"
            fill="#0000EE"
            style={{ fontStretch: 'condensed' }}
          >
            GLOBAL MART
          </text>
          
          {/* Sub Red Text: ALAT TULIS KANTOR & SEKOLAH */}
          <text 
            x="212.5" 
            y="76" 
            textAnchor="middle" 
            fontFamily="'Arial Black', Impact, -apple-system, sans-serif" 
            fontSize="17.5" 
            fontWeight="900" 
            letterSpacing="1"
            fill="#EE0000"
          >
            ALAT TULIS KANTOR &amp; SEKOLAH
          </text>
        </g>
      </svg>
    </div>
  );
};


