import React, { useState } from 'react';
import {
  Megaphone,
  LayoutDashboard,
  Layers,
  Receipt,
  Target,
  Bot,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { MarketingDashboard } from './MarketingDashboard';
import { CampaignsList } from './CampaignsList';
import { CampaignDetailModal } from './CampaignDetailModal';
import { AttributionModeler } from './AttributionModeler';
import { ChannelsAndExpenses } from './ChannelsAndExpenses';
import { SegmentsAndAudience } from './SegmentsAndAudience';
import { AIMarketingAdvisor } from './AIMarketingAdvisor';
import { E2EFlowTestModal } from './E2EFlowTestModal';
import { MarketingCampaign, ERPModule } from '../../types/erp';

interface MarketingModuleProps {
  onNavigateModule?: (module: ERPModule) => void;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({ onNavigateModule }) => {
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'CAMPAIGNS' | 'ATTRIBUTION' | 'CHANNELS_EXPENSES' | 'SEGMENTS' | 'AI_ADVISOR'
  >('DASHBOARD');

  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [isE2EModalOpen, setIsE2EModalOpen] = useState(false);

  const { aiMarketingProposals } = useERP();
  const pendingProposalsCount = aiMarketingProposals.filter(p => p.status === 'PROPUESTA').length;

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-900 tracking-wider">
                  Fase 5 ERP
                </span>
                <span className="text-xs font-semibold text-slate-500">Módulo Integrado con CRM & Ventas</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Marketing, Campañas & Atribución B2B
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsE2EModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-black uppercase text-white shadow-md hover:from-blue-500 hover:to-purple-500 transition transform active:scale-95 shrink-0"
            >
              <Zap className="h-4 w-4" />
              🧪 Prueba Real E2E: Facebook → Venta
            </button>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'DASHBOARD'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard General
          </button>

          <button
            onClick={() => setActiveTab('CAMPAIGNS')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'CAMPAIGNS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            Campañas & UTM
          </button>

          <button
            onClick={() => setActiveTab('ATTRIBUTION')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'ATTRIBUTION'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-4 w-4" />
            Modelador de Atribución (6 Modelos)
          </button>

          <button
            onClick={() => setActiveTab('CHANNELS_EXPENSES')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'CHANNELS_EXPENSES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Canales & Gastos Facturados
          </button>

          <button
            onClick={() => setActiveTab('SEGMENTS')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'SEGMENTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Target className="h-4 w-4" />
            Audiencias & Segmentos
          </button>

          <button
            onClick={() => setActiveTab('AI_ADVISOR')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition relative ${
              activeTab === 'AI_ADVISOR'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Bot className="h-4 w-4" />
            CONSCORE AI Marketing
            {pendingProposalsCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ml-1">
                {pendingProposalsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {activeTab === 'DASHBOARD' && (
        <MarketingDashboard
          onNavigateTab={setActiveTab}
          onSelectCampaign={setSelectedCampaign}
        />
      )}

      {activeTab === 'CAMPAIGNS' && (
        <CampaignsList onSelectCampaign={setSelectedCampaign} />
      )}

      {activeTab === 'ATTRIBUTION' && <AttributionModeler />}

      {activeTab === 'CHANNELS_EXPENSES' && <ChannelsAndExpenses />}

      {activeTab === 'SEGMENTS' && <SegmentsAndAudience />}

      {activeTab === 'AI_ADVISOR' && <AIMarketingAdvisor />}

      {/* Detail Modal if a campaign is selected */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}

      {/* Real E2E Flow Test Modal */}
      <E2EFlowTestModal
        isOpen={isE2EModalOpen}
        onClose={() => setIsE2EModalOpen(false)}
        onNavigateModule={onNavigateModule}
      />
    </div>
  );
};
