import React from 'react';
import {
  X,
  Megaphone,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  FileText,
  Tag,
  Sparkles,
  Link2,
  CheckCircle,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { MarketingCampaign } from '../../types/erp';

interface CampaignDetailModalProps {
  campaign: MarketingCampaign;
  onClose: () => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ campaign, onClose }) => {
  const { leads, opportunities, orders, quotes, campaignExpenses } = useERP();

  const fmtCurrency = (val: number) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  // Linked Leads from CRM
  const linkedLeads = leads.filter(
    l => l.campaignId === campaign.id || (l.utmCampaign && l.utmCampaign === campaign.utmCampaign)
  );

  // Linked Opportunities from CRM
  const linkedOpportunities = opportunities.filter(
    o => o.campaignId === campaign.id || linkedLeads.some(l => l.id === o.leadId)
  );

  // Linked Orders from CRM
  const linkedOrders = orders.filter(
    o => o.campaignId === campaign.id || quotes.some(q => q.id === (o.quoteId || o.quote_id) && linkedOpportunities.some(opp => opp.quoteId === q.id))
  );

  // Linked Expenses
  const linkedExpenses = campaignExpenses.filter(e => e.campaignId === campaign.id);

  const budgetExecutionPct = campaign.allocatedBudget > 0 ? (campaign.actualSpent / campaign.allocatedBudget) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700">{campaign.code}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    campaign.status === 'ACTIVA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : campaign.status === 'PAUSADA'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {campaign.status}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {campaign.channelName}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{campaign.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-1">
          {/* Top Performance KPI Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Inversión Real</span>
              <span className="text-lg font-black text-slate-900">{fmtCurrency(campaign.actualSpent)}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {((budgetExecutionPct ?? 0)).toFixed(1)}% de {fmtCurrency(campaign.allocatedBudget)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Retorno (ROAS)</span>
              <span className="text-lg font-black text-emerald-700">{campaign.roas}x</span>
              <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                ROI: +{((campaign.roi ?? 0)).toFixed(1)}%
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Leads Generados</span>
              <span className="text-lg font-black text-indigo-700">{campaign.conversionsLeads}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                CPL: {fmtCurrency(campaign.cpl)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Venta Atribuida</span>
              <span className="text-lg font-black text-slate-900">{fmtCurrency(campaign.revenueAttributed)}</span>
              <span className="text-[11px] font-semibold text-purple-700 block mt-0.5">
                {campaign.ordersWonCount} órdenes ganadas
              </span>
            </div>
          </div>

          {/* Campaign Strategy & UTM Parameters */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-slate-700 mb-3 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-blue-600" />
              Estrategia Comercial & Parámetros UTM
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div>
                <span className="font-semibold text-slate-500 block">Público / Audiencia Objetivo:</span>
                <p className="text-slate-800 mt-0.5">{campaign.targetAudience || 'Prospectos Industriales Generales'}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Objetivo de Campaña:</span>
                <p className="text-slate-800 mt-0.5 font-bold">{campaign.objective}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Periodo de Ejecución:</span>
                <p className="text-slate-800 mt-0.5">{campaign.startDate} al {campaign.endDate || 'Indefinido'}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Etiquetas UTM de Rastreo:</span>
                <div className="mt-1 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-blue-800 break-all">
                  ?utm_source={campaign.utmSource}&utm_medium={campaign.utmMedium}&utm_campaign={campaign.utmCampaign}
                  {campaign.utmTerm ? `&utm_term=${encodeURIComponent(campaign.utmTerm)}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* CRM Attribution: Linked Leads */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                Prospectos (Leads) Vinculados desde el CRM ({linkedLeads.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Entidad única sin duplicar</span>
            </div>

            {linkedLeads.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Aún no hay prospectos asignados directamente a esta campaña.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2 px-2.5">Código / Empresa</th>
                      <th className="py-2 px-2.5">Contacto</th>
                      <th className="py-2 px-2.5 text-center">Score</th>
                      <th className="py-2 px-2.5">Estado CRM</th>
                      <th className="py-2 px-2.5 text-right">Valor Est.</th>
                      <th className="py-2 px-2.5">Vendedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {linkedLeads.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2.5">
                          <div className="font-mono text-[11px] font-bold text-blue-700">{l.id}</div>
                          <div className="font-bold text-slate-900">{l.company}</div>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <div>{l.name}</div>
                          <div className="text-[10px] text-slate-400">{l.email}</div>
                        </td>
                        <td className="py-2.5 px-2.5 text-center">
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-700 text-[10px]">
                            {l.qualificationScore || 70} pts
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              l.status === 'CONVERTIDO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'CALIFICADO'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-bold text-slate-900">
                          {fmtCurrency(l.estimatedValue)}
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-600">{l.salespersonName || 'Sin asignar'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Linked Expenses */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-slate-700 mb-3 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Gastos & Comprobantes Facturados ({linkedExpenses.length})
            </h3>
            {linkedExpenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No hay facturas o gastos registrados individualmente en esta campaña.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2 px-2.5">Fecha</th>
                      <th className="py-2 px-2.5">Factura / Folio</th>
                      <th className="py-2 px-2.5">Proveedor</th>
                      <th className="py-2 px-2.5">Concepto</th>
                      <th className="py-2 px-2.5 text-right">Monto</th>
                      <th className="py-2 px-2.5">Autorizado Por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {linkedExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2.5">{e.date}</td>
                        <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900">{e.invoiceNumber}</td>
                        <td className="py-2.5 px-2.5">{e.providerName}</td>
                        <td className="py-2.5 px-2.5 text-slate-600">{e.concept}</td>
                        <td className="py-2.5 px-2.5 text-right font-bold text-slate-900">{fmtCurrency(e.amount)}</td>
                        <td className="py-2.5 px-2.5 text-slate-500 text-[11px]">{e.authorizedByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 pt-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
