import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ShieldAlert, Trash2, Power, ToggleLeft, ToggleRight, CheckCircle, AlertTriangle, Download } from 'lucide-react';

export interface SubscriptionConfig {
  isActive: boolean;
  suspendedMessage: string;
  enabledModules: {
    invoicing: boolean;
    inventory: boolean;
    suppliers: boolean;
    clients: boolean;
    pricelists: boolean;
    warehouse: boolean;
    mercadopago: boolean;
    reports: boolean;
  };
}

export const CreatorPanel: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionConfig>({
    isActive: true,
    suspendedMessage: '⚠️ Suscripción vencida o suspendida por falta de pago. Por favor contacte al administrador.',
    enabledModules: {
      invoicing: true,
      inventory: true,
      suppliers: true,
      clients: true,
      pricelists: true,
      warehouse: true,
      mercadopago: true,
      reports: true,
    },
  });

  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const local = localStorage.getItem('ganaga_subscription_config');
        if (local) {
          setSubscription(JSON.parse(local));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchSub();
  }, []);

  const handleSaveSub = async (updated: SubscriptionConfig) => {
    setSubscription(updated);
    localStorage.setItem('ganaga_subscription_config', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'settings', 'subscription_config'), updated);
    } catch (e) {
      // offline fallback
    }
    setSuccess('Configuración de suscripción actualizada.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleApp = () => {
    handleSaveSub({ ...subscription, isActive: !subscription.isActive });
  };

  const handleToggleModule = (moduleKey: keyof typeof subscription.enabledModules) => {
    handleSaveSub({
      ...subscription,
      enabledModules: {
        ...subscription.enabledModules,
        [moduleKey]: !subscription.enabledModules[moduleKey],
      },
    });
  };

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const collectionsToExport = ['products', 'orders', 'clients', 'suppliers', 'staff', 'transactions', 'settings'];
      const backupData: Record<string, any[]> = {};

      for (const colName of collectionsToExport) {
        try {
          const snap = await getDocs(collection(db, colName));
          backupData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (err) {
          backupData[colName] = [];
        }
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.parse(JSON.stringify(backupData, null, 2))); // wait, JSON.stringify(backupData, null, 2)
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `ganaga_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExporting(false);
      setSuccess('¡Backup exportado con éxito!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setExporting(false);
      alert('Error al exportar base de datos.');
    }
  };

  const handleResetAllData = async () => {
    if (!confirm('⚠️ ATENCIÓN: ¿Estás seguro de BORRAR TODOS LOS DATOS (productos, órdenes, clientes, proveedores, etc.) para comenzar desde cero? Esta acción no se puede deshacer.')) {
      return;
    }

    setResetting(true);
    try {
      localStorage.clear();
      const collectionsToClear = ['products', 'orders', 'clients', 'suppliers', 'staff', 'transactions'];
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

  return (
    <div className="glass-card p-8 rounded-[2.5rem] space-y-8 border border-fuchsia-500/30 glow-magenta shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-fuchsia-400" /> Panel de Creador (Super Administrador)
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Control total de licencias, activación de módulos, suspensión por falta de pago, respaldos y reseteo general.
          </p>
        </div>
        {success && (
          <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-black uppercase">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}
      </div>

      {/* Backup Database Card */}
      <div className="bg-[#121624] border border-cyan-500/30 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" /> Respaldo de Base de Datos (Backup JSON)
          </h4>
          <p className="text-xs text-slate-300">
            Descarga una copia de seguridad completa con todos los datos de Firestore (productos, órdenes, clientes, etc.).
          </p>
        </div>
        <button
          onClick={handleExportBackup}
          disabled={exporting}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> {exporting ? 'Generando...' : 'Descargar Backup JSON'}
        </button>
      </div>

      {/* App Subscription Master Switch */}
      <div className={`p-6 rounded-3xl border transition ${subscription.isActive ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-rose-950/60 border-rose-500/50'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Power className={`w-5 h-5 ${subscription.isActive ? 'text-emerald-400' : 'text-rose-400'}`} />
            Estado General de la App y Suscripción
          </h4>
          <p className="text-xs text-slate-300">
            {subscription.isActive ? 'La aplicación está activa y operativa para todos los usuarios.' : 'Suscripción suspendida: La app mostrará pantalla de bloqueo por falta de pago.'}
          </p>
        </div>
        <button
          onClick={handleToggleApp}
          className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition ${
            subscription.isActive ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {subscription.isActive ? 'Suspender por Falta de Pago' : 'Activar Aplicación'}
        </button>
      </div>

      {/* Module Toggles */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-white uppercase tracking-wider">Activación de Módulos del Sistema</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(subscription.enabledModules).map(([key, enabled]) => (
            <div key={key} className="bg-[#121624] p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-300">{key}</span>
              <button
                onClick={() => handleToggleModule(key as any)}
                className={`p-2 rounded-xl transition ${enabled ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'}`}
              >
                {enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Factory Reset Zone */}
      <div className="bg-rose-950/30 border border-rose-500/40 p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="text-sm font-black text-rose-300">Zona de Peligro: Borrar Todo y Comenzar de Cero</h4>
            <p className="text-xs text-rose-400/80">Elimina permanentemente todos los datos de inventario, ventas, clientes y proveedores de la base de datos.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleResetAllData}
            disabled={resetting}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition"
          >
            <Trash2 className="w-4 h-4" /> {resetting ? 'Reseteando...' : 'Borrar Todos los Datos (Reset a Cero)'}
          </button>
        </div>
      </div>

    </div>
  );
};
