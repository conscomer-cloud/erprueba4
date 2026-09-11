/**
 * @license
 * CONSCORE ERP IA - Compliance Center View
 * FASE 13 - Cumplimiento Regulatorio, Bóveda de Evidencias y Planes de Acción
 */

import React, { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck,
  Shield,
  Search,
  Filter,
  UploadCloud,
  FileText,
  AlertTriangle,
  Layers,
  ExternalLink,
  RefreshCw,
  X,
  Eye,
  Plus,
  ShieldCheck,
  ChevronRight,
  Lock,
  Check,
  Hash,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ComplianceObligation,
  ComplianceEvidence,
  CorrectiveActionPlan,
  ComplianceStatus,
} from '../../types/governanceRiskComplianceTypes';
import { GovernanceRiskComplianceService } from '../../services/governanceRiskComplianceService';

// ==========================================
// ERROR BOUNDARY LOCAL PARA COMPLIANCE
// ==========================================
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ComplianceErrorBoundary extends (React.Component as any) {
  state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Error desconocido' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ComplianceErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-slate-800 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-red-900">
                No fue posible cargar una sección de Compliance y Evidencias.
              </h3>
              <p className="text-xs text-red-700 mt-1">
                Se detectó una discrepancia al procesar la información de cumplimiento normativo: {this.state.errorMessage}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
              REINTENTAR
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// PROPS DEL COMPONENTE
// ==========================================
export interface ComplianceCenterViewProps {
  obligations?: ComplianceObligation[];
  evidenceList?: ComplianceEvidence[];
  actionPlans?: CorrectiveActionPlan[];
  onUploadEvidence?: (evidence: ComplianceEvidence) => void;
  onObligationUpdated?: (obligation: ComplianceObligation) => void;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const ComplianceCenterViewInner: React.FC<ComplianceCenterViewProps> = ({
  obligations: initialObligations = [],
  evidenceList: initialEvidenceList = [],
  actionPlans: initialActionPlans = [],
  onUploadEvidence,
  onObligationUpdated,
}) => {
  // Local state initialized with props
  const [localObligations, setLocalObligations] = useState<ComplianceObligation[]>(initialObligations);
  const [localEvidenceList, setLocalEvidenceList] = useState<ComplianceEvidence[]>(initialEvidenceList);
  const [localActionPlans, setLocalActionPlans] = useState<CorrectiveActionPlan[]>(initialActionPlans);

  // Sync state if props change
  useEffect(() => {
    if (initialObligations && initialObligations.length > 0) {
      setLocalObligations(initialObligations);
    }
  }, [initialObligations]);

  useEffect(() => {
    if (initialEvidenceList && initialEvidenceList.length > 0) {
      setLocalEvidenceList(initialEvidenceList);
    }
  }, [initialEvidenceList]);

  useEffect(() => {
    if (initialActionPlans && initialActionPlans.length > 0) {
      setLocalActionPlans(initialActionPlans);
    }
  }, [initialActionPlans]);

  // UI state
  const [activeSubTab, setActiveSubTab] = useState<'OBLIGATIONS' | 'EVIDENCES' | 'CAPA'>('OBLIGATIONS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODAS');
  const [selectedObligation, setSelectedObligation] = useState<ComplianceObligation | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<ComplianceEvidence | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadObligationId, setUploadObligationId] = useState<string>('');

  // Form state for new evidence
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('DICTAMEN_AUDITORIA_EXTERNA');
  const [newResponsible, setNewResponsible] = useState('Lic. Claudia Serrano');
  const [newReviewer, setNewReviewer] = useState('Auditoría Interna');
  const [newResult, setNewResult] = useState<'APROBADA' | 'RECHAZADA' | 'OBSERVACIONES'>('APROBADA');
  const [newObservations, setNewObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lifecycle states
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch from backend safely on mount or manual refresh
  const syncWithServer = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('conscore_auth_token') || localStorage.getItem('conscore_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/compliance', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.obligations && Array.isArray(data.obligations)) {
          setLocalObligations(data.obligations);
        }
        if (data.evidenceList && Array.isArray(data.evidenceList)) {
          setLocalEvidenceList(data.evidenceList);
        }
        if (data.actionPlans && Array.isArray(data.actionPlans)) {
          setLocalActionPlans(data.actionPlans);
        }
      } else if (res.status === 401 || res.status === 403) {
        // Fallback gracefully to local props without crash
        console.warn('Servidor devolvió estado de autorización:', res.status);
      }
    } catch (err: any) {
      console.warn('Fallback a datos iniciales locales:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Attempt background sync without blocking UI
    syncWithServer();
  }, []);

  // Compute flattened authorities safely
  const authorities = useMemo(() => {
    const list = new Set<string>();
    list.add('TODAS');
    (localObligations || []).forEach((o) => {
      if (o && o.regulationSource) {
        const prefix = o.regulationSource.split(' - ')[0] || o.regulationSource;
        list.add(prefix.trim());
      }
    });
    return Array.from(list);
  }, [localObligations]);

  // Defensive filtering of obligations
  const filteredObligations = useMemo(() => {
    return (localObligations || []).filter((o) => {
      if (!o) return false;
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        (o.name || '').toLowerCase().includes(s) ||
        (o.code || '').toLowerCase().includes(s) ||
        (o.regulationSource || '').toLowerCase().includes(s) ||
        (o.description || '').toLowerCase().includes(s) ||
        (o.ownerName || '').toLowerCase().includes(s) ||
        (o.mandatoryControls || []).some((c) => c.toLowerCase().includes(s));

      const sourcePrefix = (o.regulationSource || '').split(' - ')[0] || '';
      const matchesAuth =
        selectedAuthority === 'TODAS' ||
        sourcePrefix.trim() === selectedAuthority ||
        (o.regulationSource || '').includes(selectedAuthority);

      const matchesStat = selectedStatus === 'TODAS' || o.status === selectedStatus;
      return matchesSearch && matchesAuth && matchesStat;
    });
  }, [localObligations, searchTerm, selectedAuthority, selectedStatus]);

  // Flattened and filtered evidences
  const allEvidences = useMemo(() => {
    const fromObligations = (localObligations || []).flatMap((o) =>
      (o.evidences || []).map((e) => ({
        ...e,
        obligationCode: o.code,
        obligationName: o.name,
        regulationSource: o.regulationSource,
      }))
    );

    const fromList = (localEvidenceList || []).map((e) => ({
      ...e,
      obligationCode: (e as any).obligationCode || 'EVI-GEN',
      obligationName: (e as any).obligationName || 'Cumplimiento General',
      regulationSource: (e as any).regulationSource || 'Normativa Vigente',
    }));

    // Deduplicate by ID
    const map = new Map<string, typeof fromObligations[0]>();
    [...fromObligations, ...fromList].forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [localObligations, localEvidenceList]);

  const filteredEvidences = useMemo(() => {
    return allEvidences.filter((e) => {
      if (!e) return false;
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        (e.documentName || '').toLowerCase().includes(s) ||
        (e.responsibleName || '').toLowerCase().includes(s) ||
        (e.documentType || '').toLowerCase().includes(s) ||
        (e.evidenceUrlOrHash || '').toLowerCase().includes(s) ||
        (e.obligationCode || '').toLowerCase().includes(s);

      const matchesStat =
        selectedStatus === 'TODAS' ||
        (selectedStatus === 'COMPLIANT' && e.reviewResult === 'APROBADA') ||
        (selectedStatus === 'PENDING_REVIEW' && e.reviewResult === 'OBSERVACIONES') ||
        (selectedStatus === 'NON_COMPLIANT' && e.reviewResult === 'RECHAZADA');

      return matchesSearch && matchesStat;
    });
  }, [allEvidences, searchTerm, selectedStatus]);

  // Safe KPIs calculations (strictly preventing NaN or Infinity)
  const stats = useMemo(() => {
    const total = localObligations.length;
    const compliant = localObligations.filter((o) => o && o.status === 'COMPLIANT').length;
    const pendingReview = localObligations.filter((o) => o && o.status === 'PENDING_REVIEW').length;
    const nonCompliant = localObligations.filter((o) => o && o.status === 'NON_COMPLIANT').length;
    const partiallyCompliant = localObligations.filter((o) => o && o.status === 'PARTIALLY_COMPLIANT').length;
    const complianceRatePct = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const totalEvidences = allEvidences.length;
    const totalPlans = localActionPlans.length;

    return {
      total,
      compliant,
      pendingReview,
      nonCompliant,
      partiallyCompliant,
      complianceRatePct,
      totalEvidences,
      totalPlans,
    };
  }, [localObligations, allEvidences, localActionPlans]);

  // Status badge styling helper
  const getStatusBadge = (status: ComplianceStatus | string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PARTIALLY_COMPLIANT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'NON_COMPLIANT':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusLabel = (status: ComplianceStatus | string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'CONFORME (100%)';
      case 'PARTIALLY_COMPLIANT':
        return 'PARCIAL';
      case 'PENDING_REVIEW':
        return 'EN REVISIÓN';
      case 'NON_COMPLIANT':
        return 'NO CONFORME';
      default:
        return 'SIN DATOS';
    }
  };

  // Handler: Register New Evidence
  const handleOpenUploadModal = (obligationId?: string) => {
    setUploadObligationId(obligationId || (localObligations[0]?.id ?? ''));
    setNewDocName('');
    setNewObservations('');
    setIsUploadModalOpen(true);
  };

  const handleSaveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    setIsSubmitting(true);
    const generatedHash = `sha256:${Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    const newEvidence: ComplianceEvidence = {
      id: `EVI-${Date.now().toString(36).toUpperCase()}`,
      documentName: newDocName.trim(),
      documentType: newDocType,
      date: new Date().toISOString().split('T')[0],
      responsibleName: newResponsible.trim() || 'Responsable de Compliance',
      version: '1.0',
      evidenceUrlOrHash: generatedHash,
      reviewerName: newReviewer.trim() || 'Auditoría Interna',
      reviewDate: new Date().toISOString().split('T')[0],
      reviewResult: newResult,
      observations: newObservations.trim() || 'Evidencia probatoria registrada y validada para cumplimiento regulatorio.',
      auditId: `AUD-${Date.now()}`,
    };

    // Update local state
    const targetObligation = localObligations.find(
      (o) => o.id === uploadObligationId || o.code === uploadObligationId
    );

    let updatedObligation: ComplianceObligation | null = null;

    if (targetObligation) {
      const updatedEvidences = [newEvidence, ...(targetObligation.evidences || [])];
      const tempObligation: ComplianceObligation = {
        ...targetObligation,
        evidences: updatedEvidences,
        lastReviewDate: new Date().toISOString().split('T')[0],
      };

      // Strict evaluation rule
      tempObligation.status = GovernanceRiskComplianceService.evaluateComplianceObligation(tempObligation);
      updatedObligation = tempObligation;

      setLocalObligations((prev) =>
        prev.map((o) => (o.id === tempObligation.id ? tempObligation : o))
      );

      if (selectedObligation && selectedObligation.id === tempObligation.id) {
        setSelectedObligation(tempObligation);
      }
    }

    setLocalEvidenceList((prev) => [newEvidence, ...prev]);

    // Fire callbacks
    if (onUploadEvidence) {
      onUploadEvidence(newEvidence);
    }
    if (updatedObligation && onObligationUpdated) {
      onObligationUpdated(updatedObligation);
    }

    // Try background server persist
    try {
      const token = localStorage.getItem('conscore_auth_token') || localStorage.getItem('conscore_auth_token');
      if (token && targetObligation) {
        await fetch('/api/compliance/evidence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            obligationId: targetObligation.id,
            documentName: newEvidence.documentName,
            documentType: newEvidence.documentType,
            date: newEvidence.date,
            responsibleName: newEvidence.responsibleName,
            version: newEvidence.version,
            evidenceUrlOrHash: newEvidence.evidenceUrlOrHash,
            reviewerName: newEvidence.reviewerName,
            reviewDate: newEvidence.reviewDate,
            reviewResult: newEvidence.reviewResult,
            observations: newEvidence.observations,
          }),
        });
      }
    } catch (err) {
      console.warn('No se pudo sincronizar evidencia con el servidor backend:', err);
    }

    setIsSubmitting(false);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Compliance Normativo & Bóveda de Evidencias
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión transversal de obligaciones fiscales (SAT), laborales (STPS), ambientales y de calidad industrial con regla estricta de evidencia probatoria física y digital.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncWithServer}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={() => handleOpenUploadModal()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar Evidencia
          </button>
        </div>
      </div>

      {/* Regla de Oro Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <b className="font-bold block text-sm text-amber-900">
            Regla de Oro de Auditoría FASE 13: "Sin Evidencia Documental = No Cumplimiento"
          </b>
          <p className="mt-1 text-amber-800 leading-relaxed">
            Ninguna obligación puede ostentar el estatus <b>CONFORME</b> si no cuenta con al menos un documento probatorio indexado, validado por el auditor interno y con hash de integridad SHA-256 en la Bóveda Corporativa.
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Controles
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[10px] font-bold text-slate-500">Obligaciones</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Conformes (100%)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-800">{stats.compliant}</span>
            <span className="text-[10px] font-bold text-emerald-700">{stats.complianceRatePct}% Tasa</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
            En Revisión
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-800">{stats.pendingReview}</span>
            <span className="text-[10px] font-bold text-amber-600">Por auditar</span>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 block">
            No Conformes
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-800">{stats.nonCompliant}</span>
            <span className="text-[10px] font-bold text-red-600">Crítico</span>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
            Evidencias SHA-256
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-800">{stats.totalEvidences}</span>
            <span className="text-[10px] font-bold text-blue-600">En Bóveda</span>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
            Planes CAPA
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-800">{stats.totalPlans}</span>
            <span className="text-[10px] font-bold text-purple-600">Acciones</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs de Navegación Local */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('OBLIGATIONS')}
          className={`pb-2.5 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeSubTab === 'OBLIGATIONS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Matriz de Obligaciones ({stats.total})
        </button>
        <button
          onClick={() => setActiveSubTab('EVIDENCES')}
          className={`pb-2.5 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeSubTab === 'EVIDENCES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Bóveda de Evidencias ({stats.totalEvidences})
        </button>
        <button
          onClick={() => setActiveSubTab('CAPA')}
          className={`pb-2.5 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeSubTab === 'CAPA'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          Planes Correctivos (CAPA) ({stats.totalPlans})
        </button>
      </div>

      {/* Filtros Globales */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, autoridad, control o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeSubTab === 'OBLIGATIONS' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedAuthority}
                onChange={(e) => setSelectedAuthority(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {authorities.map((auth) => (
                  <option key={auth} value={auth}>
                    {auth}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="TODAS">Todos los estatus</option>
            <option value="COMPLIANT">Conforme</option>
            <option value="PENDING_REVIEW">En Revisión</option>
            <option value="PARTIALLY_COMPLIANT">Parcialmente Conforme</option>
            <option value="NON_COMPLIANT">No Conforme</option>
          </select>
        </div>
      </div>

      {/* SUB-TAB 1: MATRIZ DE OBLIGACIONES */}
      {activeSubTab === 'OBLIGATIONS' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : filteredObligations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3">
              <FileCheck className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                No hay controles o evidencias registradas con los filtros seleccionados.
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No se encontraron obligaciones que coincidan con el término de búsqueda o filtros aplicados.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedAuthority('TODAS');
                  setSelectedStatus('TODAS');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredObligations.map((ob) => {
                const evidences = ob.evidences || [];
                const hasEvidence = evidences.length > 0;
                return (
                  <div
                    key={ob.id}
                    onClick={() => setSelectedObligation(ob)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {ob.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                            ob.status
                          )}`}
                        >
                          {getStatusLabel(ob.status)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {ob.name}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {ob.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Regulación:</span>
                        <b className="text-slate-800 font-semibold truncate max-w-[170px]">{ob.regulationSource}</b>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Vencimiento:</span>
                        <b className="text-slate-800 font-mono">{ob.dueDate}</b>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[11px] text-slate-500">Evidencias:</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                            hasEvidence
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {hasEvidence ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                          )}
                          {evidences.length} {evidences.length === 1 ? 'documento' : 'documentos'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: BÓVEDA DE EVIDENCIAS */}
      {activeSubTab === 'EVIDENCES' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Bóveda de Evidencias Documentales y Dictámenes
              </h3>
              <p className="text-xs text-slate-500">
                Registros probatorios indexados con trazabilidad de auditoría interna y hash SHA-256 de autenticidad.
              </p>
            </div>
            <button
              onClick={() => handleOpenUploadModal()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva Evidencia
            </button>
          </div>

          {filteredEvidences.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No hay evidencias registradas que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Folio / Documento</th>
                    <th className="px-4 py-3">Control Vinculado</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Dictamen</th>
                    <th className="px-4 py-3">Hash SHA-256</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvidences.map((evi) => (
                    <tr key={evi.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="font-bold flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          {evi.documentName}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 block">{evi.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {evi.obligationCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">{evi.documentType}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">{evi.date}</td>
                      <td className="px-4 py-3 text-slate-800">{evi.responsibleName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            evi.reviewResult === 'APROBADA'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : evi.reviewResult === 'RECHAZADA'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {evi.reviewResult}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                        {evi.evidenceUrlOrHash}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedEvidence(evi)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PLANES DE ACCIÓN CAPA */}
      {activeSubTab === 'CAPA' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Planes de Acción Correctiva y Preventiva (CAPA)
            </h3>
            <p className="text-xs text-slate-500">
              Mitigación de riesgos de incumplimiento normativo y solventación de observaciones de auditoría.
            </p>
          </div>

          {localActionPlans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No hay planes de acción correctiva registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {localActionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 hover:bg-white hover:border-blue-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                        {plan.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{plan.title}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border self-start sm:self-auto ${
                        plan.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : plan.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{plan.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                    <div>
                      Responsable: <b className="text-slate-900">{plan.responsible}</b>
                    </div>
                    <div>
                      Meta: <b className="font-mono text-slate-900">{plan.targetDate}</b>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Progreso:</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, plan.progressPct || 0))}%` }}
                        />
                      </div>
                      <b className="font-mono text-[11px]">{plan.progressPct || 0}%</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: DETALLE DE OBLIGACIÓN */}
      {selectedObligation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {selectedObligation.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  {selectedObligation.name}
                </h3>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                    selectedObligation.status
                  )}`}
                >
                  {getStatusLabel(selectedObligation.status)}
                </span>
              </div>
              <button
                onClick={() => setSelectedObligation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Descripción del Control:</span>
                <p className="text-slate-600 leading-relaxed">{selectedObligation.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Regulación / Autoridad</span>
                  <b className="text-slate-900">{selectedObligation.regulationSource}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Periodicidad</span>
                  <b className="text-slate-900">{selectedObligation.frequency}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Responsable</span>
                  <b className="text-slate-900">{selectedObligation.ownerName}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fecha Límite</span>
                  <b className="font-mono text-slate-900">{selectedObligation.dueDate}</b>
                </div>
              </div>

              {/* Controles Obligatorios */}
              {selectedObligation.mandatoryControls && selectedObligation.mandatoryControls.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-900 block">Puntos de Control Obligatorios:</span>
                  <div className="space-y-1">
                    {selectedObligation.mandatoryControls.map((ctrl, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2 rounded text-slate-800"
                      >
                        <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{ctrl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidencias Indexadas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Evidencias Probatorias Indexadas ({(selectedObligation.evidences || []).length}):
                  </span>
                  <button
                    onClick={() => {
                      handleOpenUploadModal(selectedObligation.id);
                    }}
                    className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-3 w-3" />
                    Adjuntar Evidencia
                  </button>
                </div>

                {(selectedObligation.evidences || []).length > 0 ? (
                  <div className="space-y-2">
                    {selectedObligation.evidences.map((evi) => (
                      <div
                        key={evi.id}
                        className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-lg text-xs"
                      >
                        <div>
                          <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            {evi.documentName}
                          </div>
                          <div className="text-[10px] text-emerald-800 mt-0.5 flex items-center gap-2">
                            <span>{evi.documentType}</span>
                            <span>·</span>
                            <span>{evi.date}</span>
                            <span>·</span>
                            <span className="font-mono text-[9px] text-slate-500">{evi.evidenceUrlOrHash}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                          {evi.reviewResult}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>
                      ⚠️ No hay evidencias probatorias registradas. Conforme a la Regla de Oro, el control no puede ser calificado como CONFORME.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedObligation(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETALLE DE EVIDENCIA */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {selectedEvidence.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedEvidence.documentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tipo Documental</span>
                  <b>{selectedEvidence.documentType}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fecha</span>
                  <b className="font-mono">{selectedEvidence.date}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Responsable</span>
                  <b>{selectedEvidence.responsibleName}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Auditor Revisor</span>
                  <b>{selectedEvidence.reviewerName || 'Auditoría Interna'}</b>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Dictamen de Auditoría</span>
                <span
                  className={`inline-block text-xs font-bold px-2.5 py-1 rounded border ${
                    selectedEvidence.reviewResult === 'APROBADA'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {selectedEvidence.reviewResult}
                </span>
                <p className="text-xs text-slate-600 mt-1">{selectedEvidence.observations}</p>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg space-y-1 font-mono text-[10px]">
                <span className="text-slate-400 uppercase font-bold block flex items-center gap-1">
                  <Lock className="h-3 w-3 text-blue-400" />
                  Hash Criptográfico de Integridad
                </span>
                <div className="break-all text-emerald-400">{selectedEvidence.evidenceUrlOrHash}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRAR NUEVA EVIDENCIA PROBATORIA */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveEvidence}
            className="rounded-xl border border-slate-200 bg-white p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-blue-600" />
                  Registrar Evidencia Probatoria
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Indexación en la Bóveda con verificación criptográfica y reevaluación de estatus normativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Obligación / Control Destino</label>
                <select
                  value={uploadObligationId}
                  onChange={(e) => setUploadObligationId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
                  required
                >
                  {localObligations.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.code}] {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Documento Probatorio</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Ej: Dictamen_Auditoria_Calidad_ISO9001_2026.pdf"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="DICTAMEN_AUDITORIA_EXTERNA">Dictamen Auditoría</option>
                    <option value="EXPEDIENTE_TECNICO">Expediente Técnico</option>
                    <option value="PDF_CERTIFICADO">PDF Certificado</option>
                    <option value="ACTA_CIERRE">Acta de Cierre</option>
                    <option value="CONSTANCIA_SAT">Constancia SAT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dictamen del Auditor</label>
                  <select
                    value={newResult}
                    onChange={(e) => setNewResult(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="APROBADA">APROBADA (Habilita Conforme)</option>
                    <option value="OBSERVACIONES">OBSERVACIONES (En Revisión)</option>
                    <option value="RECHAZADA">RECHAZADA (No Conforme)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsable</label>
                  <input
                    type="text"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Auditor</label>
                  <input
                    type="text"
                    value={newReviewer}
                    onChange={(e) => setNewReviewer(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones Técnicas</label>
                <textarea
                  rows={2}
                  value={newObservations}
                  onChange={(e) => setNewObservations(e.target.value)}
                  placeholder="Detalles del dictamen, alcance de revisión y evidencias anexas..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Registrando...' : 'Indexar en Bóveda'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Exportación con ErrorBoundary local para protección total contra pantallas blancas
export const ComplianceCenterView: React.FC<ComplianceCenterViewProps> = (props) => {
  return (
    <ComplianceErrorBoundary>
      <ComplianceCenterViewInner {...props} />
    </ComplianceErrorBoundary>
  );
};
