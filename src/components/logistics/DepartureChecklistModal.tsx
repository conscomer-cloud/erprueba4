import React, { useState } from 'react';
import { Route, DepartureChecklist } from '../../types/erp';
import { X, CheckSquare, ShieldCheck, Truck, FileText, AlertTriangle } from 'lucide-react';

interface DepartureChecklistModalProps {
  route: Route;
  onConfirmDeparture: (checklist: DepartureChecklist) => void;
  onClose: () => void;
}

export const DepartureChecklistModal: React.FC<DepartureChecklistModalProps> = ({
  route,
  onConfirmDeparture,
  onClose,
}) => {
  const [remisionesPrinted, setRemisionesPrinted] = useState(true);
  const [materialVerified, setMaterialVerified] = useState(true);
  const [cargoStrapped, setCargoStrapped] = useState(true);
  const [vehicleInspectionOk, setVehicleInspectionOk] = useState(true);
  const [driverEquipped, setDriverEquipped] = useState(true);
  const [odometerKm, setOdometerKm] = useState<number>(142500);
  const [fuelLevel, setFuelLevel] = useState<DepartureChecklist['fuelLevel']>(100);
  const [notes, setNotes] = useState('');

  const allChecksPassed =
    remisionesPrinted &&
    materialVerified &&
    cargoStrapped &&
    vehicleInspectionOk &&
    driverEquipped;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecksPassed) {
      alert('Todos los puntos del checklist de seguridad y documentación deben ser aprobados antes de liberar la salida.');
      return;
    }

    const checklist: DepartureChecklist = {
      remisionesPrinted,
      materialVerified,
      cargoStrapped,
      vehicleInspectionOk,
      driverEquipped,
      odometerKm,
      fuelLevel,
      releasedByName: 'Jefe de Embarques & Tráfico',
      releasedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      notes: notes.trim() || undefined,
    };

    onConfirmDeparture(checklist);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Checklist de Liberación de Andén
              </h2>
              <p className="text-xs text-slate-500">
                Ruta: <b className="font-mono text-blue-700">{route.routeNumber}</b> · Unidad: <b>{route.vehiclePlate}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">Verificación obligatoria de despacho</p>
            <p className="text-[11px] text-slate-500">
              Asegúrate de que la unidad cuenta con la estiba adecuada, documentación física y condiciones mecánicas para transitar.
            </p>
          </div>

          {/* Checklist items */}
          <div className="space-y-2.5">
            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={remisionesPrinted}
                onChange={(e) => setRemisionesPrinted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">1. Documentación y Cartas Porte Impresas</span>
                <span className="text-[11px] text-slate-500">Remisiones de venta, sellos y hojas de embarque entregadas al operador.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={materialVerified}
                onChange={(e) => setMaterialVerified(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">2. Conteo Físico vs. Manifiesto</span>
                <span className="text-[11px] text-slate-500">
                  {route.totalItems} piezas verificadas en andén contra la orden de surtido.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={cargoStrapped}
                onChange={(e) => setCargoStrapped(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">3. Sujeción y Enlonado de Carga</span>
                <span className="text-[11px] text-slate-500">Matracas, bandas tensoras, esquineros protectores y lona sellada.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={vehicleInspectionOk}
                onChange={(e) => setVehicleInspectionOk(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">4. Inspección Visual de la Unidad</span>
                <span className="text-[11px] text-slate-500">Presión de neumáticos, luces, frenos, extintor vigente y botiquín.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={driverEquipped}
                onChange={(e) => setDriverEquipped(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">5. EPP Completo del Operador</span>
                <span className="text-[11px] text-slate-500">Casco, chaleco reflejante, botas de casquillo, guantes y gafete de identificación.</span>
              </div>
            </label>
          </div>

          {/* Odometer & Fuel inputs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Odómetro de Salida (km)
              </label>
              <input
                type="number"
                min="0"
                value={odometerKm}
                onChange={(e) => setOdometerKm(parseInt(e.target.value) || 0)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Nivel de Combustible
              </label>
              <select
                value={fuelLevel}
                onChange={(e) => setFuelLevel(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white"
              >
                <option value="100">100% (Lleno)</option>
                <option value="75">75% (3/4 Tanque)</option>
                <option value="50">50% (1/2 Tanque)</option>
                <option value="25">25% (1/4 Tanque)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Observaciones de Salida
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional: novedades en andén de carga..."
              className="w-full p-2 rounded-lg border border-slate-300 text-slate-900"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!allChecksPassed}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Aprobar y Despachar a Ruta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
