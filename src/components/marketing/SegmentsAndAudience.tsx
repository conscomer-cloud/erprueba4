import React, { useState } from 'react';
import {
  Users,
  Target,
  Plus,
  Tag,
  Filter,
  CheckCircle,
  TrendingUp,
  Building,
  Mail,
  Megaphone,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MarketingSegment } from '../../types/erp';

export const SegmentsAndAudience: React.FC = () => {
  const { marketingSegments, addMarketingSegment, customers, leads, marketingCampaigns } = useERP();
  const { can } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetIndustry: 'Aislamiento Térmico & Climas',
    minTicketSize: 50000,
    geographicScope: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addMarketingSegment({
      name: formData.name,
      description: formData.description,
      targetIndustry: formData.targetIndustry,
      criteria: {
        minCreditLimit: formData.minTicketSize,
        states: formData.geographicScope.split(',').map(state => state.trim()).filter(Boolean),
      },
      activeLeadsCount: 0,
      estimatedAudienceSize: 0,
      conversionRatePct: 0,
    });

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">Segmentos de Audiencia B2B</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Clasificación de mercado para campañas personalizadas y nutrición de prospectos calificados.
          </p>
        </div>

        {can('MARKETING', 'CREAR') && (
          <button
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                targetIndustry: 'Plantas Industriales & Manufactura',
                minTicketSize: 100000,
                geographicScope: 'Zona Norte y Bajío',
              });
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Crear Segmento
          </button>
        )}
      </div>

      {/* Segments Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {marketingSegments.map(seg => {
          const linkedCamps = marketingCampaigns.filter(c => c.segmentId === seg.id);
          return (
            <div
              key={seg.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold text-xs">
                      {seg.name.charAt(0)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{seg.name}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {seg.id}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2">{seg.description}</p>

                {/* Criteria tags */}
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-400 uppercase text-[10px]">Industria:</span>
                    <span className="font-medium text-slate-800">{seg.targetIndustry || 'Todas'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-400 uppercase text-[10px]">Crédito Mínimo:</span>
                    <span className="font-bold text-emerald-700">
                      ${(seg.criteria.minCreditLimit || 0).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-400 uppercase text-[10px]">Alcance:</span>
                    <span className="font-medium text-slate-800">{seg.criteria.states?.join(', ') || 'Nacional'}</span>
                  </div>
                </div>

                {/* Linked Campaigns */}
                {linkedCamps.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Campañas Asociadas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {linkedCamps.map(c => (
                        <span
                          key={c.id}
                          className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                        >
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Counters Footer */}
              <div className="mt-4 border-t border-slate-100 pt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Prospectos (Leads)</span>
                  <span className="text-sm font-black text-indigo-700">{seg.activeLeadsCount}</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Audiencia Estimada</span>
                  <span className="text-sm font-black text-purple-700">{seg.estimatedAudienceSize}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Crear Segmento */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Crear Nuevo Segmento de Audiencia
            </h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Nombre del Segmento
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  placeholder="Ej. Contratistas HVAC de Alto Volumen"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  rows={2}
                  placeholder="Criterios y propósito de este segmento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Sector / Industria
                  </label>
                  <input
                    type="text"
                    value={formData.targetIndustry}
                    onChange={e => setFormData({ ...formData, targetIndustry: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Crédito Mínimo (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.minTicketSize}
                    onChange={e => setFormData({ ...formData, minTicketSize: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Estados separados por comas (vacío: todos)
                </label>
                <input
                  type="text"
                  value={formData.geographicScope}
                  onChange={e => setFormData({ ...formData, geographicScope: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
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
                  Crear Segmento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
