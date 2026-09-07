import { useState, useEffect } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import sanvyLogo from '../assets/sanvycorporation.png';

interface SanvyIntroProps {
  onComplete: () => void;
}

export function SanvyIntro({ onComplete }: SanvyIntroProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Iniciando experiencia interactiva...');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // List of sources to try in order: local bundled asset, public root, external mirror, raw link
  const logoSources = [
    sanvyLogo,
    '/sanvycorporation.png',
    'https://i.postimg.cc/66PFSwpF/sanvycorporation.png',
  ];

  const currentLogoSrc = logoSources[currentSrcIndex] || sanvyLogo;

  useEffect(() => {
    // Preload image
    const img = new Image();
    img.src = currentLogoSrc;
    img.referrerPolicy = 'no-referrer';
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      // Try next source if available
      if (currentSrcIndex < logoSources.length - 1) {
        setCurrentSrcIndex(prev => prev + 1);
      } else {
        setImageLoaded(true);
      }
    };
  }, [currentSrcIndex, currentLogoSrc]);

  useEffect(() => {
    // Smooth progress counter
    const startTime = Date.now();
    const duration = 2800; // ~2.8s total loading animation

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 35) {
        setStatusText('Cargando plataforma...');
      } else if (pct < 75) {
        setStatusText('Conectando espacio seguro...');
      } else if (pct < 98) {
        setStatusText('Iniciando experiencia interactiva...');
      } else {
        setStatusText('¡Listo para comenzar!');
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          handleFinish();
        }, 350);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <div 
      id="sanvy-intro-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#060814] text-white transition-opacity duration-500 overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 35%, #10163a 0%, #080b1e 45%, #04050d 100%)',
      }}
    >
      {/* Background ambient lighting */}
      <div className="absolute w-96 h-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
        
        {/* Rounded Squircle Container with Soft Glow */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-[2.5rem] blur-xl" />
          
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-[2rem] bg-[#0c102a]/90 border border-indigo-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)] p-4 flex items-center justify-center">
            
            {/* White inner squircle card */}
            <div className="w-full h-full bg-white rounded-2xl p-3 shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              {currentSrcIndex < logoSources.length ? (
                <img
                  src={currentLogoSrc}
                  alt="Sanvy Corporation"
                  className="max-w-full max-h-full object-contain transition-opacity duration-300 opacity-100"
                  onError={() => {
                    if (currentSrcIndex < logoSources.length - 1) {
                      setCurrentSrcIndex(prev => prev + 1);
                    } else {
                      setCurrentSrcIndex(logoSources.length);
                    }
                  }}
                />
              ) : (
                /* Crisp fallback matching exact design */
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 mb-1">
                    <Zap className="w-10 h-10 fill-blue-600 stroke-blue-600" />
                  </div>
                  <span className="font-extrabold tracking-wider text-gray-950 text-xs uppercase mt-1">
                    SANVY
                  </span>
                  <span className="text-[9px] tracking-widest text-gray-500 uppercase -mt-0.5">
                    CORPORATION
                  </span>
                  <span className="text-[7px] text-gray-400 mt-1 font-mono">
                    EST. 2024 • VIEDMA
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Pill Badge */}
        <div className="inline-flex items-center px-4 py-1 rounded-full bg-indigo-950/80 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold tracking-widest uppercase mb-3 shadow-sm">
          SANVY CORPORATION
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5">
          Plataforma Digital de ESI
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 font-normal mb-8">
          Desarrollado para el curso 2.° 4.ª • Exposición de Talleres
        </p>

        {/* Progress status & percentage */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-normal">
              {statusText}
            </span>
            <span className="font-mono font-bold text-blue-400">
              {progress}%
            </span>
          </div>

          {/* Progress bar with glowing gradient */}
          <div className="relative w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-teal-300 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Skip button */}
        <div className="mt-8">
          <button
            id="btn-skip-intro"
            onClick={handleFinish}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span>Saltar intro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
