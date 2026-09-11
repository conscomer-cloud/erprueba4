import React, { useState } from 'react';
import { Calendar, Clock, MessageSquare, Phone, Mail, FileText, User, Check, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { FollowUp, FollowUpPriority } from '../../types/erp';
import { INITIAL_SALES_REPS } from '../../data/initialCRMData';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  defaultOpportunityId?: string;
  defaultLeadId?: string;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerId,
  defaultOpportunityId,
  defaultLeadId,
}) => {
  const { customers, opportunities, leads, addFollowUp } = useERP();
  const { currentUser } = useAuth();

  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [opportunityId, setOpportunityId] = useState(defaultOpportunityId || '');
  const [leadId, setLeadId] = useState(defaultLeadId || '');
  const [salespersonId, setSalespersonId] = useState(currentUser?.id || 'USR-004');
  const [type, setType] = useState<'LLAMADA' | 'WHATSAPP' | 'CORREO' | 'REUNION' | 'COTIZACION' | 'VISITA'>('WHATSAPP');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('11:00');
  const [priority, setPriority] = useState<FollowUpPriority>('MEDIA');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      alert('Por favor describe la tarea o seguimiento.');
      return;
    }

    const customer = customers.find((c) => c.id === customerId);
    const opp = opportunities.find((o) => o.id === opportunityId);
    const lead = leads.find((l) => l.id === leadId);
    const rep = INITIAL_SALES_REPS.find((r) => r.id === salespersonId);

    addFollowUp({
      customerId: customerId || undefined,
      customerName: customer?.businessName,
      opportunityId: opportunityId || undefined,
      opportunityTitle: opp?.title,
      leadId: leadId || undefined,
      leadName: lead?.name || lead?.company,
      salespersonId,
      salespersonName: rep?.name || currentUser?.name || 'Ejecutivo Comercial',
      type,
      description,
      date,
      time,
      priority,
      status: 'PENDIENTE',
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
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Programar Tarea de Seguimiento</h3>
              <p className="text-xs text-slate-400">Agrega un recordatorio en "Mi Día" para tu cartera</p>
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
          {/* Target type / Entity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Cliente Asociado</label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setLeadId('');
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="">-- Sin Cliente (o Seleccionar) --</option>
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
                <option value="">-- Sin Oportunidad --</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.folio} — {o.title} ({o.customerName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Canal / Medio</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="WHATSAPP">WhatsApp Directo</option>
                <option value="LLAMADA">Llamada Telefónica</option>
                <option value="CORREO">Correo Electrónico</option>
                <option value="COTIZACION">Presentar Cotización</option>
                <option value="VISITA">Visita Técnica en Obra</option>
                <option value="REUNION">Reunión Comercial</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FollowUpPriority)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="ALTA">🔥 Alta (Cierre Próximo)</option>
                <option value="MEDIA">⚡ Media (Seguimiento Estándar)</option>
                <option value="BAJA">🌱 Baja (Prospección Inicial)</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Fecha Programada</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Hora</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Descripción de la Tarea <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ej. Llamar a Ing. Morales para revisar dudas sobre el flete y acordar anticipo de la OC..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Salesperson */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">Responsable</label>
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
              Guardar Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
