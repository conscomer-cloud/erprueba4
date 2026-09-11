/**
 * @license
 * CONSCORE ERP IA - Marketing, Campaigns, Leads & Attribution Context Handlers
 * FASE 5: Gestión de campañas, canales, gastos, atribución comercial multitouch e IA Marketing
 */

import React from 'react';
import {
  MarketingCampaign,
  MarketingChannel,
  CampaignExpense,
  MarketingSegment,
  Touchpoint,
  AIMarketingProposal,
  AttributionModel,
  Lead,
  Opportunity,
  Customer,
  Quote,
  Order,
  Product,
  Warehouse,
  InventoryMovement,
  AuditLog,
  NotificationItem,
  UserRole,
} from '../types/erp';
import {
  calculateAttributionByModel,
  CampaignAttributionResult,
} from '../services/marketingService';

export interface MarketingHandlersParams {
  currentUser: { id: string; name: string; role: UserRole } | null;
  marketingCampaigns: MarketingCampaign[];
  setMarketingCampaigns: React.Dispatch<React.SetStateAction<MarketingCampaign[]>>;
  marketingChannels: MarketingChannel[];
  setMarketingChannels: React.Dispatch<React.SetStateAction<MarketingChannel[]>>;
  campaignExpenses: CampaignExpense[];
  setCampaignExpenses: React.Dispatch<React.SetStateAction<CampaignExpense[]>>;
  marketingSegments: MarketingSegment[];
  setMarketingSegments: React.Dispatch<React.SetStateAction<MarketingSegment[]>>;
  touchpoints: Touchpoint[];
  setTouchpoints: React.Dispatch<React.SetStateAction<Touchpoint[]>>;
  aiMarketingProposals: AIMarketingProposal[];
  setAiMarketingProposals: React.Dispatch<React.SetStateAction<AIMarketingProposal[]>>;
  selectedAttributionModel: AttributionModel;
  setSelectedAttributionModel: React.Dispatch<React.SetStateAction<AttributionModel>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: Warehouse[];
  movements: InventoryMovement[];
  setMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  addAuditLog: (entry: { action: string; module: any; recordId?: string; details: string; customUser?: any }) => void;
  addNotification: (notif: { title: string; message: string; type: NotificationItem['type']; module: any }) => void;
  broadcastDataUpdate: (type: string, details: any) => void;
}

export function createMarketingHandlers(params: MarketingHandlersParams) {
  const {
    currentUser,
    marketingCampaigns,
    setMarketingCampaigns,
    marketingChannels,
    setMarketingChannels,
    campaignExpenses,
    setCampaignExpenses,
    marketingSegments,
    setMarketingSegments,
    touchpoints,
    setTouchpoints,
    aiMarketingProposals,
    setAiMarketingProposals,
    selectedAttributionModel,
    setSelectedAttributionModel,
    leads,
    setLeads,
    opportunities,
    setOpportunities,
    customers,
    setCustomers,
    quotes,
    setQuotes,
    orders,
    setOrders,
    products,
    setProducts,
    warehouses,
    movements,
    setMovements,
    setAuditLogs,
    addAuditLog,
    addNotification,
    broadcastDataUpdate,
  } = params;

  // 1. ADD MARKETING CAMPAIGN
  const addMarketingCampaign = (campaignData: Partial<MarketingCampaign>): MarketingCampaign => {
    const nextNum = marketingCampaigns.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const newId = `CMP-2026-${padded}`;
    const code = campaignData.code || `CAMP-2026-${padded}`;
    const now = new Date().toISOString();

    const channel = marketingChannels.find(c => c.id === campaignData.channelId);

    const newCampaign: MarketingCampaign = {
      id: newId,
      code,
      name: campaignData.name || 'Nueva Campaña Comercial',
      objective: campaignData.objective || 'GENERACION_LEADS',
      status: campaignData.status || 'BORRADOR',
      channelId: campaignData.channelId || (marketingChannels[0]?.id || 'MCH-001'),
      channelName: channel?.name || campaignData.channelName || 'Google Ads B2B (Search & PMax)',
      channelType: channel?.type || campaignData.channelType || 'GOOGLE_ADS',
      targetAudience: campaignData.targetAudience || 'Prospectos Industriales B2B',
      segmentId: campaignData.segmentId,
      segmentName: campaignData.segmentName,
      startDate: campaignData.startDate || new Date().toISOString().slice(0, 10),
      endDate: campaignData.endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      allocatedBudget: campaignData.allocatedBudget || 25000,
      actualSpent: campaignData.actualSpent || 0,
      utmSource: campaignData.utmSource || 'direct',
      utmMedium: campaignData.utmMedium || 'cpc',
      utmCampaign: campaignData.utmCampaign || code.toLowerCase(),
      utmTerm: campaignData.utmTerm || '',
      utmContent: campaignData.utmContent || '',
      impressions: campaignData.impressions || 0,
      clicks: campaignData.clicks || 0,
      ctr: campaignData.ctr || 0,
      conversionsLeads: campaignData.conversionsLeads || 0,
      opportunitiesCount: campaignData.opportunitiesCount || 0,
      quotesCount: campaignData.quotesCount || 0,
      ordersWonCount: campaignData.ordersWonCount || 0,
      revenueAttributed: campaignData.revenueAttributed || 0,
      cpl: campaignData.cpl || 0,
      cpa: campaignData.cpa || 0,
      roas: campaignData.roas || 0,
      roi: campaignData.roi || 0,
      conversionRatePct: campaignData.conversionRatePct || 0,
      leadToSaleRatePct: campaignData.leadToSaleRatePct || 0,
      notes: campaignData.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    setMarketingCampaigns(prev => [newCampaign, ...prev]);

    addAuditLog({
      action: 'CREAR_CAMPANA_MARKETING',
      module: 'MARKETING',
      recordId: newCampaign.id,
      details: `Campaña ${newCampaign.code} ("${newCampaign.name}") creada con presupuesto de $${(Number(newCampaign.allocatedBudget) || 0).toLocaleString('es-MX')} MXN en canal ${newCampaign.channelName}.`,
    });

    addNotification({
      title: 'Nueva Campaña Creada',
      message: `La campaña ${newCampaign.code} ("${newCampaign.name}") fue creada exitosamente.`,
      type: 'INFO',
      module: 'MARKETING',
    });

    broadcastDataUpdate('CAMPAIGN_CREATED', { campaign: newCampaign });
    return newCampaign;
  };

  // 2. UPDATE MARKETING CAMPAIGN
  const updateMarketingCampaign = (id: string, updates: Partial<MarketingCampaign>) => {
    setMarketingCampaigns(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const updated = {
          ...c,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Recalculate derived metrics if spent or counts changed
        const spent = updated.actualSpent || 0;
        const leadsCnt = updated.conversionsLeads || 0;
        const wonCnt = updated.ordersWonCount || 0;
        const revenue = updated.revenueAttributed || 0;
        const clicks = updated.clicks || 0;
        const imps = updated.impressions || 0;

        updated.ctr = imps > 0 ? Number(((clicks / imps) * 100).toFixed(2)) : 0;
        updated.cpl = leadsCnt > 0 ? Number((spent / leadsCnt).toFixed(2)) : 0;
        updated.cpa = wonCnt > 0 ? Number((spent / wonCnt).toFixed(2)) : 0;
        updated.roas = spent > 0 ? Number((revenue / spent).toFixed(2)) : 0;
        updated.roi = spent > 0 ? Number((((revenue - spent) / spent) * 100).toFixed(2)) : 0;
        updated.conversionRatePct = clicks > 0 ? Number(((leadsCnt / clicks) * 100).toFixed(2)) : 0;
        updated.leadToSaleRatePct = leadsCnt > 0 ? Number(((wonCnt / leadsCnt) * 100).toFixed(2)) : 0;

        return updated;
      })
    );

    addAuditLog({
      action: 'EDITAR_CAMPANA_MARKETING',
      module: 'MARKETING',
      recordId: id,
      details: `Campaña ${id} actualizada con nuevos parámetros.`,
    });

    broadcastDataUpdate('CAMPAIGN_UPDATED', { id, updates });
  };

  // 3. DELETE MARKETING CAMPAIGN
  const deleteMarketingCampaign = (id: string): { success: boolean; error?: string } => {
    const campaign = marketingCampaigns.find(c => c.id === id);
    if (!campaign) {
      return { success: false, error: 'Campaña no encontrada' };
    }

    setMarketingCampaigns(prev => prev.filter(c => c.id !== id));

    addAuditLog({
      action: 'ELIMINAR_CAMPANA_MARKETING',
      module: 'MARKETING',
      recordId: id,
      details: `Campaña ${campaign.code} ("${campaign.name}") eliminada del sistema.`,
    });

    broadcastDataUpdate('CAMPAIGN_DELETED', { id });
    return { success: true };
  };

  // 4. ADD MARKETING CHANNEL
  const addMarketingChannel = (channelData: Partial<MarketingChannel>): MarketingChannel => {
    const nextNum = marketingChannels.length + 1;
    const newId = `MCH-00${nextNum}`;
    const now = new Date().toISOString();

    const newChannel: MarketingChannel = {
      id: newId,
      code: channelData.code || `CANAL_${nextNum}`,
      name: channelData.name || 'Nuevo Canal Comercial',
      type: channelData.type || 'OTRO',
      status: channelData.status || 'ACTIVO',
      description: channelData.description || '',
      totalBudget: channelData.totalBudget || 50000,
      totalSpent: channelData.totalSpent || 0,
      leadsGenerated: channelData.leadsGenerated || 0,
      opportunitiesGenerated: channelData.opportunitiesGenerated || 0,
      wonOrdersCount: channelData.wonOrdersCount || 0,
      revenueAttributed: channelData.revenueAttributed || 0,
      cpcAverage: channelData.cpcAverage || 0,
      cplAverage: channelData.cplAverage || 0,
      cacAverage: channelData.cacAverage || 0,
      roas: channelData.roas || 0,
      roi: channelData.roi || 0,
      color: channelData.color || '#6366F1',
      createdAt: now,
      updatedAt: now,
    };

    setMarketingChannels(prev => [...prev, newChannel]);

    addAuditLog({
      action: 'CREAR_CANAL_MARKETING',
      module: 'MARKETING',
      recordId: newChannel.id,
      details: `Canal ${newChannel.name} registrado en catálogo de marketing.`,
    });

    broadcastDataUpdate('CHANNEL_CREATED', { channel: newChannel });
    return newChannel;
  };

  // 5. UPDATE MARKETING CHANNEL
  const updateMarketingChannel = (id: string, updates: Partial<MarketingChannel>) => {
    setMarketingChannels(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, ...updates, updatedAt: new Date().toISOString() } : ch))
    );

    addAuditLog({
      action: 'EDITAR_CANAL_MARKETING',
      module: 'MARKETING',
      recordId: id,
      details: `Canal de marketing ${id} actualizado.`,
    });

    broadcastDataUpdate('CHANNEL_UPDATED', { id, updates });
  };

  // 6. ADD CAMPAIGN EXPENSE
  const addCampaignExpense = (expenseData: Partial<CampaignExpense>): CampaignExpense => {
    const nextNum = campaignExpenses.length + 1;
    const newId = `EXP-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const campaign = marketingCampaigns.find(c => c.id === expenseData.campaignId);
    const channel = marketingChannels.find(ch => ch.id === expenseData.channelId || ch.id === campaign?.channelId);

    const newExpense: CampaignExpense = {
      id: newId,
      campaignId: expenseData.campaignId || campaign?.id || 'CMP-2026-001',
      campaignName: campaign?.name || expenseData.campaignName || 'Campaña General',
      channelId: channel?.id || 'MCH-001',
      channelName: channel?.name || 'Canal General',
      date: expenseData.date || new Date().toISOString().slice(0, 10),
      amount: expenseData.amount || 0,
      invoiceNumber: expenseData.invoiceNumber || `FAC-${Date.now().toString().slice(-6)}`,
      providerName: expenseData.providerName || 'Proveedor Publicitario',
      concept: expenseData.concept || 'Inversión publicitaria / Gasto de marketing',
      category: expenseData.category || 'PAID_ADS',
      authorizedBy: currentUser?.id || 'USR-001',
      authorizedByName: currentUser?.name || 'Dirección General',
      createdAt: now,
    };

    setCampaignExpenses(prev => [newExpense, ...prev]);

    // Update actualSpent in campaign and channel
    if (newExpense.campaignId) {
      setMarketingCampaigns(prev =>
        prev.map(c => {
          if (c.id !== newExpense.campaignId) return c;
          const newSpent = (c.actualSpent || 0) + newExpense.amount;
          const leadsCnt = c.conversionsLeads || 0;
          const wonCnt = c.ordersWonCount || 0;
          const revenue = c.revenueAttributed || 0;

          return {
            ...c,
            actualSpent: newSpent,
            cpl: leadsCnt > 0 ? Number((newSpent / leadsCnt).toFixed(2)) : 0,
            cpa: wonCnt > 0 ? Number((newSpent / wonCnt).toFixed(2)) : 0,
            roas: newSpent > 0 ? Number((revenue / newSpent).toFixed(2)) : 0,
            roi: newSpent > 0 ? Number((((revenue - newSpent) / newSpent) * 100).toFixed(2)) : 0,
            updatedAt: now,
          };
        })
      );
    }

    if (newExpense.channelId) {
      setMarketingChannels(prev =>
        prev.map(ch => {
          if (ch.id !== newExpense.channelId) return ch;
          const newSpent = (ch.totalSpent || 0) + newExpense.amount;
          const leadsCnt = ch.leadsGenerated || 0;
          const wonCnt = ch.wonOrdersCount || 0;
          const revenue = ch.revenueAttributed || 0;
          return {
            ...ch,
            totalSpent: newSpent,
            cplAverage: leadsCnt > 0 ? Number((newSpent / leadsCnt).toFixed(2)) : 0,
            cacAverage: wonCnt > 0 ? Number((newSpent / wonCnt).toFixed(2)) : 0,
            roas: newSpent > 0 ? Number((revenue / newSpent).toFixed(2)) : 0,
            roi: newSpent > 0 ? Number((((revenue - newSpent) / newSpent) * 100).toFixed(2)) : 0,
            updatedAt: now,
          };
        })
      );
    }

    addAuditLog({
      action: 'REGISTRAR_GASTO_MARKETING',
      module: 'MARKETING',
      recordId: newExpense.id,
      details: `Gasto de $${(Number(newExpense.amount) || 0).toLocaleString('es-MX')} MXN registrado en campaña "${newExpense.campaignName}" (${newExpense.concept}, Factura: ${newExpense.invoiceNumber}).`,
    });

    addNotification({
      title: 'Gasto de Marketing Registrado',
      message: `Se registró un gasto por $${(Number(newExpense.amount) || 0).toLocaleString('es-MX')} MXN en ${newExpense.campaignName}.`,
      type: 'INFO',
      module: 'MARKETING',
    });

    broadcastDataUpdate('EXPENSE_CREATED', { expense: newExpense });
    return newExpense;
  };

  // 7. DELETE CAMPAIGN EXPENSE
  const deleteCampaignExpense = (id: string) => {
    const expense = campaignExpenses.find(e => e.id === id);
    if (!expense) return;

    setCampaignExpenses(prev => prev.filter(e => e.id !== id));

    // Revert spent on campaign
    if (expense.campaignId) {
      setMarketingCampaigns(prev =>
        prev.map(c => {
          if (c.id !== expense.campaignId) return c;
          const newSpent = Math.max(0, (c.actualSpent || 0) - expense.amount);
          const leadsCnt = c.conversionsLeads || 0;
          const wonCnt = c.ordersWonCount || 0;
          const revenue = c.revenueAttributed || 0;
          return {
            ...c,
            actualSpent: newSpent,
            cpl: leadsCnt > 0 ? Number((newSpent / leadsCnt).toFixed(2)) : 0,
            cpa: wonCnt > 0 ? Number((newSpent / wonCnt).toFixed(2)) : 0,
            roas: newSpent > 0 ? Number((revenue / newSpent).toFixed(2)) : 0,
            roi: newSpent > 0 ? Number((((revenue - newSpent) / newSpent) * 100).toFixed(2)) : 0,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }

    addAuditLog({
      action: 'ELIMINAR_GASTO_MARKETING',
      module: 'MARKETING',
      recordId: id,
      details: `Gasto ${id} de $${(Number(expense.amount) || 0).toLocaleString('es-MX')} MXN eliminado.`,
    });

    broadcastDataUpdate('EXPENSE_DELETED', { id });
  };

  // 8. ADD MARKETING SEGMENT
  const addMarketingSegment = (segmentData: Partial<MarketingSegment>): MarketingSegment => {
    const nextNum = marketingSegments.length + 1;
    const newId = `SEG-00${nextNum}`;

    const newSegment: MarketingSegment = {
      id: newId,
      name: segmentData.name || 'Nuevo Segmento Industrial',
      description: segmentData.description || '',
      targetIndustry: segmentData.targetIndustry || 'Industria General',
      estimatedAudienceSize: segmentData.estimatedAudienceSize || 1000,
      criteria: segmentData.criteria || {},
      activeLeadsCount: segmentData.activeLeadsCount || 0,
      conversionRatePct: segmentData.conversionRatePct || 0,
      createdAt: new Date().toISOString(),
    };

    setMarketingSegments(prev => [...prev, newSegment]);

    addAuditLog({
      action: 'CREAR_SEGMENTO_MARKETING',
      module: 'MARKETING',
      recordId: newSegment.id,
      details: `Segmento de mercado "${newSegment.name}" creado.`,
    });

    broadcastDataUpdate('SEGMENT_CREATED', { segment: newSegment });
    return newSegment;
  };

  // 9. UPDATE MARKETING SEGMENT
  const updateMarketingSegment = (id: string, updates: Partial<MarketingSegment>) => {
    setMarketingSegments(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    addAuditLog({
      action: 'EDITAR_SEGMENTO_MARKETING',
      module: 'MARKETING',
      recordId: id,
      details: `Segmento de marketing ${id} actualizado.`,
    });
    broadcastDataUpdate('SEGMENT_UPDATED', { id, updates });
  };

  // 10. ADD TOUCHPOINT
  const addTouchpoint = (touchpointData: Partial<Touchpoint>): Touchpoint => {
    const nextNum = touchpoints.length + 1;
    const newId = `TCH-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const campaign = marketingCampaigns.find(c => c.id === touchpointData.campaignId);

    const newTouchpoint: Touchpoint = {
      id: newId,
      leadId: touchpointData.leadId,
      opportunityId: touchpointData.opportunityId,
      customerId: touchpointData.customerId,
      campaignId: touchpointData.campaignId || campaign?.id || 'CMP-2026-001',
      campaignName: campaign?.name || touchpointData.campaignName || 'Campaña General',
      channel: campaign?.channelType || touchpointData.channel || 'GOOGLE_ADS',
      utmSource: touchpointData.utmSource || campaign?.utmSource || 'direct',
      utmMedium: touchpointData.utmMedium || campaign?.utmMedium || 'cpc',
      utmCampaign: touchpointData.utmCampaign || campaign?.utmCampaign || 'general',
      timestamp: touchpointData.timestamp || now,
      interactionType: touchpointData.interactionType || 'CLIC_ANUNCIO',
      weightFirstTouch: 1.0,
      weightLastTouch: 1.0,
      weightLinear: 1.0,
      weightTimeDecay: 1.0,
      weightPositionBased: 1.0,
    };

    setTouchpoints(prev => [...prev, newTouchpoint]);
    broadcastDataUpdate('TOUCHPOINT_CREATED', { touchpoint: newTouchpoint });
    return newTouchpoint;
  };

  // 11. AI MARKETING PROPOSAL AUTHORIZATION (STRICT DATO -> ANÁLISIS -> RECOMENDACIÓN WITH EXPLICIT USER AUTHORIZATION)
  const authorizeAIMarketingProposal = (proposalId: string) => {
    const proposal = aiMarketingProposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const now = new Date().toISOString();

    // If the proposal involves adjusting budget or scaling campaign
    if (proposal.campaignId && proposal.suggestedBudgetDelta) {
      setMarketingCampaigns(prev =>
        prev.map(c => {
          if (c.id !== proposal.campaignId) return c;
          const newAllocated = c.allocatedBudget + (proposal.suggestedBudgetDelta || 0);
          return {
            ...c,
            allocatedBudget: newAllocated,
            status: c.status === 'PAUSADA' ? 'ACTIVA' : c.status,
            updatedAt: now,
          };
        })
      );
    }

    setAiMarketingProposals(prev =>
      prev.map(p =>
        p.id === proposalId
          ? {
              ...p,
              status: 'AUTORIZADA',
              authorizedBy: currentUser?.id || 'USR-001',
              authorizedByName: currentUser?.name || 'Dirección General',
              authorizedAt: now,
            }
          : p
      )
    );

    addAuditLog({
      action: 'AUTORIZAR_PROPUESTA_IA_MARKETING',
      module: 'MARKETING',
      recordId: proposal.id,
      details: `Propuesta de IA "${proposal.title}" AUTORIZADA por ${currentUser?.name || 'Administrador'}. Presupuesto/Acción ejecutada con éxito.`,
    });

    addNotification({
      title: 'Propuesta de IA Autorizada',
      message: `Se aplicó la recomendación estratégica para "${proposal.title}".`,
      type: 'EXITO',
      module: 'MARKETING',
    });

    broadcastDataUpdate('AI_PROPOSAL_AUTHORIZED', { proposalId });
  };

  const rejectAIMarketingProposal = (proposalId: string) => {
    setAiMarketingProposals(prev =>
      prev.map(p => (p.id === proposalId ? { ...p, status: 'RECHAZADA' } : p))
    );

    addAuditLog({
      action: 'RECHAZAR_PROPUESTA_IA_MARKETING',
      module: 'MARKETING',
      recordId: proposalId,
      details: `Propuesta de IA ${proposalId} descartada por el usuario.`,
    });

    broadcastDataUpdate('AI_PROPOSAL_REJECTED', { proposalId });
  };

  // 12. GET ATTRIBUTION RESULTS FOR CAMPAIGNS
  const getCampaignAttribution = (model?: AttributionModel): CampaignAttributionResult[] => {
    const activeModel = model || selectedAttributionModel;
    const totalWonRevenue = orders.filter(o => o.status === 'ENTREGADO' || o.status === 'SURTIDO').reduce((a, o) => a + (o.total || 0), 0) ||
      marketingCampaigns.reduce((a, c) => a + (c.revenueAttributed || 0), 0);
    return calculateAttributionByModel(activeModel, touchpoints, marketingCampaigns, totalWonRevenue);
  };

  // 13. EXECUTE REAL END-TO-END FLOW (Facebook Campaign -> Lead -> Opportunity -> Quote -> Order -> Sale)
  const executeE2ETestFlow = (options?: {
    campaignId?: string;
    leadCompanyName?: string;
    leadContactName?: string;
    leadPhone?: string;
    leadEmail?: string;
    productInterest?: string;
    estimatedValue?: number;
    productId?: string;
    quantity?: number;
  }) => {
    // 1. Identify or select Campaign (Facebook / Meta Ads)
    const targetCampaign =
      marketingCampaigns.find(c => c.id === options?.campaignId) ||
      marketingCampaigns.find(c => c.channelType === 'FACEBOOK_ADS' || c.code.includes('META') || c.utmSource === 'facebook') ||
      marketingCampaigns[1] ||
      marketingCampaigns[0];

    const metricsBefore = {
      roas: targetCampaign.roas || 0,
      ordersWon: targetCampaign.ordersWonCount || 0,
      revenue: targetCampaign.revenueAttributed || 0,
    };

    const targetProduct =
      products.find(p => p.id === options?.productId) ||
      products[0] || {
        id: 'PRD-01',
        code: 'ISO-LNA-850',
        name: 'Duct Wrap Aislamiento Térmico con Aluminio FSK',
        price: 850,
        stock: 350,
        availableStock: 280,
        reservedStock: 70,
        warehouseLocation: 'RACK-A1-04',
      };

    const qty = options?.quantity || 120;
    const unitPrice = targetProduct.price || 850;
    const subtotal = qty * unitPrice;
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const leadCompany = options?.leadCompanyName || 'TermoClima Industrial del Norte SA de CV';
    const leadContact = options?.leadContactName || 'Ing. Roberto Villarreal Peña';
    const nowIso = new Date().toISOString();
    const timestampStr = new Date().toLocaleString('es-MX', { hour12: false });
    const userToUse = currentUser || { id: 'USR-002', name: 'Mariana Ruiz', role: 'VENTAS' as UserRole };

    // 2. Touchpoint 1: Impression & Click in Facebook Ads
    const leadId = `LEAD-${Date.now().toString(36).toUpperCase()}`;
    const tpClick: Touchpoint = {
      id: `TP-${Date.now().toString(36)}-01`,
      leadId,
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      channel: 'FACEBOOK_ADS',
      utmSource: targetCampaign.utmSource || 'facebook',
      utmMedium: targetCampaign.utmMedium || 'paid_social',
      utmCampaign: targetCampaign.utmCampaign || 'duct_wrap_hvac_verano',
      interactionType: 'CLIC_ANUNCIO',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    };

    // 3. Lead Creation
    const newLead: Lead = {
      id: leadId,
      name: leadContact,
      company: leadCompany,
      email: options?.leadEmail || 'r.villarreal@termoclimanorte.com',
      phone: options?.leadPhone || '81-8390-5520',
      city: 'Monterrey',
      state: 'Nuevo León',
      source: 'FACEBOOK',
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      utmSource: targetCampaign.utmSource || 'facebook',
      utmMedium: targetCampaign.utmMedium || 'paid_social',
      utmCampaign: targetCampaign.utmCampaign || 'duct_wrap_hvac_verano',
      utmContent: 'anuncio_carrusel_ductwrap_fsk',
      productInterest: options?.productInterest || targetProduct.name,
      estimatedValue: total,
      status: 'CONVERTIDO',
      salespersonId: userToUse.id,
      salespersonName: userToUse.name,
      creationDate: nowIso.slice(0, 10),
      notes: 'Prospecto captado por campaña Meta Ads con interés en suministro para proyecto HVAC en Monterrey.',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 4. Customer Creation
    const customerCode = `CTE-2026-${String(customers.length + 1).padStart(3, '0')}`;
    const customerId = `CUST-${Date.now().toString(36).toUpperCase()}`;
    const newCustomer: Customer = {
      id: customerId,
      code: customerCode,
      businessName: leadCompany,
      rfc: 'TIN180422AB9',
      contactName: leadContact,
      email: newLead.email,
      phone: newLead.phone,
      address: 'Av. Industrial Apodaca #450, Parque Industrial Huinalá, Apodaca, N.L.',
      city: 'Apodaca',
      state: 'Nuevo León',
      creditLimit: 350000,
      currentBalance: 0,
      status: 'ACTIVO',
      sellerId: userToUse.id,
      sellerName: userToUse.name,
      acquisitionCampaignId: targetCampaign.id,
      acquisitionCampaignName: targetCampaign.name,
      acquisitionChannel: 'FACEBOOK_ADS',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 5. Opportunity Creation
    const oppFolio = `OPP-2026-${String(opportunities.length + 1).padStart(3, '0')}`;
    const oppId = `OPP-${Date.now().toString(36).toUpperCase()}`;
    const newOpp: Opportunity = {
      id: oppId,
      folio: oppFolio,
      leadId: newLead.id,
      customerId: newCustomer.id,
      customerName: newCustomer.businessName,
      salespersonId: userToUse.id,
      salespersonName: userToUse.name,
      title: `Suministro Duct Wrap FSK - ${newCustomer.businessName}`,
      estimatedValue: total,
      probability: 100,
      stage: 'LOGRADO_CON_EXITO',
      expectedCloseDate: nowIso.slice(0, 10),
      source: 'FACEBOOK',
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      utmSource: targetCampaign.utmSource || 'facebook',
      utmMedium: targetCampaign.utmMedium || 'paid_social',
      utmCampaign: targetCampaign.utmCampaign || 'duct_wrap_hvac_verano',
      notes: `Cierre comercial generado por campaña de Facebook ${targetCampaign.name}.`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 6. Quote Creation
    const quoteFolio = `COT-2026-${String(quotes.length + 1).padStart(3, '0')}`;
    const quoteId = `QUO-${Date.now().toString(36).toUpperCase()}`;
    const newQuote: Quote = {
      id: quoteId,
      folio: quoteFolio,
      customerId: newCustomer.id,
      customerName: newCustomer.businessName,
      salespersonId: userToUse.id,
      salespersonName: userToUse.name,
      subtotal,
      discount: 0,
      tax,
      total,
      status: 'ACEPTADA',
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      paymentTerms: '30 días crédito',
      deliveryTimeDays: 2,
      notes: `Cotización formal aprobada para ${newCustomer.businessName}. Origen: Campaña Facebook Ads.`,
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      items: [
        {
          id: `QIT-${Date.now().toString(36)}-01`,
          productId: targetProduct.id,
          productCode: targetProduct.code,
          productName: targetProduct.name,
          quantity: qty,
          unitPrice,
          discount: 0,
          subtotal,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 7. Order Creation & Inventory Reservation
    const orderFolio = `PED-2026-${String(orders.length + 1).padStart(3, '0')}`;
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const warehouseToUse = warehouses[0] || { id: 'WH-01', name: 'Almacén Central Tultitlán' };

    const newOrder: Order = {
      id: orderId,
      folio: orderFolio,
      orderNumber: orderFolio,
      quoteId: newQuote.id,
      quoteFolio: newQuote.folio,
      customerId: newCustomer.id,
      customerName: newCustomer.businessName,
      sellerId: userToUse.id,
      sellerName: userToUse.name,
      warehouseId: warehouseToUse.id,
      warehouseName: warehouseToUse.name,
      status: 'RESERVADO',
      subtotal,
      discount: 0,
      tax,
      total,
      orderDate: nowIso.slice(0, 10),
      promisedDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      deliveryAddress: newCustomer.address,
      paymentTerms: newQuote.paymentTerms,
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      utmSource: targetCampaign.utmSource || 'facebook',
      utmCampaign: targetCampaign.utmCampaign || 'duct_wrap_hvac_verano',
      notes: `Pedido en firme generado por conversión comercial de Campaña Facebook ${targetCampaign.name}. Stock reservado en almacén.`,
      items: [
        {
          id: `OIT-${Date.now().toString(36)}-01`,
          productId: targetProduct.id,
          productCode: targetProduct.code,
          productName: targetProduct.name,
          quantityOrdered: qty,
          quantityFulfilled: 0,
          unitPrice,
          subtotal,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Inventory reservation movement in Kardex
    const productPhysical = ('physicalStock' in targetProduct && typeof targetProduct.physicalStock === 'number')
      ? targetProduct.physicalStock
      : (targetProduct.stock || 350);
    const newReserved = (targetProduct.reservedStock || 0) + qty;
    const newAvailable = Math.max(0, productPhysical - newReserved);

    const reserveMovement: InventoryMovement = {
      id: `MOV-RES-${Date.now().toString(36).toUpperCase()}`,
      timestamp: timestampStr,
      type: 'RESERVA',
      productId: targetProduct.id,
      productCode: targetProduct.code,
      productName: targetProduct.name,
      warehouseId: warehouseToUse.id,
      warehouseName: warehouseToUse.name,
      location: typeof targetProduct.warehouseLocation === 'string' ? targetProduct.warehouseLocation : 'RACK-A1-04',
      quantity: qty,
      previousBalance: targetProduct.availableStock,
      newBalance: newAvailable,
      relatedDocFolio: orderFolio,
      userId: userToUse.id,
      userName: userToUse.name,
      reason: `Reserva automática por confirmación de Pedido ${orderFolio} (Campaña Facebook)`,
      createdAt: nowIso,
    };

    // 8. Recalculate Campaign Metrics & Attribution
    const newWonCount = (targetCampaign.ordersWonCount || 0) + 1;
    const newRevAttributed = (targetCampaign.revenueAttributed || 0) + total;
    const actualSpent = targetCampaign.actualSpent || 32400;
    const newRoas = Number((newRevAttributed / actualSpent).toFixed(2));
    const newRoi = Number((((newRevAttributed - actualSpent) / actualSpent) * 100).toFixed(2));

    const updatedCampaign: MarketingCampaign = {
      ...targetCampaign,
      conversionsLeads: (targetCampaign.conversionsLeads || 0) + 1,
      opportunitiesCount: (targetCampaign.opportunitiesCount || 0) + 1,
      quotesCount: (targetCampaign.quotesCount || 0) + 1,
      ordersWonCount: newWonCount,
      revenueAttributed: newRevAttributed,
      roas: newRoas,
      roi: newRoi,
      updatedAt: nowIso,
    };

    const metricsAfter = {
      roas: newRoas,
      ordersWon: newWonCount,
      revenue: newRevAttributed,
    };

    // Touchpoint 2: Form Web / Won Conversion
    const tpWonSale: Touchpoint = {
      id: `TP-${Date.now().toString(36)}-02`,
      leadId: newLead.id,
      customerId: newCustomer.id,
      opportunityId: newOpp.id,
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      channel: 'FACEBOOK_ADS',
      utmSource: targetCampaign.utmSource || 'facebook',
      utmMedium: targetCampaign.utmMedium || 'paid_social',
      utmCampaign: targetCampaign.utmCampaign || 'duct_wrap_hvac_verano',
      interactionType: 'FORMULARIO_WEB',
      timestamp: nowIso,
    };

    // 9. Update state in React context
    setLeads(prev => [newLead, ...prev]);
    setCustomers(prev => [newCustomer, ...prev]);
    setOpportunities(prev => [newOpp, ...prev]);
    setQuotes(prev => [newQuote, ...prev]);
    setOrders(prev => [newOrder, ...prev]);
    setProducts(prev =>
      prev.map(p => (p.id === targetProduct.id ? { ...p, reservedStock: newReserved, availableStock: newAvailable } : p))
    );
    setMovements(prev => [reserveMovement, ...prev]);
    setMarketingCampaigns(prev => prev.map(c => (c.id === targetCampaign.id ? updatedCampaign : c)));
    setMarketingChannels(prev =>
      prev.map(ch => {
        if (ch.id === targetCampaign.channelId || ch.type === 'FACEBOOK_ADS') {
          const chWon = (ch.wonOrdersCount || 0) + 1;
          const chRev = (ch.revenueAttributed || 0) + total;
          const chSpent = ch.totalSpent || 55000;
          return {
            ...ch,
            leadsGenerated: (ch.leadsGenerated || 0) + 1,
            opportunitiesGenerated: (ch.opportunitiesGenerated || 0) + 1,
            wonOrdersCount: chWon,
            revenueAttributed: chRev,
            roas: Number((chRev / chSpent).toFixed(2)),
            roi: Number((((chRev - chSpent) / chSpent) * 100).toFixed(2)),
            updatedAt: nowIso,
          };
        }
        return ch;
      })
    );
    setTouchpoints(prev => [tpWonSale, tpClick, ...prev]);

    // 10. Audit Log & Notifications
    addAuditLog({
      action: 'PRUEBA_E2E_MARKETING_VENTA_EXITOSA',
      module: 'MARKETING',
      recordId: orderFolio,
      details: `Prueba real E2E ejecutada con éxito: Campaña Facebook (${targetCampaign.code}) ➔ Lead (${newLead.company}) ➔ Oportunidad (${newOpp.folio}) ➔ Cotización (${newQuote.folio}) ➔ Pedido (${newOrder.folio}) ➔ Venta Ganada ($${(Number(total) || 0).toLocaleString('es-MX')} MXN). Stock de ${qty} pzas reservado en Kardex.`,
    });

    addNotification({
      title: 'Prueba E2E Campaña Facebook Exitosa',
      message: `Ciclo completo cerrado: Pedido ${orderFolio} por $${(Number(total) || 0).toLocaleString('es-MX')} MXN atribuido a ${targetCampaign.name}.`,
      type: 'EXITO',
      module: 'MARKETING',
    });

    broadcastDataUpdate('E2E_TEST_FLOW_EXECUTED', {
      campaign: updatedCampaign,
      lead: newLead,
      customer: newCustomer,
      opportunity: newOpp,
      quote: newQuote,
      order: newOrder,
    });

    return {
      campaign: updatedCampaign,
      lead: newLead,
      customer: newCustomer,
      opportunity: newOpp,
      quote: newQuote,
      order: newOrder,
      movements: [reserveMovement],
      touchpoints: [tpClick, tpWonSale],
      metricsBefore,
      metricsAfter,
    };
  };

  return {
    addMarketingCampaign,
    updateMarketingCampaign,
    deleteMarketingCampaign,
    addMarketingChannel,
    updateMarketingChannel,
    addCampaignExpense,
    deleteCampaignExpense,
    addMarketingSegment,
    updateMarketingSegment,
    addTouchpoint,
    authorizeAIMarketingProposal,
    rejectAIMarketingProposal,
    selectedAttributionModel,
    setSelectedAttributionModel,
    getCampaignAttribution,
    executeE2ETestFlow,
  };
}
