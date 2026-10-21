import React, { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { RoundingRule, SupplierProduct, SupplierSource } from '../../../types';
import { calculateSalePrice } from '../../../utils/supplierUtils';
import { formatCurrency } from '../../../utils/formatters';
import { 
  Calculator, 
  X, 
  Percent, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  SlidersHorizontal,
  DollarSign,
  Sparkles,
  Layers,
  Inbox,
  RefreshCw
} from 'lucide-react';

interface ModalErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
}

interface ModalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ModalErrorBoundary extends Component<ModalErrorBoundaryProps, ModalErrorBoundaryState> {
  public state: ModalErrorBoundaryState = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): ModalErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Error al procesar cálculos' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BulkPricingCalculatorModal error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              Calculadora de Ganancia Total
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Se detectó una discrepancia en algunos artículos. Podés reiniciar la calculadora de precios.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={this.props.onClose}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface BulkPricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: SupplierProduct[];
  suppliers?: SupplierSource[];
  onApplyMarkup: (options: {
    supplierId?: string;
    category?: string;
    marginPercent: number;
    fixedMarkupArs: number;
    roundingRule: RoundingRule;
    onlyCostChanged?: boolean;
    productIds?: string[];
  }) => Promise<number>;
  darkMode?: boolean;
  preselectedProductIds?: string[];
}

const BulkPricingCalculatorModalInner: React.FC<BulkPricingCalculatorModalProps> = ({
  isOpen,
  onClose,
  products = [],
  suppliers = [],
  onApplyMarkup,
  darkMode = false,
  preselectedProductIds = []
}) => {
  const [scope, setScope] = useState<'all' | 'cost_changed' | 'supplier' | 'selected'>('all');
  const [targetSupplierId, setTargetSupplierId] = useState<string>('all');
  const [targetCategory, setTargetCategory] = useState<string>('Todos');
  const [marginPercent, setMarginPercent] = useState<number>(45);
  const [fixedMarkupArs, setFixedMarkupArs] = useState<number>(0);
  const [roundingRule, setRoundingRule] = useState<RoundingRule>('hundred');
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [applyError, setApplyError] = useState('');

  // Synchronize scope on open
  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(preselectedProductIds) && preselectedProductIds.length > 0) {
        setScope('selected');
      } else {
        setScope('all');
      }
      setSuccessMessage('');
      setApplyError('');
    }
  }, [isOpen, preselectedProductIds]);

  // Safe guarded arrays
  const safeProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((p): p is SupplierProduct => Boolean(p && typeof p === 'object' && p.id));
  }, [products]);

  const safeSuppliers = useMemo(() => {
    if (!Array.isArray(suppliers)) return [];
    return suppliers.filter((s): s is SupplierSource => Boolean(s && typeof s === 'object' && s.id));
  }, [suppliers]);

  // Dynamic categories list from safe products
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    set.add('Todos');
    safeProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [safeProducts]);

  // Filter products matching selected scope
  const targetProducts = useMemo(() => {
    return safeProducts.filter((p) => {
      if (!p) return false;
      if (scope === 'selected') {
        return Array.isArray(preselectedProductIds) && preselectedProductIds.includes(p.id);
      }
      if (scope === 'cost_changed') {
        const matchesCost = Boolean(p.hasCostChanged);
        if (targetCategory !== 'Todos') return matchesCost && p.category === targetCategory;
        return matchesCost;
      }
      if (scope === 'supplier') {
        const matchesSup = targetSupplierId === 'all' || p.supplierId === targetSupplierId;
        if (targetCategory !== 'Todos') return matchesSup && p.category === targetCategory;
        return matchesSup;
      }
      if (targetCategory !== 'Todos') {
        return p.category === targetCategory;
      }
      return true;
    });
  }, [safeProducts, scope, preselectedProductIds, targetSupplierId, targetCategory]);

  // Compute live simulated prices for each product in target
  const simulatedRows = useMemo(() => {
    return targetProducts.map((p) => {
      const rawCost = Number(p?.costArs);
      const cost = Number.isFinite(rawCost) && rawCost > 0 ? rawCost : 0;

      const rawCurrent = Number(p?.finalSalePrice);
      const currentPrice = Number.isFinite(rawCurrent) && rawCurrent > 0 
        ? rawCurrent 
        : Math.round(cost * 1.45);

      const calculated = calculateSalePrice(
        cost,
        marginPercent,
        fixedMarkupArs,
        roundingRule
      );
      const newPrice = Number.isFinite(calculated) && calculated > 0 ? calculated : cost;
      const grossProfit = Math.max(0, newPrice - cost);
      const profitMarginPct = cost > 0 ? Math.round((grossProfit / cost) * 100) : 0;
      const priceDelta = newPrice - currentPrice;

      return {
        product: p,
        cost,
        currentPrice,
        newPrice,
        grossProfit,
        profitMarginPct,
        priceDelta
      };
    });
  }, [targetProducts, marginPercent, fixedMarkupArs, roundingRule]);

  // Summary KPIs for the batch
  const totalItemsImpacted = simulatedRows.length;
  const totalOldValuation = simulatedRows.reduce((sum, r) => sum + (r.currentPrice || 0), 0);
  const totalNewValuation = simulatedRows.reduce((sum, r) => sum + (r.newPrice || 0), 0);
  const totalGrossProfit = simulatedRows.reduce((sum, r) => sum + (r.grossProfit || 0), 0);
  const averageMarginPct = totalItemsImpacted > 0 
    ? Math.round(simulatedRows.reduce((sum, r) => sum + (r.profitMarginPct || 0), 0) / totalItemsImpacted) 
    : 0;

  if (!isOpen) return null;

  const handleApply = async () => {
    try {
      setIsApplying(true);
      setApplyError('');
      const count = await onApplyMarkup({
        supplierId: scope === 'supplier' ? targetSupplierId : undefined,
        category: targetCategory !== 'Todos' ? targetCategory : undefined,
        marginPercent: Number(marginPercent) || 45,
        fixedMarkupArs: Number(fixedMarkupArs) || 0,
        roundingRule,
        onlyCostChanged: scope === 'cost_changed',
        productIds: scope === 'selected' ? preselectedProductIds : undefined
      });

      setSuccessMessage(`¡Se recalcularon y sincronizaron ${count} artículos exitosamente!`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1400);
    } catch (e: any) {
      console.error('Error applying markup:', e);
      setApplyError(e?.message || 'Error al aplicar el margen masivo. Intentá nuevamente.');
    } finally {
      setIsApplying(false);
    }
  };

  const costChangedCount = safeProducts.filter((p) => Boolean(p?.hasCostChanged)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display tracking-tight flex items-center gap-2">
                <span>Calculadora de Ganancia Total Masiva</span>
                <span className="text-[10px] font-mono uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold">
                  Simulación en Vivo
                </span>
              </h2>
              <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Aumentos combinados por porcentaje, montos fijos en $ ARS y redondeo comercial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Scope Selection Strip */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <span className="font-bold uppercase tracking-wider text-[11px] block opacity-80">
              1. Alcance de los Productos a Recalcular
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  scope === 'all'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : darkMode ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                Todo el Catálogo Dropshipping ({safeProducts.length})
              </button>

              <button
                type="button"
                onClick={() => setScope('cost_changed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                  scope === 'cost_changed'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : darkMode ? 'bg-zinc-900 text-amber-400 border-zinc-800 hover:bg-zinc-800' : 'bg-white text-amber-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Solo Con Aumento de Costo ({costChangedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('supplier')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  scope === 'supplier'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : darkMode ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                Filtrar por Proveedor Web
              </button>

              {Array.isArray(preselectedProductIds) && preselectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    scope === 'selected'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : darkMode ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  Selección Manual ({preselectedProductIds.length})
                </button>
              )}
            </div>

            {/* Sub-filters if supplier or category */}
            {scope === 'supplier' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Seleccionar Proveedor
                  </label>
                  <select
                    value={targetSupplierId}
                    onChange={(e) => setTargetSupplierId(e.target.value)}
                    className={`w-full p-2 rounded-xl border font-bold text-xs ${
                      darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-800'
                    }`}
                  >
                    <option value="all">Todos los Proveedores</option>
                    {safeSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Filtrar por Categoría
                  </label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className={`w-full p-2 rounded-xl border font-bold text-xs ${
                      darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-800'
                    }`}
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Controls: Porcentaje + Monto Fijo + Redondeo */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-orange-50/40 border-orange-200/60'
          }`}>
            <span className="font-bold uppercase tracking-wider text-[11px] block text-orange-600">
              2. Parámetros de Margen Comercial &amp; Ganancia
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Porcentaje de Aumento sobre el Costo */}
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">
                  Aumento sobre Costo (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="500"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(Number(e.target.value) || 0)}
                    className={`flex-1 px-3 py-2 rounded-xl border font-mono font-bold text-sm ${
                      darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  />
                  <span className="font-mono font-black text-sm text-orange-500">%</span>
                </div>
                {/* Fast presets buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[30, 40, 45, 50, 60].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMarginPercent(pct)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                        marginPercent === pct
                          ? 'bg-orange-600 text-white border-orange-600'
                          : darkMode ? 'bg-zinc-900 text-zinc-300 border-zinc-800' : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto Fijo en Pesos ARS */}
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">
                  Monto Fijo Adicional ($ ARS)
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-400">$</span>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={fixedMarkupArs}
                    onChange={(e) => setFixedMarkupArs(Number(e.target.value) || 0)}
                    placeholder="0"
                    className={`flex-1 px-3 py-2 rounded-xl border font-mono font-bold text-sm ${
                      darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {[0, 2500, 5000, 10000].map((monto) => (
                    <button
                      key={monto}
                      type="button"
                      onClick={() => setFixedMarkupArs(monto)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                        fixedMarkupArs === monto
                          ? 'bg-orange-600 text-white border-orange-600'
                          : darkMode ? 'bg-zinc-900 text-zinc-300 border-zinc-800' : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {monto === 0 ? '$0' : `+$${(monto / 1000).toFixed(1)}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regla de Redondeo */}
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">
                  Estrategia de Redondeo
                </label>
                <select
                  value={roundingRule}
                  onChange={(e) => setRoundingRule(e.target.value as RoundingRule)}
                  className={`w-full px-3 py-2 rounded-xl border font-semibold text-xs outline-hidden ${
                    darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                >
                  <option value="hundred">A $100 más cercano (ej. $189.200)</option>
                  <option value="nine_ninety">Terminación $990 (ej. $189.990)</option>
                  <option value="thousand">A $1.000 más cercano (ej. $190.000)</option>
                  <option value="none">Sin redondeo (Cálculo exacto)</option>
                </select>
                <span className="text-[10px] text-zinc-400 mt-2 block">
                  Optimiza la percepción psicológica de precio en la tienda.
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Metric Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Artículos a Impactar</span>
              <div className="text-xl font-black font-mono text-orange-500 mt-0.5">
                {totalItemsImpacted}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Margen Promedio Real</span>
              <div className="text-xl font-black font-mono text-emerald-500 mt-0.5">
                +{averageMarginPct}%
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Ganancia Neta Total Estimada</span>
              <div className="text-xl font-black font-mono text-emerald-500 mt-0.5">
                {formatCurrency(totalGrossProfit, false)}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Facturación Potencial Total</span>
              <div className="text-xl font-black font-mono text-zinc-900 dark:text-white mt-0.5">
                {formatCurrency(totalNewValuation, false)}
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>3. Vista Previa Interactiva de Precios Calculados ({simulatedRows.length})</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                Los cambios no se aplican en la tienda hasta confirmar.
              </span>
            </div>

            {simulatedRows.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${
                darkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <Inbox className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-zinc-500">
                  {safeProducts.length === 0 
                    ? 'No hay artículos en el catálogo dropshipping todavía. Conectá una web proveedora o extraé por link para importar productos.' 
                    : 'No hay artículos que coincidan con el alcance seleccionado.'}
                </p>
                {safeProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setScope('all'); setTargetCategory('Todos'); setTargetSupplierId('all'); }}
                    className="mt-2 text-xs font-bold text-orange-500 hover:underline"
                  >
                    Ver todo el catálogo dropshipping ({safeProducts.length} artículos)
                  </button>
                )}
              </div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden ${
                darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className={`font-mono text-[10px] uppercase sticky top-0 ${
                      darkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <tr>
                        <th className="py-2.5 px-3">Artículo / SKU</th>
                        <th className="py-2.5 px-3">Costo Mayorista</th>
                        <th className="py-2.5 px-3">PVP Actual</th>
                        <th className="py-2.5 px-3 text-emerald-500 font-bold">Nuevo PVP Simulado</th>
                        <th className="py-2.5 px-3 text-right">Ganancia Neta $</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800">
                      {simulatedRows.map((row) => (
                        <tr key={row?.product?.id || Math.random()} className="hover:bg-zinc-500/5">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-orange-500 font-bold">
                                {row?.product?.internalSku || row?.product?.originalSku || 'NVH-000'}
                              </span>
                              <span className="font-bold text-xs truncate max-w-[200px]">
                                {row?.product?.sanitizedTitle || row?.product?.originalTitle || 'Producto'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {formatCurrency(row.cost, false)}
                          </td>
                          <td className="py-2 px-3 font-mono text-zinc-400">
                            {formatCurrency(row.currentPrice, false)}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-500">
                            <div className="flex items-center gap-1.5">
                              <span>{formatCurrency(row.newPrice, false)}</span>
                              {row.priceDelta !== 0 && !isNaN(row.priceDelta) && (
                                <span className={`text-[9px] px-1 rounded font-bold ${
                                  row.priceDelta > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {row.priceDelta > 0 ? `+${formatCurrency(row.priceDelta, false)}` : formatCurrency(row.priceDelta, false)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-right font-bold text-emerald-500">
                            +{formatCurrency(row.grossProfit, false)} ({row.profitMarginPct}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {applyError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-500 font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-500 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="text-xs text-zinc-400">
            Fórmula: <strong>Costo × (1 + {marginPercent}%) + ${fixedMarkupArs} ARS</strong> (Redondeo: {roundingRule})
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors ${
                darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isApplying || totalItemsImpacted === 0}
              onClick={handleApply}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApplying ? 'Sincronizando...' : `Aplicar a ${totalItemsImpacted} Artículos`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const BulkPricingCalculatorModal: React.FC<BulkPricingCalculatorModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <ModalErrorBoundary onClose={props.onClose}>
      <BulkPricingCalculatorModalInner {...props} />
    </ModalErrorBoundary>
  );
};
