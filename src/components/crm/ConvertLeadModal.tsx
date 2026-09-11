import React, { useState } from 'react';
import { UserCheck, Building2, Briefcase, DollarSign, Calendar, AlertTriangle, Check, X, ShieldCheck } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Lead } from '../../types/erp';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess?: () => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({ isOpen, onClose, lead, onSuccess }) => {
  const { customers, convertLeadToCustomerAndOpportunity, checkCustomerDuplicates } = useERP();

  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityTitle, setOpportunityTitle] = useState(
    `Proyecto ${lead.productInterest || 'Aislamiento'} - ${lead.company}`
  );
  const [estimatedValue, setEstimatedValue] = useState(lead.estimatedValue || 150000);
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  const [linkToExistingCustomer, setLinkToExistingCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  if (!isOpen) return null;

  const duplicates = checkCustomerDuplicates({
    phone: lead.phone,
    email: lead.email,
    companyName: lead.company,
  });

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      convertLeadToCustomerAndOpportunity(lead.id, {
        createOpportunity,
        opportunityTitle,
        estimatedValue,
        expectedCloseDate,
        existingCustomerId: linkToExistingCustomer && selectedCustomerId ? selectedCustomerId : undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al convertir lead');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shadow-md">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Convertir Lead a Cliente Comercial</h3>
              <p className="text-xs text-slate-400">
                Prospecto: <span className="font-semibold text-slate-200">{lead.company}</span> ({lead.name})
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

        <form onSubmit={handleConvert} className="flex-1 space-y-5 p-6 overflow-y-auto max-h-[75vh]">
          {/* Duplicates notice */}
          {duplicates.length > 0 && !linkToExistingCustomer && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-950/40 p-3.5 text-xs text-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Posible Coincidencia en Base de Clientes</span>
                <p className="mt-0.5 text-amber-200/90">
                  {duplicates[0]?.isCrossVendor
                    ? 'Detectamos una coincidencia de RFC o contacto con un cliente registrado en otra cartera comercial. Por política RLS, no puedes vincular a clientes ajenos sin autorización de Gerencia Comercial.'
                    : `Detectamos ${duplicates.length} cliente(s) en tu cartera con nombre o contacto coincidente.`}
                </p>
                {!duplicates[0]?.isCrossVendor && (
                  <button
                    type="button"
                    onClick={() => {
                      setLinkToExistingCustomer(true);
                      setSelectedCustomerId(duplicates[0]?.id || '');
                    }}
                    className="mt-2 text-xs font-bold text-yellow-400 underline hover:text-yellow-300"
                  >
                    Vincular a cliente existente ({duplicates[0]?.businessName})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Customer Destination Card */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              <Building2 className="h-4 w-4 text-yellow-400" />
              1. Expediente de Cliente
            </h4>

            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="custType"
                    checked={!linkToExistingCustomer}
                    onChange={() => setLinkToExistingCustomer(false)}
                    className="accent-yellow-400"
                  />
                  <span>Crear nuevo cliente comercial con estos datos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="custType"
                    checked={linkToExistingCustomer}
                    onChange={() => setLinkToExistingCustomer(true)}
                    className="accent-yellow-400"
                  />
                  <span>Vincular a cliente existente</span>
                </label>
              </div>

              {linkToExistingCustomer ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Seleccionar Cliente Existente</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="">-- Seleccione un cliente --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.businessName} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400">Razón Social:</span>
                    <p className="font-bold text-white">{lead.company}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Contacto Principal:</span>
                    <p className="font-bold text-white">{lead.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Teléfono:</span>
                    <p className="font-semibold text-slate-200">{lead.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Ciudad / Plaza:</span>
                    <p className="font-semibold text-slate-200">{lead.city || 'México'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Opportunity Creation Card */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Briefcase className="h-4 w-4 text-emerald-400" />
                2. Apertura de Oportunidad en Pipeline
              </h4>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createOpportunity}
                  onChange={(e) => setCreateOpportunity(e.target.checked)}
                  className="rounded accent-yellow-400 h-4 w-4"
                />
                Crear Oportunidad
              </label>
            </div>

            {createOpportunity && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Título del Proyecto / Oportunidad</label>
                  <input
                    type="text"
                    required
                    value={opportunityTitle}
                    onChange={(e) => setOpportunityTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Valor Estimado ($ MXN)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="number"
                        required
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">Fecha Estimada de Cierre</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="date"
                        required
                        value={expectedCloseDate}
                        onChange={(e) => setExpectedCloseDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded border border-slate-800 bg-slate-900/40 p-2.5 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    La oportunidad ingresará en etapa <b>INFORMACIÓN</b> (probabilidad inicial 25%) asignada a{' '}
                    <b>{lead.salespersonName}</b> con análisis automático de CONSCORE AI.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
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
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md"
            >
              <Check className="h-4 w-4" />
              Confirmar y Convertir Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
