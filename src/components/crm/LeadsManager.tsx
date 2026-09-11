import React, { useState } from 'react';
import {
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  MapPin,
  Tag,
  DollarSign,
  ArrowRight,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, LeadStatus, LeadSource } from '../../types/erp';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { LeadModal } from './LeadModal';
import { ConvertLeadModal } from './ConvertLeadModal';
import { AIDraftModal } from './AIDraftModal';

interface LeadsManagerProps {
  onOpenCustomer?: (customerId: string) => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({ onOpenCustomer }) => {
  const { leads, updateLead, checkCustomerDuplicates } = useERP();
  const { currentUser, can } = useAuth();

  const isPrivileged = currentUser?.role && ['ADMIN', 'ADMINISTRADOR', 'GERENTE_VENTAS', 'DIRECTOR_COMERCIAL', 'DIRECTOR'].includes(currentUser.role);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [sourceFilter, setSourceFilter] = useState<string>('TODOS');
  const [repFilter, setRepFilter] = useState<string>('TODOS');

  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [aiDraftTarget, setAiDraftTarget] = useState<Lead | null>(null);

  // Scope leads according to RLS
  const accessibleLeads = isPrivileged
    ? leads
    : CommercialRLSService.scopeLeads(leads, currentUser);

  // Filter leads
  const filteredLeads = accessibleLeads.filter((lead) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      (lead.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || '').includes(searchTerm) ||
      (lead.email && (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'TODOS' || lead.status === statusFilter;
    const matchSource = sourceFilter === 'TODOS' || lead.source === sourceFilter;
    const matchRep = repFilter === 'TODOS' || lead.salespersonId === repFilter;

    return matchSearch && matchStatus && matchSource && matchRep;
  });

  // Distinct reps from accessible leads
  const distinctReps: Array<{ id: string; name: string }> = Array.from(
    new Set(accessibleLeads.map((l) => JSON.stringify({ id: l.salespersonId, name: l.salespersonName })))
  ).map((s) => JSON.parse(s as string));

  // Status badges
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NUEVO':
        return <span className="rounded-full bg-blue-900/60 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-700">NUEVO</span>;
      case 'CONTACTADO':
        return <span className="rounded-full bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-700">CONTACTADO</span>;
      case 'CALIFICADO':
        return <span className="rounded-full bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-700">CALIFICADO</span>;
      case 'CONVERTIDO':
        return <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700">CONVERTIDO</span>;
      case 'DESCARTADO':
        return <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">DESCARTADO</span>;
      default:
        return <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Search box */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por empresa, contacto o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
          >
            <option value="TODOS">Todos los Estatus ({leads.length})</option>
            <option value="NUEVO">Nuevos</option>
            <option value="CONTACTADO">Contactados</option>
            <option value="CALIFICADO">Calificados</option>
            <option value="CONVERTIDO">Convertidos</option>
            <option value="DESCARTADO">Descartados</option>
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
          >
            <option value="TODOS">Todos los Orígenes</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SITIO_WEB">Sitio Web</option>
            <option value="LLAMADA">Llamada</option>
            <option value="EXPO">Expo</option>
            <option value="REFERIDO">Referido</option>
            <option value="CAMPAÑA_DIGITAL">Campaña Ads</option>
          </select>

          {/* Rep filter (only for privileged roles) */}
          {isPrivileged && (
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
            >
              <option value="TODOS">Todos los Vendedores</option>
              {distinctReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Empresa / Contacto</th>
                <th className="px-4 py-3">Canal & Ubicación</th>
                <th className="px-4 py-3">Interés Técnico</th>
                <th className="px-4 py-3 text-right">Monto Estimado</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3 text-center">Estatus</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                    No se encontraron leads con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const duplicates = checkCustomerDuplicates({
                    phone: lead.phone,
                    email: lead.email,
                    companyName: lead.company,
                  });
                  const hasDuplicates = duplicates.length > 0 && lead.status !== 'CONVERTIDO';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Empresa y Contacto */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <div>
                            <span className="font-bold text-white text-sm block">{lead.company}</span>
                            <span className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                              👤 {lead.name}
                            </span>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-500" />
                                {lead.phone}
                              </span>
                              {lead.email && (
                                <span className="flex items-center gap-1 truncate max-w-[160px]">
                                  <Mail className="h-3 w-3 text-slate-500" />
                                  {lead.email}
                                </span>
                              )}
                            </div>
                            {hasDuplicates && (
                              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                                <AlertTriangle className="h-3 w-3" /> Posible cliente existente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Canal & Ciudad */}
                      <td className="px-4 py-3.5">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {lead.source}
                        </span>
                        <div className="mt-1 flex items-center gap-1 text-slate-400 text-[11px]">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {lead.city || 'México'}
                        </div>
                      </td>

                      {/* Interés Técnico */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <span className="font-medium text-slate-200 block truncate" title={lead.productInterest}>
                          {lead.productInterest || 'General / Aislamiento'}
                        </span>
                        {lead.notes && (
                          <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{lead.notes}</span>
                        )}
                      </td>

                      {/* Monto Estimado */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-bold text-emerald-400 text-sm">
                          ${(lead.estimatedValue || 0).toLocaleString('es-MX')}
                        </span>
                        <span className="block text-[10px] text-slate-500">MXN</span>
                      </td>

                      {/* Vendedor */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-200 block">{lead.salespersonName}</span>
                        <span className="text-[10px] text-slate-500">
                          Reg: {lead.createdAt?.slice(0, 10) || '2026-08-25'}
                        </span>
                      </td>

                      {/* Estatus */}
                      <td className="px-4 py-3.5 text-center">
                        {getStatusBadge(lead.status)}
                        {lead.convertedCustomerId && (
                          <span className="block text-[10px] text-emerald-400 mt-1 font-mono">
                            Cliente Creado
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* AI Follow-up draft */}
                          <button
                            onClick={() => setAiDraftTarget(lead)}
                            title="Generar mensaje con CONSCORE AI"
                            className="rounded p-1.5 text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>

                          {/* WhatsApp Direct */}
                          <button
                            onClick={() => {
                              const clean = lead.phone.replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/${clean.startsWith('52') ? clean : '52' + clean}`, '_blank');
                            }}
                            title="Abrir WhatsApp"
                            className="rounded p-1.5 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingLead(lead)}
                            title="Editar Lead"
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* View Customer link if customer is linked/created */}
                          {lead.convertedCustomerId && (
                            <button
                              onClick={() => onOpenCustomer && onOpenCustomer(lead.convertedCustomerId!)}
                              title="Ver expediente en Clientes 360°"
                              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              Ver Cliente
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isNewLeadOpen && <LeadModal isOpen={isNewLeadOpen} onClose={() => setIsNewLeadOpen(false)} />}
      {editingLead && <LeadModal isOpen={!!editingLead} leadToEdit={editingLead} onClose={() => setEditingLead(null)} />}
      {convertingLead && (
        <ConvertLeadModal
          isOpen={!!convertingLead}
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
        />
      )}
      {aiDraftTarget && (
        <AIDraftModal
          isOpen={!!aiDraftTarget}
          target={{ lead: aiDraftTarget, defaultChannel: 'WHATSAPP' }}
          onClose={() => setAiDraftTarget(null)}
        />
      )}
    </div>
  );
};
