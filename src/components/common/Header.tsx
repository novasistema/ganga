import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingCart, LayoutDashboard, Store, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, cartItemCount, cartTotal, isMinimumReached, setIsCartOpen, companySettings } = useStore();
  const brandName = companySettings?.companyName?.trim() || 'NUVOH';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      {/* Top micro bar with wholesale trust info */}
      <div className="bg-zinc-900 text-zinc-300 text-xs py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
        <div className="flex items-center gap-4 text-[11px] sm:text-xs">
          <span className="font-semibold text-orange-400 tracking-wider uppercase">PRECIOS MAYORISTAS</span>
          <span className="hidden md:inline text-zinc-500">|</span>
          <span className="hidden md:inline text-zinc-400">Stock real de importador directo</span>
          <span className="hidden md:inline text-zinc-500">|</span>
          <span className="text-zinc-300">Envíos a todo el país</span>
          <span className="hidden lg:inline text-zinc-500">|</span>
          <span className="hidden lg:flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Firestore Real-Time Activo</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-zinc-400">Pedido mínimo:</span>
          <span className="text-orange-400 font-bold font-mono">{formatCurrency(companySettings?.minimumOrder || 100000)} ARS</span>
          <span className="text-zinc-500">·</span>
          <span className="text-emerald-400 font-medium">Surtido libre</span>
        </div>
      </div>

      {/* Main header row conforming to Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('store')}
            className="flex items-center gap-2.5 text-left group transition-transform hover:opacity-95"
          >
            {/* Logo mark with initial */}
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-sm shadow-orange-600/30 font-display">
              {brandName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-zinc-900 font-display">
                  {brandName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                  MAYORISTA
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium hidden sm:block">
                Tecnología para tu hogar
              </p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'store'
                ? 'bg-zinc-100 text-zinc-950 font-bold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
          >
            <Store className="w-4 h-4 text-orange-600" />
            <span>Tienda Mayorista</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'crm'
                ? 'bg-zinc-900 text-white font-bold shadow-sm'
                : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-orange-400" />
            <span>CRM &amp; Ventas</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Cart / Fast Switch */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile view quick switcher */}
          <div className="flex md:hidden items-center gap-1 bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('store')}
              className={`p-1.5 rounded-md ${activeTab === 'store' ? 'bg-white shadow-xs text-orange-600' : 'text-zinc-600'}`}
              title="Tienda"
            >
              <Store className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`p-1.5 rounded-md ${activeTab === 'crm' ? 'bg-white shadow-xs text-orange-600' : 'text-zinc-600'}`}
              title="CRM Ventas"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </div>

          {/* Cart button with dynamic wholesale status */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm transition-all duration-150 active:scale-98"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-zinc-950 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-[11px] font-medium opacity-90">Mi Pedido</span>
              <span className="text-xs font-bold font-mono tabular-nums">
                {cartTotal > 0 ? formatCurrency(cartTotal, false) : '$0'}
              </span>
            </div>
            {isMinimumReached && (
              <span className="hidden lg:inline-flex items-center text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded text-white ml-1">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                MÍNIMO OK
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
