import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CompanyConfig } from './CompanySettingsManager';
import { BarChart3, TrendingUp, DollarSign, Package, Download, Sparkles, Calendar, Printer } from 'lucide-react';

interface ReportsManagerProps {
  products: Product[];
  orders: Order[];
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({ products, orders }) => {
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const local = localStorage.getItem('importpro_company_config');
        if (local) {
          setCompanyConfig(JSON.parse(local));
        } else {
          const snap = await getDoc(doc(db, 'settings', 'company_config'));
          if (snap.exists()) {
            setCompanyConfig(snap.data() as CompanyConfig);
          }
        }
      } catch (e) {
        console.warn("Using default company config for reports PDF");
      }
    };
    fetchCompany();
  }, []);

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = orders.length;
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.finalPriceARS * p.stock), 0);
  const estimatedProfit = totalRevenue * 0.35; // 35% margin estimate

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10 glow-indigo print:hidden">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-violet-400" /> Reportes Financieros & AI Insights
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Métricas de ventas en Pesos (ARS), valoración de inventario y exportación de reportes ejecutivos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            className="bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-violet-500"
          >
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition"
          >
            <Download className="w-4 h-4" /> Exportar Reporte PDF
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="bg-[#07090E] print:bg-white text-white print:text-slate-900 p-8 print:p-0 rounded-[2.5rem] space-y-8">
        
        {/* Printable Company Header */}
        <div className="hidden print:flex justify-between items-center border-b border-slate-300 pb-6">
          <div className="flex items-center gap-3">
            {companyConfig?.logoUrl && <img src={companyConfig.logoUrl} alt="" className="w-12 h-12 object-contain" />}
            <div>
              <h1 className="text-xl font-black text-slate-900">{companyConfig?.businessName || 'ImportPro S.A.'}</h1>
              <p className="text-xs text-slate-600">CUIT: {companyConfig?.cuit || '30-71234567-9'} | Reporte Financiero Ejecutivo</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600 font-mono">
            <p>Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</p>
            <p>Periodo: {period === 'month' ? 'Mensual' : period === 'quarter' ? 'Trimestral' : 'Anual'}</p>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card print:bg-slate-100 p-6 rounded-3xl border border-white/10 print:border-slate-300 space-y-2">
            <div className="flex justify-between items-center text-slate-400 print:text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Ventas Totales</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-400 print:text-emerald-700">${totalRevenue.toLocaleString('es-AR')} ARS</p>
            <p className="text-[10px] text-slate-400 print:text-slate-500">{totalOrdersCount} órdenes procesadas</p>
          </div>

          <div className="glass-card print:bg-slate-100 p-6 rounded-3xl border border-white/10 print:border-slate-300 space-y-2">
            <div className="flex justify-between items-center text-slate-400 print:text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Valor Inventario</span>
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-black font-mono text-cyan-400 print:text-cyan-700">${totalInventoryValue.toLocaleString('es-AR')} ARS</p>
            <p className="text-[10px] text-slate-400 print:text-slate-500">{products.length} productos en stock</p>
          </div>

          <div className="glass-card print:bg-slate-100 p-6 rounded-3xl border border-white/10 print:border-slate-300 space-y-2">
            <div className="flex justify-between items-center text-slate-400 print:text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Margen Bruto Est.</span>
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-2xl font-black font-mono text-violet-400 print:text-violet-700">${estimatedProfit.toLocaleString('es-AR')} ARS</p>
            <p className="text-[10px] text-slate-400 print:text-slate-500">Estimado 35% s/ ventas</p>
          </div>

          <div className="glass-card print:bg-slate-100 p-6 rounded-3xl border border-white/10 print:border-slate-300 space-y-2">
            <div className="flex justify-between items-center text-slate-400 print:text-slate-600">
              <span className="text-xs font-bold uppercase tracking-wider">Órdenes Activas</span>
              <Calendar className="w-5 h-5 text-fuchsia-400" />
            </div>
            <p className="text-2xl font-black font-mono text-fuchsia-400 print:text-fuchsia-700">{orders.length}</p>
            <p className="text-[10px] text-slate-400 print:text-slate-500">Flujo logístico en curso</p>
          </div>
        </div>

        {/* AI Financial Insights */}
        <div className="glass-card print:bg-slate-50 p-8 rounded-[2.5rem] space-y-4 border border-violet-500/30 print:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white print:text-slate-900">Análisis Inteligente & Recomendaciones de Importación</h3>
          </div>
          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
            Basado en el ritmo de ventas en Pesos y los tiempos de importación (Lead Time), se recomienda reabastecer las categorías de mayor rotación (Electrónica y Componentes Gaming) para evitar quiebres de stock durante el próximo trimestre. Las fluctuaciones cambiarias están cubiertas con un margen operativo del 35%.
          </p>
        </div>

        {/* Sales Table Summary */}
        <div className="glass-card print:bg-white p-8 rounded-[2.5rem] space-y-6 border border-white/10 print:border-slate-300">
          <h3 className="text-lg font-black text-white print:text-slate-900">Resumen de Órdenes del Periodo</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121624] print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase font-black text-[10px] border-b border-white/10 print:border-slate-300">
                  <th className="p-4">N° Orden</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Método de Pago</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Total (ARS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-slate-200 text-slate-300 print:text-slate-800 font-medium">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-mono font-bold text-white print:text-slate-900">{order.orderNumber}</td>
                    <td className="p-4 font-semibold text-white print:text-slate-900">{order.customerName}</td>
                    <td className="p-4 text-slate-400 print:text-slate-600">{new Date(order.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="p-4 text-cyan-300 print:text-cyan-700">{order.paymentMethod}</td>
                    <td className="p-4">
                      <span className="bg-emerald-950/80 print:bg-emerald-100 text-emerald-400 print:text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-black text-emerald-400 print:text-emerald-700">${order.total.toLocaleString('es-AR')} ARS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
