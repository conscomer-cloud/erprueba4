import React, { useState, useMemo } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  Briefcase,
  Receipt,
  ShoppingBag,
  Clock,
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Calendar,
  Lock,
  Headset,
  ArrowUpRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { Customer, Opportunity, Quote, Order } from '../../types/erp';
import { OpportunityModal } from './OpportunityModal';
import { FollowUpModal } from './FollowUpModal';
import { ActivityModal } from './ActivityModal';
import { AIDraftModal } from './AIDraftModal';

interface Client360ViewProps {
  initialCustomerId?: string | null;
  onNavigate?: (module: string) => void;
}

export const Client360View: React.FC<Client360ViewProps> = ({ initialCustomerId, onNavigate }) => {
  const { currentUser } = useAuth();
  const {
    customers,
    allCustomers,
    opportunities,
    quotes,
    orders,
    activities,
    followUps,
    serviceTickets,
    addAuditLog,
  } = useERP();

  const isPrivileged = CommercialRLSService.isPrivilegedRole(currentUser?.role);

  // Check if requested initialCustomerId exists in global catalog but is foreign to this vendor
  const requestedCustomer = initialCustomerId
    ? (allCustomers || customers).find((c) => c.id === initialCustomerId)
    : null;

  const isAccessDeniedToRequested = requestedCustomer
    ? !CommercialRLSService.validateAccess(currentUser, 'CUSTOMER', requestedCustomer, 'READ').allowed
    : false;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    isAccessDeniedToRequested ? '' : (initialCustomerId || (customers[0]?.id ?? ''))
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [aiDraftTarget, setAiDraftTarget] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      (c.businessName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.rfc || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rawSelectedCustomer = customers.find((c) => c.id === selectedCustomerId) || (isAccessDeniedToRequested ? null : customers[0]);

  // Sanitize selected customer
  const selectedCustomer = useMemo(() => {
    if (!rawSelectedCustomer) return null;
    return CommercialRLSService.sanitizeCustomer(rawSelectedCustomer, currentUser);
  }, [rawSelectedCustomer, currentUser]);

  // Associated data for selected customer with subordinated RLS filtering
  const customerOpps = useMemo(() => {
    if (!selectedCustomer) return [];
    const opps = opportunities.filter((o) => o.customerId === selectedCustomer.id);
    return isPrivileged ? opps : CommercialRLSService.scopeOpportunities(opps, currentUser);
  }, [opportunities, selectedCustomer, isPrivileged, currentUser]);

  const customerQuotes = useMemo(() => {
    if (!selectedCustomer) return [];
    const qus = quotes.filter((q) => q.customerId === selectedCustomer.id);
    return isPrivileged ? qus : CommercialRLSService.scopeQuotes(qus, currentUser);
  }, [quotes, selectedCustomer, isPrivileged, currentUser]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const ords = orders.filter((ord) => ord.customerId === selectedCustomer.id);
    return isPrivileged ? ords : CommercialRLSService.scopeOrders(ords, currentUser);
  }, [orders, selectedCustomer, isPrivileged, currentUser]);

  const customerActivities = useMemo(() => {
    if (!selectedCustomer) return [];
    return activities.filter((a) => a.customerId === selectedCustomer.id);
  }, [activities, selectedCustomer]);

  const customerFollowUps = useMemo(() => {
    if (!selectedCustomer) return [];
    const fus = followUps.filter((f) => f.customerId === selectedCustomer.id);
    return isPrivileged ? fus : CommercialRLSService.scopeFollowUps(fus, currentUser);
  }, [followUps, selectedCustomer, isPrivileged, currentUser]);

  const customerCases = useMemo(() => {
    if (!selectedCustomer) return [];
    const cases = (serviceTickets || []).filter(
      (t) =>
        t.customerId === selectedCustomer.id ||
        t.customerId === selectedCustomer.code ||
        (t.customerName && selectedCustomer.businessName && t.customerName.toLowerCase() === selectedCustomer.businessName.toLowerCase())
    );
    return isPrivileged ? cases : CommercialRLSService.scopeCases(cases, currentUser, customers);
  }, [serviceTickets, selectedCustomer, isPrivileged, currentUser, customers]);

  const totalPurchased = customerOrders
    .filter((o) => o.status !== 'CANCELADO')
    .reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Expediente 360° de Clientes</h2>
            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-500/30">
              CARTERA COMERCIAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dossier integral: información crediticia, contactos, oportunidades activas, historial de compras y bitácora
          </p>
        </div>

        {selectedCustomer && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiDraftTarget(selectedCustomer)}
              className="flex items-center gap-1.5 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-300 hover:bg-yellow-400/20 transition-all shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Redactar con IA
            </button>

            <button
              onClick={() => setIsFollowUpModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Clock className="h-4 w-4 text-slate-400" />
              + Tarea
            </button>

            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Phone className="h-4 w-4 text-emerald-400" />
              + Bitácora
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Customer Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar cliente, RFC o plaza..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredCustomers.map((customer) => {
              const isSelected = customer.id === selectedCustomer?.id;
              const openOpps = opportunities.filter(
                (o) => o.customerId === customer.id && o.stage !== 'LOGRADO_CON_EXITO' && o.stage !== 'NO_CONTESTO'
              ).length;

              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-yellow-400 bg-slate-900 shadow-md ring-1 ring-yellow-400/20'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-yellow-400">{customer.code}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                      {customer.state || 'Nacional'}
                    </span>
                  </div>

                  <h4 className="mt-1 text-xs font-bold text-white line-clamp-1">{customer.businessName}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    👤 {customer.contactName || 'Contacto Principal'}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                    <span className="text-slate-400">Límite: ${(Number(customer.creditLimit) || 0).toLocaleString('es-MX')}</span>
                    {openOpps > 0 && (
                      <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-400/30">
                        {openOpps} opps activas
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: 360 Degree Dossier */}
        {selectedCustomer ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Main Dossier Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-yellow-400">{selectedCustomer.code}</span>
                    <span className="rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      CLIENTE ACTIVO
                    </span>
                    {(selectedCustomer.originLeadId || selectedCustomer.leadId) && (
                      <span
                        className="rounded-full bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 text-[10px] font-semibold text-blue-300"
                        title={`Generado desde prospecto ${selectedCustomer.originLeadId || selectedCustomer.leadId}`}
                      >
                        Origen: {selectedCustomer.leadSource || selectedCustomer.acquisitionChannel || 'Prospecto'} ({selectedCustomer.originLeadId || selectedCustomer.leadId})
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-lg font-black text-white">{selectedCustomer.businessName}</h3>
                  <p className="text-xs text-slate-400">RFC: {selectedCustomer.rfc}</p>
                </div>

                {/* WhatsApp button */}
                <button
                  onClick={() => {
                    const phone = (selectedCustomer.phone || '').replace(/[^0-9]/g, '');
                    window.open(`https://wa.me/${phone.startsWith('52') ? phone : '52' + phone}`, '_blank');
                  }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp Directo
                </button>
              </div>

              {/* Grid with Fiscal, Commercial & Credit data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contacto</span>
                  <p className="text-xs font-bold text-white">{selectedCustomer.contactName || 'No registrado'}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-slate-500" />
                    {selectedCustomer.phone}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ubicación</span>
                  <p className="text-xs font-bold text-white">{selectedCustomer.city}, {selectedCustomer.state}</p>
                  <p className="text-xs text-slate-400 truncate" title={selectedCustomer.address}>
                    {selectedCustomer.address}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Línea de Crédito</span>
                  <p className="text-xs font-bold text-emerald-400">
                    ${(Number(selectedCustomer.creditLimit) || 0).toLocaleString('es-MX')} MXN
                  </p>
                  <p className="text-[11px] text-slate-400">Plazo: {selectedCustomer.creditDays} días</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Histórico de Compras</span>
                  <p className="text-xs font-bold text-yellow-400">${(Number(totalPurchased) || 0).toLocaleString('es-MX')} MXN</p>
                  <p className="text-[11px] text-slate-400">{customerOrders.length} pedido(s) surtidos</p>
                </div>
              </div>
            </div>

            {/* Active Opportunities Section */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-yellow-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Oportunidades en Pipeline ({customerOpps.length})
                  </h4>
                </div>
                <button
                  onClick={() => setIsOppModalOpen(true)}
                  className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Nueva
                </button>
              </div>

              {customerOpps.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No hay oportunidades registradas para este cliente.</p>
              ) : (
                <div className="space-y-2">
                  {customerOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-yellow-400">{opp.folio}</span>
                          <span className="font-bold text-white">{opp.title}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Etapa: <b className="text-slate-200">{opp.stage}</b></span>
                          <span>Probabilidad: <b className="text-yellow-400">{opp.probability}%</b></span>
                          <span>Cierre estimado: {opp.expectedCloseDate}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-emerald-400 text-sm">
                          ${(Number(opp.estimatedValue) || 0).toLocaleString('es-MX')} MXN
                        </span>
                        <span className="block text-[10px] text-slate-500">Ejecutivo: {opp.salespersonName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quotations & Orders Tabs in Dossier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cotizaciones */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-blue-400" />
                    Cotizaciones ({customerQuotes.length})
                  </span>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('COTIZACIONES')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
                    >
                      Ir a Cotizaciones <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {customerQuotes.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">Sin cotizaciones registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {customerQuotes.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-mono font-bold text-blue-400">{q.folio}</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            Fecha: {q.date} · Vigencia: {q.validUntil}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white block">${(Number(q.total) || 0).toLocaleString('es-MX')}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              q.status === 'APROBADA'
                                ? 'bg-emerald-950 text-emerald-300'
                                : q.status === 'RECHAZADA'
                                ? 'bg-red-950 text-red-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pedidos */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-emerald-400" />
                    Pedidos & Suministros ({customerOrders.length})
                  </span>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('PEDIDOS')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                    >
                      Ir a Pedidos <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">Sin pedidos registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-mono font-bold text-emerald-400">{ord.folio}</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            Fecha: {ord.date} · Ref: {ord.quoteFolio || 'Directo'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white block">${(Number(ord.total) || 0).toLocaleString('es-MX')}</span>
                          <span className="rounded bg-emerald-950 border border-emerald-800/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Interaction Log / Bitácora for this client */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Historial de Interacciones & Seguimientos ({customerActivities.length})
                  </h4>
                </div>
                <button
                  onClick={() => setIsActivityModalOpen(true)}
                  className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Registrar Interacción
                </button>
              </div>

              {customerActivities.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No hay llamadas o acuerdos registrados aún.</p>
              ) : (
                <div className="space-y-2.5">
                  {customerActivities.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-bold text-yellow-400 uppercase">{act.type}</span>
                        <span>{new Date(act.date).toLocaleString('es-MX')} · {act.salespersonName}</span>
                      </div>
                      <p className="text-slate-200">{act.result}</p>
                      {act.nextAction && (
                        <p className="text-[11px] text-emerald-400 font-semibold">
                          ↳ Siguiente: {act.nextAction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Service Cases Section (Observación 17 & Requirement #19) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Headset className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Casos de Servicio al Cliente & Soporte ({customerCases.length})
                  </h4>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('SERVICIO')}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    Ver en Servicio <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {customerCases.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No hay tickets de servicio ni reclamos registrados para este cliente.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {customerCases.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">{c.ticketNumber || c.folio}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.priority === 'CRITICA' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            c.priority === 'ALTA' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {c.priority}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'RESUELTO' || c.status === 'CERRADO' ? 'bg-emerald-950 text-emerald-300' :
                          c.status === 'EN_PROCESO' ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="font-bold text-white text-xs">{c.title || c.subject}</p>
                      {c.description && <p className="text-slate-400 text-[11px] line-clamp-2">{c.description}</p>}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        <span>Canal: {c.channel || 'DIRECTO'}</span>
                        <span>Registrado: {new Date(c.createdAt).toLocaleDateString('es-MX')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : isAccessDeniedToRequested ? (
          <div className="lg:col-span-8 flex flex-col items-center justify-center rounded-xl border border-red-900/60 bg-red-950/30 p-8 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-900/40 text-red-400 border border-red-700/50">
              <Lock className="h-7 w-7" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-sm font-bold text-red-300 uppercase tracking-wide">
                403 Acceso Denegado (Aislamiento RLS Ejecutivo Comercial)
              </h3>
              <p className="text-xs text-red-200/90 leading-relaxed">
                El expediente del cliente solicitado no pertenece a tu cartera asignada.
                Por política de confidencialidad y segregación comercial, cada ejecutivo puede consultar únicamente su propia cartera de clientes, cotizaciones y pedidos.
              </p>
              <p className="text-[11px] text-slate-400">
                Para transferir o atender este expediente, solicita la reasignación formal a través de la Gerencia Comercial.
              </p>
            </div>
            {customers.length > 0 && (
              <button
                onClick={() => setSelectedCustomerId(customers[0].id)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
              >
                Volver a mi cartera comercial ({customers[0].businessName})
              </button>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 text-xs">
            Selecciona un cliente de la lista lateral para ver su expediente 360°.
          </div>
        )}
      </div>

      {/* Modals */}
      {isOppModalOpen && (
        <OpportunityModal
          isOpen={isOppModalOpen}
          defaultCustomerId={selectedCustomer?.id}
          onClose={() => setIsOppModalOpen(false)}
        />
      )}

      {isFollowUpModalOpen && (
        <FollowUpModal
          isOpen={isFollowUpModalOpen}
          defaultCustomerId={selectedCustomer?.id}
          onClose={() => setIsFollowUpModalOpen(false)}
        />
      )}

      {isActivityModalOpen && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          defaultCustomerId={selectedCustomer?.id}
          onClose={() => setIsActivityModalOpen(false)}
        />
      )}

      {aiDraftTarget && (
        <AIDraftModal
          isOpen={!!aiDraftTarget}
          target={{ customer: aiDraftTarget, defaultChannel: 'WHATSAPP' }}
          onClose={() => setAiDraftTarget(null)}
        />
      )}
    </div>
  );
};
