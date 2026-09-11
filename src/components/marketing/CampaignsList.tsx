import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  CheckCircle,
  Eye,
  Trash2,
  Edit2,
  TrendingUp,
  Tag,
  Calendar,
  DollarSign,
  Users,
  Target,
  Globe,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MarketingCampaign, CampaignObjective, CampaignStatus, ChannelType } from '../../types/erp';

interface CampaignsListProps {
  onSelectCampaign: (campaign: MarketingCampaign) => void;
}

export const CampaignsList: React.FC<CampaignsListProps> = ({ onSelectCampaign }) => {
  const {
    marketingCampaigns,
    marketingChannels,
    marketingSegments,
    addMarketingCampaign,
    updateMarketingCampaign,
    deleteMarketingCampaign,
  } = useERP();
  const { can } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODAS');
  const [channelFilter, setChannelFilter] = useState<string>('TODOS');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    objective: 'GENERACION_LEADS' as CampaignObjective,
    status: 'BORRADOR' as CampaignStatus,
    channelId: marketingChannels[0]?.id || 'MCH-001',
    targetAudience: '',
    segmentId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    allocatedBudget: 25000,
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: '',
    utmTerm: '',
    utmContent: '',
    notes: '',
  });

  const handleOpenCreate = () => {
    const nextNum = marketingCampaigns.length + 1;
    const defaultCode = `CAMP-2026-${String(nextNum).padStart(3, '0')}`;
    setFormData({
      code: defaultCode,
      name: '',
      objective: 'GENERACION_LEADS',
      status: 'BORRADOR',
      channelId: marketingChannels[0]?.id || 'MCH-001',
      targetAudience: 'Contratistas de Aislamiento y Mantenimiento Industrial',
      segmentId: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      allocatedBudget: 30000,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: defaultCode.toLowerCase(),
      utmTerm: 'aislamiento termico industrial',
      utmContent: 'anuncio_text_v1',
      notes: '',
    });
    setEditingCampaign(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (campaign: MarketingCampaign) => {
    setFormData({
      code: campaign.code,
      name: campaign.name,
      objective: campaign.objective,
      status: campaign.status,
      channelId: campaign.channelId,
      targetAudience: campaign.targetAudience || '',
      segmentId: campaign.segmentId || '',
      startDate: campaign.startDate,
      endDate: campaign.endDate || '',
      allocatedBudget: campaign.allocatedBudget,
      utmSource: campaign.utmSource || '',
      utmMedium: campaign.utmMedium || '',
      utmCampaign: campaign.utmCampaign || '',
      utmTerm: campaign.utmTerm || '',
      utmContent: campaign.utmContent || '',
      notes: campaign.notes || '',
    });
    setEditingCampaign(campaign);
    setIsCreateModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor ingresa un nombre para la campaña.');
      return;
    }

    const selectedChannel = marketingChannels.find(ch => ch.id === formData.channelId);

    if (editingCampaign) {
      updateMarketingCampaign(editingCampaign.id, {
        ...formData,
        channelName: selectedChannel?.name || 'Canal General',
        channelType: selectedChannel?.type || 'OTRO',
      });
    } else {
      addMarketingCampaign({
        ...formData,
        channelName: selectedChannel?.name || 'Canal General',
        channelType: selectedChannel?.type || 'OTRO',
      });
    }

    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (campaignId: string, newStatus: CampaignStatus) => {
    updateMarketingCampaign(campaignId, { status: newStatus });
  };

  const handleDelete = (campaign: MarketingCampaign) => {
    if (confirm(`¿Estás seguro de eliminar la campaña "${campaign.name}" (${campaign.code})?`)) {
      deleteMarketingCampaign(campaign.id);
    }
  };

  const fmtCurrency = (val: number) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const filteredCampaigns = marketingCampaigns.filter(c => {
    if (statusFilter !== 'TODAS' && c.status !== statusFilter) return false;
    if (channelFilter !== 'TODOS' && c.channelId !== channelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (c.code || "").toLowerCase().includes(q);
      const matchName = (c.name || "").toLowerCase().includes(q);
      const matchChannel = (c.channelName || "").toLowerCase().includes(q);
      const matchUtm = (c.utmCampaign || '').toLowerCase().includes(q);
      const matchAudience = (c.targetAudience || '').toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchChannel && !matchUtm && !matchAudience) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, nombre, UTM o audiencia..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="TODAS">Todos los Estados</option>
              <option value="ACTIVA">Activas</option>
              <option value="PAUSADA">Pausadas</option>
              <option value="BORRADOR">Borradores</option>
              <option value="FINALIZADA">Finalizadas</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="TODOS">Todos los Canales</option>
              {marketingChannels.map(ch => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Campaign Button */}
        {can('MARKETING', 'CREAR') && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nueva Campaña
          </button>
        )}
      </div>

      {/* Campaigns Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="py-3 px-4">Código & Campaña</th>
                <th className="py-3 px-3">Canal & Fechas</th>
                <th className="py-3 px-3 text-right">Presupuesto</th>
                <th className="py-3 px-3 text-right">Gasto Real</th>
                <th className="py-3 px-3 text-right">Leads (CPL)</th>
                <th className="py-3 px-3 text-right">Pedidos Ganados</th>
                <th className="py-3 px-3 text-right">Venta Atribuida</th>
                <th className="py-3 px-3 text-right">ROAS</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No se encontraron campañas con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(camp => {
                  const budgetPct = camp.allocatedBudget > 0 ? (camp.actualSpent / camp.allocatedBudget) * 100 : 0;
                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-blue-700">{camp.code}</div>
                        <div className="font-bold text-slate-900 max-w-[220px] truncate" title={camp.name}>
                          {camp.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Tag className="h-2.5 w-2.5" />
                          <span>utm_campaign={camp.utmCampaign}</span>
                        </div>
                      </td>

                      {/* Channel & Dates */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-900">{camp.channelName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{camp.startDate} ~ {camp.endDate || 'Abierta'}</span>
                        </div>
                      </td>

                      {/* Presupuesto */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-800">
                        {fmtCurrency(camp.allocatedBudget)}
                      </td>

                      {/* Gasto Real & % */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-bold text-slate-900">{fmtCurrency(camp.actualSpent)}</div>
                        <div className="text-[10px] font-semibold text-slate-500">
                          {((budgetPct ?? 0)).toFixed(1)}% ppto.
                        </div>
                      </td>

                      {/* Leads & CPL */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-bold text-indigo-700">{camp.conversionsLeads} leads</div>
                        <div className="text-[10px] text-slate-500">CPL: {fmtCurrency(camp.cpl)}</div>
                      </td>

                      {/* Orders Won */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-bold text-slate-900">{camp.ordersWonCount} órdenes</div>
                        <div className="text-[10px] text-slate-500">
                          {camp.opportunitiesCount} oportunidades
                        </div>
                      </td>

                      {/* Revenue Attributed */}
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        {fmtCurrency(camp.revenueAttributed)}
                      </td>

                      {/* ROAS Badge */}
                      <td className="py-3.5 px-3 text-right font-black">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs ${
                            (camp.roas || 0) >= 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : (camp.roas || 0) >= 4
                              ? 'bg-blue-100 text-blue-800'
                              : (camp.roas || 0) > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {((camp.roas ?? 0)).toFixed(1)}x
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectCampaign(camp)}
                            title="Ver Detalle & Atribución"
                            className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {can('MARKETING', 'EDITAR') && (
                            <>
                              {camp.status === 'ACTIVA' ? (
                                <button
                                  onClick={() => handleStatusChange(camp.id, 'PAUSADA')}
                                  title="Pausar Campaña"
                                  className="rounded p-1 text-amber-600 hover:bg-amber-50 transition"
                                >
                                  <Pause className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(camp.id, 'ACTIVA')}
                                  title="Activar Campaña"
                                  className="rounded p-1 text-emerald-600 hover:bg-emerald-50 transition"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEdit(camp)}
                                title="Editar Configuración"
                                className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {can('MARKETING', 'ELIMINAR') && (
                            <button
                              onClick={() => handleDelete(camp)}
                              title="Eliminar Campaña"
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear / Editar Campaña */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCampaign ? `Editar Campaña: ${editingCampaign.code}` : 'Nueva Campaña de Marketing'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configura los parámetros comerciales, presupuestarios y de rastreo UTM.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Código de Campaña
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono"
                    placeholder="CAMP-2026-001"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Canal Publicitario
                  </label>
                  <select
                    value={formData.channelId}
                    onChange={e => setFormData({ ...formData, channelId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  >
                    {marketingChannels.map(ch => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name} ({ch.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Nombre Comercial de la Campaña
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium"
                  placeholder="Ej. Google Ads - Aislamiento Tuberías y Lana Mineral Q3"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Objetivo Principal
                  </label>
                  <select
                    value={formData.objective}
                    onChange={e => setFormData({ ...formData, objective: e.target.value as CampaignObjective })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  >
                    <option value="GENERACION_LEADS">Generación de Leads B2B</option>
                    <option value="BRAND_AWARENESS">Branding & Posicionamiento</option>
                    <option value="VENTA_DIRECTA">Venta Directa de Catálogo</option>
                    <option value="RETENCION_CLIENTES">Recompra & Retención</option>
                    <option value="EVENTO_EXPO">Expo / Evento Presencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as CampaignStatus })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  >
                    <option value="BORRADOR">Borrador</option>
                    <option value="ACTIVA">Activa</option>
                    <option value="PAUSADA">Pausada</option>
                    <option value="FINALIZADA">Finalizada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Presupuesto Asignado (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.allocatedBudget}
                    onChange={e => setFormData({ ...formData, allocatedBudget: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Fecha de Finalización (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Público Objetivo / Audiencia
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  placeholder="Ej. Gerentes de Mantenimiento HVAC y Directores de Planta en Monterrey"
                />
              </div>

              {/* UTM Tracking Section */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Parámetros de Atribución & Rastreo UTM
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">utm_source</label>
                    <input
                      type="text"
                      value={formData.utmSource}
                      onChange={e => setFormData({ ...formData, utmSource: e.target.value })}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono"
                      placeholder="google, linkedin, meta"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">utm_medium</label>
                    <input
                      type="text"
                      value={formData.utmMedium}
                      onChange={e => setFormData({ ...formData, utmMedium: e.target.value })}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono"
                      placeholder="cpc, display, email"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">utm_campaign</label>
                    <input
                      type="text"
                      value={formData.utmCampaign}
                      onChange={e => setFormData({ ...formData, utmCampaign: e.target.value })}
                      className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs font-mono"
                      placeholder="camp_q3_aislamiento"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                >
                  {editingCampaign ? 'Guardar Cambios' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
