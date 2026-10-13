import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { X, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLoginSuccess: (user: { displayName: string; role: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, currentUser, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim().toLowerCase();

    // Master Creator account
    if (trimmedName === 'creator' && password === 'creator123') {
      onLoginSuccess({ displayName: 'Creador Master', role: 'Creador' });
      onClose();
      return;
    }

    // Default master admin fallback
    if (trimmedName === 'admin' && password === '123456') {
      onLoginSuccess({ displayName: 'Administrador Master', role: 'Administrador' });
      onClose();
      return;
    }

    try {
      const snap = await getDocs(collection(db, 'staff'));
      const staffMembers = snap.docs.map(doc => doc.data() as any);

      const found = staffMembers.find(
        s => s.name.trim().toLowerCase() === trimmedName && s.password === password
      );

      if (found) {
        onLoginSuccess({ displayName: found.name, role: found.role });
        onClose();
      } else {
        setError('Nombre de usuario o contraseña incorrectos.');
      }
    } catch (err: any) {
      setError('Error al verificar credenciales en la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="glass-card rounded-[2.5rem] max-w-md w-full p-8 text-white relative shadow-2xl border border-white/20 glow-indigo">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto glow-indigo border border-white/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-black">Acceso ERP</h3>
          <p className="text-xs text-slate-400 font-medium">Ingrese su nombre de operador y contraseña</p>
        </div>

        {error && (
          <div className="bg-rose-950/80 text-rose-300 border border-rose-500/30 p-3.5 rounded-2xl text-xs font-bold mb-5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nombre de Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Juan Pérez o creator"
                className="w-full bg-[#121624] border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121624] border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition"
          >
            Iniciar Sesión ERP
          </button>
        </form>
      </div>
    </div>
  );
};
