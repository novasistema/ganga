import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CompanySettings } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { 
  Building2, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  Receipt, 
  Phone, 
  Mail, 
  MapPin, 
  Percent, 
  DollarSign,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const CompanySettingsView: React.FC = () => {
  const { companySettings, updateCompanySettings } = useStore();
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync formData whenever companySettings updates (e.g. from Firestore sync)
  React.useEffect(() => {
    setFormData(companySettings);
  }, [companySettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateCompanySettings({
      ...formData,
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleToggleInstallment = (val: number) => {
    const list = formData.installmentsAllowed || [];
    if (list.includes(val)) {
      setFormData({
        ...formData,
        installmentsAllowed: list.filter((n) => n !== val)
      });
    } else {
      setFormData({
        ...formData,
        installmentsAllowed: [...list, val].sort()
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-zinc-950 font-display">
            Configuración de la Empresa &amp; Formas de Pago
          </h3>
          <p className="text-xs text-zinc-500">
            Administrá el nombre de fantasía, datos fiscales, depósito de despacho, montos mínimos y cuentas bancarias en Firestore
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Nombre y datos actualizados en toda la web!</span>
            </div>
          )}

          <button
            type="submit"
            form="company-settings-form"
            disabled={isSaving}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-orange-600/20 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      <form id="company-settings-form" onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Company Profile & Fiscal Information */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-zinc-900 font-display">
                Datos de la Empresa &amp; Identificación Fiscal
              </h4>
              <p className="text-[11px] text-zinc-500">
                Información visible en la cabecera web, proformas, facturas y remitos comerciales
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-zinc-700">
                  Nombre de Fantasía (Marca en la Web)
                </label>
                {formData.companyName && (
                  <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                    {formData.companyName.toUpperCase()} MAYORISTA
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej: GANGA"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500 font-medium font-display"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setIsSaving(true);
                    await updateCompanySettings({
                      ...formData,
                      updatedAt: new Date().toISOString().split('T')[0]
                    });
                    setIsSaving(false);
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 4000);
                  }}
                  disabled={isSaving || !formData.companyName.trim()}
                  title="Aplica este nombre de inmediato a la cabecera y a toda la web"
                  className="shrink-0 px-3 py-2 bg-zinc-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Aplicar a la Web</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Este nombre sustituye a "NUVOH" en la barra superior, logo, presupuestos y mensajes de WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Razón Social Oficial
              </label>
              <input
                type="text"
                required
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                CUIT de la Empresa
              </label>
              <input
                type="text"
                required
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500 font-mono font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Dirección del Depósito Central / Sede
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Ciudad / Provincia
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Teléfono de Ventas / WhatsApp Oficial
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                Email de Atención Comercial
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1 flex items-center justify-between">
                <span>Pedido Mínimo Mayorista (ARS)</span>
                <span className="text-[10px] text-orange-600 font-mono font-bold">Modifica toda la tienda</span>
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                required
                value={formData.minimumOrder}
                onChange={(e) => setFormData({ ...formData, minimumOrder: Number(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden focus:border-orange-500 font-mono font-bold text-orange-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Payment Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-zinc-900 font-display">
                Configuración de Formas de Pago
              </h4>
              <p className="text-[11px] text-zinc-500">
                Canales habilitados para el checkout y acreditación bancaria
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Bank details */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-orange-600" />
                  <span>Transferencia Bancaria Inmediata (CBU / Alias)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Activo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Banco / Entidad</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Santander Río"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Titular de la Cuenta</label>
                  <input
                    type="text"
                    required
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                    placeholder="NUVOH ARGENTINA S.A."
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">CBU (22 dígitos)</label>
                  <input
                    type="text"
                    required
                    value={formData.cbu}
                    onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
                    placeholder="0720123420000001234567"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Alias CBU</label>
                  <input
                    type="text"
                    required
                    value={formData.alias}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value.toUpperCase() })}
                    placeholder="NUVOH.MAYORISTA.ARS"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden focus:border-orange-500 font-mono uppercase font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Credit Card Gateway Configuration */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>Pasarela Segura de Tarjetas (Visa, Mastercard, Cabal)</span>
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Permite a los clientes pagar con tarjeta en la tienda con simulación tokenizada SSL
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cardPaymentsEnabled}
                    onChange={(e) => setFormData({ ...formData, cardPaymentsEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 accent-orange-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-800">
                    {formData.cardPaymentsEnabled ? 'Habilitada' : 'Deshabilitada'}
                  </span>
                </label>
              </div>

              {formData.cardPaymentsEnabled && (
                <div className="pt-2 border-t border-zinc-200/80 flex items-center gap-6 text-xs">
                  <span className="font-semibold text-zinc-600">Cuotas autorizadas en checkout:</span>
                  <div className="flex items-center gap-4">
                    {[1, 3, 6, 12].map((installment) => (
                      <label key={installment} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.installmentsAllowed?.includes(installment)}
                          onChange={() => handleToggleInstallment(installment)}
                          className="rounded text-orange-600 accent-orange-600"
                        />
                        <span className="font-medium text-zinc-700">
                          {installment} {installment === 1 ? 'pago' : 'cuotas'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Los cambios se sincronizan en tiempo real en la base de datos de Firebase.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-md shadow-orange-600/20 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando en Firestore...' : 'Guardar Configuración'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
