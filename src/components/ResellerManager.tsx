import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ResellerUser } from '../types';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Check,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Percent,
  Phone,
  Mail,
  Lock,
  ShoppingBag,
  ExternalLink,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const ResellerManager: React.FC = () => {
  const { resellers, addReseller, updateReseller, deleteReseller, orders, settings } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<ResellerUser | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedResellerId, setCopiedResellerId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCommission, setFormCommission] = useState<number>(30);
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormPhone('');
    setFormEmail('');
    setFormCommission(30);
    setFormNotes('');
    setFormActive(true);
    setFormError(null);
    setEditingReseller(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: ResellerUser) => {
    setEditingReseller(r);
    setFormName(r.name);
    setFormUsername(r.username);
    setFormPassword(r.password);
    setFormPhone(r.phone || '');
    setFormEmail(r.email || '');
    setFormCommission(r.commissionPercentage);
    setFormNotes(r.notes || '');
    setFormActive(r.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Por favor ingresa el nombre del vendedor.');
      return;
    }
    if (!formUsername.trim()) {
      setFormError('Por favor ingresa un usuario para iniciar sesión.');
      return;
    }
    if (!formPassword.trim()) {
      setFormError('Por favor asigna una contraseña al vendedor.');
      return;
    }

    // Check duplicate username
    const cleanUser = formUsername.trim().toLowerCase();
    const duplicate = resellers.find(
      (r) => r.username.toLowerCase() === cleanUser && (!editingReseller || r.id !== editingReseller.id)
    );
    if (duplicate) {
      setFormError('Ese nombre de usuario ya está asignado a otro vendedor. Elige otro.');
      return;
    }

    try {
      if (editingReseller) {
        await updateReseller(editingReseller.id, {
          name: formName.trim(),
          username: cleanUser,
          password: formPassword.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          commissionPercentage: Number(formCommission) || 30,
          notes: formNotes.trim(),
          active: formActive
        });
      } else {
        await addReseller({
          name: formName.trim(),
          username: cleanUser,
          password: formPassword.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          commissionPercentage: Number(formCommission) || 30,
          notes: formNotes.trim(),
          active: formActive
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError('Error al guardar vendedor: ' + err.message);
    }
  };

  // Copy Login credentials to send via WhatsApp
  const handleCopyAccessMessage = (r: ResellerUser) => {
    const storeName = settings.companyName || 'Nova Import';
    const storeUrl = window.location.origin;

    const message =
      `¡Hola *${r.name}*! Te damos la bienvenida como Vendedor/Revendedor Oficial de *${storeName}* 🚀\n\n` +
      `Ya tenés habilitado tu acceso exclusivo al *Portal de Ventas* para ingresar pedidos con los datos de tus clientes:\n\n` +
      `🔗 *Enlace de Ingreso:* ${storeUrl}\n` +
      `👉 *Hacer clic en:* [💼 Portal Vendedores]\n\n` +
      `👤 *Tu Usuario:* \`${r.username}\`\n` +
      `🔑 *Tu Contraseña:* \`${r.password}\`\n` +
      `📈 *Tu Margen de Ganancia:* +${r.commissionPercentage}%\n\n` +
      `📦 Cada pedido que cargues llega directo a nuestro depósito para preparar y despachar. ¡Buenas ventas!`;

    navigator.clipboard.writeText(message);
    setCopiedResellerId(r.id);
    setTimeout(() => setCopiedResellerId(null), 3000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered sellers
  const filteredResellers = resellers.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      (r.phone && r.phone.includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-800/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>EQUIPO DE VENTAS & REVENDEDORES</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Vendedores & Revendedores con Acceso Propio
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Crea cuentas y contraseñas para tus vendedores. Ellos podrán entrar a su propio portal, cargar pedidos con los datos de sus clientes finales y te llegarán al sistema listos para preparar y despachar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nuevo Vendedor</span>
        </button>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
          <span>Total Vendedores: <strong className="text-white">{resellers.length}</strong></span>
          <span>•</span>
          <span>Activos: <strong className="text-emerald-400">{resellers.filter((r) => r.active).length}</strong></span>
        </div>
      </div>

      {/* Resellers Grid / Cards */}
      {filteredResellers.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-3xl border border-indigo-500/20 mx-auto flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-black text-white">No hay vendedores registrados todavía</h3>
            <p className="text-xs text-slate-400 mt-1">
              Haz clic en "Agregar Nuevo Vendedor" para asignarle un usuario y contraseña a tu primer revendedor.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Vendedor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResellers.map((r) => {
            const sellerOrders = orders.filter((o) => o.resellerId === r.id);
            const totalSales = sellerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            return (
              <div
                key={r.id}
                className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Status & Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-white text-base leading-tight">{r.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            r.active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {r.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                        ID: {r.id.slice(0, 14)}
                      </span>
                    </div>

                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold text-[11px]">Usuario de Acceso:</span>
                      <span className="font-mono font-black text-indigo-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        {r.username}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold text-[11px]">Contraseña:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-amber-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          {visiblePasswords[r.id] ? r.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(r.id)}
                          className="p-1 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
                          title="Mostrar/Ocultar contraseña"
                        >
                          {visiblePasswords[r.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 font-bold text-[11px]">Margen Ganancia Vendedor:</span>
                      <span className="font-black text-emerald-400">+{r.commissionPercentage}%</span>
                    </div>
                  </div>

                  {/* Contact Info & Stats */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-slate-500 block text-[10px] font-bold">Pedidos Cargados:</span>
                      <span className="font-mono font-black text-white text-sm">
                        {sellerOrders.length}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-slate-500 block text-[10px] font-bold">Total Vendido:</span>
                      <span className="font-mono font-black text-emerald-400 text-xs truncate block">
                        $ {totalSales.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {r.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{r.phone}</span>
                    </div>
                  )}

                  {r.notes && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-2">
                      "{r.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyAccessMessage(r)}
                    className="flex-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    title="Copiar mensaje listo para enviar al revendedor por WhatsApp con sus datos de ingreso"
                  >
                    {copiedResellerId === r.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Copiado para WhatsApp!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Enviar Accesos</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(r)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Editar datos y contraseña"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar al vendedor "${r.name}" del sistema?`)) {
                        deleteReseller(r.id);
                      }
                    }}
                    className="p-2 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar vendedor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT RESELLER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-white text-base">
                  {editingReseller ? 'Modificar Vendedor / Contraseña' : 'Crear Cuenta de Vendedor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre Completo del Vendedor / Revendedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Gómez"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Usuario de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: carlosgomez"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Sin espacios ni acentos</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Contraseña Asignada *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej: ventas2026"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Dásela al vendedor para ingresar</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Margen de Ganancia del Vendedor (%) *
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                    <span className="text-xs text-slate-400 font-bold mr-1">+</span>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={formCommission}
                      onChange={(e) => setFormCommission(Number(e.target.value))}
                      className="w-full bg-transparent text-sm font-black text-emerald-400 font-mono focus:outline-hidden"
                    />
                    <span className="text-xs text-slate-400 font-bold ml-1">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Ganancia que suma sobre su costo</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: +54 9 11 2345-6789"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notas Internas (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Zona Norte, distribuidor de herramientas..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span>Vendedor Activo (Habilitado para ingresar y cargar pedidos)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {editingReseller ? 'Guardar Cambios' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
