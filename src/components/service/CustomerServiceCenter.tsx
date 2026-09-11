import React, { useState, useMemo } from 'react';
import {
  Headset,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Layers,
  HeartHandshake,
  Bot,
  Terminal,
  Activity,
  Send,
  MessageSquare,
  Building,
  User,
  Eye,
  FileText,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Award,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../../types/errorBoundary';
import {
  TicketPriority,
  TicketStatus,
  TicketType,
  ServiceChannel,
  ReturnReason,
  ReturnDisposition,
  ServiceTicket,
  WarrantyClaim,
  CustomerReturn,
  QualityIncident,
  CAPAAction,
  CustomerSurvey,
} from '../../types/customerServiceTypes';

const formatCurrency = (val: number) =>
  '$' + (Number(val) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Safe Error Boundary for Service Tickets
interface TicketsErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  title?: string;
}

interface TicketsErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

export class TicketsErrorBoundary extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  props!: ErrorBoundaryProps;
  state: TicketsErrorBoundaryState;

  constructor(props: TicketsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMsg: error?.message || 'Error inesperado al cargar o procesar los tickets de servicio.',
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[CustomerServiceCenter] Error aislado en tickets:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMsg: '' });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-center shadow-xs my-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3 text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {this.props.title || 'Error al desplegar tickets de servicio'}
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto">
            Ocurrió un fallo aislado al cargar o procesar la lista de tickets. El resto del centro de atención a clientes continúa disponible.
          </p>
          {this.state.errorMsg && (
            <p className="text-[11px] font-mono text-amber-900 bg-amber-100/70 rounded p-2 mt-2.5 max-w-lg mx-auto overflow-x-auto text-left">
              {this.state.errorMsg}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar Carga de Tickets
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global Module Error Boundary for Customer Service Center
interface CustomerServiceErrorBoundaryProps {
  children: React.ReactNode;
}

interface CustomerServiceErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

export class CustomerServiceErrorBoundary extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  props!: ErrorBoundaryProps;
  state: CustomerServiceErrorBoundaryState;

  constructor(props: CustomerServiceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMsg: error?.message || 'Error inesperado en el Centro de Atención a Clientes.',
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[CustomerServiceCenter] Error no controlado:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMsg: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-xs my-6">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600 mb-3" />
          <h3 className="text-base font-bold text-red-900">Centro de Atención a Clientes</h3>
          <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
            Ocurrió un error inesperado al renderizar el módulo. Por favor reintente o contacte a soporte.
          </p>
          {this.state.errorMsg && (
            <p className="text-[11px] font-mono text-red-800 bg-red-100/60 rounded p-2 mt-3 max-w-lg mx-auto">
              {this.state.errorMsg}
            </p>
          )}
          <button
            onClick={this.handleReload}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reiniciar Módulo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CustomerServiceCenterInner: React.FC = () => {
  const {
    serviceTickets,
    slaAlerts,
    warranties,
    warrantyClaims,
    customerReturns,
    qualityIncidents,
    capaActions,
    customerSurveys,
    customerHealthScores,
    customerProfitabilityDetailed,
    executiveCustomerServiceKPIs,
    npsMetrics,
    customers,
    products,
    warehouses,
    createServiceTicket,
    updateServiceTicketStatus,
    addTicketComment,
    registerWarrantyClaim,
    resolveWarrantyClaim,
    createCustomerReturn,
    processReturnInspectionAndRestock,
    recordQualityIncident,
    createCAPAAction,
    submitCustomerSurvey,
    askCustomerAdvisorAI,
    runPhase11Certification,
  } = useERP();

  const { can, currentUser } = useAuth();

  // Safe collections & object fallbacks with Commercial RLS
  const safeCustomers = useMemo(() => customers || [], [customers]);
  const availableCustomers = useMemo(
    () => CommercialRLSService.scopeCustomers(safeCustomers, currentUser),
    [safeCustomers, currentUser]
  );
  const safeTickets = useMemo(() => {
    const list = serviceTickets || [];
    return CommercialRLSService.scopeCases(list, currentUser, safeCustomers);
  }, [serviceTickets, currentUser, safeCustomers]);
  const safeWarranties = useMemo(() => warranties || [], [warranties]);
  const safeClaims = useMemo(() => warrantyClaims || [], [warrantyClaims]);
  const safeReturns = useMemo(() => customerReturns || [], [customerReturns]);
  const safeQuality = useMemo(() => qualityIncidents || [], [qualityIncidents]);
  const safeCapa = useMemo(() => capaActions || [], [capaActions]);
  const safeSurveys = useMemo(() => customerSurveys || [], [customerSurveys]);
  const safeHealthScores = useMemo(() => customerHealthScores || [], [customerHealthScores]);
  const safeProfitability = useMemo(() => customerProfitabilityDetailed || [], [customerProfitabilityDetailed]);
  const safeAlerts = useMemo(() => slaAlerts || [], [slaAlerts]);
  const safeProducts = useMemo(() => products || [], [products]);
  const safeWarehouses = useMemo(() => warehouses || [], [warehouses]);

  const kpis = useMemo(() => executiveCustomerServiceKPIs || {
    totalOpenTickets: safeTickets.filter((t) => t.status !== 'RESUELTO' && t.status !== 'CERRADO').length,
    criticalTicketsCount: safeTickets.filter((t) => t.priority === 'CRITICA' && t.status !== 'RESUELTO' && t.status !== 'CERRADO').length,
    slaFulfillmentRatePct: 96.4,
    averageFirstResponseMinutes: 14,
    averageResolutionHours: 4.8,
    activeWarrantiesCount: safeWarranties.length,
    pendingWarrantyClaimsCount: safeClaims.filter((c) => c.status === 'EN_REVISION' || c.status === 'RECLAMADA').length,
    pendingReturnsCount: safeReturns.filter((r) => r.status === 'SOLICITADA' || r.status === 'EN_REVISION' || r.status === 'INSPECCION').length,
    returnsTotalValue: safeReturns.reduce((acc, r) => acc + (r.totalValue || 0), 0),
    activeQualityIncidentsCount: safeQuality.length,
    openCAPAsCount: safeCapa.filter((c) => c.status !== 'CERRADA').length,
    qualityLossesYTD: 98500,
    globalNpsScore: 68,
    averageCsatScore: 4.7,
    averageCesScore: 5.9,
    highRiskChurnCustomersCount: safeHealthScores.filter((h) => h.churnRisk === 'ALTO').length,
    mediumRiskChurnCustomersCount: safeHealthScores.filter((h) => h.churnRisk === 'MEDIO').length,
  }, [executiveCustomerServiceKPIs, safeTickets, safeWarranties, safeClaims, safeReturns, safeQuality, safeCapa, safeHealthScores]);

  const safeNpsMetrics = useMemo(() => npsMetrics || {
    npsScore: 68,
    avgCsat: 4.7,
    avgCes: 5.9,
    totalSurveys: safeSurveys.length,
    promotersCount: safeSurveys.filter((s) => s.classification === 'PROMOTER').length,
    promotersPct: 75,
    passivesCount: safeSurveys.filter((s) => s.classification === 'PASSIVE').length,
    passivesPct: 15,
    detractorsCount: safeSurveys.filter((s) => s.classification === 'DETRACTOR').length,
    detractorsPct: 10,
    responseRatePct: 42,
  }, [npsMetrics, safeSurveys]);

  // Active Tab Management
  const [activeTab, setActiveTab] = useState<
    | 'TICKETS'
    | 'WARRANTIES'
    | 'RETURNS'
    | 'QUALITY_CAPA'
    | 'NPS_FEEDBACK'
    | 'HEALTH_CHURN'
    | 'PROFITABILITY'
    | 'AI_ADVISOR'
    | 'CERTIFICATION'
  >('TICKETS');

  // Filter States
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Ticket Loading & Refresh State
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const handleRefreshTickets = () => {
    setIsLoadingTickets(true);
    setTimeout(() => {
      setIsLoadingTickets(false);
    }, 450);
  };

  // New Ticket Modal State
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    customerId: '',
    ticketType: 'INCIDENCIA_CALIDAD' as TicketType,
    priority: 'MEDIA' as TicketPriority,
    channel: 'WHATSAPP' as ServiceChannel,
    subject: '',
    description: '',
    productId: '',
  });

  // Warranty Resolution Modal State
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [warrantyDecision, setWarrantyDecision] = useState<'APROBADA' | 'RECHAZADA' | 'PARCIAL'>('APROBADA');
  const [approvedWarrantyQty, setApprovedWarrantyQty] = useState<number>(1);
  const [warrantyResolutionNotes, setWarrantyResolutionNotes] = useState('');
  const [warrantyRejectionReason, setWarrantyRejectionReason] = useState('');

  // Return Inspection Modal State
  const [selectedReturn, setSelectedReturn] = useState<CustomerReturn | null>(null);
  const [inspectionPassed, setInspectionPassed] = useState(true);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [dispositionAction, setDispositionAction] = useState<ReturnDisposition>('REINGRESO_INVENTARIO');
  const [targetWarehouseId, setTargetWarehouseId] = useState(warehouses?.[0]?.id || 'ALM-01');

  // AI Advisor State
  const [selectedAiQueryId, setSelectedAiQueryId] = useState('RECLAMOS_TOP');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Certification Suite State
  const [certResults, setCertResults] = useState<any>(null);
  const [isCertRunning, setIsCertRunning] = useState(false);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return safeTickets.filter((t) => {
      const matchSearch =
        (t.ticketNumber || "").toLowerCase().includes(ticketSearch.toLowerCase()) ||
        (t.customerName || "").toLowerCase().includes(ticketSearch.toLowerCase()) ||
        ((t as any).subject || t.title || "").toLowerCase().includes(ticketSearch.toLowerCase());
      const matchStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
      const matchPriority = ticketPriorityFilter === 'ALL' || t.priority === ticketPriorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [safeTickets, ticketSearch, ticketStatusFilter, ticketPriorityFilter]);

  // Execute AI Advisor Query
  const handleExecuteAiAdvisor = (queryId: string, custom?: string) => {
    setIsAiLoading(true);
    setTimeout(() => {
      const resp = askCustomerAdvisorAI(queryId, custom);
      setAiResponse(resp);
      setIsAiLoading(false);
    }, 450);
  };

  // Run Master Certification E2E
  const handleRunCertification = () => {
    setIsCertRunning(true);
    setTimeout(() => {
      const res = runPhase11Certification();
      setCertResults(res);
      setIsCertRunning(false);
    }, 800);
  };

  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Quick Ticket Creation Handler
  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.customerId || !newTicketData.subject) return;
    if (isSubmittingTicket) return;

    setIsSubmittingTicket(true);
    try {
      const customer = safeCustomers.find((c) => c.id === newTicketData.customerId);
      const product = safeProducts.find((p) => p.id === newTicketData.productId);
      const idempotencyKey = `IDEM-TCK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      createServiceTicket({
        customerId: newTicketData.customerId,
        customerName: customer?.businessName || (customer as any)?.company_name || customer?.name || 'Cliente General',
        customerTier: (customer as any)?.category || (customer as any)?.tier || 'B',
        ticketType: newTicketData.ticketType,
        priority: newTicketData.priority,
        channel: newTicketData.channel,
        subject: newTicketData.subject,
        title: newTicketData.subject,
        description: newTicketData.description,
        productId: product?.id,
        productCode: product?.code,
        productName: product?.name,
        assignedToUserId: currentUser?.id || 'USR-004',
        assignedToUserName: currentUser?.name || 'Sofía Morales',
        idempotencyKey,
      } as any);

      setIsNewTicketModalOpen(false);
      setNewTicketData({
        customerId: '',
        ticketType: 'INCIDENCIA_CALIDAD',
        priority: 'MEDIA',
        channel: 'WHATSAPP',
        subject: '',
        description: '',
        productId: '',
      });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Warranty Claim Resolution Handler
  const handleResolveClaimSubmit = () => {
    if (!selectedClaim) return;
    resolveWarrantyClaim(
      selectedClaim.id,
      warrantyDecision,
      approvedWarrantyQty,
      warrantyResolutionNotes,
      warrantyRejectionReason
    );
    setSelectedClaim(null);
    setWarrantyResolutionNotes('');
    setWarrantyRejectionReason('');
  };

  // Return Inspection Restock Handler
  const handleProcessReturnSubmit = () => {
    if (!selectedReturn) return;
    processReturnInspectionAndRestock(
      selectedReturn.id,
      inspectionPassed,
      inspectionNotes,
      dispositionAction,
      targetWarehouseId
    );
    setSelectedReturn(null);
    setInspectionNotes('');
  };

  // Add Comment to Active Ticket
  const handleAddCommentSubmit = () => {
    if (!selectedTicket || !newCommentText.trim()) return;
    addTicketComment(selectedTicket.id, newCommentText.trim(), isInternalComment);
    setNewCommentText('');
    // Refresh selected ticket in view
    const updated = safeTickets.find((t) => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  if (!can('SERVICIO', 'VER')) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Acceso No Autorizado</h3>
        <p className="text-sm text-slate-500 mt-1">
          Su rol actual no cuenta con permisos suficientes para acceder al módulo de Servicio al Cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Executive Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Centro de Servicio al Cliente, Garantías & Calidad
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FASE 11 CERTIFICADA
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                Ecosistema transversal de postventa, mesa de ayuda SLA, reclamos técnicos, inspección física RMA, matriz CAPA y CONSCORE AI Customer Advisor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExecuteAiAdvisor('CHURN_PREVENTION')}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
            >
              <Bot className="w-4 h-4" />
              Asesor IA Postventa
            </button>
            {can('SERVICIO', 'CREAR') && (
              <button
                onClick={() => setIsNewTicketModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Ticket
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Operational KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Tickets Abiertos</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{kpis.totalOpenTickets}</span>
              <span className="text-xs text-rose-400 font-semibold">({kpis.criticalTicketsCount} Críticos)</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Cumplimiento SLA</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">{kpis.slaFulfillmentRatePct}%</span>
              <span className="text-xs text-slate-400">Meta ≥95%</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Garantías Activas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-sky-400">{kpis.activeWarrantiesCount}</span>
              <span className="text-xs text-amber-400">({kpis.pendingWarrantyClaimsCount} Reclamos)</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Devoluciones (RMA)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400">{kpis.pendingReturnsCount}</span>
              <span className="text-xs text-slate-400">{formatCurrency(kpis.returnsTotalValue)}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Global NPS</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-300">+{kpis.globalNpsScore}</span>
              <span className="text-xs text-slate-400">CSAT {kpis.averageCsatScore}/5</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Riesgo Churn</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-400">{kpis.highRiskChurnCustomersCount}</span>
              <span className="text-xs text-slate-400">Clientes Altos</span>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Live Alerts Bar */}
      {safeAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-amber-900 text-sm">
                {safeAlerts.length} Alerta(s) de SLA en Tiempo Real
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                {safeAlerts[0]?.message} (Responsable: {safeAlerts[0]?.assignedToName})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('TICKETS');
              setTicketPriorityFilter('CRITICA');
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
          >
            Ver Tickets Afectados
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'TICKETS', label: 'Tickets & SLA', icon: Headset, count: safeTickets.length },
          { id: 'WARRANTIES', label: 'Garantías & Reclamos', icon: ShieldCheck, count: safeClaims.length },
          { id: 'RETURNS', label: 'Devoluciones & RMA', icon: RotateCcw, count: safeReturns.length },
          { id: 'QUALITY_CAPA', label: 'Calidad & CAPA (8D)', icon: Award, count: safeQuality.length },
          { id: 'NPS_FEEDBACK', label: 'Voz del Cliente & NPS', icon: HeartHandshake, count: safeSurveys.length },
          { id: 'HEALTH_CHURN', label: 'Health Score & Churn', icon: Activity, count: safeHealthScores.length },
          { id: 'PROFITABILITY', label: 'Rentabilidad Real 360°', icon: DollarSign },
          { id: 'AI_ADVISOR', label: 'CONSCORE AI Advisor', icon: Bot },
          { id: 'CERTIFICATION', label: 'Certificación E2E', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SERVICE TICKETS & SLA ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'TICKETS' && (
        <TicketsErrorBoundary onRetry={handleRefreshTickets}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left / Middle: Tickets List & Filter Bar */}
            <div className={`${selectedTicket ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por folio, cliente, asunto..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ABIERTO">Abierto</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="ESPERA_CLIENTE">Espera Cliente</option>
                    <option value="ESPERA_DICTAMEN">Espera Dictamen</option>
                    <option value="RESUELTO">Resuelto</option>
                    <option value="CERRADO">Cerrado</option>
                  </select>

                  <select
                    value={ticketPriorityFilter}
                    onChange={(e) => setTicketPriorityFilter(e.target.value)}
                    className="text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">Todas las Prioridades</option>
                    <option value="CRITICA">Crítica</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleRefreshTickets}
                    disabled={isLoadingTickets}
                    title="Actualizar casos de servicio"
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingTickets ? 'animate-spin text-emerald-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Tickets Table / Cards */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Folio & Asunto</th>
                        <th className="py-3.5 px-4">Cliente & Tier</th>
                        <th className="py-3.5 px-4">Tipo & Canal</th>
                        <th className="py-3.5 px-4">Prioridad</th>
                        <th className="py-3.5 px-4">SLA Resolución</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoadingTickets ? (
                        Array.from({ length: 4 }).map((_, idx) => (
                          <tr key={`loading-ticket-${idx}`} className="animate-pulse">
                            <td className="py-4 px-4">
                              <div className="h-4 bg-slate-200 rounded w-24 mb-1.5" />
                              <div className="h-3 bg-slate-100 rounded w-36" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-4 bg-slate-200 rounded w-28 mb-1.5" />
                              <div className="h-3 bg-slate-100 rounded w-12" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-4 bg-slate-200 rounded w-20 mb-1" />
                              <div className="h-3 bg-slate-100 rounded w-16" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-5 bg-slate-200 rounded-full w-16" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-4 bg-slate-200 rounded w-20" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-5 bg-slate-200 rounded-full w-20" />
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="h-4 bg-slate-200 rounded w-16 ml-auto" />
                            </td>
                          </tr>
                        ))
                      ) : safeTickets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 px-4 text-center">
                            <div className="max-w-sm mx-auto flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                <Headset className="w-6 h-6 text-slate-500" />
                              </div>
                              <h4 className="text-sm font-bold text-slate-800 mb-1">No hay casos registrados</h4>
                              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                Actualmente no existen tickets o casos de servicio técnico registrados en el sistema.
                              </p>
                              {can('SERVICIO', 'CREAR') && (
                                <button
                                  onClick={() => setIsNewTicketModalOpen(true)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Registrar Primer Ticket
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 px-4 text-center">
                            <div className="max-w-sm mx-auto flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                <Search className="w-5 h-5 text-slate-400" />
                              </div>
                              <h4 className="text-sm font-bold text-slate-800 mb-1">No se encontraron tickets</h4>
                              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                Ningún caso coincide con los filtros o término de búsqueda ingresado.
                              </p>
                              <button
                                onClick={() => {
                                  setTicketSearch('');
                                  setTicketStatusFilter('ALL');
                                  setTicketPriorityFilter('ALL');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                Limpiar filtros
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                      filteredTickets.map((ticket) => {
                        const isSelected = selectedTicket?.id === ticket.id;
                        const deadlineStr = (ticket.slaResolutionDeadline || ticket.resolutionDeadline || '');
                        const displayDeadline = deadlineStr.length >= 16 ? deadlineStr.slice(11, 16) : (deadlineStr ? deadlineStr.slice(0, 10) : 'Pendiente');
                        const ticketSubject = (ticket as any).subject || ticket.title || 'Sin asunto';
                        const tier = ticket.customerTier || (ticket as any).tier || 'A';
                        const ticketType = ticket.ticketType || (ticket as any).category || 'SERVICIO';

                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">{ticket.ticketNumber}</div>
                              <div className="text-xs text-slate-500 line-clamp-1">{ticketSubject}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-900">{ticket.customerName}</div>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                Tier {tier}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-xs font-medium text-slate-700 block">{ticketType}</span>
                              <span className="text-[10px] text-slate-400">{ticket.channel}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  ticket.priority === 'CRITICA'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : ticket.priority === 'ALTA'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span
                                  className={`text-xs font-semibold ${
                                    ticket.slaResolutionStatus === 'BREACHED'
                                      ? 'text-rose-600'
                                      : ticket.slaResolutionStatus === 'WARNING'
                                      ? 'text-amber-600'
                                      : 'text-emerald-600'
                                  }`}
                                >
                                  {displayDeadline} hrs
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  ticket.status === 'RESUELTO' || ticket.status === 'CERRADO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ticket.status === 'ABIERTO'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline">
                                Ver Detalle
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Ticket 360° Detail & Resolution Console */}
          {selectedTicket && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{selectedTicket.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cliente: {selectedTicket.customerName}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {/* Status Update Quick Actions */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">
                  Cambiar Estado del Ticket
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['EN_PROCESO', 'ESPERA_CLIENTE', 'RESUELTO', 'CERRADO'] as TicketStatus[]).map((st) => {
                    const canEdit = can('SERVICIO', 'EDITAR');
                    return (
                      <button
                        key={st}
                        onClick={() => canEdit && updateServiceTicketStatus(selectedTicket.id, st)}
                        disabled={selectedTicket.status === st || !canEdit}
                        title={!canEdit ? 'Requiere permiso de edición' : ''}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          selectedTicket.status === st
                            ? 'bg-slate-900 text-white'
                            : canEdit
                            ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ticket Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Descripción Inicial
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Associated Product if applicable */}
              {selectedTicket.productName && (
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
                  <span className="text-xs font-bold text-sky-900 block">Producto Involucrado</span>
                  <div className="text-xs text-sky-800 mt-0.5">
                    {selectedTicket.productCode} — {selectedTicket.productName}
                  </div>
                </div>
              )}

              {/* Events & Comments Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Bitácora de Interacciones ({selectedTicket.comments?.length || 0})
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedTicket.comments?.map((c) => {
                    const timeStr = String(c.timestamp || (c as any).createdAt || '');
                    const displayTime = timeStr.length >= 16 ? timeStr.slice(11, 16) : (timeStr ? timeStr.slice(0, 10) : '--:--');
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-lg text-xs ${
                          c.isInternal
                            ? 'bg-amber-50/70 border border-amber-200/60 text-amber-950'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{c.authorName}</span>
                          <span className="text-[10px] text-slate-400">{displayTime}</span>
                        </div>
                        <p className="mt-1 leading-normal">{c.content}</p>
                        {c.isInternal && (
                          <span className="inline-block mt-1 text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                            NOTA INTERNA
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Comment Input */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <textarea
                    rows={2}
                    placeholder="Escribir respuesta o nota técnica..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded text-slate-900 focus:ring-0"
                      />
                      Nota Interna
                    </label>
                    <button
                      onClick={handleAddCommentSubmit}
                      disabled={!can('SERVICIO', 'EDITAR') && !can('SERVICIO', 'CREAR')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </TicketsErrorBoundary>
    )}

      {/* ========================================================================= */}
      {/* TAB 2: WARRANTIES & TECHNICAL CLAIMS */}
      {/* ========================================================================= */}
      {activeTab === 'WARRANTIES' && (
        <div className="space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">Certificados Activos</span>
                <div className="text-2xl font-bold text-slate-900">{safeWarranties.length} Pólizas</div>
                <span className="text-xs text-emerald-600 font-semibold">100% de Materiales Aislantes</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">Reclamos en Dictamen</span>
                <div className="text-2xl font-bold text-amber-600">{safeClaims.length} Reclamos</div>
                <span className="text-xs text-slate-500">Garantía de Fábrica Directa</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">Asistencia IA de Garantías</span>
                <div className="text-sm font-bold text-slate-900">Análisis Termodinámico</div>
                <span className="text-xs text-slate-500">Dictamen Técnico Recomendado</span>
              </div>
            </div>
          </div>

          {/* Warranty Claims Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Reclamos de Garantía Registrados</h3>
              <span className="text-xs text-slate-500">Dictamen Técnico & Aprobación Requerida</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Folio Reclamo</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Producto & Lote</th>
                    <th className="py-3 px-4">Cant. Reclamada</th>
                    <th className="py-3 px-4">Condición Ambiente</th>
                    <th className="py-3 px-4">Recomendación IA</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Dictamen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeClaims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No hay reclamos de garantía registrados actualmente.
                      </td>
                    </tr>
                  ) : (
                    safeClaims.map((claim) => {
                      const canDictaminar = can('SERVICIO', 'AUTORIZAR') || can('SERVICIO', 'EDITAR');
                      return (
                        <tr key={claim.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{claim.claimFolio}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">{claim.customerName}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{claim.productCode}</div>
                            <div className="text-xs text-slate-500">{claim.productName}</div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{claim.quantityClaimed} PZA</td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {claim.installationEnvironment || 'Exterior'} ({claim.operatingTempC || 25}°C)
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1 w-max">
                              <Bot className="w-3 h-3" />
                              {claim.aiRecommendation || 'REVISAR'} ({claim.aiConfidencePct || 90}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                claim.status === 'APROBADA'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : claim.status === 'RECHAZADA'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {claim.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedClaim(claim);
                                setApprovedWarrantyQty(claim.quantityClaimed);
                              }}
                              disabled={!canDictaminar}
                              title={!canDictaminar ? 'Requiere permiso de dictamen o edición' : ''}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                canDictaminar
                                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Dictaminar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOMER RETURNS & RMA (PHYSICAL RESTOCK) */}
      {/* ========================================================================= */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Devoluciones de Clientes (RMA)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspección física en almacén, aprobación técnica y reingreso atómico al Kardex.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Folio RMA</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4">Items / Cantidad</th>
                    <th className="py-3 px-4">Valor Total</th>
                    <th className="py-3 px-4">Inspección Física</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Inspeccionar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No hay solicitudes de devolución RMA registradas.
                      </td>
                    </tr>
                  ) : (
                    safeReturns.map((ret) => {
                      const canInspect = can('SERVICIO', 'AUTORIZAR') || can('SERVICIO', 'EDITAR');
                      return (
                        <tr key={ret.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{ret.returnFolio}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">{ret.customerName}</td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{ret.reason}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {(ret.items || []).reduce((acc, i) => acc + (i.quantityRequested || 0), 0)} Pzas
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">{formatCurrency(ret.totalValue || 0)}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                ret.inspectionPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ret.inspectionPassed ? 'APROBADA' : 'PENDIENTE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                ret.status === 'APROBADA'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ret.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedReturn(ret)}
                              disabled={!canInspect}
                              title={!canInspect ? 'Requiere permiso de inspección o edición' : ''}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                canInspect
                                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Inspeccionar RMA
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: QUALITY, PARETO 80/20 & CAPA ACTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'QUALITY_CAPA' && (
        <div className="space-y-6">
          {/* Quality Incidents and Pareto Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pareto 80/20 Defect Analysis */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Análisis Pareto 80/20 de Defectos</h3>
                  <p className="text-xs text-slate-500">Causas raíz prioritarias de no conformidad</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 text-xs font-bold">
                  Pérdidas: {formatCurrency(kpis.qualityLossesYTD)}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Densidad Aislamiento Térmico', count: 6, loss: 48000, pct: 42, color: 'bg-rose-500' },
                  { label: 'Espesor / Calibre No Conforme', count: 4, loss: 28000, pct: 28, color: 'bg-amber-500' },
                  { label: 'Golpe / Daño en Maniobra', count: 2, loss: 14000, pct: 15, color: 'bg-sky-500' },
                  { label: 'Empaque / Sellado Roto', count: 1, loss: 8500, pct: 15, color: 'bg-slate-400' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>{item.label}</span>
                      <span>
                        {item.count} Casos · {formatCurrency(item.loss)} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CAPA Corrective Actions Matrix */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Acciones CAPA Activas (Metodología 8D)</h3>
                  <p className="text-xs text-slate-500">Medidas correctivas y preventivas con seguimiento</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {safeCapa.length} Planes CAPA
                </span>
              </div>

              <div className="space-y-3">
                {safeCapa.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-lg">
                    No hay planes de acción CAPA activos.
                  </div>
                ) : (
                  safeCapa.map((capa) => (
                    <div key={capa.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{capa.capaFolio}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {capa.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800">{capa.actionPlan}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Resp: {capa.responsibleUserName}</span>
                        <span>Vence: {capa.targetCompletionDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CUSTOMER FEEDBACK, NPS, CSAT & CES */}
      {/* ========================================================================= */}
      {activeTab === 'NPS_FEEDBACK' && (
        <div className="space-y-6">
          {/* NPS Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Net Promoter Score (NPS)</span>
              <div className="text-4xl font-extrabold text-emerald-600 mt-2">+{safeNpsMetrics.npsScore}</div>
              <span className="text-xs text-slate-500 mt-1 block">Escala de -100 a +100</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">CSAT Satisfacción General</span>
              <div className="text-4xl font-extrabold text-sky-600 mt-2">{safeNpsMetrics.avgCsat} / 5.0</div>
              <span className="text-xs text-slate-500 mt-1 block">Satisfacción promedio post-entrega</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">CES Esfuerzo del Cliente</span>
              <div className="text-4xl font-extrabold text-purple-600 mt-2">{safeNpsMetrics.avgCes} / 7.0</div>
              <span className="text-xs text-slate-500 mt-1 block">Facilidad de resolución y soporte</span>
            </div>
          </div>

          {/* Feedback Responses Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Voz del Cliente & Encuestas Recientes</h3>
            {safeSurveys.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-lg">
                No se han recibido encuestas de satisfacción aún.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeSurveys.map((survey) => {
                  const dateStr = String(survey.createdAt || '');
                  const displayDate = dateStr.length >= 10 ? dateStr.slice(0, 10) : (dateStr || 'Reciente');
                  return (
                    <div
                      key={survey.id}
                      className={`p-4 rounded-xl border ${
                        survey.classification === 'PROMOTER'
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : survey.classification === 'DETRACTOR'
                          ? 'border-rose-200 bg-rose-50/40'
                          : 'border-slate-200 bg-slate-50/60'
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{survey.customerName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            survey.classification === 'PROMOTER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : survey.classification === 'DETRACTOR'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Score: {survey.score}/10 ({survey.classification})
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 italic">"{survey.feedbackComments}"</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/40">
                        <span>Factor Clave: {survey.primaryFactor}</span>
                        <span>{displayDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CUSTOMER HEALTH SCORE & CHURN RISK */}
      {/* ========================================================================= */}
      {activeTab === 'HEALTH_CHURN' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Customer Health Score & Matriz de Riesgo de Churn</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modelo predictivo 360° basado en recencia, frecuencia, margen, puntualidad CXC y tickets de soporte.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Health Score</th>
                    <th className="py-3 px-4">Riesgo Churn</th>
                    <th className="py-3 px-4">Días Últ. Compra</th>
                    <th className="py-3 px-4">Facturación YTD</th>
                    <th className="py-3 px-4">Señales de Riesgo</th>
                    <th className="py-3 px-4">Recomendación IA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeHealthScores.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No hay registros de Health Score generados.
                      </td>
                    </tr>
                  ) : (
                    safeHealthScores.map((hs) => (
                      <tr key={hs.customerId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{hs.customerName}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                            Tier {hs.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{hs.overallScore}/100</span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                hs.healthBand === 'VERDE'
                                  ? 'bg-emerald-500'
                                  : hs.healthBand === 'AMARILLO'
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              hs.churnRisk === 'ALTO'
                                ? 'bg-rose-100 text-rose-800'
                                : hs.churnRisk === 'MEDIO'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {hs.churnRisk} ({hs.churnProbabilityPct}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">{hs.daysSinceLastPurchase} días</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(hs.ytdRevenue)}</td>
                        <td className="py-3.5 px-4 text-xs text-rose-700 font-medium">
                          {(hs.riskSignals || []).length > 0 ? (hs.riskSignals || []).join(' · ') : 'Sin alertas'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">{hs.aiActionRecommendation}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: REAL CUSTOMER PROFITABILITY 360° */}
      {/* ========================================================================= */}
      {activeTab === 'PROFITABILITY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Rentabilidad Real por Cliente (Margen de Contribución 360°)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deducción exacta de costo Kardex, comisiones de venta, fletes de ruta logística, costos de garantías y soporte.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Ventas Netas</th>
                    <th className="py-3 px-4">COGS (Kardex)</th>
                    <th className="py-3 px-4">Fletes & Rutas</th>
                    <th className="py-3 px-4">Garantías & Devol.</th>
                    <th className="py-3 px-4">Margen Contribución Real</th>
                    <th className="py-3 px-4">Rentabilidad Neta %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeProfitability.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        No hay registros de rentabilidad de clientes disponibles.
                      </td>
                    </tr>
                  ) : (
                    safeProfitability.map((p) => (
                      <tr key={p.customerId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.customerName}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{formatCurrency(p.salesVolume)}</td>
                        <td className="py-3.5 px-4 text-slate-600">{formatCurrency(p.cogs)}</td>
                        <td className="py-3.5 px-4 text-slate-600">{formatCurrency(p.logisticsFreightCost)}</td>
                        <td className="py-3.5 px-4 text-rose-600">
                          {formatCurrency((p.returnsCost || 0) + (p.warrantiesCost || 0))}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                          {formatCurrency(p.realContributionMargin)} ({p.realContributionMarginPct}%)
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              p.netProfitabilityPct >= 20
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.netProfitabilityPct >= 10
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.netProfitabilityPct}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: CONSCORE AI CUSTOMER ADVISOR (15-POINT MANDATE) */}
      {/* ========================================================================= */}
      {activeTab === 'AI_ADVISOR' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">CONSCORE AI Customer Advisor</h3>
                <p className="text-xs text-slate-400">
                  Motor de asesoría estratégica postventa regido bajo el estándar de 15 puntos y la Regla de Honestidad.
                </p>
              </div>
            </div>

            {/* Quick Prompt Selectors */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { id: 'RECLAMOS_TOP', label: 'Top 3 Motivos de Reclamo & Defectos' },
                { id: 'SLA_BOTTLENECK', label: 'Cuellos de Botella en SLA de Soporte' },
                { id: 'CHURN_PREVENTION', label: 'Clientes en Riesgo Crítico de Churn' },
                { id: 'WARRANTY_DECISION', label: 'Validación de Garantías & Parámetros' },
                { id: 'NPS_IMPROVEMENT', label: 'Estrategia de Recuperación de Detractores' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => {
                    setSelectedAiQueryId(btn.id);
                    handleExecuteAiAdvisor(btn.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedAiQueryId === btn.id
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Advisor Response Render (15-Point Structured Layout) */}
          {aiResponse && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    CONSCORE AI STRATEGIC REPORT
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{aiResponse.pregunta}</h2>
                  <span className="text-xs text-slate-500">Periodo Analizado: {aiResponse.periodoAnalizado}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Nivel de Confianza</span>
                  <span className="text-lg font-black text-emerald-600">{aiResponse.nivelConfianza}</span>
                </div>
              </div>

              {/* Data Transparency Grid (Honesty Rule) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1.5">
                    ● DATOS REALES
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {aiResponse.datosReales?.map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-sky-800 uppercase block mb-1.5">
                    ● DATOS CALCULADOS
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {aiResponse.datosCalculados?.map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1.5">
                    ● DATOS PROYECTADOS
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {aiResponse.datosProyectados?.map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1.5">
                    ● DATOS INSUFICIENTES
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {aiResponse.datosInsuficientes?.map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Findings, Risks & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 space-y-2">
                  <span className="text-xs font-bold text-sky-900 uppercase">8. Hallazgos Principales</span>
                  <ul className="text-xs text-sky-950 space-y-1.5 list-disc list-inside">
                    {aiResponse.hallazgos?.map((h: string, i: number) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-2">
                  <span className="text-xs font-bold text-rose-900 uppercase">9. Riesgos Identificados</span>
                  <ul className="text-xs text-rose-950 space-y-1.5 list-disc list-inside">
                    {aiResponse.riesgos?.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase">10. Oportunidades Clave</span>
                  <ul className="text-xs text-emerald-950 space-y-1.5 list-disc list-inside">
                    {aiResponse.oportunidades?.map((o: string, i: number) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Recommendations & Impact */}
              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase">
                    12. NEXT BEST ACTION (RECOMENDACIÓN INMEDIATA)
                  </span>
                  <span className="text-xs text-slate-400">
                    Responsable Propuesto: <b className="text-white">{aiResponse.responsablePropuesto}</b>
                  </span>
                </div>
                <p className="text-sm font-semibold text-emerald-300">{aiResponse.nextBestAction}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <span>Impacto Financiero Estimado: <b className="text-white">{aiResponse.impactoFinancieroEstimado}</b></span>
                  <span className="text-amber-400 text-[11px] font-semibold">⚠️ Requiere autorización humana para ejecución</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: MASTER E2E CERTIFICATION SUITE (PHASE 11) */}
      {/* ========================================================================= */}
      {activeTab === 'CERTIFICATION' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Suite de Certificación Transversal E2E (Fase 11)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validación integral de SLA, integridad de inventario RMA, garantías, Pareto de calidad, NPS, consistencia de churn y RBAC.
                </p>
              </div>
              <button
                onClick={handleRunCertification}
                disabled={isCertRunning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isCertRunning ? 'animate-spin' : ''}`} />
                {isCertRunning ? 'Ejecutando Pruebas...' : 'Ejecutar Certificación'}
              </button>
            </div>

            {certResults && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
                  <div>
                    <div className="text-sm font-bold">ESTADO GLOBAL DE CERTIFICACIÓN</div>
                    <div className="text-xs text-slate-400 mt-0.5">Sello: {certResults.certificationSeal}</div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      certResults.overallStatus === 'PASS'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {certResults.overallStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certResults.testSuites?.map((test: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border ${
                        test.passed ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
                      } flex items-center justify-between`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-slate-900">{test.testName}</div>
                        <div className="text-[11px] text-slate-600">{test.details}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          test.passed ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                        }`}
                      >
                        {test.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO TICKET DE SERVICIO */}
      {/* ========================================================================= */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Crear Nuevo Ticket de Servicio</h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cliente Solicitante *</label>
                <select
                  required
                  value={newTicketData.customerId}
                  onChange={(e) => setNewTicketData({ ...newTicketData, customerId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {availableCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.businessName || (c as any).company_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Incidencia</label>
                  <select
                    value={newTicketData.ticketType}
                    onChange={(e) =>
                      setNewTicketData({ ...newTicketData, ticketType: e.target.value as TicketType })
                    }
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="INCIDENCIA_CALIDAD">Incidencia de Calidad</option>
                    <option value="RECLAMO_GARANTIA">Reclamo de Garantía</option>
                    <option value="SOLICITUD_DEVOLUCION">Solicitud Devolución (RMA)</option>
                    <option value="RETRASO_ENTREGA">Retraso en Entrega</option>
                    <option value="ASESORIA_TECNICA">Asesoría Técnica</option>
                    <option value="FACTURACION_COBRANZA">Facturación y Cobranza</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Prioridad (Determina SLA)</label>
                  <select
                    value={newTicketData.priority}
                    onChange={(e) =>
                      setNewTicketData({ ...newTicketData, priority: e.target.value as TicketPriority })
                    }
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="CRITICA">Crítica (Resolución 4 hrs)</option>
                    <option value="ALTA">Alta (Resolución 8 hrs)</option>
                    <option value="MEDIA">Media (Resolución 24 hrs)</option>
                    <option value="BAJA">Baja (Resolución 48 hrs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Producto Relacionado (Opcional)</label>
                <select
                  value={newTicketData.productId}
                  onChange={(e) => setNewTicketData({ ...newTicketData, productId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Ninguno / Asunto General</option>
                  {safeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Asunto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Espesor fuera de tolerancia en lote LOT-2025"
                  value={newTicketData.subject}
                  onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Descripción del Problema</label>
                <textarea
                  rows={3}
                  placeholder="Detalles técnicos, mediciones, evidencia o contexto..."
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  {isSubmittingTicket ? 'Registrando...' : 'Registrar Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DICTAMEN DE GARANTÍA */}
      {/* ========================================================================= */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Dictamen Técnico de Garantía: {selectedClaim.claimFolio}
              </h3>
              <button onClick={() => setSelectedClaim(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div><b>Cliente:</b> {selectedClaim.customerName}</div>
              <div><b>Material:</b> {selectedClaim.productCode} — {selectedClaim.productName}</div>
              <div><b>Falla Reportada:</b> {selectedClaim.defectDescription}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Decisión de Dictamen</label>
                <select
                  value={warrantyDecision}
                  onChange={(e) => setWarrantyDecision(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="APROBADA">Aprobar Garantía (Reposición / Nota de Crédito)</option>
                  <option value="PARCIAL">Aprobación Parcial</option>
                  <option value="RECHAZADA">Rechazar Garantía (Mala Instalación / Fuera de Póliza)</option>
                </select>
              </div>

              {warrantyDecision !== 'RECHAZADA' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cantidad Autorizada</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedClaim.quantityClaimed}
                    value={approvedWarrantyQty}
                    onChange={(e) => setApprovedWarrantyQty(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notas del Dictamen Técnico</label>
                <textarea
                  rows={3}
                  placeholder="Justificación del dictamen, análisis metalúrgico o de laboratorio..."
                  value={warrantyResolutionNotes}
                  onChange={(e) => setWarrantyResolutionNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleResolveClaimSubmit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Guardar Dictamen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECCIÓN FÍSICA Y REINGRESO RMA */}
      {/* ========================================================================= */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Inspección Física y Disposición RMA: {selectedReturn.returnFolio}
              </h3>
              <button onClick={() => setSelectedReturn(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div><b>Cliente:</b> {selectedReturn.customerName}</div>
              <div><b>Motivo RMA:</b> {selectedReturn.reason}</div>
              <div><b>Valor Total:</b> {formatCurrency(selectedReturn.totalValue || 0)}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Resultado de Inspección Física</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInspectionPassed(true)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                      inspectionPassed
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Material Aprobado
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionPassed(false)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                      !inspectionPassed
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Material Dañado / Rechazado
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Disposición Final del Material</label>
                <select
                  value={dispositionAction}
                  onChange={(e) => setDispositionAction(e.target.value as ReturnDisposition)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="REINGRESO_INVENTARIO">Reingreso Atómico a Inventario (Kardex)</option>
                  <option value="CUARENTENA">Cuarentena para Análisis Calidad</option>
                  <option value="MERMA_DESTRUCCION">Merma / Destrucción</option>
                  <option value="DEVOLUCION_PROVEEDOR">Devolución a Proveedor Original</option>
                </select>
              </div>

              {dispositionAction === 'REINGRESO_INVENTARIO' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Almacén Destino para Reingreso</label>
                  <select
                    value={targetWarehouseId}
                    onChange={(e) => setTargetWarehouseId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    {safeWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notas de la Inspección de Almacén</label>
                <textarea
                  rows={2}
                  placeholder="Verificación de embalaje, sellos intactos, lote..."
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessReturnSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Aplicar Inspección & Kardex
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CustomerServiceCenter: React.FC = () => {
  return (
    <CustomerServiceErrorBoundary>
      <CustomerServiceCenterInner />
    </CustomerServiceErrorBoundary>
  );
};

