import React, { useState } from 'react';
import {
  Briefcase,
  Filter,
  DollarSign,
  Calendar,
  User,
  Bot,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Receipt,
  MessageSquare,
  Phone,
  AlertTriangle,
  Clock,
  Search,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Opportunity, PipelineStageConfig } from '../../types/erp';
import { CommercialRLSService } from '../../services/commercialRLSService';
import { OpportunityModal } from './OpportunityModal';
import { AIDraftModal } from './AIDraftModal';
import { FollowUpModal } from './FollowUpModal';

interface PipelineKanbanProps {
  onOpenNewOpportunity?: () => void;
  onNavigateToQuotes?: () => void;
  onNavigateToCustomer?: (customerId: string) => void;
}

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  onOpenNewOpportunity,
  onNavigateToQuotes,
  onNavigateToCustomer,
}) => {
  const {
    opportunities,
    pipelineStages,
    changeOpportunityStage,
    createQuoteFromOpportunity,
    analyzeOpportunityWithAI,
  } = useERP();
  const { currentUser, can } = useAuth();

  const [selectedRep, setSelectedRep] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [isNewOppOpen, setIsNewOppOpen] = useState(false);
  const [aiDraftTarget, setAiDraftTarget] = useState<Opportunity | null>(null);
  const [followUpTarget, setFollowUpTarget] = useState<Opportunity | null>(null);
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);

  const isPrivileged = currentUser?.role && ['ADMIN', 'ADMINISTRADOR', 'GERENTE_VENTAS', 'DIRECTOR_COMERCIAL', 'DIRECTOR'].includes(currentUser.role);

  // Scoped opportunities
  const accessibleOpportunities = isPrivileged
    ? opportunities
    : CommercialRLSService.scopeOpportunities(opportunities, currentUser);

  // Filter opportunities
  const filteredOpportunities = accessibleOpportunities.filter((opp) => {
    const matchRep = selectedRep === 'TODOS' || opp.salespersonId === selectedRep;
    const matchSearch =
      searchTerm.trim() === '' ||
      (opp.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.folio || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchRep && matchSearch;
  });

  // Calculate totals
  const totalValue = filteredOpportunities.reduce((acc, o) => acc + o.estimatedValue, 0);
  const totalWeightedValue = filteredOpportunities.reduce(
    (acc, o) => acc + o.estimatedValue * (o.probability / 100),
    0
  );

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData('text/plain', oppId);
    setDraggedOppId(oppId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageCode: string) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain') || draggedOppId;
    if (oppId) {
      changeOpportunityStage(oppId, targetStageCode);
    }
    setDraggedOppId(null);
  };

  const handleGenerateQuote = (opp: Opportunity) => {
    try {
      const quote = createQuoteFromOpportunity(opp.id);
      alert(`Cotización ${quote.folio} generada con éxito vinculada a la oportunidad ${opp.folio}.`);
      if (onNavigateToQuotes) onNavigateToQuotes();
    } catch (err: any) {
      alert(err.message || 'Error al generar cotización');
    }
  };

  // Get distinct sales reps for filter
  const distinctReps: Array<{ id: string; name: string }> = Array.from(
    new Set(accessibleOpportunities.map((o) => JSON.stringify({ id: o.salespersonId, name: o.salespersonName })))
  ).map((s) => JSON.parse(s as string));

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar proyecto, cliente o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Sales rep filter (only for privileged roles) */}
          {isPrivileged && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
              >
                <option value="TODOS">Todos los Vendedores ({opportunities.length})</option>
                {distinctReps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Value summary */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Total Pipeline</span>
            <span className="text-sm font-bold text-white">${(Number(totalValue) || 0).toLocaleString('es-MX')} MXN</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Ponderado IA</span>
            <span className="text-sm font-bold text-yellow-400">
              ${(Number(Math.round(totalWeightedValue)) || 0).toLocaleString('es-MX')} MXN
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[620px] scrollbar-thin">
        {pipelineStages.map((stage) => {
          const stageOpps = filteredOpportunities.filter((o) => o.stage === stage.code || o.stage === stage.name);
          const stageTotal = stageOpps.reduce((acc, o) => acc + o.estimatedValue, 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.code)}
              className="flex w-80 shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm"
            >
              {/* Column Header */}
              <div className="border-b border-slate-800 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.color || 'bg-blue-400'}`} />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{stage.name}</h4>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                    {stageOpps.length}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>${(Number(stageTotal) || 0).toLocaleString('es-MX')} MXN</span>
                  <span className="font-semibold text-slate-500">{stage.probability}% prob.</span>
                </div>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 p-3 overflow-y-auto max-h-[600px]">
                {stageOpps.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 text-center p-4 text-xs text-slate-500">
                    <span>Sin oportunidades</span>
                    <span className="text-[10px] text-slate-600 mt-1">Arrastra aquí para mover</span>
                  </div>
                ) : (
                  stageOpps.map((opp) => {
                    const daysNoContact = opp.aiAnalysis?.daysWithoutContact ?? 2;
                    const isStagnant = daysNoContact >= 4;

                    return (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        className="group relative flex flex-col rounded-lg border border-slate-800 bg-slate-950 p-3.5 shadow-sm transition-all hover:border-slate-700 hover:shadow-md cursor-grab active:cursor-grabbing"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold text-yellow-400">{opp.folio}</span>
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                              {opp.probability}%
                            </span>
                            {isStagnant && (
                              <span
                                title={`${daysNoContact} días sin contacto registrado`}
                                className="flex items-center text-amber-400"
                              >
                                <Clock className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Opportunity Title & Customer */}
                        <h5
                          onClick={() => setEditingOpp(opp)}
                          className="mt-1 text-xs font-bold text-slate-100 line-clamp-2 hover:text-yellow-400 cursor-pointer transition-colors"
                        >
                          {opp.title}
                        </h5>

                        <p
                          onClick={() => onNavigateToCustomer && onNavigateToCustomer(opp.customerId)}
                          className="mt-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer truncate"
                        >
                          {opp.customerName}
                        </p>

                        {/* Value & Dates */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                          <span className="font-bold text-emerald-400">
                            ${(Number(opp.estimatedValue) || 0).toLocaleString('es-MX')} MXN
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {opp.expectedCloseDate}
                          </span>
                        </div>

                        {/* AI Chip */}
                        {opp.aiAnalysis && (
                          <div className="mt-2 rounded bg-yellow-400/10 border border-yellow-400/20 p-1.5 text-[10px] text-slate-300">
                            <div className="flex items-center gap-1 text-yellow-300 font-semibold mb-0.5">
                              <Bot className="h-3 w-3" />
                              <span>Siguiente paso IA:</span>
                            </div>
                            <p className="line-clamp-2 text-slate-300">{opp.aiAnalysis.nextAction}</p>
                          </div>
                        )}

                        {/* Quote link badge if exists */}
                        {opp.quoteFolio && (
                          <div className="mt-2 flex items-center justify-between rounded bg-blue-950/40 border border-blue-800/40 px-2 py-1 text-[10px] text-blue-300">
                            <span className="flex items-center gap-1 font-semibold">
                              <Receipt className="h-3 w-3" />
                              {opp.quoteFolio}
                            </span>
                            <span className="text-slate-400">Cotizada</span>
                          </div>
                        )}

                        {/* Footer info & quick actions */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px] text-slate-400">
                          <span className="truncate max-w-[120px]" title={opp.salespersonName}>
                            👤 {opp.salespersonName.split(' ')[0]}
                          </span>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* AI follow-up generator button */}
                            <button
                              onClick={() => setAiDraftTarget(opp)}
                              title="Redactar mensaje con CONSCORE AI"
                              className="rounded p-1 text-yellow-400 hover:bg-yellow-400/20 hover:text-yellow-300"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>

                            {/* Schedule follow-up */}
                            <button
                              onClick={() => setFollowUpTarget(opp)}
                              title="Programar Seguimiento"
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                            </button>

                            {/* Generate Quote button */}
                            {!opp.quoteFolio && (
                              <button
                                onClick={() => handleGenerateQuote(opp)}
                                title="Generar Cotización Formal"
                                className="rounded p-1 text-blue-400 hover:bg-blue-400/20 hover:text-blue-300"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Stage quick move dropdown */}
                            <div className="relative group/menu">
                              <select
                                value={opp.stage}
                                onChange={(e) => changeOpportunityStage(opp.id, e.target.value)}
                                className="rounded bg-slate-800 text-[10px] text-slate-300 py-0.5 px-1 border border-slate-700 cursor-pointer focus:outline-none"
                              >
                                {pipelineStages.map((st) => (
                                  <option key={st.code} value={st.code}>
                                    {st.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {isNewOppOpen && (
        <OpportunityModal isOpen={isNewOppOpen} onClose={() => setIsNewOppOpen(false)} />
      )}

      {editingOpp && (
        <OpportunityModal
          isOpen={!!editingOpp}
          opportunityToEdit={editingOpp}
          onClose={() => setEditingOpp(null)}
        />
      )}

      {aiDraftTarget && (
        <AIDraftModal
          isOpen={!!aiDraftTarget}
          target={{
            opportunity: aiDraftTarget,
            defaultChannel: 'WHATSAPP',
          }}
          onClose={() => setAiDraftTarget(null)}
        />
      )}

      {followUpTarget && (
        <FollowUpModal
          isOpen={!!followUpTarget}
          defaultCustomerId={followUpTarget.customerId}
          defaultOpportunityId={followUpTarget.id}
          onClose={() => setFollowUpTarget(null)}
        />
      )}
    </div>
  );
};
