/**
 * @license
 * CONSCORE ERP IA - Executive Actions View (Observación 36 Hotfix)
 * FASE 13 - Centro de Decisión de Acciones Priorizadas (Human-in-the-Loop)
 */

import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertTriangle,
  DollarSign,
  User,
  CheckCircle,
  Filter,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Activity,
  X,
  ExternalLink,
  HelpCircle,
  Save,
  Check,
  ChevronRight,
  Ban,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import {
  GovernanceExecutiveAction,
  GovernanceActionHorizon,
  GovernanceActionStatus,
  ExecutiveActionTimeframe,
} from '../../types/governanceRiskComplianceTypes';

// ==========================================
// 1. ERROR BOUNDARY RESILIENTE LOCAL
// ==========================================

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GovernanceActionsErrorBoundary extends (Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL: GovernanceExecutiveActionView caught runtime error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-slate-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-red-900">
                Interrupción en el Centro de Acciones Priorizadas
              </h3>
              <p className="text-sm text-red-700">
                Se detectó una discrepancia en los datos de gobierno o en el motor de renderizado.
                El incidente ha sido aislado para proteger la integridad del sistema.
              </p>
              {this.state.error && (
                <div className="mt-2 rounded bg-red-100/70 p-2.5 font-mono text-xs text-red-950">
                  {this.state.error.message || 'Error no especificado'}
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-800 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reintentar Carga del Módulo
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. HELPERS SEGUROS (PREVENCIÓN DE TYPEERROR)
// ==========================================

function safeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

function safeFormatCurrency(amount: any): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0').replace(/[^0-9.-]+/g, ''));
  if (!Number.isFinite(num)) return '$0.00 MXN';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function safeFormatDate(dateStr: any): string {
  if (!dateStr) return 'Sin fecha límite';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function getHorizonLabel(horizon: any): string {
  const h = safeString(horizon, 'HOY').toUpperCase();
  switch (h) {
    case 'HOY':
      return 'Hoy (Inmediato)';
    case 'ESTA_SEMANA':
      return 'Esta Semana';
    case 'ESTE_MES':
      return 'Este Mes';
    default:
      return h.replace(/_/g, ' ');
  }
}

function getHorizonBadgeStyle(horizon: any): string {
  const h = safeString(horizon, 'HOY').toUpperCase();
  switch (h) {
    case 'HOY':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'ESTA_SEMANA':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ESTE_MES':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function getPriorityBadgeStyle(priority: any): string {
  const p = safeString(priority, 'MEDIUM').toUpperCase();
  switch (p) {
    case 'CRITICAL':
      return 'bg-red-600 text-white border-red-700 shadow-xs';
    case 'HIGH':
      return 'bg-amber-600 text-white border-amber-700 shadow-xs';
    case 'MEDIUM':
      return 'bg-blue-600 text-white border-blue-700 shadow-xs';
    case 'LOW':
      return 'bg-slate-600 text-white border-slate-700 shadow-xs';
    default:
      return 'bg-slate-600 text-white border-slate-700 shadow-xs';
  }
}

function getPriorityLabel(priority: any): string {
  const p = safeString(priority, 'MEDIUM').toUpperCase();
  switch (p) {
    case 'CRITICAL':
      return 'CRÍTICA';
    case 'HIGH':
      return 'ALTA';
    case 'MEDIUM':
      return 'MEDIA';
    case 'LOW':
      return 'BAJA';
    default:
      return p;
  }
}

function getStatusBadgeStyle(status: any): string {
  const s = safeString(status, 'OPEN').toUpperCase();
  switch (s) {
    case 'OPEN':
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function getStatusLabel(status: any): string {
  const s = safeString(status, 'OPEN').toUpperCase();
  switch (s) {
    case 'OPEN':
    case 'PENDING':
      return 'Pendiente';
    case 'IN_PROGRESS':
      return 'En Proceso';
    case 'COMPLETED':
      return 'Completada';
    case 'CANCELLED':
      return 'Descartada';
    default:
      return s;
  }
}

function getSourceBadge(source: any): { label: string; style: string } {
  const s = safeString(source, 'DIRECTIVA').toUpperCase();
  switch (s) {
    case 'AI_ADVISOR':
      return { label: 'IA Advisor', style: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'SoD':
      return { label: 'Control SoD', style: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'RIESGO_ERM':
      return { label: 'Riesgo ERM', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'COMPLIANCE':
      return { label: 'Compliance', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'ANOMALIA':
      return { label: 'Anomalía', style: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'AUDITORIA':
      return { label: 'Auditoría', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    default:
      return { label: s || 'Gobierno', style: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

// ==========================================
// 3. PROPS DEL COMPONENTE
// ==========================================

export interface GovernanceExecutiveActionViewProps {
  actions?: GovernanceExecutiveAction[];
  onCompleteAction?: (actionId: string, notes?: string) => void;
  onUpdateActionStatus?: (
    actionId: string,
    status: GovernanceActionStatus,
    notes?: string
  ) => Promise<void> | void;
  onAssignAction?: (
    actionId: string,
    assignedToId: string,
    assignedToName: string
  ) => Promise<void> | void;
  onActionsUpdated?: (actions: GovernanceExecutiveAction[]) => void;
  onRefresh?: () => void;
}

// ==========================================
// 4. COMPONENTE PRINCIPAL
// ==========================================

const GovernanceExecutiveActionViewContent: React.FC<GovernanceExecutiveActionViewProps> = ({
  actions: propActions = [],
  onCompleteAction,
  onUpdateActionStatus,
  onAssignAction,
  onActionsUpdated,
  onRefresh,
}) => {
  const [actionsList, setActionsList] = useState<GovernanceExecutiveAction[]>(propActions || []);
  const [selectedHorizon, setSelectedHorizon] = useState<string>('TODAS');
  const [selectedPriority, setSelectedPriority] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal de Detalle & Dictamen
  const [selectedActionModal, setSelectedActionModal] = useState<GovernanceExecutiveAction | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<GovernanceActionStatus>('IN_PROGRESS');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState<string | null>(null);
  const [newAssigneeName, setNewAssigneeName] = useState<string>('');

  // Sincronizar estado local cuando cambian los props
  useEffect(() => {
    if (propActions && Array.isArray(propActions)) {
      setActionsList(propActions);
    }
  }, [propActions]);

  // Función para cargar datos desde el backend
  const fetchActionsFromBackend = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem('conscore_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/governance/actions', { headers });
      if (!res.ok) {
        if (res.status === 401) {
          // Si no está autenticado, usar los datos locales sin romper
          console.warn('Usuario no autenticado para /api/governance/actions, usando datos locales');
          return;
        }
        throw new Error(`Error del servidor (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.actions)) {
        setActionsList(data.actions);
        if (onActionsUpdated) {
          onActionsUpdated(data.actions);
        }
      }
    } catch (err: any) {
      console.warn('Advertencia: No se pudo conectar al endpoint de acciones, manteniendo datos locales:', err);
      // No marcar pantalla como error fatal si tenemos propActions disponibles
      if (!propActions || propActions.length === 0) {
        setFetchError(err.message || 'Error de conexión con el centro de acciones');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchActionsFromBackend();
  }, []);

  // Manejador de cambio de estado (Human-in-the-Loop)
  const handleSaveDecision = async () => {
    if (!selectedActionModal) return;
    setIsSubmittingDecision(true);
    setDecisionSuccessMsg(null);

    const actionId = selectedActionModal.actionId || selectedActionModal.id;
    const finalNote = decisionNotes.trim();

    try {
      const token = localStorage.getItem('conscore_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Enviar cambio de estado al backend si existe
      try {
        await fetch(`/api/governance/actions/${actionId}/status`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            status: targetStatus,
            note: finalNote || undefined,
          }),
        });
      } catch (beErr) {
        console.warn('Backend update failed, applying local state update:', beErr);
      }

      // 2. Si se reasignó responsable
      if (newAssigneeName.trim()) {
        try {
          await fetch(`/api/governance/actions/${actionId}/assign`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              assignedToName: newAssigneeName.trim(),
            }),
          });
        } catch (assignErr) {
          console.warn('Assign backend call failed:', assignErr);
        }
      }

      // 3. Notificar callbacks del padre
      if (onUpdateActionStatus) {
        await onUpdateActionStatus(actionId, targetStatus, finalNote);
      } else if (targetStatus === 'COMPLETED' && onCompleteAction) {
        onCompleteAction(actionId, finalNote);
      }

      // 4. Actualizar estado local inmutablemente
      const updatedList = actionsList.map((a) => {
        if ((a.actionId === actionId || a.id === actionId)) {
          return {
            ...a,
            status: targetStatus,
            resolutionNotes: finalNote || a.resolutionNotes,
            ownerName: newAssigneeName.trim() || a.ownerName,
            assignedRole: newAssigneeName.trim() || a.assignedRole,
            completedAt: targetStatus === 'COMPLETED' ? new Date().toISOString() : a.completedAt,
            reviewedAt: new Date().toISOString(),
          };
        }
        return a;
      });

      setActionsList(updatedList);
      if (onActionsUpdated) {
        onActionsUpdated(updatedList);
      }

      setDecisionSuccessMsg(`Dictamen registrado exitosamente. Estado actualizado a ${getStatusLabel(targetStatus)}.`);
      setTimeout(() => {
        setSelectedActionModal(null);
        setDecisionSuccessMsg(null);
        setDecisionNotes('');
        setNewAssigneeName('');
      }, 1200);
    } catch (err: any) {
      alert(`Error al guardar el dictamen: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Abrir modal de decisión para una acción
  const handleOpenModal = (action: GovernanceExecutiveAction) => {
    setSelectedActionModal(action);
    setTargetStatus(action.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS');
    setDecisionNotes(action.resolutionNotes || '');
    setNewAssigneeName('');
    setDecisionSuccessMsg(null);
  };

  // Filtrado defensivo de acciones
  const filteredActions = useMemo(() => {
    if (!Array.isArray(actionsList)) return [];

    return actionsList.filter((a) => {
      if (!a) return false;

      // Filtro de Horizonte / Plazo
      const aHorizon = safeString(a.horizon || a.timeframe, 'HOY').toUpperCase();
      if (selectedHorizon !== 'TODAS' && aHorizon !== selectedHorizon) {
        return false;
      }

      // Filtro de Prioridad
      const aPriority = safeString(a.priority, 'MEDIUM').toUpperCase();
      if (selectedPriority !== 'TODAS' && aPriority !== selectedPriority) {
        return false;
      }

      // Filtro de Estado
      const aStatus = safeString(a.status, 'OPEN').toUpperCase();
      if (selectedStatus === 'OPEN' && aStatus !== 'OPEN' && aStatus !== 'PENDING') {
        return false;
      }
      if (selectedStatus === 'IN_PROGRESS' && aStatus !== 'IN_PROGRESS') {
        return false;
      }
      if (selectedStatus === 'COMPLETED' && aStatus !== 'COMPLETED') {
        return false;
      }

      // Búsqueda textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = safeString(a.title).toLowerCase();
        const desc = safeString(a.description).toLowerCase();
        const owner = safeString(a.ownerName || a.assignedRole).toLowerCase();
        const id = safeString(a.actionId || a.id).toLowerCase();
        const tx = safeString(a.masterTransactionId).toLowerCase();
        const source = safeString(a.source || a.domain).toLowerCase();

        return (
          title.includes(q) ||
          desc.includes(q) ||
          owner.includes(q) ||
          id.includes(q) ||
          tx.includes(q) ||
          source.includes(q)
        );
      }

      return true;
    });
  }, [actionsList, selectedHorizon, selectedPriority, selectedStatus, searchQuery]);

  // Cálculos de métricas seguras
  const metrics = useMemo(() => {
    const total = actionsList.length;
    const forToday = actionsList.filter((a) => {
      const h = safeString(a.horizon || a.timeframe, 'HOY').toUpperCase();
      const s = safeString(a.status, 'OPEN').toUpperCase();
      return h === 'HOY' && (s === 'OPEN' || s === 'PENDING' || s === 'IN_PROGRESS');
    }).length;

    const criticalCount = actionsList.filter((a) => {
      const p = safeString(a.priority, 'MEDIUM').toUpperCase();
      const s = safeString(a.status, 'OPEN').toUpperCase();
      return p === 'CRITICAL' && s !== 'COMPLETED';
    }).length;

    const completedCount = actionsList.filter((a) => {
      const s = safeString(a.status, 'OPEN').toUpperCase();
      return s === 'COMPLETED';
    }).length;

    const inProgressCount = actionsList.filter((a) => {
      const s = safeString(a.status, 'OPEN').toUpperCase();
      return s === 'IN_PROGRESS';
    }).length;

    const totalFinancialRisk = actionsList.reduce((sum, a) => {
      const val = typeof a.financialImpactMXN === 'number' ? a.financialImpactMXN : (typeof a.expectedFinancialImpact === 'number' ? a.expectedFinancialImpact : 0);
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);

    return { total, forToday, criticalCount, completedCount, inProgressCount, totalFinancialRisk };
  }, [actionsList]);

  return (
    <div className="space-y-6">
      {/* 1. CABECERA & PROTOCOLO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-blue-600" />
              Acciones Priorizadas y Centro de Decisión
            </h2>
            <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 border border-blue-200">
              FASE 13
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Centro de comando ejecutivo para la toma de decisiones asistidas por IA.
            La inteligencia artificial analiza señales de riesgo y recomienda directivas; el humano autorizado decide y turna a los módulos operativos correspondientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchActionsFromBackend}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Acciones</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.total}</p>
          <span className="text-[10px] text-slate-500">Consolidado transversal</span>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">Para Hoy</span>
            <Clock className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-900">{metrics.forToday}</p>
          <span className="text-[10px] text-red-600 font-medium">Plazo inmediato</span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">En Proceso</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{metrics.inProgressCount}</p>
          <span className="text-[10px] text-amber-700 font-medium">En gestión activa</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Completadas</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{metrics.completedCount}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Dictámenes cerrados</span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Impacto Total</span>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-lg font-black text-blue-900 truncate">
            {safeFormatCurrency(metrics.totalFinancialRisk)}
          </p>
          <span className="text-[10px] text-blue-600 font-medium">Protección patrimonial</span>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS & BÚSQUEDA */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        {/* Pestañas de Horizonte Temporal */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'TODAS', label: 'Todas las Acciones' },
              { id: 'HOY', label: 'Hoy (Inmediato)' },
              { id: 'ESTA_SEMANA', label: 'Esta Semana' },
              { id: 'ESTE_MES', label: 'Este Mes' },
            ].map((tf) => {
              const count =
                tf.id === 'TODAS'
                  ? actionsList.length
                  : actionsList.filter(
                      (a) => safeString(a.horizon || a.timeframe, 'HOY').toUpperCase() === tf.id
                    ).length;

              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setSelectedHorizon(tf.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    selectedHorizon === tf.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tf.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Selector de vista */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                viewMode === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tarjetas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                viewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriz Tabular
            </button>
          </div>
        </div>

        {/* Filtros secundarios y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, descripción, responsable, o ID de transacción..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filtro Prioridad */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="TODAS">Prioridad: Todas</option>
              <option value="CRITICAL">Crítica</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>

            {/* Filtro Estado */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="TODAS">Estado: Todos</option>
              <option value="OPEN">Pendientes</option>
              <option value="IN_PROGRESS">En Proceso</option>
              <option value="COMPLETED">Completadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. ERROR STATE SI APLICA */}
      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchActionsFromBackend}
            className="rounded bg-red-600 px-3 py-1 text-white font-bold hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 5. LOADING STATE */}
      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">Sincronizando Centro de Acciones Priorizadas...</p>
          <p className="text-xs text-slate-500 mt-1">
            Consolidando alertas, anomalías y directivas de gobierno corporativo.
          </p>
        </div>
      )}

      {/* 6. EMPTY STATE */}
      {!isLoading && filteredActions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            No hay acciones priorizadas pendientes
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedHorizon !== 'TODAS' || selectedPriority !== 'TODAS' || selectedStatus !== 'TODAS'
              ? 'No se encontraron acciones que coincidan con los filtros seleccionados. Pruebe ampliando los criterios de búsqueda.'
              : 'Todas las tareas directivas y recomendaciones del comité se encuentran atendidas o al día.'}
          </p>
          {(searchQuery || selectedHorizon !== 'TODAS' || selectedPriority !== 'TODAS' || selectedStatus !== 'TODAS') && (
            <button
              type="button"
              onClick={() => {
                setSelectedHorizon('TODAS');
                setSelectedPriority('TODAS');
                setSelectedStatus('TODAS');
                setSearchQuery('');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      )}

      {/* 7. CONTENIDO PRINCIPAL: VISTA DE TARJETAS */}
      {!isLoading && filteredActions.length > 0 && viewMode === 'CARDS' && (
        <div className="space-y-4">
          {filteredActions.map((action) => {
            const actionId = safeString(action.actionId || action.id, 'ACT-UNKNOWN');
            const horizon = action.horizon || action.timeframe || 'HOY';
            const priority = action.priority || 'MEDIUM';
            const status = action.status || 'OPEN';
            const sourceInfo = getSourceBadge(action.source || action.domain);
            const isCompleted = status === 'COMPLETED';

            return (
              <div
                key={actionId}
                className={`rounded-xl border p-5 transition-all shadow-xs ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : horizon === 'HOY'
                    ? 'border-red-200 bg-white hover:border-red-300'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Contenido Izquierdo */}
                  <div className="space-y-3 flex-1">
                    {/* Badges Superiores */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border ${getHorizonBadgeStyle(horizon)}`}>
                        {getHorizonLabel(horizon)}
                      </span>

                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border ${getPriorityBadgeStyle(priority)}`}>
                        {getPriorityLabel(priority)}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sourceInfo.style}`}>
                        {sourceInfo.label}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeStyle(status)}`}>
                        {getStatusLabel(status)}
                      </span>

                      <span className="font-mono text-[11px] text-slate-500 ml-auto">
                        Límite: <b className="text-slate-800">{safeFormatDate(action.dueDate || action.deadlineDate)}</b>
                      </span>
                    </div>

                    {/* Título y Descripción */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{safeString(action.title, 'Acción sin título')}</span>
                        {action.requiresHumanValidation && (
                          <span className="rounded bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 border border-amber-300 inline-flex items-center gap-1">
                            <User className="h-2.5 w-2.5" /> Human-in-the-Loop
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {safeString(action.description, 'Sin descripción detallada')}
                      </p>
                    </div>

                    {/* Grid de 3 Columnas Informativas */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Responsable</span>
                        <b className="text-slate-800 truncate block mt-0.5">
                          {safeString(action.ownerName || action.assignedRole, 'Por Asignar')}
                        </b>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Impacto Financiero</span>
                        <b className="text-emerald-700 truncate block mt-0.5 font-mono">
                          {safeFormatCurrency(action.financialImpactMXN || action.expectedFinancialImpact)}
                        </b>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Mitigación de Riesgo</span>
                        <b className="text-blue-900 truncate block mt-0.5">
                          {safeString(action.riskImpact || action.expectedRiskReduction, 'Protección de operación')}
                        </b>
                      </div>
                    </div>

                    {/* Trazabilidad si existe */}
                    {(action.masterTransactionId || action.auditId) && (
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                        {action.masterTransactionId && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            TX Maestra: <b>{action.masterTransactionId}</b>
                          </span>
                        )}
                        {action.auditId && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Auditoría: <b>{action.auditId}</b>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción Derecha */}
                  <div className="shrink-0 flex lg:flex-col items-end justify-between lg:justify-start gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(action)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Eye className="h-4 w-4" /> Dictamen & Detalle
                    </button>

                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onCompleteAction) {
                            onCompleteAction(actionId);
                          }
                          // Actualizar local
                          setActionsList((prev) =>
                            prev.map((item) =>
                              (item.actionId === actionId || item.id === actionId)
                                ? { ...item, status: 'COMPLETED', completedAt: new Date().toISOString() }
                                : item
                            )
                          );
                        }}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 transition"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Marcar Ejecutada
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-emerald-700" /> Completada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. CONTENIDO PRINCIPAL: VISTA TABULAR */}
      {!isLoading && filteredActions.length > 0 && viewMode === 'TABLE' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Plazo</th>
                  <th className="py-3 px-4">Acción / Recomendación</th>
                  <th className="py-3 px-4">Origen</th>
                  <th className="py-3 px-4">Impacto</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Dictamen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActions.map((action) => {
                  const actionId = safeString(action.actionId || action.id, 'ACT-UNKNOWN');
                  const horizon = action.horizon || action.timeframe || 'HOY';
                  const priority = action.priority || 'MEDIUM';
                  const status = action.status || 'OPEN';
                  const sourceInfo = getSourceBadge(action.source || action.domain);

                  return (
                    <tr key={actionId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getPriorityBadgeStyle(priority)}`}>
                          {getPriorityLabel(priority)}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getHorizonBadgeStyle(horizon)}`}>
                          {getHorizonLabel(horizon)}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{safeString(action.title)}</div>
                        <div className="text-[11px] text-slate-500 truncate">{safeString(action.description)}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sourceInfo.style}`}>
                          {sourceInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-700 font-bold">
                        {safeFormatCurrency(action.financialImpactMXN || action.expectedFinancialImpact)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {safeString(action.ownerName || action.assignedRole, 'Por asignar')}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeStyle(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(action)}
                          className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <Eye className="h-3 w-3" /> Dictaminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. MODAL DE DECISIÓN Y DICTAMEN HUMANO (HUMAN-IN-THE-LOOP) */}
      {selectedActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header del Modal */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {safeString(selectedActionModal.actionId || selectedActionModal.id)}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getPriorityBadgeStyle(selectedActionModal.priority)}`}>
                    {getPriorityLabel(selectedActionModal.priority)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getHorizonBadgeStyle(selectedActionModal.horizon || selectedActionModal.timeframe)}`}>
                    {getHorizonLabel(selectedActionModal.horizon || selectedActionModal.timeframe)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Dictamen y Resolución de Acción Priorizada
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActionModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              {/* Notificación de Éxito si aplica */}
              {decisionSuccessMsg && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{decisionSuccessMsg}</span>
                </div>
              )}

              {/* Qué se recomienda */}
              <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Propuesta / Recomendación Ejecutiva
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {safeString(selectedActionModal.title)}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {safeString(selectedActionModal.description)}
                </p>
              </div>

              {/* Origen y Explicabilidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Origen de la Señal</span>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const badge = getSourceBadge(selectedActionModal.source || selectedActionModal.domain);
                      return (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.style}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Generado por motor de análisis transversal de control interno y riesgos.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Impacto Financiero / Mitigación</span>
                  <div className="font-mono text-emerald-700 font-bold text-sm">
                    {safeFormatCurrency(selectedActionModal.financialImpactMXN || selectedActionModal.expectedFinancialImpact)}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {safeString(selectedActionModal.riskImpact || selectedActionModal.expectedRiskReduction, 'Mitigación de riesgo operacional')}
                  </p>
                </div>
              </div>

              {/* Trazabilidad y Transacción Maestra */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Trazabilidad de Control</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500">Folio Auditoría:</span>{' '}
                    <b className="text-slate-800">{safeString(selectedActionModal.auditId, 'AUD-ACT-000')}</b>
                  </div>
                  {selectedActionModal.masterTransactionId && (
                    <div>
                      <span className="text-slate-500">TX Maestra:</span>{' '}
                      <b className="text-slate-800">{selectedActionModal.masterTransactionId}</b>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Responsable Actual:</span>{' '}
                    <b className="text-slate-800">{safeString(selectedActionModal.ownerName || selectedActionModal.assignedRole, 'Por Asignar')}</b>
                  </div>
                  <div>
                    <span className="text-slate-500">Fecha Límite:</span>{' '}
                    <b className="text-slate-800">{safeFormatDate(selectedActionModal.dueDate || selectedActionModal.deadlineDate)}</b>
                  </div>
                </div>
              </div>

              {/* PROTOCOLO HUMAN-IN-THE-LOOP BANNER */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-700 shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-amber-900">
                    Protocolo Human-in-the-Loop de Gobierno
                  </h5>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Esta acción directiva no ejecuta compras, cancelaciones ni modificaciones de inventario de forma automática.
                    Cualquier decisión requiere dictamen humano y es turnada como solicitud formal al módulo correspondiente (Compras, Finanzas o Ventas).
                  </p>
                </div>
              </div>

              {/* Formulario de Dictamen */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h5 className="font-bold text-slate-900 text-xs">Formulario de Resolución y Dictamen</h5>

                {/* Seleccionar Estado Destino */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetStatus('IN_PROGRESS')}
                    className={`p-2.5 rounded-lg border text-center font-bold text-xs transition ${
                      targetStatus === 'IN_PROGRESS'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-400/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <PlayCircle className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                    En Proceso
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('COMPLETED')}
                    className={`p-2.5 rounded-lg border text-center font-bold text-xs transition ${
                      targetStatus === 'COMPLETED'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                    Completada / Ejecutada
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('CANCELLED')}
                    className={`p-2.5 rounded-lg border text-center font-bold text-xs transition ${
                      targetStatus === 'CANCELLED'
                        ? 'border-slate-500 bg-slate-100 text-slate-800 ring-2 ring-slate-400/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Ban className="h-4 w-4 mx-auto mb-1 text-slate-600" />
                    Descartar / Cancelar
                  </button>
                </div>

                {/* Reasignar Responsable */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Reasignar Responsable (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newAssigneeName}
                    onChange={(e) => setNewAssigneeName(e.target.value)}
                    placeholder={safeString(selectedActionModal.ownerName || selectedActionModal.assignedRole, 'Nombre del nuevo responsable')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Notas de Dictamen */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Notas y Justificación del Dictamen (Auditoría Inmutable)
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Documente la justificación, acuerdo del comité o número de trámite operativo asociado..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedActionModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleSaveDecision}
                disabled={isSubmittingDecision}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition"
              >
                {isSubmittingDecision ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Guardar Dictamen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente envuelto en ErrorBoundary resiliente
export const GovernanceExecutiveActionView: React.FC<GovernanceExecutiveActionViewProps> = (props) => {
  return (
    <GovernanceActionsErrorBoundary>
      <GovernanceExecutiveActionViewContent {...props} />
    </GovernanceActionsErrorBoundary>
  );
};
