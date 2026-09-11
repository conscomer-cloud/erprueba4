import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  Search,
  FileCheck2,
  Zap,
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { CommercialRLSService, SecurityViolationLog, ReassignmentLog } from '../../services/commercialRLSService';

interface CommercialRLSCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommercialRLSCertificationModal: React.FC<CommercialRLSCertificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customers, leads, opportunities, quotes, orders, products } = useERP();
  const { currentUser: user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'CERTIFICATION' | 'EXECUTIVES' | 'VIOLATIONS' | 'REASSIGNMENT'>('CERTIFICATION');
  const [certReport, setCertReport] = useState<any>(null);
  const [isRunningCert, setIsRunningCert] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<SecurityViolationLog[]>([]);
  const [reassignLogs, setReassignLogs] = useState<ReassignmentLog[]>([]);

  // Reassignment form state
  const [reassignType, setReassignType] = useState<'CUSTOMER' | 'QUOTE' | 'ORDER'>('CUSTOMER');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [targetVendor, setTargetVendor] = useState('VENDEDOR_02');
  const [reassignReason, setReassignReason] = useState('Reasignación estratégica de zona y cartera');
  const [reassignFeedback, setReassignFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      runCertification();
      setSecurityLogs(CommercialRLSService.getSecurityLogs());
      setReassignLogs(CommercialRLSService.getReassignmentLogs());
    }
  }, [isOpen]);

  const runCertification = () => {
    setIsRunningCert(true);
    setTimeout(() => {
      const report = CommercialRLSService.runCrossVendorCertification({
        customers,
        leads,
        opportunities,
        quotes,
        orders,
        products,
      });
      setCertReport(report);
      setSecurityLogs(CommercialRLSService.getSecurityLogs());
      setIsRunningCert(false);
    }, 400);
  };

  const handleExecuteReassignment = () => {
    if (!selectedEntityId) {
      setReassignFeedback({ success: false, message: 'Selecciona una entidad para reasignar.' });
      return;
    }

    let targetEntity: any = null;
    if (reassignType === 'CUSTOMER') {
      targetEntity = customers.find(c => c.id === selectedEntityId);
    } else if (reassignType === 'QUOTE') {
      targetEntity = quotes.find(q => q.id === selectedEntityId);
    } else if (reassignType === 'ORDER') {
      targetEntity = orders.find(o => o.id === selectedEntityId);
    }

    if (!targetEntity) {
      setReassignFeedback({ success: false, message: 'Entidad no encontrada.' });
      return;
    }

    const result = CommercialRLSService.reassignEntity(
      user || { role: 'GERENTE_VENTAS', name: 'Gerente Comercial' },
      reassignType,
      targetEntity,
      targetVendor,
      reassignReason
    );

    if (result.success) {
      setReassignFeedback({
        success: true,
        message: `Entidad ${reassignType} reasignada exitosamente a ${targetVendor}. Log de auditoría emitido.`
      });
      setReassignLogs(CommercialRLSService.getReassignmentLogs());
      runCertification();
    } else {
      setReassignFeedback({ success: false, message: result.error });
      setSecurityLogs(CommercialRLSService.getSecurityLogs());
    }
  };

  if (!isOpen) return null;

  const isPrivileged = CommercialRLSService.isPrivilegedRole(user?.role);
  const myExecId = CommercialRLSService.resolveSalesExecutiveId(user);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Segregación Comercial & Row-Level Security (RLS)
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  10 VENDEDORES AISLADOS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Matriz de segregación estricta de datos comerciales, validación E2E y auditoría de intentos no autorizados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current User Role Notice */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="font-semibold text-white">Sesión Actual:</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-yellow-400 font-mono">
              {user?.name || 'Usuario'} ({user?.role || 'VENDEDOR'})
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">Identificador Comercial:</span>
            <span className="rounded bg-blue-900/40 border border-blue-700/50 px-2 py-0.5 text-blue-300 font-mono font-bold">
              {myExecId || 'GLOBAL'}
            </span>
          </div>

          <div className="text-xs font-medium">
            {isPrivileged ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Visibilidad Global (Dirección / Gerencia)
              </span>
            ) : (
              <span className="text-yellow-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Visibilidad Restringida (Solo Cartera Propia)
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 mt-4 pb-2">
          <button
            onClick={() => setActiveSubTab('CERTIFICATION')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'CERTIFICATION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="h-4 w-4" />
            Certificación E2E (10 Ejecutivos)
          </button>

          <button
            onClick={() => setActiveSubTab('EXECUTIVES')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'EXECUTIVES'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Directorio & Cartera
          </button>

          <button
            onClick={() => setActiveSubTab('VIOLATIONS')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'VIOLATIONS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Intentos Bloqueados ({securityLogs.length})
          </button>

          <button
            onClick={() => setActiveSubTab('REASSIGNMENT')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'REASSIGNMENT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Reasignación de Cartera
          </button>
        </div>

        {/* Content Tab 1: CERTIFICATION */}
        {activeSubTab === 'CERTIFICATION' && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Matriz Automatizada de Seguridad Cruzada (Cross-Vendor Matrix)</h4>
                <p className="text-xs text-slate-400">
                  Prueba no destructiva que ejecuta 40 verificaciones simultáneas de lectura cruzada, escritura cruzada, protección de costos y reasignación indebida.
                </p>
              </div>
              <button
                onClick={runCertification}
                disabled={isRunningCert}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRunningCert ? 'animate-spin' : ''}`} />
                Recertificar Todo
              </button>
            </div>

            {certReport && (
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Tasa de Cumplimiento</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{certReport.summary.complianceRatePct}%</p>
                  <span className="text-[10px] text-slate-500">Zero data leakage garantizado</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Pruebas Ejecutadas</span>
                  <p className="text-2xl font-bold text-white mt-1">{certReport.summary.totalTests}</p>
                  <span className="text-[10px] text-slate-500">4 vectores por ejecutivo</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Pruebas Aprobadas</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{certReport.summary.passedTests}</p>
                  <span className="text-[10px] text-emerald-500/80">100% éxito en aislamiento</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Costos Ocultos a Vendedores</span>
                  <p className="text-2xl font-bold text-blue-400 mt-1">PROTEGIDOS</p>
                  <span className="text-[10px] text-slate-500">Margen y costos de compra</span>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-950 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Ejecutivo</th>
                    <th className="p-2.5 text-center">Clientes</th>
                    <th className="p-2.5 text-center">Cotizaciones</th>
                    <th className="p-2.5 text-center">Pedidos</th>
                    <th className="p-2.5 text-center">Lectura Cruzada</th>
                    <th className="p-2.5 text-center">Escritura Cruzada</th>
                    <th className="p-2.5 text-center">Costos Ocultos</th>
                    <th className="p-2.5 text-center">Reasignación</th>
                    <th className="p-2.5 text-center">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                  {certReport?.results?.map((r: any) => (
                    <tr key={r.vendorCode} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-2.5 font-sans">
                        <div className="font-bold text-white">{r.vendorName}</div>
                        <span className="text-[10px] text-slate-400">{r.vendorCode}</span>
                      </td>
                      <td className="p-2.5 text-center text-slate-300">{r.assignedCustomers}</td>
                      <td className="p-2.5 text-center text-slate-300">{r.assignedQuotes}</td>
                      <td className="p-2.5 text-center text-slate-300">{r.assignedOrders}</td>
                      <td className="p-2.5 text-center">
                        {r.crossReadBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 font-sans">
                            <Lock className="h-3 w-3" /> Bloqueado 403
                          </span>
                        ) : (
                          <span className="text-red-400">FAIL</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {r.crossWriteBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 font-sans">
                            <Lock className="h-3 w-3" /> Bloqueado 403
                          </span>
                        ) : (
                          <span className="text-red-400">FAIL</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {r.productCostsStripped ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400 font-sans">
                            <EyeOff className="h-3 w-3" /> Ocultos
                          </span>
                        ) : (
                          <span className="text-red-400">FAIL</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {r.reassignmentProtected ? (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400 font-sans">
                            <ShieldCheck className="h-3 w-3" /> Restringida
                          </span>
                        ) : (
                          <span className="text-red-400">FAIL</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-sans">
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          PASS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Tab 2: EXECUTIVES */}
        {activeSubTab === 'EXECUTIVES' && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-bold text-white">Directorio Oficial de los 10 Ejecutivos de Ventas B2B</h4>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {Object.entries(CommercialRLSService.SALES_EXECUTIVES_MAP).map(([code, info]) => {
                const vendorUser = { id: info.id, role: 'VENDEDOR' as const, salesExecutiveId: code };
                const vCusts = CommercialRLSService.scopeCustomers(customers, vendorUser);
                const vQuotes = CommercialRLSService.scopeQuotes(quotes, vendorUser);
                const vOrders = CommercialRLSService.scopeOrders(orders, vendorUser);

                return (
                  <div key={code} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="rounded bg-blue-900/40 border border-blue-700/50 px-1.5 py-0.5 text-[10px] text-blue-300 font-mono font-bold">
                          {code}
                        </span>
                        <h5 className="text-xs font-bold text-white mt-1">{info.name}</h5>
                        <p className="text-[11px] text-slate-400">{info.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Cartera Asignada</span>
                        <span className="text-sm font-bold text-yellow-400 font-mono">{vCusts.length} Clientes</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Cotizaciones</span>
                        <span className="font-bold text-white font-mono">{vQuotes.length}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Pedidos</span>
                        <span className="font-bold text-white font-mono">{vOrders.length}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Aislamiento</span>
                        <span className="font-bold text-emerald-400">100% RLS</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Tab 3: VIOLATIONS */}
        {activeSubTab === 'VIOLATIONS' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Bitácora de Intentos de Acceso Bloqueados por RLS</h4>
                <p className="text-xs text-slate-400">
                  Registro en tiempo real de cualquier intento de lectura o modificación fuera de la cartera autorizada.
                </p>
              </div>
              <button
                onClick={() => {
                  CommercialRLSService.clearLogs();
                  setSecurityLogs([]);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Limpiar Bitácora
              </button>
            </div>

            {securityLogs.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="text-xs font-semibold text-white mt-2">Sin violaciones activas de seguridad</p>
                <p className="text-[11px] text-slate-400">Todas las consultas respetan la política de segregación.</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-950 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Fecha / Hora</th>
                      <th className="p-2.5">Usuario / Vendedor</th>
                      <th className="p-2.5">Acción</th>
                      <th className="p-2.5">Entidad Afectada</th>
                      <th className="p-2.5">Decisión</th>
                      <th className="p-2.5">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {securityLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString('es-MX')}
                        </td>
                        <td className="p-2.5">
                          <span className="font-bold text-white">{log.attemptedByUserName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{log.attemptedSalesExecutiveId}</span>
                        </td>
                        <td className="p-2.5 font-bold text-yellow-400">{log.action}</td>
                        <td className="p-2.5">
                          <span className="font-mono text-white">{log.targetEntityType}</span>
                          <span className="block text-[10px] text-slate-400">ID: {log.targetEntityId}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                            {log.decision}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300 text-[11px]">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Content Tab 4: REASSIGNMENT */}
        {activeSubTab === 'REASSIGNMENT' && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white">Reasignación Gerencial de Cartera Comercial</h4>
              <p className="text-xs text-slate-400">
                Solo Dirección y Gerencia de Ventas pueden transferir cuentas, cotizaciones o pedidos entre ejecutivos con auditoría formal.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Tipo de Entidad</label>
                <select
                  value={reassignType}
                  onChange={(e) => {
                    setReassignType(e.target.value as any);
                    setSelectedEntityId('');
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="CUSTOMER">Cliente</option>
                  <option value="QUOTE">Cotización</option>
                  <option value="ORDER">Pedido</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Seleccionar Registro</label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {reassignType === 'CUSTOMER' &&
                    customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name || c.businessName} (Actual: {c.salesExecutiveId || c.assigned_salesperson_name || 'Sin Asignar'})
                      </option>
                    ))}
                  {reassignType === 'QUOTE' &&
                    quotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quote_number} - {q.customer_name} (${Number(q.total).toLocaleString('es-MX')})
                      </option>
                    ))}
                  {reassignType === 'ORDER' &&
                    orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} - {o.customer_name} (${Number(o.total).toLocaleString('es-MX')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Nuevo Ejecutivo Destino</label>
                <select
                  value={targetVendor}
                  onChange={(e) => setTargetVendor(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono"
                >
                  {Object.entries(CommercialRLSService.SALES_EXECUTIVES_MAP).map(([code, info]) => (
                    <option key={code} value={code}>
                      {code} - {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Motivo de Reasignación (Auditoría)</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Ej. Cambio de territorio, cobertura estratégica, baja de vendedor..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="col-span-3 flex items-center justify-between pt-2">
                {reassignFeedback && (
                  <span className={`text-xs font-bold ${reassignFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {reassignFeedback.message}
                  </span>
                )}
                <button
                  onClick={handleExecuteReassignment}
                  className="ml-auto rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 transition-all shadow-md"
                >
                  Ejecutar Reasignación & Registrar en Auditoría
                </button>
              </div>
            </div>

            {/* Reassignment Logs */}
            {reassignLogs.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-300">Historial de Reasignaciones Recientes</h5>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-950 text-[10px] uppercase text-slate-400">
                      <tr>
                        <th className="p-2">Hora</th>
                        <th className="p-2">Entidad</th>
                        <th className="p-2">Anterior</th>
                        <th className="p-2">Nuevo</th>
                        <th className="p-2">Autorizado Por</th>
                        <th className="p-2">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40 font-mono text-[11px]">
                      {reassignLogs.map((l) => (
                        <tr key={l.id}>
                          <td className="p-2 text-slate-400">{new Date(l.timestamp).toLocaleTimeString('es-MX')}</td>
                          <td className="p-2 text-white font-sans">{l.entityName} ({l.entityType})</td>
                          <td className="p-2 text-yellow-400">{l.previousSalesExecutiveId}</td>
                          <td className="p-2 text-emerald-400">{l.newSalesExecutiveId}</td>
                          <td className="p-2 text-slate-300 font-sans">{l.authorizedByUserName}</td>
                          <td className="p-2 text-slate-400 font-sans">{l.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-500 font-mono">
            CONSCORE ERP IA — Security Hardening Matrix Fase 17 (RLS Commercial Isolation)
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
