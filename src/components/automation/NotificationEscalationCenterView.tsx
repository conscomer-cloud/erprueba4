/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Omnichannel Notification Hub & Escalation Matrix
 */

import React, { useState } from 'react';
import {
  Bell,
  Clock,
  ShieldAlert,
  Mail,
  Smartphone,
  AppWindow,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { OmniNotification, EscalationIncident } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface NotificationEscalationCenterViewProps {
  notifications: OmniNotification[];
  escalations: EscalationIncident[];
  onRefresh: () => void;
}

export const NotificationEscalationCenterView: React.FC<NotificationEscalationCenterViewProps> = ({
  notifications,
  escalations,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'ESCALATIONS'>('NOTIFICATIONS');
  const [filterSeverity, setFilterSeverity] = useState<string>('TODAS');

  const filteredNotifs = notifications.filter((n) => {
    if (filterSeverity === 'TODAS') return true;
    return n.severity === filterSeverity;
  });

  const handleMarkRead = (id: string) => {
    AutomationBpmEngine.markNotificationRead(id);
    onRefresh();
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case 'PUSH':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-600" />;
      case 'APP':
      default:
        return <AppWindow className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
              Centro Omnicanal
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              Entrega Inmediata SLA &lt; 500ms
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Notificaciones & Matriz de Escalamiento Jerárquico
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Despacho inteligente de alertas por APP, Email y Push. Escalamiento progresivo (4h Supervisor → 8h Gerente → 24h Dirección).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notificaciones ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('ESCALATIONS')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'ESCALATIONS'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Escalamientos SLA ({escalations.length})
          </button>
        </div>
      </div>

      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-700">Filtrar por Severidad:</span>
            <div className="flex items-center gap-1.5">
              {['TODAS', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    filterSeverity === sev
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotifs.map((notif) => {
              const isUnread = notif.status === 'SENT';
              return (
                <div
                  key={notif.notificationId}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 bg-white shadow-2xs ${
                    isUnread ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-slate-100 border border-slate-200">
                          {getChannelIcon(notif.channel)}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {notif.recipientRole}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          notif.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : notif.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : notif.severity === 'WARNING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {notif.severity}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="mt-2 text-[11px] text-slate-400 font-mono">
                      {notif.entityType}: {notif.entityId}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                    {isUnread ? (
                      <button
                        onClick={() => handleMarkRead(notif.notificationId)}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Marcar Leída
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-medium">Leída</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'ESCALATIONS' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Matriz de Escalamiento Automático por Inactividad SLA
            </h3>
            <span className="text-xs text-slate-500">
              Protocolo corporativo de no-bloqueo operativo
            </span>
          </div>

          <div className="space-y-3">
            {escalations.map((esc) => (
              <div
                key={esc.incidentId}
                className="p-4 rounded-lg border border-amber-200 bg-amber-50/40 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-900">{esc.incidentId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                      Nivel {esc.currentLevel}: {esc.history.at(-1)?.notifiedRole || '—'}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500">
                    SLA Excedido: +{Math.max(0, (esc.elapsedMinutes - esc.slaMinutes) / 60).toFixed(1)} horas
                  </span>
                </div>

                <p className="text-slate-800 font-semibold">{esc.title}</p>

                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>Roles notificados en cadena:</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    {esc.history.map(entry => entry.notifiedRole).map((r, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <ArrowUpRight className="w-3 h-3 text-amber-600" />}
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
