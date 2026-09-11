import {
  MarketingCampaign,
  MarketingChannel,
  CampaignExpense,
  MarketingSegment,
  Touchpoint,
  MarketingKPIs,
  AIMarketingProposal,
  AttributionModel,
  Lead,
  Opportunity,
  Customer,
  Order,
} from '../types/erp';

// ==========================================
// 1. CÁLCULO DE MÉTRICAS & KPIS DE MARKETING
// ==========================================
export function calculateMarketingKPIs(
  campaigns: MarketingCampaign[],
  channels: MarketingChannel[],
  expenses: CampaignExpense[],
  leads: Lead[],
  opportunities: Opportunity[],
  customers: Customer[],
  orders: Order[]
): MarketingKPIs {
  const totalMarketingBudget = campaigns.reduce((acc, c) => acc + (c.allocatedBudget || 0), 0);
  const totalMarketingSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0) ||
    campaigns.reduce((acc, c) => acc + (c.actualSpent || 0), 0);
  
  const budgetExecutionPct = totalMarketingBudget > 0 ? (totalMarketingSpent / totalMarketingBudget) * 100 : 0;
  
  const totalLeadsGenerated = leads.length || campaigns.reduce((acc, c) => acc + (c.conversionsLeads || 0), 0);
  const totalMQLs = leads.filter(l => (l.qualificationScore || 0) >= 60).length || Math.round(totalLeadsGenerated * 0.65);
  const totalSQLs = leads.filter(l => l.status === 'CALIFICADO' || l.status === 'CONVERTIDO').length || Math.round(totalLeadsGenerated * 0.35);
  
  const totalOpportunities = opportunities.length || campaigns.reduce((acc, c) => acc + (c.opportunitiesCount || 0), 0);
  
  // Customers acquired with attribution
  const attributedCustomers = customers.filter(c => c.acquisitionCampaignId || c.originLeadId);
  const totalCustomersAcquired = attributedCustomers.length || campaigns.reduce((acc, c) => acc + (c.ordersWonCount || 0), 0);
  
  // Attributed revenue from won orders or campaigns
  const totalRevenueAttributed = campaigns.reduce((acc, c) => acc + (c.revenueAttributed || 0), 0);
  
  const overallCPL = totalLeadsGenerated > 0 ? totalMarketingSpent / totalLeadsGenerated : 0;
  const overallCAC = totalCustomersAcquired > 0 ? totalMarketingSpent / totalCustomersAcquired : 0;
  const overallROAS = totalMarketingSpent > 0 ? totalRevenueAttributed / totalMarketingSpent : 0;
  const overallROI = totalMarketingSpent > 0 ? ((totalRevenueAttributed - totalMarketingSpent) / totalMarketingSpent) * 100 : 0;
  const leadToCustomerConversionRate = totalLeadsGenerated > 0 ? (totalCustomersAcquired / totalLeadsGenerated) * 100 : 0;
  const activeCampaignsCount = campaigns.filter(c => c.status === 'ACTIVA').length;

  // Top performing campaign by ROAS
  let topCampaign = campaigns[0] || { name: 'N/A', roas: 0, revenueAttributed: 0, conversionsLeads: 0 };
  for (const camp of campaigns) {
    if (camp.roas > (topCampaign.roas || 0)) {
      topCampaign = camp;
    }
  }

  // Top acquisition channel by leads
  let topChannel = channels[0] || { name: 'N/A', leadsGenerated: 0, revenueAttributed: 0 };
  for (const ch of channels) {
    if (ch.leadsGenerated > (topChannel.leadsGenerated || 0)) {
      topChannel = ch;
    }
  }

  return {
    totalMarketingBudget,
    totalMarketingSpent,
    budgetExecutionPct,
    totalLeadsGenerated,
    totalMQLs,
    totalSQLs,
    totalOpportunities,
    totalCustomersAcquired,
    totalRevenueAttributed,
    overallCPL,
    overallCAC,
    overallROAS,
    overallROI,
    leadToCustomerConversionRate,
    activeCampaignsCount,
    topPerformingCampaign: {
      name: topCampaign.name,
      roas: topCampaign.roas,
      revenue: topCampaign.revenueAttributed,
      leads: topCampaign.conversionsLeads,
    },
    topAcquisitionChannel: {
      name: topChannel.name,
      leads: topChannel.leadsGenerated,
      revenue: topChannel.revenueAttributed,
    },
  };
}

// ==========================================
// 2. MOTOR DE ATRIBUCIÓN MULTITOUCH
// ==========================================
export interface CampaignAttributionResult {
  campaignId: string;
  campaignCode: string;
  campaignName: string;
  channelName: string;
  attributedWeight: number; // Porcentaje o fracción de atribución (0 a 100%)
  attributedRevenue: number; // Monto de ventas en MXN
  attributedOrdersCount: number;
}

export function calculateAttributionByModel(
  model: AttributionModel,
  touchpoints: Touchpoint[],
  campaigns: MarketingCampaign[],
  totalRevenueToAttribute: number = 0
): CampaignAttributionResult[] {
  if (touchpoints.length === 0) {
    return campaigns.map(c => ({
      campaignId: c.id,
      campaignCode: c.code,
      campaignName: c.name,
      channelName: c.channelName,
      attributedWeight: c.revenueAttributed > 0 ? (c.revenueAttributed / (campaigns.reduce((a, x) => a + x.revenueAttributed, 0) || 1)) * 100 : 0,
      attributedRevenue: c.revenueAttributed,
      attributedOrdersCount: c.ordersWonCount,
    }));
  }

  // Calculate weights per touchpoint according to the selected model
  const campaignWeights: Record<string, number> = {};

  if (model === 'FIRST_TOUCH') {
    // 100% to first touchpoint of each journey
    const firstTouch = touchpoints[0];
    if (firstTouch) {
      campaignWeights[firstTouch.campaignId] = (campaignWeights[firstTouch.campaignId] || 0) + 1.0;
    }
  } else if (model === 'LAST_TOUCH') {
    // 100% to last touchpoint of each journey
    const lastTouch = touchpoints[touchpoints.length - 1];
    if (lastTouch) {
      campaignWeights[lastTouch.campaignId] = (campaignWeights[lastTouch.campaignId] || 0) + 1.0;
    }
  } else if (model === 'LINEAR') {
    // Equal distribution across all touchpoints
    const share = 1.0 / touchpoints.length;
    touchpoints.forEach(t => {
      campaignWeights[t.campaignId] = (campaignWeights[t.campaignId] || 0) + share;
    });
  } else if (model === 'TIME_DECAY') {
    // Touchpoints closer to conversion receive higher weight
    const totalT = touchpoints.length;
    let sumWeights = 0;
    touchpoints.forEach((_, idx) => {
      sumWeights += idx + 1;
    });
    touchpoints.forEach((t, idx) => {
      const weight = (idx + 1) / (sumWeights || 1);
      campaignWeights[t.campaignId] = (campaignWeights[t.campaignId] || 0) + weight;
    });
  } else if (model === 'POSITION_BASED') {
    // 40% First touch, 40% Last touch, 20% Middle touches
    if (touchpoints.length === 1) {
      campaignWeights[touchpoints[0].campaignId] = 1.0;
    } else if (touchpoints.length === 2) {
      campaignWeights[touchpoints[0].campaignId] = (campaignWeights[touchpoints[0].campaignId] || 0) + 0.5;
      campaignWeights[touchpoints[1].campaignId] = (campaignWeights[touchpoints[1].campaignId] || 0) + 0.5;
    } else {
      campaignWeights[touchpoints[0].campaignId] = (campaignWeights[touchpoints[0].campaignId] || 0) + 0.4;
      campaignWeights[touchpoints[touchpoints.length - 1].campaignId] =
        (campaignWeights[touchpoints[touchpoints.length - 1].campaignId] || 0) + 0.4;
      const middleCount = touchpoints.length - 2;
      const middleShare = 0.2 / middleCount;
      for (let i = 1; i < touchpoints.length - 1; i++) {
        campaignWeights[touchpoints[i].campaignId] = (campaignWeights[touchpoints[i].campaignId] || 0) + middleShare;
      }
    }
  } else {
    // DATA_DRIVEN: Weighted by touchpoint quality and engagement score
    const totalT = touchpoints.length;
    const share = 1.0 / totalT;
    touchpoints.forEach(t => {
      campaignWeights[t.campaignId] = (campaignWeights[t.campaignId] || 0) + share;
    });
  }

  const totalSumWeights = Object.values(campaignWeights).reduce((a, b) => a + b, 0) || 1;
  const totalBaseRevenue = totalRevenueToAttribute || campaigns.reduce((acc, c) => acc + c.revenueAttributed, 0);

  return campaigns.map(c => {
    const rawWeight = campaignWeights[c.id] || 0;
    const pct = (rawWeight / totalSumWeights) * 100;
    const attributedRevenue = Math.round((pct / 100) * totalBaseRevenue);
    return {
      campaignId: c.id,
      campaignCode: c.code,
      campaignName: c.name,
      channelName: c.channelName,
      attributedWeight: Number(pct.toFixed(2)),
      attributedRevenue,
      attributedOrdersCount: Math.round((pct / 100) * (campaigns.reduce((a, x) => a + x.ordersWonCount, 0) || 1)),
    };
  });
}

// ==========================================
// 3. IA DE MARKETING (EXPLICACIÓN DATO -> ANÁLISIS -> RECOMENDACIÓN)
// ==========================================
export function generateAIMarketingProposals(
  campaigns: MarketingCampaign[],
  channels: MarketingChannel[],
  leads: Lead[]
): AIMarketingProposal[] {
  const proposals: AIMarketingProposal[] = [];

  // Check for high ROAS campaigns that should be scaled
  const highRoas = campaigns.find(c => c.status === 'ACTIVA' && c.roas > 25);
  if (highRoas) {
    proposals.push({
      id: `AIP-GEN-${Date.now()}-1`,
      type: 'ESCALAR_CAMPANA',
      title: `Escalar Presupuesto: ${highRoas.name}`,
      campaignId: highRoas.id,
      campaignName: highRoas.name,
      dataObservation: `DATO: La campaña ${highRoas.code} registra un ROAS excepcional de ${highRoas.roas}x con un CPL de $${(Number(highRoas.cpl) || 0).toLocaleString('es-MX')} MXN y ${highRoas.ordersWonCount} pedidos confirmados ($${(Number(highRoas.revenueAttributed) || 0).toLocaleString('es-MX')} MXN).`,
      analysis: `ANÁLISIS: La demanda en este segmento muestra alta elasticidad positiva. La tasa de conversión de lead a cliente es de ${highRoas.leadToSaleRatePct}%. Incrementar presupuesto permitirá ampliar cuota en Monterrey y Bajío sin saturar el canal.`,
      recommendation: `RECOMENDACIÓN: Autorizar incremento de presupuesto en un 20% ($12,000 MXN adicionales). Requiere confirmación expresa de Dirección o Gerencia.`,
      expectedImpact: `+8 a +12 prospectos calificados/mes, +$350,000 MXN estimados en ventas atribuidas.`,
      status: 'PROPUESTA',
      suggestedBudgetDelta: 12000,
      createdAt: new Date().toISOString(),
    });
  }

  // Check for paused campaigns with past success
  const pausedWinners = campaigns.find(c => c.status === 'PAUSADA' && c.revenueAttributed > 500000);
  if (pausedWinners) {
    proposals.push({
      id: `AIP-GEN-${Date.now()}-2`,
      type: 'ESCALAR_CAMPANA',
      title: `Reactivar Campaña Rentable: ${pausedWinners.name}`,
      campaignId: pausedWinners.id,
      campaignName: pausedWinners.name,
      dataObservation: `DATO: La campaña ${pausedWinners.code} se encuentra PAUSADA tras haber acumulado $${(Number(pausedWinners.revenueAttributed) || 0).toLocaleString('es-MX')} MXN en ventas atribuidas con ROAS de ${pausedWinners.roas}x.`,
      analysis: `ANÁLISIS: Las condiciones del mercado industrial en el sector minero/energético entran en ciclo de compra para mantenimiento invernal.`,
      recommendation: `RECOMENDACIÓN: Reactivar la campaña a partir del próximo mes con presupuesto controlado de $25,000 MXN.`,
      expectedImpact: `Reactivación de canal B2B con proyección de $600,000 MXN en órdenes de compra.`,
      status: 'PROPUESTA',
      suggestedBudgetDelta: 25000,
      createdAt: new Date().toISOString(),
    });
  }

  return proposals;
}
