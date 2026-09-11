import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  User,
  Clock,
  Laptop,
  CheckCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPModule } from '../../types/erp';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useERP();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('TODOS');
  const [selectedRole, setSelectedRole] = useState<string>('TODOS');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.userName || "").toLowerCase().includes(q) ||
        (log.details || "").toLowerCase().includes(q) ||
        (log.recordId && (log.recordId || "").toLowerCase().includes(q));

      const matchModule =
        selectedModule === 'TODOS' || log.module === selectedModule;

      const matchRole = selectedRole === 'TODOS' || log.userRole === selectedRole;

      return matchQuery && matchModule && matchRole;
    });
  }, [auditLogs, searchQuery, selectedModule, selectedRole]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha/Hora', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Registro', 'Detalles', 'IP'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      l.userRole,
      l.module,
      `"${l.action}"`,
      `"${l.recordId || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-white p-6 rounded-xl shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bitácora Inmutable de Auditoría & Trazabilidad
              </h2>
              <p className="text-xs text-slate-500">
                Registro criptográfico de operaciones, autorizaciones, movimientos de inventario y consultas de IA
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <Download className="h-4 w-4 text-slate-500" /> Exportar CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por usuario, acción, folio o detalle..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-600"
            >
              <option value="TODOS">Todos los Módulos</option>
              <option value="DASHBOARD">Dashboard</option>
              <option value="IA">CONSCORE AI</option>
              <option value="COTIZACIONES">Cotizaciones</option>
              <option value="PEDIDOS">Pedidos</option>
              <option value="INVENTARIO">Inventario</option>
              <option value="CLIENTES">Clientes</option>
              <option value="CONFIGURACION">Configuración</option>
            </select>
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-600"
            >
              <option value="TODOS">Todos los Roles</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              <option value="DIRECTOR">DIRECTOR</option>
              <option value="GERENTE_VENTAS">GERENTE_VENTAS</option>
              <option value="VENDEDOR">VENDEDOR</option>
              <option value="ALMACEN">ALMACEN</option>
              <option value="FINANZAS">FINANZAS</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
          <span>Mostrando <b>{filteredLogs.length}</b> de <b>{auditLogs.length}</b> eventos registrados</span>
          <span className="font-semibold text-emerald-700">Trazabilidad en tiempo real</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Usuario & Rol</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Folio / Id</th>
                <th className="py-3 px-4">Detalle de la Operación</th>
                <th className="py-3 px-4">IP Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-blue-700 font-mono">{log.userRole}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {log.recordId ? (
                      <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                        {log.recordId}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                    {log.ip || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
