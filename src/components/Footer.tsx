import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Truck, CreditCard, MessageCircle, Mail, MapPin, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenLogin: () => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLogin, isAdmin, onOpenAdmin }) => {
  const { settings } = useStore();

  const formatWhatsAppLink = () => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hola ${settings.companyName}, necesito soporte con mi compra.`);
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-20">
      {/* Trust Pillars */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Despacho Nacional</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Envíos asegurados y rastreables</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compra 100% Protegida</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Garantía total de cambio y devolución</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Múltiples Medios de Pago</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Transferencia con 10% OFF o Tarjetas</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Atención Directa</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Soporte personalizado vía WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              {settings.companyName || 'DropStore'}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Plataforma especializada en dropshipping y e-commerce con catálogo en tiempo real sincronizado en Firebase. Seleccionamos los mejores productos del mercado global para entregártelos directo en tu casa.
          </p>
          <div className="pt-2">
            <a
              href={formatWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Contactar por WhatsApp Oficial</span>
            </a>
          </div>
        </div>

        <div className="md:col-span-4 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Datos de la Empresa</h4>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>{settings.address || 'Av. Santa Fe 3200, CABA'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{settings.email || 'contacto@gangastore.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>CBU/Alias Oficial: <strong>{settings.bankCbuAlias || 'GANGA.DROP.PAGOS'}</strong></span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Administración</h4>
          <p className="text-xs text-slate-400">
            Acceso exclusivo para el equipo de ventas, gestión de catálogo y configuración de pagos.
          </p>
          <div className="pt-2">
            {isAdmin ? (
              <button
                onClick={onOpenAdmin}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Abrir Panel de Control CRM
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="text-xs font-semibold text-slate-400 hover:text-white underline cursor-pointer"
              >
                Ingreso Administrador (CRM)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900 py-4 px-4 text-center text-[11px] text-slate-500">
        © {new Date().getFullYear()} {settings.companyName || 'DropStore'}. Todos los derechos reservados. Base de datos e inventario en tiempo real con Firebase.
      </div>
    </footer>
  );
};
