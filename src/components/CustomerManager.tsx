import React, { useState } from 'react';
import { CustomerClient } from '../types';
import { useStore } from '../context/StoreContext';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  FileText
} from 'lucide-react';

export const CustomerManager: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<CustomerClient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<CustomerClient | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formClient, setFormClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    dniCuit: '',
    notes: ''
  });

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol || '$'} ${amount.toLocaleString('es-AR')}`;
  };

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.dniCuit || '').includes(q)
    );
  });

  const totalSpentAll = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrdersAll = clients.reduce((sum, c) => sum + (c.totalOrders || 0), 0);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient.name.trim()) {
      setNotification({ type: 'error', message: 'El nombre del cliente es obligatorio.' });
      return;
    }
    try {
      await addClient({
        name: formClient.name.trim(),
        email: formClient.email.trim(),
        phone: formClient.phone.trim(),
        address: formClient.address.trim(),
        city: formClient.city.trim(),
        dniCuit: formClient.dniCuit.trim(),
        notes: formClient.notes.trim()
      });
      setIsNewClientModalOpen(false);
      setFormClient({ name: '', email: '', phone: '', address: '', city: '', dniCuit: '', notes: '' });
      setNotification({ type: 'success', message: 'Cliente registrado exitosamente en la base de datos.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error al registrar cliente: ' + err.message });
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await updateClient(selectedClient.id, {
        name: formClient.name.trim(),
        email: formClient.email.trim(),
        phone: formClient.phone.trim(),
        address: formClient.address.trim(),
        city: formClient.city.trim(),
        dniCuit: formClient.dniCuit.trim(),
        notes: formClient.notes.trim()
      });
      setIsEditing(false);
      setSelectedClient(null);
      setNotification({ type: 'success', message: 'Datos del cliente actualizados con éxito.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error al actualizar: ' + err.message });
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
      setNotification({ type: 'success', message: 'Cliente eliminado correctamente.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error al eliminar cliente: ' + err.message });
    }
  };

  const openEditModal = (c: CustomerClient) => {
    setSelectedClient(c);
    setFormClient({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      dniCuit: c.dniCuit || '',
      notes: c.notes || ''
    });
    setIsEditing(true);
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('54') ? clean : `549${clean}`;
    const text = encodeURIComponent(`¡Hola ${name}! Nos comunicamos desde ${settings.companyName || 'la Distribuidora'}. ¿En qué podemos ayudarte con tu pedido?`);
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Clientes</span>
            <span className="text-2xl font-black text-white">{clients.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pedidos Realizados</span>
            <span className="text-2xl font-black text-emerald-400">{totalOrdersAll}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Volumen Facturado</span>
            <span className="text-2xl font-black text-amber-400">{formatCurrency(totalSpentAll)}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Promedio</span>
            <span className="text-2xl font-black text-indigo-300">
              {totalOrdersAll > 0 ? formatCurrency(Math.round(totalSpentAll / totalOrdersAll)) : '$ 0'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, email, teléfono, DNI o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setFormClient({ name: '', email: '', phone: '', address: '', city: '', dniCuit: '', notes: '' });
            setIsNewClientModalOpen(true);
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Ubicación / DNI</th>
                <th className="py-3.5 px-4 text-center">Pedidos</th>
                <th className="py-3.5 px-4">Total Comprado</th>
                <th className="py-3.5 px-4">Último Pedido</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No se encontraron clientes registrados.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Los clientes se registran automáticamente cuando confirman un pedido en el carrito o puedes agregarlos manualmente.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      {c.notes && (
                        <span className="text-[10px] text-slate-400 line-clamp-1 italic max-w-xs block">
                          📝 {c.notes}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Phone className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[170px]">{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 space-y-1 text-slate-400">
                      {(c.city || c.address) && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {[c.address, c.city].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {c.dniCuit && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          DNI/CUIT: {c.dniCuit}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-indigo-500/10 text-indigo-300 font-black rounded-lg text-xs border border-indigo-500/20">
                        {c.totalOrders || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(c.totalSpent || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {c.lastOrderDate ? (
                        <div>
                          <span>{new Date(c.lastOrderDate).toLocaleDateString('es-AR')}</span>
                          {c.lastOrderId && (
                            <span className="block text-[10px] text-indigo-400 font-mono">
                              #{c.lastOrderId.slice(-6)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.phone && (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(c.phone, c.name)}
                            title="Chatear por WhatsApp con el cliente"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          title="Editar datos del cliente"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientToDelete(c)}
                          title="Eliminar cliente"
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New / Edit Client Modal */}
      {(isNewClientModalOpen || isEditing) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">
                {isEditing ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewClientModalOpen(false);
                  setIsEditing(false);
                  setSelectedClient(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEditing ? handleUpdateClient : handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formClient.name}
                  onChange={(e) => setFormClient({ ...formClient, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-bold">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej. 11 2345-6789"
                    value={formClient.phone}
                    onChange={(e) => setFormClient({ ...formClient, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-bold">Email</label>
                  <input
                    type="email"
                    placeholder="juan@gmail.com"
                    value={formClient.email}
                    onChange={(e) => setFormClient({ ...formClient, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-bold">Dirección de Entrega</label>
                  <input
                    type="text"
                    placeholder="Av. Corrientes 1234, 4B"
                    value={formClient.address}
                    onChange={(e) => setFormClient({ ...formClient, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-bold">Ciudad / Provincia</label>
                  <input
                    type="text"
                    placeholder="CABA, Buenos Aires"
                    value={formClient.city}
                    onChange={(e) => setFormClient({ ...formClient, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">DNI o CUIT (Para facturación / envío)</label>
                <input
                  type="text"
                  placeholder="20-38123456-9"
                  value={formClient.dniCuit}
                  onChange={(e) => setFormClient({ ...formClient, dniCuit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">Notas Internas</label>
                <textarea
                  rows={2}
                  placeholder="Preferencias de envío, comentarios del cliente, etc."
                  value={formClient.notes}
                  onChange={(e) => setFormClient({ ...formClient, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewClientModalOpen(false);
                    setIsEditing(false);
                    setSelectedClient(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-900/30 cursor-pointer"
                >
                  {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-white text-base">¿Eliminar Cliente?</h3>
            <p className="text-xs text-slate-400">
              ¿Confirmas eliminar el registro de <strong className="text-white">"{clientToDelete.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
