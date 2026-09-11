import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  UserPlus,
  Calendar,
  FileText,
  Trophy,
  TrendingUp,
  SlidersHorizontal,
  Plus,
  Receipt,
  Users,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { PipelineKanban } from './PipelineKanban';
import { LeadsManager } from './LeadsManager';
import { MyDayFollowUps } from './MyDayFollowUps';
import { ActivitiesLog } from './ActivitiesLog';
import { SalesGoalsAndCommissions } from './SalesGoalsAndCommissions';
import { SalesForecast } from './SalesForecast';
import { PipelineConfigModal } from './PipelineConfigModal';
import { OpportunityModal } from './OpportunityModal';
import { LeadModal } from './LeadModal';
import { E2EFlowTestModal } from '../marketing/E2EFlowTestModal';
import { CommercialRLSCertificationModal } from './CommercialRLSCertificationModal';
import { ERPModule } from '../../types/erp';
import { ShieldCheck } from 'lucide-react';

interface CRMModuleProps {
  onNavigate?: (module: ERPModule) => void;
  onSelectCustomer?: (customerId: string) => void;
  /** Pestaña de arranque, para que el menú lateral pueda entrar directo. */
  initialTab?: string;
}

export const CRMModule: React.FC<CRMModuleProps> = ({ onNavigate, onSelectCustomer, initialTab }) => {
  const [activeTab, setActiveTab] = useState<
    'PIPELINE' | 'LEADS' | 'MI_DIA' | 'ACTIVIDADES' | 'METAS' | 'FORECAST'
  >((initialTab as any) || 'PIPELINE');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab as any);
  }, [initialTab]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isNewOppOpen, setIsNewOppOpen] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isE2EOpen, setIsE2EOpen] = useState(false);
  const [isRLSCertOpen, setIsRLSCertOpen] = useState(false);

  const { opportunities, leads, followUps } = useERP();
  const { currentUser } = useAuth();

  const isPrivileged = currentUser?.role && ['ADMIN', 'ADMINISTRADOR', 'GERENTE_VENTAS', 'DIRECTOR_COMERCIAL', 'DIRECTOR'].includes(currentUser.role);
  const scopedLeads = isPrivileged ? leads : CommercialRLSService.scopeLeads(leads, currentUser);
  const scopedFollowUps = isPrivileged ? followUps : CommercialRLSService.scopeFollowUps(followUps, currentUser);

  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingTasksCount = scopedFollowUps.filter((f) => f.status === 'PENDIENTE' && f.date <= todayStr).length;
  const newLeadsCount = scopedLeads.filter((l) => l.status === 'NUEVO').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">CRM & Gestión de Ventas</h2>
            <span className="rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-bold text-yellow-300 border border-yellow-400/30">
              FASE 1 ACTIVA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pipeline comercial, prospección de leads, seguimiento multicanal y pronóstico de ventas con CONSCORE AI
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRLSCertOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-900/30 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-900/50 transition-all shadow-xs"
          >
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            🛡️ RLS 10 Ejecutivos
          </button>

          <button
            onClick={() => setIsE2EOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-purple-500 transition-all active:scale-95"
          >
            <Zap className="h-4 w-4" />
            🧪 Prueba E2E: Campaña ➔ Venta
          </button>

          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            Configurar Pipeline
          </button>

          <button
            onClick={() => setIsNewLeadOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Agregar Cliente
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('PIPELINE')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'PIPELINE'
              ? 'bg-yellow-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Pipeline ({opportunities.length})
        </button>

        <button
          onClick={() => setActiveTab('LEADS')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'LEADS'
              ? 'bg-yellow-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Leads & Prospectos
          {newLeadsCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === 'LEADS' ? 'bg-slate-950 text-yellow-400' : 'bg-yellow-400 text-slate-950'
              }`}
            >
              {newLeadsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('MI_DIA')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'MI_DIA'
              ? 'bg-yellow-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Mi Día / Seguimientos
          {pendingTasksCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === 'MI_DIA' ? 'bg-slate-950 text-yellow-400' : 'bg-red-500 text-white'
              }`}
            >
              {pendingTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ACTIVIDADES')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'ACTIVIDADES'
              ? 'bg-yellow-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          Bitácora de Actividades
        </button>

        <button
          onClick={() => setActiveTab('METAS')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'METAS'
              ? 'bg-yellow-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Metas & Comisiones
        </button>

        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'FORECAST'
              ? 'bg-yellow-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Pronóstico (Forecast)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'PIPELINE' && (
        <PipelineKanban
          onOpenNewOpportunity={() => setIsNewOppOpen(true)}
          onNavigateToQuotes={() => onNavigate && onNavigate('COTIZACIONES')}
          onNavigateToCustomer={(cId) => {
            if (onSelectCustomer) onSelectCustomer(cId);
            if (onNavigate) onNavigate('CLIENTES');
          }}
        />
      )}

      {activeTab === 'LEADS' && (
        <LeadsManager
          onOpenCustomer={(cId) => {
            if (onSelectCustomer) onSelectCustomer(cId);
            if (onNavigate) onNavigate('CLIENTES');
          }}
        />
      )}

      {activeTab === 'MI_DIA' && (
        <MyDayFollowUps
          onNavigateToCustomer={(cId) => {
            if (onSelectCustomer) onSelectCustomer(cId);
            if (onNavigate) onNavigate('CLIENTES');
          }}
        />
      )}

      {activeTab === 'ACTIVIDADES' && <ActivitiesLog />}

      {activeTab === 'METAS' && <SalesGoalsAndCommissions />}

      {activeTab === 'FORECAST' && <SalesForecast />}

      {/* Modals */}
      {isConfigOpen && (
        <PipelineConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      )}
      {isNewOppOpen && (
        <OpportunityModal isOpen={isNewOppOpen} onClose={() => setIsNewOppOpen(false)} />
      )}
      {isNewLeadOpen && (
        <LeadModal isOpen={isNewLeadOpen} onClose={() => setIsNewLeadOpen(false)} />
      )}
      {isE2EOpen && (
        <E2EFlowTestModal
          isOpen={isE2EOpen}
          onClose={() => setIsE2EOpen(false)}
          onNavigateModule={(mod) => {
            setIsE2EOpen(false);
            if (onNavigate) onNavigate(mod);
          }}
        />
      )}
      {isRLSCertOpen && (
        <CommercialRLSCertificationModal
          isOpen={isRLSCertOpen}
          onClose={() => setIsRLSCertOpen(false)}
        />
      )}
    </div>
  );
};
