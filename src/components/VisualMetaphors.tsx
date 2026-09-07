import React from 'react';

/**
 * Minimalist geometric sunrise representing hope, light, and new beginnings.
 */
export const MinimalistSunrise: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const dimensions = {
    sm: 'w-12 h-8',
    md: 'w-24 h-14',
    lg: 'w-36 h-20',
  }[size];

  return (
    <div className={`relative flex items-end justify-center ${dimensions} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 70" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sunGlow" cx="60" cy="70" r="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FACC15" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#FEF08A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
        </defs>

        {/* Ambient background glow */}
        <circle cx="60" cy="70" r="55" fill="url(#sunGlow)" />

        {/* Minimalist geometric sun rays */}
        <line x1="60" y1="5" x2="60" y2="18" stroke="url(#rayGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="14" x2="38" y2="25" stroke="url(#rayGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="14" x2="82" y2="25" stroke="url(#rayGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="8" y1="38" x2="20" y2="44" stroke="url(#rayGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="112" y1="38" x2="100" y2="44" stroke="url(#rayGradient)" strokeWidth="3" strokeLinecap="round" />

        {/* Sun dome */}
        <path d="M25 70 A35 35 0 0 1 95 70" fill="#FACC15" />
        <path d="M35 70 A25 25 0 0 1 85 70" fill="#FDE047" />
        <path d="M45 70 A15 15 0 0 1 75 70" fill="#FEF08A" />

        {/* Horizon baseline */}
        <line x1="0" y1="70" x2="120" y2="70" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/**
 * Minimalist stylized bandage and care symbol.
 * Represents tender care, listening, and psychological accompaniment (without graphic wounds).
 */
export const CareSymbol: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 80 80" className="w-10 h-10 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Support circle network around the care badge */}
        <circle cx="40" cy="40" r="34" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="16" cy="24" r="3.5" fill="#FBBF24" />
        <circle cx="64" cy="24" r="3.5" fill="#FBBF24" />
        <circle cx="20" cy="58" r="3.5" fill="#F59E0B" />
        <circle cx="60" cy="58" r="3.5" fill="#F59E0B" />
        <circle cx="40" cy="8" r="3" fill="#FDE047" />

        {/* Stylized rounded golden care bandage tilted gently */}
        <g transform="rotate(-30 40 40)">
          <rect x="18" y="30" width="44" height="20" rx="10" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2" />
          {/* Central soft protective pad */}
          <rect x="32" y="30" width="16" height="20" fill="#FACC15" />
          {/* Micro dots of breathability and care */}
          <circle cx="36" cy="36" r="1.2" fill="#78350F" opacity="0.6" />
          <circle cx="44" cy="36" r="1.2" fill="#78350F" opacity="0.6" />
          <circle cx="36" cy="44" r="1.2" fill="#78350F" opacity="0.6" />
          <circle cx="44" cy="44" r="1.2" fill="#78350F" opacity="0.6" />
          <circle cx="40" cy="40" r="1.2" fill="#78350F" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Visual metaphor for healing: A line transitioning from dashed/fragmented to solid and luminous.
 */
export const HealingPathLine: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Dolor y aislamiento</span>
      <div className="flex-1 h-3 flex items-center">
        <svg viewBox="0 0 300 12" className="w-full h-full" preserveAspectRatio="none" fill="none">
          {/* Segmented fragmented line transitioning to continuous solid line */}
          <line x1="0" y1="6" x2="90" y2="6" stroke="#D1D5DB" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
          <circle cx="95" cy="6" r="3" fill="#FBBF24" />
          <line x1="100" y1="6" x2="190" y2="6" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="6 3" strokeLinecap="round" />
          <circle cx="195" cy="6" r="4" fill="#F59E0B" />
          <line x1="200" y1="6" x2="300" y2="6" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
        Acompañamiento y Sanación
      </span>
    </div>
  );
};

/**
 * Support network nodes illustration: Connected golden lights representing safety and community.
 */
export const SupportNetworkDots: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-6 ${className}`} aria-hidden="true">
      <div className="flex items-center">
        <div className="relative">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 glow-yellow animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-white absolute inset-0 m-auto" />
        </div>
        <div className="w-8 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300" />
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-amber-500 glow-yellow flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div className="w-8 h-0.5 bg-gradient-to-r from-amber-300 to-amber-400" />
        <div className="relative">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 glow-yellow animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-white absolute inset-0 m-auto" />
        </div>
      </div>
    </div>
  );
};
