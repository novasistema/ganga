import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Deal, DealStage } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { 
  Plus, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  Trash2, 
  X,
  MapPin,
  Calendar
} from 'lucide-react';

interface StageConfig {
  key: DealStage;
  title: string;
  badgeColor: string;
  dotColor: string;
}

const STAGES: StageConfig[] = [
  { key: 'lead', title: 'Nuevo Lead', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  { key: 'contacted', title: 'Contactado / Negociación', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
  { key: 'quoted', title: 'Presupuesto Enviado', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  { key: 'payment_pending', title: 'Esperando Pago', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200', dotColor: 'bg-orange-500' },
  { key: 'won', title: 'Venta Concretada', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  { key: 'lost', title: 'Perdida / Cancelada', badgeColor: 'bg-zinc-100 text-zinc-600 border-zinc-200', dotColor: 'bg-zinc-400' }
];

export const KanbanBoard: React.FC = () => {
  const { deals, updateDealStage, addDeal, deleteDeal, companySettings } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDealForNotes, setSelectedDealForNotes] = useState<Deal | null>(null);

  // New Deal form state
  const [newDeal, setNewDeal] = useState({
    customerName: '',
    businessName: '',
    phone: '',
    email: '',
    city: '',
    stage: 'lead' as DealStage,
    totalAmount: 150000,
    notes: '',
    assignedSalesperson: 'Agustín Novoa'
  });

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.customerName || !newDeal.phone) return;

    addDeal({
      customerName: newDeal.customerName,
      businessName: newDeal.businessName,
      phone: newDeal.phone,
      email: newDeal.email,
      city: newDeal.city || 'Buenos Aires',
      stage: newDeal.stage,
      items: [],
      totalAmount: Number(newDeal.totalAmount) || 0,
      notes: newDeal.notes,
      assignedSalesperson: newDeal.assignedSalesperson
    });

    setIsAddModalOpen(false);
    setNewDeal({
      customerName: '',
      businessName: '',
      phone: '',
      email: '',
      city: '',
      stage: 'lead',
      totalAmount: 150000,
      notes: '',
      assignedSalesperson: 'Agustín Novoa'
    });
  };

  const getNextStage = (current: DealStage): DealStage | null => {
    const order: DealStage[] = ['lead', 'contacted', 'quoted', 'payment_pending', 'won'];
    const idx = order.indexOf(current);
    if (idx >= 0 && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  const getPrevStage = (current: DealStage): DealStage | null => {
    const order: DealStage[] = ['lead', 'contacted', 'quoted', 'payment_pending', 'won'];
    const idx = order.indexOf(current);
    if (idx > 0) return order[idx - 1];
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-zinc-950 font-display">
            Pipeline Comercial &amp; Cierre de Ventas
          </h3>
          <p className="text-xs text-zinc-500">
            Seguimiento de prospectos, cotizaciones y pedidos mayoristas en tiempo real
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Lead / Oportunidad</span>
        </button>
      </div>

      {/* Kanban Board Horizontal Scrollable Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.totalAmount, 0);

          return (
            <div
              key={stage.key}
              className="bg-zinc-100/90 rounded-2xl p-3 border border-zinc-200/80 flex flex-col min-w-[260px] h-[720px]"
            >
              {/* Column Header */}
              <div className="p-2 mb-2 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                    <h4 className="text-xs font-black text-zinc-900 font-display">
                      {stage.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-[11px]">
                  <span className="text-zinc-400">Total etapa:</span>
                  <span className="font-mono font-bold text-zinc-800 tabular-nums">
                    {formatCurrency(stageTotal, false)}
                  </span>
                </div>
              </div>

              {/* Deal Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stageDeals.length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-zinc-300 flex items-center justify-center text-[11px] text-zinc-400">
                    Sin operaciones
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const next = getNextStage(deal.stage);
                    const prev = getPrevStage(deal.stage);
                    const waText = `Hola ${deal.customerName}, te contacto de ${companySettings?.companyName || 'NUVOH'} Mayorista por tu consulta comercial por ${formatCurrency(deal.totalAmount)}. ¿Cómo estás?`;
                    const waUrl = generateWhatsAppLink(deal.phone, waText);

                    return (
                      <div
                        key={deal.id}
                        className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="text-xs font-black text-zinc-950 line-clamp-1">
                              {deal.customerName}
                            </h5>
                            <button
                              onClick={() => deleteDeal(deal.id)}
                              className="text-zinc-300 hover:text-red-500 p-0.5"
                              title="Eliminar oportunidad"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {deal.businessName && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-600 mt-0.5 font-medium truncate">
                              <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{deal.businessName}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{deal.city}</span>
                          </div>

                          {/* Value in ARS */}
                          <div className="mt-2.5 bg-orange-50/80 border border-orange-100 rounded-lg p-2 flex items-baseline justify-between">
                            <span className="text-[10px] uppercase font-bold text-orange-950">
                              Monto:
                            </span>
                            <span className="text-xs font-black font-mono text-orange-600 tabular-nums">
                              {formatCurrency(deal.totalAmount)}
                            </span>
                          </div>

                          {deal.notes && (
                            <p 
                              onClick={() => setSelectedDealForNotes(deal)}
                              className="text-[11px] text-zinc-500 mt-2 line-clamp-2 italic bg-zinc-50 p-1.5 rounded cursor-pointer hover:bg-zinc-100"
                              title="Ver notas completas"
                            >
                              "{deal.notes}"
                            </p>
                          )}
                        </div>

                        {/* Card Actions & Stage Controls */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Abrir chat de WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          <div className="flex items-center gap-1">
                            {prev && (
                              <button
                                onClick={() => updateDealStage(deal.id, prev)}
                                className="p-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs"
                                title={`Regresar a ${prev}`}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {next && (
                              <button
                                onClick={() => updateDealStage(deal.id, next)}
                                className="px-2 py-1 bg-zinc-900 hover:bg-orange-600 text-white rounded-md text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                                title={`Avanzar a ${next}`}
                              >
                                <span>Avanzar</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            {deal.stage !== 'won' && deal.stage !== 'lost' && (
                              <button
                                onClick={() => updateDealStage(deal.id, 'won')}
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold"
                                title="Marcar como Venta Ganada"
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-black text-zinc-900 font-display text-base">
                Crear Oportunidad / Lead Comercial
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Nombre del Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeal.customerName}
                    onChange={(e) => setNewDeal({ ...newDeal, customerName: e.target.value })}
                    placeholder="Ej. Gustavo Morales"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Comercio / Razón Social
                  </label>
                  <input
                    type="text"
                    value={newDeal.businessName}
                    onChange={(e) => setNewDeal({ ...newDeal, businessName: e.target.value })}
                    placeholder="Ej. Ferretería del Sur"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    WhatsApp / Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newDeal.phone}
                    onChange={(e) => setNewDeal({ ...newDeal, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Ciudad / Localidad
                  </label>
                  <input
                    type="text"
                    value={newDeal.city}
                    onChange={(e) => setNewDeal({ ...newDeal, city: e.target.value })}
                    placeholder="Ej. La Plata, BA"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Monto Estimado (ARS)
                  </label>
                  <input
                    type="number"
                    value={newDeal.totalAmount}
                    onChange={(e) => setNewDeal({ ...newDeal, totalAmount: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Etapa Inicial
                  </label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value as any })}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden bg-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Notas de Negociación / Interés
                </label>
                <textarea
                  rows={2}
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  placeholder="Ej. Consulta por lote de 10 taladros Nuvoh y 5 hornos Pioneer..."
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                >
                  Guardar Oportunidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note view popup */}
      {selectedDealForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-3">
              <h4 className="font-bold text-zinc-900 text-sm">
                Detalle del Lead: {selectedDealForNotes.customerName}
              </h4>
              <button
                onClick={() => setSelectedDealForNotes(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-zinc-600">
              <p><strong>Comercio:</strong> {selectedDealForNotes.businessName || '-'}</p>
              <p><strong>Ubicación:</strong> {selectedDealForNotes.city}</p>
              <p><strong>Teléfono:</strong> {selectedDealForNotes.phone}</p>
              <p><strong>Monto:</strong> {formatCurrency(selectedDealForNotes.totalAmount)}</p>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 mt-2">
                <strong className="block text-zinc-800 mb-1">Notas de seguimiento:</strong>
                <p className="whitespace-pre-wrap">{selectedDealForNotes.notes}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedDealForNotes(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
