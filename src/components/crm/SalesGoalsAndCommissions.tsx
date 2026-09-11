import React, { useState } from 'react';
import {
  Trophy,
  Target,
  DollarSign,
  TrendingUp,
  Percent,
  Award,
  Users,
  Calendar,
  Sparkles,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { SalesGoal, CommissionRule } from '../../types/erp';

export const SalesGoalsAndCommissions: React.FC = () => {
  const { salesGoals, commissionRules, updateSalesGoal } = useERP();
  const { can } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState('Agosto 2026');
  const [editingGoal, setEditingGoal] = useState<SalesGoal | null>(null);
  const [editTargetValue, setEditTargetValue] = useState<number>(0);

  const monthGoals = salesGoals.filter((g) => (g.period === selectedMonth || (g as any).month === selectedMonth));

  // Overall metrics
  const totalTarget = monthGoals.reduce((acc, g) => acc + (g.targetAmount ?? g.goalAmount ?? 0), 0);
  const totalAchieved = monthGoals.reduce((acc, g) => acc + (g.achievedAmount ?? g.actualSales ?? 0), 0);
  const overallProgress = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
  const totalCommissions = monthGoals.reduce((acc, g) => acc + (g.commissionEarned ?? g.commissionEstimated ?? 0), 0);

  // Leaderboard sorted by achieved amount descending
  const leaderboard = [...monthGoals].sort((a, b) => (b.achievedAmount ?? b.actualSales ?? 0) - (a.achievedAmount ?? a.actualSales ?? 0));

  const handleOpenEdit = (goal: SalesGoal) => {
    setEditingGoal(goal);
    setEditTargetValue(goal.targetAmount ?? goal.goalAmount ?? 0);
  };

  const handleSaveGoal = () => {
    if (editingGoal) {
      updateSalesGoal(editingGoal.id, { goalAmount: editTargetValue, targetAmount: editTargetValue });
      setEditingGoal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Target */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Cuota Global Equipo</span>
            <Target className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">${(Number(totalTarget) || 0).toLocaleString('es-MX')}</p>
          <span className="text-[11px] text-slate-500 font-mono">Mes: Agosto 2026</span>
        </div>

        {/* Total Achieved */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ventas Cerradas Mes</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">${(Number(totalAchieved) || 0).toLocaleString('es-MX')}</p>
          <span className="text-[11px] text-slate-400 font-medium">
            Faltante: ${(Math.max(0, totalTarget - totalAchieved)).toLocaleString('es-MX')} MXN
          </span>
        </div>

        {/* Progress % */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Cumplimiento Global</span>
            <Percent className="h-5 w-5 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{overallProgress.toFixed(1)}%</p>
          <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                overallProgress >= 100 ? 'bg-emerald-500' : overallProgress >= 70 ? 'bg-yellow-400' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </div>

        {/* Commissions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Comisiones Calculadas</span>
            <DollarSign className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-yellow-400">${(Number(totalCommissions) || 0).toLocaleString('es-MX')}</p>
          <span className="text-[11px] text-slate-500">6 vendedores en nómina variable</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-slate-950">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tabla de Posiciones & Avance de Metas (Leaderboard)</h3>
              <p className="text-xs text-slate-400">Rendimiento individual y cálculo automático de comisiones</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
            >
              <option value="2026-08">Agosto 2026 (Mes Actual)</option>
              <option value="2026-07">Julio 2026</option>
              <option value="2026-09">Septiembre 2026 (Forecast)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3 text-center w-12">#</th>
                <th className="px-6 py-3">Ejecutivo Comercial</th>
                <th className="px-6 py-3 text-right">Meta Asignada</th>
                <th className="px-6 py-3 text-right">Venta Lograda</th>
                <th className="px-6 py-3 text-center">Avance %</th>
                <th className="px-6 py-3 text-right">Comisión Devengada</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaderboard.map((repGoal, idx) => {
                const target = repGoal.targetAmount ?? repGoal.goalAmount ?? 0;
                const achieved = repGoal.achievedAmount ?? repGoal.actualSales ?? 0;
                const commission = repGoal.commissionEarned ?? repGoal.commissionEstimated ?? 0;
                const pct = repGoal.fulfillmentPct ?? (target > 0 ? (achieved / target) * 100 : 0);
                const isTop1 = idx === 0;
                const isTop2 = idx === 1;
                const isTop3 = idx === 2;

                return (
                  <tr key={repGoal.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Rank */}
                    <td className="px-6 py-4 text-center">
                      {isTop1 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 font-black text-slate-950 text-xs shadow-xs">
                          🥇
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 font-black text-slate-950 text-xs shadow-xs">
                          🥈
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 font-black text-white text-xs shadow-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="font-mono text-slate-500 font-bold text-sm">{idx + 1}</span>
                      )}
                    </td>

                    {/* Salesperson */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-white text-sm block">{repGoal.salespersonName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">ID: {repGoal.salespersonId}</span>
                    </td>

                    {/* Meta */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-200 text-sm">
                        ${(Number(target) || 0).toLocaleString('es-MX')}
                      </span>
                      <span className="block text-[10px] text-slate-500">MXN</span>
                    </td>

                    {/* Venta Lograda */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-400 text-sm">
                        ${(Number(achieved) || 0).toLocaleString('es-MX')}
                      </span>
                      <span className="block text-[10px] text-slate-500">Facturado / Pagado</span>
                    </td>

                    {/* Avance % */}
                    <td className="px-6 py-4">
                      <div className="w-36 mx-auto space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className={pct >= 100 ? 'text-emerald-400' : 'text-slate-300'}>
                            {pct.toFixed(1)}%
                          </span>
                          {pct >= 100 && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              ✓ Meta Superada
                            </span>
                          )}
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              pct >= 100
                                ? 'bg-emerald-500'
                                : pct >= 75
                                ? 'bg-yellow-400'
                                : pct >= 50
                                ? 'bg-blue-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Comisión Devengada */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-yellow-400 text-sm">
                        ${(Number(commission) || 0).toLocaleString('es-MX')}
                      </span>
                      <span className="block text-[10px] text-slate-500">Esquema Escalonado</span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(repGoal)}
                        title="Modificar Cuota de Venta"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Ajustar Meta
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Scheme Rules Configuration Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-slate-950">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Reglas & Tabulador de Comisiones CONSCORE</h4>
            <p className="text-xs text-slate-400">
              Cálculo transparente basado en volumen vendido y cumplimiento de margen mínimo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {commissionRules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{rule.name}</span>
                <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-black text-yellow-300 border border-yellow-400/30">
                  {rule.basePercentage}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {rule.condition || rule.description || 'Sin condición registrada'}
              </p>
              {rule.bonusPercentage && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold pt-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  + {rule.bonusPercentage}% Bono extra · {rule.condition}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-bold text-white">Ajustar Cuota Mensual de Venta</h4>
              <button onClick={() => setEditingGoal(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Vendedor</label>
                <p className="text-sm font-bold text-white">{editingGoal.salespersonName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nueva Cuota ($ MXN)</label>
                <input
                  type="number"
                  step="10000"
                  value={editTargetValue}
                  onChange={(e) => setEditTargetValue(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300"
                >
                  Guardar Cuota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
