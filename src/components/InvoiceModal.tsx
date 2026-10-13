import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { X, Printer, Download, FileText, CheckCircle } from 'lucide-react';
import { CompanyConfig } from './CompanySettingsManager';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'company_config'));
        if (snap.exists()) {
          setCompanyConfig(snap.data() as CompanyConfig);
        }
      } catch (e) {
        console.warn("Using default company config for invoice PDF");
      }
    };
    fetchCompany();
  }, []);

  if (!isOpen || !invoice) return null;

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-[2.5rem] max-w-2xl w-full p-8 relative shadow-2xl my-8 print:shadow-none print:w-full print:max-w-none print:m-0 print:p-0">
        
        {/* Close Button (Hidden on Print) */}
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-slate-900 bg-slate-100 p-2.5 rounded-full print:hidden">
          <X className="w-5 h-5" />
        </button>

        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center gap-4">
            {companyConfig?.logoUrl ? (
              <img src={companyConfig.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1" />
            ) : (
              <div className="w-16 h-16 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                IP
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-slate-900">{companyConfig?.businessName || 'ImportPro S.A.'}</h2>
              <p className="text-xs text-slate-500">{companyConfig?.tradeName || 'Global Commerce'}</p>
              <p className="text-xs text-slate-600 mt-1">CUIT: {companyConfig?.cuit || '30-71234567-9'}</p>
              <p className="text-xs text-slate-600">{companyConfig?.taxCondition || 'Responsable Inscripto'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
              FACTURA A
            </div>
            <p className="text-sm font-mono font-bold text-slate-900">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">Fecha: {new Date(invoice.issueDate).toLocaleDateString('es-AR')}</p>
          </div>
        </div>

        {/* Customer & CAE Info */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-xs">
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider">Cliente:</p>
            <p className="font-black text-slate-900 text-sm mt-0.5">{invoice.customerName}</p>
            <p className="text-slate-600">CUIT: {invoice.customerTaxId}</p>
            <p className="text-slate-600">Dirección: {invoice.customerAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-bold uppercase tracking-wider">ARCA (AFIP):</p>
            <p className="font-mono font-bold text-slate-900 mt-0.5">CAE: {invoice.cae}</p>
            <p className="text-slate-600">Vto. CAE: {invoice.caeDueDate}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase font-black border-b border-slate-200">
                <th className="p-3">SKU / Producto</th>
                <th className="p-3 text-center">Cant.</th>
                <th className="p-3 text-right">Precio Unit. (ARS)</th>
                <th className="p-3 text-right">Subtotal (ARS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</p>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                  <td className="p-3 text-right font-mono">${item.price.toLocaleString('es-AR')}</td>
                  <td className="p-3 text-right font-mono font-bold">${(item.price * item.quantity).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-xs font-medium text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">${invoice.subtotal.toLocaleString('es-AR')} ARS</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (21%):</span>
              <span className="font-mono font-bold">${invoice.taxIVA.toLocaleString('es-AR')} ARS</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>Total en Pesos:</span>
              <span className="font-mono text-emerald-600">${invoice.total.toLocaleString('es-AR')} ARS</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 border-t border-slate-200 pt-4 space-y-1">
          <p>{companyConfig?.ticketHeader || '¡Gracias por su compra en ImportPro!'}</p>
          <p>{companyConfig?.ticketFooter || 'Comprobante autorizado por ARCA.'}</p>
        </div>

        {/* Download / Print Actions (Hidden on Print) */}
        <div className="mt-8 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition"
          >
            <Download className="w-4 h-4" /> Descargar PDF / Imprimir
          </button>
        </div>

      </div>
    </div>
  );
};
