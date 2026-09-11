import React, { useState } from 'react';
import {
  FileText,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Building2,
  Briefcase,
  User,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Activity, ActivityType } from '../../types/erp';
import { ActivityModal } from './ActivityModal';

export const ActivitiesLog: React.FC = () => {
  const { activities, customers, opportunities } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');
  const [repFilter, setRepFilter] = useState<string>('TODOS');
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchType = typeFilter === 'TODOS' || act.type === typeFilter;
    const matchRep = repFilter === 'TODOS' || act.salespersonId === repFilter;
    const matchSearch =
      searchTerm.trim() === '' ||
      (act.result || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.customerName && (act.customerName || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (act.opportunityTitle && (act.opportunityTitle || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (act.nextAction && (act.nextAction || "").toLowerCase().includes(searchTerm.toLowerCase()));

    return matchType && matchRep && matchSearch;
  });

  const distinctReps: Array<{ id: string; name: string }> = Array.from(
    new Set(activities.map((a) => JSON.stringify({ id: a.salespersonId || a.userId, name: a.salespersonName || a.userName })))
  ).map((s) => JSON.parse(s as string));

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'LLAMADA':
        return <Phone className="h-4 w-4 text-amber-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case 'CORREO':
        return <Mail className="h-4 w-4 text-blue-400" />;
      case 'VISITA_TECNICA':
        return <Building2 className="h-4 w-4 text-yellow-400" />;
      case 'PRESENTACION_COTIZACION':
        return <FileText className="h-4 w-4 text-purple-400" />;
      default:
        return <Calendar className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar en acuerdos, clientes o minutas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-yellow-400 focus:outline-none"
          >
            <option value="TODOS">Todos los Tipos ({activities.length})</option>
            <option value="LLAMADA">Llamadas</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="CORREO">Correos</option>
            <option value="VISITA_TECNICA">Visitas Técnicas</option>
            <option value="PRESENTACION_COTIZACION">Presentaciones de Cotización</option>
            <option value="REUNION">Reuniones</option>
          </select>

          {/* Rep filter */}
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
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
          onClick={() => setIsNewActivityOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Registrar Actividad
        </button>
      </div>

      {/* Activities Timeline / Cards */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-center p-6 text-slate-500">
            <FileText className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Sin actividades registradas</p>
            <p className="text-xs text-slate-500 mt-1">Registra la primera llamada o visita con el botón superior.</p>
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800">
                    {getTypeIcon(act.type)}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {act.type.replace('_', ' ')}
                  </span>
                  {act.customerName && (
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                      🏢 {act.customerName}
                    </span>
                  )}
                  {act.opportunityTitle && (
                    <span className="rounded bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                      💼 {act.opportunityTitle}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3" />
                    {new Date(act.date).toLocaleString('es-MX')}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    👤 {act.salespersonName}
                  </span>
                </div>
              </div>

              {/* Body / Minuta */}
              <div className="pt-3 space-y-2">
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {act.result}
                </p>

                {/* Siguiente accion */}
                {act.nextAction && (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/60 text-xs">
                    <ArrowRight className="h-4 w-4 text-yellow-400 shrink-0" />
                    <span className="text-slate-400">Siguiente Acción:</span>
                    <span className="font-semibold text-slate-200">{act.nextAction}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {isNewActivityOpen && <ActivityModal isOpen={isNewActivityOpen} onClose={() => setIsNewActivityOpen(false)} />}
    </div>
  );
};
