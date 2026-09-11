/**
 * @license
 * CONSCORE ERP IA - Enterprise Persistent Database Engine
 * Transaccional con soporte ACID, Rollback y persistencia en disco.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Role,
  Permission,
  RolePermissionMapping,
  Department,
  Employee,
  Customer,
  Lead,
  Product,
  ProductCategory,
  Warehouse,
  WarehouseInventory,
  InventoryMovement,
  Quote,
  QuoteItem,
  Order,
  OrderItem,
  AuditLog,
  NotificationItem,
  CompanyConfig,
  DashboardKPIs,
  DeliveryEvidence,
  Picking,
  PurchaseRequest,
  PurchaseOrder,
  Opportunity,
  DiscountApprovalRequest,
  CommercialSettings,
  Route,
  LogisticsReturn,
  LogisticsReturnItem,
  EmployeeConfidentialData,
  Position,
  Shift,
  InventoryAdjustment,
  InventoryMovementType,
} from '../../src/types/erp';
import { INITIAL_CUSTOMERS } from '../../src/data/initialData';
import { INITIAL_OPPORTUNITIES, INITIAL_LEADS } from '../../src/data/initialCRMData';
import { INITIAL_SERVICE_TICKETS } from '../../src/services/customerServiceInitialData';
import {
  INITIAL_EMPLOYEES_20,
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_SHIFTS,
  INITIAL_CONFIDENTIAL_DATA,
} from '../../src/data/initialHRData';

// Ruta de la base de datos. Configurable para poder apuntar a un volumen
// persistente: en Cloud Run el sistema de archivos del contenedor es efimero
// y todo lo escrito se pierde al reiniciar la instancia.
const DB_FILE = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(process.cwd(), 'data', 'conscore_db.json');
const DB_DIR = path.dirname(DB_FILE);

export interface SupplierPriceRecord {
  id: string;
  product_id: string;
  sku: string;
  supplier_id: string;
  supplier_name: string;
  unit_cost: number;
  lead_time_days: number;
  currency: string;
  payment_terms: string;
}

export interface DatabaseSchema {
  users: (User & { password_hash: string; salt: string })[];
  roles: Role[];
  permissions: Permission[];
  role_permissions: RolePermissionMapping[];
  departments: Department[];
  positions?: Position[];
  shifts?: Shift[];
  employees: Employee[];
  confidential_data?: Record<string, EmployeeConfidentialData>;
  customers: Customer[];
  leads?: Lead[];
  opportunities?: Opportunity[];
  product_categories: ProductCategory[];
  products: Product[];
  warehouses: Warehouse[];
  inventory: WarehouseInventory[];
  inventory_movements: InventoryMovement[];
  quotes: Quote[];
  quote_items: QuoteItem[];
  orders: Order[];
  order_items: OrderItem[];
  purchase_requests?: PurchaseRequest[];
  purchase_orders?: PurchaseOrder[];
  supplier_prices?: SupplierPriceRecord[];
  audit_logs: AuditLog[];
  notifications: NotificationItem[];
  company_config: CompanyConfig;
  commercial_settings?: CommercialSettings;
  pods?: DeliveryEvidence[];
  pickings?: Picking[];
  routes?: Route[];
  discount_approvals?: DiscountApprovalRequest[];
  product_returns?: LogisticsReturn[];
  inventory_adjustments?: InventoryAdjustment[];
  service_cases?: any[];
  counters: {
    customer_seq: number;
    lead_seq?: number;
    opportunity_seq?: number;
    quote_seq: number;
    order_seq: number;
    movement_seq: number;
    audit_seq: number;
    purchase_request_seq?: number;
    purchase_order_seq?: number;
    service_case_seq?: number;
    adjustment_seq?: number;
  };
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = hashPassword(password, salt);
  return hash === expectedHash;
}

// Initial Seed Data for CONSCORE ERP IA (Thermal Insulation B2B Industry)
/**
 * Contrasena inicial de los usuarios sembrados. Se puede fijar con
 * SEED_PASSWORD para no depender del valor por defecto, que es publico.
 * Todos los usuarios sembrados deben cambiarla en el primer acceso.
 */
export function seedPassword(): string {
  return process.env.SEED_PASSWORD || 'ConsCore2026!';
}

function getInitialSeedData(): DatabaseSchema {
  const salt = generateSalt();
  const defaultPasswordHash = hashPassword(seedPassword(), salt);

  const roles: Role[] = [
    { id: 'ROL-01', name: 'ADMINISTRADOR', displayName: 'Administrador General', description: 'Control total de todos los módulos y configuraciones', status: 'ACTIVO' },
    { id: 'ROL-02', name: 'DIRECTOR', displayName: 'Director General', description: 'Acceso directivo a KPIs, autorizaciones y reportes financieros', status: 'ACTIVO' },
    { id: 'ROL-03', name: 'GERENTE_VENTAS', displayName: 'Gerente Comercial', description: 'Supervisión de clientes, cotizaciones y pedidos comerciales', status: 'ACTIVO' },
    { id: 'ROL-04', name: 'VENDEDOR', displayName: 'Ejecutivo de Ventas B2B', description: 'Emisión de cotizaciones y prospección de clientes', status: 'ACTIVO' },
    { id: 'ROL-05', name: 'MARKETING', displayName: 'Marketing & CRM', description: 'Gestión de campañas y prospección digital', status: 'ACTIVO' },
    { id: 'ROL-06', name: 'ALMACEN', displayName: 'Almacenista Operativo', description: 'Control físico de inventario, entradas, salidas y ubicaciones', status: 'ACTIVO' },
    { id: 'ROL-13', name: 'JEFE_ALMACEN', displayName: 'Jefe de Almacén & Certificación', description: 'Supervisión, verificación y firma autorizada de picking y salidas', status: 'ACTIVO' },
    { id: 'ROL-07', name: 'LOGISTICA', displayName: 'Coordinador de Logística', description: 'Despacho, rutas y seguimiento de entregas', status: 'ACTIVO' },
    { id: 'ROL-08', name: 'COMPRAS', displayName: 'Especialista de Compras', description: 'Reabastecimiento y gestión de proveedores estratégicos', status: 'ACTIVO' },
    { id: 'ROL-09', name: 'RH', displayName: 'Recursos Humanos', description: 'Expedientes de personal y comisiones comerciales', status: 'ACTIVO' },
    { id: 'ROL-10', name: 'FINANZAS', displayName: 'Gerente de Finanzas & Cobranza', description: 'Control de crédito, cartera y estados financieros', status: 'ACTIVO' },
    // Observación 30: estos tres roles existen en UserRole y hay usuarios
    // asignados a ellos, pero no tenían registro en la tabla de roles.
    // checkPermission busca el rol por nombre y devuelve false cuando no lo
    // encuentra, así que un usuario de Servicio al Cliente quedaba sin acceso
    // a ningún módulo del sistema.
    { id: 'ROL-11', name: 'SERVICIO_CLIENTE', displayName: 'Servicio al Cliente', description: 'Atención de casos, garantías y devoluciones', status: 'ACTIVO' },
    { id: 'ROL-12', name: 'CHOFER', displayName: 'Operador de Reparto', description: 'Ejecución de rutas y registro de evidencia de entrega', status: 'ACTIVO' },
    { id: 'ROL-14', name: 'CALIDAD', displayName: 'Aseguramiento de Calidad', description: 'Incidencias de calidad, acciones correctivas y certificación', status: 'ACTIVO' },
  ];

  const modules = [
    'DASHBOARD', 'IA', 'MARKETING', 'VENTAS', 'CLIENTES', 'COTIZACIONES', 'PEDIDOS',
    'INVENTARIO', 'ALMACENES', 'COMPRAS', 'LOGISTICA', 'RH', 'FINANZAS', 'REPORTES',
    'CONFIGURACION', 'AUDITORIA', 'SERVICIO',
    // Observación 30: AUTOMATIZACION y PREDICTIVO aparecen en la barra lateral
    // pero no tenían permisos, así que ningún rol distinto de ADMINISTRADOR
    // podía entrar ni podía otorgárseles el acceso desde la matriz.
    'AUTOMATIZACION', 'PREDICTIVO'
  ] as const;

  const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'AUTHORIZE', 'EXPORT'] as const;

  const permissions: Permission[] = [];
  let permCount = 1;
  for (const mod of modules) {
    for (const act of actions) {
      permissions.push({
        id: `PERM-${String(permCount++).padStart(3, '0')}`,
        module: mod,
        action: act,
        description: `Permiso para ${act} en módulo ${mod}`,
      });
    }
  }

  // Role permissions mappings (Deny by default, granted explicitly)
  const role_permissions: RolePermissionMapping[] = [];

  // Admin gets all permissions
  permissions.forEach(p => {
    role_permissions.push({ role_id: 'ROL-01', permission_id: p.id });
  });

  // Helper to grant permissions
  const grant = (roleId: string, mod: string, acts: string[]) => {
    permissions.filter(p => p.module === mod && acts.includes(p.action)).forEach(p => {
      role_permissions.push({ role_id: roleId, permission_id: p.id });
    });
  };

  // Director
  grant('ROL-02', 'DASHBOARD', ['VIEW', 'EXPORT']);
  grant('ROL-02', 'IA', ['VIEW', 'CREATE']);
  grant('ROL-02', 'VENTAS', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-02', 'CLIENTES', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-02', 'COTIZACIONES', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-02', 'PEDIDOS', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-02', 'INVENTARIO', ['VIEW', 'EXPORT']);
  grant('ROL-02', 'ALMACENES', ['VIEW', 'EXPORT']);
  grant('ROL-02', 'COMPRAS', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-02', 'FINANZAS', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-02', 'REPORTES', ['VIEW', 'EXPORT']);
  grant('ROL-02', 'AUDITORIA', ['VIEW', 'EXPORT']);

  // Gerente Ventas
  grant('ROL-03', 'DASHBOARD', ['VIEW']);
  grant('ROL-03', 'IA', ['VIEW']);
  grant('ROL-03', 'VENTAS', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-03', 'CLIENTES', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-03', 'COTIZACIONES', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-03', 'PEDIDOS', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-03', 'INVENTARIO', ['VIEW', 'EXPORT']);
  grant('ROL-03', 'REPORTES', ['VIEW', 'EXPORT']);

  // Vendedor
  grant('ROL-04', 'DASHBOARD', ['VIEW']);
  grant('ROL-04', 'IA', ['VIEW']);
  grant('ROL-04', 'VENTAS', ['VIEW', 'CREATE', 'EDIT']);
  grant('ROL-04', 'CLIENTES', ['VIEW', 'CREATE', 'EDIT']);
  grant('ROL-04', 'COTIZACIONES', ['VIEW', 'CREATE', 'EDIT']);
  grant('ROL-04', 'PEDIDOS', ['VIEW', 'CREATE']);
  grant('ROL-04', 'INVENTARIO', ['VIEW']);

  // Almacén (Segregado de compras y precios)
  grant('ROL-06', 'DASHBOARD', ['VIEW']);
  grant('ROL-06', 'IA', ['VIEW']);
  grant('ROL-06', 'INVENTARIO', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-06', 'ALMACENES', ['VIEW', 'CREATE', 'EDIT']);
  grant('ROL-06', 'PEDIDOS', ['VIEW', 'EDIT']); // Para actualizar surtido

  // Jefe de Almacén (Con facultades de verificación y autorización de picking)
  grant('ROL-13', 'DASHBOARD', ['VIEW']);
  grant('ROL-13', 'IA', ['VIEW']);
  grant('ROL-13', 'INVENTARIO', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-13', 'ALMACENES', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-13', 'PEDIDOS', ['VIEW', 'EDIT']);

  // Compras & Abastecimiento
  grant('ROL-08', 'DASHBOARD', ['VIEW']);
  grant('ROL-08', 'IA', ['VIEW']);
  grant('ROL-08', 'INVENTARIO', ['VIEW']);
  grant('ROL-08', 'ALMACENES', ['VIEW']);
  grant('ROL-08', 'COMPRAS', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);

  // Recursos Humanos (ROL-09)
  grant('ROL-09', 'DASHBOARD', ['VIEW']);
  grant('ROL-09', 'IA', ['VIEW']);
  grant('ROL-09', 'RH', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-09', 'REPORTES', ['VIEW', 'EXPORT']);
  grant('ROL-09', 'AUDITORIA', ['VIEW']);

  // Director (ROL-02) for RH
  grant('ROL-02', 'RH', ['VIEW', 'AUTHORIZE', 'EXPORT']);

  // Gerente Ventas (ROL-03) for RH (visualización de plantilla / equipo de ventas)
  grant('ROL-03', 'RH', ['VIEW']);

  // Finanzas (ROL-10) for RH (visualización para dispersión nómina / comisiones)
  grant('ROL-10', 'RH', ['VIEW']);
  grant('ROL-10', 'FINANZAS', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-10', 'DASHBOARD', ['VIEW']);
  grant('ROL-10', 'REPORTES', ['VIEW', 'EXPORT']);
  grant('ROL-10', 'AUDITORIA', ['VIEW']);

  // Grants para Servicio al Cliente & Calidad (Observación 17)
  grant('ROL-02', 'SERVICIO', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-03', 'SERVICIO', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-04', 'SERVICIO', ['VIEW', 'CREATE', 'EDIT']);
  grant('ROL-06', 'SERVICIO', ['VIEW', 'EDIT']);
  grant('ROL-07', 'SERVICIO', ['VIEW', 'EDIT']);
  grant('ROL-13', 'SERVICIO', ['VIEW', 'EDIT']);

  // ============================================================
  // Observación 30: accesos por departamento
  //
  // MARKETING (ROL-05) no tenía un solo permiso otorgado: su usuario entraba
  // y no veía ningún módulo. LOGISTICA (ROL-07) solo tenía SERVICIO. Y los
  // tres roles agregados arriba no tenían nada.
  // ============================================================

  // Marketing & Prospección
  grant('ROL-05', 'DASHBOARD', ['VIEW']);
  grant('ROL-05', 'IA', ['VIEW']);
  grant('ROL-05', 'MARKETING', ['VIEW', 'CREATE', 'EDIT', 'EXPORT']);
  grant('ROL-05', 'CLIENTES', ['VIEW']);
  grant('ROL-05', 'VENTAS', ['VIEW']);
  grant('ROL-05', 'REPORTES', ['VIEW', 'EXPORT']);

  // Coordinación de Logística
  grant('ROL-07', 'DASHBOARD', ['VIEW']);
  grant('ROL-07', 'IA', ['VIEW']);
  grant('ROL-07', 'LOGISTICA', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-07', 'PEDIDOS', ['VIEW', 'EDIT']);
  grant('ROL-07', 'ALMACENES', ['VIEW']);
  grant('ROL-07', 'CLIENTES', ['VIEW']);

  // Servicio al Cliente
  grant('ROL-11', 'DASHBOARD', ['VIEW']);
  grant('ROL-11', 'IA', ['VIEW']);
  grant('ROL-11', 'SERVICIO', ['VIEW', 'CREATE', 'EDIT', 'EXPORT']);
  grant('ROL-11', 'CLIENTES', ['VIEW']);
  grant('ROL-11', 'PEDIDOS', ['VIEW']);
  grant('ROL-11', 'COTIZACIONES', ['VIEW']);
  grant('ROL-11', 'LOGISTICA', ['VIEW']);

  // Operador de Reparto: solo lo que necesita para cerrar la entrega
  grant('ROL-12', 'DASHBOARD', ['VIEW']);
  grant('ROL-12', 'LOGISTICA', ['VIEW', 'EDIT']);
  grant('ROL-12', 'PEDIDOS', ['VIEW']);

  // Aseguramiento de Calidad
  grant('ROL-14', 'DASHBOARD', ['VIEW']);
  grant('ROL-14', 'IA', ['VIEW']);
  grant('ROL-14', 'SERVICIO', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-14', 'INVENTARIO', ['VIEW']);
  grant('ROL-14', 'ALMACENES', ['VIEW']);
  grant('ROL-14', 'REPORTES', ['VIEW', 'EXPORT']);
  grant('ROL-14', 'AUDITORIA', ['VIEW']);

  // Módulos de automatización e inteligencia predictiva
  grant('ROL-02', 'AUTOMATIZACION', ['VIEW', 'AUTHORIZE', 'EXPORT']);
  grant('ROL-02', 'PREDICTIVO', ['VIEW', 'EXPORT']);
  grant('ROL-03', 'PREDICTIVO', ['VIEW', 'EXPORT']);
  grant('ROL-10', 'PREDICTIVO', ['VIEW', 'EXPORT']);
  grant('ROL-08', 'PREDICTIVO', ['VIEW']);
  grant('ROL-13', 'PREDICTIVO', ['VIEW']);

  // Departments (Comprehensive merged catalog)
  const departments: Department[] = [
    ...INITIAL_DEPARTMENTS,
    { id: 'DEP-01', name: 'Dirección General', description: 'Estrategia corporativa y gobierno', status: 'ACTIVO' as const },
    { id: 'DEP-02', name: 'Ventas y Comercial', description: 'Atención a cuentas clave y proyectos B2B', status: 'ACTIVO' as const },
    { id: 'DEP-03', name: 'Almacén & Logística', description: 'Gestión de existencias y distribución', status: 'ACTIVO' as const },
    { id: 'DEP-04', name: 'Compras & Abastecimiento', description: 'Adquisiciones y relación con fabricantes', status: 'ACTIVO' as const },
    { id: 'DEP-05', name: 'Finanzas & Crédito', description: 'Tesorería, cobranza y contabilidad fiscal', status: 'ACTIVO' as const },
  ].filter((dept, idx, self) => self.findIndex(d => d.id === dept.id || d.name === dept.name) === idx);

  // Positions & Shifts
  const positions: Position[] = [...INITIAL_POSITIONS];
  const shifts: Shift[] = [...INITIAL_SHIFTS];

  // Employees - Complete 20 Real Collaborators Seed
  const employees: Employee[] = [
    ...INITIAL_EMPLOYEES_20,
  ];

  // Confidential data
  const confidential_data: Record<string, EmployeeConfidentialData> = {
    ...INITIAL_CONFIDENTIAL_DATA,
  };

  // Users (Real Accounts)
  const users = [
    {
      id: 'USR-001',
      name: 'Ing. Carlos Mendoza',
      username: 'admin',
      email: 'admin@conscore.com.mx',
      role_id: 'ROL-01',
      role: 'ADMINISTRADOR' as const,
      employee_id: 'EMP-01',
      status: 'ACTIVO' as const,
      created_at: '2024-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-002',
      name: 'Lic. Claudia Mendoza Ortiz',
      username: 'cmendoza',
      email: 'cmendoza@conscore.com.mx',
      role_id: 'ROL-01',
      role: 'ADMINISTRADOR' as const,
      employee_id: 'EMP-01',
      status: 'ACTIVO' as const,
      created_at: '2024-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-003',
      name: 'Lic. Laura Salinas',
      username: 'laura.salinas',
      email: 'laura.salinas@conscore.com.mx',
      role_id: 'ROL-03',
      role: 'GERENTE_VENTAS' as const,
      employee_id: 'EMP-02',
      status: 'ACTIVO' as const,
      created_at: '2024-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-004',
      name: 'Ing. Roberto Fuentes',
      username: 'roberto.fuentes',
      email: 'roberto.fuentes@conscore.com.mx',
      role_id: 'ROL-12',
      role: 'SERVICIO_CLIENTE' as const,
      employee_id: 'EMP-03',
      status: 'ACTIVO' as const,
      created_at: '2024-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-005',
      name: 'Mtro. Fernando Garza',
      username: 'fernando.garza',
      email: 'almacen@conscore.com.mx',
      role_id: 'ROL-06',
      role: 'ALMACEN' as const,
      employee_id: 'EMP-04',
      status: 'ACTIVO' as const,
      created_at: '2024-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-JEFE-ALM',
      name: 'Ing. Carlos Mendoza (Jefe de Almacén)',
      username: 'jefe.almacen',
      email: 'jefe.almacen@conscore.com.mx',
      role_id: 'ROL-13',
      role: 'JEFE_ALMACEN' as const,
      employee_id: 'EMP-04J',
      status: 'ACTIVO' as const,
      created_at: '2024-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-006',
      name: 'Ing. Rodrigo Sánchez Peralta',
      username: 'compras',
      email: 'compras@conscore.com.mx',
      role_id: 'ROL-08',
      role: 'COMPRAS' as const,
      employee_id: 'EMP-05',
      status: 'ACTIVO' as const,
      created_at: '2024-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-01',
      name: 'Arq. Mariana Ruiz Peña',
      username: 'vendedor01',
      email: 'vendedor01@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_01',
      sales_executive_id: 'VENDEDOR_01',
      territory: 'Zona Norte (Monterrey, Saltillo, Reynosa)',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-02',
      name: 'Lic. Fernando Trejo Valdés',
      username: 'vendedor02',
      email: 'vendedor02@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_02',
      sales_executive_id: 'VENDEDOR_02',
      territory: 'Zona Bajío (Querétaro, Celaya, León)',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-03',
      name: 'Ing. Sofía Villalobos Cruz',
      username: 'vendedor03',
      email: 'vendedor03@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_03',
      sales_executive_id: 'VENDEDOR_03',
      territory: 'Zona Centro / Hidalgo (Tula, Pachuca, CDMX)',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-04',
      name: 'Lic. Gabriel Espinosa Ochoa',
      username: 'vendedor04',
      email: 'vendedor04@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_04',
      sales_executive_id: 'VENDEDOR_04',
      territory: 'Zona Metropolitana CDMX / Toluca',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-05',
      name: 'Arq. Daniela Sotomayor',
      username: 'vendedor05',
      email: 'vendedor05@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_05',
      sales_executive_id: 'VENDEDOR_05',
      territory: 'Zona Occidente (Guadalajara, Zapopan, Colima)',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-06',
      name: 'Ing. Héctor Ponce Del Rincón',
      username: 'vendedor06',
      email: 'vendedor06@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_06',
      sales_executive_id: 'VENDEDOR_06',
      territory: 'Zona Golfo / Veracruz / Coatzacoalcos',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-07',
      name: 'Lic. Valeria Castillejos',
      username: 'vendedor07',
      email: 'vendedor07@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_07',
      sales_executive_id: 'VENDEDOR_07',
      territory: 'Zona Sureste (Puebla, Tlaxcala, Morelos)',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-08',
      name: 'Ing. Rodrigo Alarcón Ramos',
      username: 'vendedor08',
      email: 'vendedor08@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_08',
      sales_executive_id: 'VENDEDOR_08',
      territory: 'Zona Noroeste (Hermosillo, Mexicali, Tijuana)',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-09',
      name: 'Lic. Paulina De La Vega',
      username: 'vendedor09',
      email: 'vendedor09@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_09',
      sales_executive_id: 'VENDEDOR_09',
      territory: 'Zona Pacífico / San Luis Potosí / Aguascalientes',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-VEND-10',
      name: 'Ing. Mateo Carranza Solórzano',
      username: 'vendedor10',
      email: 'vendedor10@conscore.com.mx',
      role_id: 'ROL-04',
      role: 'VENDEDOR' as const,
      salesExecutiveId: 'VENDEDOR_10',
      sales_executive_id: 'VENDEDOR_10',
      territory: 'Cuentas Estratégicas EPC & Oil/Gas Nacional',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
    {
      id: 'USR-011',
      name: 'Lic. Patricia Valenzuela',
      username: 'rh',
      email: 'rh@conscore.com.mx',
      role_id: 'ROL-09',
      role: 'RH' as const,
      employee_id: 'EMP-011',
      status: 'ACTIVO' as const,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
      password_hash: defaultPasswordHash,
      salt,
    },
  ];

  // Product Categories
  const product_categories: ProductCategory[] = [
    { id: 'CAT-01', name: 'Lana Mineral de Roca', description: 'Colchonetas y paneles para alta temperatura', status: 'ACTIVO' },
    { id: 'CAT-02', name: 'Fibra de Vidrio para Ductos', description: 'Aislamiento termoacústico con barrera FSK', status: 'ACTIVO' },
    { id: 'CAT-03', name: 'Poliestireno Extruido (XPS)', description: 'Placas térmicas rígidas para cuartos fríos y cubiertas', status: 'ACTIVO' },
    { id: 'CAT-04', name: 'Preformados Rígidos de Cañuela', description: 'Aislamiento seccional para tuberías industriales', status: 'ACTIVO' },
    { id: 'CAT-05', name: 'Chaquetas y Protección Mecánica', description: 'Láminas de aluminio liso y estucado', status: 'ACTIVO' },
  ];

  // Products (With initial physical and reserved stock)
  const products: Product[] = [
    {
      id: 'PRD-01',
      sku: 'LM-ROC-200',
      code: 'LM-200',
      name: 'Lana Mineral de Roca Colchoneta 2" (Densidad 64 kg/m³)',
      description: 'Aislamiento térmico industrial para calderas, hornos y ductos calientes hasta 650°C. Rollo 1.20 x 5.00m.',
      category_id: 'CAT-01',
      category_name: 'Lana Mineral de Roca',
      unit: 'M2',
      cost: 145.00,
      sale_price: 215.00,
      minimum_stock: 50,
      maximum_stock: 500,
      status: 'ACTIVO',
      physical_stock: 160,
      reserved_stock: 40,
      available_stock: 120, // 160 - 40
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2026-08-25T00:00:00.000Z',
    },
    {
      id: 'PRD-02',
      sku: 'PRE-FV-2010',
      code: 'PFV-201',
      name: 'Preformado Fibra de Vidrio para Tubería 2" x 1" Espesor',
      description: 'Cañuela rígida articulada con barrera de vapor ASJ integrada para vapor y agua helada.',
      category_id: 'CAT-04',
      category_name: 'Preformados Rígidos de Cañuela',
      unit: 'TRAMO',
      cost: 92.00,
      sale_price: 138.00,
      minimum_stock: 50,
      maximum_stock: 300,
      status: 'ACTIVO',
      physical_stock: 28,
      reserved_stock: 10,
      available_stock: 18, // Alerta stock bajo: 18 < 50
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2026-08-25T00:00:00.000Z',
    },
    {
      id: 'PRD-03',
      sku: 'XPS-FOAM-15',
      code: 'XPS-150',
      name: 'Placa Poliestireno Extruido XPS 1.5" (1.22 x 2.44m)',
      description: 'Panel de alta resistencia a la compresión (250 kPa) para refrigeración y cubiertas aisladas.',
      category_id: 'CAT-03',
      category_name: 'Poliestireno Extruido (XPS)',
      unit: 'PZA',
      cost: 310.00,
      sale_price: 465.00,
      minimum_stock: 30,
      maximum_stock: 200,
      status: 'ACTIVO',
      physical_stock: 95,
      reserved_stock: 15,
      available_stock: 80,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2026-08-25T00:00:00.000Z',
    },
    {
      id: 'PRD-04',
      sku: 'FV-DUCT-15FSK',
      code: 'FVD-150',
      name: 'Colchoneta Fibra de Vidrio para Ductos 1.5" con FSK',
      description: 'Aislamiento exterior para ductería de aire acondicionado HVAC con acabado Foil reforzado.',
      category_id: 'CAT-02',
      category_name: 'Fibra de Vidrio para Ductos',
      unit: 'M2',
      cost: 88.00,
      sale_price: 132.00,
      minimum_stock: 100,
      maximum_stock: 800,
      status: 'ACTIVO',
      physical_stock: 340,
      reserved_stock: 60,
      available_stock: 280,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2026-08-25T00:00:00.000Z',
    },
    {
      id: 'PRD-05',
      sku: 'ALU-CH-016',
      code: 'ALU-016',
      name: 'Chaqueta de Aluminio Estucado Calibre 0.016" con Barrera Polykraft',
      description: 'Protección mecánica y climática para aislamiento exterior de tuberías y tanques industriales.',
      category_id: 'CAT-05',
      category_name: 'Chaquetas y Protección Mecánica',
      unit: 'ROLLO',
      cost: 2100.00,
      sale_price: 2950.00,
      minimum_stock: 10,
      maximum_stock: 60,
      status: 'ACTIVO',
      physical_stock: 22,
      reserved_stock: 4,
      available_stock: 18,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2026-08-25T00:00:00.000Z',
    },
    {
      id: 'PRD-TEST-PRICE-001',
      sku: 'TEST-PRICE-001',
      code: 'TEST-PRICE-001',
      name: 'Aislante Térmico Test Hotfix 07 (Precio Lista 100)',
      description: 'Producto estándar para validaciones de precio de lista y control de descuento.',
      category_id: 'CAT-01',
      category_name: 'Lana Mineral de Roca',
      unit: 'PZA',
      cost: 60.00,
      sale_price: 100.00,
      salePrice: 100.00,
      price: 100.00,
      list_price: 100.00,
      listPrice: 100.00,
      minimum_stock: 50,
      maximum_stock: 500,
      status: 'ACTIVO',
      physical_stock: 200,
      reserved_stock: 10,
      available_stock: 190,
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
    },
  ];

  // Warehouses
  const warehouses: Warehouse[] = [
    {
      id: 'WH-01',
      name: 'Almacén Central Tlalnepantla',
      code: 'ALM-CENTRAL',
      address: 'Av. Gustavo Baz 2160, San Pedro Barrientos, Tlalnepantla, Edo. Méx.',
      manager_id: 'EMP-04',
      manager_name: 'Mtro. Fernando Garza',
      status: 'ACTIVO',
      total_capacity_m3: 4500,
      current_occupancy_pct: 68,
    },
    {
      id: 'WH-02',
      name: 'CEDIS Guadalajara (Occidente)',
      code: 'ALM-GDL',
      address: 'Parque Industrial El Salto, Nave 4B, Guadalajara, Jal.',
      manager_id: 'EMP-01',
      manager_name: 'Ing. Carlos Mendoza',
      status: 'ACTIVO',
      total_capacity_m3: 2800,
      current_occupancy_pct: 54,
    },
    {
      id: 'WH-03',
      name: 'Sucursal Monterrey (Norte)',
      code: 'ALM-MTY',
      address: 'Av. Sendero Divisorio 500, San Nicolás de los Garza, N.L.',
      manager_id: 'EMP-01',
      manager_name: 'Ing. Carlos Mendoza',
      status: 'ACTIVO',
      total_capacity_m3: 3200,
      current_occupancy_pct: 42,
    },
  ];

  // Inventory by Warehouse
  const inventory: WarehouseInventory[] = [
    { id: 'INV-01', product_id: 'PRD-01', warehouse_id: 'WH-01', warehouse_name: 'Almacén Central Tlalnepantla', physical_stock: 120, reserved_stock: 30, available_stock: 90, location_in_warehouse: 'Nave 1 / R-04 / P-02 / N-1', updated_at: '2026-08-25T10:00:00.000Z' },
    { id: 'INV-02', product_id: 'PRD-01', warehouse_id: 'WH-02', warehouse_name: 'CEDIS Guadalajara', physical_stock: 40, reserved_stock: 10, available_stock: 30, location_in_warehouse: 'Nave A / R-01 / P-01 / N-2', updated_at: '2026-08-25T10:00:00.000Z' },
    { id: 'INV-03', product_id: 'PRD-02', warehouse_id: 'WH-01', warehouse_name: 'Almacén Central Tlalnepantla', physical_stock: 28, reserved_stock: 10, available_stock: 18, location_in_warehouse: 'Nave 1 / R-02 / P-03 / N-3', updated_at: '2026-08-25T10:00:00.000Z' },
    { id: 'INV-04', product_id: 'PRD-03', warehouse_id: 'WH-01', warehouse_name: 'Almacén Central Tlalnepantla', physical_stock: 65, reserved_stock: 10, available_stock: 55, location_in_warehouse: 'Nave 2 / R-05 / P-01 / N-1', updated_at: '2026-08-25T10:00:00.000Z' },
    { id: 'INV-05', product_id: 'PRD-03', warehouse_id: 'WH-02', warehouse_name: 'CEDIS Guadalajara', physical_stock: 30, reserved_stock: 5, available_stock: 25, location_in_warehouse: 'Nave B / R-02 / P-02 / N-1', updated_at: '2026-08-25T10:00:00.000Z' },
    { id: 'INV-06', product_id: 'PRD-04', warehouse_id: 'WH-01', warehouse_name: 'Almacén Central Tlalnepantla', physical_stock: 240, reserved_stock: 40, available_stock: 200, location_in_warehouse: 'Nave 1 / R-01 / P-01 / N-2', updated_at: '2026-08-25T10:00:00.000Z' },
    { id: 'INV-07', product_id: 'PRD-04', warehouse_id: 'WH-03', warehouse_name: 'Sucursal Monterrey', physical_stock: 100, reserved_stock: 20, available_stock: 80, location_in_warehouse: 'Nave Norte / R-03 / P-01 / N-1', updated_at: '2026-08-25T10:00:00.000Z' },
    { id: 'INV-08', product_id: 'PRD-05', warehouse_id: 'WH-01', warehouse_name: 'Almacén Central Tlalnepantla', physical_stock: 22, reserved_stock: 4, available_stock: 18, location_in_warehouse: 'Nave 2 / R-03 / P-02 / N-1', updated_at: '2026-08-25T10:00:00.000Z' },
  ];

  // Customers
  const customers: Customer[] = [
    {
      id: 'CUS-001',
      customer_number: 'CLI-000001',
      company_name: 'Termoaislantes y Climas Industriales S.A. de C.V.',
      contact_name: 'Ing. Mauricio Garza',
      phone: '+52 81 8320 5400',
      email: 'mgarza@termoaislantes.com.mx',
      address: 'Parque Industrial Mitras, Av. Central 410',
      city: 'Monterrey',
      state: 'Nuevo León',
      tax_id: 'TCI890412KL8',
      credit_limit: 450000.00,
      credit_status: 'CORRIENTE',
      current_balance: 142500.00,
      assigned_salesperson_id: 'USR-003',
      assigned_salesperson_name: 'Ing. Roberto Fuentes',
      status: 'ACTIVO',
      created_at: '2024-01-15T10:00:00.000Z',
      updated_at: '2026-08-25T10:00:00.000Z',
    },
    {
      id: 'CUS-002',
      customer_number: 'CLI-000002',
      company_name: 'Constructora e Instalaciones HVAC del Bajío',
      contact_name: 'Arq. Brenda Ortiz',
      phone: '+52 44 2210 9933',
      email: 'bortiz@hvacbajio.mx',
      address: 'Paseo de la República 1050, Juriquilla',
      city: 'Querétaro',
      state: 'Querétaro',
      tax_id: 'CIH150820MN2',
      credit_limit: 250000.00,
      credit_status: 'VENCIDO',
      current_balance: 54000.00,
      assigned_salesperson_id: 'USR-003',
      assigned_salesperson_name: 'Ing. Roberto Fuentes',
      status: 'ACTIVO',
      created_at: '2024-02-20T10:00:00.000Z',
      updated_at: '2026-08-25T10:00:00.000Z',
    },
    {
      id: 'CUS-003',
      customer_number: 'CLI-000003',
      company_name: 'Ingeniería Química de Fluidos de México S.A.',
      contact_name: 'Dr. Alejandro Peña',
      phone: '+52 55 5729 0044',
      email: 'apena@iqfluidos.com',
      address: 'Calzada Vallejo 980, Industrial Vallejo',
      city: 'Ciudad de México',
      state: 'CDMX',
      tax_id: 'IQF070315PP9',
      credit_limit: 800000.00,
      credit_status: 'CORRIENTE',
      current_balance: 195600.00,
      assigned_salesperson_id: 'USR-002',
      assigned_salesperson_name: 'Lic. Laura Salinas',
      status: 'ACTIVO',
      created_at: '2024-03-01T10:00:00.000Z',
      updated_at: '2026-08-25T10:00:00.000Z',
    },
  ];

  // Quotes
  const quotes: Quote[] = [
    {
      id: 'QUO-001',
      quote_number: 'COT-000001',
      customer_id: 'CUS-001',
      customer_name: 'Termoaislantes y Climas Industriales S.A. de C.V.',
      salesperson_id: 'USR-003',
      salesperson_name: 'Ing. Roberto Fuentes',
      quote_date: '2026-08-20',
      expiration_date: '2026-09-04',
      status: 'EN_NEGOCIACION',
      subtotal: 122844.83,
      discount: 0,
      tax: 19655.17,
      total: 142500.00,
      notes: 'Proyecto Aislamiento Planta Galvano Norte. Entrega en 3 días hábiles.',
      items: [
        {
          id: 'QIT-01',
          quote_id: 'QUO-001',
          product_id: 'PRD-01',
          product_code: 'LM-200',
          product_name: 'Lana Mineral de Roca Colchoneta 2"',
          unit: 'M2',
          quantity: 250,
          unit_price: 215.00,
          discount: 5,
          subtotal: 51062.50,
        },
        {
          id: 'QIT-02',
          quote_id: 'QUO-001',
          product_id: 'PRD-05',
          product_code: 'ALU-016',
          product_name: 'Chaqueta de Aluminio Estucado Calibre 0.016"',
          unit: 'ROLLO',
          quantity: 25,
          unit_price: 2950.00,
          discount: 2,
          subtotal: 72275.00,
        },
      ],
      created_at: '2026-08-20T11:00:00.000Z',
      updated_at: '2026-08-20T11:00:00.000Z',
    },
    {
      id: 'QUO-002',
      quote_number: 'COT-000002',
      customer_id: 'CUS-003',
      customer_name: 'Ingeniería Química de Fluidos de México S.A.',
      salesperson_id: 'USR-002',
      salesperson_name: 'Lic. Laura Salinas',
      quote_date: '2026-08-24',
      expiration_date: '2026-09-08',
      status: 'ACEPTADA',
      subtotal: 76896.55,
      discount: 0,
      tax: 12303.45,
      total: 89200.00,
      notes: 'Requiere certificados de calidad ASTM C547 y ficha técnica ASJ.',
      converted_to_order_id: 'ORD-001',
      converted_to_order_number: 'PED-000001',
      items: [
        {
          id: 'QIT-03',
          quote_id: 'QUO-002',
          product_id: 'PRD-02',
          product_code: 'PFV-201',
          product_name: 'Preformado Fibra de Vidrio para Tubería 2" x 1"',
          unit: 'TRAMO',
          quantity: 200,
          unit_price: 138.00,
          discount: 0,
          subtotal: 27600.00,
        },
        {
          id: 'QIT-04',
          quote_id: 'QUO-002',
          product_id: 'PRD-04',
          product_code: 'FVD-150',
          product_name: 'Colchoneta Fibra de Vidrio para Ductos 1.5"',
          unit: 'M2',
          quantity: 400,
          unit_price: 132.00,
          discount: 3,
          subtotal: 51216.00,
        },
      ],
      created_at: '2026-08-24T09:30:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
    },
  ];

  // Orders
  const orders: Order[] = [
    {
      id: 'ORD-UAT-PICK-001',
      order_number: 'PED-UAT-PICK-001',
      quote_id: 'QUO-001',
      quote_number: 'COT-UAT-001',
      customer_id: 'CUS-001',
      customer_name: 'Aislamientos Industriales de Toluca S.A. de C.V.',
      salesperson_id: 'USR-003',
      salesperson_name: 'Ing. Roberto Fuentes',
      warehouse_id: 'WH-01',
      warehouse_name: 'Almacén Central Tlalnepantla',
      status: 'RESERVADO',
      subtotal: 2500.00,
      discount: 0,
      tax: 400.00,
      total: 2900.00,
      delivery_date: '2026-09-08',
      delivery_address: 'Planta Toluca, Parque Industrial 2000, Edo. Méx.',
      payment_terms: 'Contado',
      notes: 'Pedido de prueba UAT para validación de picking real y editable.',
      items: [
        {
          id: 'OIT-UAT-01',
          order_id: 'ORD-UAT-PICK-001',
          product_id: 'PRD-01',
          product_code: 'LM-200',
          product_name: 'Lana Mineral de Roca Colchoneta 2"',
          unit: 'M2',
          quantity: 10,
          unit_price: 250.00,
          subtotal: 2500.00,
        },
      ],
      created_at: '2026-09-05T10:00:00.000Z',
      updated_at: '2026-09-05T10:00:00.000Z',
    },
    {
      id: 'ORD-001',
      order_number: 'PED-000001',
      quote_id: 'QUO-002',
      quote_number: 'COT-000002',
      customer_id: 'CUS-003',
      customer_name: 'Ingeniería Química de Fluidos de México S.A.',
      salesperson_id: 'USR-002',
      salesperson_name: 'Lic. Laura Salinas',
      warehouse_id: 'WH-01',
      warehouse_name: 'Almacén Central Tlalnepantla',
      status: 'RESERVADO',
      subtotal: 76896.55,
      discount: 0,
      tax: 12303.45,
      total: 89200.00,
      delivery_date: '2026-08-28',
      delivery_address: 'Calzada Vallejo 980, Industrial Vallejo, CDMX',
      payment_terms: 'Crédito 30 días',
      notes: 'Pedido confirmado. Stock reservado en Almacén Central.',
      items: [
        {
          id: 'OIT-01',
          order_id: 'ORD-001',
          product_id: 'PRD-02',
          product_code: 'PFV-201',
          product_name: 'Preformado Fibra de Vidrio para Tubería 2" x 1"',
          unit: 'TRAMO',
          quantity: 200,
          unit_price: 138.00,
          subtotal: 27600.00,
        },
        {
          id: 'OIT-02',
          order_id: 'ORD-001',
          product_id: 'PRD-04',
          product_code: 'FVD-150',
          product_name: 'Colchoneta Fibra de Vidrio para Ductos 1.5"',
          unit: 'M2',
          quantity: 400,
          unit_price: 128.04,
          subtotal: 51216.00,
        },
      ],
      created_at: '2026-08-25T08:00:00.000Z',
      updated_at: '2026-08-25T08:00:00.000Z',
    },
  ];

  // Inventory Movements
  const inventory_movements: InventoryMovement[] = [
    {
      id: 'MOV-000001',
      product_id: 'PRD-01',
      product_code: 'LM-200',
      product_name: 'Lana Mineral de Roca Colchoneta 2"',
      warehouse_id: 'WH-01',
      warehouse_name: 'Almacén Central Tlalnepantla',
      type: 'ENTRADA',
      quantity: 200,
      previous_balance: 0,
      new_balance: 200,
      reason: 'Recepción de embarque inicial de proveedor Saint-Gobain',
      reference_type: 'ORDEN_COMPRA',
      reference_folio: 'OC-1008',
      created_by: 'USR-004',
      created_by_name: 'Mtro. Fernando Garza',
      created_at: '2026-08-15T09:00:00.000Z',
    },
    {
      id: 'MOV-000002',
      product_id: 'PRD-02',
      product_code: 'PFV-201',
      product_name: 'Preformado Fibra de Vidrio para Tubería 2" x 1"',
      warehouse_id: 'WH-01',
      warehouse_name: 'Almacén Central Tlalnepantla',
      type: 'RESERVA',
      quantity: 10,
      previous_balance: 28,
      new_balance: 18,
      reason: 'Reserva automática por pedido PED-000001',
      reference_type: 'PEDIDO',
      reference_id: 'ORD-001',
      reference_folio: 'PED-000001',
      created_by: 'USR-002',
      created_by_name: 'Lic. Laura Salinas',
      created_at: '2026-08-25T08:00:00.000Z',
    },
  ];

  // Audit Logs
  const audit_logs: AuditLog[] = [
    {
      id: 'AUD-000001',
      user_id: 'USR-001',
      user_name: 'Ing. Carlos Mendoza',
      user_role: 'ADMINISTRADOR',
      module: 'CONFIGURACION',
      action: 'SISTEMA_INICIALIZADO',
      entity_type: 'SYSTEM',
      entity_id: 'CONSCORE_CORE',
      new_value: 'Instalación y verificación de esquema empresarial Fase 0.1 completada',
      created_at: '2026-08-25T07:00:00.000Z',
    },
    {
      id: 'AUD-000002',
      user_id: 'USR-002',
      user_name: 'Lic. Laura Salinas',
      user_role: 'GERENTE_VENTAS',
      module: 'PEDIDOS',
      action: 'CONVERSION_COTIZACION_A_PEDIDO',
      entity_type: 'ORDER',
      entity_id: 'PED-000001',
      previous_value: 'COT-000002 (ACEPTADA)',
      new_value: 'PED-000001 ($89,200.00 MXN) con reserva de inventario',
      created_at: '2026-08-25T08:00:00.000Z',
    },
  ];

  // Notifications
  const notifications: NotificationItem[] = [
    {
      id: 'NOT-001',
      title: 'Pedido Generado con Éxito',
      message: 'Se generó el pedido PED-000001 para Ingeniería Química de Fluidos. Inventario reservado.',
      type: 'EXITO',
      module: 'PEDIDOS',
      read: false,
      created_at: '2026-08-25T08:00:00.000Z',
    },
    {
      id: 'NOT-002',
      title: 'Alerta de Inventario Crítico',
      message: 'Preformado Fibra de Vidrio (PFV-201) disponible: 18 tramos. Por debajo del mínimo (50).',
      type: 'CRITICA',
      module: 'INVENTARIO',
      read: false,
      created_at: '2026-08-25T08:30:00.000Z',
    },
  ];

  const company_config: CompanyConfig = {
    company_name: 'CONSCORE Aislamientos Industriales S.A. de C.V.',
    trade_name: 'CONSCORE ERP IA',
    tax_id: 'CAI180614TX9',
    currency: 'MXN',
    tax_rate: 0.16,
    address: 'Av. Gustavo Baz 2160, San Pedro Barrientos, Tlalnepantla, Estado de México, CP 54010',
    phone: '+52 55 4122 8900',
    email: 'contacto@conscore.com.mx',
    website: 'https://conscore.com.mx',
    auto_reserve_on_order: true,
    allow_negative_stock: false, // Strict Rule: No negative available stock!
    sellerMaxDiscountPercent: 5,
    maxDiscountSalesperson: 5,
  };

  const commercial_settings: CommercialSettings = {
    sellerMaxDiscountPercent: 5,
    minGrossMarginPct: 18,
    managerMaxDiscountPercent: 10,
  };

  const supplier_prices: SupplierPriceRecord[] = [
    {
      id: 'SP-001',
      product_id: 'PRD-01',
      sku: 'LM-ROC-200',
      supplier_id: 'PRV-01',
      supplier_name: 'Aislantes Minerales de México S.A. de C.V.',
      unit_cost: 145.00,
      lead_time_days: 5,
      currency: 'MXN',
      payment_terms: 'Crédito 30 días',
    },
    {
      id: 'SP-002',
      product_id: 'PRD-02',
      sku: 'FV-DUC-150',
      supplier_id: 'PRV-02',
      supplier_name: 'Owens Corning México',
      unit_cost: 92.50,
      lead_time_days: 3,
      currency: 'MXN',
      payment_terms: 'Crédito 45 días',
    },
    {
      id: 'SP-003',
      product_id: 'PRD-03',
      sku: 'XP-RIG-100',
      supplier_id: 'PRV-03',
      supplier_name: 'Foamular Distribuciones Industriales',
      unit_cost: 185.00,
      lead_time_days: 7,
      currency: 'MXN',
      payment_terms: 'Contado 5% desc.',
    },
    {
      id: 'SP-004',
      product_id: 'PRD-04',
      sku: 'CN-AIS-075',
      supplier_id: 'PRV-01',
      supplier_name: 'Aislantes Minerales de México S.A. de C.V.',
      unit_cost: 68.00,
      lead_time_days: 4,
      currency: 'MXN',
      payment_terms: 'Crédito 30 días',
    },
    {
      id: 'SP-005',
      product_id: 'PRD-05',
      sku: 'AL-CHA-020',
      supplier_id: 'PRV-04',
      supplier_name: 'Metales y Recubrimientos del Norte',
      unit_cost: 310.00,
      lead_time_days: 10,
      currency: 'MXN',
      payment_terms: 'Crédito 15 días',
    },
  ];

  const purchase_requests: PurchaseRequest[] = [
    {
      id: 'PR-2026-001',
      request_number: 'SC-2026-001',
      requested_by: 'USR-005',
      requested_by_name: 'Mtro. Fernando Garza',
      requestedByUserId: 'USR-005',
      requestedByUserName: 'Mtro. Fernando Garza',
      requestedByRole: 'ALMACEN',
      requestedAt: '2026-08-25T10:30:00.000Z',
      department: 'Almacén & Logística',
      warehouse_id: 'WAR-01',
      warehouseId: 'WAR-01',
      warehouse_name: 'Almacén Central Tlalnepantla',
      warehouseName: 'Almacén Central Tlalnepantla',
      productId: 'PRD-01',
      sku: 'LM-ROC-200',
      requestedQty: 100,
      priority: 'ALTA',
      justification: 'Stock por debajo de nivel mínimo de seguridad para caldera industrial',
      reason: 'STOCK_MINIMO',
      observations: 'Requerido para reabastecimiento crítico semanal',
      status: 'PENDIENTE',
      required_date: '2026-09-10',
      items: [
        {
          id: 'PRI-001',
          request_id: 'PR-2026-001',
          product_id: 'PRD-01',
          product_code: 'LM-200',
          product_name: 'Lana Mineral de Roca Colchoneta 2" (Densidad 64 kg/m³)',
          unit: 'M2',
          quantity: 100,
        },
      ],
      masterTransactionId: 'MTX-PR-2026-0001',
      created_at: '2026-08-25T10:30:00.000Z',
      origin: 'ALMACEN',
    },
  ];

  const purchase_orders: PurchaseOrder[] = [];

  return {
    users,
    roles,
    permissions,
    role_permissions,
    departments,
    positions,
    shifts,
    employees,
    confidential_data,
    customers,
    product_categories,
    products,
    warehouses,
    inventory,
    inventory_movements,
    quotes,
    quote_items: quotes.flatMap(q => q.items),
    orders,
    order_items: orders.flatMap(o => o.items),
    purchase_requests,
    purchase_orders,
    supplier_prices,
    audit_logs,
    notifications,
    company_config,
    commercial_settings,
    pods: [],
    pickings: [],
    routes: [],
    counters: {
      customer_seq: 3,
      quote_seq: 2,
      order_seq: 1,
      movement_seq: 2,
      audit_seq: 2,
      purchase_request_seq: 1,
      purchase_order_seq: 0,
    },
  };
}

export class Database {
  private data: DatabaseSchema;
  private isWriting = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        if (!content.trim()) {
          // Archivo presente pero vacio (caso tipico al clonar el repo):
          // se siembra sin ensuciar el log con una traza de excepcion.
          console.info('[DB] Base de datos vacia. Generando datos iniciales.');
          const freshSeed = getInitialSeedData();
          this.persistSync(freshSeed);
          return freshSeed;
        }
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.users)) {
          // Normalize usernames and ensure vendors exist
          parsed.users.forEach((u: any) => {
            if (!u.username) {
              u.username = (u.email ? u.email.split('@')[0] : u.id.toLowerCase()).replace(/[^a-zA-Z0-9_]/g, '');
            }
          });
          const seed = getInitialSeedData();
          seed.users.forEach((su) => {
            if (!parsed.users.some((u: any) => u.id === su.id)) {
              parsed.users.push(su);
            }
          });

          // Ensure collections exist
          parsed.purchase_requests = parsed.purchase_requests || seed.purchase_requests;
          parsed.purchase_orders = parsed.purchase_orders || [];
          parsed.supplier_prices = parsed.supplier_prices || seed.supplier_prices;
          parsed.counters = parsed.counters || seed.counters;
          if (!parsed.counters.purchase_request_seq) parsed.counters.purchase_request_seq = 1;
          if (parsed.counters.purchase_order_seq === undefined) parsed.counters.purchase_order_seq = 0;

          // Strict SoD: sanitize role_permissions in persisted file
          if (parsed.role_permissions && Array.isArray(parsed.role_permissions)) {
            const allPerms = parsed.permissions || seed.permissions;
            const comprasPermIds = allPerms.filter((p: any) => p.module === 'COMPRAS').map((p: any) => p.id);
            // Strip COMPRAS from ROL-06 (Almacén)
            parsed.role_permissions = parsed.role_permissions.filter(
              (rp: any) => !(rp.role_id === 'ROL-06' && comprasPermIds.includes(rp.permission_id))
            );
            // Ensure ROL-08 has COMPRAS
            comprasPermIds.forEach((cId: string) => {
              if (!parsed.role_permissions.some((rp: any) => rp.role_id === 'ROL-08' && rp.permission_id === cId)) {
                parsed.role_permissions.push({ role_id: 'ROL-08', permission_id: cId });
              }
            });
          }

          // Ensure opportunities exist
          if (!parsed.opportunities || !Array.isArray(parsed.opportunities) || parsed.opportunities.length === 0) {
            parsed.opportunities = [...INITIAL_OPPORTUNITIES];
          }
          if (!parsed.counters.opportunity_seq) {
            parsed.counters.opportunity_seq = parsed.opportunities.length;
          }

          // Ensure leads exist
          if (!parsed.leads || !Array.isArray(parsed.leads) || parsed.leads.length === 0) {
            parsed.leads = [...INITIAL_LEADS];
          }

          // Ensure all 10 sales executives have their customers in the database
          if (!parsed.customers || parsed.customers.length < 10) {
            parsed.customers = parsed.customers || [];
            const existingIds = new Set(parsed.customers.map((c: any) => c.id));
            INITIAL_CUSTOMERS.forEach((ic: any) => {
              if (!existingIds.has(ic.id)) {
                parsed.customers.push({
                  id: ic.id,
                  customer_number: ic.code,
                  company_name: ic.businessName,
                  contact_name: ic.contactName,
                  phone: ic.phone,
                  email: ic.email,
                  address: ic.address,
                  city: ic.city,
                  state: ic.state,
                  tax_id: ic.rfc,
                  credit_limit: ic.creditLimit,
                  credit_status: 'CORRIENTE',
                  current_balance: ic.currentBalance,
                  assigned_salesperson_id: ic.sellerId,
                  assigned_salesperson_name: ic.sellerName,
                  salesExecutiveId: ic.salesExecutiveId,
                  sales_executive_id: ic.salesExecutiveId,
                  assignedSalesExecutiveId: ic.salesExecutiveId,
                  status: 'ACTIVO',
                  created_at: '2024-01-15T10:00:00.000Z',
                  updated_at: '2026-08-25T10:00:00.000Z',
                });
              }
            });
          }

          // Normalize salesExecutiveId on all customers
          parsed.customers.forEach((c: any, idx: number) => {
            if (!c.salesExecutiveId) {
              const execCode = `VENDEDOR_${String((idx % 10) + 1).padStart(2, '0')}`;
              c.salesExecutiveId = execCode;
              c.sales_executive_id = execCode;
              c.assignedSalesExecutiveId = execCode;
            }
          });

          // Normalize salesExecutiveId on all quotes
          if (parsed.quotes && Array.isArray(parsed.quotes)) {
            parsed.quotes.forEach((q: any, idx: number) => {
              if (!q.salesExecutiveId) {
                const execCode = `VENDEDOR_${String((idx % 10) + 1).padStart(2, '0')}`;
                q.salesExecutiveId = execCode;
                q.sales_executive_id = execCode;
              }
            });
          }

          // Normalize salesExecutiveId on all orders
          if (parsed.orders && Array.isArray(parsed.orders)) {
            parsed.orders.forEach((o: any, idx: number) => {
              if (!o.salesExecutiveId) {
                const execCode = `VENDEDOR_${String((idx % 10) + 1).padStart(2, '0')}`;
                o.salesExecutiveId = execCode;
                o.sales_executive_id = execCode;
              }
            });
          }

          // Hotfix 07: Ensure canonical test product PRD-TEST-PRICE-001 exists in database
          if (!parsed.products.some((p: any) => p.sku === 'TEST-PRICE-001' || p.code === 'TEST-PRICE-001')) {
            parsed.products.push({
              id: 'PRD-TEST-PRICE-001',
              sku: 'TEST-PRICE-001',
              code: 'TEST-PRICE-001',
              name: 'Aislante Térmico Test Hotfix 07 (Precio Lista 100)',
              description: 'Producto estándar para validaciones de precio de lista y control de descuento.',
              category_id: 'CAT-01',
              category_name: 'Lana Mineral de Roca',
              unit: 'PZA',
              cost: 60.00,
              sale_price: 100.00,
              salePrice: 100.00,
              price: 100.00,
              list_price: 100.00,
              listPrice: 100.00,
              minimum_stock: 50,
              maximum_stock: 500,
              status: 'ACTIVO',
              physical_stock: 200,
              reserved_stock: 10,
              available_stock: 190,
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-01T00:00:00.000Z',
            });
          }

          // Hotfix 07: Initialize discount_approvals array
          if (!parsed.discount_approvals || !Array.isArray(parsed.discount_approvals)) {
            parsed.discount_approvals = [];
          }

          // Observación 15: Initialize product_returns array
          if (!parsed.product_returns || !Array.isArray(parsed.product_returns)) {
            parsed.product_returns = [];
          }

          // Observación 15: Ensure canonical test product SKU-TEST-015 exists with physical stock 20
          let testProd015 = parsed.products.find((p: any) => p.sku === 'SKU-TEST-015' || p.code === 'SKU-TEST-015' || p.id === 'PROD-TEST-015');
          if (!testProd015) {
            parsed.products.push({
              id: 'PROD-TEST-015',
              sku: 'SKU-TEST-015',
              code: 'SKU-TEST-015',
              name: 'Panel Aislante Térmico Foamular 2" (Obs 15 Test SKU)',
              description: 'Panel de alta densidad para aislamiento térmico industrial. Control estricto de devoluciones.',
              category_id: 'CAT-01',
              category_name: 'Lana Mineral de Roca',
              unit: 'PZA',
              cost: 450.00,
              sale_price: 680.00,
              salePrice: 680.00,
              price: 680.00,
              list_price: 680.00,
              listPrice: 680.00,
              minimum_stock: 10,
              maximum_stock: 100,
              status: 'ACTIVO',
              physical_stock: 20,
              reserved_stock: 0,
              available_stock: 20,
              physicalStock: 20,
              availableStock: 20,
              warehouse_id: 'WH-01',
              warehouseId: 'WH-01',
              warehouse_name: 'Almacén Central Tlalnepantla',
              warehouseName: 'Almacén Central Tlalnepantla',
              warehouse_location: 'DEV-A01',
              warehouseLocation: 'DEV-A01',
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-01T00:00:00.000Z',
            });
          }

          // Observación 20: Ensure canonical test product SKU-TEST-020 exists (Físico: 20, Reservado: 5, Disponible: 15)
          let testProd020 = parsed.products.find((p: any) => p.sku === 'SKU-TEST-020' || p.code === 'SKU-TEST-020' || p.id === 'PROD-TEST-020');
          if (!testProd020) {
            parsed.products.push({
              id: 'PROD-TEST-020',
              sku: 'SKU-TEST-020',
              code: 'SKU-TEST-020',
              name: 'Aislante Térmico Industrial Test 020',
              description: 'Material de prueba certificado para verificación de respaldo y exportación a Excel.',
              category_id: 'CAT-01',
              category_name: 'Lana Mineral de Roca',
              categoryName: 'Lana Mineral de Roca',
              category: 'Lana Mineral de Roca',
              unit: 'PZA',
              cost: 350.00,
              sale_price: 550.00,
              salePrice: 550.00,
              price: 550.00,
              list_price: 550.00,
              listPrice: 550.00,
              minimum_stock: 5,
              maximum_stock: 50,
              minStock: 5,
              maxStock: 50,
              status: 'ACTIVO',
              physical_stock: 20,
              reserved_stock: 5,
              available_stock: 15,
              physicalStock: 20,
              reservedStock: 5,
              availableStock: 15,
              stock: 20,
              warehouse_id: 'WH-01',
              warehouseId: 'WH-01',
              warehouse_name: 'Almacén Central CEDIS',
              warehouseName: 'Almacén Central CEDIS',
              warehouse_location: 'N1 / R-01 / P-01 / Niv-01',
              warehouseLocation: 'N1 / R-01 / P-01 / Niv-01',
              supplier_id: 'SUP-01',
              supplierId: 'SUP-01',
              supplier_name: 'Termoaislantes Mexicanos S.A.',
              supplierName: 'Termoaislantes Mexicanos S.A.',
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-09T00:00:00.000Z',
            });
          } else {
            testProd020.physical_stock = 20;
            testProd020.physicalStock = 20;
            testProd020.stock = 20;
            testProd020.reserved_stock = 5;
            testProd020.reservedStock = 5;
            testProd020.available_stock = 15;
            testProd020.availableStock = 15;
          }

          // Observación 20: Ensure canonical multi-warehouse product SKU-TEST-MULTI exists (CEDIS A: 10, CEDIS B: 7)
          let testProdMulti = parsed.products.find((p: any) => p.sku === 'SKU-TEST-MULTI' || p.code === 'SKU-TEST-MULTI' || p.id === 'PROD-TEST-MULTI');
          if (!testProdMulti) {
            parsed.products.push({
              id: 'PROD-TEST-MULTI',
              sku: 'SKU-TEST-MULTI',
              code: 'SKU-TEST-MULTI',
              name: 'Placa Aislante Multi-Almacén',
              description: 'Aislamiento térmico distribuido en múltiples almacenes (CEDIS A y CEDIS B).',
              category_id: 'CAT-01',
              category_name: 'Aislamientos Térmicos',
              categoryName: 'Aislamientos Térmicos',
              category: 'Aislamientos Térmicos',
              unit: 'PZA',
              cost: 280.00,
              sale_price: 430.00,
              salePrice: 430.00,
              price: 430.00,
              list_price: 430.00,
              listPrice: 430.00,
              minimum_stock: 5,
              maximum_stock: 50,
              minStock: 5,
              maxStock: 50,
              status: 'ACTIVO',
              physical_stock: 17,
              reserved_stock: 0,
              available_stock: 17,
              physicalStock: 17,
              reservedStock: 0,
              availableStock: 17,
              stock: 17,
              warehouse_id: 'WH-01',
              warehouseId: 'WH-01',
              warehouse_name: 'CEDIS A',
              warehouseName: 'CEDIS A',
              warehouse_location: 'RACK-A01',
              warehouseLocation: 'RACK-A01',
              supplier_id: 'SUP-02',
              supplierId: 'SUP-02',
              supplier_name: 'Aislantes Industriales del Norte',
              supplierName: 'Aislantes Industriales del Norte',
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-09T00:00:00.000Z',
              warehouseLocations: [
                {
                  warehouseId: 'WH-01',
                  warehouseName: 'CEDIS A',
                  locationCode: 'RACK-A01',
                  nave: 'N1',
                  rack: 'RACK-A01',
                  pasillo: 'P-01',
                  nivel: 'Niv-01',
                  stock: 10,
                  physicalStock: 10,
                  reservedStock: 0,
                  availableStock: 10,
                },
                {
                  warehouseId: 'WH-02',
                  warehouseName: 'CEDIS B',
                  locationCode: 'RACK-B02',
                  nave: 'N2',
                  rack: 'RACK-B02',
                  pasillo: 'P-02',
                  nivel: 'Niv-01',
                  stock: 7,
                  physicalStock: 7,
                  reservedStock: 0,
                  availableStock: 7,
                },
              ],
            });
          }

          // Observación 21: Ensure canonical test product SKU-TEST-021 exists (Físico: 20, RACK-A01: 20, RACK-B01: 30)
          let testProd021 = parsed.products.find((p: any) => p.sku === 'SKU-TEST-021' || p.code === 'SKU-TEST-021' || p.id === 'PROD-TEST-021');
          if (!testProd021) {
            parsed.products.push({
              id: 'PROD-TEST-021',
              sku: 'SKU-TEST-021',
              code: 'SKU-TEST-021',
              name: 'Aislante Térmico Industrial Test 021',
              description: 'Material de prueba para verificación del flujo desacoplado de Ajustes y Merma (Observación 21).',
              category_id: 'CAT-01',
              category_name: 'Aislamientos Térmicos',
              categoryName: 'Aislamientos Térmicos',
              category: 'Aislamientos Térmicos',
              unit: 'PZA',
              cost: 320.00,
              sale_price: 500.00,
              salePrice: 500.00,
              price: 500.00,
              list_price: 500.00,
              listPrice: 500.00,
              minimum_stock: 5,
              maximum_stock: 50,
              minStock: 5,
              maxStock: 50,
              status: 'ACTIVO',
              physical_stock: 20,
              reserved_stock: 0,
              available_stock: 20,
              physicalStock: 20,
              reservedStock: 0,
              availableStock: 20,
              stock: 20,
              warehouse_id: 'WH-01',
              warehouseId: 'WH-01',
              warehouse_name: 'CEDIS PRINCIPAL',
              warehouseName: 'CEDIS PRINCIPAL',
              warehouse_location: 'RACK-A01',
              warehouseLocation: 'RACK-A01',
              supplier_id: 'SUP-01',
              supplierId: 'SUP-01',
              supplier_name: 'Termoaislantes Mexicanos S.A.',
              supplierName: 'Termoaislantes Mexicanos S.A.',
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-09T00:00:00.000Z',
              warehouseLocations: [
                {
                  warehouseId: 'WH-01',
                  warehouseName: 'CEDIS PRINCIPAL',
                  locationCode: 'RACK-A01',
                  nave: 'N1',
                  rack: 'RACK-A01',
                  pasillo: 'P-01',
                  nivel: 'Niv-01',
                  stock: 20,
                  physicalStock: 20,
                  reservedStock: 0,
                  availableStock: 20,
                },
                {
                  warehouseId: 'WH-01',
                  warehouseName: 'CEDIS PRINCIPAL',
                  locationCode: 'RACK-B01',
                  nave: 'N1',
                  rack: 'RACK-B01',
                  pasillo: 'P-02',
                  nivel: 'Niv-01',
                  stock: 30,
                  physicalStock: 30,
                  reservedStock: 0,
                  availableStock: 30,
                },
              ],
            });
          }

          // Observación 15: Ensure canonical delivered order PED-TEST-015 exists
          let testOrder015 = parsed.orders.find((o: any) => o.order_number === 'PED-TEST-015' || o.folio === 'PED-TEST-015' || o.id === 'ORD-TEST-015');
          if (!testOrder015) {
            parsed.orders.push({
              id: 'ORD-TEST-015',
              order_number: 'PED-TEST-015',
              folio: 'PED-TEST-015',
              customer_id: 'CUS-001',
              customerId: 'CUS-001',
              customer_name: 'Termoaislantes y Climas Industriales S.A. de C.V.',
              customerName: 'Termoaislantes y Climas Industriales S.A. de C.V.',
              sales_executive_id: 'USR-002',
              salesExecutiveId: 'USR-002',
              status: 'ENTREGADO',
              delivery_status: 'ENTREGADO',
              total_amount: 6800.00,
              currency: 'MXN',
              master_transaction_id: 'MTX-PED-TEST-015',
              masterTransactionId: 'MTX-PED-TEST-015',
              created_at: '2026-09-01T10:00:00.000Z',
              updated_at: '2026-09-01T12:00:00.000Z',
              items: [
                {
                  id: 'ITEM-TEST-015',
                  order_id: 'ORD-TEST-015',
                  product_id: 'PROD-TEST-015',
                  productId: 'PROD-TEST-015',
                  sku: 'SKU-TEST-015',
                  product_code: 'SKU-TEST-015',
                  productCode: 'SKU-TEST-015',
                  product_name: 'Panel Aislante Térmico Foamular 2" (Obs 15 Test SKU)',
                  productName: 'Panel Aislante Térmico Foamular 2" (Obs 15 Test SKU)',
                  quantity: 10,
                  delivered_quantity: 10,
                  deliveredQuantity: 10,
                  deliveredQty: 10,
                  unit_price: 680.00,
                  unitPrice: 680.00,
                  unit: 'PZA',
                }
              ]
            });
          }

          // Observación 17: Initialize service_cases array
          if (!parsed.service_cases || !Array.isArray(parsed.service_cases) || parsed.service_cases.length === 0) {
            parsed.service_cases = [...INITIAL_SERVICE_TICKETS];
          }
          if (parsed.counters.service_case_seq === undefined) {
            parsed.counters.service_case_seq = parsed.service_cases.length;
          }

          // Ensure SERVICIO permissions exist in parsed.permissions and parsed.role_permissions
          if (parsed.permissions && Array.isArray(parsed.permissions)) {
            const acts = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'AUTHORIZE', 'EXPORT'] as const;
            acts.forEach(act => {
              if (!parsed.permissions.some((p: any) => p.module === 'SERVICIO' && p.action === act)) {
                parsed.permissions.push({
                  id: `PERM-SRV-${act}`,
                  module: 'SERVICIO',
                  action: act,
                  description: `Permiso para ${act} en módulo SERVICIO`,
                });
              }
            });

            if (parsed.role_permissions && Array.isArray(parsed.role_permissions)) {
              const srvPerms = parsed.permissions.filter((p: any) => p.module === 'SERVICIO');
              const srvPermMap = Object.fromEntries(srvPerms.map((p: any) => [p.action, p.id]));

              const grantRoleSrv = (roleId: string, actionsToGrant: string[]) => {
                actionsToGrant.forEach(act => {
                  const permId = srvPermMap[act];
                  if (permId && !parsed.role_permissions.some((rp: any) => rp.role_id === roleId && rp.permission_id === permId)) {
                    parsed.role_permissions.push({ role_id: roleId, permission_id: permId });
                  }
                });
              };

              grantRoleSrv('ROL-01', ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'AUTHORIZE', 'EXPORT']);
              grantRoleSrv('ROL-02', ['VIEW', 'AUTHORIZE', 'EXPORT']);
              grantRoleSrv('ROL-03', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
              grantRoleSrv('ROL-04', ['VIEW', 'CREATE', 'EDIT']);
              grantRoleSrv('ROL-06', ['VIEW', 'EDIT']);
              grantRoleSrv('ROL-07', ['VIEW', 'EDIT']);
              grantRoleSrv('ROL-13', ['VIEW', 'EDIT']);
            }
          }

          // Ensure RH permissions and mappings exist (Observación 18)
          if (parsed.permissions && Array.isArray(parsed.permissions)) {
            const rhActs = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'AUTHORIZE', 'EXPORT'] as const;
            rhActs.forEach(act => {
              if (!parsed.permissions.some((p: any) => p.module === 'RH' && p.action === act)) {
                parsed.permissions.push({
                  id: `PERM-RH-${act}`,
                  module: 'RH',
                  action: act,
                  description: `Permiso para ${act} en módulo RH`,
                });
              }
            });

            if (parsed.role_permissions && Array.isArray(parsed.role_permissions)) {
              const rhPerms = parsed.permissions.filter((p: any) => p.module === 'RH');
              const rhPermMap = Object.fromEntries(rhPerms.map((p: any) => [p.action, p.id]));

              const grantRoleRH = (roleId: string, actionsToGrant: string[]) => {
                actionsToGrant.forEach(act => {
                  const permId = rhPermMap[act];
                  if (permId && !parsed.role_permissions.some((rp: any) => rp.role_id === roleId && rp.permission_id === permId)) {
                    parsed.role_permissions.push({ role_id: roleId, permission_id: permId });
                  }
                });
              };

              grantRoleRH('ROL-01', ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'AUTHORIZE', 'EXPORT']);
              grantRoleRH('ROL-02', ['VIEW', 'AUTHORIZE', 'EXPORT']);
              grantRoleRH('ROL-03', ['VIEW']);
              grantRoleRH('ROL-09', ['VIEW', 'CREATE', 'EDIT', 'AUTHORIZE', 'EXPORT']);
              grantRoleRH('ROL-10', ['VIEW']);
            }
          }

          // Ensure RH User USR-011 exists
          if (parsed.users && !parsed.users.some((u: any) => u.role === 'RH' || u.id === 'USR-011')) {
            // Se usa hashPassword (10000 iteraciones) para que coincida con
            // verifyPassword. Con las 1000 iteraciones anteriores este usuario
            // quedaba creado pero nunca podia iniciar sesion.
            const salt = generateSalt();
            const defaultPasswordHash = hashPassword(seedPassword(), salt);
            parsed.users.push({
              id: 'USR-011',
              name: 'Lic. Patricia Valenzuela',
              username: 'rh',
              email: 'rh@conscore.com.mx',
              role_id: 'ROL-09',
              role: 'RH',
              employee_id: 'EMP-011',
              status: 'ACTIVO',
              created_at: '2026-01-01T08:00:00.000Z',
              updated_at: '2026-08-25T08:00:00.000Z',
              password_hash: defaultPasswordHash,
              salt,
            });
          }

          // Ensure employees has at least INITIAL_EMPLOYEES_20
          if (!parsed.employees || parsed.employees.length < 10) {
            parsed.employees = [...INITIAL_EMPLOYEES_20];
          }

          if (!parsed.confidential_data) {
            parsed.confidential_data = { ...INITIAL_CONFIDENTIAL_DATA };
          }

          if (!parsed.positions) {
            parsed.positions = [...INITIAL_POSITIONS];
          }

          if (!parsed.shifts) {
            parsed.shifts = [...INITIAL_SHIFTS];
          }

          if (!parsed.inventory_adjustments) {
            parsed.inventory_adjustments = [];
          }

          if (!parsed.counters) {
            parsed.counters = { customer_seq: 1, quote_seq: 1, order_seq: 1, movement_seq: 1, audit_seq: 1 };
          }
          if (!parsed.counters.adjustment_seq) {
            parsed.counters.adjustment_seq = 1;
          }

          this.persistSync(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.error('[DB] Error cargando base de datos persistente, regenerando seed inicial:', e);
    }
    const seed = getInitialSeedData();
    this.persistSync(seed);
    return seed;
  }

  private persistSync(dataToPersist: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToPersist, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error crítico al persistir en disco:', err);
    }
  }

  public persist() {
    this.persistSync(this.data);
  }

  // Getters for collections
  public getSchema(): DatabaseSchema {
    return this.data;
  }

  public getUsers() { return this.data.users; }
  public getRoles() { return this.data.roles; }
  public getPermissions() { return this.data.permissions; }
  public getRolePermissions() { return this.data.role_permissions; }
  public getDepartments() { return this.data.departments; }
  public getEmployees() { return this.data.employees; }
  public getPositions(): Position[] {
    if (!this.data.positions) {
      this.data.positions = [...INITIAL_POSITIONS];
    }
    return this.data.positions;
  }
  public getShifts(): Shift[] {
    if (!this.data.shifts) {
      this.data.shifts = [...INITIAL_SHIFTS];
    }
    return this.data.shifts;
  }
  public getEmployeeById(id: string): Employee | undefined {
    return this.data.employees.find(
      (e) =>
        e.id === id ||
        (e as any).employeeNumber === id ||
        (e as any).employee_number === id
    );
  }
  public addEmployee(emp: Employee): Employee {
    this.data.employees.push(emp);
    this.persistSync(this.data);
    return emp;
  }
  public updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const idx = this.data.employees.findIndex(
      (e) =>
        e.id === id ||
        (e as any).employeeNumber === id ||
        (e as any).employee_number === id
    );
    if (idx === -1) return null;

    const current = this.data.employees[idx];
    const updated: Employee = {
      ...current,
      ...updates,
      id: current.id, // Primary ID is inviolable
      employeeNumber: current.employeeNumber || (current as any).employee_number,
      employee_number: current.employee_number || (current as any).employeeNumber,
      userId: updates.userId !== undefined ? updates.userId : (current as any).userId,
      user_id: updates.user_id !== undefined ? updates.user_id : (current as any).user_id,
    };
    (updated as any).salesExecutiveId =
      (updates as any).salesExecutiveId !== undefined
        ? (updates as any).salesExecutiveId
        : (current as any).salesExecutiveId;

    this.data.employees[idx] = updated;
    this.persistSync(this.data);
    return updated;
  }
  public getConfidentialData(employeeId: string): EmployeeConfidentialData | null {
    if (!this.data.confidential_data) {
      this.data.confidential_data = { ...INITIAL_CONFIDENTIAL_DATA };
    }
    return this.data.confidential_data[employeeId] || null;
  }
  public updateConfidentialData(
    employeeId: string,
    conf: Partial<EmployeeConfidentialData>
  ): EmployeeConfidentialData {
    if (!this.data.confidential_data) {
      this.data.confidential_data = { ...INITIAL_CONFIDENTIAL_DATA };
    }
    const existing: EmployeeConfidentialData = this.data.confidential_data[employeeId] || {
      employeeId,
      baseSalary: 20000,
      paymentFrequency: 'QUINCENAL',
      bankName: 'BBVA México',
      bankAccount: '',
      clabe: '',
      rfc: '',
      curp: '',
      nss: '',
      taxRegime: '605 - Sueldos y Salarios',
      benefitsPackage: ['Vales de Despensa', 'Seguro de Vida'],
    };
    const updated: EmployeeConfidentialData = {
      ...existing,
      ...conf,
      employeeId,
      benefitsPackage: conf.benefitsPackage || existing.benefitsPackage || ['Vales de Despensa', 'Seguro de Vida'],
    };
    this.data.confidential_data[employeeId] = updated;
    this.persistSync(this.data);
    return updated;
  }

  public addAuditLog(entry: {
    user_id: string;
    user_name?: string;
    user_role?: any;
    module?: any;
    action: string;
    entity_type: string;
    entity_id: string;
    previous_value?: string;
    new_value?: string;
    master_transaction_id?: string;
    masterTransactionId?: string;
  }) {
    return this.logAudit({
      module: 'RH',
      ...entry,
    });
  }
  public getCustomers() { return this.data.customers; }
  public getLeads() {
    if (!this.data.leads) {
      this.data.leads = [];
    }
    return this.data.leads;
  }
  public getOpportunities(): Opportunity[] {
    if (!this.data.opportunities) {
      this.data.opportunities = [];
    }
    return this.data.opportunities;
  }
  public getProducts() { return this.data.products; }
  public getCategories() { return this.data.product_categories; }
  public getWarehouses() { return this.data.warehouses; }
  public getInventory() { return this.data.inventory; }
  public getMovements() { return this.data.inventory_movements; }
  public getQuotes() { return this.data.quotes; }
  public getOrders() { return this.data.orders; }
  public getAuditLogs() { return this.data.audit_logs; }
  public getProductReturns(): LogisticsReturn[] {
    if (!this.data.product_returns) {
      this.data.product_returns = [];
    }
    return this.data.product_returns;
  }
  public getNotifications() { return this.data.notifications; }
  public getCompanyConfig() { return this.data.company_config; }
  public getCommercialSettings(): CommercialSettings {
    if (!this.data.commercial_settings) {
      this.data.commercial_settings = {
        sellerMaxDiscountPercent: 5,
        minGrossMarginPct: 18,
        managerMaxDiscountPercent: 10,
      };
    }
    return this.data.commercial_settings;
  }

  public updateCommercialSettings(
    updates: Partial<CommercialSettings>,
    user: { id: string; name: string; role: any },
    masterTransactionId?: string
  ): CommercialSettings {
    const current = this.getCommercialSettings();
    const previousValue = current.sellerMaxDiscountPercent ?? 5;
    const newValue =
      updates.sellerMaxDiscountPercent !== undefined
        ? Number(updates.sellerMaxDiscountPercent)
        : previousValue;
    const mtx =
      masterTransactionId ||
      `MTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    this.data.commercial_settings = {
      ...current,
      ...updates,
      sellerMaxDiscountPercent: newValue,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      updatedByName: user.name,
      masterTransactionId: mtx,
    };

    if (this.data.company_config) {
      this.data.company_config.sellerMaxDiscountPercent = newValue;
      this.data.company_config.maxDiscountSalesperson = newValue;
    }

    this.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: "CONFIGURACION",
      action: "COMMERCIAL_POLICY_UPDATED",
      entity_type: "COMMERCIAL_POLICY",
      entity_id: "sellerMaxDiscountPercent",
      previous_value: String(previousValue),
      new_value: String(newValue),
      master_transaction_id: mtx,
    });

    this.persist();
    return this.data.commercial_settings;
  }
  public getPods() {
    if (!this.data.pods) this.data.pods = [];
    return this.data.pods;
  }

  public getPickings(): Picking[] {
    if (!this.data.pickings) this.data.pickings = [];
    return this.data.pickings;
  }

  public getPicking(idOrFolio: string): Picking | undefined {
    if (!this.data.pickings) this.data.pickings = [];
    return this.data.pickings.find(p => p.id === idOrFolio || p.pickingId === idOrFolio || p.orderId === idOrFolio || p.orderFolio === idOrFolio);
  }

  public savePicking(picking: Picking): Picking {
    if (!this.data.pickings) this.data.pickings = [];
    const idx = this.data.pickings.findIndex(p => p.id === picking.id || p.pickingId === picking.pickingId);
    if (idx >= 0) {
      this.data.pickings[idx] = { ...this.data.pickings[idx], ...picking, updatedAt: new Date().toISOString() };
    } else {
      this.data.pickings.push(picking);
    }

    // Also link to order
    const order = this.data.orders.find(o => o.id === picking.orderId || (o.folio && o.folio === picking.orderFolio));
    if (order) {
      order.pickingId = picking.pickingId;
      order.picking = picking;
    }

    this.persist();
    return idx >= 0 ? this.data.pickings[idx] : picking;
  }

  public getRoutes(): Route[] {
    if (!this.data.routes) this.data.routes = [];
    return this.data.routes;
  }

  public getRoute(idOrNumber: string): Route | undefined {
    if (!this.data.routes) this.data.routes = [];
    return this.data.routes.find(r => r.id === idOrNumber || r.routeNumber === idOrNumber);
  }

  public saveRoute(route: Route): Route {
    if (!this.data.routes) this.data.routes = [];
    const idx = this.data.routes.findIndex(r => r.id === route.id || r.routeNumber === route.routeNumber);
    if (idx >= 0) {
      this.data.routes[idx] = { ...this.data.routes[idx], ...route };
    } else {
      this.data.routes.push(route);
    }
    this.persist();
    return route;
  }

  public deleteRoute(idOrNumber: string): boolean {
    if (!this.data.routes) this.data.routes = [];
    const initialLen = this.data.routes.length;
    this.data.routes = this.data.routes.filter(r => r.id !== idOrNumber && r.routeNumber !== idOrNumber);
    if (this.data.routes.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public getPurchaseRequests(): PurchaseRequest[] {
    if (!this.data.purchase_requests) this.data.purchase_requests = [];
    return this.data.purchase_requests;
  }

  public getPurchaseRequest(idOrNumber: string): PurchaseRequest | undefined {
    if (!this.data.purchase_requests) this.data.purchase_requests = [];
    return this.data.purchase_requests.find(
      r => r.id === idOrNumber || r.request_number === idOrNumber || r.masterTransactionId === idOrNumber
    );
  }

  public savePurchaseRequest(pr: PurchaseRequest): PurchaseRequest {
    if (!this.data.purchase_requests) this.data.purchase_requests = [];
    const idx = this.data.purchase_requests.findIndex(r => r.id === pr.id || r.request_number === pr.request_number);
    if (idx >= 0) {
      this.data.purchase_requests[idx] = { ...this.data.purchase_requests[idx], ...pr };
    } else {
      this.data.purchase_requests.push(pr);
    }
    this.persist();
    return idx >= 0 ? this.data.purchase_requests[idx] : pr;
  }

  public getPurchaseOrders(): PurchaseOrder[] {
    if (!this.data.purchase_orders) this.data.purchase_orders = [];
    return this.data.purchase_orders;
  }

  public getPurchaseOrder(idOrNumber: string): PurchaseOrder | undefined {
    if (!this.data.purchase_orders) this.data.purchase_orders = [];
    return this.data.purchase_orders.find(
      o => o.id === idOrNumber || o.po_number === idOrNumber || o.purchase_order_number === idOrNumber || o.masterTransactionId === idOrNumber || (o as any).master_transaction_id === idOrNumber
    );
  }

  public savePurchaseOrder(po: PurchaseOrder): PurchaseOrder {
    if (!this.data.purchase_orders) this.data.purchase_orders = [];
    const idx = this.data.purchase_orders.findIndex(
      o => o.id === po.id || (po.po_number && o.po_number === po.po_number) || (po.purchase_order_number && o.purchase_order_number === po.purchase_order_number)
    );
    if (idx >= 0) {
      this.data.purchase_orders[idx] = { ...this.data.purchase_orders[idx], ...po };
    } else {
      this.data.purchase_orders.push(po);
    }
    this.persist();
    return idx >= 0 ? this.data.purchase_orders[idx] : po;
  }

  public getSupplierPrices(): SupplierPriceRecord[] {
    if (!this.data.supplier_prices) this.data.supplier_prices = [];
    return this.data.supplier_prices;
  }

  public nextPurchaseRequestNumber(): string {
    if (!this.data.counters.purchase_request_seq) {
      this.data.counters.purchase_request_seq = 1;
    }
    this.data.counters.purchase_request_seq += 1;
    this.persist();
    return `SC-2026-${String(this.data.counters.purchase_request_seq).padStart(4, '0')}`;
  }

  public nextPurchaseOrderNumber(): string {
    if (!this.data.counters.purchase_order_seq) {
      this.data.counters.purchase_order_seq = 0;
    }
    this.data.counters.purchase_order_seq += 1;
    this.persist();
    return `OC-2026-${String(this.data.counters.purchase_order_seq).padStart(4, '0')}`;
  }

  // Sequential Folios
  public nextCustomerNumber(): string {
    this.data.counters.customer_seq += 1;
    this.persist();
    return `CLI-${String(this.data.counters.customer_seq).padStart(6, '0')}`;
  }

  public nextLeadNumber(): string {
    this.data.counters.lead_seq = (this.data.counters.lead_seq || 0) + 1;
    this.persist();
    return `LED-2026-${String(this.data.counters.lead_seq).padStart(5, '0')}`;
  }

  public nextOpportunityNumber(): string {
    this.data.counters.opportunity_seq = (this.data.counters.opportunity_seq || 0) + 1;
    this.persist();
    return `OPP-2026-${String(this.data.counters.opportunity_seq).padStart(3, '0')}`;
  }

  public nextQuoteNumber(): string {
    this.data.counters.quote_seq += 1;
    this.persist();
    return `COT-${String(this.data.counters.quote_seq).padStart(6, '0')}`;
  }

  public nextOrderNumber(): string {
    this.data.counters.order_seq += 1;
    this.persist();
    return `PED-${String(this.data.counters.order_seq).padStart(6, '0')}`;
  }

  public nextMovementNumber(): string {
    this.data.counters.movement_seq += 1;
    this.persist();
    return `MOV-${String(this.data.counters.movement_seq).padStart(6, '0')}`;
  }

  public nextAuditNumber(): string {
    this.data.counters.audit_seq += 1;
    this.persist();
    return `AUD-${String(this.data.counters.audit_seq).padStart(6, '0')}`;
  }

  // Audit Logging (Append-only)
  public logAudit(entry: {
    user_id: string;
    user_name?: string;
    user_role?: any;
    module: any;
    action: string;
    entity_type: string;
    entity_id: string;
    previous_value?: string;
    new_value?: string;
    master_transaction_id?: string;
    masterTransactionId?: string;
  }): AuditLog {
    const id = this.nextAuditNumber();
    const log: AuditLog = {
      id,
      user_id: entry.user_id,
      user_name: entry.user_name,
      user_role: entry.user_role,
      module: entry.module,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      previous_value: entry.previous_value,
      new_value: entry.new_value,
      master_transaction_id: entry.master_transaction_id || entry.masterTransactionId,
      masterTransactionId: entry.master_transaction_id || entry.masterTransactionId,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    this.persist();
    return log;
  }

  // Hotfix 07: Discount Approvals
  public getDiscountApprovals(): DiscountApprovalRequest[] {
    if (!this.data.discount_approvals) {
      this.data.discount_approvals = [];
    }
    return this.data.discount_approvals;
  }

  public addDiscountApproval(approval: DiscountApprovalRequest): DiscountApprovalRequest {
    if (!this.data.discount_approvals) {
      this.data.discount_approvals = [];
    }
    const idx = this.data.discount_approvals.findIndex(a => a.id === approval.id);
    if (idx >= 0) {
      this.data.discount_approvals[idx] = approval;
    } else {
      this.data.discount_approvals.unshift(approval);
    }
    this.persist();
    return approval;
  }

  public updateDiscountApproval(id: string, updates: Partial<DiscountApprovalRequest>): DiscountApprovalRequest | undefined {
    if (!this.data.discount_approvals) {
      this.data.discount_approvals = [];
    }
    const idx = this.data.discount_approvals.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.data.discount_approvals[idx] = { ...this.data.discount_approvals[idx], ...updates };
      this.persist();
      return this.data.discount_approvals[idx];
    }
    return undefined;
  }

  // Observación 17: Service Cases & Tickets Engine
  public getServiceCases(): any[] {
    if (!this.data.service_cases) {
      this.data.service_cases = [];
    }
    return this.data.service_cases;
  }

  public getServiceCaseById(id: string): any | undefined {
    return this.getServiceCases().find(c => c.id === id || c.ticketNumber === id || c.folio === id);
  }

  public nextServiceCaseNumber(): string {
    if (!this.data.counters) {
      this.data.counters = {} as any;
    }
    this.data.counters.service_case_seq = (this.data.counters.service_case_seq || 0) + 1;
    this.persist();
    return `TCK-2026-${String(this.data.counters.service_case_seq).padStart(4, '0')}`;
  }

  public addServiceCase(caseData: any): any {
    if (!this.data.service_cases) {
      this.data.service_cases = [];
    }
    if (caseData.idempotencyKey) {
      const existing = this.data.service_cases.find(c => c.idempotencyKey === caseData.idempotencyKey);
      if (existing) return existing;
    }
    this.data.service_cases.unshift(caseData);
    this.persist();
    return caseData;
  }

  public updateServiceCase(id: string, updates: any): any | undefined {
    const list = this.getServiceCases();
    const idx = list.findIndex(c => c.id === id || c.ticketNumber === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return list[idx];
    }
    return undefined;
  }

  // Reset to initial clean seed
  public resetToSeed(): DatabaseSchema {
    this.data = getInitialSeedData();
    this.persist();
    return this.data;
  }

  // Compute live KPIs strictly from real database records
  public computeKPIs(): DashboardKPIs {
    const today = new Date().toISOString().slice(0, 10);
    const activeOrders = this.data.orders.filter(o => o.status !== 'CANCELADO');

    const ventas_hoy = activeOrders
      .filter(o => o.orderDate === today || o.created_at?.slice(0, 10) === today)
      .reduce((acc, o) => acc + o.total, 0);

    const ventas_mes = activeOrders.reduce((acc, o) => acc + o.total, 0);
    const meta_mensual = 1600000;
    const cumplimiento_pct = Math.round((ventas_mes / meta_mensual) * 100);
    const utilidad_bruta = Math.round(ventas_mes * 0.342);
    const margen_promedio_pct = 34.2;

    const total_cartera = this.data.customers.reduce((acc, c) => acc + c.current_balance, 0);
    const cartera_vencida = this.data.customers
      .filter(c => c.credit_status === 'VENCIDO')
      .reduce((acc, c) => acc + c.current_balance, 0);

    const pedidos_activos_count = this.data.orders.filter(o =>
      ['PENDIENTE', 'CONFIRMADO', 'RESERVADO', 'EN_SURTIDO', 'LISTO_EMBARQUE', 'EN_RUTA'].includes(o.status)
    ).length;

    const cotizaciones_pendientes_count = this.data.quotes.filter(q =>
      ['ENVIADA', 'EN_NEGOCIACION'].includes(q.status)
    ).length;

    const stock_critico_count = this.data.products.filter(p => p.available_stock <= p.minimum_stock).length;
    const total_inventario_piezas = this.data.products.reduce((acc, p) => acc + p.physical_stock, 0);
    const entregas_hoy_count = this.data.orders.filter(o => o.status === 'EN_RUTA').length;

    return {
      ventas_hoy,
      ventas_mes,
      meta_mensual,
      cumplimiento_pct,
      utilidad_bruta,
      margen_promedio_pct,
      total_cartera,
      cartera_vencida,
      pedidos_activos_count,
      cotizaciones_pendientes_count,
      stock_critico_count,
      total_inventario_piezas,
      entregas_hoy_count,
    };
  }

  // ============================================================
  // OBSERVACIÓN 21: CONTROL DESACOPLADO DE AJUSTES Y MERMA
  // ============================================================

  public getAdjustments(): InventoryAdjustment[] {
    if (!this.data.inventory_adjustments) {
      this.data.inventory_adjustments = [];
    }
    return this.data.inventory_adjustments;
  }

  public getAdjustmentById(idOrFolio: string): InventoryAdjustment | undefined {
    const list = this.getAdjustments();
    return list.find(a => a.id === idOrFolio || a.folio === idOrFolio);
  }

  public createAdjustment(data: {
    productId: string;
    warehouseId: string;
    location?: string;
    type: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'MERMA';
    quantity: number;
    reason: string;
    notes?: string;
    evidenceNote?: string;
    user: { id: string; name: string; role: any };
    folio?: string;
  }): { success: boolean; adjustment?: InventoryAdjustment; error?: string } {
    if (!data.quantity || data.quantity <= 0) {
      return { success: false, error: 'La cantidad del ajuste debe ser mayor a cero.' };
    }
    if (!data.reason || data.reason.trim() === '') {
      return { success: false, error: 'El motivo del ajuste es obligatorio.' };
    }

    const prod = this.data.products.find(p => p.id === data.productId || p.sku === data.productId || p.code === data.productId);
    if (!prod) {
      return { success: false, error: 'Material / Producto no encontrado.' };
    }

    const wh = this.data.warehouses.find(w => w.id === data.warehouseId || w.name === data.warehouseId) || this.data.warehouses[0];

    if (!this.data.counters) {
      this.data.counters = { customer_seq: 1, quote_seq: 1, order_seq: 1, movement_seq: 1, audit_seq: 1 };
    }
    if (!this.data.counters.adjustment_seq) {
      this.data.counters.adjustment_seq = 1;
    }
    const seq = this.data.counters.adjustment_seq++;
    const folio = data.folio || `AJU-${String(seq).padStart(6, '0')}`;
    const id = `AJU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const mtx = `MTX-${folio}-${Date.now().toString(36).toUpperCase()}`;

    const currentStock = prod.physical_stock ?? prod.physicalStock ?? prod.stock ?? 0;
    const delta = (data.type === 'AJUSTE_NEGATIVO' || data.type === 'MERMA') ? -data.quantity : data.quantity;

    // ESTADO OBLIGATORIO: PENDIENTE_AUTORIZACION
    // ¡NO MODIFICA INVENTARIO!
    // ¡NO GENERA KARDEX!
    const adjustment: InventoryAdjustment = {
      id,
      folio,
      type: data.type,
      productId: prod.id,
      productCode: prod.code || prod.sku,
      productName: prod.name,
      warehouseId: wh.id,
      warehouseName: wh.name,
      location: data.location || (typeof prod.warehouseLocation === 'string' ? prod.warehouseLocation : (prod as any).warehouse_location) || 'RACK-A01',
      previousStock: currentStock,
      newStock: currentStock, // Sin aplicar todavía
      quantity: data.quantity,
      deltaQuantity: delta,
      differenceQty: delta,
      unitCost: prod.cost,
      totalCostImpact: Math.round(data.quantity * (prod.cost || 0) * (delta < 0 ? -1 : 1) * 100) / 100,
      reason: data.reason.trim(),
      notes: data.notes?.trim(),
      evidenceNote: data.evidenceNote?.trim(),
      status: 'PENDIENTE_AUTORIZACION',
      createdBy: data.user.id,
      createdByName: data.user.name,
      createdAt: new Date().toISOString(),
      masterTransactionId: mtx,
      idempotencyKey: `IDEMP-${folio}`,
    };

    if (!this.data.inventory_adjustments) {
      this.data.inventory_adjustments = [];
    }
    this.data.inventory_adjustments.unshift(adjustment);

    this.logAudit({
      user_id: data.user.id,
      user_name: data.user.name,
      user_role: data.user.role,
      module: 'INVENTARIO',
      action: 'INVENTORY_ADJUSTMENT_REQUESTED',
      entity_type: 'AJUSTE_INVENTARIO',
      entity_id: folio,
      new_value: `Solicitud de ajuste ${data.type} por ${data.quantity} pzas creada en estado PENDIENTE_AUTORIZACION para ${prod.code}. Inventario y Kardex intactos.`,
      master_transaction_id: mtx,
    });

    this.persist();
    return { success: true, adjustment };
  }

  public authorizeAdjustment(
    idOrFolio: string,
    user: { id: string; name: string; role: any }
  ): { success: boolean; adjustment?: InventoryAdjustment; movement?: InventoryMovement; error?: string; code?: number } {
    const adj = this.getAdjustmentById(idOrFolio);
    if (!adj) {
      return { success: false, error: 'Ajuste de inventario no encontrado.', code: 404 };
    }

    // IDEMPOTENCIA Y PROTECCIÓN CONTRA DOBLE APLICACIÓN
    if (adj.status === 'APLICADO') {
      return {
        success: false,
        error: `El ajuste ${adj.folio} ya fue aplicado previamente el ${adj.appliedAt || adj.authorizedAt}. Operación bloqueada para garantizar idempotencia.`,
        code: 409,
      };
    }

    if (adj.status !== 'PENDIENTE_AUTORIZACION' && adj.status !== 'AUTORIZADO') {
      return {
        success: false,
        error: `No se puede autorizar el ajuste ${adj.folio} porque se encuentra en estado ${adj.status}.`,
        code: 400,
      };
    }

    // SEPARACIÓN DE FUNCIONES (SoD):
    // El solicitante NO debe autoautorizarse (salvo que sea superadministrador)
    if (adj.createdBy === user.id && user.role !== 'ADMINISTRADOR' && user.role !== 'DIRECTOR') {
      return {
        success: false,
        error: 'Segregación de funciones: El usuario solicitante no puede autorizar su propia solicitud de ajuste.',
        code: 403,
      };
    }

    const prod = this.data.products.find(p => p.id === adj.productId || p.sku === adj.productCode || p.code === adj.productCode);
    if (!prod) {
      return { success: false, error: 'Material / Producto asociado al ajuste no encontrado.', code: 404 };
    }

    // CRÍTICO: Recalcular con base en el stock VIGENTE ACTUAL (no snapshot viejo de creación)
    const currentPhysicalStock = prod.physical_stock ?? prod.physicalStock ?? prod.stock ?? 0;
    const reservedStock = prod.reserved_stock ?? prod.reservedStock ?? 0;

    const delta = (adj.type === 'AJUSTE_NEGATIVO' || adj.type === 'MERMA') ? -adj.quantity : adj.quantity;

    // Concurrencia / Validación de stock vigente
    if (delta < 0 && (currentPhysicalStock + delta < 0)) {
      return {
        success: false,
        error: `Stock insuficiente en el momento de aplicación. Stock físico actual: ${currentPhysicalStock}, requiere restar ${Math.abs(delta)}.`,
        code: 400,
      };
    }

    if (delta < 0 && (currentPhysicalStock + delta < reservedStock)) {
      return {
        success: false,
        error: `La merma / ajuste viola la reserva de pedidos. Stock resultante (${currentPhysicalStock + delta}) sería menor al reservado (${reservedStock}).`,
        code: 400,
      };
    }

    const newPhysicalStock = currentPhysicalStock + delta;
    const newAvailableStock = Math.max(0, newPhysicalStock - reservedStock);

    // ATOMICIDAD: Aplicar mutación a nivel producto
    prod.physical_stock = newPhysicalStock;
    prod.physicalStock = newPhysicalStock;
    prod.stock = newPhysicalStock;
    prod.available_stock = newAvailableStock;
    prod.availableStock = newAvailableStock;
    prod.updated_at = new Date().toISOString();

    // Actualizar ubicación en almacén si existe desglose
    if (prod.warehouseLocations && Array.isArray(prod.warehouseLocations)) {
      const locTarget = prod.warehouseLocations.find(l => l.locationCode === adj.location || l.rack === adj.location);
      if (locTarget) {
        const locPrev = locTarget.stock ?? (locTarget as any).physicalStock ?? 0;
        const locNew = Math.max(0, locPrev + delta);
        locTarget.stock = locNew;
        if ('physicalStock' in locTarget) (locTarget as any).physicalStock = locNew;
        if ('availableStock' in locTarget) (locTarget as any).availableStock = Math.max(0, locNew - ((locTarget as any).reservedStock || 0));
      }
    }

    // GENERAR EXACTAMENTE 1 MOVIMIENTO KARDEX
    const movType: InventoryMovementType = adj.type === 'MERMA' ? 'MERMA' : adj.type;
    const movId = `MOV-AJU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const mtx = adj.masterTransactionId || `MTX-${adj.folio}-${Date.now().toString(36).toUpperCase()}`;

    const movement: InventoryMovement = {
      id: movId,
      timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
      type: movType,
      productId: prod.id,
      productCode: prod.code || prod.sku,
      productName: prod.name,
      warehouseId: adj.warehouseId,
      warehouseName: adj.warehouseName,
      location: adj.location || 'RACK-A01',
      locationCode: adj.location || 'RACK-A01',
      quantity: adj.quantity,
      previousBalance: currentPhysicalStock,
      previous_balance: currentPhysicalStock,
      newBalance: newPhysicalStock,
      new_balance: newPhysicalStock,
      reason: `Ajuste autorizado: ${adj.reason}`,
      reference_type: 'AJUSTE_MANUAL',
      referenceType: 'AJUSTE_MANUAL',
      referenceFolio: adj.folio,
      reference_folio: adj.folio,
      relatedDocFolio: adj.folio,
      masterTransactionId: mtx,
      master_transaction_id: mtx,
      userId: user.id,
      user_id: user.id,
      userName: user.name,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (!this.data.inventory_movements) {
      this.data.inventory_movements = [];
    }
    this.data.inventory_movements.unshift(movement);

    // Actualizar estado del ajuste a APLICADO
    adj.status = 'APLICADO';
    adj.previousStock = currentPhysicalStock;
    adj.newStock = newPhysicalStock;
    adj.appliedStockBefore = currentPhysicalStock;
    adj.appliedStockAfter = newPhysicalStock;
    adj.authorizedBy = user.id;
    adj.authorizedByName = user.name;
    adj.authorizedAt = new Date().toISOString();
    adj.appliedAt = new Date().toISOString();

    this.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: 'INVENTARIO',
      action: 'INVENTORY_ADJUSTMENT_AUTHORIZED',
      entity_type: 'AJUSTE_INVENTARIO',
      entity_id: adj.folio,
      previous_value: `Stock: ${currentPhysicalStock}`,
      new_value: `Stock: ${newPhysicalStock}. Movimiento Kardex: ${movId}. Delta: ${delta}.`,
      master_transaction_id: mtx,
    });

    this.persist();
    return { success: true, adjustment: adj, movement };
  }

  public rejectAdjustment(
    idOrFolio: string,
    user: { id: string; name: string; role: any },
    rejectionReason: string
  ): { success: boolean; adjustment?: InventoryAdjustment; error?: string; code?: number } {
    const adj = this.getAdjustmentById(idOrFolio);
    if (!adj) {
      return { success: false, error: 'Ajuste de inventario no encontrado.', code: 404 };
    }

    if (adj.status === 'APLICADO') {
      return { success: false, error: 'No se puede rechazar un ajuste que ya ha sido aplicado al inventario.', code: 400 };
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      return { success: false, error: 'El motivo de rechazo es obligatorio.', code: 400 };
    }

    adj.status = 'RECHAZADO';
    adj.rejectionReason = rejectionReason.trim();
    adj.rejectedBy = user.id;
    adj.rejectedByName = user.name;
    adj.rejectedAt = new Date().toISOString();

    // INVENTARIO: SIN CAMBIO
    // KARDEX: 0

    this.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      module: 'INVENTARIO',
      action: 'INVENTORY_ADJUSTMENT_REJECTED',
      entity_type: 'AJUSTE_INVENTARIO',
      entity_id: adj.folio,
      new_value: `Ajuste rechazado por ${user.name}. Motivo: ${rejectionReason}. Sin afectación a existencias ni kardex.`,
      master_transaction_id: adj.masterTransactionId,
    });

    this.persist();
    return { success: true, adjustment: adj };
  }

  public resetTest021(): { success: boolean; message: string } {
    let prod = this.data.products.find(p => p.sku === 'SKU-TEST-021' || p.code === 'SKU-TEST-021' || p.id === 'PROD-TEST-021');
    if (prod) {
      prod.stock = 20;
      prod.physicalStock = 20;
      prod.physical_stock = 20;
      prod.reservedStock = 0;
      prod.reserved_stock = 0;
      prod.availableStock = 20;
      prod.available_stock = 20;
      prod.warehouseLocations = [
        {
          warehouseId: 'WH-01',
          warehouseName: 'CEDIS PRINCIPAL',
          locationCode: 'RACK-A01',
          nave: 'N1',
          rack: 'RACK-A01',
          pasillo: 'P-01',
          nivel: 'Niv-01',
          stock: 20,
        },
        {
          warehouseId: 'WH-01',
          warehouseName: 'CEDIS PRINCIPAL',
          locationCode: 'RACK-B01',
          nave: 'N1',
          rack: 'RACK-B01',
          pasillo: 'P-02',
          nivel: 'Niv-01',
          stock: 30,
        },
      ];
    }

    if (this.data.inventory_movements) {
      this.data.inventory_movements = this.data.inventory_movements.filter(
        m => m.productCode !== 'SKU-TEST-021' && !m.referenceFolio?.startsWith('AJU-TEST-021') && !m.relatedDocFolio?.startsWith('AJU-TEST-021')
      );
    }
    if (this.data.inventory_adjustments) {
      this.data.inventory_adjustments = this.data.inventory_adjustments.filter(
        a => !a.folio?.startsWith('AJU-TEST-021')
      );
    }

    this.persist();
    return { success: true, message: 'SKU-TEST-021 restablecido a 20 pzas (RACK-A01: 20, RACK-B01: 30). Ajustes y kardex de prueba limpiados.' };
  }
}

export const db = new Database();
