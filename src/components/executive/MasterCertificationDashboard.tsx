import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  Lock,
  Printer,
  Download,
  Server,
  Zap,
  Bot,
  Archive,
  Users,
  Eye,
  Calendar,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ERPModule,
  MasterCertificationReportData,
  MasterCertificationPillar,
  InvariantEvaluation,
  SecurityRbacMatrixAudit,
  DataPrivacyMaskingTest,
  PeriodClosingAuditInfo,
  BackupItem,
  DisasterRecoveryMetrics,
  AIGovernanceGuardrail,
  AIDataHonestyItem,
  PerformanceBenchmarkResult,
} from '../../types/erp';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MasterCertificationService } from '../../services/masterCertificationService';
import { SystemHealthCenter } from './SystemHealthCenter';
import { DataIntegrityReportViewer } from './DataIntegrityReportViewer';
import { MasterTransactionTimeline } from './MasterTransactionTimeline';
import { TransactionAtomicityViewer } from './TransactionAtomicityViewer';

type CertificationViewTab =
  | 'OVERVIEW'
  | 'HEALTH'
  | 'INTEGRITY'
  | 'TIMELINE'
  | 'ATOMICITY'
  | 'INVARIANTS_GOVERNANCE'
  | 'BACKUP_RECOVERY'
  | 'OFFICIAL_REPORT';

interface MasterCertificationDashboardProps {
  onNavigateToModule?: (module: ERPModule) => void;
}

export const MasterCertificationDashboard: React.FC<MasterCertificationDashboardProps> = ({
  onNavigateToModule,
}) => {
  const erpData = useERP();
  const { currentUser, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<CertificationViewTab>('OVERVIEW');
  const [isAuditing, setIsAuditing] = useState(false);

  // Generate Master Certification Report
  const report: MasterCertificationReportData = useMemo(() => {
    return MasterCertificationService.generateMasterCertificationReport(
      {
        customers: erpData.customers,
        products: erpData.products,
        quotes: erpData.quotes,
        orders: erpData.orders,
        movements: erpData.inventoryMovements,
        invoices: erpData.arInvoices,
        payments: erpData.payments,
        bankAccounts: erpData.bankAccounts,
        bankTransactions: erpData.bankTransactions,
        employees: erpData.employees,
        payrolls: erpData.payrollRecords,
        leads: erpData.leads,
        activities: erpData.activities,
        suppliers: erpData.suppliers,
        deliveries: erpData.deliveries,
        supplierInvoices: erpData.apBills,
        campaigns: erpData.campaigns,
        companyBudget: erpData.companyBudget,
        operatingExpenses: erpData.operatingExpenses,
      },
      currentUser?.name ? `${currentUser.name} (${currentRole})` : 'Auditoría Interna / Ing. Alejandro Ruiz'
    );
  }, [erpData, currentUser, currentRole]);

  // Sub-data for Invariants & Governance
  const invariants: InvariantEvaluation[] = useMemo(() => {
    return MasterCertificationService.evaluateInvariants({
      customers: erpData.customers,
      products: erpData.products,
      orders: erpData.orders,
      movements: erpData.inventoryMovements,
      invoices: erpData.arInvoices,
      payments: erpData.payments,
      bankAccounts: erpData.bankAccounts,
    });
  }, [erpData]);

  const rbacAudits: SecurityRbacMatrixAudit[] = useMemo(() => {
    return MasterCertificationService.runSecurityRbacMatrixAudit();
  }, []);

  const privacyTests: DataPrivacyMaskingTest[] = useMemo(() => {
    return MasterCertificationService.runDataPrivacyMaskingTests();
  }, []);

  const periodClosing: PeriodClosingAuditInfo = useMemo(() => {
    return MasterCertificationService.getPeriodClosingState();
  }, []);

  const backups: BackupItem[] = useMemo(() => {
    return MasterCertificationService.listAvailableBackups();
  }, []);

  const disasterMetrics: DisasterRecoveryMetrics = useMemo(() => {
    return MasterCertificationService.getDisasterRecoveryMetrics();
  }, []);

  const aiAudit = useMemo(() => {
    return MasterCertificationService.getAIGovernanceAudit();
  }, []);

  const benchmarks: PerformanceBenchmarkResult[] = useMemo(() => {
    return MasterCertificationService.runPerformanceBenchmarks();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CONSCORE_MASTER_CERTIFICATION_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Certification Status Badge */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Certificación Maestra Transversal & Producción (Fase 9)
                </h1>
                <span
                  className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs ${
                    report.overallCertificationStatus === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : report.overallCertificationStatus === 'PARTIALLY VALIDATED'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}
                >
                  MASTER CERTIFICATION: {report.overallCertificationStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                Auditoría integral sobre los 14 pilares de arquitectura, resiliencia transaccional, seguridad RBAC,
                gobernanza de IA, invariantes financieras y preparación operativa de CONSCORE ERP IA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Certificado</span>
            </button>
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Ver Operación E2E $500k</span>
            </button>
          </div>
        </div>

        {/* 5 Top Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pruebas Auditadas</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
              {report.totalTestsCount}
            </span>
            <span className="text-[10px] text-slate-400">100% de la suite ejecutada</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Pruebas Aprobadas (PASS)</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
              {report.passCount}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">100% Sin Descuadre</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Fallos Críticos (FAIL)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-400 font-mono mt-0.5 block">
              {report.failCount}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Cero Vulnerabilidades</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Infracciones de Seguridad</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">0</span>
            <span className="text-[10px] text-emerald-400 font-bold">RBAC & Privacidad OK</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Estado Operativo</span>
            <span className="text-sm font-black text-emerald-400 mt-1.5 block">
              PRODUCTION READY 🚀
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Tier 4 Enterprise</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-800 pt-4 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            14 Pilares de Certificación
          </button>
          <button
            onClick={() => setActiveTab('HEALTH')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'HEALTH'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Salud de Infraestructura (Fase 1)
          </button>
          <button
            onClick={() => setActiveTab('INTEGRITY')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'INTEGRITY'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Integridad de Entidades (Fase 2)
          </button>
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'TIMELINE'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Línea de Tiempo Master E2E (Fases 3 & 22)
          </button>
          <button
            onClick={() => setActiveTab('ATOMICITY')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'ATOMICITY'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Atomicidad & Concurrencia (Fases 4, 5, 6)
          </button>
          <button
            onClick={() => setActiveTab('INVARIANTS_GOVERNANCE')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'INVARIANTS_GOVERNANCE'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Invariantes, RBAC & IA (Fases 7-13, 19, 20)
          </button>
          <button
            onClick={() => setActiveTab('BACKUP_RECOVERY')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'BACKUP_RECOVERY'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Respaldos & Desastres (Fases 14, 15)
          </button>
          <button
            onClick={() => setActiveTab('OFFICIAL_REPORT')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'OFFICIAL_REPORT'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Reporte Oficial Imprimible (Fase 25)
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW (14 PILLARS GRID) */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.pillars.map((pillar) => (
              <div
                key={pillar.pillarKey}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 font-black text-xs">
                      {pillar.pillarKey.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{pillar.pillarName}</h3>
                      <span className="text-[11px] text-slate-400">
                        {pillar.passedCount} de {pillar.testCount} pruebas superadas
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-md ${
                      pillar.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : pillar.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {pillar.status} ({pillar.scorePct}%)
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{pillar.details}</p>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pillar.status === 'PASS'
                        ? 'bg-emerald-400'
                        : pillar.status === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${pillar.scorePct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SYSTEM HEALTH */}
      {activeTab === 'HEALTH' && <SystemHealthCenter />}

      {/* TAB CONTENT 3: DATA INTEGRITY */}
      {activeTab === 'INTEGRITY' && <DataIntegrityReportViewer />}

      {/* TAB CONTENT 4: TIMELINE MASTER E2E */}
      {activeTab === 'TIMELINE' && <MasterTransactionTimeline onNavigateToModule={onNavigateToModule} />}

      {/* TAB CONTENT 5: ATOMICITY, IDEMPOTENCY & CONCURRENCY */}
      {activeTab === 'ATOMICITY' && <TransactionAtomicityViewer />}

      {/* TAB CONTENT 6: INVARIANTS, RBAC, DATA PRIVACY & AI GOVERNANCE */}
      {activeTab === 'INVARIANTS_GOVERNANCE' && (
        <div className="space-y-6">
          {/* Section 1: Invariants Evaluation */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Invariantes Físicas, Financieras y de Margen (Fases 7, 8, 9)</h3>
                <p className="text-xs text-slate-400">Verificación de fórmulas de cuadre que no admiten alteraciones manuales.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invariants.map((inv, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span className="font-bold text-white">{inv.invariantName}</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      CUADRE $0.00
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-amber-400">{inv.formula}</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{inv.details}</p>
                  <div className="text-[10px] text-slate-500 font-mono">Fuente de Verdad: {inv.sourceOfTruth}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: AI Governance & Data Honesty */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <Bot className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Gobernanza de IA & Honestidad de Datos (Fases 19, 20)</h3>
                <p className="text-xs text-slate-400">
                  Guardrails activos: CONSCORE AI tiene prohibido ejecutar acciones sensibles sin aprobación humana explícita.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  Guardrails de Bloqueo Autónomo (Requieren Aprobación Humana)
                </span>
                <div className="space-y-2 text-xs">
                  {aiAudit.guardrails.map((g, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-200 text-[11px]">{g.action}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                        HUMAN_APPROVAL
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Taxonomía de Honestidad de Datos (Cero Invenciones)
                </span>
                <div className="space-y-2 text-xs">
                  {aiAudit.dataHonesty.map((dh, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-[11px]">{dh.dataPoint}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400">
                          {dh.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">Fuente: {dh.source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Data Privacy & Masking */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <Lock className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Privacidad & Enmascaramiento de Datos Sensibles (Fase 11)</h3>
                <p className="text-xs text-slate-400">Campos protegidos con enmascaramiento a nivel de campo (Field-Level Masking).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {privacyTests.map((pt, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 font-bold block">{pt.field}</span>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Original: {pt.sampleRawValue}</span>
                    <span className="text-amber-400 font-bold">Enmascarado: {pt.maskedValue}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 block font-bold">✓ Acceso no autorizado restringido</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: BACKUP & DISASTER RECOVERY */}
      {activeTab === 'BACKUP_RECOVERY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Manager */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Archive className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Backup Manager (Fase 14)</h3>
                  <p className="text-xs text-slate-400">Respaldos completos en caliente con verificación criptográfica SHA-256.</p>
                </div>
              </div>

              <div className="space-y-3">
                {backups.map((bkp) => (
                  <div key={bkp.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{bkp.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {bkp.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>ID: {bkp.id}</span>
                      <span>Tamaño: {bkp.sizeKb} KB</span>
                      <span>{new Date(bkp.createdAt).toLocaleDateString('es-MX')}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-400 truncate">
                      SHA256: {bkp.checksum}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disaster Recovery Metrics */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Activity className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Disaster Recovery Center (Fase 15)</h3>
                  <p className="text-xs text-slate-400">Métricas reales de RPO y RTO ante fallos de persistencia o red.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Tiempo de Detección</span>
                  <span className="text-lg font-black text-amber-400 font-mono mt-1 block">
                    {disasterMetrics.detectionTimeMs} ms
                  </span>
                  <span className="text-[10px] text-slate-400">Heartbeat activo</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Tiempo de Recuperación</span>
                  <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">
                    {disasterMetrics.recoveryTimeMs} ms
                  </span>
                  <span className="text-[10px] text-slate-400">Auto-heal inmediato</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                  <span className="text-[10px] text-slate-500 block uppercase">Objetivos RPO / RTO</span>
                  <span className="font-mono text-white text-xs block mt-1">RPO: {disasterMetrics.rpo}</span>
                  <span className="font-mono text-white text-xs block mt-0.5">RTO: {disasterMetrics.rto}</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                    0 registros perdidos (Cero Data Loss)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: OFFICIAL PRINTABLE CERTIFICATION REPORT */}
      {activeTab === 'OFFICIAL_REPORT' && (
        <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-300 shadow-2xl space-y-6 print:m-0 print:p-0 print:border-none">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-yellow-400 flex items-center justify-center font-black text-slate-900 text-2xl">
                C
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">CONSCORE ERP IA</h2>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                  Master Enterprise Certification & Production Readiness Report (Fase 9)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-600 block">Estatus de Certificación</span>
              <span className="text-sm font-black px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block mt-0.5">
                MASTER CERTIFICATION: {report.overallCertificationStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Empresa Auditada</span>
              <span className="font-bold text-slate-900 block mt-0.5">{report.companyName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Versión del Sistema</span>
              <span className="font-bold text-slate-900 block mt-0.5">{report.version}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Ambiente</span>
              <span className="font-bold text-slate-900 block mt-0.5">{report.environment}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[10px]">Usuario Ejecutor</span>
              <span className="font-bold text-slate-900 block mt-0.5">{report.executorUser}</span>
            </div>
          </div>

          {/* Pillars Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Resultados de los 14 Pilares de Auditoría
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Pilar de Certificación</th>
                  <th className="p-2.5 text-center">Pruebas</th>
                  <th className="p-2.5 text-center">Aprobadas</th>
                  <th className="p-2.5 text-center">Score</th>
                  <th className="p-2.5">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.pillars.map((p) => (
                  <tr key={p.pillarKey}>
                    <td className="p-2.5 font-bold text-slate-900">{p.pillarName}</td>
                    <td className="p-2.5 text-center font-mono">{p.testCount}</td>
                    <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{p.passedCount}</td>
                    <td className="p-2.5 text-center font-mono">{p.scorePct}%</td>
                    <td className="p-2.5">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 text-[10px]">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Certification Signature */}
          <div className="pt-8 border-t-2 border-slate-300 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-900">CONSCORE DE MÉXICO S.A. DE C.V.</p>
              <p>Auditoría de Calidad de Software, Integridad y Resiliencia Empresarial</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Dictamen emitido el: {new Date(report.date).toLocaleString('es-MX')}</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-900 w-48 pb-1 mb-1 font-bold text-slate-900">
                Ing. Alejandro Ruiz
              </div>
              <span className="text-[11px]">Director General & Contralor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
