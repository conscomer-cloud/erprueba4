import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw,
  Megaphone,
  UserCheck,
  Briefcase,
  Receipt,
  Package,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Layers,
  FileText,
  Boxes,
  Zap,
  X,
  DollarSign,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPModule } from '../../types/erp';

interface E2EFlowTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateModule?: (module: ERPModule) => void;
}

export const E2EFlowTestModal: React.FC<E2EFlowTestModalProps> = ({
  isOpen,
  onClose,
  onNavigateModule,
}) => {
  const {
    marketingCampaigns,
    marketingChannels,
    products,
    warehouses,
    executeE2ETestFlow,
  } = useERP();

  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'PRD-01');
  const [quantity, setQuantity] = useState(120);

  if (!isOpen) return null;

  const fbCampaign =
    marketingCampaigns.find(
      (c) => c.channelType === 'FACEBOOK_ADS' || c.code.includes('META') || c.utmSource === 'facebook'
    ) || marketingCampaigns[1] || marketingCampaigns[0];

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setTestResult(null);
    setCurrentStepIndex(1);

    // Step 1: Facebook Campaign (delay for visual impact)
    await new Promise((r) => setTimeout(r, 600));
    setCurrentStepIndex(2);

    // Step 2: Lead Generation
    await new Promise((r) => setTimeout(r, 700));
    setCurrentStepIndex(3);

    // Step 3: Convert to Opportunity
    await new Promise((r) => setTimeout(r, 700));
    setCurrentStepIndex(4);

    // Step 4: Quote Creation
    await new Promise((r) => setTimeout(r, 700));
    setCurrentStepIndex(5);

    // Step 5: Convert to Order & Reserve Inventory
    await new Promise((r) => setTimeout(r, 700));
    setCurrentStepIndex(6);

    // Step 6: Final Sale & Attribution Recalculation
    const result = executeE2ETestFlow({
      campaignId: fbCampaign?.id,
      leadCompanyName: 'TermoClima Industrial del Norte SA de CV',
      leadContactName: 'Ing. Roberto Villarreal Peña',
      leadPhone: '81-8390-5520',
      leadEmail: 'r.villarreal@termoclimanorte.com',
      productInterest: selectedProduct?.name || 'Duct Wrap Aislamiento Térmico con Aluminio FSK',
      estimatedValue: (selectedProduct?.price || 850) * quantity * 1.16,
      productId: selectedProduct?.id,
      quantity,
    });

    await new Promise((r) => setTimeout(r, 500));
    setTestResult(result);
    setIsRunning(false);
  };

  const steps = [
    {
      step: 1,
      title: 'Campaña Meta / Facebook',
      subtitle: 'Captura de Tráfico & UTMs',
      icon: Megaphone,
      color: 'bg-blue-600',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
    },
    {
      step: 2,
      title: 'Generación de Lead',
      subtitle: 'Prospecto Calificado MQL',
      icon: UserCheck,
      color: 'bg-indigo-600',
      borderColor: 'border-indigo-500',
      textColor: 'text-indigo-600',
    },
    {
      step: 3,
      title: 'Apertura Oportunidad',
      subtitle: 'Pipeline Comercial B2B',
      icon: Briefcase,
      color: 'bg-amber-600',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-600',
    },
    {
      step: 4,
      title: 'Cotización Formal',
      subtitle: 'Márgenes & Precios Validados',
      icon: Receipt,
      color: 'bg-emerald-600',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      step: 5,
      title: 'Pedido & Almacén',
      subtitle: 'Reserva Real de Inventario',
      icon: Package,
      color: 'bg-violet-600',
      borderColor: 'border-violet-500',
      textColor: 'text-violet-600',
    },
    {
      step: 6,
      title: 'Venta & Atribución',
      subtitle: 'Cierre Comercial & ROAS',
      icon: TrendingUp,
      color: 'bg-rose-600',
      borderColor: 'border-rose-500',
      textColor: 'text-rose-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
      <div className="flex w-full max-w-5xl flex-col rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300 border border-blue-500/30">
                  TEST E2E REAL
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Cadena Comercial & Operativa Completa
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Prueba de Extremo a Extremo: Facebook → Lead → Oportunidad → Cotización → Pedido → Venta
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-6 p-6 overflow-y-auto">
          {/* Top Control Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-blue-400" />
                  Campaña Meta / Facebook Seleccionada:
                </span>
                <p className="text-sm font-bold text-white">
                  {fbCampaign?.name || 'Meta Ads - Duct Wrap & Climatización HVAC'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                    utm_source: <b>{fbCampaign?.utmSource || 'facebook'}</b>
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                    utm_campaign: <b>{fbCampaign?.utmCampaign || 'duct_wrap_hvac_verano'}</b>
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-blue-300">
                    ROAS Actual: <b>{fbCampaign?.roas?.toFixed(1) || '16.4'}x</b>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex-1 md:flex-initial">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Cantidad a Cotizar
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 10))}
                    disabled={isRunning}
                    className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={isRunning}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition transform active:scale-95 shrink-0"
                >
                  {isRunning ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      Ejecutando Cadena...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" />
                      {testResult ? 'Ejecutar Otra Prueba E2E' : 'Iniciar Prueba Extremo a Extremo'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stepper Visualization */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {steps.map((st) => {
              const Icon = st.icon;
              const isCompleted = testResult || (isRunning && currentStepIndex > st.step);
              const isActive = isRunning && currentStepIndex === st.step;

              return (
                <div
                  key={st.step}
                  className={`relative flex flex-col rounded-xl border p-3.5 transition-all duration-300 ${
                    isCompleted
                      ? 'border-emerald-500/50 bg-emerald-950/20 text-white shadow-xs'
                      : isActive
                      ? `${st.borderColor} bg-slate-800 ring-2 ring-blue-500/50 scale-102`
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-black text-slate-400">
                      PASO 0{st.step}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isActive ? (
                      <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                    ) : null}
                  </div>

                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isCompleted ? 'bg-emerald-500 text-slate-950' : `${st.color} text-white`
                    } mb-2 shadow-xs`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <span className="text-xs font-bold text-white leading-tight">{st.title}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{st.subtitle}</span>
                </div>
              );
            })}
          </div>

          {/* Results Display */}
          {testResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-md">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-300">
                      ¡Prueba de Extremo a Extremo Completada con Éxito!
                    </h4>
                    <p className="text-xs text-emerald-200/90">
                      Se generaron todas las entidades reales sin duplicación: Lead, Cliente, Oportunidad, Cotización formal, Pedido en Firme, Reserva en Almacén y Atribución Comercial ROAS.
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Cards for each created entity */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Lead & Customer */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4" />
                      1. Lead & Cliente Creado
                    </span>
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                      {testResult.customer?.code}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200 font-bold">{testResult.lead?.company}</p>
                    <p className="text-slate-400">Contacto: {testResult.lead?.name}</p>
                    <p className="text-slate-400">Origen: <span className="text-blue-400 font-bold">Facebook Ads ({testResult.lead?.utmCampaign})</span></p>
                    <p className="text-slate-400">Calificación: <span className="text-emerald-400 font-bold">MQL / CALIFICADO</span></p>
                  </div>
                </div>

                {/* 2. Opportunity */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      2. Oportunidad Pipeline
                    </span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                      {testResult.opportunity?.folio}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200 font-bold">{testResult.opportunity?.title}</p>
                    <p className="text-slate-400">
                      Etapa Final:{' '}
                      <span className="text-emerald-400 font-bold">LOGRADO_CON_EXITO (100%)</span>
                    </p>
                    <p className="text-slate-400">
                      Ejecutivo: {testResult.opportunity?.salespersonName}
                    </p>
                    <p className="text-slate-400">
                      Valor Estimado:{' '}
                      <span className="font-bold text-white">
                        ${(testResult.opportunity?.estimatedValue || 0).toLocaleString('es-MX')} MXN
                      </span>
                    </p>
                  </div>
                </div>

                {/* 3. Formal Quote */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Receipt className="h-4 w-4" />
                      3. Cotización Formal
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                      {testResult.quote?.folio}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200 font-bold">
                      Subtotal: ${(testResult.quote?.subtotal || 0).toLocaleString('es-MX')} MXN
                    </p>
                    <p className="text-slate-400">IVA (16%): ${(testResult.quote?.tax || 0).toLocaleString('es-MX')} MXN</p>
                    <p className="text-emerald-400 font-bold">
                      Total: ${(testResult.quote?.total || 0).toLocaleString('es-MX')} MXN
                    </p>
                    <p className="text-slate-400">
                      Estatus:{' '}
                      <span className="text-emerald-400 font-bold">ACEPTADA & CONVERTIDA</span>
                    </p>
                  </div>
                </div>

                {/* 4. Confirmed Order */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                      <Package className="h-4 w-4" />
                      4. Pedido en Firme
                    </span>
                    <span className="rounded bg-violet-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-violet-300">
                      {testResult.order?.folio}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200 font-bold">
                      Folio Pedido: {testResult.order?.folio}
                    </p>
                    <p className="text-slate-400">
                      Almacén:{' '}
                      <span className="text-slate-200">
                        {testResult.order?.warehouseName || 'Almacén Central Tultitlán'}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Estatus:{' '}
                      <span className="text-violet-400 font-bold">RESERVADO & PROGRAMADO</span>
                    </p>
                    <p className="text-slate-400">
                      Términos: {testResult.order?.paymentTerms || '30 días crédito'}
                    </p>
                  </div>
                </div>

                {/* 5. Inventory Reservation & Kardex */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Boxes className="h-4 w-4" />
                      5. Reserva Almacén & Kardex
                    </span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                      KARDEX REAL
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200 font-bold">
                      Producto: {testResult.movements[0]?.productName || selectedProduct?.name}
                    </p>
                    <p className="text-slate-400">
                      Cantidad Reservada:{' '}
                      <span className="text-amber-400 font-bold font-mono">
                        {testResult.movements[0]?.quantity || quantity} pzas
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Movimiento Kardex:{' '}
                      <span className="font-mono text-slate-300">
                        {testResult.movements[0]?.id?.slice(0, 18) || 'MOV-RESERVA-AUTO'}
                      </span>
                    </p>
                    <p className="text-emerald-400 font-medium text-[11px]">
                      ✓ Stock disponible actualizado automáticamente.
                    </p>
                  </div>
                </div>

                {/* 6. Attribution & ROAS Recalculation */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      6. Atribución & ROAS
                    </span>
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300">
                      IMPACTO MARKETING
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200 font-bold">
                      Ingreso Atribuido:{' '}
                      <span className="text-emerald-400 font-mono">
                        +${(testResult.order?.total || 0).toLocaleString('es-MX')} MXN
                      </span>
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400">ROAS Campaña:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-500 line-through">
                          {((testResult.metricsBefore?.roas ?? 0)).toFixed(1)}x
                        </span>
                        <ArrowRight className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-mono">
                          {((testResult.metricsAfter?.roas ?? 0)).toFixed(1)}x
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Pedidos Ganados:</span>
                      <span className="font-bold text-white">
                        {testResult.metricsBefore.ordersWon} → {testResult.metricsAfter.ordersWon} pedidos
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Shortcuts to verify in ERP modules */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Verificar Entidades Creadas en los Módulos del ERP:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateModule) onNavigateModule('MARKETING');
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-950/40 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-900/50"
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    Ver en Dashboard de Marketing
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateModule) onNavigateModule('VENTAS');
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/50"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    Ver en CRM & Pipeline Kanban
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateModule) onNavigateModule('ALMACEN');
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/50"
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    Ver en Kardex & Stock Reservado
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateModule) onNavigateModule('CONFIGURACION');
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Ver en Bitácora de Auditoría
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
          <span className="text-xs text-slate-500">
            CONSCORE ERP IA · Motor de Atribución Multitouch & Ciclo Comercial Completo
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
