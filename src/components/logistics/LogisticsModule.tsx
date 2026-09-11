import React, { useState } from 'react';
import { LogisticsDashboard } from './LogisticsDashboard';
import { EmbarquesTable } from './EmbarquesTable';
import { ActiveRoutesView } from './ActiveRoutesView';
import { FleetManagementTab } from './FleetManagementTab';
import { IncidentsReturnsTab } from './IncidentsReturnsTab';
import { RoutePlanningModal } from './RoutePlanningModal';
import { Observation14Modal } from './Observation14Modal';
import { useERP } from '../../context/ERPContext';
import {
  Truck,
  LayoutDashboard,
  PackageCheck,
  MapPin,
  Users,
  AlertTriangle,
  Plus,
  ShieldCheck
} from 'lucide-react';

export type LogisticsSubTab = 'DASHBOARD' | 'EMBARQUES' | 'RUTAS' | 'FLOTA' | 'INCIDENCIAS';

export const LogisticsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LogisticsSubTab>('DASHBOARD');
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [planningInitialOrders, setPlanningInitialOrders] = useState<string[]>([]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const { logisticsKPIs } = useERP();

  const handleOpenPlanWithOrders = (orderIds: string[]) => {
    setPlanningInitialOrders(orderIds);
    setIsPlanningModalOpen(true);
  };

  const handleOpenNewRoute = () => {
    setPlanningInitialOrders([]);
    setIsPlanningModalOpen(true);
  };

  const handleRouteCreated = (routeId: string) => {
    setIsPlanningModalOpen(false);
    setActiveTab('RUTAS');
  };

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-600 p-1.5 text-white shadow-2xs">
              <Truck className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Logística, Rutas & Control de Entregas
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión integral de embarques, despacho de unidades, trazabilidad de ruta y evidencias POD
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-cert-obs-14"
            onClick={() => setIsCertModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
            title="Ver certificación técnica de Observación #14"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Certificación Obs #14
          </button>
          <button
            onClick={handleOpenNewRoute}
            id="btn-new-route"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva Ruta de Entrega
          </button>
        </div>
      </div>

      {/* Navigation Subtabs Bar */}
      <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'DASHBOARD'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard & OTIF
        </button>

        <button
          onClick={() => setActiveTab('EMBARQUES')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'EMBARQUES'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          Mesa de Embarques
          {logisticsKPIs.pedidos_listos_count > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[10px] font-bold text-white">
              {logisticsKPIs.pedidos_listos_count}
            </span>
          )}
        </button>

        <button
          id="tab-programar-rutas"
          onClick={() => setActiveTab('RUTAS')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'RUTAS'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="h-4 w-4" />
          Programar Rutas & Tráfico
          {logisticsKPIs.vehiculos_en_ruta_count > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.2 text-[10px] font-bold text-white">
              {logisticsKPIs.vehiculos_en_ruta_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('FLOTA')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'FLOTA'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          Flota & Operadores
        </button>

        <button
          onClick={() => setActiveTab('INCIDENCIAS')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'INCIDENCIAS'
              ? 'bg-white text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Incidencias & Devoluciones
          {logisticsKPIs.incidencias_activas_count > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.2 text-[10px] font-bold text-white">
              {logisticsKPIs.incidencias_activas_count}
            </span>
          )}
        </button>
      </div>

      {/* Subtab Contents */}
      {activeTab === 'DASHBOARD' && (
        <LogisticsDashboard
          onNavigateTab={setActiveTab}
          onOpenNewRouteModal={handleOpenNewRoute}
        />
      )}

      {activeTab === 'EMBARQUES' && (
        <EmbarquesTable onPlanRouteWithOrders={handleOpenPlanWithOrders} />
      )}

      {activeTab === 'RUTAS' && (
        <ActiveRoutesView onOpenNewRouteModal={handleOpenNewRoute} />
      )}

      {activeTab === 'FLOTA' && <FleetManagementTab />}

      {activeTab === 'INCIDENCIAS' && <IncidentsReturnsTab />}

      {/* Route Planning Wizard Modal */}
      {isPlanningModalOpen && (
        <RoutePlanningModal
          initialSelectedOrderIds={planningInitialOrders}
          onClose={() => setIsPlanningModalOpen(false)}
          onRouteCreated={handleRouteCreated}
        />
      )}

      {/* Observation 14 Certification Modal */}
      {isCertModalOpen && (
        <Observation14Modal onClose={() => setIsCertModalOpen(false)} />
      )}
    </div>
  );
};
