import React, { useState } from 'react';
import { Bot, MessageSquare, Mail, Phone, Copy, Check, Sparkles, RefreshCw, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Lead, Opportunity, Customer } from '../../types/erp';

interface AIDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    lead?: Lead;
    opportunity?: Opportunity;
    customer?: Customer;
    defaultChannel?: 'WHATSAPP' | 'EMAIL' | 'LLAMADA';
  };
}

export const AIDraftModal: React.FC<AIDraftModalProps> = ({ isOpen, onClose, target }) => {
  const { generateFollowUpDraftWithAI, addActivity } = useERP();
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL' | 'LLAMADA'>(target.defaultChannel || 'WHATSAPP');
  const [copied, setCopied] = useState(false);
  const [userTone, setUserTone] = useState<'tecnico' | 'comercial' | 'urgente'>('comercial');

  if (!isOpen) return null;

  const draft = generateFollowUpDraftWithAI({
    lead: target.lead,
    opportunity: target.opportunity,
    customer: target.customer,
    channel,
    userPrompt: userTone,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(draft.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const phone = target.lead?.phone || target.customer?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(draft.body);
    window.open(`https://wa.me/${cleanPhone.startsWith('52') ? cleanPhone : '52' + cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleOpenMail = () => {
    const email = target.lead?.email || target.customer?.email || '';
    const subject = encodeURIComponent(draft.subject || 'Seguimiento Técnico CONSCORE');
    const body = encodeURIComponent(draft.body);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 shadow-md">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">CONSCORE AI — Asistente de Seguimiento</h3>
                <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-400/30">
                  Modelo B2B Térmico
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generando propuesta para:{' '}
                <span className="font-semibold text-slate-200">
                  {target.lead?.company || target.customer?.businessName || target.opportunity?.customerName || 'Cliente'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 p-6 overflow-y-auto max-h-[75vh]">
          {/* Channel selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Canal de Comunicación
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition-all ${
                  channel === 'WHATSAPP'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-xs'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                WhatsApp Directo
              </button>
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition-all ${
                  channel === 'EMAIL'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-xs'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Mail className="h-4 w-4 text-blue-400" />
                Correo Formal
              </button>
              <button
                type="button"
                onClick={() => setChannel('LLAMADA')}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition-all ${
                  channel === 'LLAMADA'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-xs'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Phone className="h-4 w-4 text-amber-400" />
                Guion Telefónico
              </button>
            </div>
          </div>

          {/* Subject if email */}
          {channel === 'EMAIL' && draft.subject && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Asunto Sugerido</label>
              <div className="rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-200">
                {draft.subject}
              </div>
            </div>
          )}

          {/* Generated message body */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400">Mensaje Redactado</label>
              <span className="text-[11px] text-slate-500">Personalizado con especificaciones técnicas</span>
            </div>
            <div className="relative rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-yellow-400 selection:text-slate-900">
              {draft.body}
            </div>
          </div>

          {/* Key Talking Points */}
          {draft.talkingPoints && draft.talkingPoints.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Puntos Clave de Argumentación & Cierre:
              </span>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {draft.talkingPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado al portapapeles' : 'Copiar Texto'}
          </button>

          <div className="flex items-center gap-3">
            {channel === 'WHATSAPP' && (
              <button
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Enviar por WhatsApp
              </button>
            )}
            {channel === 'EMAIL' && (
              <button
                onClick={handleOpenMail}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md transition-colors"
              >
                <Mail className="h-4 w-4" />
                Abrir en Cliente de Correo
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
