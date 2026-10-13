import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Database, Download, Upload, CheckCircle, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

export const BackupManager: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportBackup = async () => {
    setExporting(true);
    setMessage(null);
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

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `erp_ganaga_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExporting(false);
      setMessage({ type: 'success', text: '¡Copia de seguridad (Backup) descargada con éxito!' });
    } catch (e) {
      setExporting(false);
      setMessage({ type: 'error', text: 'Error al exportar la base de datos.' });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ ATENCIÓN: Restaurar un respaldo sobrescribirá los datos actuales en Firestore. ¿Desea continuar?')) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const backupData = JSON.parse(jsonContent);

        for (const [colName, documents] of Object.entries(backupData)) {
          if (Array.isArray(documents)) {
            for (const docData of documents) {
              const docId = docData.id || `doc_${Date.now()}_${Math.random()}`;
              const { id, ...dataWithoutId } = docData;
              await setDoc(doc(db, colName, docId), dataWithoutId);
            }
          }
        }

        setImporting(false);
        setMessage({ type: 'success', text: '¡Base de datos restaurada exitosamente desde el archivo JSON!' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        setImporting(false);
        setMessage({ type: 'error', text: 'El archivo JSON de respaldo no tiene un formato válido.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10 glow-cyan">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-cyan-400" /> Módulo de Backup & Restauración
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Exporte copias de seguridad completas de Firestore o restaure el sistema desde un archivo JSON anterior.
          </p>
        </div>
        {message && (
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider ${
            message.type === 'success' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Card */}
        <div className="glass-card p-8 rounded-[2.5rem] space-y-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-cyan-400">
              <Download className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Exportar Copia de Seguridad</h3>
              <p className="text-xs text-slate-400 mt-1">
                Genera un archivo JSON con todos los registros de productos, órdenes, clientes, proveedores y configuraciones guardados en la nube.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={exporting}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generando Respaldo...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Descargar Backup JSON
              </>
            )}
          </button>
        </div>

        {/* Import Card */}
        <div className="glass-card p-8 rounded-[2.5rem] space-y-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-fuchsia-500/20 border border-fuchsia-500/40 rounded-2xl flex items-center justify-center text-fuchsia-400">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Restaurar Base de Datos</h3>
              <p className="text-xs text-slate-400 mt-1">
                Seleccione un archivo JSON de respaldo previo para importar y restaurar todos los datos en la base de datos.
              </p>
            </div>
          </div>

          <div>
            <label className="w-full py-4 bg-[#121624] hover:bg-[#1A2035] border border-fuchsia-500/40 text-fuchsia-300 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> {importing ? 'Restaurando Datos...' : 'Subir y Restaurar JSON'}
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};
