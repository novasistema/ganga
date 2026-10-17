import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  ShieldCheck,
  Zap,
  CreditCard,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Truck,
  Tag,
  Gift,
  Sparkles,
  Award,
  Layers,
  Edit3
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { HeroBannerItem } from '../types';

interface HeroBannerProps {
  onEditBanners?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onEditBanners }) => {
  const { banners, setActiveCategory } = useStore();
  const { isAdmin } = useAuth();

  const activeBanners = React.useMemo(() => {
    const list = banners.filter((b) => b.active);
    return list.length > 0 ? list : banners;
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Keep currentIndex in bounds when activeBanners changes
  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // Auto slide interval
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  const currentBanner: HeroBannerItem = activeBanners[currentIndex] || activeBanners[0];

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState({
    hours: currentBanner?.countdownHours || 7,
    minutes: currentBanner?.countdownMinutes || 42,
    seconds: 18,
  });

  useEffect(() => {
    // Reset timer according to current banner
    setTimeLeft({
      hours: currentBanner?.countdownHours || 7,
      minutes: currentBanner?.countdownMinutes || 59,
      seconds: 45,
    });
  }, [currentIndex, currentBanner?.countdownHours, currentBanner?.countdownMinutes]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrimaryClick = () => {
    if (currentBanner.primaryButtonAction === 'category' && currentBanner.primaryButtonTarget) {
      setActiveCategory(currentBanner.primaryButtonTarget);
    }
    const catalogEl = document.getElementById('catalog-section');
    catalogEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSecondaryClick = () => {
    if (currentBanner.secondaryButtonCategory) {
      setActiveCategory(currentBanner.secondaryButtonCategory);
    }
    const catalogEl = document.getElementById('catalog-section');
    catalogEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'credit-card':
        return <CreditCard className="w-5 h-5 text-indigo-400" />;
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-amber-400" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'truck':
        return <Truck className="w-5 h-5 text-cyan-400" />;
      case 'tag':
        return <Tag className="w-5 h-5 text-emerald-400" />;
      case 'gift':
        return <Gift className="w-5 h-5 text-purple-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-rose-400" />;
      case 'badge':
        return <Award className="w-5 h-5 text-yellow-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const gradientClass = currentBanner.backgroundGradient || 'from-slate-900 via-indigo-950 to-slate-900';

  // Split title if titleHighlight is provided
  const renderFormattedTitle = () => {
    const rawTitle = currentBanner.title;
    const highlight = currentBanner.titleHighlight?.trim();
    if (!highlight || !rawTitle.toLowerCase().includes(highlight.toLowerCase())) {
      return (
        <span className="text-white">
          {rawTitle}
        </span>
      );
    }

    const idx = rawTitle.toLowerCase().indexOf(highlight.toLowerCase());
    const before = rawTitle.slice(0, idx);
    const match = rawTitle.slice(idx, idx + highlight.length);
    const after = rawTitle.slice(idx + highlight.length);

    return (
      <>
        <span>{before}</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 font-black">
          {match}
        </span>
        <span>{after}</span>
      </>
    );
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group relative overflow-hidden bg-gradient-to-br ${gradientClass} text-white rounded-3xl mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-4 sm:mt-6 shadow-2xl border border-indigo-900/50 transition-all duration-700`}
    >
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Admin Fast-Edit Button */}
      {isAdmin && onEditBanners && (
        <button
          onClick={onEditBanners}
          title="Editar banners y portada en el Panel de Administración"
          className="absolute top-4 right-4 z-30 px-3 py-1.5 bg-slate-900/90 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer opacity-80 hover:opacity-100"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-300" />
          <span>Editar Banners</span>
        </button>
      )}

      {/* Multi-banner navigation arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-md transition-all opacity-80 hover:opacity-100 hover:scale-105 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Siguiente banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-md transition-all opacity-80 hover:opacity-100 hover:scale-105 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Main Banner Content */}
      <div className="relative px-6 py-10 sm:px-12 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headlines & Call to Action */}
        <div className="lg:col-span-7 space-y-5 animate-fade-in">
          {/* Badge Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide uppercase">
            {currentBanner.badgeIcon === 'zap' ? (
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            ) : currentBanner.badgeIcon === 'sparkles' ? (
              <Sparkles className="w-4 h-4 text-amber-300" />
            ) : (
              <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-bounce" />
            )}
            <span>{currentBanner.badgeText}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-none text-white">
            {renderFormattedTitle()}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
            {currentBanner.description}
          </p>

          {/* Countdown timer */}
          {currentBanner.showCountdown && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                {currentBanner.countdownLabel || 'La liquidación finaliza en:'}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-sm">
                <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg font-bold text-amber-300 shadow-inner">
                  {formatNumber(timeLeft.hours)}h
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg font-bold text-amber-300 shadow-inner">
                  {formatNumber(timeLeft.minutes)}m
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg font-bold text-amber-300 shadow-inner">
                  {formatNumber(timeLeft.seconds)}s
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={handlePrimaryClick}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
            >
              <span>{currentBanner.primaryButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {currentBanner.secondaryButtonText && (
              <button
                onClick={handleSecondaryClick}
                className="px-5 py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
              >
                {currentBanner.secondaryButtonText}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Visual Showcase & Perks */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 animate-fade-in">
          {(currentBanner.features && currentBanner.features.length > 0
            ? currentBanner.features
            : [
                { id: '1', icon: 'zap', title: 'Despacho Veloz', description: 'Envíos rastreados directo a la puerta de tu domicilio.' },
                { id: '2', icon: 'credit-card', title: '3 Cuotas Sin Interés', description: 'Pagos en cuotas o 10% OFF pagando por Transferencia.' },
                { id: '3', icon: 'shield', title: 'Garantía Asegurada', description: '30 días de cambio inmediato sin preguntas.' },
                { id: '4', icon: 'flame', title: 'Stock en Tiempo Real', description: 'Sincronización directa con base de datos en Firebase.' },
              ]
          ).map((feat) => (
            <div
              key={feat.id}
              className="bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-800/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-700/40 flex items-center justify-center mb-3">
                {renderFeatureIcon(feat.icon)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{feat.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{feat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-banner bottom pagination & indicator dots */}
      {activeBanners.length > 1 && (
        <div className="pb-4 pt-1 flex items-center justify-center gap-2">
          {activeBanners.map((b, idx) => (
            <button
              key={b.id || idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`h-2 transition-all rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-8 bg-amber-400 shadow-sm shadow-amber-400/50'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
          <span className="text-[10px] text-slate-400 font-mono ml-2">
            {currentIndex + 1} / {activeBanners.length}
          </span>
        </div>
      )}
    </div>
  );
};
