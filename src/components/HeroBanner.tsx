import React, { useState, useEffect } from 'react';
import { Flame, Clock, ShieldCheck, Zap, CreditCard, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const HeroBanner: React.FC = () => {
  const { setActiveCategory } = useStore();
  const [timeLeft, setTimeLeft] = useState({
    hours: 7,
    minutes: 42,
    seconds: 18,
  });

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

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-4 sm:mt-6 shadow-xl border border-indigo-900/50">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative px-6 py-10 sm:px-12 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headlines & Call to Action */}
        <div className="lg:col-span-7 space-y-5">
          {/* Flash Sale Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide uppercase">
            <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-bounce" />
            <span>Ofertas Flash de Temporada • Hasta 50% OFF</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-none text-white">
            Los Productos en Tendencia con <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300">Entrega Directa</span> a tu Hogar
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
            Descubre artículos importados exclusivos de alta demanda, con garantía oficial, stock actualizado en tiempo real y múltiples facilidades de pago automatizadas.
          </p>

          {/* Countdown timer */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              La liquidación finaliza en:
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

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => {
                const catalogEl = document.getElementById('catalog-section');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Explorar Ofertas Disponibles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveCategory('Tecnología')}
              className="px-5 py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm rounded-xl transition-all"
            >
              Ver Tecnología & Gadgets
            </button>
          </div>
        </div>

        {/* Right Column: Visual Showcase & Perks */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
          <div className="bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Despacho Veloz</h4>
              <p className="text-xs text-slate-400 mt-1">Envíos rastreados directo a la puerta de tu domicilio.</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">3 Cuotas Sin Interés</h4>
              <p className="text-xs text-slate-400 mt-1">Pagos en cuotas o 10% OFF pagando por Transferencia.</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Garantía Asegurada</h4>
              <p className="text-xs text-slate-400 mt-1">30 días de cambio inmediato sin preguntas.</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-800/80 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Stock en Tiempo Real</h4>
              <p className="text-xs text-slate-400 mt-1">Sincronización directa con base de datos en Firebase.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
