import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Users, Plus, Search, Mail, Phone, Building2, Trash2, Edit3, X } from 'lucide-react';

export const ClientsManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [priceTier, setPriceTier] = useState<'Minorista' | 'Mayorista' | 'Distribuidor'>('Mayorista');

  const fetchCustomers = async () => {
    try {
      const snap = await getDocs(collection(db, 'customers'));
      const list = snap.docs.map(doc => doc.data() as Customer);
      setCustomers(list);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = (cust?: Customer) => {
    if (cust) {
      setCustomerToEdit(cust);
      setName(cust.name);
      setCompany(cust.company);
      setTaxId(cust.taxId);
      setEmail(cust.email);
      setPhone(cust.phone);
      setAddress(cust.address);
      setPriceTier(cust.priceTier);
    } else {
      setCustomerToEdit(null);
      setName('');
      setCompany('');
      setTaxId('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPriceTier('Mayorista');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer: Customer = {
      id: customerToEdit ? customerToEdit.id : `cust-${Date.now()}`,
      name,
      company,
      taxId,
      email,
      phone,
      address,
      priceTier,
      createdAt: customerToEdit ? customerToEdit.createdAt : new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'customers', customer.id), customer);
      fetchCustomers();
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `customers/${customer.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente de la base de datos?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      fetchCustomers();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10 glow-magenta">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-fuchsia-400" /> Módulo de Clientes (B2B & Minorista)
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Directorio completo de clientes con asignación de listas de precios y datos fiscales.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-magenta shadow-xl"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-fuchsia-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, empresa o email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#121624] border border-white/10 text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:border-fuchsia-500 shadow-inner"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(cust => (
          <div key={cust.id} className="glass-card rounded-[2rem] p-7 border border-white/10 flex flex-col justify-between space-y-5 shadow-xl relative group">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  cust.priceTier === 'Distribuidor' ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30' :
                  cust.priceTier === 'Mayorista' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30' :
                  'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {cust.priceTier}
                </span>
                <span className="text-xs text-slate-500 font-mono">CUIT: {cust.taxId}</span>
              </div>
              <h3 className="text-xl font-black text-white">{cust.name}</h3>
              <p className="text-xs font-bold text-fuchsia-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {cust.company || 'Particular'}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-[#0A0D18] p-4 rounded-2xl border border-white/5 font-medium">
              <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {cust.email}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {cust.phone}</p>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => handleOpenModal(cust)}
                className="p-2.5 bg-[#1A2035] hover:bg-[#252E4A] text-slate-300 rounded-xl transition border border-white/10"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cust.id)}
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
          <div className="glass-card rounded-[2.5rem] max-w-lg w-full p-8 text-white relative shadow-2xl border border-white/20 glow-magenta">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black mb-6">{customerToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Empresa</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">CUIT / DNI</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
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
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lista de Precios Asignada</label>
                <select
                  value={priceTier}
                  onChange={e => setPriceTier(e.target.value as any)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 font-bold"
                >
                  <option value="Minorista">Minorista (Público)</option>
                  <option value="Mayorista">Mayorista (-15%)</option>
                  <option value="Distribuidor">Distribuidor (-30%)</option>
                </select>
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
                  className="px-7 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-black uppercase tracking-wider glow-magenta"
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
