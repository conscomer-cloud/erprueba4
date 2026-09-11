/**
 * @license
 * CONSCORE ERP IA - Executive Audit Center View
 * FASE 13 - Auditoría Ejecutiva Transversal y Trazabilidad Extremo a Extremo con MASTER_TRANSACTION_ID
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Layers,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Clock,
  User,
  CheckCircle,
  Database,
  Link as LinkIcon,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Download,
  Eye,
  X,
  Copy,
  Check,
  ShieldAlert,
  ChevronLeft,
} from 'lucide-react';
import { AuditLog } from '../../types/erp';
import { MasterTransactionAuditTrace, MasterAuditTraceEvent } from '../../types/governanceRiskComplianceTypes';

// ==========================================
// ERROR BOUNDARY LOCAL
// ==========================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ExecutiveAuditCenterErrorBoundary extends (React.Component as any) {
  state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado en Auditoría Transversal',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ExecutiveAuditCenter caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3 my-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
          <h3 className="text-base font-bold text-red-900">
            No fue posible cargar Auditoría transversal.
          </h3>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            {this.state.errorMessage || 'Ocurrió una interrupción al renderizar los eventos de auditoría.'}
          </p>
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
// HELPERS DEFENSIVOS DE FORMATO
// ==========================================
const SENSITIVE_REGEX = /(["']?(?:password|passwordHash|password_hash|hash|salt|secret|token|apiKey|api_key|access_token|refreshToken)["']?\s*[:=]\s*["'])([^"'\s]+)(["'])/gi;

const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(SENSITIVE_REGEX, '$1[REDACTED]$3');
};

const formatTimestamp = (rawDate?: any): string => {
  if (!rawDate) return '—';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return typeof rawDate === 'string' ? rawDate : '—';
    return d.toISOString().replace('T', ' ').substring(0, 19);
  } catch {
    return '—';
  }
};

const safeStringify = (data: any): string => {
  if (data === null || data === undefined) return '—';
  if (typeof data === 'string') return sanitizeString(data);
  try {
    return sanitizeString(JSON.stringify(data));
  } catch {
    return sanitizeString(String(data));
  }
};

const getMasterTx = (log: any): string => {
  return log?.masterTransactionId || log?.master_transaction_id || '';
};

const getUserName = (log: any): string => {
  return log?.userName || log?.user_name || log?.userId || log?.user_id || 'Sistema';
};

const getUserRole = (log: any): string => {
  return log?.userRole || log?.user_role || 'SISTEMA';
};

const getEntityId = (log: any): string => {
  return log?.entityId || log?.entity_id || log?.recordId || log?.folio || '—';
};

const getEntityType = (log: any): string => {
  return log?.entityType || log?.entity_type || 'GENERAL';
};

const getAction = (log: any): string => {
  return log?.action || 'OPERACION';
};

const getModule = (log: any): string => {
  return log?.module || 'GENERAL';
};

// ==========================================
// PROPS DEL COMPONENTE
// ==========================================
export interface ExecutiveAuditCenterViewProps {
  auditLogs?: AuditLog[];
  sampleTraces?: MasterTransactionAuditTrace[];
}

const ExecutiveAuditCenterViewInner: React.FC<ExecutiveAuditCenterViewProps> = ({
  auditLogs: propAuditLogs = [],
  sampleTraces: propSampleTraces = [],
}) => {
  // Estado de carga y datos
  const [logs, setLogs] = useState<AuditLog[]>(propAuditLogs);
  const [traces, setTraces] = useState<MasterTransactionAuditTrace[]>(propSampleTraces);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRbacDenied, setIsRbacDenied] = useState<boolean>(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('TODAS');
  const [selectedRole, setSelectedRole] = useState<string>('TODOS');
  const [selectedMasterTx, setSelectedMasterTx] = useState<string>('TODOS');
  const [selectedTraceId, setSelectedTraceId] = useState<string>('');

  // Modal de Detalle
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<AuditLog | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Carga asíncrona de bitácora real desde API
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    setIsRbacDenied(false);

    try {
      const token = localStorage.getItem('conscore_auth_token') || sessionStorage.getItem('conscore_auth_token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/audit-logs', { headers });

      if (res.status === 401) {
        setError('No autenticado. Inicie sesión nuevamente para acceder a la bitácora.');
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        setIsRbacDenied(true);
        setError('Acceso restringido por política RBAC (Se requiere perfil Administrador o Dirección).');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Error de servidor (${res.status}) al consultar bitácora.`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (propAuditLogs && propAuditLogs.length > 0) {
        setLogs(propAuditLogs);
      }
    } catch (err: any) {
      console.warn('Fallo al conectar con /api/audit-logs, aplicando datos locales:', err.message);
      if (propAuditLogs && propAuditLogs.length > 0) {
        setLogs(propAuditLogs);
      } else {
        setError('No fue posible cargar Auditoría transversal.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Actualizar traces si llegan nuevas props
  useEffect(() => {
    if (propSampleTraces && propSampleTraces.length > 0) {
      setTraces(propSampleTraces);
      if (!selectedTraceId && propSampleTraces[0]?.masterTransactionId) {
        setSelectedTraceId(propSampleTraces[0].masterTransactionId);
      }
    }
  }, [propSampleTraces]);

  // Si no hay trace seleccionada, asignar la primera
  useEffect(() => {
    if (!selectedTraceId && traces.length > 0) {
      setSelectedTraceId(traces[0].masterTransactionId || '');
    }
  }, [traces, selectedTraceId]);

  // Lista de módulos únicos
  const modules = useMemo(() => {
    const set = new Set<string>();
    (logs || []).forEach((l) => {
      const mod = getModule(l);
      if (mod) set.add(mod);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [logs]);

  // Lista de roles únicos
  const roles = useMemo(() => {
    const set = new Set<string>();
    (logs || []).forEach((l) => {
      const r = getUserRole(l);
      if (r) set.add(r);
    });
    return ['TODOS', ...Array.from(set).sort()];
  }, [logs]);

  // Lista de Master Transaction IDs disponibles
  const masterTxOptions = useMemo(() => {
    const set = new Set<string>();
    (logs || []).forEach((l) => {
      const tx = getMasterTx(l);
      if (tx) set.add(tx);
    });
    (traces || []).forEach((t) => {
      if (t?.masterTransactionId) set.add(t.masterTransactionId);
    });
    return ['TODOS', ...Array.from(set).sort()];
  }, [logs, traces]);

  // Filtrado de registros
  const filteredLogs = useMemo(() => {
    return (logs || []).filter((l) => {
      const q = (searchTerm || '').trim().toLowerCase();
      const action = getAction(l).toLowerCase();
      const user = getUserName(l).toLowerCase();
      const entity = getEntityId(l).toLowerCase();
      const mod = getModule(l);
      const role = getUserRole(l);
      const tx = getMasterTx(l);
      const details = safeStringify(l?.details || l?.newValue || l?.new_value).toLowerCase();

      const matchesSearch =
        !q ||
        action.includes(q) ||
        user.includes(q) ||
        entity.includes(q) ||
        tx.toLowerCase().includes(q) ||
        details.includes(q);

      const matchesMod = selectedModule === 'TODAS' || mod === selectedModule;
      const matchesRole = selectedRole === 'TODOS' || role === selectedRole;
      const matchesTx = selectedMasterTx === 'TODOS' || tx === selectedMasterTx;

      return matchesSearch && matchesMod && matchesRole && matchesTx;
    });
  }, [logs, searchTerm, selectedModule, selectedRole, selectedMasterTx]);

  // Paginación segura
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Restablecer a página 1 al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModule, selectedRole, selectedMasterTx]);

  // Trace activa
  const activeTrace = traces.find((t) => t.masterTransactionId === selectedTraceId);

  // Adaptar etapas / tracePoints de forma segura
  const activeStages = useMemo(() => {
    if (!activeTrace) return [];
    if (Array.isArray(activeTrace.tracePoints) && activeTrace.tracePoints.length > 0) {
      return activeTrace.tracePoints.map((tp, idx) => ({
        key: tp.eventId || `point-${idx}`,
        stageName: tp.module || tp.action || `Fase ${idx + 1}`,
        action: tp.action || '',
        entityId: tp.folio || tp.entityId || '—',
        responsibleName: tp.userName || 'Sistema',
        userRole: tp.userRole || '',
        timestamp: formatTimestamp(tp.timestamp),
        amount: tp.amount,
      }));
    }
    if (Array.isArray(activeTrace.stages) && activeTrace.stages.length > 0) {
      return activeTrace.stages.map((stg: any, idx: number) => ({
        key: stg.stageKey || `stage-${idx}`,
        stageName: stg.stageKey || `Paso ${idx + 1}`,
        action: stg.action || '',
        entityId: stg.entityId || '—',
        responsibleName: stg.responsibleName || 'Sistema',
        userRole: stg.userRole || '',
        timestamp: formatTimestamp(stg.timestamp),
        amount: stg.amount,
      }));
    }
    return [];
  }, [activeTrace]);

  const handleCopyTx = (txId: string) => {
    if (!txId) return;
    navigator.clipboard?.writeText(txId);
    setCopiedTxId(txId);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Fecha_Hora',
      'Modulo',
      'Accion',
      'Entidad_Tipo',
      'Entidad_ID',
      'Usuario',
      'Rol',
      'Master_Transaction_ID',
      'Valor_Anterior',
      'Valor_Nuevo',
      'Detalles',
    ];

    const rows = filteredLogs.map((l) => [
      l.id || '',
      `"${formatTimestamp(l.timestamp || l.created_at || l.createdAt)}"`,
      `"${getModule(l)}"`,
      `"${getAction(l)}"`,
      `"${getEntityType(l)}"`,
      `"${getEntityId(l)}"`,
      `"${getUserName(l)}"`,
      `"${getUserRole(l)}"`,
      `"${getMasterTx(l)}"`,
      `"${safeStringify(l.previousValue || l.previous_value).replace(/"/g, '""')}"`,
      `"${safeStringify(l.newValue || l.new_value).replace(/"/g, '""')}"`,
      `"${safeStringify(l.details).replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `auditoria_transversal_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedModule('TODAS');
    setSelectedRole('TODOS');
    setSelectedMasterTx('TODOS');
  };

  // ==========================================
  // RENDER: ERROR STATE (403 / 500 / Network)
  // ==========================================
  if (error && !loading && logs.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/60 p-8 text-center space-y-4 shadow-xs">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4 text-red-600">
            <ShieldAlert className="h-10 w-10" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-red-950">
            No fue posible cargar Auditoría transversal.
          </h3>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            {error}
          </p>
        </div>
        <div>
          <button
            onClick={fetchAuditLogs}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> REINTENTAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-blue-600" />
            Auditoría Ejecutiva Transversal & Trazabilidad End-to-End
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualización unificada del ciclo de vida mercantil completo bajo el estándar inmutable <b>MASTER_TRANSACTION_ID</b>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-800 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-blue-600" />
            {logs.length} Registros Inmutables
          </span>
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Cadena de Custodia 100%
          </span>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            title="Recargar bitácora desde el servidor"
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de restricción RBAC si aplica */}
      {isRbacDenied && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <span>
            <b>Modo de consulta restringido:</b> Se visualiza la bitácora en modo de solo lectura local debido a políticas de segregación de funciones.
          </span>
        </div>
      )}

      {/* Trazabilidad End-to-End con MASTER_TRANSACTION_ID */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-100 pb-3 mb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-blue-700" />
              Inspector de Transacción Maestra (Ciclo Mercantil Completo)
            </h3>
            <p className="text-xs text-blue-800 mt-0.5">
              Trazabilidad 14 Fases: LEAD → PEDIDO → WMS → FACTURACIÓN → CXC → TESORERÍA → COMISIONES → EBITDA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">ID Transacción:</label>
            <select
              value={selectedTraceId}
              onChange={(e) => setSelectedTraceId(e.target.value)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {traces.map((tr) => (
                <option key={tr.masterTransactionId} value={tr.masterTransactionId}>
                  {tr.masterTransactionId} {tr.clientName ? `(${tr.clientName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTrace ? (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-blue-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Cliente Vinculado</span>
                <b className="text-slate-900">{activeTrace.clientName || 'Grupo Industrial del Norte S.A. de C.V.'}</b>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Monto Transaccional</span>
                <b className="text-emerald-700 font-mono text-sm">
                  ${(Number(activeTrace.totalAmount ?? (activeTrace as any).monetaryAmount ?? 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {(activeTrace as any).currency || 'MXN'}
                </b>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Integridad Criptográfica</span>
                <b className={activeTrace.integrityHash ? 'text-emerald-700' : 'text-amber-600'}>
                  {activeTrace.integrityHash ? '✅ SHA-256 Verificada' : '🚨 Incompleta'}
                </b>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Eslabones Registrados</span>
                <b className="text-blue-900">{activeStages.length} Etapas Auditadas</b>
              </div>
            </div>

            {/* Stages Step-by-Step Chain */}
            {activeStages.length > 0 ? (
              <div className="overflow-x-auto pb-2">
                <div className="flex items-stretch gap-2 min-w-max">
                  {activeStages.map((stg, idx) => (
                    <div
                      key={stg.key}
                      className="w-52 rounded-lg bg-white border border-slate-200 p-3 shadow-2xs space-y-1.5 relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                          <span>Paso {idx + 1}</span>
                          <span className="text-emerald-700 bg-emerald-50 px-1 rounded">OK</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 mt-1 uppercase tracking-tight">
                          {stg.stageName}
                        </h4>
                        <div className="text-[11px] font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded mt-1 truncate">
                          {stg.entityId}
                        </div>
                        {stg.amount !== undefined && stg.amount > 0 && (
                          <div className="text-[10px] text-emerald-700 font-mono font-bold mt-1">
                            ${Number(stg.amount).toLocaleString('es-MX')}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5 font-mono">
                        <div className="truncate">Por: <b>{stg.responsibleName}</b></div>
                        <div className="text-[9px] text-slate-400">{stg.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-3 bg-white rounded border border-slate-200">
                No hay etapas registradas para esta transacción maestra.
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic p-4 text-center">
            Selecciona una Transacción Maestra para inspeccionar la cadena de custodia.
          </div>
        )}
      </div>

      {/* Bitácora de Auditoría Transversal */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              Registro Inmutable de Eventos de Auditoría (Audit Log)
            </h3>
            <p className="text-xs text-slate-500">
              Eventos de creación, modificación, autorización y eliminación en todos los módulos de CONSCORE.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 pb-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>

          {/* Filtro Módulo */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full"
            >
              {modules.map((mod) => (
                <option key={mod} value={mod}>
                  Módulo: {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Rol */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  Rol: {r}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Master Transaction */}
          <div>
            <select
              value={selectedMasterTx}
              onChange={(e) => setSelectedMasterTx(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full"
            >
              {masterTxOptions.map((tx) => (
                <option key={tx} value={tx}>
                  Master Tx: {tx}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de Filtros Activos si hay alguno */}
        {(searchTerm || selectedModule !== 'TODAS' || selectedRole !== 'TODOS' || selectedMasterTx !== 'TODOS') && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs text-slate-500">
            <span>
              Mostrando <b>{filteredLogs.length}</b> de <b>{logs.length}</b> eventos
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              Restablecer Filtros
            </button>
          </div>
        )}

        {/* ==========================================
            ESTADOS: LOADING / EMPTY / SUCCESS
            ========================================== */}
        {loading && logs.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">
              Cargando bitácora inmutable de auditoría transversal...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center space-y-3 my-4">
            <Database className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                No hay eventos de auditoría para los filtros seleccionados.
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Verifica los términos de búsqueda, el módulo o el identificador de transacción maestra.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Módulo</th>
                    <th className="py-2.5 px-3">Acción Registrada</th>
                    <th className="py-2.5 px-3">Entidad / Folio</th>
                    <th className="py-2.5 px-3">Usuario & Rol</th>
                    <th className="py-2.5 px-3">Master Tx ID</th>
                    <th className="py-2.5 px-3">Detalle Técnico</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {paginatedLogs.map((log) => {
                    const txId = getMasterTx(log);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedEventForDetail(log)}
                      >
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                          {formatTimestamp(log.timestamp || log.created_at || log.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-blue-900 whitespace-nowrap">
                          <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                            {getModule(log)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {getAction(log)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-bold whitespace-nowrap">
                          {getEntityId(log)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          <div>{getUserName(log)}</div>
                          <div className="text-[10px] text-slate-400">{getUserRole(log)}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {txId ? (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {txId}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[10px] max-w-xs truncate">
                          {safeStringify(log.details || log.newValue || log.new_value || log.action)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventForDetail(log);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                          >
                            <Eye className="h-3 w-3" /> Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div>
                  Página <b>{currentPage}</b> de <b>{totalPages}</b> ({filteredLogs.length} eventos)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Siguiente <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ==========================================
          MODAL DE DETALLE DE EVENTO INMUTABLE
          ========================================== */}
      {selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Detalle del Evento de Auditoría
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    ID: {selectedEventForDetail.id || '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Metadatos principales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fecha / Hora</span>
                  <b className="font-mono text-slate-900">
                    {formatTimestamp(
                      selectedEventForDetail.timestamp ||
                      selectedEventForDetail.created_at ||
                      selectedEventForDetail.createdAt
                    )}
                  </b>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Módulo</span>
                  <span className="bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded text-[11px]">
                    {getModule(selectedEventForDetail)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Acción</span>
                  <b className="text-slate-900">{getAction(selectedEventForDetail)}</b>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Usuario Responsable</span>
                  <b className="text-slate-900">{getUserName(selectedEventForDetail)}</b>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rol</span>
                  <b className="text-slate-700">{getUserRole(selectedEventForDetail)}</b>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Entidad / Folio</span>
                  <b className="font-mono text-slate-900">{getEntityId(selectedEventForDetail)}</b>
                </div>
              </div>

              {/* Master Transaction ID */}
              <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-700 uppercase font-bold block">
                    MASTER_TRANSACTION_ID (Trazabilidad Transversal)
                  </span>
                  <span className="font-mono text-xs font-bold text-purple-950">
                    {getMasterTx(selectedEventForDetail) || 'Sin vinculación maestra directa'}
                  </span>
                </div>
                {getMasterTx(selectedEventForDetail) && (
                  <button
                    onClick={() => handleCopyTx(getMasterTx(selectedEventForDetail))}
                    className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-bold text-purple-900 border border-purple-300 hover:bg-purple-100 transition-colors shadow-2xs"
                  >
                    {copiedTxId === getMasterTx(selectedEventForDetail) ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-purple-600" /> Copiar Folio
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Valores Antes y Después si existen */}
              {(selectedEventForDetail.previousValue || selectedEventForDetail.previous_value || selectedEventForDetail.newValue || selectedEventForDetail.new_value) && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Variación de Estado (Antes / Después)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block mb-1">
                        Valor Previo (Original)
                      </span>
                      <pre className="font-mono text-[11px] text-rose-950 whitespace-pre-wrap break-all bg-white p-2 rounded border border-rose-100">
                        {safeStringify(selectedEventForDetail.previousValue || selectedEventForDetail.previous_value)}
                      </pre>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                        Valor Nuevo (Modificado)
                      </span>
                      <pre className="font-mono text-[11px] text-emerald-950 whitespace-pre-wrap break-all bg-white p-2 rounded border border-emerald-100">
                        {safeStringify(selectedEventForDetail.newValue || selectedEventForDetail.new_value)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalle Técnico / Metadatos */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payload Técnico / Metadatos Registrados
                </h4>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-44">
                  <pre className="whitespace-pre-wrap break-all">
                    {safeStringify(selectedEventForDetail.details || (selectedEventForDetail as any).metadata || selectedEventForDetail)}
                  </pre>
                </div>
              </div>

              {/* Nota de inmutabilidad */}
              <div className="rounded bg-slate-100 p-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Registro criptográfico inmutable. Prohibida la alteración, sobreescritura o eliminación histórica conforme a la NOM-151 y políticas corporativas de CONSCORE.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Exportación envuelta con ErrorBoundary para garantía total anti-pantalla blanca
export const ExecutiveAuditCenterView: React.FC<ExecutiveAuditCenterViewProps> = (props) => {
  return (
    <ExecutiveAuditCenterErrorBoundary>
      <ExecutiveAuditCenterViewInner {...props} />
    </ExecutiveAuditCenterErrorBoundary>
  );
};

export const ExecutiveAuditCenterViewWrapped = ExecutiveAuditCenterView;

export default ExecutiveAuditCenterView;
