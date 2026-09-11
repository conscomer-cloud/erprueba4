import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Ban,
  RefreshCw,
  Loader2,
  ShieldAlert,
  FlaskConical,
} from 'lucide-react';

interface ValidationIssue {
  scope: 'EMISOR' | 'CLIENTE' | 'PEDIDO' | 'PRODUCTO' | 'CONFIGURACION';
  entityId?: string;
  entityName?: string;
  field: string;
  message: string;
}

interface StampPreview {
  canStamp: boolean;
  issues: ValidationIssue[];
  draft: {
    series: string;
    currency: string;
    recipient: { tin: string; legalName: string; taxRegimeCode: string; cfdiUseCode: string; zipCode: string };
    items: { description: string; quantity: number; unitPrice: number; amount: number; vatRate: number }[];
    subtotal: number;
    vat: number;
    total: number;
  } | null;
}

interface CfdiRecord {
  id: string;
  uuid: string;
  series: string;
  number: string;
  total: number;
  currency: string;
  status: 'TIMBRADO' | 'CANCELADO' | 'ERROR';
  stampedAt: string;
  stampedByUserName: string;
  environment: 'PRUEBAS' | 'PRODUCCION';
  cancelledAt?: string;
}

const ETIQUETA_AMBITO: Record<ValidationIssue['scope'], string> = {
  CONFIGURACION: 'Configuración',
  EMISOR: 'Datos del emisor',
  CLIENTE: 'Cliente',
  PRODUCTO: 'Catálogo de productos',
  PEDIDO: 'Pedido',
};

const MOTIVOS_CANCELACION = [
  { code: '01', label: '01 — Comprobante emitido con errores, con relación' },
  { code: '02', label: '02 — Comprobante emitido con errores, sin relación' },
  { code: '03', label: '03 — No se llevó a cabo la operación' },
  { code: '04', label: '04 — Operación nominativa en factura global' },
];

const money = (n: number, c = 'MXN') =>
  `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}` });

/**
 * Panel de facturación de un pedido.
 *
 * El botón de timbrar solo aparece cuando la revisión previa pasa. Timbrar con
 * datos incompletos gasta un timbre y obliga a cancelar el CFDI, así que el
 * panel gasta el espacio en decir qué falta antes que en facilitar el envío.
 */
export const OrderInvoicingPanel: React.FC<{ orderId: string; orderFolio?: string }> = ({ orderId, orderFolio }) => {
  const [preview, setPreview] = useState<StampPreview | null>(null);
  const [cfdi, setCfdi] = useState<CfdiRecord[]>([]);
  const [config, setConfig] = useState<{ configured: boolean; environment: string } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [timbrando, setTimbrando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('02');
  const [uuidSustituto, setUuidSustituto] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const [c, p, l] = await Promise.all([
        fetch('/api/invoicing/status', { headers: auth() }).then((r) => r.json()),
        fetch(`/api/invoicing/preview/${orderId}`, { headers: auth() }).then((r) => r.json()),
        fetch(`/api/invoicing/cfdi?orderId=${orderId}`, { headers: auth() }).then((r) => r.json()),
      ]);
      setConfig(c);
      setPreview(p);
      setCfdi(Array.isArray(l) ? l : []);
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo consultar el estado de facturación.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const timbrar = async () => {
    if (timbrando) return;
    setTimbrando(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/invoicing/stamp/${orderId}`, { method: 'POST', headers: auth() });
      const body = await res.json();
      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: body.error || 'No se pudo timbrar.' });
        if (body.issues) setPreview((p) => (p ? { ...p, canStamp: false, issues: body.issues } : p));
        return;
      }
      setMensaje({ tipo: 'ok', texto: `CFDI timbrado. Folio fiscal ${body.uuid}` });
      await cargar();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err?.message || 'Error de conexión.' });
    } finally {
      setTimbrando(false);
    }
  };

  const descargar = async (id: string, kind: 'pdf' | 'xml') => {
    try {
      const res = await fetch(`/api/invoicing/file/${id}/${kind}`, { headers: auth() });
      const body = await res.json();
      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: body.error || `No se pudo obtener el ${kind.toUpperCase()}.` });
        return;
      }
      const bin = atob(body.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(
        new Blob([bytes], { type: kind === 'pdf' ? 'application/pdf' : 'application/xml' })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = body.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err?.message || 'Error al descargar.' });
    }
  };

  const cancelar = async (id: string) => {
    try {
      const res = await fetch(`/api/invoicing/cancel/${id}`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ motiveCode: motivo, replacementUuid: uuidSustituto || undefined }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: body.error || 'No se pudo cancelar.' });
        return;
      }
      setMensaje({ tipo: 'ok', texto: 'CFDI cancelado ante el SAT.' });
      setCancelando(null);
      setUuidSustituto('');
      await cargar();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err?.message || 'Error de conexión.' });
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Revisando el pedido...</span>
      </div>
    );
  }

  const porAmbito = (preview?.issues || []).reduce((acc, i) => {
    (acc[i.scope] ||= []).push(i);
    return acc;
  }, {} as Record<string, ValidationIssue[]>);

  const vigente = cfdi.find((c) => c.status === 'TIMBRADO');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <FileCheck2 className="h-4 w-4 text-blue-600" />
        <h3 className="text-xs font-bold text-slate-900">
          Facturación CFDI {orderFolio ? `· ${orderFolio}` : ''}
        </h3>

        {config?.environment === 'PRUEBAS' && (
          <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <FlaskConical className="h-3 w-3" />
            Ambiente de pruebas
          </span>
        )}

        <button
          onClick={cargar}
          className="no-print ml-auto flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          Revisar
        </button>
      </div>

      {mensaje && (
        <div
          className={`rounded-xl border p-3.5 text-xs ${
            mensaje.tipo === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {!config?.configured && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-[11px] leading-relaxed text-amber-800">
            <b>FiscalAPI no está configurado.</b> Define <code>FISCALAPI_KEY</code> y{' '}
            <code>FISCALAPI_TENANT</code> en las variables de entorno, y sube el certificado de
            sello digital en el panel de FiscalAPI. Sin eso no es posible timbrar.
          </div>
        </div>
      )}

      {/* CFDI ya emitidos */}
      {cfdi.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Comprobantes emitidos</h4>
          </div>
          <div className="divide-y divide-slate-100">
            {cfdi.map((c) => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      c.status === 'TIMBRADO'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.status}
                  </span>
                  <span className="font-mono text-[11px] text-slate-700">{c.uuid}</span>
                  <span className="text-[11px] text-slate-500">
                    {c.series}-{c.number} · {money(c.total, c.currency)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.stampedAt).toLocaleString('es-MX')} · {c.stampedByUserName}
                  </span>

                  <div className="no-print ml-auto flex gap-2">
                    <button
                      onClick={() => descargar(c.id, 'pdf')}
                      className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </button>
                    <button
                      onClick={() => descargar(c.id, 'xml')}
                      className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      XML
                    </button>
                    {c.status === 'TIMBRADO' && (
                      <button
                        onClick={() => setCancelando(cancelando === c.id ? null : c.id)}
                        className="flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Ban className="h-3 w-3" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {cancelando === c.id && (
                  <div className="no-print mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="mb-2 text-[11px] leading-relaxed text-red-800">
                      La cancelación es un trámite ante el SAT y no siempre es inmediata: si el
                      receptor debe aprobarla, el comprobante queda en proceso hasta que responda.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        className="rounded-lg border border-red-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-800 cursor-pointer"
                      >
                        {MOTIVOS_CANCELACION.map((m) => (
                          <option key={m.code} value={m.code}>
                            {m.label}
                          </option>
                        ))}
                      </select>

                      {motivo === '01' && (
                        <input
                          value={uuidSustituto}
                          onChange={(e) => setUuidSustituto(e.target.value)}
                          placeholder="Folio fiscal que lo sustituye"
                          className="w-72 rounded-lg border border-red-300 px-2 py-1.5 font-mono text-[11px]"
                        />
                      )}

                      <button
                        onClick={() => cancelar(c.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 cursor-pointer"
                      >
                        Confirmar cancelación
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revisión previa */}
      {!vigente && preview && (
        <>
          {preview.canStamp ? (
            <div className="rounded-xl border border-emerald-200 bg-white shadow-2xs">
              <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">El pedido cumple los requisitos</span>
              </div>

              {preview.draft && (
                <div className="px-4 py-3">
                  <div className="mb-3 grid gap-x-6 gap-y-1 text-[11px] sm:grid-cols-2">
                    <span className="text-slate-600">
                      Receptor <b className="text-slate-900">{preview.draft.recipient.legalName}</b>
                    </span>
                    <span className="text-slate-600">
                      RFC <b className="font-mono text-slate-900">{preview.draft.recipient.tin}</b>
                    </span>
                    <span className="text-slate-600">
                      Régimen <b className="text-slate-900">{preview.draft.recipient.taxRegimeCode}</b>
                    </span>
                    <span className="text-slate-600">
                      Uso CFDI <b className="text-slate-900">{preview.draft.recipient.cfdiUseCode}</b>
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 text-right text-[11px]">
                    <div className="text-slate-600">Subtotal {money(preview.draft.subtotal, preview.draft.currency)}</div>
                    <div className="text-slate-600">IVA {money(preview.draft.vat, preview.draft.currency)}</div>
                    <div className="mt-0.5 text-sm font-bold text-slate-900">
                      Total {money(preview.draft.total, preview.draft.currency)}
                    </div>
                  </div>

                  <button
                    onClick={timbrar}
                    disabled={timbrando || !config?.configured}
                    className="no-print mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {timbrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                    {timbrando ? 'Timbrando ante el SAT...' : 'Timbrar CFDI'}
                  </button>

                  <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-500">
                    El timbrado consume un timbre y genera un comprobante fiscal.
                    {config?.environment === 'PRODUCCION'
                      ? ' Estás en producción: el CFDI tendrá efectos reales ante el SAT.'
                      : ' Estás en pruebas: el comprobante no tiene validez fiscal.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-white shadow-2xs">
              <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-900">
                  Faltan datos para facturar ({preview.issues.length})
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {(Object.entries(porAmbito) as [string, ValidationIssue[]][]).map(([scope, lista]) => (
                  <div key={scope} className="px-4 py-3">
                    <h5 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {ETIQUETA_AMBITO[scope as ValidationIssue['scope']] || scope}
                    </h5>
                    <ul className="space-y-1">
                      {lista.map((i, idx) => (
                        <li key={idx} className="flex gap-2 text-[11px] leading-relaxed text-slate-700">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          <span>
                            {i.entityName && <b className="text-slate-900">{i.entityName}: </b>}
                            {i.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                <p className="text-[10px] leading-relaxed text-slate-500">
                  El botón de timbrar aparece cuando no queda ningún faltante. Emitir un CFDI con
                  datos incorrectos consume el timbre igual y obliga a cancelarlo, así que conviene
                  corregir el catálogo antes de intentarlo.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
