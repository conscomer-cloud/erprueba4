import React, { useState } from 'react';
import { FileText, Phone, MessageSquare, Mail, Building2, Briefcase, Calendar, Check, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { ActivityType } from '../../types/erp';
import { INITIAL_SALES_REPS } from '../../data/initialCRMData';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  defaultOpportunityId?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerId,
  defaultOpportunityId,
}) => {
  const { customers, opportunities, addActivity } = useERP();
  const { currentUser } = useAuth();

  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [opportunityId, setOpportunityId] = useState(defaultOpportunityId || '');
  const [type, setType] = useState<ActivityType>('LLAMADA');
  const [result, setResult] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [salespersonId, setSalespersonId] = useState(currentUser?.id || 'USR-004');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) {
      alert('Por favor describa el resultado o minuta de la actividad.');
      return;
    }

    const customer = customers.find((c) => c.id === customerId);
    const opp = opportunities.find((o) => o.id === opportunityId);
    const rep = INITIAL_SALES_REPS.find((r) => r.id === salespersonId);

    addActivity({
      customerId: customerId || undefined,
      customerName: customer?.businessName,
      opportunityId: opportunityId || undefined,
      opportunityTitle: opp?.title,
      salespersonId,
      salespersonName: rep?.name || currentUser?.name || 'Ejecutivo Comercial',
      type,
      result,
      nextAction: nextAction || 'Dar seguimiento en 3 días hábiles.',
      date: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 shadow-md">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrar Actividad Comercial</h3>
              <p className="text-xs text-slate-400">Bitácora de llamadas, mensajes, visitas y acuerdos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 p-6 overflow-y-auto max-h-[75vh]">
          {/* Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Cliente Asociado</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.businessName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Oportunidad Vinculada</label>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="">-- Sin Oportunidad (o Seleccionar) --</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.folio} — {o.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Tipo de Actividad</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="LLAMADA">📞 Llamada Telefónica</option>
                <option value="WHATSAPP">💬 WhatsApp / Mensajería</option>
                <option value="CORREO">✉️ Correo Electrónico</option>
                <option value="REUNION">🤝 Reunión Presencial / Virtual</option>
                <option value="VISITA_TECNICA">🏗️ Visita Técnica en Obra</option>
                <option value="PRESENTACION_COTIZACION">📄 Presentación de Cotización</option>
                <option value="OTRO">📌 Otro</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Ejecutivo Comercial</label>
              <select
                value={salespersonId}
                onChange={(e) => setSalespersonId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                {INITIAL_SALES_REPS.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result / Notes */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Resultado / Minuta de la Interacción <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ej. Se revisó la propuesta económica con el superintendente de obra. Tienen duda sobre el tiempo de entrega de la lana mineral de 2 pulgadas..."
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Next Action */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Siguiente Acción Acordada
            </label>
            <input
              type="text"
              placeholder="Ej. Enviar certificado ASTM C547 y validar con logística entrega el jueves."
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md"
            >
              <Check className="h-4 w-4" />
              Guardar Actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
