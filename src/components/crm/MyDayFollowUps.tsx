import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  User,
  Plus,
  Search,
  Filter,
  Sparkles,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { FollowUp, FollowUpStatus, FollowUpPriority } from '../../types/erp';
import { FollowUpModal } from './FollowUpModal';
import { AIDraftModal } from './AIDraftModal';

interface MyDayFollowUpsProps {
  onNavigateToCustomer?: (customerId: string) => void;
  onNavigateToOpportunity?: (oppId: string) => void;
}

export const MyDayFollowUps: React.FC<MyDayFollowUpsProps> = ({
  onNavigateToCustomer,
  onNavigateToOpportunity,
}) => {
  const { followUps, updateFollowUpStatus, customers, opportunities, leads } = useERP();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'HOY' | 'VENCIDOS' | 'PROXIMOS' | 'COMPLETADOS'>('HOY');
  const [selectedRep, setSelectedRep] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [aiDraftTarget, setAiDraftTarget] = useState<any | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter tasks
  const filteredTasks = followUps.filter((task) => {
    const matchRep = selectedRep === 'TODOS' || task.salespersonId === selectedRep;
    const matchSearch =
      searchTerm.trim() === '' ||
      (task.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.customerName && (task.customerName || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.leadName && (task.leadName || "").toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchRep || !matchSearch) return false;

    if (activeTab === 'HOY') {
      return task.status === 'PENDIENTE' && task.date === todayStr;
    }
    if (activeTab === 'VENCIDOS') {
      return task.status === 'VENCIDO' || (task.status === 'PENDIENTE' && task.date < todayStr);
    }
    if (activeTab === 'PROXIMOS') {
      return task.status === 'PENDIENTE' && task.date > todayStr;
    }
    if (activeTab === 'COMPLETADOS') {
      return task.status === 'COMPLETADO';
    }
    return true;
  });

  // Distinct counts
  const countHoy = followUps.filter((f) => f.status === 'PENDIENTE' && f.date === todayStr).length;
  const countVencidos = followUps.filter(
    (f) => f.status === 'VENCIDO' || (f.status === 'PENDIENTE' && f.date < todayStr)
  ).length;
  const countProximos = followUps.filter((f) => f.status === 'PENDIENTE' && f.date > todayStr).length;
  const countCompletados = followUps.filter((f) => f.status === 'COMPLETADO').length;

  const distinctReps: Array<{ id: string; name: string }> = Array.from(
    new Set(followUps.map((f) => JSON.stringify({ id: f.salespersonId, name: f.salespersonName })))
  ).map((s) => JSON.parse(s as string));

  const handleComplete = (taskId: string) => {
    const note = prompt('Nota de cierre del seguimiento (opcional):');
    updateFollowUpStatus(taskId, 'COMPLETADO', note || 'Seguimiento completado exitosamente.');
  };

  const getPriorityBadge = (p: FollowUpPriority) => {
    switch (p) {
      case 'ALTA':
        return (
          <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-[10px] font-bold text-red-300 border border-red-800">
            🔥 ALTA
          </span>
        );
      case 'MEDIA':
        return (
          <span className="rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800">
            ⚡ MEDIA
          </span>
        );
      case 'BAJA':
        return (
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
            🌱 BAJA
          </span>
        );
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case 'LLAMADA':
        return <Phone className="h-4 w-4 text-amber-400" />;
      case 'CORREO':
        return <Mail className="h-4 w-4 text-blue-400" />;
      case 'COTIZACION':
        return <FileText className="h-4 w-4 text-purple-400" />;
      default:
        return <Calendar className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar tarea o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Rep filter */}
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
          >
            <option value="TODOS">Todos los Ejecutivos</option>
            {distinctReps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva Tarea / Seguimiento
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-t-xl px-2 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('HOY')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'HOY'
              ? 'border-yellow-400 text-yellow-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Tareas de Hoy
          <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] text-yellow-300 font-extrabold">
            {countHoy}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('VENCIDOS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'VENCIDOS'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Vencidos
          {countVencidos > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300 font-extrabold">
              {countVencidos}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PROXIMOS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'PROXIMOS'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          Próximos
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-semibold">
            {countProximos}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETADOS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'COMPLETADOS'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Completados
          <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold">
            {countCompletados}
          </span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-center p-6 text-slate-500">
            <CheckCircle2 className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">¡Todo al día en esta sección!</p>
            <p className="text-xs text-slate-500 mt-1">No hay tareas pendientes en este filtro.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETADO';
            const isOverdue = !isCompleted && task.date < todayStr;
            const targetCustomer = customers.find((c) => c.id === task.customerId);
            const targetLead = leads.find((l) => l.id === task.leadId);
            const targetOpp = opportunities.find((o) => o.id === task.opportunityId);

            return (
              <div
                key={task.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 shadow-sm transition-all ${
                  isCompleted
                    ? 'border-slate-800 bg-slate-950/60 opacity-60'
                    : isOverdue
                    ? 'border-red-900/50 bg-red-950/20 hover:border-red-700'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                {/* Left Side: Checkbox + Info */}
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    onClick={() => !isCompleted && handleComplete(task.id)}
                    disabled={isCompleted}
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                        : 'border-slate-600 hover:border-yellow-400 bg-slate-950'
                    }`}
                  >
                    {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        {getChannelIcon(task.type)}
                        <span>{task.type}</span>
                      </div>
                      {getPriorityBadge(task.priority)}

                      {/* Associated Customer / Lead Tag */}
                      {(task.customerName || task.leadName) && (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                          🏢 {task.customerName || task.leadName}
                        </span>
                      )}

                      {task.opportunityTitle && (
                        <span className="rounded bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                          💼 {task.opportunityTitle}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs text-slate-200 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                      {task.description}
                    </p>

                    {task.completedNotes && (
                      <p className="text-[11px] text-emerald-400 italic">
                        ✓ Nota de resolución: {task.completedNotes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" />
                        {task.date} ({task.time || '10:00'})
                      </span>
                      <span className="flex items-center gap-1">
                        👤 {task.salespersonName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Quick Action buttons */}
                {!isCompleted && (
                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    {/* CONSCORE AI Draft Button */}
                    <button
                      onClick={() =>
                        setAiDraftTarget({
                          customer: targetCustomer,
                          lead: targetLead,
                          opportunity: targetOpp,
                          defaultChannel: task.type === 'WHATSAPP' ? 'WHATSAPP' : task.type === 'CORREO' ? 'EMAIL' : 'LLAMADA',
                        })
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-300 hover:bg-yellow-400/20 transition-all shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                      Redactar con IA
                    </button>

                    {/* WhatsApp button */}
                    {(targetCustomer?.phone || targetLead?.phone) && (
                      <button
                        onClick={() => {
                          const phone = (targetCustomer?.phone || targetLead?.phone || '').replace(/[^0-9]/g, '');
                          window.open(`https://wa.me/${phone.startsWith('52') ? phone : '52' + phone}`, '_blank');
                        }}
                        title="Abrir WhatsApp"
                        className="rounded-lg border border-emerald-800 bg-emerald-950/60 p-2 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}

                    {/* Complete button */}
                    <button
                      onClick={() => handleComplete(task.id)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      Completar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {isNewTaskOpen && <FollowUpModal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} />}
      {aiDraftTarget && (
        <AIDraftModal
          isOpen={!!aiDraftTarget}
          target={aiDraftTarget}
          onClose={() => setAiDraftTarget(null)}
        />
      )}
    </div>
  );
};
