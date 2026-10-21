import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { KanbanBoard } from './KanbanBoard';
import { QuotationBuilder } from './QuotationBuilder';
import { OrdersManager } from './OrdersManager';
import { ClientsDirectory } from './ClientsDirectory';
import { SalesScriptsView } from './SalesScriptsView';
import { CompanySettingsView } from './CompanySettingsView';
import { ProductsManager } from './ProductsManager';
import { PerformanceAnalyticsView } from './PerformanceAnalyticsView';
import { SupplierSyncDashboard } from './suppliers/SupplierSyncDashboard';
import { CrmLoginView } from './CrmLoginView';
import { CrmNotificationCenter, CrmToastAlert } from './CrmNotificationCenter';
import { CrmNotificationsView } from './CrmNotificationsView';
import { formatCurrency } from '../../utils/formatters';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  FileText, 
  MessageSquare, 
  Store, 
  Layers,
  Settings,
  LogOut,
  UserCheck,
  Boxes,
  BarChart3,
  Bell,
  Globe
} from 'lucide-react';

export const CrmDashboard: React.FC = () => {
  const { 
    products,
    supplierProducts,
    supplierSources,
    deals, 
    orders, 
    clients, 
    setActiveTab, 
    isCrmAuthenticated, 
    crmUser, 
    logoutCrm,
    unreadNotificationsCount,
    urgentNotificationsCount,
    companySettings
  } = useStore();

  const [crmSubTab, setCrmSubTab] = useState<'kanban' | 'analytics' | 'suppliers' | 'products' | 'quote' | 'orders' | 'clients' | 'alerts' | 'scripts' | 'settings'>('kanban');

  // If not authenticated, require username and password to manage CRM from within!
  if (!isCrmAuthenticated) {
    return <CrmLoginView />;
  }

  // Compute live KPIs
  const wonDeals = deals.filter((d) => d.stage === 'won');
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered');
  
  const totalRevenueWon = wonDeals.reduce((sum, d) => sum + d.totalAmount, 0) + 
                          paidOrders.reduce((sum, o) => sum + o.total, 0);

  const activePipelineDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const activePipelineValue = activePipelineDeals.reduce((sum, d) => sum + d.totalAmount, 0);

  const totalClosedOrdersCount = wonDeals.length + paidOrders.length;
  const averageTicket = totalClosedOrdersCount > 0 ? Math.round(totalRevenueWon / totalClosedOrdersCount) : 280000;

  return (
    <div className="min-h-screen bg-zinc-100/70 pb-20">
      
      {/* Top Banner Bar */}
      <div className="bg-zinc-900 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-orange-600 px-2 py-0.5 rounded text-white">
                  CRM MAYORISTA {companySettings?.companyName?.toUpperCase() || 'NUVOH'}
                </span>
                <span className="text-xs text-zinc-400">
                  Panel de Ventas &amp; Distribución
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight mt-1">
                Centro de Operaciones Comerciales
              </h1>
            </div>

            {/* Authenticated user badge & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-zinc-800/90 border border-zinc-700 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-orange-600/30 text-orange-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block text-[11px] leading-tight">
                    {crmUser?.name || 'Administrador'}
                  </strong>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    {crmUser?.role || 'Gerente Comercial'}
                  </span>
                </div>
              </div>

              {/* Notification Center Trigger */}
              <CrmNotificationCenter onNavigateToTab={(tab) => setCrmSubTab(tab as any)} />

              <button
                onClick={() => setActiveTab('store')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <Store className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Tienda</span>
              </button>

              <button
                onClick={logoutCrm}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-800/50"
                title="Cerrar sesión del CRM"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            
            <div className="bg-zinc-800/90 rounded-2xl p-4 border border-zinc-700/80">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Facturación Cerrada:</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums tracking-tight">
                {formatCurrency(totalRevenueWon, false)}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                {totalClosedOrdersCount} ventas confirmadas
              </span>
            </div>

            <div className="bg-zinc-800/90 rounded-2xl p-4 border border-zinc-700/80">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Pipeline Activo:</span>
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-orange-400 tabular-nums tracking-tight">
                {formatCurrency(activePipelineValue, false)}
              </div>
              <span className="text-[10px] text-zinc-400">
                {activePipelineDeals.length} oportunidades en negociación
              </span>
            </div>

            <div className="bg-zinc-800/90 rounded-2xl p-4 border border-zinc-700/80">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Ticket Promedio:</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums tracking-tight">
                {formatCurrency(averageTicket, false)}
              </div>
              <span className="text-[10px] text-zinc-400">
                Escala mayorista B2B
              </span>
            </div>

            <div className="bg-zinc-800/90 rounded-2xl p-4 border border-zinc-700/80">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Clientes Activos:</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums tracking-tight">
                {clients.length}
              </div>
              <span className="text-[10px] text-zinc-400">
                Comercios y revendedores
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* CRM Navigation Subtabs */}
      <div className="bg-white border-b border-zinc-200 sticky top-18 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5">
            <button
              onClick={() => setCrmSubTab('kanban')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'kanban'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Pipeline Kanban</span>
            </button>

            <button
              onClick={() => setCrmSubTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'analytics'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span>Performance Analytics</span>
            </button>

            <button
              onClick={() => setCrmSubTab('suppliers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'suppliers'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Globe className="w-4 h-4 text-orange-500" />
              <span>Sincronización Web &amp; Dropshipping ({supplierProducts.length})</span>
              {supplierProducts.some((p) => p.hasCostChanged) && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Variaciones de costo detectadas" />
              )}
            </button>

            <button
              onClick={() => setCrmSubTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'products'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Boxes className="w-4 h-4 text-orange-500" />
              <span>Productos &amp; Catálogo ({products.length})</span>
            </button>

            <button
              onClick={() => setCrmSubTab('quote')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'quote'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Cotizador Mayorista</span>
            </button>

            <button
              onClick={() => setCrmSubTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'orders'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Package className="w-4 h-4 text-orange-500" />
              <span>Pedidos &amp; Remitos ({orders.length})</span>
            </button>

            <button
              onClick={() => setCrmSubTab('clients')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'clients'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Users className="w-4 h-4 text-orange-500" />
              <span>Directorio Clientes ({clients.length})</span>
            </button>

            <button
              onClick={() => setCrmSubTab('alerts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'alerts'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Bell className="w-4 h-4 text-orange-500" />
              <span>Notificaciones &amp; Alertas</span>
              {unreadNotificationsCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black text-white ${
                  urgentNotificationsCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
                }`}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCrmSubTab('scripts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'scripts'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>Guiones WhatsApp</span>
            </button>

            <button
              onClick={() => setCrmSubTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                crmSubTab === 'settings'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Settings className="w-4 h-4 text-orange-500" />
              <span>Configuración Empresa &amp; Pagos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab Contents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {crmSubTab === 'kanban' && <KanbanBoard />}
        {crmSubTab === 'analytics' && <PerformanceAnalyticsView />}
        {crmSubTab === 'suppliers' && <SupplierSyncDashboard />}
        {crmSubTab === 'products' && <ProductsManager />}
        {crmSubTab === 'quote' && <QuotationBuilder />}
        {crmSubTab === 'orders' && <OrdersManager />}
        {crmSubTab === 'clients' && <ClientsDirectory />}
        {crmSubTab === 'alerts' && <CrmNotificationsView onNavigateToTab={(tab) => setCrmSubTab(tab as any)} />}
        {crmSubTab === 'scripts' && <SalesScriptsView />}
        {crmSubTab === 'settings' && <CompanySettingsView />}
      </main>

      {/* Realtime Floating Toast Alerts */}
      <CrmToastAlert onNavigateToTab={(tab) => setCrmSubTab(tab as any)} />

    </div>
  );
};
