import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Gauge, Info, AlertTriangle, RefreshCw } from 'lucide-react';

interface EvaluatedItem {
  productCode: string;
  predicted: number;
  actual: number;
  errorPct: number | null;
  biasPct: number | null;
}

interface EvaluatedForecast {
  targetMonth: string;
  targetLabel: string;
  origin: 'GUARDADO' | 'RETROSPECTIVO';
  items: EvaluatedItem[];
  mape: number | null;
  bias: number | null;
  evaluableCount: number;
}

interface HistoryResult {
  entries: EvaluatedForecast[];
  savedCount: number;
  backtestCount: number;
  summary: { mape: number | null; bias: number | null; hitRate: number | null; monthsEvaluated: number };
}

/**
 * Índice de precisión del modelo.
 *
 * El índice sale de la desviación estándar de los errores de predicción, no del
 * error promedio. Son cosas distintas y la diferencia importa: un modelo que se
 * equivoca 30 por ciento en todas las predicciones es corregible con un factor;
 * uno que acierta a veces y falla 80 por ciento otras no lo es, aunque su
 * promedio sea el mismo. La dispersión mide justamente esa inconsistencia.
 *
 *   índice = 100 - min(desviación estándar del error, 100)
 *
 * El velocímetro se dibuja con D3 sobre SVG: arcos, escala angular y aguja.
 */
export const ModelAccuracyGauge: React.FC = () => {
  const [data, setData] = useState<HistoryResult | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/predictive/forecast-history?monthsBack=6&topN=5', {
        headers: { Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setData(await res.json());
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el historial.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const metricas = useMemo(() => {
    if (!data) return null;

    // Se juntan todos los errores individuales de todos los meses. Promediar
    // primero por mes y luego entre meses escondería la dispersión real.
    const errores: number[] = [];
    data.entries.forEach((e) =>
      e.items.forEach((i) => {
        if (i.biasPct !== null && Number.isFinite(i.biasPct)) errores.push(i.biasPct);
      })
    );

    if (errores.length < 2) return { suficiente: false, muestras: errores.length } as const;

    const media = d3.mean(errores) as number;
    const desviacion = d3.deviation(errores) as number;
    const indice = Math.max(0, Math.round(100 - Math.min(desviacion, 100)));

    return {
      suficiente: true,
      muestras: errores.length,
      indice,
      desviacion: Math.round(desviacion),
      sesgoMedio: Math.round(media),
      mape: data.summary.mape,
      meses: data.summary.monthsEvaluated,
      soloRetrospectivo: data.savedCount === 0,
    } as const;
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !metricas?.suficiente) return;

    const ancho = 300;
    const alto = 185;
    const radio = 115;
    const cx = ancho / 2;
    const cy = alto - 28;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${ancho} ${alto}`).attr('width', '100%').attr('height', alto);

    // Semicírculo: de -90 a +90 grados en radianes
    const anguloMin = -Math.PI / 2;
    const anguloMax = Math.PI / 2;
    const escala = d3.scaleLinear().domain([0, 100]).range([anguloMin, anguloMax]).clamp(true);

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    // Bandas de referencia. Los cortes no son arbitrarios: por debajo de 50 la
    // dispersión supera los 50 puntos porcentuales y el pronóstico deja de
    // servir para comprar.
    const bandas = [
      { desde: 0, hasta: 50, color: 'var(--color-red-500)', etiqueta: 'No confiable' },
      { desde: 50, hasta: 75, color: 'var(--color-yellow-400)', etiqueta: 'Orientativo' },
      { desde: 75, hasta: 100, color: 'var(--color-emerald-600)', etiqueta: 'Confiable' },
    ];

    const arco = d3
      .arc<any>()
      .innerRadius(radio - 22)
      .outerRadius(radio)
      .cornerRadius(2);

    g.selectAll('path.banda')
      .data(bandas)
      .enter()
      .append('path')
      .attr('class', 'banda')
      .attr('fill', (d) => d.color)
      .attr('opacity', 0.9)
      .attr('d', (d) =>
        arco({ startAngle: escala(d.desde), endAngle: escala(d.hasta) } as any) as string
      );

    // Marcas cada 25 puntos
    [0, 25, 50, 75, 100].forEach((v) => {
      const a = escala(v) - Math.PI / 2;
      const r1 = radio + 3;
      const r2 = radio + 9;
      g.append('line')
        .attr('x1', Math.cos(a) * r1)
        .attr('y1', Math.sin(a) * r1)
        .attr('x2', Math.cos(a) * r2)
        .attr('y2', Math.sin(a) * r2)
        .attr('stroke', 'var(--color-slate-300)')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', Math.cos(a) * (radio + 18))
        .attr('y', Math.sin(a) * (radio + 18))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 9)
        .attr('fill', 'var(--color-slate-400)')
        .text(v);
    });

    // Aguja. Arranca en cero y se anima hasta el valor: el movimiento deja ver
    // en qué banda cae sin tener que leer el número.
    const aguja = g
      .append('g')
      .attr('transform', `rotate(${(escala(0) * 180) / Math.PI})`);

    aguja
      .append('path')
      .attr('d', `M -4 0 L 0 ${-(radio - 30)} L 4 0 Z`)
      .attr('fill', 'var(--color-slate-800)');

    aguja.append('circle').attr('r', 7).attr('fill', 'var(--color-slate-800)');

    aguja
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attrTween('transform', () => {
        const i = d3.interpolate(escala(0), escala(metricas.indice));
        return (t: number) => `rotate(${(i(t) * 180) / Math.PI})`;
      });

    // Valor central
    g.append('text')
      .attr('y', -34)
      .attr('text-anchor', 'middle')
      .attr('font-size', 30)
      .attr('font-weight', 700)
      .attr('fill', 'var(--color-slate-900)')
      .text(metricas.indice);

    g.append('text')
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', 'var(--color-slate-500)')
      .text('de 100');
  }, [metricas]);

  const lectura = (() => {
    if (!metricas?.suficiente) return '';
    const { indice, desviacion, sesgoMedio } = metricas;
    const partes: string[] = [];

    if (indice >= 75) {
      partes.push(`Los errores se agrupan dentro de ±${desviacion} por ciento, así que la proyección es estable entre materiales.`);
    } else if (indice >= 50) {
      partes.push(`Los errores se dispersan ±${desviacion} por ciento. El pronóstico orienta la tendencia pero no la cantidad.`);
    } else {
      partes.push(`Los errores se dispersan ±${desviacion} por ciento: demasiado para comprar con base en la cifra. En demanda por proyecto esto es esperable cuando una obra concentra el volumen.`);
    }

    if (Math.abs(sesgoMedio) >= 15) {
      partes.push(
        sesgoMedio > 0
          ? `Además el modelo proyecta de más en promedio (+${sesgoMedio} por ciento), lo que lleva a inventario ocioso.`
          : `Además el modelo proyecta de menos en promedio (${sesgoMedio} por ciento), que es el sesgo que produce desabasto.`
      );
    }

    return partes.join(' ');
  })();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Gauge className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900">Índice de precisión del modelo</h3>
        <button
          onClick={cargar}
          className="no-print ml-auto flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
          <span className="text-[11px] text-red-800">{error}</span>
        </div>
      )}

      {!error && metricas && !metricas.suficiente && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <p className="text-[11px] leading-relaxed text-slate-600">
            Se necesitan al menos dos predicciones con demanda real para medir la dispersión.
            Hoy hay {metricas.muestras}. La desviación estándar de una sola muestra no existe,
            y calcularla con dos apenas es indicativo.
          </p>
        </div>
      )}

      {!error && metricas?.suficiente && (
        <>
          <div className="flex justify-center">
            <svg ref={svgRef} role="img" aria-label={`Índice de precisión: ${metricas.indice} de 100`} />
          </div>

          <div className="mt-1 flex justify-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-red-500" /> No confiable</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-yellow-400" /> Orientativo</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs bg-emerald-600" /> Confiable</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desviación</div>
              <div className="font-mono text-base font-bold text-slate-900">±{metricas.desviacion}%</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Error medio</div>
              <div className="font-mono text-base font-bold text-slate-900">
                {metricas.mape !== null ? `${metricas.mape}%` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Muestras</div>
              <div className="font-mono text-base font-bold text-slate-900">{metricas.muestras}</div>
            </div>
          </div>

          <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-700">
            {lectura}
          </p>

          {metricas.soloRetrospectivo && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800">
              El índice se calcula sobre reconstrucciones, no sobre pronósticos que el sistema
              haya emitido y guardado. Mide al modelo, no al historial de aciertos.
            </p>
          )}
        </>
      )}
    </div>
  );
};
