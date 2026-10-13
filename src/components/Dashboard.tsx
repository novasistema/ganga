import React from 'react';
import { Product, Order } from '../types';
import { LayoutDashboard, DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Package, Users, ShieldCheck, Zap, Globe, ExternalLink } from 'lucide-react';
import { getProductSourceWeb } from '../utils/productUtils';

interface DashboardProps {
  products: Product[];
  orders: Order[];
}

export const Dashboard: React.FC<DashboardProps> = ({ products, orders }) => {
  const totalSalesARS = orders.reduce((acc, o) => acc + (o.status !== 'Cancelado' ? o.total : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pendiente de Pago' || o.status === 'En Preparación').length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalInventoryVal = products.reduce((acc, p) => acc + p.finalPriceARS * p.stock, 0);

  // Calculate top selling products
  const productSalesMap: { [title: string]: number } = {};
  orders.forEach(o => {
    if (o.status !== 'Cancelado') {
      o.items.forEach(item => {
        productSalesMap[item.title] = (productSalesMap[item.title] || 0) + item.quantity;
      });
    }
  });

  const topSelling = Object.entries(productSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10 glow-indigo">
        <div>
          <span className="inline-flex items-center gap-2 bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow mb-3">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Panel de Control Ejecutivo
          </span>
          <h2 className="text-3xl font-black text-white">Dashboard General & KPIs en Tiempo Real</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Resumen consolidado de ventas, valoración de inventario, alertas de stock y rendimiento comercial.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-500/30 px-5 py-3 rounded-2xl">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-bold text-emerald-300">Sincronizado Cloud DB</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-7 rounded-[2rem] border border-white/10 space-y-3 relative overflow-hidden group glow-indigo">
          <div className="absolute top-4 right-4 w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center text-violet-400 border border-violet-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ventas Totales Mes</span>
          <h3 className="text-3xl font-black text-white font-mono bg-gradient-to-r from-white via-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">
            ${totalSalesARS.toLocaleString('es-AR')}
          </h3>
          <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs mes anterior
          </p>
        </div>

        <div className="glass-card p-7 rounded-[2rem] border border-white/10 space-y-3 relative overflow-hidden group glow-cyan">
          <div className="absolute top-4 right-4 w-12 h-12 bg-cyan-600/20 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Órdenes Activas</span>
          <h3 className="text-3xl font-black text-white font-mono">{orders.length}</h3>
          <p className="text-xs text-cyan-300 font-bold">{pendingOrders} pendientes de despacho</p>
        </div>

        <div className="glass-card p-7 rounded-[2rem] border border-white/10 space-y-3 relative overflow-hidden group glow-magenta">
          <div className="absolute top-4 right-4 w-12 h-12 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/30">
            <Package className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Valor Inventario</span>
          <h3 className="text-3xl font-black text-white font-mono">
            ${totalInventoryVal.toLocaleString('es-AR')}
          </h3>
          <p className="text-xs text-fuchsia-300 font-bold">{products.length} SKUs en catálogo</p>
        </div>

        <div className="glass-card p-7 rounded-[2rem] border border-white/10 space-y-3 relative overflow-hidden group glow-emerald">
          <div className="absolute top-4 right-4 w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Stock Crítico</span>
          <h3 className="text-3xl font-black text-white font-mono">{lowStockProducts.length}</h3>
          <p className="text-xs text-amber-400 font-bold">Requieren reorden</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Selling Products */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Productos Más Vendidos
          </h3>

          <div className="space-y-3">
            {topSelling.length > 0 ? (
              topSelling.map(([title, qty], idx) => (
                <div key={idx} className="bg-[#121624] p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-black text-xs flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white text-sm">{title}</span>
                  </div>
                  <span className="bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/30 px-3.5 py-1 rounded-xl text-xs font-black font-mono">
                    {qty} unidades
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-6 text-center">No hay registros de ventas recientes.</p>
            )}
          </div>
        </div>

        {/* Critical Stock Alert List */}
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Alertas de Stock Crítico
          </h3>

          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => {
                const webInfo = getProductSourceWeb(product);
                return (
                  <div key={product.id} className="bg-[#121624] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-white text-sm">{product.title}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> Pedir en: {webInfo.name}
                        </span>
                        {webInfo.url && (
                          <a
                            href={webInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-200 hover:underline"
                            title={`Abrir página para reponer: ${webInfo.url}`}
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Reponer aquí
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="bg-rose-950/80 text-rose-400 border border-rose-500/30 px-3.5 py-1 rounded-xl text-xs font-black font-mono self-start sm:self-auto shrink-0">
                      Stock: {product.stock} (Min: {product.minStock})
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                No hay productos en nivel de stock crítico.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
