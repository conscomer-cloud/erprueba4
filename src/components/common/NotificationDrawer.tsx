import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon, CheckCheck } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPModule } from '../../types/erp';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ERPModule) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useERP();

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CRITICA':
        return <AlertOctagon className="h-5 w-5 text-red-500 shrink-0" />;
      case 'ADVERTENCIA':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      case 'EXITO':
        return <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Notificaciones del Sistema</h2>
              <p className="text-xs text-slate-500">Alertas operativas, inventario y ventas</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1 rounded bg-slate-200/80 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Leídas</span>
              </button>
              <button
                onClick={onClose}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No hay notificaciones pendientes.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotificationRead(n.id);
                    if (n.module) {
                      onNavigate(n.module);
                      onClose();
                    }
                  }}
                  className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm ${
                    n.read
                      ? 'border-slate-100 bg-slate-50/50 opacity-75'
                      : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  {getTypeIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-700">
                        {n.module}
                      </span>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
