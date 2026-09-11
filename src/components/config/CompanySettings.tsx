import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  DollarSign,
  Percent,
  Sliders,
  Users,
  UserCheck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { ERPModule, UserRole, ActionPermission } from '../../types/erp';
import { UserManagementView } from './UserManagementView';

const ALL_MODULES: { id: ERPModule; label: string }[] = [
  { id: 'DASHBOARD', label: 'Dashboard Ejecutivo' },
  { id: 'IA', label: 'CONSCORE AI Core' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'VENTAS', label: 'Ventas & CRM' },
  { id: 'CLIENTES', label: 'Clientes 360°' },
  { id: 'COTIZACIONES', label: 'Cotizaciones' },
  { id: 'PEDIDOS', label: 'Pedidos' },
  { id: 'INVENTARIO', label: 'Inventario' },
  { id: 'ALMACENES', label: 'Almacenes' },
  { id: 'COMPRAS', label: 'Compras & Proveedores' },
  { id: 'LOGISTICA', label: 'Logística & Rutas' },
  { id: 'RH', label: 'Recursos Humanos' },
  { id: 'FINANZAS', label: 'Finanzas & Cobranza' },
  { id: 'SERVICIO', label: 'Servicio al Cliente & Garantías' },
  { id: 'REPORTES', label: 'Reportes & BI' },
  { id: 'AUTOMATIZACION', label: 'Automatización & BPM' },
  { id: 'PREDICTIVO', label: 'Inteligencia Predictiva' },
  { id: 'CONFIGURACION', label: 'Configuración' },
  { id: 'AUDITORIA', label: 'Bitácora de Auditoría' },
];

const ALL_ACTIONS: { id: ActionPermission; label: string }[] = [
  { id: 'VER', label: 'Ver' },
  { id: 'CREAR', label: 'Crear' },
  { id: 'EDITAR', label: 'Editar' },
  { id: 'ELIMINAR', label: 'Eliminar' },
  { id: 'AUTORIZAR', label: 'Autorizar' },
  { id: 'EXPORTAR', label: 'Exportar' },
];

const ROLES_LIST: { id: UserRole; label: string }[] = [
  { id: 'ADMINISTRADOR', label: 'Administrador TI' },
  { id: 'DIRECTOR', label: 'Dirección General' },
  { id: 'GERENTE_VENTAS', label: 'Gerencia de Ventas' },
  { id: 'VENDEDOR', label: 'Ejecutivo de Ventas' },
  { id: 'ALMACEN', label: 'Jefe de Almacén' },
  { id: 'LOGISTICA', label: 'Coordinador de Logística' },
  { id: 'COMPRAS', label: 'Jefe de Compras' },
  { id: 'MARKETING', label: 'Especialista Marketing' },
  { id: 'RH', label: 'Recursos Humanos' },
  { id: 'FINANZAS', label: 'Finanzas y Cobranza' },
];

export const CompanySettings: React.FC = () => {
  const { companyConfig, updateCompanyConfig, resetToDemoData, addNotification } = useERP();
  const { rolePermissions, updateRolePermissions } = useAuth();

  const [activeTab, setActiveTab] = useState<'USUARIOS' | 'EMPRESA' | 'ROLES' | 'SISTEMA'>('USUARIOS');
  const [selectedRole, setSelectedRole] = useState<UserRole>('VENDEDOR');

  const [formData, setFormData] = useState({
    businessName: companyConfig.businessName,
    tradeName: companyConfig.tradeName,
    rfc: companyConfig.rfc,
    fiscalRegime: companyConfig.fiscalRegime,
    address: companyConfig.address,
    city: companyConfig.city,
    state: companyConfig.state,
    zipCode: companyConfig.zipCode,
    phone: companyConfig.phone,
    email: companyConfig.email,
    taxRate: companyConfig.taxRate,
    currency: companyConfig.currency,
  });

  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyConfig(formData);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
    addNotification({
      title: 'Configuración Guardada',
      message: 'Los datos de la empresa han sido actualizados en la base central.',
      type: 'EXITO',
      module: 'CONFIGURACION',
    });
  };

  const handleTogglePermission = (module: ERPModule, action: ActionPermission) => {
    const rawActions = rolePermissions?.[selectedRole]?.permissions?.[module];
    const currentActions = Array.isArray(rawActions) ? rawActions : [];
    let updatedActions: ActionPermission[];

    if (currentActions.includes(action)) {
      updatedActions = currentActions.filter((a) => a !== action);
    } else {
      updatedActions = [...currentActions, action];
    }

    updateRolePermissions(selectedRole, module, updatedActions);
    addNotification({
      title: 'Matriz RBAC Actualizada',
      message: `Permiso ${action} en ${module} modificado para rol ${selectedRole}.`,
      type: 'INFO',
      module: 'CONFIGURACION',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-xl shadow-xs gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Configuración Central del Sistema</h2>
          <p className="text-xs text-slate-500">
            Administración de usuarios y permisos, parámetros corporativos, matriz RBAC y mantenimiento
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('USUARIOS')}
            id="tab-usuarios-sistema"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'USUARIOS'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Usuarios del Sistema</span>
          </button>
          <button
            onClick={() => setActiveTab('EMPRESA')}
            id="tab-datos-empresa"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'EMPRESA'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Datos de Empresa</span>
          </button>
          <button
            onClick={() => setActiveTab('ROLES')}
            id="tab-matriz-rbac"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'ROLES'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Matriz de Seguridad (RBAC)</span>
          </button>
          <button
            onClick={() => setActiveTab('SISTEMA')}
            id="tab-mantenimiento"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'SISTEMA'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Mantenimiento</span>
          </button>
        </div>
      </div>

      {/* Tab 0: Usuarios del Sistema */}
      {activeTab === 'USUARIOS' && <UserManagementView />}

      {/* Tab 1: Datos de Empresa */}
      {activeTab === 'EMPRESA' && (
        <form onSubmit={handleSaveCompany} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">Identidad Fiscal y Comercial</h3>
            </div>
            {isSavedNotice && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" /> Cambios aplicados con éxito
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Nombre Comercial
              </label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                RFC Corporativo
              </label>
              <input
                type="text"
                value={formData.rfc}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Régimen Fiscal
              </label>
              <input
                type="text"
                value={formData.fiscalRegime}
                onChange={(e) => setFormData({ ...formData, fiscalRegime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Dirección Fiscal / Corporativo
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Ciudad y Estado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  placeholder="Estado"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Teléfono Conmutador
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Tasa IVA General (%)
              </label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Moneda Base
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" /> Guardar Configuración Empresarial
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Matriz de Seguridad (RBAC) */}
      {activeTab === 'ROLES' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Control de Acceso por Roles (RBAC) — Principio: Denegar por Defecto
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura los permisos granulares para cada uno de los 10 roles del sistema
              </p>
            </div>

            {/* Role selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Rol a Editar:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="rounded-lg border border-blue-300 bg-blue-50/50 px-3 py-1.5 text-xs font-bold text-blue-900 outline-none"
              >
                {ROLES_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Módulo del ERP</th>
                  {ALL_ACTIONS.map((act) => (
                    <th key={act.id} className="py-3 px-4 text-center">
                      {act.label} ({act.id})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALL_MODULES.map((mod) => {
                  const rawPermissions =
                    rolePermissions?.[selectedRole]?.permissions?.[mod.id];
                  const currentPermissions = Array.isArray(rawPermissions) ? rawPermissions : [];

                  return (
                    <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        {mod.label}
                        <span className="font-mono text-[10px] text-slate-400">[{mod.id}]</span>
                      </td>
                      {ALL_ACTIONS.map((act) => {
                        const isGranted = currentPermissions.includes(act.id);
                        return (
                          <td key={act.id} className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handleTogglePermission(mod.id, act.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span>
              ℹ️ Cualquier módulo o acción no marcada explícitamente será <b>denegada por defecto</b> para el rol {selectedRole}.
            </span>
            <span className="font-semibold text-emerald-700">Sincronización en Vivo</span>
          </div>
        </div>
      )}

      {/* Tab 3: Mantenimiento del Sistema */}
      {activeTab === 'SISTEMA' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">Mantenimiento de Base de Datos y Datos Semilla</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Herramientas de depuración, restauración y gestión de datos de prueba
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Restaurar Catálogo y Transacciones Iniciales
            </h4>
            <p className="mt-1 text-xs text-slate-700 leading-relaxed">
              Esta acción restaura el catálogo completo de aislamiento térmico (Lana Mineral, Fibra de Vidrio, Foamular XPS, Preformados, Aislantes Térmicos Reflectivos), los 10 roles de usuario, cotizaciones de demostración y movimientos iniciales de inventario.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas reiniciar todos los datos a los valores iniciales de prueba?')) {
                    resetToDemoData();
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restaurar Datos Semilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
