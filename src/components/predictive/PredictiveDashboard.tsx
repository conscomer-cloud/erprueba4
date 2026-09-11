/**
 * @license
 * CONSCORE ERP IA - Phase 16 Master Command Center
 * AI Predictive Operations, Preventive Intelligence, Business Continuity & COO Advisor
 */

import React, { useState } from 'react';
import { SalesForecastView } from './SalesForecastView';
import { InventoryForecastView } from './InventoryForecastView';
import { CollectionForecastView } from './CollectionForecastView';
import { CashFlowForecastView } from './CashFlowForecastView';
import { EarlyWarningCenterView } from './EarlyWarningCenterView';
import { BusinessContinuityView } from './BusinessContinuityView';
import { DisasterRecoverySimulatorView } from './DisasterRecoverySimulatorView';
import { MasterTransactionRecoveryView } from './MasterTransactionRecoveryView';
import { BottlenecksView } from './BottlenecksView';
import { BusinessHealthScoreView } from './BusinessHealthScoreView';
import { CooAdvisorView } from './CooAdvisorView';
import { Phase16TestView } from './Phase16TestView';
import { PredictiveOperationsService } from '../../services/predictiveOperationsService';
import { DataClassificationBadge } from './DataClassificationBadge';

import {
  TrendingUp,
  Boxes,
  CreditCard,
  Wallet,
  AlertTriangle,
  Server,
  Zap,
  GitCommit,
  Hourglass,
  Activity,
  Sparkles,
  Award,
  ShieldCheck,
  Flame,
  BarChart3,
  History,
} from 'lucide-react';

import { DemandForecastView } from './DemandForecastView';
import { BusinessIntelligenceView } from './BusinessIntelligenceView';
import { ForecastHistoryView } from './ForecastHistoryView';

export type PredictiveTab =
  | 'OVERVIEW'
  | 'VENTAS'
  | 'INVENTARIO'
  | 'COBRANZA'
  | 'FLUJO_CAJA'
  | 'ALERTAS'
  | 'CONTINUIDAD'
  | 'SIMULADOR_DR'
  | 'TRAZABILIDAD_MTX'
  | 'CUELLOS_BOTELLA'
  | 'HEALTH_SCORE'
  | 'COO_ADVISOR'
  | 'CERTIFICACION'
  | 'PRONOSTICO_DEMANDA'
  | 'BUSINESS_INTELLIGENCE'
  | 'HISTORIAL_PRONOSTICOS';

export const PredictiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PredictiveTab>('OVERVIEW');

  const healthScore = PredictiveOperationsService.getHealthScore();
  const sales30D = PredictiveOperationsService.getSalesForecastByPeriod('30D');
  const criticalInv = PredictiveOperationsService.getCriticalInventoryItems();
  const cash30D = PredictiveOperationsService.getCashFlowByHorizon('30D');
  const warnings = PredictiveOperationsService.getEarlyWarnings();
  const openWarnings = warnings.filter((w) => w.STATUS === 'OPEN');

  const formatMoney = (n: number) =>
    `$${(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;

  const tabs: { id: PredictiveTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'OVERVIEW', label: 'Centro de Mando', icon: Activity },
    { id: 'VENTAS', label: 'Ventas IA', icon: TrendingUp },
    { id: 'PRONOSTICO_DEMANDA', label: 'Pronóstico de Demanda', icon: Flame },
    { id: 'BUSINESS_INTELLIGENCE', label: 'Business Intelligence', icon: BarChart3 },
    { id: 'HISTORIAL_PRONOSTICOS', label: 'Historial Reciente', icon: History },
    { id: 'INVENTARIO', label: 'Inventario & WMS', icon: Boxes, badge: criticalInv.length > 0 ? `${criticalInv.length}` : undefined },
    { id: 'COBRANZA', label: 'Cobranza CXC', icon: CreditCard },
    { id: 'FLUJO_CAJA', label: 'Flujo de Caja', icon: Wallet },
    { id: 'ALERTAS', label: 'Alertas Tempranas', icon: AlertTriangle, badge: openWarnings.length > 0 ? `${openWarnings.length}` : undefined },
    { id: 'CONTINUIDAD', label: 'Business Continuity', icon: Server },
    { id: 'SIMULADOR_DR', label: 'Simulador DR', icon: Zap },
    { id: 'TRAZABILIDAD_MTX', label: 'Trazabilidad MTX', icon: GitCommit },
    { id: 'CUELLOS_BOTELLA', label: 'Cuellos Botella', icon: Hourglass },
    { id: 'HEALTH_SCORE', label: 'Health Score', icon: ShieldCheck },
    { id: 'COO_ADVISOR', label: 'AI COO Advisor', icon: Sparkles },
    { id: 'CERTIFICACION', label: 'Certificación 30/30', icon: Award },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-sm">
              FASE 16
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Inteligencia Predictiva, Operación Preventiva & Business Continuity
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Motor holístico de pronósticos, resiliencia empresarial, detección de fricciones y asesoría ejecutiva.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('CERTIFICACION')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Award className="w-4 h-4" />
            Certificación 30 Pruebas
          </button>
        </div>
      </div>

      {/* Sub-Navigation Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive
                        ? 'bg-white text-purple-700'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div>
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Global KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Health Score */}
              <div
                onClick={() => setActiveTab('HEALTH_SCORE')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Business Health Score
                  </span>
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono">
                  {healthScore.overallScore} / 100
                </div>
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  Calificación: {healthScore.rating} (11 Dimensiones)
                </div>
              </div>

              {/* Sales Forecast 30D */}
              <div
                onClick={() => setActiveTab('VENTAS')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Forecast Ventas (30D)
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-700 font-mono">
                  {sales30D ? formatMoney(sales30D.forecast) : '$0'}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Confianza: {sales30D?.nivelConfianza}% · Cumplimiento: {sales30D?.cumplimientoProyectado}%
                </div>
              </div>

              {/* Stockout Risk SKUs */}
              <div
                onClick={() => setActiveTab('INVENTARIO')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Riesgo Ruptura WMS
                  </span>
                  <Boxes className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-3xl font-extrabold text-rose-700 font-mono">
                  {criticalInv.length} SKUs Críticos
                </div>
                <div className="text-xs text-rose-700 font-bold">
                  Reorden Inmediato Requerido
                </div>
              </div>

              {/* Cash Flow 30D */}
              <div
                onClick={() => setActiveTab('FLUJO_CAJA')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Saldo Final Proyectado (30D)
                  </span>
                  <Wallet className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-extrabold text-purple-950 font-mono">
                  {cash30D ? formatMoney(cash30D.saldoFinalProyectado) : '$0'}
                </div>
                <div className="text-xs text-purple-700 font-bold">
                  Flujo Neto: +{cash30D ? formatMoney(cash30D.flujoNeto) : '$0'}
                </div>
              </div>
            </div>

            {/* Quick Access Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Executive Early Warnings */}
              <div
                onClick={() => setActiveTab('ALERTAS')}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-purple-300 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-900 text-sm">Alertas Tempranas</h3>
                  </div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {openWarnings.length} abiertas
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monitoreo de desvíos en ventas, atrasos en cobranza, inventarios ociosos y saturación operativa.
                </p>
                <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                  Ver Centro de Alertas →
                </div>
              </div>

              {/* Disaster Recovery Simulator */}
              <div
                onClick={() => setActiveTab('SIMULADOR_DR')}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-purple-300 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Disaster Recovery Simulator</h3>
                  </div>
                  <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    10 Escenarios
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ejecución de conmutación y resiliencia en 6 fases dentro de un Sandbox No Destructivo.
                </p>
                <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                  Abrir Simulador Sandbox →
                </div>
              </div>

              {/* CONSCORE AI COO Advisor */}
              <div
                onClick={() => setActiveTab('COO_ADVISOR')}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-purple-300 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">AI COO Advisor</h3>
                  </div>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    Protocolo 20 Puntos
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Asesoría estratégica de operaciones con análisis de causa, alternativas y Next Best Action.
                </p>
                <div className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-1">
                  Consultar AI COO Advisor →
                </div>
              </div>
            </div>

            {/* Business Health Score Snapshot */}
            <BusinessHealthScoreView />
          </div>
        )}

        {activeTab === 'VENTAS' && <SalesForecastView />}
        {activeTab === 'PRONOSTICO_DEMANDA' && <DemandForecastView />}
        {activeTab === 'BUSINESS_INTELLIGENCE' && <BusinessIntelligenceView />}
        {activeTab === 'HISTORIAL_PRONOSTICOS' && <ForecastHistoryView />}
        {activeTab === 'INVENTARIO' && <InventoryForecastView />}
        {activeTab === 'COBRANZA' && <CollectionForecastView />}
        {activeTab === 'FLUJO_CAJA' && <CashFlowForecastView />}
        {activeTab === 'ALERTAS' && <EarlyWarningCenterView />}
        {activeTab === 'CONTINUIDAD' && <BusinessContinuityView />}
        {activeTab === 'SIMULADOR_DR' && <DisasterRecoverySimulatorView />}
        {activeTab === 'TRAZABILIDAD_MTX' && <MasterTransactionRecoveryView />}
        {activeTab === 'CUELLOS_BOTELLA' && <BottlenecksView />}
        {activeTab === 'HEALTH_SCORE' && <BusinessHealthScoreView />}
        {activeTab === 'COO_ADVISOR' && <CooAdvisorView />}
        {activeTab === 'CERTIFICACION' && <Phase16TestView />}
      </div>
    </div>
  );
};
