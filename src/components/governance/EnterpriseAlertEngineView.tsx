/**
 * @license
 * CONSCORE ERP IA - Enterprise Alert Engine View
 * FASE 13 - Motor Empresarial de Alertas, Protocolos de Mitigación y Flujo de Atención
 * HOTFIX DEFINITIVO - OBSERVACIÓN 34: Motor de Alertas Resiliente y Libre de Pantallas Blancas
 */

import React, { useState, useEffect, useMemo, Component, ErrorInfo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Layers,
  ArrowRight,
  UserCheck,
  Zap,
  RefreshCw,
  Eye,
  X,
  Copy,
  Check,
  DollarSign,
  FileText,
  GitBranch,
  Building,
  User,
  AlertCircle,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import {
  EnterpriseAlert,
  AlertSeverity,
  AlertStatus,
  AlertDomain,
} from '../../types/governanceRiskComplianceTypes';
import { ERPModule } from '../../types/erp';

// ==========================================
// ERROR BOUNDARY LOCAL PARA MOTOR DE ALERTAS
// ==========================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class EnterpriseAlertEngineErrorBoundary extends (Component as any)<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  props!: any;
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado al inicializar el Motor de Alertas.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EnterpriseAlertEngine caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center space-y-4 my-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <ShieldAlert className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-900">
              No fue posible cargar el Motor de Alertas
            </h3>
            <p className="text-xs text-red-700 max-w-md mx-auto">
              {this.state.errorMessage ||
                'Ocurrió una interrupción al renderizar los eventos de control y alertas.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> REINTENTAR
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// HELPERS DEFENSIVOS DE FORMATO Y SANITIZACIÓN
// ==========================================
const SENSITIVE_REGEX =
  /(["']?(?:password|passwordHash|password_hash|hash|salt|secret|token|apiKey|api_key|access_token|refreshToken)["']?\s*[:=]\s*["'])([^"'\s]+)(["'])/gi;

export const sanitizeAlertString = (str?: any): string => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(SENSITIVE_REGEX, '$1[REDACTED]$3');
};

export const formatAlertTimestamp = (rawDate?: any): string => {
  if (!rawDate) return '—';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      return typeof rawDate === 'string' ? rawDate : '—';
    }
    return d.toISOString().replace('T', ' ').substring(0, 16);
  } catch {
    return '—';
  }
};

export const formatCurrencyMXN = (val?: number): string => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00 MXN';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(val);
};

// Accessors tolerantes a discrepancias de esquemas
export const getAlertId = (a: EnterpriseAlert): string => {
  return a.alertId || (a as any).id || (a as any).code || 'ALT-N/A';
};

export const getAlertCode = (a: EnterpriseAlert): string => {
  return (a as any).code || a.alertId || (a as any).id || 'ALT-N/A';
};

export const getAlertTitle = (a: EnterpriseAlert): string => {
  if ((a as any).title) return String((a as any).title);
  if (a.type) return String(a.type).replace(/_/g, ' ');
  return 'Alerta de Control Interno';
};

export const getAlertDescription = (a: EnterpriseAlert): string => {
  return a.description || 'Sin descripción detallada del incidente.';
};

export const getAlertSeverity = (a: EnterpriseAlert): AlertSeverity => {
  const sev = (a.severity || 'MEDIUM').toUpperCase();
  if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(sev)) {
    return sev as AlertSeverity;
  }
  return 'MEDIUM';
};

export const getAlertStatus = (a: EnterpriseAlert): AlertStatus => {
  const stat = (a.status || 'OPEN').toUpperCase();
  if (stat === 'ACTIVE') return 'OPEN';
  if (['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'].includes(stat)) {
    return stat as AlertStatus;
  }
  return 'OPEN';
};

export const getAlertDomain = (a: EnterpriseAlert): AlertDomain => {
  const dom = (a.domain || 'GOBIERNO').toUpperCase();
  const validDomains: AlertDomain[] = [
    'FINANZAS',
    'VENTAS',
    'INVENTARIO',
    'LOGISTICA',
    'RH',
    'CLIENTES',
    'SEGURIDAD',
    'COMPLIANCE',
    'GOBIERNO',
  ];
  if (validDomains.includes(dom as AlertDomain)) {
    return dom as AlertDomain;
  }
  return 'GOBIERNO';
};

export const getAlertRemediation = (a: EnterpriseAlert): string => {
  return (
    a.recommendedAction ||
    (a as any).suggestedRemediation ||
    'Aplicar protocolo preventivo conforme al marco de gobierno corporativo.'
  );
};

export const getAlertOwner = (a: EnterpriseAlert): string => {
  return a.ownerName || (a as any).ownerRole || 'Dirección / Auditoría';
};

export const getAlertDate = (a: EnterpriseAlert): string => {
  return a.detectedAt || (a as any).timestamp || (a as any).createdAt || '';
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export interface EnterpriseAlertEngineViewProps {
  alerts?: EnterpriseAlert[];
  onAcknowledgeAlert?: (alertId: string, userName: string) => void;
  onResolveAlert?: (alertId: string, note: string) => void;
  onDismissAlert?: (alertId: string, reason: string) => void;
  onAlertsUpdated?: (alerts: EnterpriseAlert[]) => void;
}

export const EnterpriseAlertEngineViewContent: React.FC<EnterpriseAlertEngineViewProps> = ({
  alerts: initialPropAlerts = [],
  onAcknowledgeAlert,
  onResolveAlert,
  onDismissAlert,
  onAlertsUpdated,
}) => {
  // Lista local de alertas (sincronizada con backend o props)
  const [alertsList, setAlertsList] = useState<EnterpriseAlert[]>(() =>
    Array.isArray(initialPropAlerts) ? initialPropAlerts : []
  );

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('TODAS');
  const [selectedDomain, setSelectedDomain] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modales
  const [selectedAlertForDetail, setSelectedAlertForDetail] = useState<EnterpriseAlert | null>(null);
  const [acknowledgeModalAlert, setAcknowledgeModalAlert] = useState<EnterpriseAlert | null>(null);
  const [acknowledgeNote, setAcknowledgeNote] = useState('');
  const [resolveModalAlert, setResolveModalAlert] = useState<EnterpriseAlert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [dismissModalAlert, setDismissModalAlert] = useState<EnterpriseAlert | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Formulario de nueva alerta
  const [newAlertType, setNewAlertType] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState<AlertSeverity>('HIGH');
  const [newAlertDomain, setNewAlertDomain] = useState<AlertDomain>('FINANZAS');
  const [newAlertModule, setNewAlertModule] = useState<ERPModule>('FINANZAS');
  const [newAlertEntityName, setNewAlertEntityName] = useState('');
  const [newAlertEntityId, setNewAlertEntityId] = useState('');
  const [newAlertDescription, setNewAlertDescription] = useState('');
  const [newAlertRemediation, setNewAlertRemediation] = useState('');
  const [newAlertFinancialImpact, setNewAlertFinancialImpact] = useState<string>('');
  const [newAlertTxId, setNewAlertTxId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sincronizar si cambian las props iniciales
  useEffect(() => {
    if (Array.isArray(initialPropAlerts) && initialPropAlerts.length > 0) {
      setAlertsList(initialPropAlerts);
    }
  }, [initialPropAlerts]);

  // Carga proactiva desde endpoint backend seguro
  const fetchAlertsFromBackend = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const res = await fetch('/api/governance/alerts');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.alerts)) {
          setAlertsList(data.alerts);
          if (onAlertsUpdated) {
            onAlertsUpdated(data.alerts);
          }
          return;
        }
      }
      // Fallback a props si la respuesta no contiene alertas
      if (Array.isArray(initialPropAlerts) && initialPropAlerts.length > 0) {
        setAlertsList(initialPropAlerts);
      }
    } catch (err: any) {
      console.warn('Backend alerts endpoint no disponible o en fallback:', err?.message);
      if (Array.isArray(initialPropAlerts) && initialPropAlerts.length > 0) {
        setAlertsList(initialPropAlerts);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsFromBackend();
  }, []);

  // Dominios disponibles de manera dinámica y segura
  const availableDomains = useMemo(() => {
    const defaultDomains: AlertDomain[] = [
      'FINANZAS',
      'VENTAS',
      'INVENTARIO',
      'LOGISTICA',
      'RH',
      'CLIENTES',
      'SEGURIDAD',
      'COMPLIANCE',
      'GOBIERNO',
    ];
    const extracted = alertsList.map((a) => getAlertDomain(a));
    return ['TODAS', ...Array.from(new Set([...defaultDomains, ...extracted]))];
  }, [alertsList]);

  // Filtrado defensivo
  const filteredAlerts = useMemo(() => {
    return alertsList.filter((alert) => {
      if (!alert) return false;
      const id = getAlertId(alert).toLowerCase();
      const code = getAlertCode(alert).toLowerCase();
      const title = getAlertTitle(alert).toLowerCase();
      const desc = getAlertDescription(alert).toLowerCase();
      const entity = (alert.entityName || '').toLowerCase();
      const owner = getAlertOwner(alert).toLowerCase();
      const mtx = (alert.masterTransactionId || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !q ||
        id.includes(q) ||
        code.includes(q) ||
        title.includes(q) ||
        desc.includes(q) ||
        entity.includes(q) ||
        owner.includes(q) ||
        mtx.includes(q);

      const alertSev = getAlertSeverity(alert);
      const matchesSeverity = selectedSeverity === 'TODAS' || alertSev === selectedSeverity;

      const alertDom = getAlertDomain(alert);
      const matchesDomain = selectedDomain === 'TODAS' || alertDom === selectedDomain;

      const alertStat = getAlertStatus(alert);
      const matchesStatus = selectedStatus === 'TODAS' || alertStat === selectedStatus;

      return matchesSearch && matchesSeverity && matchesDomain && matchesStatus;
    });
  }, [alertsList, searchTerm, selectedSeverity, selectedDomain, selectedStatus]);

  // Métricas y KPIs calculados en tiempo real
  const metrics = useMemo(() => {
    const total = alertsList.length;
    const active = alertsList.filter((a) => {
      const s = getAlertStatus(a);
      return s === 'OPEN' || s === 'IN_PROGRESS' || s === 'ACKNOWLEDGED';
    }).length;
    const criticalOrHigh = alertsList.filter((a) => {
      const s = getAlertSeverity(a);
      return s === 'CRITICAL' || s === 'HIGH';
    }).length;
    const resolvedOrDismissed = alertsList.filter((a) => {
      const s = getAlertStatus(a);
      return s === 'RESOLVED' || s === 'DISMISSED';
    }).length;
    const totalFinancialImpact = alertsList.reduce(
      (sum, a) => sum + (Number(a.financialImpactEstimatedMXN) || 0),
      0
    );

    return { total, active, criticalOrHigh, resolvedOrDismissed, totalFinancialImpact };
  }, [alertsList]);

  // Estilos y badges
  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'INFO':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusBadge = (stat: AlertStatus) => {
    switch (stat) {
      case 'OPEN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ACKNOWLEDGED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DISMISSED':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDomainColor = (domain: AlertDomain) => {
    switch (domain) {
      case 'FINANZAS':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'INVENTARIO':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'VENTAS':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'LOGISTICA':
        return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      case 'SEGURIDAD':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'COMPLIANCE':
      case 'GOBIERNO':
      default:
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    }
  };

  // Copiar al portapapeles
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Acciones Human-in-the-Loop
  const handleConfirmAcknowledge = async () => {
    if (!acknowledgeModalAlert) return;
    const id = getAlertId(acknowledgeModalAlert);
    const userName = 'Dirección General (Operador Autorizado)';

    try {
      await fetch(`/api/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: acknowledgeNote }),
      });
    } catch (e) {
      console.warn('Endpoint backend no disponible:', e);
    }

    if (onAcknowledgeAlert) {
      onAcknowledgeAlert(id, userName);
    }

    const updated = alertsList.map((a) =>
      getAlertId(a) === id
        ? {
            ...a,
            status: 'ACKNOWLEDGED' as AlertStatus,
            acknowledgedBy: userName,
            acknowledgedAt: new Date().toISOString(),
          }
        : a
    );
    setAlertsList(updated);
    if (onAlertsUpdated) onAlertsUpdated(updated);

    setAcknowledgeModalAlert(null);
    setAcknowledgeNote('');
  };

  const handleSetInProgress = async (alert: EnterpriseAlert) => {
    const id = getAlertId(alert);
    try {
      await fetch(`/api/alerts/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.warn('Endpoint backend no disponible:', e);
    }

    const updated = alertsList.map((a) =>
      getAlertId(a) === id ? { ...a, status: 'IN_PROGRESS' as AlertStatus } : a
    );
    setAlertsList(updated);
    if (onAlertsUpdated) onAlertsUpdated(updated);
  };

  const handleConfirmResolve = async () => {
    if (!resolveModalAlert) return;
    const note = resolutionNote.trim() || 'Subsanado conforme al protocolo institucional.';
    const id = getAlertId(resolveModalAlert);

    try {
      await fetch(`/api/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
    } catch (e) {
      console.warn('Endpoint backend no disponible:', e);
    }

    if (onResolveAlert) {
      onResolveAlert(id, note);
    }

    const updated = alertsList.map((a) =>
      getAlertId(a) === id
        ? {
            ...a,
            status: 'RESOLVED' as AlertStatus,
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'Dirección General / Auditoría',
            resolutionNotes: note,
          }
        : a
    );
    setAlertsList(updated);
    if (onAlertsUpdated) onAlertsUpdated(updated);

    setResolveModalAlert(null);
    setResolutionNote('');
  };

  const handleConfirmDismiss = async () => {
    if (!dismissModalAlert) return;
    const reason = dismissReason.trim();
    if (!reason) {
      alert('Es obligatorio especificar el motivo institucional de descarte.');
      return;
    }
    const id = getAlertId(dismissModalAlert);

    try {
      await fetch(`/api/alerts/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch (e) {
      console.warn('Endpoint backend no disponible:', e);
    }

    if (onDismissAlert) {
      onDismissAlert(id, reason);
    }

    const updated = alertsList.map((a) =>
      getAlertId(a) === id
        ? {
            ...a,
            status: 'DISMISSED' as AlertStatus,
            dismissedAt: new Date().toISOString(),
            dismissedBy: 'Dirección General',
            dismissReason: reason,
          }
        : a
    );
    setAlertsList(updated);
    if (onAlertsUpdated) onAlertsUpdated(updated);

    setDismissModalAlert(null);
    setDismissReason('');
  };

  const handleCreateNewAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newAlertType.trim() || !newAlertDescription.trim()) {
      setFormError('Por favor complete el tipo y la descripción de la alerta.');
      return;
    }

    const newAlert: EnterpriseAlert = {
      alertId: `ALT-${Date.now().toString(36).toUpperCase()}`,
      type: newAlertType.trim().toUpperCase().replace(/\s+/g, '_'),
      severity: newAlertSeverity,
      domain: newAlertDomain,
      module: newAlertModule,
      entityName: newAlertEntityName.trim() || undefined,
      entityId: newAlertEntityId.trim() || undefined,
      description: newAlertDescription.trim(),
      detectedAt: new Date().toISOString(),
      ownerId: 'USR-DIR-01',
      ownerName: 'Dirección General',
      status: 'OPEN',
      recommendedAction:
        newAlertRemediation.trim() ||
        'Revisión y protocolo preventivo por el responsable de área asignado.',
      auditId: `AUD-MAN-${Date.now().toString(36).toUpperCase()}`,
      masterTransactionId: newAlertTxId.trim() || undefined,
      financialImpactEstimatedMXN: Number(newAlertFinancialImpact) || 0,
    };

    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      });
    } catch (e) {
      console.warn('Endpoint de creación no disponible:', e);
    }

    const updated = [newAlert, ...alertsList];
    setAlertsList(updated);
    if (onAlertsUpdated) onAlertsUpdated(updated);

    setIsCreateModalOpen(false);
    setNewAlertType('');
    setNewAlertDescription('');
    setNewAlertEntityName('');
    setNewAlertEntityId('');
    setNewAlertRemediation('');
    setNewAlertFinancialImpact('');
    setNewAlertTxId('');
  };

  return (
    <div className="space-y-6">
      {/* Header Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Motor Empresarial de Alertas & Incidentes en Tiempo Real
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitoreo continuo de transacciones, límites presupuestarios, discrepancias de inventario
            y desvíos de control interno.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchAlertsFromBackend}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar Incidente
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Estado Ejecutivo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Alertas</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.total}</p>
          <span className="text-[11px] text-slate-500">Eventos monitoreados</span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Activas</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{metrics.active}</p>
          <span className="text-[11px] text-amber-800 font-medium">Requieren atención</span>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-xs font-bold uppercase tracking-wider">Críticas / Altas</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-900">{metrics.criticalOrHigh}</p>
          <span className="text-[11px] text-red-800 font-medium">Riesgo prioritario</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Subsanadas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">
            {metrics.resolvedOrDismissed}
          </p>
          <span className="text-[11px] text-emerald-800 font-medium">Cerradas / Dispensadas</span>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Exposición</span>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-lg font-black text-slate-900 truncate">
            {formatCurrencyMXN(metrics.totalFinancialImpact)}
          </p>
          <span className="text-[11px] text-slate-500">Impacto financiero</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Multidominio */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, ID, descripción, entidad, responsable o MTX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-500">Severidad:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                <option value="TODAS">Todas</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
                <option value="INFO">INFO</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-500">Dominio:</span>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                {availableDomains.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-500">Estado:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                <option value="TODAS">Todos</option>
                <option value="OPEN">Abiertas (OPEN)</option>
                <option value="ACKNOWLEDGED">Acusadas (ACK)</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="RESOLVED">Resueltas</option>
                <option value="DISMISSED">Dispensadas</option>
              </select>
            </div>

            {/* Selector de vista */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 ml-auto">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 text-xs font-bold rounded ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 text-xs font-bold rounded ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabla
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de filtros aplicados */}
        {(selectedSeverity !== 'TODAS' ||
          selectedDomain !== 'TODAS' ||
          selectedStatus !== 'TODAS' ||
          searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
            <span className="text-slate-500 font-medium">Filtros activos:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                Texto: "{searchTerm}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
              </span>
            )}
            {selectedSeverity !== 'TODAS' && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                Severidad: {selectedSeverity}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSeverity('TODAS')} />
              </span>
            )}
            {selectedDomain !== 'TODAS' && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                Dominio: {selectedDomain}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDomain('TODAS')} />
              </span>
            )}
            {selectedStatus !== 'TODAS' && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                Estado: {selectedStatus}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStatus('TODAS')} />
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSeverity('TODAS');
                setSelectedDomain('TODAS');
                setSelectedStatus('TODAS');
              }}
              className="text-red-600 hover:text-red-700 font-bold text-[11px] underline ml-1"
            >
              Limpiar todos
            </button>
            <span className="text-slate-400 ml-auto text-[11px]">
              {filteredAlerts.length} de {alertsList.length} alertas encontradas
            </span>
          </div>
        )}
      </div>

      {/* Estado: CARGANDO */}
      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 text-red-600 animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-700">Sincronizando Motor de Alertas...</p>
          <p className="text-xs text-slate-500">
            Consultando registros de auditoría y desvíos operacionales en tiempo real.
          </p>
        </div>
      )}

      {/* Estado: ERROR */}
      {errorState && !isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">{errorState}</h3>
          <button
            onClick={fetchAlertsFromBackend}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar Carga
          </button>
        </div>
      )}

      {/* Estado: VACÍO (EMPTY STATE) */}
      {!isLoading && !errorState && filteredAlerts.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <ShieldCheck className="h-8 w-8 text-slate-500" />
            </div>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron alertas registradas
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {alertsList.length === 0
              ? 'El sistema no tiene incidentes ni alertas registradas en este momento.'
              : 'No hay alertas que coincidan con los criterios de búsqueda o filtros seleccionados.'}
          </p>
          {(searchTerm ||
            selectedSeverity !== 'TODAS' ||
            selectedDomain !== 'TODAS' ||
            selectedStatus !== 'TODAS') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSeverity('TODAS');
                setSelectedDomain('TODAS');
                setSelectedStatus('TODAS');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      )}

      {/* Estado: ÉXITO (LISTADO DE ALERTAS) */}
      {!isLoading && !errorState && filteredAlerts.length > 0 && viewMode === 'CARDS' && (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const alertId = getAlertId(alert);
            const code = getAlertCode(alert);
            const title = getAlertTitle(alert);
            const desc = getAlertDescription(alert);
            const sev = getAlertSeverity(alert);
            const stat = getAlertStatus(alert);
            const dom = getAlertDomain(alert);
            const owner = getAlertOwner(alert);
            const remediation = getAlertRemediation(alert);
            const dateFormatted = formatAlertTimestamp(getAlertDate(alert));
            const impact = Number(alert.financialImpactEstimatedMXN) || 0;

            return (
              <div
                key={alertId}
                className={`rounded-xl border p-4 transition-all shadow-2xs ${
                  stat === 'OPEN'
                    ? 'border-red-200 bg-red-50/20 hover:border-red-300'
                    : stat === 'ACKNOWLEDGED'
                    ? 'border-blue-200 bg-blue-50/20 hover:border-blue-300'
                    : stat === 'IN_PROGRESS'
                    ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                    : stat === 'RESOLVED'
                    ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                    : 'border-slate-200 bg-slate-50/40 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Contenido principal */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                        {code}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                          sev
                        )}`}
                      >
                        {sev}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDomainColor(
                          dom
                        )}`}
                      >
                        {dom}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                          stat
                        )}`}
                      >
                        {stat}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dateFormatted}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                        {sanitizeAlertString(desc)}
                      </p>
                    </div>

                    {/* Metadatos adicionales */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
                      {alert.entityName && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{alert.entityName}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>Responsable:</span>
                        <strong className="text-slate-800">{owner}</strong>
                      </span>
                      {impact > 0 && (
                        <span className="flex items-center gap-1 font-bold text-red-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          Impacto: {formatCurrencyMXN(impact)}
                        </span>
                      )}
                      {alert.masterTransactionId && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          <GitBranch className="h-3 w-3" />
                          {alert.masterTransactionId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones Human-in-the-Loop */}
                  <div className="flex lg:flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedAlertForDetail(alert)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        Detalle
                      </button>

                      {stat === 'OPEN' && (
                        <button
                          onClick={() => setAcknowledgeModalAlert(alert)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 shadow-2xs transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Acusar Recibo
                        </button>
                      )}

                      {(stat === 'OPEN' || stat === 'ACKNOWLEDGED') && (
                        <button
                          onClick={() => handleSetInProgress(alert)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 shadow-2xs transition-colors"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          En Proceso
                        </button>
                      )}

                      {stat !== 'RESOLVED' && (
                        <button
                          onClick={() => setResolveModalAlert(alert)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolver
                        </button>
                      )}

                      {stat !== 'DISMISSED' && stat !== 'RESOLVED' && (
                        <button
                          onClick={() => setDismissModalAlert(alert)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 shadow-2xs transition-colors"
                        >
                          Dispensar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Protocolo de Solución sugerido */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                    <span className="font-bold text-slate-900 block text-[11px] mb-0.5 flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-600" />
                      Protocolo Sugerido / Remediation:
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {sanitizeAlertString(remediation)}
                    </p>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-slate-700 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">
                        Seguimiento y Cierre:
                      </span>
                      {alert.acknowledgedBy && (
                        <p className="text-[11px] text-blue-800">
                          Acusada por: <strong>{alert.acknowledgedBy}</strong> (
                          {formatAlertTimestamp(alert.acknowledgedAt)})
                        </p>
                      )}
                      {alert.resolvedAt && (
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          Resuelta el {formatAlertTimestamp(alert.resolvedAt)} por{' '}
                          {alert.resolvedBy || 'Dirección'}.
                          {alert.resolutionNotes && (
                            <span className="block text-slate-600 font-normal">
                              Nota: {sanitizeAlertString(alert.resolutionNotes)}
                            </span>
                          )}
                        </p>
                      )}
                      {alert.dismissedAt && (
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Dispensada el {formatAlertTimestamp(alert.dismissedAt)} por{' '}
                          {alert.dismissedBy || 'Dirección'}.
                          {alert.dismissReason && (
                            <span className="block text-slate-500 font-normal">
                              Motivo: {sanitizeAlertString(alert.dismissReason)}
                            </span>
                          )}
                        </p>
                      )}
                      {!alert.acknowledgedBy && !alert.resolvedAt && !alert.dismissedAt && (
                        <p className="text-[11px] text-slate-400 italic">
                          Pendiente de acuse de recibo y ejecución de protocolo.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista TABLA ejecutiva */}
      {!isLoading && !errorState && filteredAlerts.length > 0 && viewMode === 'TABLE' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código / ID</th>
                  <th className="py-3 px-4">Severidad</th>
                  <th className="py-3 px-4">Dominio</th>
                  <th className="py-3 px-4">Título & Incidente</th>
                  <th className="py-3 px-4">Impacto</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alert) => {
                  const alertId = getAlertId(alert);
                  const code = getAlertCode(alert);
                  const title = getAlertTitle(alert);
                  const sev = getAlertSeverity(alert);
                  const stat = getAlertStatus(alert);
                  const dom = getAlertDomain(alert);
                  const owner = getAlertOwner(alert);
                  const impact = Number(alert.financialImpactEstimatedMXN) || 0;

                  return (
                    <tr key={alertId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{code}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border ${getSeverityBadge(
                            sev
                          )}`}
                        >
                          {sev}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDomainColor(
                            dom
                          )}`}
                        >
                          {dom}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{title}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {sanitizeAlertString(getAlertDescription(alert))}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {impact > 0 ? formatCurrencyMXN(impact) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{owner}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                            stat
                          )}`}
                        >
                          {stat}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedAlertForDetail(alert)}
                          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {stat === 'OPEN' && (
                          <button
                            onClick={() => setAcknowledgeModalAlert(alert)}
                            className="p-1 rounded text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                            title="Acusar Recibo"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        {stat !== 'RESOLVED' && (
                          <button
                            onClick={() => setResolveModalAlert(alert)}
                            className="p-1 rounded text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50"
                            title="Resolver"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE DETALLE DE ALERTA                 */}
      {/* ========================================== */}
      {selectedAlertForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                    {getAlertCode(selectedAlertForDetail)}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${getSeverityBadge(
                      getAlertSeverity(selectedAlertForDetail)
                    )}`}
                  >
                    {getAlertSeverity(selectedAlertForDetail)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                      getAlertStatus(selectedAlertForDetail)
                    )}`}
                  >
                    {getAlertStatus(selectedAlertForDetail)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {getAlertTitle(selectedAlertForDetail)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlertForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Descripción del Evento:</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {sanitizeAlertString(getAlertDescription(selectedAlertForDetail))}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block text-[11px]">Dominio / Módulo:</span>
                  <p className="text-slate-800 font-medium">
                    {getAlertDomain(selectedAlertForDetail)} · {selectedAlertForDetail.module || 'GENERAL'}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block text-[11px]">Fecha de Detección:</span>
                  <p className="text-slate-800 font-mono">
                    {formatAlertTimestamp(getAlertDate(selectedAlertForDetail))}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block text-[11px]">Entidad Afectada:</span>
                  <p className="text-slate-800">
                    {selectedAlertForDetail.entityName || 'No especificada'}{' '}
                    {selectedAlertForDetail.entityId && (
                      <span className="text-slate-500 font-mono">({selectedAlertForDetail.entityId})</span>
                    )}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block text-[11px]">Impacto Financiero Estimado:</span>
                  <p className="text-red-700 font-bold">
                    {formatCurrencyMXN(selectedAlertForDetail.financialImpactEstimatedMXN)}
                  </p>
                </div>
              </div>

              {/* Trazabilidad y Auditoría */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                <span className="font-bold text-blue-900 block text-[11px]">
                  Trazabilidad Institucional y Cadena de Custodia:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">ID de Auditoría:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedAlertForDetail.auditId || 'AUD-SYS-001'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Master Transaction ID:</span>
                    <span className="font-mono font-bold text-blue-800 flex items-center gap-1">
                      {selectedAlertForDetail.masterTransactionId || 'No vinculado a MTX'}
                      {selectedAlertForDetail.masterTransactionId && (
                        <button
                          onClick={() =>
                            handleCopy(
                              selectedAlertForDetail.masterTransactionId || '',
                              'detail-mtx'
                            )
                          }
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {copiedId === 'detail-mtx' ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Protocolo de Solución */}
              <div>
                <span className="font-bold text-slate-900 block mb-1">Protocolo Sugerido:</span>
                <p className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-amber-950 leading-relaxed">
                  {sanitizeAlertString(getAlertRemediation(selectedAlertForDetail))}
                </p>
              </div>

              {/* Bitácora de Cierre si aplica */}
              {(selectedAlertForDetail.resolutionNotes ||
                selectedAlertForDetail.dismissReason) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <span className="font-bold text-slate-900 block">
                    {selectedAlertForDetail.status === 'RESOLVED'
                      ? 'Bitácora de Cierre / Solución:'
                      : 'Justificación de Descarte / Dispensa:'}
                  </span>
                  <p className="text-slate-700">
                    {sanitizeAlertString(
                      selectedAlertForDetail.resolutionNotes ||
                        selectedAlertForDetail.dismissReason
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAlertForDetail(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE ACUSE DE RECIBO                   */}
      {/* ========================================== */}
      {acknowledgeModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  {getAlertCode(acknowledgeModalAlert)}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Acusar Recibo de Incidente
                </h3>
              </div>
              <button
                onClick={() => setAcknowledgeModalAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="font-medium text-slate-900">
                {getAlertTitle(acknowledgeModalAlert)}
              </p>
              <p className="text-slate-600">
                Al acusar recibo, confirmas que el equipo de control ha tomado conocimiento del
                incidente y se encuentra iniciando las diligencias operativas o de auditoría
                correspondientes.
              </p>
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nota preliminar de atención (opcional):
                </label>
                <textarea
                  value={acknowledgeNote}
                  onChange={(e) => setAcknowledgeNote(e.target.value)}
                  placeholder="Ej. Se notifica al encargado de compras para cotejar orden con proveedor..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setAcknowledgeModalAlert(null)}
                className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAcknowledge}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                Confirmar Acuse de Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE RESOLUCIÓN DE ALERTA              */}
      {/* ========================================== */}
      {resolveModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  {getAlertCode(resolveModalAlert)}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Cierre y Resolución de Alerta
                </h3>
              </div>
              <button
                onClick={() => setResolveModalAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="font-medium text-slate-900">{getAlertTitle(resolveModalAlert)}</p>
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Bitácora de Solución / Evidencia del Cierre (Requerido):
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe detalladamente las acciones tomadas para mitigar y resolver la alerta conforme a protocolo..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setResolveModalAlert(null)}
                className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResolve}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                Confirmar y Cerrar Alerta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE DISPENSA / DESCARTE               */}
      {/* ========================================== */}
      {dismissModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                  {getAlertCode(dismissModalAlert)}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Dispensa / Descarte Institucional
                </h3>
              </div>
              <button
                onClick={() => setDismissModalAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="font-medium text-slate-900">{getAlertTitle(dismissModalAlert)}</p>
              <p className="text-slate-600">
                La dispensa es una facultad ejecutiva que archiva la alerta bajo justificación
                formal en la bitácora de auditoría inmutable.
              </p>
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Motivo de Descarte / Dispensa (Requerido):
                </label>
                <textarea
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="Ej. Falso positivo verificado por auditoría / Variación tolerada por acuerdo directivo..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-slate-500 focus:outline-hidden"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setDismissModalAlert(null)}
                className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDismiss}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
              >
                Dispensar Alerta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE REGISTRO MANUAL DE ALERTA         */}
      {/* ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  Registrar Incidente o Alerta Operativa
                </h3>
                <p className="text-xs text-slate-500">
                  Alta manual por auditoría o dirección de control interno.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateNewAlert} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tipo / Código del Incidente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. DISCREPANCIA_INVENTARIO_FISICO"
                    value={newAlertType}
                    onChange={(e) => setNewAlertType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Severidad *</label>
                  <select
                    value={newAlertSeverity}
                    onChange={(e) => setNewAlertSeverity(e.target.value as AlertSeverity)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Dominio de Control *</label>
                  <select
                    value={newAlertDomain}
                    onChange={(e) => setNewAlertDomain(e.target.value as AlertDomain)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
                  >
                    <option value="FINANZAS">FINANZAS</option>
                    <option value="VENTAS">VENTAS</option>
                    <option value="INVENTARIO">INVENTARIO</option>
                    <option value="LOGISTICA">LOGISTICA</option>
                    <option value="RH">RH</option>
                    <option value="CLIENTES">CLIENTES</option>
                    <option value="SEGURIDAD">SEGURIDAD</option>
                    <option value="COMPLIANCE">COMPLIANCE</option>
                    <option value="GOBIERNO">GOBIERNO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Módulo del ERP</label>
                  <select
                    value={newAlertModule}
                    onChange={(e) => setNewAlertModule(e.target.value as ERPModule)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
                  >
                    <option value="FINANZAS">FINANZAS</option>
                    <option value="INVENTARIO">INVENTARIO</option>
                    <option value="COTIZACIONES">COTIZACIONES</option>
                    <option value="PEDIDOS">PEDIDOS</option>
                    <option value="LOGISTICA">LOGISTICA</option>
                    <option value="COMPRAS">COMPRAS</option>
                    <option value="CLIENTES">CLIENTES</option>
                    <option value="GOBIERNO">GOBIERNO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Descripción Detallada del Incidente *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detalla los hallazgos observados, discrepancias o anomalías..."
                  value={newAlertDescription}
                  onChange={(e) => setNewAlertDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Entidad / Sujeto</label>
                  <input
                    type="text"
                    placeholder="Ej. Almacén Central Naucalpan"
                    value={newAlertEntityName}
                    onChange={(e) => setNewAlertEntityName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">ID Entidad (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. ALM-001 o SKU-102"
                    value={newAlertEntityId}
                    onChange={(e) => setNewAlertEntityId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Impacto Estimado (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={newAlertFinancialImpact}
                    onChange={(e) => setNewAlertFinancialImpact(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Master Transaction ID (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. TX-2026-0827-001"
                    value={newAlertTxId}
                    onChange={(e) => setNewAlertTxId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Protocolo / Acción Correctiva Sugerida
                </label>
                <textarea
                  rows={2}
                  placeholder="Acción inmediata requerida para mitigar el riesgo..."
                  value={newAlertRemediation}
                  onChange={(e) => setNewAlertRemediation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
                >
                  Registrar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente envuelto en ErrorBoundary resiliente
export const EnterpriseAlertEngineView: React.FC<EnterpriseAlertEngineViewProps> = (props) => {
  return (
    <EnterpriseAlertEngineErrorBoundary>
      <EnterpriseAlertEngineViewContent {...props} />
    </EnterpriseAlertEngineErrorBoundary>
  );
};
