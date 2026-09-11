import React, { useEffect } from 'react';
import { Route, RouteStop } from '../../types/erp';
import { X, Printer, Truck, ShieldCheck, User, Calendar, MapPin, Package, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';

interface LoadingSheetPrintModalProps {
  route: Route;
  onClose: () => void;
}

export const LoadingSheetPrintModal: React.FC<LoadingSheetPrintModalProps> = ({ route, onClose }) => {
  // ESC key listener with proper cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Scroll lock and restoration
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const checklist = route.departureChecklist;

  return (
    <div
      id="shipping-sheet-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Hoja de Envío"
    >
      <div
        id="shipping-sheet-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-0 my-8 pointer-events-auto"
      >
        {/* Modal Top Controls - Hidden when printing */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hoja de Envío & Manifiesto de Carga</h2>
              <p className="text-xs text-slate-500">Documento oficial de despacho, trazabilidad y control en ruta</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-print-shipping-sheet-top"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir Hoja de Envío
            </button>
            <button
              type="button"
              id="btn-close-shipping-sheet-top"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cerrar
            </button>
            <button
              type="button"
              id="btn-close-x"
              onClick={onClose}
              aria-label="Cerrar Hoja de Envío"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="text-slate-900 print:text-black">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-900 px-2.5 py-1 text-sm font-black tracking-wider text-white">
                  CONSCORE
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Aislamientos Térmicos y Acústicos
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-2">
                HOJA DE ENVÍO Y CONTROL DE RUTA
              </h1>
              <p className="text-xs text-slate-600">
                Almacén de Origen: <b>{route.warehouseName}</b>
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase font-semibold text-slate-500">Folio de Ruta / Guía</div>
              <div className="text-xl font-black font-mono text-blue-700 print:text-black">{route.routeNumber}</div>
              <div className="text-xs text-slate-600 mt-1">Fecha Programada: <b>{route.date}</b></div>
              <div className="text-xs text-slate-500">Zona: <b>{route.zone || 'Metropolitana'}</b></div>
            </div>
          </div>

          {/* Transportation Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 print:bg-white print:border-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Unidad de Transporte</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{route.vehicleName}</p>
              <span className="text-[11px] font-mono text-slate-600">Placas: {route.vehiclePlate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Operador / Chofer</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{route.driverName}</p>
              <span className="text-[11px] text-slate-600">Tel: {route.driverPhone}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Carga Total Estimada</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {(Number(route.totalWeightKg) || 0).toLocaleString('es-MX')} kg | {route.totalVolumeM3} m³
              </p>
              <span className="text-[11px] text-slate-600">{route.totalOrders} Pedidos ({route.totalItems} unidades)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Horario Salida / Duración</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{route.departureTime || 'Pendiente salida'}</p>
              <span className="text-[11px] text-slate-600">Est. {route.estimatedDuration} (~{route.estimatedDistanceKm} km)</span>
            </div>
          </div>

          {/* Stops & Orders Sequence Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span>Secuencia de Entrega Programada (Paradas)</span>
              <span className="text-[11px] font-normal text-slate-500">Orden LIFO de Estiba Recomendada</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Pedido / MTX</th>
                    <th className="py-2.5 px-3">Cliente / Destinatario</th>
                    <th className="py-2.5 px-3">Dirección de Destino</th>
                    <th className="py-2.5 px-3 text-center">Ventana</th>
                    <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                    <th className="py-2.5 px-3 text-center">Firma Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {route.stops.map((stop, idx) => (
                    <React.Fragment key={stop.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-50 font-mono">
                          {stop.orderIndex || idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-blue-700 block">{stop.orderNumber}</span>
                          <span className="text-[9px] text-slate-400 block">MTX: {`MTX-${stop.orderNumber?.replace(/[^a-zA-Z0-9]/g, '') || stop.orderId}`}</span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{stop.customerName}</p>
                          <p className="text-[10px] text-slate-500">Contacto: {stop.contactName} ({stop.phone})</p>
                        </td>
                        <td className="py-3 px-3 max-w-[220px]">
                          <p className="text-[11px] text-slate-700 leading-snug">{stop.deliveryAddress}</p>
                          <p className="text-[10px] text-slate-400">{stop.city}, {stop.state}</p>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                          {stop.scheduledTime}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {(Number(stop.totalWeightKg) || 0).toLocaleString('es-MX')}
                        </td>
                        <td className="py-3 px-3 text-center w-36">
                          <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                            <span className="text-[9px] text-slate-400">Firma y Sello</span>
                          </div>
                        </td>
                      </tr>
                      {/* Sub-items for verification */}
                      <tr className="bg-slate-50/60 print:bg-white text-[10px] text-slate-600">
                        <td colSpan={7} className="px-6 py-1.5 border-b border-slate-100">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="font-semibold text-slate-700">Partidas a Entregar:</span>
                            {stop.items.map((itm, i) => (
                              <span key={i} className="inline-flex items-center gap-1">
                                • [<b>{itm.quantityShipped} {itm.unit}</b>] {itm.productName} ({itm.productCode})
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Checklist Verification Summary */}
          {checklist && (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 mb-6 text-xs print:bg-white">
              <span className="font-bold text-slate-800 uppercase text-[10px] block mb-1">
                Checklist de Liberación de Andén (Aprobado)
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Remisiones & Cartas Porte
                </span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Amarrado y Sujeción de Carga
                </span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Equipo EPP y Extintor
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                Liberado por: <b>{checklist.releasedByName || 'Jefe de Embarques'}</b> a las <b>{checklist.releasedAt}</b>
              </div>
            </div>
          )}

          {/* Signature Block */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-300 text-center">
            <div>
              <div className="h-14 border-b border-slate-400 mb-1"></div>
              <p className="text-xs font-bold text-slate-900">{route.driverName}</p>
              <p className="text-[10px] text-slate-500 uppercase">Firma Chofer / Operador</p>
            </div>
            <div>
              <div className="h-14 border-b border-slate-400 mb-1"></div>
              <p className="text-xs font-bold text-slate-900">{route.createdByName || 'Coordinador de Logística'}</p>
              <p className="text-[10px] text-slate-500 uppercase">Supervisor de Embarques</p>
            </div>
            <div>
              <div className="h-14 border-b border-slate-400 mb-1"></div>
              <p className="text-xs font-bold text-slate-900">Vigilancia / Salida Andén</p>
              <p className="text-[10px] text-slate-500 uppercase">Sello y Hora de Salida</p>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            CONSCORE ERP IA · Documento generado automáticamente para cumplimiento de trazabilidad logística y Carta Porte.
          </div>
        </div>

        {/* Modal Bottom Controls - Hidden when printing */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6 print:hidden">
          <div className="text-xs text-slate-500">
            Vista de solo lectura · Folio: <span className="font-mono font-bold text-slate-700">{route.routeNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-close-shipping-sheet"
              data-testid="btn-close-shipping-sheet"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cerrar
            </button>
            <button
              type="button"
              id="btn-print-shipping-sheet-bottom"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
