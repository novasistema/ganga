import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Truck, Plus, Search, Mail, Phone, Globe, Clock, PackageCheck, Edit3, Trash2, X } from 'lucide-react';

export const SupplierManager: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [country, setCountry] = useState('China');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(30);
  const [activeShipments, setActiveShipments] = useState<number>(1);

  const fetchSuppliers = async () => {
    try {
      const snap = await getDocs(collection(db, 'suppliers'));
      const list = snap.docs.map(doc => doc.data() as Supplier);
      setSuppliers(list);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenModal = (sup?: Supplier) => {
    if (sup) {
      setSupplierToEdit(sup);
      setName(sup.name);
      setCountry(sup.country);
      setContactPerson(sup.contactPerson);
      setEmail(sup.email);
      setPhone(sup.phone);
      setLeadTimeDays(sup.leadTimeDays || 30);
      setActiveShipments(sup.activeShipments || 1);
    } else {
      setSupplierToEdit(null);
      setName('');
      setCountry('China');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setLeadTimeDays(30);
      setActiveShipments(1);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplier: Supplier = {
      id: supplierToEdit ? supplierToEdit.id : `sup-${Date.now()}`,
      name,
      country,
      contactPerson,
      email,
      phone,
      leadTimeDays: Number(leadTimeDays),
      activeShipments: Number(activeShipments),
    };

    try {
      await setDoc(doc(db, 'suppliers', supplier.id), supplier);
      fetchSuppliers();
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `suppliers/${supplier.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor de importación?')) return;
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      fetchSuppliers();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10 glow-indigo">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Truck className="w-7 h-7 text-indigo-400" /> Gestión de Proveedores & Tiempos de Entrega (Lead Times)
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Control de proveedores internacionales, datos de contacto y días estimados de tránsito (Lead Time).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-indigo shadow-xl"
        >
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400" />
        <input
          type="text"
          placeholder="Buscar por proveedor, país o contacto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#121624] border border-white/10 text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-500 shadow-inner"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(sup => (
          <div key={sup.id} className="glass-card rounded-[2rem] p-7 border border-white/10 flex flex-col justify-between space-y-5 shadow-xl relative group">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" /> {sup.country}
                </span>
                <span className="bg-amber-950/80 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Lead Time: {sup.leadTimeDays || 30} días
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{sup.name}</h3>
              <p className="text-xs font-bold text-indigo-400">Contacto: {sup.contactPerson}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-[#0A0D18] p-4 rounded-2xl border border-white/5 font-medium">
              <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {sup.email}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {sup.phone}</p>
              <p className="flex items-center gap-2 pt-1 border-t border-white/5 text-cyan-400 font-bold"><PackageCheck className="w-3.5 h-3.5" /> Envíos Activos: {sup.activeShipments || 1} contenedores</p>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => handleOpenModal(sup)}
                className="p-2.5 bg-[#1A2035] hover:bg-[#252E4A] text-slate-300 rounded-xl transition border border-white/10"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(sup.id)}
                className="p-2.5 bg-[#1A2035] hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-xl transition border border-white/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-lg w-full p-8 text-white relative shadow-2xl border border-white/20 glow-indigo">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black mb-6">{supplierToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor de Importación'}</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">País de Origen</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Persona de Contacto</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lead Time (Días estimados)</label>
                  <input
                    type="number"
                    required
                    value={leadTimeDays}
                    onChange={e => setLeadTimeDays(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contenedores en Tránsito</label>
                  <input
                    type="number"
                    required
                    value={activeShipments}
                    onChange={e => setActiveShipments(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-2xl bg-white/5 text-slate-300 text-xs font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-black uppercase tracking-wider glow-indigo"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
