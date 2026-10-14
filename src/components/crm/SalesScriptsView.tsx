import React, { useState } from 'react';
import { SALES_SCRIPTS } from '../../data/crmMockData';
import { generateWhatsAppLink } from '../../utils/formatters';
import { 
  Copy, 
  Check, 
  MessageCircle, 
  Sparkles, 
  Send
} from 'lucide-react';

export const SalesScriptsView: React.FC = () => {
  const [selectedScriptId, setSelectedScriptId] = useState(SALES_SCRIPTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic replacement variables
  const [clientName, setClientName] = useState('Carlos');
  const [businessName, setBusinessName] = useState('Distribuidora San Martín');
  const [amount, setAmount] = useState('$240.000');
  const [city, setCity] = useState('Rosario');
  const [customPhone, setCustomPhone] = useState('+54 9 11 4982-1100');

  const selectedScript = SALES_SCRIPTS.find((s) => s.id === selectedScriptId) || SALES_SCRIPTS[0];

  const getPopulatedText = (template: string) => {
    return template
      .replace(/{nombre}/g, clientName || 'estimado cliente')
      .replace(/{negocio}/g, businessName || 'tu comercio')
      .replace(/{monto}/g, amount || '$100.000')
      .replace(/{ciudad}/g, city || 'tu localidad');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const currentText = getPopulatedText(selectedScript.text);
  const waUrl = generateWhatsAppLink(customPhone, currentText);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-black text-zinc-950 font-display">
          Guiones y Plantillas de Cierre por WhatsApp
        </h3>
        <p className="text-xs text-zinc-500">
          Mensajes comerciales diseñados para acelerar la conversión y cerrar ventas mayoristas en minutos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Quick Variables and Script Selector */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick variables to customize message on the fly */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-display flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Personalizar Datos de la Plantilla</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Nombre:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Comercio:</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Monto:</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Ciudad:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Teléfono Destino WhatsApp:</label>
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Script list buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
              Seleccionar Plantilla Comercial:
            </span>
            {SALES_SCRIPTS.map((script) => (
              <button
                key={script.id}
                onClick={() => setSelectedScriptId(script.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                  selectedScriptId === script.id
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    selectedScriptId === script.id ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {script.category}
                  </span>
                </div>
                <strong className="block font-bold text-xs">
                  {script.title}
                </strong>
              </button>
            ))}
          </div>

        </div>

        {/* Right: Live Preview Box */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                {selectedScript.category}
              </span>
              <h4 className="text-base font-black text-zinc-900 font-display mt-1">
                {selectedScript.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(selectedScript.id, currentText)}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedId === selectedScript.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </a>
            </div>
          </div>

          {/* WhatsApp message bubble mockup */}
          <div className="bg-[#efeae2] p-4 sm:p-6 rounded-2xl border border-zinc-300/80">
            <div className="bg-white rounded-2xl p-4 shadow-sm max-w-lg border border-zinc-200 text-xs text-zinc-900 whitespace-pre-wrap leading-relaxed font-sans">
              {currentText}
              <div className="text-[10px] text-zinc-400 text-right mt-2 flex items-center justify-end gap-1">
                <span>10:45</span>
                <span>✓✓</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            💡 <strong>Consejo de venta:</strong> La rapidez de respuesta es el factor número uno de conversión en ventas mayoristas. Enviá el presupuesto dentro de los primeros 10 minutos para triplicar las probabilidades de cierre.
          </div>
        </div>

      </div>
    </div>
  );
};
