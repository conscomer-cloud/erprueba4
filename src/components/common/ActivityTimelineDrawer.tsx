import React from 'react';
import { X, Activity, User, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPModule } from '../../types/erp';

interface ActivityTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ERPModule) => void;
}

export const ActivityTimelineDrawer: React.FC<ActivityTimelineDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { auditLogs } = useERP();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Centro de Actividad</h2>
                <p className="text-xs text-slate-500">Trazabilidad operativa en tiempo real</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Timeline content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pl-6">
                  {/* Circle marker */}
                  <div className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-sm" />

                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs hover:border-slate-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                        {log.module}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Clock className="h-3 w-3" />
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="mt-1.5 text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>{log.action.replace(/_/g, ' ')}</span>
                      {log.recordId && (
                        <span className="font-mono text-[11px] text-amber-700 bg-amber-50 px-1 rounded">
                          {log.recordId}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <b className="text-slate-700">{log.userName}</b> ({log.userRole})
                      </span>
                      <button
                        onClick={() => {
                          onNavigate(log.module);
                          onClose();
                        }}
                        className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Ver módulo <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
