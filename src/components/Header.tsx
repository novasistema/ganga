import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  MessageCircle,
  Truck,
  Sparkles,
  LogIn,
  LogOut,
  X,
  Package
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  isAdminView: boolean;
  onToggleView: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onOpenLogin,
  isAdminView,
  onToggleView
}) => {
  const {
    settings,
    cartCount,
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    setIsBudgetTrackingOpen
  } = useStore();
  const { isAdmin, logoutAdmin } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const formatWhatsAppLink = () => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hola ${settings.companyName}, tengo una consulta sobre sus productos.`);
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      {/* Top Announcement Bar */}
      {settings.announcementText && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white text-xs py-2 px-4 sm:px-8 xl:px-12">
          <div className="max-w-[1760px] w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-medium tracking-wide truncate">{settings.announcementText}</span>
            </div>
            <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px] text-indigo-200">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                Despacho en 24h
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                Compra Protegida
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-[1760px] w-full mx-auto px-4 sm:px-8 xl:px-12 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isAdminView) onToggleView();
              setSearchQuery('');
            }}
            className="flex items-center gap-2.5 text-left focus:outline-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {settings.companyName || 'DropStore'}
                </span>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                Dropshipping & E-Commerce Centralizado
              </p>
            </div>
          </button>
        </div>

        {/* Search Bar (Only in customer view) */}
        {!isAdminView && (
          <div className="flex-1 max-w-2xl mx-2 hidden md:block">
            <div
              className={`relative flex items-center rounded-xl border transition-all ${
                isSearchFocused
                  ? 'border-indigo-600 ring-2 ring-indigo-100 bg-white'
                  : 'border-gray-200 bg-gray-50/80 hover:bg-gray-100/80'
              }`}
            >
              <Search className="w-4 h-4 text-gray-400 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="Buscar productos, marcas, gadgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full py-2.5 pl-2.5 pr-8 text-sm bg-transparent border-none focus:outline-hidden text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tracking / Pay Order Button */}
          {!isAdminView && (
            <button
              onClick={() => setIsBudgetTrackingOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Consultar estado de presupuesto o pagar orden"
            >
              <Package className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Seguimiento / Pagar</span>
              <span className="md:hidden">Pedido</span>
            </button>
          )}

          {/* WhatsApp Support button */}
          <a
            href={formatWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors shadow-2xs"
            title="Atención por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
            <span>WhatsApp</span>
          </a>

          {/* Admin CRM Access Button */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleView}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                  isAdminView
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{isAdminView ? 'Ver Tienda' : 'Panel CRM'}</span>
              </button>
              <button
                onClick={logoutAdmin}
                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Cerrar sesión de administrador"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200/90 rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Ingreso CRM</span>
              <span className="sm:hidden">CRM</span>
            </button>
          )}

          {/* Cart Trigger */}
          {!isAdminView && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-transform active:scale-95 shadow-md shadow-gray-200 flex items-center justify-center"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {!isAdminView && (
        <div className="px-4 pb-3 md:hidden">
          <div className="relative flex items-center rounded-xl border border-gray-200 bg-gray-50">
            <Search className="w-4 h-4 text-gray-400 ml-3" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-2 pr-8 text-sm bg-transparent border-none focus:outline-hidden"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 mr-2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
