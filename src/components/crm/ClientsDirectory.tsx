import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Client, Interaction, Order } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { 
  Users, 
  Plus, 
  MessageCircle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Search,
  X,
  Package,
  Calendar,
  Clock,
  Send,
  History,
  FileText
} from 'lucide-react';

export const ClientsDirectory: React.FC = () => {
  const { clients, addClient, orders, interactions, addInteraction, setActiveTab, selectedEntityForFocus, setSelectedEntityForFocus, companySettings } = useStore();
  const brandName = companySettings?.companyName?.trim() || 'NUVOH';
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  // New Interaction form
  const [interactionType, setInteractionType] = useState<Interaction['type']>('llamada');
  const [interactionNote, setInteractionNote] = useState('');
  const [isUrgentInteraction, setIsUrgentInteraction] = useState(false);
  const [urgencyReason, setUrgencyReason] = useState('Consulta crítica de stock');

  // Auto-focus client when navigating from notification
  React.useEffect(() => {
    if (selectedEntityForFocus?.type === 'client' && selectedEntityForFocus.id) {
      const found = clients.find((c) => c.id === selectedEntityForFocus.id);
      if (found) {
        setSelectedClientDetail(found);
      }
    }
  }, [selectedEntityForFocus, clients]);

  const [form, setForm] = useState({
    name: '',
    businessName: '',
    cuitOrDni: '',
    phone: '',
    email: '',
    city: '',
    province: 'Buenos Aires',
    tier: 'Mayorista Plata' as Client['tier'],
    notes: ''
  });

  const filteredClients = clients.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.businessName || !form.phone) return;

    addClient({
      name: form.name,
      businessName: form.businessName,
      cuitOrDni: form.cuitOrDni || 'S/D',
      phone: form.phone,
      email: form.email || '',
      city: form.city || 'Buenos Aires',
      province: form.province,
      tier: form.tier,
      notes: form.notes
    });

    setIsAddModalOpen(false);
    setForm({
      name: '',
      businessName: '',
      cuitOrDni: '',
      phone: '',
      email: '',
      city: '',
      province: 'Buenos Aires',
      tier: 'Mayorista Plata',
      notes: ''
    });
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientDetail || !interactionNote.trim()) return;

    addInteraction({
      clientId: selectedClientDetail.id,
      type: interactionType,
      note: isUrgentInteraction 
        ? `[URGENTE: ${urgencyReason}] ${interactionNote.trim()}` 
        : interactionNote.trim(),
      author: `Vendedor ${brandName}`,
      urgency: isUrgentInteraction ? 'urgent' : 'normal',
      clientName: selectedClientDetail.businessName || selectedClientDetail.name
    });

    setInteractionNote('');
    setIsUrgentInteraction(false);
  };

  const getTierBadge = (tier: Client['tier']) => {
    switch (tier) {
      case 'Distribuidor':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded">Distribuidor</span>;
      case 'Mayorista Oro':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">Mayorista Oro</span>;
      case 'Mayorista Plata':
        return <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded">Mayorista Plata</span>;
      default:
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">Minorista</span>;
    }
  };

  // Find customer's orders
  const clientOrders = selectedClientDetail ? orders.filter((o) => 
    o.customerName.toLowerCase() === selectedClientDetail.name.toLowerCase() ||
    (o.businessName && o.businessName.toLowerCase() === selectedClientDetail.businessName.toLowerCase()) ||
    o.phone === selectedClientDetail.phone
  ) : [];

  // Find customer's interactions
  const clientInteractions = selectedClientDetail ? interactions.filter((i) => 
    i.clientId === selectedClientDetail.id
  ) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-zinc-950 font-display">
            Directorio y CRM de Clientes Mayoristas
          </h3>
          <p className="text-xs text-zinc-500">
            Ficha 360°, historial de pedidos, notas sobre interacciones y seguimiento comercial
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, comercio..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-white outline-hidden focus:border-orange-500"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const waText = `Hola ${client.name}, te contacto de ${brandName} Mayorista para acercarte las novedades de catálogo e ingresos de depósito para ${client.businessName}.`;
          const waUrl = generateWhatsAppLink(client.phone, waText);

          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div 
                    onClick={() => setSelectedClientDetail(client)}
                    className="cursor-pointer"
                  >
                    <h4 className="text-sm font-black text-zinc-900 font-display group-hover:text-orange-600 transition-colors">
                      {client.businessName}
                    </h4>
                    <p className="text-xs text-zinc-600 font-medium mt-0.5">
                      {client.name}
                    </p>
                  </div>
                  {getTierBadge(client.tier)}
                </div>

                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{client.city}, {client.province}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-mono">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                {/* Metric Strip */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Comprado:</span>
                    <strong className="font-mono font-bold text-zinc-900 tabular-nums">
                      {formatCurrency(client.totalSpent, false)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Pedidos realizados:</span>
                    <strong className="font-mono font-bold text-zinc-900">
                      {client.orderCount} compras
                    </strong>
                  </div>
                </div>

                {client.notes && (
                  <p className="mt-2.5 text-[11px] text-zinc-500 italic line-clamp-2">
                    "{client.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedClientDetail(client)}
                  className="text-xs font-bold text-zinc-700 hover:text-orange-600 flex items-center gap-1 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ver Historial y Notas</span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer 360 Detail Modal: Order History & Interaction Notes */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 font-display">
                    {selectedClientDetail.businessName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{selectedClientDetail.name}</span>
                    <span>·</span>
                    <span>CUIT: {selectedClientDetail.cuitOrDni}</span>
                    <span>·</span>
                    {getTierBadge(selectedClientDetail.tier)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Teléfono / WA:</span>
                  <strong className="text-zinc-900 font-mono">{selectedClientDetail.phone}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Email:</span>
                  <strong className="text-zinc-900 truncate block">{selectedClientDetail.email || '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Ubicación:</span>
                  <strong className="text-zinc-900">{selectedClientDetail.city}, {selectedClientDetail.province}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Histórico:</span>
                  <strong className="text-orange-600 font-mono font-bold">{formatCurrency(selectedClientDetail.totalSpent, false)}</strong>
                </div>
              </div>

              {/* Section 1: Order History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 font-display">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span>Historial de Pedidos Realizados ({clientOrders.length})</span>
                </h4>

                {clientOrders.length === 0 ? (
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center text-xs text-zinc-500">
                    No registra pedidos cargados con este nombre o teléfono en la tienda online.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientOrders.map((ord) => (
                      <div key={ord.id} className="p-3 bg-white rounded-xl border border-zinc-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-zinc-900">{ord.orderNumber}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                              Factura {ord.invoiceType}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {ord.items.length} artículos · {ord.shippingMethod.replace('_', ' ')} · {ord.createdAt}
                          </p>
                        </div>
                        <div className="text-right">
                          <strong className="font-mono font-bold text-orange-600 tabular-nums block">
                            {formatCurrency(ord.total)}
                          </strong>
                          <span className="text-[10px] text-zinc-400 capitalize">{ord.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Interactions & CRM Notes */}
              <div className="space-y-3 pt-3 border-t border-zinc-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 font-display">
                  <History className="w-4 h-4 text-orange-600" />
                  <span>Notas sobre Interacciones Comerciales ({clientInteractions.length})</span>
                </h4>

                {/* Add new interaction note form */}
                <form onSubmit={handleAddInteraction} className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-700">Registrar interacción:</span>
                    <select
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value as any)}
                      className="text-xs p-1.5 rounded-lg border border-zinc-300 bg-white font-medium"
                    >
                      <option value="llamada">Llamada Telefónica</option>
                      <option value="whatsapp">Mensaje de WhatsApp</option>
                      <option value="email">Correo Electrónico</option>
                      <option value="reunion">Reunión Presencial</option>
                      <option value="nota">Nota Interna</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={interactionNote}
                      onChange={(e) => setInteractionNote(e.target.value)}
                      placeholder="Escribir resumen de la interacción o acuerdo comercial..."
                      className="flex-1 text-xs p-2 rounded-xl border border-zinc-300 bg-white outline-hidden focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>

                  {/* Urgency Alert Toggle */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-200/80 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 font-bold select-none">
                      <input
                        type="checkbox"
                        checked={isUrgentInteraction}
                        onChange={(e) => setIsUrgentInteraction(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                      <span className={isUrgentInteraction ? 'text-red-600 font-black' : ''}>
                        ⚠️ Marcar como interacción urgente / Notificar al equipo comercial
                      </span>
                    </label>

                    {isUrgentInteraction && (
                      <select
                        value={urgencyReason}
                        onChange={(e) => setUrgencyReason(e.target.value)}
                        className="text-[10px] p-1 rounded-md border border-red-200 bg-red-50 text-red-900 font-bold outline-hidden"
                      >
                        <option value="Consulta crítica de stock">Consulta de stock urgente</option>
                        <option value="Comprobante de pago enviado">Comprobante de pago enviado</option>
                        <option value="Reclamo por entrega o transporte">Reclamo despacho / transporte</option>
                        <option value="Licitación / Gran volumen">Licitación / Compra mayorista</option>
                        <option value="Llamar con urgencia">Llamar con urgencia</option>
                      </select>
                    )}
                  </div>
                </form>

                {/* List of interaction logs */}
                <div className="space-y-2">
                  {clientInteractions.map((item) => {
                    const isItemUrgent = item.urgency === 'urgent' || item.note.includes('[URGENTE');
                    return (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-xl border text-xs ${
                          isItemUrgent 
                            ? 'bg-red-50/60 border-red-200 text-zinc-900' 
                            : 'bg-white border-zinc-200 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold uppercase tracking-wider text-orange-600">
                              {item.type}
                            </span>
                            {isItemUrgent && (
                              <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono">
                                URGENTE
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-400 font-mono text-[10px]">
                            {item.createdAt}
                          </span>
                        </div>
                        <p className={isItemUrgent ? 'font-medium text-red-950' : 'text-zinc-700'}>
                          {item.note}
                        </p>
                        <span className="text-[10px] text-zinc-400 block mt-1">
                          Por: {item.author}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-black text-zinc-900 font-display text-base">
                Registrar Nuevo Cliente Mayorista
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Roberto Sánchez"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Ej. Bazar Las Flores"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">CUIT / DNI</label>
                  <input
                    type="text"
                    value={form.cuitOrDni}
                    onChange={(e) => setForm({ ...form, cuitOrDni: e.target.value })}
                    placeholder="30-..."
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ej. Quilmes"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Categoría / Tier</label>
                  <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value as any })}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden bg-white"
                  >
                    <option value="Minorista">Minorista</option>
                    <option value="Mayorista Plata">Mayorista Plata</option>
                    <option value="Mayorista Oro">Mayorista Oro</option>
                    <option value="Distribuidor">Distribuidor Oficial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Notas Comerciales</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Canal de entrega preferido, tipos de producto de interés..."
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
