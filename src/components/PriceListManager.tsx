import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Tag, Plus, Edit2, Trash2, CheckCircle, Percent, DollarSign, Sparkles, Globe, ExternalLink } from 'lucide-react';
import { getProductSourceWeb } from '../utils/productUtils';

interface PriceList {
  id: string;
  name: string;
  markupPercent: number; // e.g., 30 for +30%, -10 for -10%
  description: string;
}

const DEFAULT_PRICE_LISTS: PriceList[] = [
  { id: 'list-1', name: 'Minorista (Público General)', markupPercent: 0, description: 'Precio base de venta al público' },
  { id: 'list-2', name: 'Mayorista A', markupPercent: -15, description: 'Descuento para comercios adheridos (-15%)' },
  { id: 'list-3', name: 'Distribuidor VIP', markupPercent: -25, description: 'Precio preferencial para distribuidores (-25%)' },
];

interface PriceListManagerProps {
  products: Product[];
}

export const PriceListManager: React.FC<PriceListManagerProps> = ({ products }) => {
  const [priceLists, setPriceLists] = useState<PriceList[]>(DEFAULT_PRICE_LISTS);
  const [selectedListId, setSelectedListId] = useState<string>(DEFAULT_PRICE_LISTS[0].id);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [name, setName] = useState('');
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPriceLists = async () => {
      try {
        const snap = await getDocs(collection(db, 'price_lists'));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as PriceList);
          setPriceLists(list);
          if (list.length > 0 && !selectedListId) {
            setSelectedListId(list[0].id);
          }
        }
      } catch (e) {
        const local = localStorage.getItem('ganaga_price_lists');
        if (local) setPriceLists(JSON.parse(local));
      }
    };
    fetchPriceLists();
  }, []);

  const saveToStorageAndCloud = async (updated: PriceList[]) => {
    setPriceLists(updated);
    localStorage.setItem('ganaga_price_lists', JSON.stringify(updated));
    for (const pl of updated) {
      try {
        await setDoc(doc(db, 'price_lists', pl.id), pl);
      } catch (e) {
        // offline fallback
      }
    }
  };

  const handleOpenAdd = () => {
    setEditingList(null);
    setName('');
    setMarkupPercent(15);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pl: PriceList) => {
    setEditingList(pl);
    setName(pl.name);
    setMarkupPercent(pl.markupPercent);
    setDescription(pl.description);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (priceLists.length <= 1) {
      alert('Debe mantener al menos una lista de precios.');
      return;
    }
    if (!confirm('¿Eliminar esta lista de precios?')) return;
    const updated = priceLists.filter(p => p.id !== id);
    await saveToStorageAndCloud(updated);
    if (selectedListId === id) {
      setSelectedListId(updated[0].id);
    }
    setSuccess('Lista eliminada con éxito.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updated: PriceList[];
    if (editingList) {
      updated = priceLists.map(p => p.id === editingList.id ? { ...p, name, markupPercent: Number(markupPercent), description } : p);
    } else {
      const newList: PriceList = {
        id: `pl-${Date.now()}`,
        name,
        markupPercent: Number(markupPercent),
        description,
      };
      updated = [...priceLists, newList];
      setSelectedListId(newList.id);
    }

    await saveToStorageAndCloud(updated);
    setIsModalOpen(false);
    setSuccess(editingList ? 'Lista de precios actualizada con éxito.' : 'Nueva lista de precios creada con éxito.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const currentPriceList = priceLists.find(p => p.id === selectedListId) || priceLists[0];

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/10 glow-indigo">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Tag className="w-7 h-7 text-emerald-400" /> Gestión de Listas de Precios & Márgenes
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Cree nuevas listas de precios y ajuste los porcentajes de ganancia o recargo para cada categoría de cliente.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {success && (
            <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-black uppercase">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nueva Lista de Precios
          </button>
        </div>
      </div>

      {/* Price Lists Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {priceLists.map(pl => {
          const isSelected = pl.id === selectedListId;
          return (
            <div
              key={pl.id}
              onClick={() => setSelectedListId(pl.id)}
              className={`glass-card p-6 rounded-[2rem] border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected ? 'border-emerald-500 glow-emerald bg-[#121624]/90' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                    pl.markupPercent >= 0 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' : 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                  }`}>
                    {pl.markupPercent >= 0 ? `+${pl.markupPercent}% Ganancia` : `${pl.markupPercent}% Descuento`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(pl); }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition"
                      title="Modificar Lista"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(pl.id); }}
                      className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-300 hover:text-rose-400 transition"
                      title="Eliminar Lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{pl.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{pl.description || 'Sin descripción'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400 font-bold">
                <span>Estado: {isSelected ? 'Activa en Visualización' : 'Hacer Clic para Ver'}</span>
                {isSelected && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Price List Products Table */}
      <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Productos calculados para: <span className="text-cyan-300">{currentPriceList.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Aplicando un margen / recargo de <span className="font-mono text-emerald-400 font-bold">{currentPriceList.markupPercent}%</span> sobre el precio base.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121624] text-slate-400 uppercase font-black tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-6">SKU / Producto</th>
                <th className="py-4 px-6">Categoría</th>
                <th className="py-4 px-6">Dónde Pedirlo (Origen / Web)</th>
                <th className="py-4 px-6">Precio Base ARS</th>
                <th className="py-4 px-6">Ajuste ({currentPriceList.markupPercent}%)</th>
                <th className="py-4 px-6 text-right">Precio Final en Lista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-slate-200">
              {products.map(p => {
                const adjustedPrice = Math.round(p.finalPriceARS * (1 + currentPriceList.markupPercent / 100));
                const webInfo = getProductSourceWeb(p);
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.title} className="w-10 h-10 object-cover rounded-xl bg-black/40 border border-white/10" />
                        <div>
                          <p className="font-black text-white">{p.title}</p>
                          <p className="font-mono text-[10px] text-cyan-400">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 uppercase text-[10px] font-bold text-slate-300">{p.category}</td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit">
                          <Globe className="w-2.5 h-2.5 text-cyan-400" /> {webInfo.name}
                        </span>
                        {webInfo.url && (
                          <a
                            href={webInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-200 hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> {webInfo.domain || 'Abrir'}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">${p.finalPriceARS.toLocaleString('es-AR')}</td>
                    <td className="py-4 px-6 font-mono font-bold text-amber-400">
                      {currentPriceList.markupPercent >= 0 ? `+${currentPriceList.markupPercent}%` : `${currentPriceList.markupPercent}%`}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-black text-emerald-400 text-sm">
                      ${adjustedPrice.toLocaleString('es-AR')} ARS
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-md w-full p-8 text-white relative shadow-2xl border border-white/20 glow-indigo">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full">
              ✕
            </button>

            <h3 className="text-xl font-black mb-6">{editingList ? 'Modificar Lista de Precios' : 'Crear Nueva Lista de Precios'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre de la Lista</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Mayorista B, Revendedores..."
                  className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Porcentaje de Ganancia o Recargo (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={markupPercent}
                    onChange={e => setMarkupPercent(parseFloat(e.target.value) || 0)}
                    placeholder="Ej. 30 para +30% o -10 para descuento"
                    className="w-full bg-[#121624] border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Usa números positivos para recargo/ganancia (ej: 20) y negativos para descuentos (ej: -10).</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej. Lista especial para clientes frecuentes"
                  className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition"
              >
                {editingList ? 'Guardar Cambios' : 'Crear Lista de Precios'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
