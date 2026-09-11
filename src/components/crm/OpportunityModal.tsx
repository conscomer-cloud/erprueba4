import React, { useState, useMemo } from 'react';
import { Briefcase, Building2, DollarSign, Calendar, Tag, Bot, Sparkles, Check, X, UserCheck, Lock, ShieldAlert } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Opportunity } from '../../types/erp';
import { INITIAL_SALES_REPS } from '../../data/initialCRMData';
import { CommercialRLSService } from '../../services/commercialRLSService';

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityToEdit?: Opportunity | null;
  defaultCustomerId?: string;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  isOpen,
  onClose,
  opportunityToEdit,
  defaultCustomerId,
}) => {
  const { customers, pipelineStages, addOpportunity, updateOpportunity } = useERP();
  const { currentUser } = useAuth();

  const isVendor = currentUser?.role === 'VENDEDOR';
  const myExecId = CommercialRLSService.resolveSalesExecutiveId(currentUser);

  // Filter customers according to RLS: vendors only see their own assigned customers
  const availableCustomers = useMemo(() => {
    if (isVendor) {
      return CommercialRLSService.scopeCustomers(customers, currentUser);
    }
    return customers;
  }, [customers, currentUser, isVendor]);

  // Initial customer resolution with RLS validation
  const initialCustomerId = useMemo(() => {
    if (opportunityToEdit?.customerId) {
      return opportunityToEdit.customerId;
    }
    if (defaultCustomerId) {
      if (isVendor) {
        const found = availableCustomers.find((c) => c.id === defaultCustomerId);
        if (found) return defaultCustomerId;
      } else {
        return defaultCustomerId;
      }
    }
    return availableCustomers[0]?.id || '';
  }, [opportunityToEdit, defaultCustomerId, availableCustomers, isVendor]);

  const [formData, setFormData] = useState({
    customerId: initialCustomerId,
    title: opportunityToEdit?.title || '',
    estimatedValue: opportunityToEdit?.estimatedValue || 180000,
    probability: opportunityToEdit?.probability || 25,
    expectedCloseDate:
      opportunityToEdit?.expectedCloseDate ||
      new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    stage: opportunityToEdit?.stage || 'CONTACTO_INICIAL',
    source: opportunityToEdit?.source || 'WHATSAPP',
    salespersonId: isVendor
      ? (currentUser?.id || 'USR-004')
      : (opportunityToEdit?.salespersonId || currentUser?.id || 'USR-004'),
    notes: opportunityToEdit?.notes || '',
  });

  if (!isOpen) return null;

  // Security Check: If a vendor attempts to edit an opportunity belonging to someone else
  if (isVendor && opportunityToEdit) {
    const oppAccess = CommercialRLSService.assertOpportunityOwnership(currentUser, opportunityToEdit, 'UPDATE');
    if (!oppAccess.allowed) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col rounded-xl border border-red-500/40 bg-slate-900 p-6 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold">Acceso Denegado (403 RLS)</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Esta oportunidad comercial pertenece a otro ejecutivo de ventas. De acuerdo a la política de Segregación Comercial CONSCORE, no tienes autorización para consultar ni editar expedientes ajenos.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      );
    }
  }

  const handleStageChange = (stageCode: string) => {
    const stageInfo = pipelineStages.find((s) => s.code === stageCode);
    setFormData({
      ...formData,
      stage: stageCode,
      probability: stageInfo ? stageInfo.probability : formData.probability,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.customerId) {
      alert('Por favor complete el título de la oportunidad y seleccione un cliente.');
      return;
    }

    // Commercial RLS Ownership Verification
    if (isVendor) {
      const selectedCust = availableCustomers.find((c) => c.id === formData.customerId);
      if (!selectedCust) {
        alert('403 ACCESS_DENIED: El cliente seleccionado no pertenece a tu cartera comercial asignada.');
        return;
      }

      const custCheck = CommercialRLSService.assertCustomerOwnership(currentUser, selectedCust, 'WRITE');
      if (!custCheck.allowed) {
        alert(custCheck.error || '403 ACCESS_DENIED: No tienes autorización para crear oportunidades sobre este cliente.');
        return;
      }
    }

    const customer = availableCustomers.find((c) => c.id === formData.customerId) || customers.find((c) => c.id === formData.customerId);

    // Sales Executive determination: strictly enforced to current user for VENDEDOR
    const assignedSellerId = isVendor ? (currentUser?.id || 'USR-004') : formData.salespersonId;
    const rep = INITIAL_SALES_REPS.find((r) => r.id === assignedSellerId);
    const assignedSellerName = isVendor ? (currentUser?.name || 'Ejecutivo Comercial') : (rep?.name || currentUser?.name || 'Vendedor Comercial');
    const assignedExecId = isVendor
      ? myExecId
      : (CommercialRLSService.resolveSalesExecutiveId({ id: assignedSellerId, name: assignedSellerName }) || myExecId);

    const payload = {
      ...formData,
      customerId: formData.customerId,
      customerName: customer?.businessName || 'Cliente Industrial',
      salespersonId: assignedSellerId,
      salespersonName: assignedSellerName,
      salesExecutiveId: assignedExecId,
      sales_executive_id: assignedExecId,
    };

    try {
      if (opportunityToEdit) {
        updateOpportunity(opportunityToEdit.id, payload);
      } else {
        addOpportunity(payload);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la oportunidad');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 shadow-md">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {opportunityToEdit ? `Editar Oportunidad ${opportunityToEdit.folio}` : 'Nueva Oportunidad de Venta'}
              </h3>
              <p className="text-xs text-slate-400">
                {isVendor
                  ? `Gestión de Oportunidad Comercial • ${currentUser?.name || 'Ejecutivo de Ventas'}`
                  : 'Pipeline comercial y proyección técnica CONSCORE'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 p-6 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Cliente Comercial <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {availableCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.businessName} ({c.city})
                    </option>
                  ))}
                </select>
              </div>
              {isVendor && availableCustomers.length === 0 && (
                <p className="mt-1 text-[11px] text-amber-400">
                  No tienes clientes asignados a tu cartera comercial. Para crear una oportunidad, primero debes registrar o tener asignado un cliente.
                </p>
              )}
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Título del Proyecto / Oportunidad <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Suministro Lana Mineral para Nave Industrial Querétaro"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            {/* Estimated Value */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Monto Estimado ($ MXN) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  step="1000"
                  required
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Close Date */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Fecha Estimada de Cierre <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Stage */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Etapa en Pipeline</label>
              <select
                value={formData.stage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                {pipelineStages.map((stage) => (
                  <option key={stage.code} value={stage.code}>
                    {stage.name} ({stage.probability}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Probability slider */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Probabilidad de Cierre</label>
                <span className="text-xs font-bold text-yellow-400">{formData.probability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value, 10) })}
                className="w-full accent-yellow-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Salesperson Assignment */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Ejecutivo Asignado <span className="text-red-400">*</span>
              </label>
              {isVendor ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-200">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-white">{currentUser?.name || 'Ejecutivo Actual'}</span>
                    <span className="ml-2 inline-block text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Asignación automática
                    </span>
                  </div>
                  <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" title="Asignación protegida por política comercial" />
                </div>
              ) : (
                <select
                  value={formData.salespersonId}
                  onChange={(e) => setFormData({ ...formData, salespersonId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                >
                  {INITIAL_SALES_REPS.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Source */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Canal de Origen</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SITIO_WEB">Sitio Web</option>
                <option value="LLAMADA">Llamada</option>
                <option value="EXPO">Expo Industrial</option>
                <option value="REFERIDO">Referido</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-300">Notas / Alcance Técnico</label>
              <textarea
                rows={3}
                placeholder="Especificaciones técnicas, marcas requeridas, tipo de recubrimiento, requerimientos de entrega en sitio..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>

          {/* AI Banner */}
          <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 flex items-start gap-2.5 text-xs text-slate-300">
            <Bot className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-yellow-300">Análisis Predictivo de CONSCORE AI</span>
              <p className="mt-0.5 text-slate-400">
                Al guardar, la IA evaluará automáticamente el historial del cliente, el valor ponderado y los días sin contacto para alertar de riesgos de cierre.
              </p>
            </div>
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
              {opportunityToEdit ? 'Guardar Cambios' : 'Crear Oportunidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
