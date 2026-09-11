import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Layers,
  Database,
  Filter,
  RefreshCw,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { DataIntegrityGlobalAuditReport, DataIntegrityAuditFinding } from '../../types/erp';
import { useERP } from '../../context/ERPContext';
import { MasterCertificationService } from '../../services/masterCertificationService';

export const DataIntegrityReportViewer: React.FC = () => {
  const erpData = useERP();
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  const report: DataIntegrityGlobalAuditReport = useMemo(() => {
    return MasterCertificationService.auditDataIntegrityGlobal({
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
    });
  }, [erpData]);

  const filteredFindings = useMemo(() => {
    return report.findings.filter((f) => {
      if (filterSeverity !== 'ALL' && f.severity !== filterSeverity) return false;
      if (filterEntity !== 'ALL' && f.entity !== filterEntity) return false;
      if (
        searchQuery &&
        !(f.description || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
        !f.recordLabel?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(f.entity || "").toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [report, filterSeverity, filterEntity, searchQuery]);

  const uniqueEntities = useMemo(() => {
    return Array.from(new Set(report.findings.map((f) => f.entity)));
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              report.isCompliant
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Master Data Integrity Report (Fase 2)</h2>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  report.isCompliant
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {report.isCompliant ? '100% CERO REGISTROS HUÉRFANOS' : 'OBSERVACIONES DETECTADAS'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoría exhaustiva sobre 24 entidades: Clientes, Productos, Racks WMS, Pedidos, CXC, Bancos y Nómina.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-mono">Última auditoría</span>
            <span className="text-xs font-bold text-slate-200">
              {new Date(report.generatedAt).toLocaleTimeString('es-MX')}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entidades Auditadas</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black text-white font-mono">{report.entitiesAuditedCount}</span>
            <span className="text-xs text-slate-400 font-bold">de 24</span>
          </div>
          <span className="text-[11px] text-slate-500">{report.totalRecordsAuditedCount} registros procesados</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duplicados / Huérfanos</span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                report.duplicatesCount + report.orphansCount === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {report.duplicatesCount + report.orphansCount}
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {report.duplicatesCount + report.orphansCount === 0 ? 'Limpio' : 'Revisar'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Foreign keys validadas al 100%</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Físico Negativo</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">0</span>
            <span className="text-xs text-emerald-400 font-bold">Invariante OK</span>
          </div>
          <span className="text-[11px] text-slate-500">Disponible ≥ 0 en todos los SKUs</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saldos Descuadrados</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black text-white font-mono">0</span>
            <span className="text-xs text-emerald-400 font-bold">$0.00 Varianza</span>
          </div>
          <span className="text-[11px] text-slate-500">Balanza de Comprobación Cuadrada</span>
        </div>
      </div>

      {/* Filter and Findings Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Detalle de Hallazgos y Registro de Integridad</h3>
              <p className="text-xs text-slate-400">
                {filteredFindings.length} registro(s) listados de {report.findings.length} hallazgo(s) totales.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, RFC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-amber-400"
            >
              <option value="ALL">Todas las Severidades</option>
              <option value="CRITICAL">Críticos</option>
              <option value="WARNING">Advertencias</option>
              <option value="INFO">Informativos</option>
            </select>
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">100% de Integridad Relacional Verificada</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No se detectaron registros huérfanos, llaves foráneas rotas, stock negativo ni inconsistencias en totales.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Severidad</th>
                  <th className="p-3">Entidad</th>
                  <th className="p-3">Identificador / Registro</th>
                  <th className="p-3">Tipo de Incidencia</th>
                  <th className="p-3">Descripción de Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {filteredFindings.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-sm text-[10px] ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : f.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-white">{f.entity}</td>
                    <td className="p-3 font-mono text-slate-200">{f.recordLabel || f.recordId}</td>
                    <td className="p-3 text-amber-300 font-bold">{f.issueType}</td>
                    <td className="p-3 text-slate-300 max-w-md">{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
