import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { CommissionRecord, CommissionRule, PayrollPeriod } from '../../types/erp';

export const CommissionsAndPayroll: React.FC = () => {
  const {
    commissionRecords,
    commissionRules,
    payrollPeriods,
    employees,
    orders,
    confidentialData,
    approveCommissionRecord: approveCommission,
    calculatePayrollRun,
    approvePayrollPeriod,
  } = useERP();

  const { can, currentUser: user } = useAuth();
  const canManagePayroll = can('RH', 'EDITAR') || can('FINANZAS', 'EDITAR') || user?.role === 'ADMINISTRADOR' || user?.role === 'DIRECTOR';

  const [activeTab, setActiveTab] = useState<'COMMISSIONS' | 'RULES' | 'PRE_PAYROLL'>('COMMISSIONS');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState(payrollPeriods[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const currentPayroll = payrollPeriods.find((p) => p.id === selectedPeriod) || payrollPeriods[0];

  const filteredCommissions = commissionRecords.filter((com) => {
    const matchesStatus = selectedStatus === 'ALL' || com.status === selectedStatus;
    const matchesSearch =
      (com.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (com.orderFolio || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (com.folio || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCommissionsEarned = commissionRecords.reduce(
    (sum, c) => sum + (c.commissionAmount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Total Comisiones Devengadas
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              ${(Number(totalCommissionsEarned) || 0).toLocaleString('es-MX')}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">MXN</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Vinculadas a pedidos y margen bruto real</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Reglas de Comisión Activas
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{commissionRules.filter((r) => r.active).length}</span>
            <span className="text-xs text-blue-600 font-semibold">esquemas</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1">Con escalones por cumplimiento de cuota</p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            Pre-Nómina del Periodo
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">
              ${(currentPayroll?.totalNetToPay ?? 0).toLocaleString('es-MX')}
            </span>
            <span className="text-xs text-indigo-600 font-semibold">Neto estimado</span>
          </div>
          <p className="text-[11px] text-indigo-700 mt-1">Periodo: {currentPayroll?.name || 'Sin periodo'}</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Comisiones Comerciales & Pre-Nómina
            </h2>
            <p className="text-xs text-slate-500">
              Cálculo automatizado de comisiones por venta y margen, y pre-cierre quincenal de percepciones y deducciones
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManagePayroll && activeTab === 'PRE_PAYROLL' && (
              <button
                onClick={() => {
                  calculatePayrollRun(selectedPeriod);
                  alert('Pre-nómina recalculada exitosamente con asistencias y comisiones actualizadas.');
                }}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Recalcular Pre-Nómina
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('COMMISSIONS')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'COMMISSIONS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Registro de Comisiones ({commissionRecords.length})
          </button>

          <button
            onClick={() => setActiveTab('RULES')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'RULES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Reglas y Políticas de Comisión ({commissionRules.length})
          </button>

          <button
            onClick={() => setActiveTab('PRE_PAYROLL')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'PRE_PAYROLL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Pre-Nómina Quincenal ({currentPayroll?.employeesCount || 18} Colaboradores)
          </button>
        </div>
      </div>

      {/* TAB 1: COMMISSIONS LIST */}
      {activeTab === 'COMMISSIONS' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PENDING_APPROVAL">Pendiente de Aprobación</option>
                <option value="APPROVED">Aprobada</option>
                <option value="PAID">Pagada</option>
              </select>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar por vendedor o pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Pedido ERP</th>
                  <th className="px-4 py-3 text-right">Venta Facturada</th>
                  <th className="px-4 py-3 text-right">Margen Bruto</th>
                  <th className="px-4 py-3 text-center">Tasa Aplicada</th>
                  <th className="px-4 py-3 text-right">Comisión Devengada</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCommissions.map((com) => (
                  <tr key={com.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{com.folio}</td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{com.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{com.employeeId}</span>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {com.orderFolio}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ${(Number(com.baseAmount) || 0).toLocaleString('es-MX')}
                    </td>

                    <td className="px-4 py-3 text-right font-mono">
                      <span className="text-slate-700">${(Number(com.grossMarginAmount) || 0).toLocaleString('es-MX')}</span>
                      <span className="text-[10px] text-emerald-600 block font-bold">
                        ({((com.grossMarginPct ?? 0)).toFixed(1)}%)
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-900 text-[11px]">
                        {com.commissionRate}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 text-sm">
                      +${(Number(com.commissionAmount) || 0).toLocaleString('es-MX')}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          com.status === 'APPROVED' || com.status === 'APROBADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : com.status === 'PAID' || com.status === 'PAGADA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {com.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {(com.status === 'PENDING_APPROVAL' || com.status === 'CALCULATED') && canManagePayroll && (
                        <button
                          onClick={() => approveCommission(com.id)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                        >
                          Aprobar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RULES */}
      {activeTab === 'RULES' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {commissionRules.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-900">
                    {rule.code || rule.id}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">{rule.name}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                    rule.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {rule.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <p className="text-xs text-slate-600">{rule.description}</p>

              {rule.minMarginRequiredPct && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Bloqueo de Margen Mínimo: <b>{rule.minMarginRequiredPct}%</b> (No comisiona si el margen es menor)</span>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400">Escalones de Comisión</span>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-xs">
                  {rule.tiers?.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <span className="text-slate-700 font-medium">
                        {t.description || `${t.minPercent}% a ${t.maxPercent}% de meta`}
                      </span>
                      <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {t.rate}% {t.bonusFixed ? `+ $${t.bonusFixed} bono` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PRE-PAYROLL RUN */}
      {activeTab === 'PRE_PAYROLL' && currentPayroll && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-200/60 px-2 py-0.5 rounded">
                Simulación de Pre-Nómina
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">{currentPayroll.name}</h3>
              <p className="text-xs text-slate-600">
                Periodo: {currentPayroll.startDate} al {currentPayroll.endDate} — Fecha de Pago Programada: {currentPayroll.paymentDate}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {currentPayroll.status === 'BORRADOR' && canManagePayroll && (
                <button
                  onClick={() => approvePayrollPeriod(currentPayroll.id)}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-indigo-700 transition"
                >
                  Aprobar Pre-Nómina Quincenal
                </button>
              )}
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                  currentPayroll.status === 'APROBADA' || currentPayroll.status === 'PAGADA'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {currentPayroll.status}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-4 py-3 text-right">Sueldo Base</th>
                    <th className="px-4 py-3 text-right">Comisiones</th>
                    <th className="px-4 py-3 text-right">Horas Extras / Bonos</th>
                    <th className="px-4 py-3 text-right">Percepciones Totales</th>
                    <th className="px-4 py-3 text-right">Deducciones (ISR/IMSS)</th>
                    <th className="px-4 py-3 text-right font-black">Neto a Pagar</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(currentPayroll.items || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{item.employeeName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.employeeId}</span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono">
                        ${(Number(item.baseSalary) || 0).toLocaleString('es-MX')}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                        {item.commissionsAmount > 0 ? `+$${(Number(item.commissionsAmount) || 0).toLocaleString('es-MX')}` : '—'}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {item.bonusesAmount > 0 || (item.overtimeAmount && item.overtimeAmount > 0)
                          ? `+$${((item.bonusesAmount || 0) + (item.overtimeAmount || 0)).toLocaleString('es-MX')}`
                          : '—'}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ${(Number(item.totalPerceptions) || 0).toLocaleString('es-MX')}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-red-600">
                        -${(Number(item.totalDeductions) || 0).toLocaleString('es-MX')}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-sm bg-slate-50/60">
                        ${(Number(item.netPay) || 0).toLocaleString('es-MX')}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
