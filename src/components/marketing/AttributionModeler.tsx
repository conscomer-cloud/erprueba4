import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Info,
  TrendingUp,
  ArrowRight,
  PieChart,
  BarChart3,
  Calendar,
  CheckCircle2,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { AttributionModel } from '../../types/erp';

export const AttributionModeler: React.FC = () => {
  const {
    marketingCampaigns,
    touchpoints,
    selectedAttributionModel,
    setSelectedAttributionModel,
    getCampaignAttribution,
    customers,
  } = useERP();

  const [activeModel, setActiveModel] = useState<AttributionModel>(selectedAttributionModel);

  const handleModelChange = (model: AttributionModel) => {
    setActiveModel(model);
    setSelectedAttributionModel(model);
  };

  const attributionResults = getCampaignAttribution(activeModel);

  const fmtCurrency = (val: number) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const MODEL_DEFINITIONS: Record<
    AttributionModel,
    { name: string; tag: string; description: string; bestFor: string; logic: string }
  > = {
    FIRST_TOUCH: {
      name: 'Primer Toque (First Touch)',
      tag: 'Adquisición Inicial',
      description: 'Asigna el 100% del valor y crédito de la conversión al primer canal o campaña que originó al prospecto.',
      bestFor: 'Evaluar canales de atracción temprana (Branding, SEO, Google Ads genérico).',
      logic: '100% al primer punto de contacto.',
    },
    LAST_TOUCH: {
      name: 'Último Toque (Last Touch)',
      tag: 'Cierre Comercial',
      description: 'Asigna el 100% del crédito al último punto de contacto inmediatamente previo a la solicitud de cotización u orden de compra.',
      bestFor: 'Analizar canales de conversión final y decisión (Retargeting, Ferias Industriales, Demos).',
      logic: '100% al último punto de contacto.',
    },
    LINEAR: {
      name: 'Lineal Uniforme (Linear)',
      tag: 'Distribución Equitativa',
      description: 'Divide el crédito de la venta en partes iguales entre todos los puntos de contacto registrados en el customer journey.',
      bestFor: 'Procesos de venta B2B de ciclo largo donde todos los esfuerzos aportan valor.',
      logic: '1 / N partes iguales por punto de contacto.',
    },
    TIME_DECAY: {
      name: 'Decaimiento en el Tiempo (Time Decay)',
      tag: 'Ponderación Temporal',
      description: 'Otorga progresivamente mayor peso a los puntos de contacto más recientes y cercanos en el tiempo a la orden de compra.',
      bestFor: 'Ciclos de venta con consideración rápida o campañas estacionales.',
      logic: 'Ponderación exponencial creciente hacia el momento del cierre.',
    },
    POSITION_BASED: {
      name: 'Basado en Posición (U-Shaped 40-20-40)',
      tag: 'Modelo Híbrido U-Shaped',
      description: 'Asigna 40% al primer toque (descubrimiento), 40% al último toque (conversión) y 20% distribuido entre los toques intermedios de nutrición.',
      bestFor: 'Modelo recomendado para ventas B2B industriales de aislamiento térmico.',
      logic: '40% Primer Toque + 40% Cierre + 20% Nutrición intermedia.',
    },
    DATA_DRIVEN: {
      name: 'Algorítmico / Data-Driven (CONSCORE AI)',
      tag: 'Inteligencia Predictiva',
      description: 'Calcula pesos dinámicos basándose en el historial de engagement, valor del pedido y probabilidad predictiva de cierre de la oportunidad.',
      bestFor: 'Máxima precisión analítica con múltiples canales cruzados.',
      logic: 'Ponderación probabilística por impacto real en la conversión.',
    },
  };

  const currentDef = MODEL_DEFINITIONS[activeModel];

  return (
    <div className="space-y-6">
      {/* Header & Model Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Motor de Atribución Comercial Multitouch</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simula y compara cómo se distribuyen las ventas generadas según el modelo de atribución seleccionado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Modelo Activo:</span>
            <select
              value={activeModel}
              onChange={e => handleModelChange(e.target.value as AttributionModel)}
              className="rounded-lg border border-blue-300 bg-blue-50/70 py-1.5 px-3 text-xs font-bold text-blue-900 focus:border-blue-500 focus:outline-hidden"
            >
              {Object.entries(MODEL_DEFINITIONS).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Model Explanation Card */}
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase mb-1">
                {currentDef.tag}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{currentDef.name}</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">{currentDef.description}</p>
            </div>
            <div className="rounded-md border border-blue-200 bg-white px-3 py-2 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fórmula de Reparto</span>
              <span className="text-xs font-mono font-bold text-blue-700">{currentDef.logic}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Quick Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(MODEL_DEFINITIONS) as AttributionModel[]).map(key => {
          const def = MODEL_DEFINITIONS[key];
          const isSelected = activeModel === key;
          return (
            <button
              key={key}
              onClick={() => handleModelChange(key)}
              className={`rounded-xl border p-3 text-left transition ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {def.tag}
              </div>
              <div className="text-xs font-bold mt-1 line-clamp-1">{def.name.split(' (')[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Attribution Results Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribución de Ingresos y Ponderación Atribuida por Campaña
            </h3>
            <p className="text-xs text-slate-500">
              Cálculo ejecutado bajo el modelo <b>{currentDef.name}</b>
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Total Atribuido: {fmtCurrency(attributionResults.reduce((a, b) => a + b.attributedRevenue, 0))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-3">Canal</th>
                <th className="py-3 px-3 text-right">Peso Atribuido (%)</th>
                <th className="py-3 px-4 text-right">Venta Atribuida ($MXN)</th>
                <th className="py-3 px-3 text-right">Órdenes Estimadas</th>
                <th className="py-3 px-4">Distribución Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attributionResults.map(res => (
                <tr key={res.campaignId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{res.campaignCode}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[240px] truncate" title={res.campaignName}>
                    {res.campaignName}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-700">{res.channelName}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-blue-800">
                    {res.attributedWeight.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
                    {fmtCurrency(res.attributedRevenue)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-purple-700">
                    {res.attributedOrdersCount}
                  </td>
                  <td className="py-3.5 px-4 w-48">
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(2, res.attributedWeight))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Journey Touchpoint Demonstration */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Ejemplo de Customer Journey Multicanal B2B (Línea de Vida Comercial)
          </h3>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold text-slate-700 mb-3">
            Caso: <span className="font-bold text-blue-900">Termoaislantes y Climas Industriales del Norte S.A.</span> (Valor de Cuenta: $1,840,000 MXN)
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between relative">
            {/* Step 1 */}
            <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Toque 1: Descubrimiento</span>
                <span className="text-blue-600 font-mono">2026-01-20</span>
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900">Google Ads Search</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Búsqueda: "lana mineral monterrey"</p>
              <div className="mt-2 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                Primer Toque (100% en First-Touch)
              </div>
            </div>

            <div className="hidden md:flex items-center text-slate-300">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Toque 2: Nutrición</span>
                <span className="text-blue-600 font-mono">2026-03-14</span>
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900">LinkedIn Ads B2B</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Descarga de Ficha Técnica Cañuela</p>
              <div className="mt-2 text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                Interacción Intermedia (20% en U-Shape)
              </div>
            </div>

            <div className="hidden md:flex items-center text-slate-300">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Toque 3: Cierre & Venta</span>
                <span className="text-blue-600 font-mono">2026-05-18</span>
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900">Expo Cihac / Stand Directo</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Reunión con Arq. Mariana Ruiz</p>
              <div className="mt-2 text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded inline-block">
                Último Toque (100% en Last-Touch)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
