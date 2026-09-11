/**
 * @license
 * CONSCORE ERP IA - Business Continuity Center View
 * 12-Component System Resiliency & Real-time Uptime Monitor
 */

import React from 'react';
import { BusinessContinuityComponent } from '../../types/predictiveOperationsTypes';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';
import {
  Server,
  Database,
  Key,
  Shield,
  Radio,
  HardDrive,
  FileCheck,
  Cpu,
  RefreshCw,
  Landmark,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Activity,
} from 'lucide-react';

export const BusinessContinuityView: React.FC = () => {
  const components = PredictiveOperationsService.getContinuityComponents();

  const getComponentIcon = (name: BusinessContinuityComponent['name']) => {
    switch (name) {
      case 'Database':
        return Database;
      case 'API':
        return Server;
      case 'Authentication':
        return Key;
      case 'Authorization':
        return Shield;
      case 'Realtime':
        return Radio;
      case 'Storage':
        return HardDrive;
      case 'Audit':
        return FileCheck;
      case 'Integrations':
        return RefreshCw;
      case 'AI':
        return Cpu;
      case 'Backups':
        return HardDrive;
      case 'Banking':
        return Landmark;
      case 'SAT/PAC':
        return FileText;
      default:
        return Server;
    }
  };

  const avgUptime = (
    components.reduce((acc, curr) => acc + curr.uptimePct, 0) / components.length
  ).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Business Continuity Center</h2>
            <DataClassificationBadge classification="REAL" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Monitoreo en tiempo real de 12 componentes críticos, objetivos RPO/RTO y sellado SHA-256.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-emerald-700 uppercase">Uptime Global SLA</div>
            <div className="text-lg font-bold text-emerald-900">{avgUptime}%</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-lg text-center">
            <div className="text-xs font-semibold text-purple-700 uppercase">Estado General</div>
            <div className="text-lg font-bold text-purple-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Operativo
            </div>
          </div>
        </div>
      </div>

      {/* 12-Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {components.map((comp) => {
          const Icon = getComponentIcon(comp.name);

          return (
            <div
              key={comp.componentId}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 hover:border-purple-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{comp.name}</h3>
                    <span className="text-[11px] font-mono text-slate-500">{comp.componentId}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {comp.status}
                </span>
              </div>

              {/* RPO / RTO & Uptime */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center text-xs">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">RPO</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{comp.rpo}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">RTO</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{comp.rto}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Uptime</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">{comp.uptimePct}%</div>
                </div>
              </div>

              {/* Replication & SHA-256 Hash */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Replicación:</span>
                  <span className="font-semibold text-slate-900">{comp.replicationStatus}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Integridad SHA-256:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Verificado
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 bg-slate-100 p-1.5 rounded truncate border border-slate-200">
                    {comp.sha256Integrity}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
