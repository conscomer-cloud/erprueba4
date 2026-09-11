import React from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Award,
  Zap,
  ArrowUpRight,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  PieChart,
  Megaphone,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MarketingCampaign, MarketingChannel } from '../../types/erp';

interface MarketingDashboardProps {
  onNavigateTab: (tab: 'DASHBOARD' | 'CAMPAIGNS' | 'ATTRIBUTION' | 'CHANNELS_EXPENSES' | 'SEGMENTS' | 'AI_ADVISOR') => void;
  onSelectCampaign: (campaign: MarketingCampaign) => void;
}

export const MarketingDashboard: React.FC<MarketingDashboardProps> = ({
  onNavigateTab,
  onSelectCampaign,
}) => {
  const {
    marketingKPIs,
    marketingCampaigns,
    marketingChannels,
    campaignExpenses,
    aiMarketingProposals,
  } = useERP();
  const { can } = useAuth();

  const fmtCurrency = (val: number) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  const fmtNumber = (val: number) => (val || 0).toLocaleString('es-MX');

  const pendingProposals = aiMarketingProposals.filter(p => p.status === 'PROPUESTA');

  return (
    <div className="space-y-6">
      {/* AI Notification Banner if pending proposals exist */}
      {pendingProposals.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  {pendingProposals.length} Recomendación(es) Estratégicas de CONSCORE AI
                </h4>
                <p className="text-xs text-amber-800">
                  La IA detectó oportunidades de optimización presupuestaria y ROAS que requieren tu autorización explícita.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('AI_ADVISOR')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
            >
              <Zap className="h-4 w-4" />
              Revisar y Autorizar
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Presupuesto vs Gasto */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inversión Publicitaria</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{fmtCurrency(marketingKPIs.totalMarketingSpent)}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Ppto: {fmtCurrency(marketingKPIs.totalMarketingBudget)}</span>
              <span className="font-semibold text-blue-700">{((marketingKPIs.budgetExecutionPct ?? 0)).toFixed(1)}% ejercido</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${Math.min(100, marketingKPIs.budgetExecutionPct || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ventas Atribuidas & ROAS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Retorno & ROAS</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">{((marketingKPIs.overallROAS ?? 0)).toFixed(2)}x ROAS</div>
            <div className="mt-1 text-xs text-slate-600">
              Ventas Atribuidas: <span className="font-bold text-slate-900">{fmtCurrency(marketingKPIs.totalRevenueAttributed)}</span>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-emerald-600">
              ROI Global: +{((marketingKPIs.overallROI ?? 0)).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Leads & CPL */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Captación de Prospectos</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{fmtNumber(marketingKPIs.totalLeadsGenerated)} Leads</div>
            <div className="mt-1 text-xs text-slate-600">
              CPL Promedio: <span className="font-bold text-slate-900">{fmtCurrency(marketingKPIs.overallCPL)}</span>
            </div>
            <div className="mt-1 text-[11px] text-indigo-600 font-medium">
              {marketingKPIs.totalMQLs} MQL ({Math.round(((marketingKPIs.totalMQLs || 0) / (marketingKPIs.totalLeadsGenerated || 1)) * 100)}% Calificados)
            </div>
          </div>
        </div>

        {/* CAC & Clientes Ganados */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversión a Clientes</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-900">{fmtNumber(marketingKPIs.totalCustomersAcquired)} Clientes</div>
            <div className="mt-1 text-xs text-slate-600">
              CAC Promedio: <span className="font-bold text-slate-900">{fmtCurrency(marketingKPIs.overallCAC)}</span>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-purple-700">
              Tasa Conv. Lead → Venta: {((marketingKPIs.leadToCustomerConversionRate ?? 0)).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Highlights: Top Performing Campaign & Channel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Campaign Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Campaña Más Rentable</h3>
            </div>
            <button
              onClick={() => onNavigateTab('CAMPAIGNS')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col justify-between h-36">
            <div>
              <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 mb-1.5">
                ROAS {marketingKPIs.topPerformingCampaign.roas}x
              </span>
              <h4 className="text-base font-bold text-slate-900 line-clamp-1">
                {marketingKPIs.topPerformingCampaign.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Atribución directa de ventas y captación de clientes de alto valor.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <span className="text-[11px] uppercase text-slate-500 block font-medium">Ventas Atribuidas</span>
                <span className="text-sm font-bold text-slate-900">
                  {fmtCurrency(marketingKPIs.topPerformingCampaign.revenue)}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase text-slate-500 block font-medium">Leads Captados</span>
                <span className="text-sm font-bold text-slate-900">
                  {fmtNumber(marketingKPIs.topPerformingCampaign.leads)} prospectos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Channel Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900">Canal Principal de Adquisición</h3>
            </div>
            <button
              onClick={() => onNavigateTab('CHANNELS_EXPENSES')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Ver canales <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col justify-between h-36">
            <div>
              <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 mb-1.5">
                Mayor Volumen de Leads
              </span>
              <h4 className="text-base font-bold text-slate-900 line-clamp-1">
                {marketingKPIs.topAcquisitionChannel.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Canal con mayor impacto en el pipeline comercial de aislamiento industrial.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <span className="text-[11px] uppercase text-slate-500 block font-medium">Leads Totales</span>
                <span className="text-sm font-bold text-indigo-900">
                  {fmtNumber(marketingKPIs.topAcquisitionChannel.leads)} prospectos
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase text-slate-500 block font-medium">Ventas Atribuidas</span>
                <span className="text-sm font-bold text-slate-900">
                  {fmtCurrency(marketingKPIs.topAcquisitionChannel.revenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance by Channel Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Desempeño por Canal de Marketing</h3>
            <p className="text-xs text-slate-500">Métricas consolidadas de inversión, captación y retorno por canal</p>
          </div>
          <button
            onClick={() => onNavigateTab('ATTRIBUTION')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Layers className="h-4 w-4 text-slate-600" />
            Modelador de Atribución
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3 text-right">Inversión</th>
                <th className="py-2.5 px-3 text-right">Leads</th>
                <th className="py-2.5 px-3 text-right">CPL</th>
                <th className="py-2.5 px-3 text-right">Ventas Atribuidas</th>
                <th className="py-2.5 px-3 text-right">ROAS</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {marketingChannels.map(ch => (
                <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                    {ch.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                      {ch.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium">{fmtCurrency(ch.totalSpent)}</td>
                  <td className="py-3 px-3 text-right font-bold">{ch.leadsGenerated}</td>
                  <td className="py-3 px-3 text-right font-medium">{fmtCurrency(ch.cplAverage)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{fmtCurrency(ch.revenueAttributed)}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-600">{((ch.roas ?? 0)).toFixed(1)}x</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        ch.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Campaigns Table Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campañas Activas & Desempeño</h3>
            <p className="text-xs text-slate-500">Últimos registros de campañas en ejecución</p>
          </div>
          <button
            onClick={() => onNavigateTab('CAMPAIGNS')}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
          >
            Administrar Campañas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Campaña</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3 text-right">Gasto</th>
                <th className="py-2.5 px-3 text-right">Leads</th>
                <th className="py-2.5 px-3 text-right">CPL</th>
                <th className="py-2.5 px-3 text-right">ROAS</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {marketingCampaigns.slice(0, 5).map(camp => (
                <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{camp.code}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{camp.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">UTM: {camp.utmCampaign}</div>
                  </td>
                  <td className="py-3 px-3 font-medium">{camp.channelName}</td>
                  <td className="py-3 px-3 text-right font-medium">{fmtCurrency(camp.actualSpent)}</td>
                  <td className="py-3 px-3 text-right font-bold">{camp.conversionsLeads}</td>
                  <td className="py-3 px-3 text-right font-medium">{fmtCurrency(camp.cpl)}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-600">{camp.roas}x</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        camp.status === 'ACTIVA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : camp.status === 'PAUSADA'
                          ? 'bg-amber-100 text-amber-800'
                          : camp.status === 'BORRADOR'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onSelectCampaign(camp)}
                      className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    >
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
