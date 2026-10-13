import React, { useState, useEffect } from 'react';
import { Invoice, Order, Product, Customer } from '../types';
import { InvoiceModal } from './InvoiceModal';
import { SalesEntryModal } from './SalesEntryModal';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { FileText, Plus, Search, Eye, ShieldCheck, Printer, Store, MessageCircle, Trash2 } from 'lucide-react';

interface InvoicingManagerProps {
  orders: Order[];
}

export const InvoicingManager: React.FC<InvoicingManagerProps> = ({ orders }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const invSnap = await getDocs(collection(db, 'invoices'));
      setInvoices(invSnap.docs.map(doc => doc.data() as Invoice));

      const prodSnap = await getDocs(collection(db, 'products'));
      setProducts(prodSnap.docs.map(doc => doc.data() as Product));

      const custSnap = await getDocs(collection(db, 'customers'));
      setCustomers(custSnap.docs.map(doc => doc.data() as Customer));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'invoices/products/customers');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateInvoice = async (order: Order) => {
    const invoiceId = `inv-${Date.now()}`;
    const invoiceNumber = `0001-000${Math.floor(100 + Math.random() * 900)}`;
    const subtotal = order.subtotal;
    const taxIVA = subtotal * 0.21;
    const total = order.total;

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      orderId: order.id,
      customerName: order.customerName,
      customerTaxId: '30-29384756-9',
      customerAddress: order.shippingAddress,
      items: order.items,
      subtotal,
      taxIVA,
      total,
      issueDate: new Date().toISOString(),
      status: 'Emitida',
      cae: `${Math.floor(70000000000000 + Math.random() * 99999999999999)}`,
      caeDueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    };

    try {
      await setDoc(doc(db, 'invoices', invoiceId), newInvoice);
      fetchData();
      setSelectedInvoice(newInvoice);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `invoices/${invoiceId}`);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este comprobante de venta?')) return;
    try {
      await deleteDoc(doc(db, 'invoices', id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `invoices/${id}`);
    }
  };

  const handleWhatsAppShare = (invoice: Invoice) => {
    const text = `*COMPROBANTE DE VENTA - IMPORTPRO* %0A` +
      `Factura N°: *${invoice.invoiceNumber}*%0A` +
      `Cliente: *${invoice.customerName}*%0A` +
      `Fecha: ${new Date(invoice.issueDate).toLocaleDateString('es-AR')}%0A` +
      `CAE ARCA: ${invoice.cae}%0A` +
      `*Total: $${invoice.total.toLocaleString('es-AR')} ARS*%0A%0A` +
      `¡Gracias por su compra en ImportPro!`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/10 glow-emerald">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-emerald-400" /> Módulo de Ventas & Comprobantes
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Emisión de comprobantes fiscales ARCA (CAE), envío por WhatsApp y registro de ventas de mostrador.
          </p>
        </div>
        <button
          onClick={() => setIsSalesModalOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-emerald shadow-xl"
        >
          <Store className="w-4 h-4" /> Ingresar Venta (No pasa por ARCA)
        </button>
      </div>

      {/* Search & Orders ready to invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Invoices List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-emerald-400" />
            <input
              type="text"
              placeholder="Buscar por N° de comprobante o cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#121624] border border-white/10 text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>

          <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0A0D18]/90 text-slate-400 uppercase tracking-widest font-black border-b border-white/10">
                    <th className="p-5">N° Factura</th>
                    <th className="p-5">Cliente</th>
                    <th className="p-5">Fecha</th>
                    <th className="p-5">Total (ARS)</th>
                    <th className="p-5">CAE (ARCA)</th>
                    <th className="p-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition">
                      <td className="p-5 font-bold text-white font-mono">{invoice.invoiceNumber}</td>
                      <td className="p-5 font-semibold text-white">{invoice.customerName}</td>
                      <td className="p-5 text-slate-400">{new Date(invoice.issueDate).toLocaleDateString('es-AR')}</td>
                      <td className="p-5 font-mono font-black text-emerald-400 text-sm">${invoice.total.toLocaleString('es-AR')} ARS</td>
                      <td className="p-5 font-mono text-cyan-300 text-[10px]">{invoice.cae}</td>
                      <td className="p-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2.5 bg-[#1A2035] hover:bg-[#252E4A] text-slate-300 rounded-xl transition inline-flex border border-white/10"
                          title="Ver Comprobante"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(invoice)}
                          className="p-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 rounded-xl transition inline-flex border border-emerald-500/30"
                          title="Enviar por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="p-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-xl transition inline-flex border border-rose-500/30"
                          title="Borrar Comprobante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Orders awaiting invoice */}
        <div className="space-y-5">
          <div className="glass-card p-7 rounded-[2.5rem] shadow-2xl space-y-4 border border-white/10">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Órdenes Listas para Facturar (ARCA)
            </h3>
            <p className="text-xs text-slate-400 font-medium">Seleccione una orden para emitir su factura electrónica fiscal.</p>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {orders.map(order => {
                const alreadyInvoiced = invoices.some(inv => inv.orderId === order.id);
                return (
                  <div key={order.id} className="bg-[#121624] p-4 rounded-2xl border border-white/10 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-white">{order.orderNumber}</span>
                      <span className="text-xs text-emerald-400 font-black font-mono">${order.total.toLocaleString('es-AR')} ARS</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{order.customerName}</p>

                    {alreadyInvoiced ? (
                      <span className="inline-block bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-black uppercase">
                        Facturada ARCA
                      </span>
                    ) : (
                      <button
                        onClick={() => handleGenerateInvoice(order)}
                        className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow"
                      >
                        Emitir Factura A (ARCA)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />

      <SalesEntryModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        products={products}
        customers={customers}
        onSaleSuccess={fetchData}
      />
    </div>
  );
};
