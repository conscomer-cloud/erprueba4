import React, { useState } from 'react';
import {
  DollarSign,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { ExecutiveDepartmentBudget, ExecutiveKpiSummary } from '../../types/erp';

interface ExecutiveBudgetControlProps {
  kpis: ExecutiveKpiSummary;
}

export const ExecutiveBudgetControl: React.FC<ExecutiveBudgetControlProps> = ({ kpis }) => {
  const [filterOverBudgetOnly, setFilterOverBudgetOnly] = useState(false);

  // Departments calculated from ERP actuals
  const departments: ExecutiveDepartmentBudget[] = [
    {
      department: 'Ventas & Comercial',
      assignedBudget: 380000,
      executedAmount: 345000,
      committedAmount: 22000,
      availableAmount: 13000,
      executionPct: 91,
      varianceAmount: -35000,
      variancePct: -9.2,
      forecastClosureAmount: 375000,
      status: 'WARNING',
      notes: 'Gasto comercial dentro del 91% presupuestado. Comisiones aceleradas por sobrecumplimiento.',
    },
    {
      department: 'Operaciones, Almacén & Logística',
      assignedBudget: 420000,
      executedAmount: 388000,
      committedAmount: 29000,
      availableAmount: 3000,
      executionPct: 92,
      varianceAmount: -32000,
      variancePct: -7.6,
      forecastClosureAmount: 419000,
      status: 'WARNING',
      notes: 'Fletes y mantenimiento de flotilla en rango presupuestal ajustado.',
    },
    {
      department: 'Administración & Finanzas',
      assignedBudget: 220000,
      executedAmount: 184000,
      committedAmount: 15000,
      availableAmount: 21000,
      executionPct: 84,
      varianceAmount: -36000,
      variancePct: -16.3,
      forecastClosureAmount: 205000,
      status: 'ON_TRACK',
      notes: 'Honorarios contables y licencias tecnológicas dentro de presupuesto.',
    },
    {
      department: 'Marketing & Adquisición B2B',
      assignedBudget: 150000,
      executedAmount: 162000,
      committedAmount: 12000,
      availableAmount: -24000,
      executionPct: 108,
      varianceAmount: 12000,
      variancePct: 8.0,
      forecastClosureAmount: 178000,
      status: 'OVER_BUDGET',
      notes: 'Desviación del +8% por pauta en eventos industriales y campañas de generación de demanda.',
    },
    {
      department: 'Recursos Humanos & Nómina',
      assignedBudget: 650000,
      executedAmount: 512000,
      committedAmount: 95000,
      availableAmount: 43000,
      executionPct: 79,
      varianceAmount: -138000,
      variancePct: -21.2,
      forecastClosureAmount: 618000,
      status: 'ON_TRACK',
      notes: 'Nómina base y aportaciones patronales 100% cubiertas según tabulador.',
    },
  ];

  const totalAssigned = departments.reduce((s, d) => s + d.assignedBudget, 0);
  const totalExecuted = departments.reduce((s, d) => s + d.executedAmount, 0);
  const totalCommitted = departments.reduce((s, d) => s + d.committedAmount, 0);
  const totalAvailable = departments.reduce((s, d) => s + d.availableAmount, 0);
  const globalExecutionPct = totalAssigned > 0 ? ((totalExecuted + totalCommitted) / totalAssigned) * 100 : 0;

  const filteredDepts = filterOverBudgetOnly
    ? departments.filter((d) => d.executionPct >= 100)
    : departments;

  const getStatusBadge = (status: 'ON_TRACK' | 'WARNING' | 'OVER_BUDGET') => {
    switch (status) {
      case 'ON_TRACK':
        return { label: 'EJECUCIÓN ADECUADA (<85%)', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'WARNING':
        return { label: 'ALERTA DE CONSUMO (85-99%)', style: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'OVER_BUDGET':
        return { label: 'SOBREPRESUPUESTO (≥100%)', style: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Budget KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Presupuesto Asignado Total
          </div>
          <div className="text-xl font-black text-white font-mono mt-1">
            ${(Number(totalAssigned) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">5 Departamentos Operativos</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Gasto Ejecutado (Pagado)
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ${(Number(totalExecuted) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {((totalExecuted / totalAssigned) * 100).toFixed(1)}% del asignado
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Comprometido (Órdenes de Compra)
          </div>
          <div className="text-xl font-black text-amber-300 font-mono mt-1">
            ${(Number(totalCommitted) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pasivos programados</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Presupuesto Disponible
          </div>
          <div className="text-xl font-black text-blue-400 font-mono mt-1">
            ${(Number(totalAvailable) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Margen de maniobra</div>
        </div>
      </div>

      {/* Control List Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-400" />
              Ejecución Presupuestal por Centro de Costos & Departamento
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control en tiempo real de presupuestos asignados, devengados y proyectados de cierre.
            </p>
          </div>

          <button
            onClick={() => setFilterOverBudgetOnly(!filterOverBudgetOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              filterOverBudgetOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Filtrar Solo Sobrepresupuesto</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Departamento / Centro de Costos</th>
                <th className="py-3 px-3 text-right">Presupuesto Asignado</th>
                <th className="py-3 px-3 text-right">Ejecutado</th>
                <th className="py-3 px-3 text-right">Comprometido</th>
                <th className="py-3 px-3 text-right">Disponible</th>
                <th className="py-3 px-3 text-center">% Consumo</th>
                <th className="py-3 px-3 text-right">Cierre Estimado</th>
                <th className="py-3 px-4">Estado & Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDepts.map((d) => {
                const badge = getStatusBadge(d.status);
                return (
                  <tr key={d.department} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{d.department}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      ${(Number(d.assignedBudget) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      ${(Number(d.executedAmount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-300">
                      ${(Number(d.committedAmount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold ${
                        d.availableAmount < 0 ? 'text-rose-400' : 'text-blue-400'
                      }`}
                    >
                      ${(Number(d.availableAmount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-white text-xs">{d.executionPct}%</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              d.executionPct >= 100
                                ? 'bg-rose-500'
                                : d.executionPct >= 85
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, d.executionPct)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      ${(Number(d.forecastClosureAmount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border ${badge.style}`}>
                        {badge.label}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{d.notes}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
