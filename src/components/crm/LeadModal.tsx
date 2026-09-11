import React, { useState } from 'react';
import { UserPlus, Building2, Phone, Mail, MapPin, Tag, DollarSign, AlertTriangle, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, LeadSource, LeadStatus } from '../../types/erp';
import { INITIAL_SALES_REPS } from '../../data/initialCRMData';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, leadToEdit }) => {
  const { addLead, updateLead, checkCustomerDuplicates } = useERP();
  const { currentUser } = useAuth();

  const isPrivileged = currentUser?.role && ['ADMIN', 'ADMINISTRADOR', 'GERENTE_VENTAS', 'DIRECTOR_COMERCIAL', 'DIRECTOR'].includes(currentUser.role);

  const [formData, setFormData] = useState({
    name: leadToEdit?.name || '',
    company: leadToEdit?.company || '',
    phone: leadToEdit?.phone || '',
    email: leadToEdit?.email || '',
    city: leadToEdit?.city || '',
    state: leadToEdit?.state || 'México',
    source: (leadToEdit?.source || 'WHATSAPP') as LeadSource,
    productInterest: leadToEdit?.productInterest || 'Lana Mineral & Fibra de Vidrio',
    estimatedValue: leadToEdit?.estimatedValue || 150000,
    salespersonId: leadToEdit?.salespersonId || currentUser?.id || 'USR-VEND-01',
    salespersonName: leadToEdit?.salespersonName || currentUser?.name || 'Arq. Mariana Ruiz Peña',
    salesExecutiveId: (leadToEdit as any)?.salesExecutiveId || currentUser?.salesExecutiveId || 'VENDEDOR_01',
    status: (leadToEdit?.status || 'NUEVO') as LeadStatus,
    notes: leadToEdit?.notes || '',
  });

  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePhoneOrEmailChange = (field: 'phone' | 'email' | 'company', val: string) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);

    const matches = checkCustomerDuplicates({
      phone: updated.phone,
      email: updated.email,
      companyName: updated.company,
    });
    setDuplicates(matches);
  };

  const handleRepChange = (repId: string) => {
    if (!isPrivileged) return;
    const rep = INITIAL_SALES_REPS.find((r) => r.id === repId);
    setFormData({
      ...formData,
      salespersonId: repId,
      salespersonName: rep?.name || 'Ejecutivo de Ventas',
      salesExecutiveId: rep?.salesExecutiveId || 'VENDEDOR_01',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name || !formData.company || !formData.phone) {
      alert('Por favor complete los campos obligatorios: Nombre, Empresa y Teléfono.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        salespersonId: isPrivileged ? formData.salespersonId : (currentUser?.id || 'USR-VEND-01'),
        salespersonName: isPrivileged ? formData.salespersonName : (currentUser?.name || 'Ejecutivo de Ventas'),
        salesExecutiveId: isPrivileged ? formData.salesExecutiveId : (currentUser?.salesExecutiveId || 'VENDEDOR_01'),
      };

      if (leadToEdit) {
        updateLead(leadToEdit.id, payload);
      } else {
        addLead(payload);
      }
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Error al registrar prospecto.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-slate-950 shadow-md">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {leadToEdit ? 'Editar Prospecto / Lead' : 'Registrar Nuevo Prospecto & Cliente'}
              </h3>
              <p className="text-xs text-slate-400">Captura de prospecto con alta automática en Clientes 360°</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Duplicate warning banner */}
        {duplicates.length > 0 && (
          <div className="flex items-start gap-3 border-b border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-300">
                ¡Posible duplicado detectado! ({duplicates.length} coincidencia(s))
              </span>
              <p className="mt-0.5 text-amber-200/90">
                {isPrivileged
                  ? `Ya existe un cliente con datos similares: ${duplicates.map((d) => `"${d.businessName || d.companyName}" (${d.phone || d.email})`).join(', ')}.`
                  : 'Se detectaron coincidencias de teléfono, correo o razón social con un registro existente en el sistema. Por políticas de privacidad y segregación comercial, los datos de otras carteras están protegidos.'}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 p-6 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empresa */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Empresa / Razón Social <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Termoaislantes del Norte S.A."
                  value={formData.company}
                  onChange={(e) => handlePhoneOrEmailChange('company', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Contact Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Nombre del Contacto <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Carlos Salinas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Teléfono / WhatsApp <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="tel"
                  required
                  placeholder="Ej. 55 5872 9400"
                  value={formData.phone}
                  onChange={(e) => handlePhoneOrEmailChange('phone', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={formData.email}
                  onChange={(e) => handlePhoneOrEmailChange('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* City & State */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Ciudad</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ej. Querétaro, Monterrey, CDMX"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Origen / Canal del Lead</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
              >
                <option value="WHATSAPP">WhatsApp Directo</option>
                <option value="SITIO_WEB">Sitio Web / Formulario</option>
                <option value="LLAMADA">Llamada Entrante</option>
                <option value="EXPO">Expo / Evento Industrial</option>
                <option value="REFERIDO">Referido por Cliente</option>
                <option value="CAMPAÑA_DIGITAL">Campaña Digital (Ads)</option>
                <option value="OTRO">Otro Canal</option>
              </select>
            </div>

            {/* Product Interest */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Interés Técnico / Línea</label>
              <input
                type="text"
                placeholder="Ej. Lana mineral 2 pulg, chaqueta aluminio..."
                value={formData.productInterest}
                onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            {/* Estimated Value */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Monto Estimado ($ MXN)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  step="1000"
                  placeholder="150000"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Assigned Salesperson */}
            {isPrivileged ? (
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-300">Vendedor Asignado</label>
                <select
                  value={formData.salespersonId}
                  onChange={(e) => handleRepChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
                >
                  {INITIAL_SALES_REPS.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} {rep.department ? `— ${rep.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-300">Vendedor Asignado</label>
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{currentUser?.name || 'Ejecutivo de Ventas'}</span>
                    <span className="rounded bg-yellow-400/20 px-2 py-0.5 text-[10px] font-extrabold text-yellow-300 border border-yellow-400/30">
                      {currentUser?.salesExecutiveId || 'VENDEDOR_01'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Asignación automática (Segregación RLS)</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-300">Notas de Prospección / Requerimientos</label>
              <textarea
                rows={3}
                placeholder="Detalles sobre especificaciones de obra, metros lineales, espesores, fechas de entrega requeridas..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
              />
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
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <Check className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : (leadToEdit ? 'Guardar Cambios' : 'Registrar y Crear Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
