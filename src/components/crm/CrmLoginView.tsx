import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, ArrowRight, ShieldCheck, UserCheck, Store, KeyRound, AlertCircle } from 'lucide-react';

export const CrmLoginView: React.FC = () => {
  const { loginCrm, setActiveTab } = useStore();
  const [username, setUsername] = useState('admin@nuvoh.com.ar');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = loginCrm(username, password);
    if (!success) {
      setError('Credenciales incorrectas. Verifique el usuario y la contraseña.');
    }
  };

  const handleDemoLogin = () => {
    setUsername('admin@nuvoh.com.ar');
    setPassword('admin123');
    loginCrm('admin@nuvoh.com.ar', 'admin123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-zinc-100/70">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-md shadow-orange-600/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8">
              <path d="M7 4a7 7 0 0 1 7 7v9" strokeLinecap="round" />
              <path d="M17 20a7 7 0 0 1-7-7V4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-950 font-display tracking-tight">
              Acceso Seguro al CRM
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Gestión Comercial, Pedidos y Configuración NUVOH
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Usuario o Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@nuvoh.com.ar"
                className="w-full text-xs p-3 rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center justify-between">
              <span>Contraseña</span>
              <span className="text-[10px] text-zinc-400 font-normal">Mínimo 4 caracteres</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-3 rounded-xl border border-zinc-300 bg-zinc-50 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-orange-600 accent-orange-600" />
              <span>Recordar sesión</span>
            </label>
            <span className="text-[11px] text-orange-600 font-semibold cursor-pointer">
              ¿Olvidó su clave?
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-600/20"
          >
            <Lock className="w-4 h-4" />
            <span>Ingresar al Sistema Comercial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Access Button for easy review */}
        <div className="pt-2 border-t border-zinc-100 space-y-2.5">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-zinc-200"
          >
            <KeyRound className="w-3.5 h-3.5 text-zinc-600" />
            <span>Acceso Rápido Demo (admin / admin123)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className="w-full py-2 text-zinc-500 hover:text-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Volver a la Tienda Pública</span>
          </button>
        </div>

        {/* Security badge */}
        <div className="bg-zinc-50 p-3 rounded-xl text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 border border-zinc-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Acceso cifrado y sincronizado con Firebase Firestore</span>
        </div>

      </div>
    </div>
  );
};
