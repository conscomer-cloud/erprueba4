import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Vehicle, Driver } from '../../types/erp';
import {
  Truck,
  User,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  FileText,
  X
} from 'lucide-react';

export const FleetManagementTab: React.FC = () => {
  const {
    vehicles,
    drivers,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addDriver,
    updateDriver,
    deleteDriver,
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'VEHICLES' | 'DRIVERS'>('VEHICLES');

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vEconomicNumber, setVEconomicNumber] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vBrandModel, setVBrandModel] = useState('');
  const [vType, setVType] = useState<Vehicle['type']>('RABON');
  const [vCapWeight, setVCapWeight] = useState<number>(3500);
  const [vCapVolume, setVCapVolume] = useState<number>(18);
  const [vInsurancePolicy, setVInsurancePolicy] = useState('');
  const [vInsuranceExp, setVInsuranceExp] = useState('');
  const [vVerificationExp, setVVerificationExp] = useState('');
  const [vStatus, setVStatus] = useState<Vehicle['status']>('AVAILABLE');

  // Driver Modal State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [dName, setDName] = useState('');
  const [dEmployeeId, setDEmployeeId] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dLicenseNumber, setDLicenseNumber] = useState('');
  const [dLicenseType, setDLicenseType] = useState<Driver['licenseType']>('TIPO_B');
  const [dLicenseExp, setDLicenseExp] = useState('');
  const [dStatus, setDStatus] = useState<Driver['status']>('ACTIVO');

  const openNewVehicleModal = () => {
    setEditingVehicle(null);
    setVEconomicNumber(`ECO-${Math.floor(100 + Math.random() * 900)}`);
    setVPlate('');
    setVBrandModel('Isuzu ELF 400 2023');
    setVType('RABON');
    setVCapWeight(4500);
    setVCapVolume(20);
    setVInsurancePolicy('GNP-FLOTA-9988');
    setVInsuranceExp('2026-12-31');
    setVVerificationExp('2026-11-30');
    setVStatus('AVAILABLE');
    setIsVehicleModalOpen(true);
  };

  const openEditVehicleModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVEconomicNumber(veh.economicNumber);
    setVPlate(veh.plate);
    setVBrandModel(veh.brandModel);
    setVType(veh.type);
    setVCapWeight(veh.capacityWeight);
    setVCapVolume(veh.capacityVolume);
    setVInsurancePolicy(veh.insurancePolicy);
    setVInsuranceExp(veh.insuranceExpiration);
    setVVerificationExp(veh.verificationExpiration);
    setVStatus(veh.status);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vPlate.trim() || !vBrandModel.trim()) {
      alert('Completa los campos obligatorios del vehículo.');
      return;
    }

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        economicNumber: vEconomicNumber,
        plate: vPlate.toUpperCase(),
        brandModel: vBrandModel,
        type: vType,
        capacityWeight: vCapWeight,
        capacityVolume: vCapVolume,
        insurancePolicy: vInsurancePolicy,
        insuranceExpiration: vInsuranceExp,
        verificationExpiration: vVerificationExp,
        status: vStatus,
      });
    } else {
      const reading = window.prompt('Odómetro actual del vehículo (km):');
      if (reading === null || !reading.trim()) return;
      const currentOdometer = Number(reading);
      if (!Number.isFinite(currentOdometer) || currentOdometer < 0) { alert('Odómetro inválido'); return; }
      addVehicle({
        currentOdometer,
        economicNumber: vEconomicNumber,
        plate: vPlate.toUpperCase(),
        brandModel: vBrandModel,
        type: vType,
        capacityWeight: vCapWeight,
        capacityVolume: vCapVolume,
        insurancePolicy: vInsurancePolicy,
        insuranceExpiration: vInsuranceExp,
        verificationExpiration: vVerificationExp,
        status: vStatus,
      });
    }
    setIsVehicleModalOpen(false);
  };

  const openNewDriverModal = () => {
    setEditingDriver(null);
    setDName('');
    setDEmployeeId(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setDPhone('+52 55 ');
    setDLicenseNumber('FED-LIC-');
    setDLicenseType('TIPO_B');
    setDLicenseExp('2027-06-30');
    setDStatus('ACTIVO');
    setIsDriverModalOpen(true);
  };

  const openEditDriverModal = (drv: Driver) => {
    setEditingDriver(drv);
    setDName(drv.name);
    setDEmployeeId(drv.employeeId);
    setDPhone(drv.phone);
    setDLicenseNumber(drv.licenseNumber);
    setDLicenseType(drv.licenseType);
    setDLicenseExp(drv.licenseExpiration);
    setDStatus(drv.status);
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName.trim() || !dLicenseNumber.trim()) {
      alert('Completa los campos obligatorios del operador.');
      return;
    }

    if (editingDriver) {
      updateDriver(editingDriver.id, {
        name: dName,
        employeeId: dEmployeeId,
        phone: dPhone,
        licenseNumber: dLicenseNumber,
        licenseType: dLicenseType,
        licenseExpiration: dLicenseExp,
        status: dStatus,
      });
    } else {
      addDriver({
        name: dName,
        employeeId: dEmployeeId,
        phone: dPhone,
        licenseNumber: dLicenseNumber,
        licenseType: dLicenseType,
        licenseExpiration: dLicenseExp,
        status: dStatus,
      });
    }
    setIsDriverModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveSubTab('VEHICLES')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'VEHICLES'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="h-4 w-4" />
            Flota de Vehículos ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('DRIVERS')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeSubTab === 'DRIVERS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4" />
            Operadores y Choferes ({drivers.length})
          </button>
        </div>

        {activeSubTab === 'VEHICLES' ? (
          <button
            onClick={openNewVehicleModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar Vehículo
          </button>
        ) : (
          <button
            onClick={openNewDriverModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar Operador
          </button>
        )}
      </div>

      {/* Vehicles View */}
      {activeSubTab === 'VEHICLES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-700">{v.economicNumber}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        v.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'IN_ROUTE'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {v.status === 'AVAILABLE' ? 'Disponible' : v.status === 'IN_ROUTE' ? 'En Ruta' : 'En Taller'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-1">{v.brandModel}</h4>
                  <p className="text-[11px] font-mono text-slate-500">Placas: {v.plate} ({v.type})</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditVehicleModal(v)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Eliminar esta unidad de la flota?')) deleteVehicle(v.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Capacities */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cap. Carga</span>
                  <span className="font-bold text-slate-900">{(Number(v.capacityWeight) || 0).toLocaleString('es-MX')} kg</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Volumen</span>
                  <span className="font-bold text-slate-900">{v.capacityVolume} m³</span>
                </div>
              </div>

              {/* Compliance Info */}
              <div className="space-y-1 text-[10px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" /> Póliza Seguro:
                  </span>
                  <span className="font-mono text-slate-700">{v.insurancePolicy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vigencia Póliza:</span>
                  <span className="font-semibold text-slate-900">{v.insuranceExpiration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Verificación Ambiental:</span>
                  <span className="font-semibold text-slate-900">{v.verificationExpiration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drivers View */}
      {activeSubTab === 'DRIVERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-xs">
                    {d.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{d.name}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          d.status === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'EN_RUTA'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {d.status === 'ACTIVO' ? 'En Base' : d.status === 'EN_RUTA' ? 'En Ruta' : d.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">No. Empleado: {d.employeeId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditDriverModal(d)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Eliminar este operador del registro?')) deleteDriver(d.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* License and Phone Details */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Licencia Federal:</span>
                  <span className="font-mono font-bold text-slate-900">{d.licenseNumber} ({d.licenseType})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vigencia Licencia:</span>
                  <span className="font-semibold text-slate-900">{d.licenseExpiration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="text-slate-800 font-mono">{d.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle Create/Edit Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingVehicle ? 'Editar Unidad de Transporte' : 'Alta de Nuevo Vehículo'}
              </h3>
              <button onClick={() => setIsVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">No. Económico</label>
                  <input
                    type="text"
                    required
                    value={vEconomicNumber}
                    onChange={(e) => setVEconomicNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Placas</label>
                  <input
                    type="text"
                    required
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    placeholder="Ej. LC-84-291"
                    className="w-full p-2 rounded-lg border border-slate-300 uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Marca, Modelo y Año</label>
                <input
                  type="text"
                  required
                  value={vBrandModel}
                  onChange={(e) => setVBrandModel(e.target.value)}
                  placeholder="Ej. Freightliner M2 35K 2024"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Tipo Unidad</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value as Vehicle['type'])}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="CAMIONETA_3_5">Camioneta 3.5T</option>
                    <option value="RABON">Rabón</option>
                    <option value="TORTON">Torton</option>
                    <option value="TRACTOCAMION">Tractocamión</option>
                    <option value="UTILITARIO">Utilitario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Cap. Peso (kg)</label>
                  <input
                    type="number"
                    min="100"
                    value={vCapWeight}
                    onChange={(e) => setVCapWeight(parseInt(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Volumen (m³)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={vCapVolume}
                    onChange={(e) => setVCapVolume(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Póliza Seguro</label>
                  <input
                    type="text"
                    value={vInsurancePolicy}
                    onChange={(e) => setVInsurancePolicy(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Vigencia Seguro</label>
                  <input
                    type="date"
                    value={vInsuranceExp}
                    onChange={(e) => setVInsuranceExp(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Create/Edit Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingDriver ? 'Editar Operador / Chofer' : 'Alta de Nuevo Operador'}
              </h3>
              <button onClick={() => setIsDriverModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={dName}
                    onChange={(e) => setDName(e.target.value)}
                    placeholder="Ej. Roberto Méndez"
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">No. Empleado</label>
                  <input
                    type="text"
                    required
                    value={dEmployeeId}
                    onChange={(e) => setDEmployeeId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={dPhone}
                    onChange={(e) => setDPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Tipo Licencia</label>
                  <select
                    value={dLicenseType}
                    onChange={(e) => setDLicenseType(e.target.value as Driver['licenseType'])}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="TIPO_A">Tipo A (Particular / Utilitario)</option>
                    <option value="TIPO_B">Tipo B (Carga Rabón / 3.5T)</option>
                    <option value="TIPO_C">Tipo C (Torton 2 Ejes)</option>
                    <option value="TIPO_E">Tipo E (Tractocamión / Articulado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">No. Licencia Federal</label>
                  <input
                    type="text"
                    required
                    value={dLicenseNumber}
                    onChange={(e) => setDLicenseNumber(e.target.value)}
                    placeholder="FED-LIC-19482"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Vigencia Licencia</label>
                  <input
                    type="date"
                    value={dLicenseExp}
                    onChange={(e) => setDLicenseExp(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Guardar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
