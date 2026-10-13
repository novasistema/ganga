import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, Calculator, Package, Upload, Image as ImageIcon } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Herramientas y CNC');
  const [costPriceUSD, setCostPriceUSD] = useState<number>(100);
  const [freightCostUSD, setFreightCostUSD] = useState<number>(20);
  const [importDutiesUSD, setImportDutiesUSD] = useState<number>(30);
  const [exchangeRate, setExchangeRate] = useState<number>(1250);
  const [finalPriceARS, setFinalPriceARS] = useState<number>(187500);
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(2);
  const [supplier, setSupplier] = useState('Shenzhen TechGlobal Ltd.');
  const [sourceWebUrl, setSourceWebUrl] = useState('');
  const [sourceWebName, setSourceWebName] = useState('');
  const [containerBatch, setContainerBatch] = useState('CONT-2026-A1');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category);
      setCostPriceUSD(productToEdit.costPriceUSD);
      setFreightCostUSD(productToEdit.freightCostUSD);
      setImportDutiesUSD(productToEdit.importDutiesUSD);
      setExchangeRate(productToEdit.exchangeRate || 1250);
      setFinalPriceARS(productToEdit.finalPriceARS);
      setStock(productToEdit.stock);
      setMinStock(productToEdit.minStock);
      setSupplier(productToEdit.supplier);
      setSourceWebUrl(productToEdit.sourceWebUrl || '');
      setSourceWebName(productToEdit.sourceWebName || '');
      setContainerBatch(productToEdit.containerBatch);
      setImageUrl(productToEdit.imageUrl);
      setDescription(productToEdit.description);
    } else {
      setTitle('');
      setSku(`IMP-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory('Tecnología');
      setCostPriceUSD(200);
      setFreightCostUSD(30);
      setImportDutiesUSD(40);
      setExchangeRate(1250);
      setFinalPriceARS(345000);
      setStock(15);
      setMinStock(3);
      setSupplier('Pacific Trading Co.');
      setContainerBatch('CONT-2026-B2');
      setImageUrl('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800');
      setDescription('');
    }
  }, [productToEdit, isOpen]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAutoPrice = () => {
    const totalCostUSD = Number(costPriceUSD) + Number(freightCostUSD) + Number(importDutiesUSD);
    const recommendedARS = Math.round(totalCostUSD * 1.5 * Number(exchangeRate));
    setFinalPriceARS(recommendedARS);
  };

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      title,
      sku,
      category,
      costPriceUSD: Number(costPriceUSD),
      freightCostUSD: Number(freightCostUSD),
      importDutiesUSD: Number(importDutiesUSD),
      exchangeRate: Number(exchangeRate),
      finalPriceARS: Number(finalPriceARS),
      stock: Number(stock),
      minStock: Number(minStock),
      supplier,
      sourceWebUrl: sourceWebUrl.trim() || undefined,
      sourceWebName: sourceWebName.trim() || undefined,
      containerBatch,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      description,
      active: true,
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
    };
    onSave(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="glass-card rounded-[2.5rem] max-w-2xl w-full p-8 text-white relative shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20 glow-cyan">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full transition">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 bg-cyan-600/20 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-cyan-400 glow-cyan">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">{productToEdit ? 'Editar Producto Importado' : 'Nuevo Producto de Importación'}</h2>
            <p className="text-xs text-slate-400 font-medium">Gestión de costos, inventario e imagen sincronizada</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Título del Producto</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Laser Engraver Pro"
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">SKU / Código</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Categoría</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="Herramientas y CNC">Herramientas y CNC</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Energía Renovable">Energía Renovable</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Accesorios">Accesorios</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Proveedor</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lote / Contenedor</label>
              <input
                type="text"
                value={containerBatch}
                onChange={e => setContainerBatch(e.target.value)}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          {/* Dónde pedirlo / Página Web de Origen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#121624] p-4 rounded-2xl border border-white/10">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">Página / Tienda de Origen</label>
              <input
                type="text"
                value={sourceWebName}
                onChange={e => setSourceWebName(e.target.value)}
                placeholder="Ej. Mayorista Nacional, Global Tech, Once Bazar"
                className="w-full bg-[#0A0D18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">URL para Pedir el Producto</label>
              <input
                type="url"
                value={sourceWebUrl}
                onChange={e => setSourceWebUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0A0D18] border border-white/10 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Image upload from PC / Cellphone */}
          <div className="bg-[#121624] p-5 rounded-2xl border border-white/10 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400">Imagen del Producto (PC o Celular)</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 font-medium">La imagen se convertirá y guardará directamente en la base de datos Firestore para visualizarse desde cualquier dispositivo.</p>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-[#121624] p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Costos de Importación (USD)</span>
              <button
                type="button"
                onClick={calculateAutoPrice}
                className="flex items-center gap-1.5 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/30 font-bold transition"
              >
                <Calculator className="w-3.5 h-3.5" /> Calcular Sugerido
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Costo FOB (USD)</label>
                <input
                  type="number"
                  value={costPriceUSD}
                  onChange={e => setCostPriceUSD(Number(e.target.value))}
                  className="w-full bg-[#0A0D18] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Flete (USD)</label>
                <input
                  type="number"
                  value={freightCostUSD}
                  onChange={e => setFreightCostUSD(Number(e.target.value))}
                  className="w-full bg-[#0A0D18] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Aranceles (USD)</label>
                <input
                  type="number"
                  value={importDutiesUSD}
                  onChange={e => setImportDutiesUSD(Number(e.target.value))}
                  className="w-full bg-[#0A0D18] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cambio (ARS)</label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(Number(e.target.value))}
                  className="w-full bg-[#0A0D18] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Precio Venta (ARS)</label>
              <input
                type="number"
                required
                value={finalPriceARS}
                onChange={e => setFinalPriceARS(Number(e.target.value))}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-black text-emerald-400 font-mono text-base"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Stock Actual</label>
              <input
                type="number"
                required
                value={stock}
                onChange={e => setStock(Number(e.target.value))}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Stock Mínimo</label>
              <input
                type="number"
                required
                value={minStock}
                onChange={e => setMinStock(Number(e.target.value))}
                className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Descripción</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-white/5 text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-lg glow-cyan transition"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
