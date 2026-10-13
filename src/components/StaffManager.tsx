import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Users, UserPlus, Shield, Trash2, CheckCircle, Key, User } from 'lucide-react';

export interface StaffMember {
  id: string;
  name: string;
  password: string;
  role: 'Administrador' | 'Vendedor' | 'Almacenero' | 'Contador';
  createdAt: string;
}

export const StaffManager: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Administrador' | 'Vendedor' | 'Almacenero' | 'Contador'>('Vendedor');
  const [success, setSuccess] = useState(false);

  const fetchStaff = async () => {
    try {
      const snap = await getDocs(collection(db, 'staff'));
      setStaffList(snap.docs.map(doc => doc.data() as StaffMember));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'staff');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `staff-${Date.now()}`;
    const newStaff: StaffMember = {
      id,
      name: name.trim(),
      password,
      role,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'staff', id), newStaff);
      setName('');
      setPassword('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchStaff();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `staff/${id}`);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('¿Eliminar acceso de este operador?')) return;
    try {
      await deleteDoc(doc(db, 'staff', id));
      fetchStaff();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `staff/${id}`);
    }
  };

  return (
    <div className="glass-card p-8 rounded-[2.5rem] space-y-8 border border-white/10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-fuchsia-400" /> Gestión de Personal y Roles (ERP)
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Registre operadores con solo Nombre y Contraseña para acceder al sistema ERP.
          </p>
        </div>
        {success && (
          <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-black uppercase">
            <CheckCircle className="w-4 h-4" /> Operador Registrado
          </div>
        )}
      </div>

      <form onSubmit={handleAddStaff} className="bg-[#121624] p-6 rounded-3xl border border-white/10 space-y-4">
        <h4 className="text-sm font-black text-cyan-400 uppercase tracking-wider">Nuevo Operador</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre de Usuario</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full bg-[#07090E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#07090E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rol en el Sistema</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full bg-[#07090E] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
            >
              <option value="Administrador">Administrador Total</option>
              <option value="Vendedor">Vendedor / Mostrador</option>
              <option value="Almacenero">Almacén / Logística</option>
              <option value="Contador">Contador / Finanzas</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow transition"
          >
            <UserPlus className="w-4 h-4" /> Registrar Operador
          </button>
        </div>
      </form>

      {/* Staff List Table */}
      <div className="space-y-3">
        <h4 className="text-sm font-black text-white uppercase tracking-wider">Personal Autorizado ({staffList.length})</h4>
        <div className="bg-[#121624] rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 uppercase font-black text-[10px]">
              <tr>
                <th className="p-4">Operador (Nombre)</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staffList.length > 0 ? (
                staffList.map(staff => (
                  <tr key={staff.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" /> {staff.name}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        staff.role === 'Administrador' ? 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/30' :
                        staff.role === 'Vendedor' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
                        staff.role === 'Almacenero' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                        'bg-sky-950/80 text-sky-300 border border-sky-500/30'
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-xl transition inline-flex border border-rose-500/30"
                        title="Eliminar Operador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-slate-400">No hay personal registrado aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
