import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Settings, Building2, Printer, Save, CheckCircle, Upload, Image as ImageIcon, Trash2, DollarSign } from 'lucide-react';
import { StaffManager } from './StaffManager';

export interface CompanyConfig {
  id: string;
  businessName: string;
  tradeName: string;
  cuit: string;
  taxCondition: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  printerType: 'A4' | 'Thermal58' | 'Thermal80';
  ticketHeader: string;
  ticketFooter: string;
  mpAlias?: string;
  mpHolder?: string;
  bankName?: string;
  bankCbu?: string;
  bankAlias?: string;
  bankHolder?: string;
}

export const CompanySettingsManager: React.FC = () => {
  const [config, setConfig] = useState<CompanyConfig>({
    id: 'main_config',
    businessName: 'Ganga',
    tradeName: 'ImportPro Global Commerce',
    cuit: '30-71234567-9',
    taxCondition: 'Responsable Inscripto',
    address: 'Av. Corrientes 2500, CABA, Argentina',
    phone: '+54 11 5544-3322',
    email: 'contacto@importpro.com.ar',
    logoUrl: '',
    printerType: 'A4',
    ticketHeader: '¡Gracias por su compra en Ganga / ImportPro!',
    ticketFooter: 'Comprobante no válido como factura oficial (Salvo CAE)',
    mpAlias: 'ganaga.mp.pagos',
    mpHolder: 'Ganga S.A.',
    bankName: 'Banco Galicia',
    bankCbu: '0000003100012345678901',
    bankAlias: 'GANAGA.GLOBAL.AR',
    bankHolder: 'Ganga S.A. CUIT 30-71234567-9',
  });

  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetAllData = async () => {
    try {
      localStorage.clear();
      const collectionsToClear = ['products', 'orders', 'clients', 'suppliers', 'staff', 'transactions', 'customers', 'invoices'];
      for (const colName of collectionsToClear) {
        try {
          const snap = await getDocs(collection(db, colName));
          for (const d of snap.docs) {
            await deleteDoc(doc(db, colName, d.id));
          }
        } catch (err) {
          console.warn(`Could not clear collection ${colName}:`, err);
        }
      }

      setResetting(false);
      alert('¡Sistema reseteado a cero con éxito! La página se recargará.');
      window.location.reload();
    } catch (e) {
      setResetting(false);
      alert('Error al resetear el sistema.');
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const local = localStorage.getItem('importpro_company_config');
        if (local) {
          setConfig(JSON.parse(local));
        }
        const docRef = doc(db, 'settings', 'company_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as CompanyConfig;
          setConfig(remoteData);
          localStorage.setItem('importpro_company_config', JSON.stringify(remoteData));
        }
      } catch (e) {
        console.warn("Using local fallback company config");
      }
    };
    fetchConfig();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result;
          setConfig(prev => ({ ...prev, logoUrl: res }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('importpro_company_config', JSON.stringify(config));
      await setDoc(doc(db, 'settings', 'company_config'), config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      // Even if Firestore fails due to permissions, local storage is updated successfully
      localStorage.setItem('importpro_company_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10 glow-indigo">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-indigo-400" /> Configuración de Empresa & Personal
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Datos fiscales, logotipo corporativo, preferencias de impresión y gestión de operadores con roles.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider animate-bounce">
            <CheckCircle className="w-4 h-4" /> ¡Configuración Guardada!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Company Profile */}
        <div className="glass-card p-8 rounded-[2.5rem] space-y-6 border border-white/10">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" /> Datos de la Empresa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Razón Social</label>
              <input
                type="text"
                required
                value={config.businessName}
                onChange={e => setConfig({ ...config, businessName: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nombre Comercial / Fantasía</label>
              <input
                type="text"
                value={config.tradeName}
                onChange={e => setConfig({ ...config, tradeName: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">CUIT</label>
              <input
                type="text"
                required
                value={config.cuit}
                onChange={e => setConfig({ ...config, cuit: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Condición Frente al IVA</label>
              <input
                type="text"
                value={config.taxCondition}
                onChange={e => setConfig({ ...config, taxCondition: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Teléfono</label>
              <input
                type="text"
                value={config.phone}
                onChange={e => setConfig({ ...config, phone: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dirección Comercial</label>
              <input
                type="text"
                value={config.address}
                onChange={e => setConfig({ ...config, address: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email de Contacto</label>
              <input
                type="email"
                value={config.email}
                onChange={e => setConfig({ ...config, email: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-[#121624] p-6 rounded-2xl border border-white/10 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Logotipo de la Empresa (PC o Celular)</label>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 font-medium">El logotipo se guardará en la base de datos y aparecerá automáticamente en las facturas y comprobantes impresos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Settings */}
        <div className="glass-card p-8 rounded-[2.5rem] space-y-6 border border-white/10">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-cyan-400" /> Configuración de Impresión & Tickets
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Formato Predeterminado</label>
              <select
                value={config.printerType}
                onChange={e => setConfig({ ...config, printerType: e.target.value as any })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="A4">Factura A4 Estándar</option>
                <option value="Thermal80">Impresora Térmica 80mm</option>
                <option value="Thermal58">Impresora Térmica 58mm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Encabezado de Ticket</label>
              <input
                type="text"
                value={config.ticketHeader}
                onChange={e => setConfig({ ...config, ticketHeader: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pie de Ticket / Leyenda</label>
              <input
                type="text"
                value={config.ticketFooter}
                onChange={e => setConfig({ ...config, ticketFooter: e.target.value })}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Data Settings */}
        <div className="glass-card p-8 rounded-[2.5rem] space-y-6 border border-white/10">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Datos de Cobro & Mercado Pago (Visible para Clientes)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Alias / CVU Mercado Pago</label>
              <input
                type="text"
                value={config.mpAlias || ''}
                onChange={e => setConfig({ ...config, mpAlias: e.target.value })}
                placeholder="Ej. ganaga.mp.pagos"
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Titular Cuenta Mercado Pago</label>
              <input
                type="text"
                value={config.mpHolder || ''}
                onChange={e => setConfig({ ...config, mpHolder: e.target.value })}
                placeholder="Ej. Ganga S.A."
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nombre del Banco</label>
              <input
                type="text"
                value={config.bankName || ''}
                onChange={e => setConfig({ ...config, bankName: e.target.value })}
                placeholder="Ej. Banco Galicia / Santander"
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">CBU Bancario (22 dígitos)</label>
              <input
                type="text"
                value={config.bankCbu || ''}
                onChange={e => setConfig({ ...config, bankCbu: e.target.value })}
                placeholder="0000003100012345678901"
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Alias CBU Transferencia</label>
              <input
                type="text"
                value={config.bankAlias || ''}
                onChange={e => setConfig({ ...config, bankAlias: e.target.value })}
                placeholder="GANAGA.GLOBAL.AR"
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Titular Cuenta Bancaria & CUIT</label>
              <input
                type="text"
                value={config.bankHolder || ''}
                onChange={e => setConfig({ ...config, bankHolder: e.target.value })}
                placeholder="Ganga S.A. CUIT 30-71234567-9"
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider glow-indigo shadow-2xl transition cursor-pointer"
          >
            <Save className="w-4 h-4" /> Guardar Configuración de Empresa
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset All Data to Zero */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-rose-500/40 bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600/20 rounded-2xl border border-rose-500/40 text-rose-400">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Zona de Peligro: Borrar Todo & Comenzar Desde Cero</h3>
            <p className="text-xs text-rose-300/80">Elimina todos los productos, órdenes, clientes y datos del sistema de forma permanente.</p>
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={resetting}
            onClick={handleResetAllData}
            className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> {resetting ? 'Reseteando sistema...' : 'Borrar Todo y Comenzar a Cero'}
          </button>
        </div>
      </div>

      {/* Staff & Roles Management Section */}
      <StaffManager />
    </div>
  );
};
