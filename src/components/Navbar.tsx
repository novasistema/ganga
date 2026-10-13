import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Store, Shield, LogIn, LogOut, Bell, Truck, DollarSign, BarChart3, FileText, Layers, Users, Tag, Building, Settings, LayoutDashboard, Zap, ShieldAlert, Database, Globe } from 'lucide-react';
import { CompanyConfig } from './CompanySettingsManager';

interface NavbarProps {
  viewMode: 'ecommerce' | 'erp';
  setViewMode: (mode: 'ecommerce' | 'erp') => void;
  erpTab: string;
  setErpTab: (tab: any) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  currentUser: any;
  onLogout: () => void;
  pendingOrdersCount: number;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  erpTab,
  setErpTab,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenNotifications,
  currentUser,
  onLogout,
  pendingOrdersCount,
  lowStockCount,
}) => {
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);

  useEffect(() => {
    const loadConfig = () => {
      try {
        const local = localStorage.getItem('importpro_company_config');
        if (local) {
          setCompanyConfig(JSON.parse(local));
        }
      } catch (e) {
        // ignore
      }
    };
    loadConfig();
    const interval = setInterval(loadConfig, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCreator = currentUser?.role === 'Creador';

  return (
    <header className="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-2xl border-b border-white/10 text-white shadow-2xl">
      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-22">
          
          {/* Logo & Brand - GANAGA */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-cyan-400 rounded-2xl flex items-center justify-center glow-indigo shadow-2xl border border-white/25 overflow-hidden">
              {companyConfig?.logoUrl ? (
                <img src={companyConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Zap className="w-6 h-6 text-white animate-pulse" />
              )}
            </div>
            <div>
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent uppercase">
                {companyConfig?.businessName || 'Ganga'}
              </span>
              <span className="block text-[10px] font-extrabold tracking-widest uppercase text-cyan-400">
                {companyConfig?.tradeName || 'ImportPro Global Commerce'}
              </span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="hidden md:flex items-center bg-[#121624] p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={() => setViewMode('ecommerce')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
                viewMode === 'ecommerce'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white glow-indigo shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Store className="w-4 h-4 text-cyan-400" />
              Tienda E-Commerce
            </button>
            <button
              onClick={() => setViewMode('erp')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-300 ${
                viewMode === 'erp'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4 text-fuchsia-400" />
              Sistema ERP Gestión
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {viewMode === 'ecommerce' ? (
              <button
                onClick={onOpenCart}
                className="relative p-3 bg-[#121624] hover:bg-[#1C2338] border border-white/10 rounded-2xl text-slate-200 transition-all flex items-center gap-2.5 group"
                title="Ver Carrito"
              >
                <ShoppingBag className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Carrito</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center glow-magenta animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenNotifications}
                className="relative p-3 bg-[#121624] hover:bg-[#1C2338] border border-white/10 rounded-2xl text-slate-200 transition-all flex items-center gap-2.5 group"
                title="Centro de Alertas Stock"
              >
                <Bell className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Alertas</span>
                {lowStockCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {lowStockCount}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 bg-[#121624] border border-white/10 p-1.5 pl-3.5 rounded-2xl">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{currentUser.displayName || 'Operador'}</p>
                  <p className="text-[10px] text-cyan-400 font-mono">{currentUser.role || 'AUTORIZADO'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-xs glow-magenta">
                  {(currentUser.displayName || 'O').charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 bg-white/5 hover:bg-rose-600/30 hover:border-rose-500/50 rounded-xl text-slate-300 hover:text-rose-400 transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black tracking-wider uppercase transition glow-indigo shadow-xl"
              >
                <LogIn className="w-4 h-4" />
                Acceso Total
              </button>
            )}
          </div>
        </div>

        {/* Mobile Mode Switcher */}
        <div className="flex md:hidden py-3 border-t border-white/10 justify-center gap-3">
          <button
            onClick={() => setViewMode('ecommerce')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase ${
              viewMode === 'ecommerce' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white glow-indigo' : 'bg-[#121624] text-slate-400'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            E-Commerce
          </button>
          <button
            onClick={() => setViewMode('erp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase ${
              viewMode === 'erp' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan' : 'bg-[#121624] text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            ERP Gestión
          </button>
        </div>

        {/* ERP Sub-navigation Tabs */}
        {viewMode === 'erp' && (
          <div className="flex overflow-x-auto py-3 gap-2.5 border-t border-white/10 no-scrollbar">
            {isCreator && (
              <button
                onClick={() => setErpTab('creator')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  erpTab === 'creator'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white glow-magenta shadow-lg'
                    : 'bg-[#121624] text-fuchsia-300 hover:bg-white/5 border border-fuchsia-500/30'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                Panel Creador
              </button>
            )}
            <button
              onClick={() => setErpTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-violet-400" />
              Dashboard KPIs
            </button>
            <button
              onClick={() => setErpTab('invoicing')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'invoicing'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Ventas
            </button>
            <button
              onClick={() => setErpTab('inventory')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'inventory'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              Inventario & Importación
              {lowStockCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setErpTab('suppliers')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'suppliers'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <Building className="w-4 h-4 text-indigo-400" />
              Proveedores & Lead Times
            </button>
            <button
              onClick={() => setErpTab('inova')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'inova'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-cyan-300 hover:bg-white/5 border border-cyan-500/30'
              }`}
            >
              <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
              Conexión Webs & Mayoristas
            </button>
            <button
              onClick={() => setErpTab('clients')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'clients'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <Users className="w-4 h-4 text-fuchsia-400" />
              Módulo Clientes
            </button>
            <button
              onClick={() => setErpTab('pricelists')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'pricelists'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <Tag className="w-4 h-4 text-emerald-400" />
              Listas de Precios
            </button>
            <button
              onClick={() => setErpTab('warehouse')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'warehouse'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-400" />
              Almacén & Pedidos
              {pendingOrdersCount > 0 && (
                <span className="bg-rose-500 text-white font-black px-2 py-0.5 rounded-full text-[10px] animate-bounce">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setErpTab('mercadopago')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'mercadopago'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <DollarSign className="w-4 h-4 text-sky-400" />
              Mercado Pago & Finanzas
            </button>
            <button
              onClick={() => setErpTab('backup')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'backup'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <Database className="w-4 h-4 text-cyan-400" />
              Módulo Backup
            </button>
            <button
              onClick={() => setErpTab('reports')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'reports'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-violet-400" />
              Reportes & AI Insights
            </button>
            <button
              onClick={() => setErpTab('settings')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                erpTab === 'settings'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-300 hover:bg-white/5 border border-white/5'
              }`}
            >
              <Settings className="w-4 h-4 text-pink-400" />
              Configuración Empresa
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
