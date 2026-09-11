/**
 * @license
 * CONSCORE ERP IA - FASE 14: AUTOMATIZACIÓN EMPRESARIAL + BPM + WORKFLOWS + RPA
 * Controlled RPA Robot Bots Manager & Guardrails Compliance Hub
 */

import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Play,
  CheckCircle2,
  Clock,
  Lock,
  Terminal,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import { RpaRobotTask } from '../../types/automationBpmTypes';
import { AutomationBpmEngine } from '../../services/automationBpmEngine';

interface RpaBotsManagerViewProps {
  bots: RpaRobotTask[];
  onRefresh: () => void;
}

export const RpaBotsManagerView: React.FC<RpaBotsManagerViewProps> = ({
  bots,
  onRefresh,
}) => {
  const [selectedBot, setSelectedBot] = useState<RpaRobotTask>(bots[0] || null);
  const [runningBotId, setRunningBotId] = useState<string | null>(null);

  const handleRunBot = (taskId: string) => {
    setRunningBotId(taskId);
    setTimeout(() => {
      AutomationBpmEngine.runRpaTask(taskId);
      setRunningBotId(null);
      onRefresh();
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              RPA Fleet Control
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Guardrails Anti-Dispersión Autónomo: 100% Activo
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Robots de Automatización (RPA) & Políticas de Seguridad
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tareas repetitivas ejecutadas por software con estrictos límites de gobernanza (no dispersión de fondos, no bajas de personal ni afectaciones contables sin firma).
          </p>
        </div>
      </div>

      {/* Main Grid: Left Bots List (2 cols), Right Terminal Log Inspector (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bots List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bots.map((bot) => {
              const isSelected = selectedBot?.taskId === bot.taskId;
              const isRunning = runningBotId === bot.taskId;

              return (
                <div
                  key={bot.taskId}
                  onClick={() => setSelectedBot(bot)}
                  className={`bg-white p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-sm ${
                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900 block">
                            {bot.robotName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {bot.taskId} · {bot.category}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bot.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bot.status === 'RUNNING'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isRunning ? 'EJECUTANDO...' : bot.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {bot.description}
                    </p>

                    <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Horario:</span>
                        <span className="font-mono text-slate-700 font-medium">{bot.scheduledCron}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Ejecuciones:</span>
                        <span className="font-bold text-slate-800">{bot.executionCount}</span>
                      </div>
                    </div>

                    {/* Guardrail compliance badge */}
                    <div className="mt-2.5 p-2 bg-emerald-50 rounded border border-emerald-200 text-[10px] text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{bot.sensitiveGuardrailsVerified ? 'Controles verificados' : 'Controles pendientes' }</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Última: {new Date(bot.lastRunAt).toLocaleTimeString()}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunBot(bot.taskId);
                      }}
                      disabled={isRunning}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      {isRunning ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Ejecutar Bot
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Terminal Logs Inspector */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              Logs de Ejecución ({selectedBot?.robotName})
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Live Stream</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] max-h-[480px] overflow-y-auto pr-1">
            {selectedBot?.logs.map((log, idx) => (
              <div
                key={idx}
                className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-emerald-400/90 leading-relaxed"
              >
                {log}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Certificación SoD: OK</span>
            <span>Zero-Dispersión: Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
