/**
 * @license
 * CONSCORE ERP IA - Enterprise Core Data Models (Fase 0.1)
 */

export type UserRole =
  | 'ADMINISTRADOR'
  | 'DIRECTOR'
  | 'GERENTE_VENTAS'
  | 'VENDEDOR'
  | 'MARKETING'
  | 'ALMACEN'
  | 'JEFE_ALMACEN'
  | 'LOGISTICA'
  | 'CHOFER'
  | 'COMPRAS'
  | 'RH'
  | 'FINANZAS'
  | 'SERVICIO_CLIENTE'
  | 'CALIDAD';

export type ERPModule =
  | 'DASHBOARD'
  | 'IA'
  | 'AUTOMATIZACION'
  | 'PREDICTIVO'
  | 'MARKETING'
  | 'VENTAS'
  | 'CLIENTES'
  | 'COTIZACIONES'
  | 'PEDIDOS'
  | 'INVENTARIO'
  | 'ALMACENES'
  | 'COMPRAS'
  | 'LOGISTICA'
  | 'RH'
  | 'FINANZAS'
  | 'REPORTES'
  | 'CONFIGURACION'
  | 'AUDITORIA'
  | 'SERVICIO';

export type ActionPermission =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'AUTHORIZE'
  | 'EXPORT'
  | 'VER'
  | 'CREAR'
  | 'EDITAR'
  | 'ELIMINAR'
  | 'AUTORIZAR'
  | 'EXPORTAR';

export type MovementType = InventoryMovementType;

export interface RolePermissions {
  role: UserRole;
  displayName: string;
  description: string;
  permissions: Record<ERPModule, ActionPermission[]>;
}

export interface Permission {
  id: string;
  module: ERPModule;
  action: ActionPermission;
  description: string;
}

export interface Role {
  id: string;
  name: UserRole;
  displayName?: string;
  description?: string;
  status?: 'ACTIVO' | 'INACTIVO';
}

export interface RolePermissionMapping {
  role_id: string;
  permission_id: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  budget?: number;
  location?: string;
  employeeCount?: number;
  status?: 'ACTIVO' | 'INACTIVO';
}

export type EmploymentStatus =
  | 'ACTIVE'
  | 'PROBATION'
  | 'SUSPENDED'
  | 'INACTIVE'
  | 'TERMINATED'
  | 'ACTIVO'
  | 'PRUEBA'
  | 'SUSPENDIDO'
  | 'INACTIVO'
  | 'BAJA';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACTOR';

export interface Position {
  id: string;
  code?: string;
  name: string;
  departmentId: string;
  department_id?: string;
  departmentName?: string;
  description?: string;
  level: 'DIRECTIVO' | 'GERENCIAL' | 'JEFATURA' | 'SUPERVISION' | 'OPERATIVO' | 'ESPECIALISTA';
  managerPositionId?: string;
  manager_position_id?: string;
  baseSalaryMin?: number;
  baseSalaryMax?: number;
  status: 'ACTIVO' | 'INACTIVO';
}

export interface Shift {
  id: string;
  name: string;
  code?: string;
  startTime: string; // e.g. '08:00'
  endTime: string; // e.g. '17:30'
  toleranceMinutes: number; // e.g. 15
  breakMinutes: number; // e.g. 60
  workDays: string[]; // ['LUN', 'MAR', 'MIE', 'JUE', 'VIE']
  status: 'ACTIVO' | 'INACTIVO';
}

export interface Employee {
  id: string;
  name: string;
  fullName?: string;
  employee_number?: string;
  employeeNumber?: string;
  user_id?: string;
  userId?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  second_last_name?: string;
  secondLastName?: string;
  position?: string;
  positionId?: string;
  position_id?: string;
  positionName?: string;
  department_id?: string;
  departmentId?: string;
  department?: string;
  department_name?: string;
  departmentName?: string;
  managerId?: string;
  manager_id?: string;
  managerName?: string;
  locationId?: string;
  location_id?: string;
  locationName?: string;
  phone?: string;
  email?: string;
  hire_date?: string;
  hireDate?: string;
  termination_date?: string;
  terminationDate?: string;
  employment_status?: EmploymentStatus;
  employmentStatus?: EmploymentStatus;
  employment_type?: EmploymentType;
  employmentType?: EmploymentType;
  shift_id?: string;
  shiftId?: string;
  shiftName?: string;
  salesExecutiveId?: string;
  sales_executive_id?: string;
  status?: 'ACTIVO' | 'INACTIVO' | 'BAJA' | 'PRUEBA' | 'SUSPENDIDO';
  notes?: string;
  avatar?: string;
  birthday?: string; // YYYY-MM-DD
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role_id?: string;
  roleId?: string;
  role: UserRole;
  salesExecutiveId?: string;
  sales_executive_id?: string;
  employee_id?: string;
  employeeId?: string;
  department?: string;
  territory?: string;
  avatar?: string;
  status: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO';
  mustChangePassword?: boolean;
  must_change_password?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  last_login?: string;
  lastLogin?: string;
}

export interface Customer {
  id: string;
  customer_number?: string;
  customerNumber?: string;
  code?: string;
  company_name?: string;
  companyName?: string;
  businessName?: string;
  name?: string;
  contact_name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  /** Colonia/asentamiento, tomado del catálogo SEPOMEX al capturar el código postal. */
  colonia?: string;
  /** Código postal de la dirección de operación. No confundir con fiscalZipCode. */
  zipCode?: string;
  tax_id?: string;
  taxId?: string;
  rfc?: string;
  credit_limit?: number;
  creditLimit?: number;
  credit_status?: 'CORRIENTE' | 'CON_SALDO' | 'VENCIDO' | 'BLOQUEADO';
  creditStatus?: 'CORRIENTE' | 'CON_SALDO' | 'VENCIDO' | 'BLOQUEADO';
  creditDays?: number;
  current_balance?: number;
  currentBalance?: number;
  totalPurchases?: number;
  lastPurchaseDate?: string;
  assigned_salesperson_id?: string;
  assignedSalespersonId?: string;
  assigned_salesperson_name?: string;
  assignedSalespersonName?: string;
  assignedSalesExecutiveId?: string;
  assigned_sales_executive_id?: string;
  salesExecutiveId?: string;
  sales_executive_id?: string;
  sellerId?: string;
  sellerName?: string;
  // --- Datos fiscales del receptor (CFDI 4.0) ---
  /** RegimenFiscalReceptor del catálogo c_RegimenFiscal. Ej: 601, 603, 612, 626. */
  satTaxRegimeCode?: string;
  /** UsoCFDI del catálogo c_UsoCFDI. Ej: G01 adquisición de mercancías, G03 gastos en general. */
  satCfdiUseCode?: string;
  /** Código postal fiscal del receptor. Debe coincidir con su constancia de situación fiscal. */
  fiscalZipCode?: string;
  /** Razón social exactamente como aparece en la constancia, sin régimen societario. */
  fiscalLegalName?: string;
  /** Correo al que se envía el CFDI timbrado. */
  billingEmail?: string;

  paymentTerms?: string;
  discountRate?: number;
  notes?: string;
  status?: 'ACTIVO' | 'INACTIVO' | 'PROSPECTO';
  // Marketing & Attribution Integration (Fase 5)
  originLeadId?: string;
  leadId?: string;
  leadSource?: string;
  acquisitionCampaignId?: string;
  acquisitionCampaignName?: string;
  acquisitionChannel?: string;
  acquisitionDate?: string;
  acquisitionCostCAC?: number;
  lifetimeAttributedRevenue?: number;
  firstTouchCampaignId?: string;
  lastTouchCampaignId?: string;
  touchpoints?: Touchpoint[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  status?: 'ACTIVO' | 'INACTIVO';
}

export interface Product {
  id: string;
  sku?: string;
  code: string;
  name: string;
  description?: string;
  category_id?: string;
  categoryId?: string;
  category_name?: string;
  categoryName?: string;
  category?: string;
  supplier_id?: string;
  supplierId?: string;
  warehouseId?: string;
  warehouseName?: string;
  active?: boolean;
  warehouseLocation?: string | {
    warehouseId: string;
    warehouseName: string;
    locationCode: string;
    nave: string;
    rack: string;
    pasillo: string;
    nivel: string;
  };
  warehouse_location?: string;
  unit: string;
  cost: number;
  cost_price?: number;
  costPrice?: number;
  sale_price?: number;
  salePrice?: number;
  list_price?: number;
  listPrice?: number;
  price?: number;
  minimum_stock?: number;
  minimumStock?: number;
  minStock?: number;
  maximum_stock?: number;
  maximumStock?: number;
  maxStock?: number;
  leadTimeDays?: number;
  status?: 'ACTIVO' | 'INACTIVO';
  physical_stock?: number;
  physicalStock?: number;
  stock?: number;
  reserved_stock?: number;
  reservedStock?: number;
  available_stock?: number;
  availableStock?: number;
  warehouseLocations?: {
    warehouseId: string;
    warehouseName: string;
    locationCode: string;
    nave: string;
    rack: string;
    pasillo: string;
    nivel: string;
    stock: number;
  }[];
  // --- Datos fiscales requeridos para timbrar (CFDI 4.0) ---
  /** ClaveProdServ del catálogo c_ClaveProdServ del SAT. Sin esto no se puede facturar. */
  satProductCode?: string;
  /** ClaveUnidad del catálogo c_ClaveUnidad. La unidad interna ("ROLLO") no sirve: el SAT pide su clave ("H87", "MTK"). */
  satUnitCode?: string;
  /** ObjetoImp: 01 no objeto de impuesto, 02 sí objeto, 03 sí objeto y no obligado al desglose. */
  satTaxObjectCode?: string;
  /** Tasa de IVA aplicable, en decimal. 0.16 es la general; 0 para tasa cero. */
  vatRate?: number;

  thermalConductivity?: string;
  tempRange?: string;
  specifications?: Record<string, string>;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  location?: string;
  manager_id?: string;
  managerId?: string;
  manager_name?: string;
  managerName?: string;
  manager?: string;
  phone?: string;
  status?: 'ACTIVO' | 'INACTIVO';
  active?: boolean;
  total_capacity_m3?: number;
  totalCapacityM3?: number;
  current_occupancy_pct?: number;
  currentOccupancyPct?: number;
}

export interface WarehouseInventory {
  id: string;
  product_id: string;
  productId?: string;
  warehouse_id: string;
  warehouseId?: string;
  warehouse_name?: string;
  warehouseName?: string;
  physical_stock: number;
  physicalStock?: number;
  reserved_stock: number;
  reservedStock?: number;
  available_stock: number;
  availableStock?: number;
  location_in_warehouse: string; // e.g. "Nave 1 / R-02 / P-01 / N-3"
  updated_at?: string;
  updatedAt?: string;
}

export type InventoryMovementType =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'MERMA'
  | 'SALIDA_MERMA'
  | 'RESERVA'
  | 'LIBERACION_RESERVA'
  | 'TRASPASO'
  | 'TRANSFERENCIA'
  | 'DEVOLUCION'
  | 'ENTRADA_DEVOLUCION';

export type ReservationStatus = 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'CANCELLED' | 'PARTIALLY_FULFILLED';

export interface InventoryReservation {
  id: string;
  order_id?: string;
  orderId?: string;
  order_folio?: string;
  orderFolio?: string;
  product_id?: string;
  productId?: string;
  product_code?: string;
  productCode?: string;
  product_name?: string;
  productName?: string;
  warehouse_id?: string;
  warehouseId?: string;
  warehouse_name?: string;
  warehouseName?: string;
  quantity: number;
  status: ReservationStatus;
  created_at?: string;
  createdAt?: string;
  released_at?: string;
  releasedAt?: string;
  released_by?: string;
  releasedBy?: string;
  released_by_name?: string;
  releasedByName?: string;
  notes?: string;
}

export type TransferStatus = 'SOLICITADA' | 'AUTORIZADA' | 'EN_TRANSITO' | 'RECIBIDA' | 'CANCELADA';

export interface TransferItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  originLocation?: string;
  destinationLocation?: string;
}

export interface WarehouseTransfer {
  id: string;
  folio: string; // TRF-000001
  originWarehouseId: string;
  originWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  items: TransferItem[];
  status: TransferStatus;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  authorizedBy?: string;
  authorizedByName?: string;
  authorizedAt?: string;
  shippedBy?: string;
  shippedByName?: string;
  shippedAt?: string;
  receivedBy?: string;
  receivedByName?: string;
  receivedAt?: string;
  carrier?: string;
  trackingNumber?: string;
  notes?: string;
}

export type CountSessionStatus = 'BORRADOR' | 'EN_CONTEO' | 'DIFERENCIAS_DETECTADAS' | 'AJUSTADO' | 'CANCELADO';

export interface InventoryCountItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  location: string;
  systemStock: number;
  countedStock: number;
  difference: number;
  costUnit: number;
  totalDifferenceCost: number;
  notes?: string;
}

export interface InventoryCountSession {
  id: string;
  folio: string; // FIS-000001
  warehouseId: string;
  warehouseName: string;
  categoryFilter?: string;
  status: CountSessionStatus;
  items: InventoryCountItem[];
  totalItemsCounted: number;
  itemsWithDifferences: number;
  totalCostDifference: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  authorizedBy?: string;
  authorizedByName?: string;
  authorizedAt?: string;
  notes?: string;
}

export interface InventoryAdjustment {
  id: string;
  folio: string; // AJU-000001
  type: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'MERMA';
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  location?: string;
  previousStock: number;
  newStock: number;
  differenceQty?: number;
  quantity: number;
  deltaQuantity?: number;
  unitCost?: number;
  totalCostImpact?: number;
  reason: string;
  notes?: string;
  evidenceUrl?: string;
  evidenceNote?: string;
  countSessionId?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  authorizedBy?: string;
  authorizedByName?: string;
  authorizedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  appliedAt?: string;
  appliedStockBefore?: number;
  appliedStockAfter?: number;
  masterTransactionId?: string;
  idempotencyKey?: string;
  status: 'BORRADOR' | 'PENDIENTE_AUTORIZACION' | 'AUTORIZADO' | 'RECHAZADO' | 'APLICADO' | 'CANCELADO';
}

export type OrderFulfillmentStatus =
  | 'PENDIENTE_SURTIDO'
  | 'EN_SURTIDO'
  | 'SURTIDO'
  | 'SURTIDO_TOTAL'
  | 'SURTIDO_PARCIAL'
  | 'PARCIAL'
  | 'LISTO_EMBARQUE'
  | 'INCIDENCIA'
  | 'CANCELADO';

export type PickingStatus = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'VERIFICADO' | 'SURTIDO_FISICO_CONFIRMADO';

export interface PickingItemLocation {
  warehouseId: string;
  warehouseName?: string;
  nave: string;
  rack: string;
  pasillo: string;
  nivel: string;
  posicion?: string;
  locationCode: string;
  stockAvailable: number;
  qtyToTake: number;
}

export interface PickingItem {
  id: string;
  orderItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  qtyRequested: number;
  qtyAvailable: number;
  qtyPicked: number;
  location: string;
  locations?: PickingItemLocation[];
  status: 'PENDIENTE' | 'SURTIDO' | 'PARCIAL' | 'FALTANTE';
  notes?: string;
  // Aliases for unified picking specification
  sku?: string;
  description?: string;
  orderQty?: number;
  reservedQty?: number;
  availableQty?: number;
  pickedQty?: number;
  locationId?: string;
  locationLabel?: string;
}

export interface Picking {
  id: string;
  pickingId: string;
  orderId: string;
  orderFolio: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  status: PickingStatus;
  items: PickingItem[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  verifiedBy?: string;
  verifiedByUserId?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  verificationObservations?: string;
  managerSignature?: string;
  verificationSignature?: string;
  completedAt?: string;
  masterTransactionId: string;
  fulfillmentType?: 'PICKING_COMPLETO' | 'PICKING_PARCIAL';
  physicalFulfillmentConfirmed?: boolean;
  fulfilledAt?: string;
  fulfilledBy?: string;
  fulfilledByName?: string;
  notes?: string;
}

export interface WarehouseLocationDetail {
  id: string;
  warehouseId: string;
  nave: string;
  pasillo: string;
  rack: string;
  nivel: string;
  posicion?: string;
  locationCode: string; // e.g. "N1-P02-R04-N1"
  barcode?: string;
  description?: string;
  active: boolean;
}

export interface StockAlert {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  warehouseId?: string;
  warehouseName?: string;
  type: 'CRITICO' | 'SOBRESTOCK' | 'SIN_MOVIMIENTO' | 'DIFERENCIA_CONTEO';
  severity: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  currentStock: number;
  threshold: number;
  difference: number;
  message: string;
  capitalTiedUp?: number;
  suggestedAction?: string;
}

export interface InventoryMovement {
  id: string;
  product_id?: string;
  productId?: string;
  product_code?: string;
  productCode?: string;
  product_name?: string;
  productName?: string;
  warehouse_id?: string;
  warehouseId?: string;
  warehouse_name?: string;
  warehouseName?: string;
  locationCode?: string;
  location?: string;
  type: InventoryMovementType;
  quantity: number;
  previous_balance?: number;
  previousBalance?: number;
  new_balance?: number;
  newBalance?: number;
  reason?: string;
  reference_type?: 'COTIZACION' | 'PEDIDO' | 'ORDEN_COMPRA' | 'AJUSTE_MANUAL' | 'TRASPASO';
  referenceType?: 'COTIZACION' | 'PEDIDO' | 'ORDEN_COMPRA' | 'AJUSTE_MANUAL' | 'TRASPASO';
  reference_id?: string;
  referenceId?: string;
  reference_folio?: string;
  referenceFolio?: string;
  relatedDocFolio?: string;
  reference?: string;
  unit?: string;
  notes?: string;
  masterTransactionId?: string;
  master_transaction_id?: string;
  user_id?: string;
  userId?: string;
  created_by?: string;
  createdBy?: string;
  created_by_name?: string;
  createdByName?: string;
  userName?: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
}

export type QuoteStatus =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'EN_NEGOCIACION'
  | 'EN NEGOCIACIÓN'
  | 'ACEPTADA'
  | 'APROBADA'
  | 'CONVERTIDA'
  | 'CONVERTIDA_A_PEDIDO'
  | 'PENDIENTE'
  | 'PENDIENTE_AUTORIZACION'
  | 'RECHAZADA'
  | 'VENCIDA'
  | 'CANCELADA';

export interface DiscountApprovalRequest {
  id: string;
  quoteId: string;
  quoteFolio?: string;
  quoteVersion: number;
  customerId: string;
  customerName?: string;
  salesExecutiveId: string;
  salesExecutiveName?: string;
  requestedDiscount: number; // e.g. 10 (%)
  currentListPrice: number;
  salesPrice: number;
  netPrice: number;
  justification: 'volumen' | 'negociación estratégica' | 'competencia' | 'proyecto especial' | 'cliente corporativo' | 'otra' | string;
  observations?: string;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  status: 'PENDIENTE_AUTORIZACION' | 'APROBADO' | 'RECHAZADO';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  approvedDiscountPercent?: number;
  masterTransactionId: string;
}

export interface QuoteItem {
  id?: string;
  quote_id?: string;
  quoteId?: string;
  product_id?: string;
  productId?: string;
  product_code?: string;
  productCode?: string;
  sku?: string;
  product_name?: string;
  productName?: string;
  description?: string;
  unit?: string;
  um?: string;
  quantity: number;
  // HOTFIX 07: Canonical Pricing Fields
  listPrice?: number;
  list_price?: number;
  salesPrice?: number;
  sales_price?: number;
  unit_price?: number;
  unitPrice?: number;
  price?: number;
  discount?: number;
  discountPct?: number;
  discountPercent?: number;
  discount_percent?: number;
  discountAmount?: number;
  discount_amount?: number;
  subtotalBeforeDiscount?: number;
  subtotal_before_discount?: number;
  subtotalAfterDiscount?: number;
  subtotal_after_discount?: number;
  netUnitPrice?: number;
  net_unit_price?: number;
  tax?: number;
  total?: number;
  unitCost?: number;
  unit_cost?: number;
  subtotal: number;
}

export interface QuoteVersion {
  id: string;
  quoteId: string;
  version: number;
  snapshot: Partial<Quote>;
  modifiedBy: string;
  modifiedByName?: string;
  modifiedAt: string;
  masterTransactionId?: string;
  changedFields?: string[];
  notes?: string;
}

export interface Quote {
  id: string;
  quote_number?: string; // e.g. COT-000001
  quoteNumber?: string;
  folio?: string;
  version?: number;
  versions?: QuoteVersion[];
  masterTransactionId?: string;
  master_transaction_id?: string;
  grossMarginPct?: number;
  customer_id?: string;
  customerId?: string;
  customer_name?: string;
  customerName?: string;
  customerRFC?: string;
  customer_rfc?: string;
  salesperson_id?: string;
  salespersonId?: string;
  salesperson_name?: string;
  salespersonName?: string;
  sellerId?: string;
  sellerName?: string;
  salesExecutiveId?: string;
  sales_executive_id?: string;
  quote_date?: string;
  quoteDate?: string;
  date?: string;
  expiration_date?: string;
  expirationDate?: string;
  validUntil?: string;
  status: QuoteStatus;
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  payment_terms?: string;
  deliveryTime?: string;
  deliveryTimeDays?: number;
  converted_to_order_id?: string;
  convertedToOrderId?: string;
  converted_to_order_number?: string;
  convertedToOrderFolio?: string;
  // HOTFIX 07: Discount Governance
  discountApproval?: DiscountApprovalRequest;
  discountApprovalHistory?: DiscountApprovalRequest[];
  approvedDiscountPercent?: number;
  discountApprovalStatus?: 'PENDIENTE_AUTORIZACION' | 'APROBADO' | 'RECHAZADO';
  // OBSERVACIÓN 16: Financial Approval for Quote to Order
  financialApprovalStatus?: 'PENDIENTE' | 'AUTORIZADA' | 'RECHAZADA';
  financialApprovedBy?: string;
  financialApprovedByName?: string;
  financialApprovedAt?: string;
  financialApprovedRole?: string;
  financialRejectedBy?: string;
  financialRejectedByName?: string;
  financialRejectedAt?: string;
  financialApprovalNotes?: string;
  financialRequestedBy?: string;
  financialRequestedByName?: string;
  financialRequestedAt?: string;
  approvedQuoteVersion?: number;
  financialApprovalSnapshot?: {
    total: number;
    subtotal: number;
    discount?: number;
    paymentTerms?: string;
    customerId?: string;
    version: number;
  };
  // Marketing & Attribution (Fase 5)
  campaignId?: string;
  campaignName?: string;
  originChannel?: string;
  utmSource?: string;
  utmCampaign?: string;
  items: QuoteItem[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export type OrderStatus =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'RESERVADO'
  | 'EN_SURTIDO'
  | 'SURTIDO'
  | 'SURTIDO_PARCIAL'
  | 'LISTO_PARA_EMBARQUE'
  | 'LISTO_EMBARQUE'
  | 'PROGRAMADO'
  | 'EN_PREPARACION_DE_CARGA'
  | 'CARGANDO'
  | 'CARGADO'
  | 'EN_RUTA'
  | 'EN RUTA'
  | 'ENTREGADO'
  | 'ENTREGA_PARCIAL'
  | 'INCIDENCIA'
  | 'REPROGRAMADO'
  | 'CANCELADO';

export interface OrderItem {
  id?: string;
  order_id?: string;
  orderId?: string;
  product_id?: string;
  productId?: string;
  product_code?: string;
  productCode?: string;
  sku?: string;
  product_name?: string;
  productName?: string;
  name?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  quantityOrdered?: number;
  quantityReserved?: number;
  quantityFulfilled?: number;
  quantityPending?: number;
  requestedQty?: number;
  fulfilledQty?: number;
  remainingQty?: number;
  deliveredQuantity?: number;
  delivered_quantity?: number;
  deliveredQty?: number;
  fulfillmentStatus?: string;
  location?: string;
  barcode?: string;
  unit_price?: number;
  unitPrice?: number;
  price?: number;
  discount?: number;
  discountPct?: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number?: string; // e.g. PED-000001
  orderNumber?: string;
  folio?: string;
  quote_id?: string;
  quoteId?: string;
  quote_number?: string;
  quoteFolio?: string;
  customer_id?: string;
  customerId?: string;
  customer_name?: string;
  customerName?: string;
  customerRFC?: string;
  salesperson_id?: string;
  salespersonId?: string;
  salesperson_name?: string;
  salespersonName?: string;
  sellerId?: string;
  sellerName?: string;
  salesExecutiveId?: string;
  sales_executive_id?: string;
  warehouse_id?: string;
  warehouseId?: string;
  warehouse_name?: string;
  warehouseName?: string;
  status: OrderStatus;
  fulfillmentStatus?: OrderFulfillmentStatus;
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  orderDate?: string;
  date?: string;
  delivery_date?: string;
  deliveryDate?: string;
  delivery_status?: string;
  deliveryStatus?: string;
  routeId?: string;
  route_id?: string;
  promisedDate?: string;
  delivery_address?: string;
  deliveryAddress?: string;
  shippingAddress?: string;
  shipping_address?: string;
  payment_terms?: string;
  paymentTerms?: string;
  notes?: string;
  fulfillmentNotes?: string;
  fulfilled_by?: string;
  fulfilledByName?: string;
  fulfilled_at?: string;
  fulfilledAt?: string;
  physicalFulfillmentConfirmed?: boolean;
  masterTransactionId?: string;
  master_transaction_id?: string;
  pod?: DeliveryEvidence;
  podId?: string;
  pickingId?: string;
  picking?: Picking;
  assignedSalesExecutiveId?: string;
  assigned_sales_executive_id?: string;
  // Marketing & Attribution (Fase 5)
  campaignId?: string;
  campaignName?: string;
  originChannel?: string;
  utmSource?: string;
  utmCampaign?: string;
  acquisitionCostAtOrder?: number;
  items: OrderItem[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  userId?: string;
  user_name?: string;
  userName?: string;
  user_role?: UserRole;
  userRole?: UserRole;
  module: ERPModule;
  action: string;
  entity_type?: string;
  entityType?: string;
  entity_id?: string;
  entityId?: string;
  recordId?: string;
  details?: string;
  ip?: string;
  previous_value?: string;
  previousValue?: string;
  new_value?: string;
  newValue?: string;
  masterTransactionId?: string;
  master_transaction_id?: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'EXITO' | 'ADVERTENCIA' | 'CRITICA';
  module: ERPModule;
  read: boolean;
  link?: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
}

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'ACTIVO' | 'INACTIVO';

export interface Supplier {
  id: string;
  supplier_number?: string;
  supplierNumber?: string; // e.g. "PRV-001"
  name: string;
  company_name?: string;
  companyName?: string;
  legal_name?: string;
  legalName?: string;
  tax_id?: string;
  taxId?: string;
  rfc?: string;
  contact_name?: string;
  contactName?: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  category: string;
  payment_terms?: string;
  paymentTerms?: string;
  payment_terms_days?: number;
  paymentTermsDays?: number;
  paymentDays?: number;
  currency?: string;
  credit_limit?: number;
  creditLimit?: number;
  lead_time_days?: number;
  leadTimeDays?: number;
  rating?: number; // 1 to 5
  status?: SupplierStatus;
  notes?: string;
  website?: string;
  bankName?: string;
  bankAccount?: string;
  bankClabe?: string;
  otif_score?: number; // 0 to 100
  quality_score?: number; // 0 to 100
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface CompanyConfig {
  company_name?: string;
  companyName?: string;
  businessName?: string;
  trade_name?: string;
  tradeName?: string;
  tax_id?: string;
  taxId?: string;
  rfc?: string;
  fiscalRegime?: string;
  currency?: string;
  tax_rate?: number;
  taxRate?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  fiscalYear?: number;
  auto_reserve_on_order?: boolean;
  autoReserveInventoryOnOrder?: boolean;
  requireCreditApprovalForOverlimit?: boolean;
  allow_negative_stock?: boolean;
  // CRM & Sales Configuration Policies
  sellerMaxDiscountPercent?: number; // default 5%
  maxDiscountSalesperson?: number; // default 5% (alias)
  maxDiscountManager?: number; // default 10%
  maxDiscountDirector?: number; // default 100% (unlimited)
  minGrossMarginPct?: number; // default 18%
  blockBelowMinMargin?: boolean; // default false
  defaultCommissionRate?: number; // default 2.5%
}

export interface CommercialSettings {
  sellerMaxDiscountPercent: number; // Single source of truth for seller max discount (default 5%)
  minGrossMarginPct?: number;
  managerMaxDiscountPercent?: number;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  masterTransactionId?: string;
}

// ==========================================
// CRM & VENTAS TYPES (FASE 1)
// ==========================================

export type LeadSource =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'GOOGLE'
  | 'WHATSAPP'
  | 'WEB'
  | 'REFERIDO'
  | 'LLAMADA'
  | 'OTRO';

export type LeadStatus =
  | 'NUEVO'
  | 'CONTACTADO'
  | 'CALIFICADO'
  | 'CONVERTIDO'
  | 'NO_CONTESTO'
  | 'DESCARTADO'
  | 'CONTINUAR_SEGUIMIENTO';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  state?: string;
  colonia?: string;
  zipCode?: string;
  source: LeadSource;
  salespersonId: string;
  salespersonName: string;
  creationDate: string;
  status: LeadStatus;
  notes: string;
  estimatedValue?: number;
  convertedCustomerId?: string;
  convertedOpportunityId?: string;
  qualificationScore?: number; // 1-100
  productInterest?: string;
  rfc?: string;
  // Marketing & Attribution Integration (Fase 5)
  campaignId?: string;
  campaignName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  firstTouchChannel?: string;
  lastTouchChannel?: string;
  touchpoints?: Touchpoint[];
  acquisitionCost?: number;
  createdAt: string;
  updatedAt: string;
  folio?: string;
  company_name?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  salesExecutiveId?: string;
  sales_executive_id?: string;
  value?: number;
}

export interface PipelineStageConfig {
  id: string;
  code: string;
  name: string;
  order: number;
  probability: number; // 0 to 100
  color: string;
  isWon?: boolean;
  isLost?: boolean;
  description?: string;
}

export interface AIOpportunityAnalysis {
  probability: number;
  strengths: string[];
  risks: string[];
  nextAction: string;
  daysWithoutContact: number;
  summary: string;
  analyzedAt: string;
  confidence: 'ALTA' | 'MEDIA' | 'BAJA';
  urgency?: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface Opportunity {
  id: string;
  folio: string;
  leadId?: string;
  lead_id?: string;
  customerId: string;
  customer_id?: string;
  customerName: string;
  salespersonId: string;
  salesperson_id?: string;
  salespersonName: string;
  salesExecutiveId?: string;
  sales_executive_id?: string;
  title: string;
  estimatedValue: number;
  estimated_value?: number;
  probability: number; // 0 to 100
  expectedCloseDate: string;
  expected_close_date?: string;
  stage: string; // matches stage code or name
  source: LeadSource;
  notes: string;
  quoteId?: string;
  quoteFolio?: string;
  orderId?: string;
  orderFolio?: string;
  // Marketing & Attribution Integration (Fase 5)
  campaignId?: string;
  campaignName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  firstTouchCampaignId?: string;
  lastTouchCampaignId?: string;
  attributedRevenue?: number;
  touchpoints?: Touchpoint[];
  itemsOfInterest?: {
    productCode: string;
    productName: string;
    quantity: number;
    estimatedPrice: number;
  }[];
  aiAnalysis?: AIOpportunityAnalysis;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export type ActivityType =
  | 'LLAMADA'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'CORREO'
  | 'REUNION'
  | 'SEGUIMIENTO'
  | 'VISITA_TECNICA'
  | 'PRESENTACION_COTIZACION'
  | 'NOTA';

export interface CRMActivity {
  id: string;
  userId: string;
  userName: string;
  salespersonId?: string;
  salespersonName?: string;
  userRole?: UserRole;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  leadId?: string;
  date: string;
  time: string;
  type: ActivityType;
  result: string;
  nextAction: string;
  createdAt: string;
}

export type Activity = CRMActivity;

export type FollowUpStatus = 'PENDIENTE' | 'COMPLETADO' | 'VENCIDO' | 'CANCELADO';
export type FollowUpPriority = 'ALTA' | 'MEDIA' | 'BAJA';

export interface FollowUp {
  id: string;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  leadId?: string;
  leadName?: string;
  salespersonId: string;
  salespersonName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  priority: FollowUpPriority;
  description: string;
  type: ActivityType;
  status: FollowUpStatus;
  completedAt?: string;
  completedNotes?: string;
  createdAt: string;
}

export interface SalesGoal {
  id: string;
  salespersonId: string;
  salespersonName: string;
  period: string; // e.g. "Agosto 2026"
  goalAmount: number;
  targetAmount?: number;
  actualSales: number;
  achievedAmount?: number;
  dealsWonCount: number;
  quotesGeneratedCount: number;
  fulfillmentPct: number; // (actualSales / goalAmount) * 100
  commissionEstimated: number;
  commissionEarned?: number;
}

export interface CommissionTier {
  minPercent?: number;
  maxPercent?: number;
  minMarginPct?: number;
  maxMarginPct?: number;
  rate: number;
  bonusFixed?: number;
  description?: string;
}

export interface CommissionRule {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type?: 'ESCALONADA_VENTAS' | 'POR_MARGEN' | 'POR_FAMILIA_PRODUCTO' | 'BONO_ACELERADOR' | 'LINEAL_POR_CATEGORIA' | 'FIJA';
  targetType?: 'VOLUMEN_VENTAS' | 'MARGEN_BRUTO' | 'NUEVOS_CLIENTES' | 'CATEGORIA_PRODUCTO';
  salespersonId?: string; // specific user id or 'TODOS'
  salespersonName?: string;
  basePercentage?: number; // e.g. 2.5
  categoryId?: string; // specific product category or 'TODAS'
  minFulfillmentPct?: number; // e.g. 100
  bonusPercentage?: number; // e.g. 1.0
  period?: string;
  condition?: string;
  minMarginRequiredPct?: number;
  tiers?: CommissionTier[];
  active: boolean;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  notes?: string;
}

export interface AIFollowUpDraft {
  channel: 'WHATSAPP' | 'EMAIL' | 'LLAMADA';
  subject?: string;
  body: string;
  talkingPoints?: string[];
  suggestedFollowUpDate: string;
}

export interface RolePermissionsMap {
  [role: string]: {
    [module in ERPModule]?: ActionPermission[];
  };
}

export interface DashboardKPIs {
  ventas_hoy: number;
  ventas_mes: number;
  meta_mensual: number;
  cumplimiento_pct: number;
  utilidad_bruta: number;
  margen_promedio_pct: number;
  total_cartera: number;
  cartera_vencida: number;
  pedidos_activos_count: number;
  cotizaciones_pendientes_count: number;
  stock_critico_count: number;
  total_inventario_piezas: number;
  entregas_hoy_count: number;
}

// ==========================================
// FASE 3: LOGÍSTICA, RUTAS Y ENTREGAS (TYPES)
// ==========================================

export type LogisticsStatus =
  | 'LISTO_PARA_EMBARQUE'
  | 'PROGRAMADO'
  | 'EN_PREPARACION_DE_CARGA'
  | 'CARGANDO'
  | 'CARGADO'
  | 'EN_RUTA'
  | 'ENTREGA_PARCIAL'
  | 'ENTREGADO'
  | 'INCIDENCIA'
  | 'REPROGRAMADO'
  | 'CANCELADO';

export type VehicleStatus = 'AVAILABLE' | 'IN_ROUTE' | 'MAINTENANCE' | 'INACTIVE';

export interface Vehicle {
  id: string;
  economicNumber: string; // e.g. "ECO-01"
  economic_number?: string;
  plate: string;
  brandModel: string; // e.g. "Ford F-350 Heavy Duty"
  type: string; // e.g. "Camioneta 3.5 Ton", "Rabón 8 Ton", "Torthon 15 Ton", "Camioneta 1.5 Ton"
  capacityWeight: number; // kg (e.g. 3500)
  capacity_weight?: number;
  capacityVolume: number; // m³ (e.g. 18)
  capacity_volume?: number;
  status: VehicleStatus;
  currentOdometer: number; // km (e.g. 48200)
  current_odometer?: number;
  insuranceExpiration: string; // YYYY-MM-DD
  insurance_expiration?: string;
  insurancePolicy?: string;
  verificationExpiration?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceOdometer?: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  fuelLevel?: number; // 0 - 100 percentage
  notes?: string;
}

export type DriverStatus = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'EN_RUTA';

export interface Driver {
  id: string;
  employeeId: string; // e.g. "EMP-041"
  employee_id?: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string; // e.g. "LIC-FED-8841920"
  license_number?: string;
  licenseType: string; // e.g. "Tipo B Federal", "Tipo C Estatal"
  license_type?: string;
  licenseExpiration: string; // YYYY-MM-DD
  license_expiration?: string;
  status: DriverStatus;
  currentRouteId?: string;
  rating?: number; // e.g. 4.8 / 5
  medicalCertificateExpiration?: string;
  notes?: string;
}

export interface DepartureChecklist {
  vehicleInspected?: boolean;
  vehicleInspectionOk?: boolean;
  tiresAndBrakesOk?: boolean;
  driverLicenseValid?: boolean;
  driverEquipped?: boolean;
  shippingDocumentsIncluded?: boolean;
  remisionesPrinted?: boolean;
  materialVerified?: boolean;
  cargoSecured?: boolean;
  cargoStrapped?: boolean;
  fuelLevelOk?: boolean;
  fuelLevel?: number;
  odometerReading?: number;
  odometerKm?: number;
  comments?: string;
  notes?: string;
  releasedBy?: string;
  releasedByName?: string;
  releasedAt: string;
}

export type RouteDepartureChecklist = DepartureChecklist;

export interface DeliveryItem {
  orderItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantityOrdered: number;
  quantityShipped: number;
  quantityDelivered: number;
  quantityDifference: number;
  rejectionReason?: string;
  notes?: string;
}

export interface DeliveryEvidenceItem {
  productId?: string;
  orderItemId?: string;
  sku: string;
  description: string;
  unit?: string;
  qtyExpected: number;
  qtyReceived: number;
  difference: number;
  rejectionReason?: string;
}

export interface DeliveryEvidence {
  id?: string;
  podId?: string;
  routeStopId?: string;
  deliveryId?: string;
  routeId?: string;
  orderId?: string;
  orderNumber?: string;
  masterTransactionId?: string;
  customerId?: string;
  customerName?: string;
  registeredByUserId?: string;
  registeredByName?: string;
  verifiedByUser?: string;
  recipientName: string;
  receivedByName?: string;
  recipientIdNumber?: string;
  receivedByRole?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  signature?: string; // Base64 Data URL or digital svg string
  signatureUrl?: string;
  photoUrl?: string;
  photoEvidence?: string; // Base64 Data URL or hosted URL
  photoEvidenceUrl?: string;
  documentUrl?: string;
  timestamp: string;
  comments?: string;
  notes?: string;
  observations?: string;
  guideNumber?: string;
  vehicle?: string;
  driver?: string;
  status?: 'ENTREGADO' | 'PARTIAL' | 'PENDING' | 'FAILED' | string;
  items?: DeliveryEvidenceItem[];
  createdAt?: string;
  updatedAt?: string;
  latitude?: number;
  longitude?: number;
  satisfactionRating?: number; // 1 to 5
}

export type POD = DeliveryEvidence;

export type RouteStopStatus =
  | 'PENDING'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'PARTIAL'
  | 'FAILED'
  | 'RESCHEDULED';

export type DeliveryFailureReason =
  | 'CLIENTE_AUSENTE'
  | 'DIRECCION_INCORRECTA'
  | 'RECHAZO_MERCANCIA'
  | 'ACCESO_DENEGADO'
  | 'DOMICILIO_CERRADO'
  | 'OBRA_NO_LISTA'
  | 'SIN_FONDOS'
  | 'VEHICULO'
  | 'CLIMA'
  | 'FUERA_DE_HORARIO'
  | 'FALTA_DOCUMENTACION'
  | 'OTRO';

export type FailureReason = DeliveryFailureReason;

export interface RouteStop {
  id: string;
  routeId: string;
  orderIndex: number; // 1, 2, 3...
  orderId: string;
  orderNumber: string;
  orderFolio?: string;
  customerId: string;
  customerName: string;
  contactName: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state?: string;
  scheduledTime: string; // e.g. "09:00 - 10:30"
  status: RouteStopStatus;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalUnits: number;
  isLoaded: boolean;
  masterTransactionId?: string;
  items: DeliveryItem[];
  evidence?: DeliveryEvidence;
  deliveryEvidence?: DeliveryEvidence;
  failureReason?: DeliveryFailureReason;
  failureComment?: string;
  rescheduledDate?: string;
}

export type RouteStatus =
  | 'PLANNED'
  | 'LOADING'
  | 'LOADED'
  | 'IN_ROUTE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Route {
  id: string;
  routeNumber: string; // e.g. "RUT-2026-0801"
  route_number?: string;
  date: string; // YYYY-MM-DD
  warehouseId: string;
  warehouse_id?: string;
  warehouseName: string;
  warehouse_name?: string;
  vehicleId: string;
  vehicle_id?: string;
  vehiclePlate?: string;
  vehicleName?: string;
  driverId: string;
  driver_id?: string;
  driverName: string;
  driverPhone?: string;
  status: RouteStatus;
  zone?: string; // e.g. "Corredor Industrial Naucalpan - Tlalnepantla", "Valle de Toluca", "Zona Metropolitana CDMX"
  estimatedDistanceKm: number;
  estimated_distance?: number;
  estimatedDuration: string; // e.g. "4h 30m"
  estimated_time?: string;
  actualDistanceKm?: number;
  actual_distance?: number;
  actualDuration?: string;
  actual_time?: string;
  notes?: string;
  departureChecklist?: DepartureChecklist;
  departureTime?: string;
  completionTime?: string;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalOrders: number;
  totalItems: number;
  stops: RouteStop[];
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export type LogisticsIncidentType =
  | 'DANO'
  | 'FALTANTE'
  | 'DEVOLUCION'
  | 'RETRASO'
  | 'DIRECCION'
  | 'CLIENTE'
  | 'VEHICULO'
  | 'MECANICO'
  | 'ACCIDENTE'
  | 'CLIMA'
  | 'DOCUMENTACION'
  | 'OTRO';

export type LogisticsIncidentSeverity = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type LogisticsIncidentStatus = 'ABIERTA' | 'EN_PROCESO' | 'EN_INVESTIGACION' | 'RESUELTA' | 'CANCELADA';

export interface LogisticsIncident {
  id: string;
  folio?: string; // e.g. "INC-LOG-001"
  incidentNumber?: string;
  orderId?: string;
  orderNumber?: string;
  routeId?: string;
  routeNumber?: string;
  customerId?: string;
  customerName?: string;
  userId?: string;
  userName?: string;
  date?: string; // YYYY-MM-DD HH:mm
  timestamp?: string;
  type: LogisticsIncidentType;
  severity: LogisticsIncidentSeverity;
  description: string;
  evidenceUrl?: string;
  status: LogisticsIncidentStatus;
  actionTaken?: 'REPROGRAMAR_ENTREGA' | 'GENERAR_DEVOLUCION' | 'CAMBIO_UNIDAD' | 'CANCELAR_PEDIDO' | string;
  resolution?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByName?: string;
}

export type LogisticsReturnStatus =
  | 'SOLICITADA'
  | 'PENDIENTE_AUTORIZACION'
  | 'AUTORIZADA'
  | 'PENDIENTE_RECEPCION'
  | 'RECIBIDA'
  | 'PENDIENTE_INSPECCION'
  | 'EN_INSPECCION'
  | 'INSPECCIONADA'
  | 'PENDIENTE_ACEPTACION'
  | 'COMPLETADA'
  | 'APLICADA'
  | 'REINTEGRADO_INVENTARIO'
  | 'REINGRESADA_INVENTARIO'
  | 'RECHAZADA'
  | 'RECHAZADO_MERMA';

export type LogisticsReturnItemCondition =
  | 'BUEN_ESTADO'
  | 'APTO_PARA_VENTA'
  | 'APTA_PARA_INVENTARIO'
  | 'NO_APTO_PARA_VENTA'
  | 'DANADO'
  | 'EMPAQUE_ABIERTO'
  | 'DEFECTUOSO'
  | 'MERMA'
  | 'CUARENTENA';

export interface LogisticsReturnItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantityReturned: number;
  receivedQty?: number;
  acceptedQty?: number;
  rejectedQty?: number;
  condition: LogisticsReturnItemCondition;
  reason: string;
  reinspected?: boolean;
  inventoryReintegrated?: boolean;
  warehouseLocation?: string;
  dispositionAction?: 'REINGRESO_INVENTARIO' | 'MERMA_CALIDAD' | 'DEVOLUCION_PROVEEDOR' | 'CUARENTENA';
}

export interface LogisticsReturn {
  id: string;
  folio?: string; // e.g. "DEV-LOG-001" or "DEV-TEST-015"
  returnNumber?: string;
  orderId: string;
  orderNumber: string;
  routeId?: string;
  routeNumber?: string;
  customerId: string;
  customerName: string;
  date?: string;
  timestamp?: string;
  items: LogisticsReturnItem[];
  status: LogisticsReturnStatus;
  reasonSummary?: string;
  reason?: string;
  comment?: string;
  masterTransactionId?: string;
  // Authorization stage
  authorizedBy?: string;
  authorizedByName?: string;
  authorizedAt?: string;
  authorizationRole?: string;
  // Rejection stage
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  // Physical reception stage
  receivedQty?: number;
  receivedBy?: string;
  receivedByName?: string;
  receivedAt?: string;
  receptionNotes?: string;
  // Inspection stage
  acceptedQty?: number;
  rejectedQty?: number;
  condition?: string;
  inspectionDisposition?: 'APTA_PARA_INVENTARIO' | 'DANADO_CUARENTENA' | 'MERMA_TOTAL';
  targetLocationId?: string;
  inspectorId?: string;
  inspectorName?: string;
  inspectedByName?: string;
  inspectedAt?: string;
  inspectionNotes?: string;
  // Final acceptance & Inventory
  reintegrationMovementId?: string;
  reintegratedWarehouseId?: string;
  reintegratedWarehouseName?: string;
  reintegratedAt?: string;
  appliedAt?: string;
  appliedBy?: string;
  appliedByName?: string;
  idempotencyKey?: string;
  processedAt?: string;
  notes?: string;
}

export interface LogisticsKPIs {
  pedidos_listos_count: number;
  pedidos_programados_count: number;
  vehiculos_disponibles_count: number;
  vehiculos_en_ruta_count: number;
  entregas_hoy_count: number;
  entregas_realizadas_count: number;
  entregas_pendientes_count: number;
  entregas_fallidas_count: number;
  incidencias_activas_count: number;
  otif_percentage: number;
  on_time_percentage: number;
  in_full_percentage: number;
  failed_delivery_percentage?: number;
  avg_delivery_time_min?: number;
  avg_loading_time_min?: number;
}

export interface AIRouteRecommendation {
  suggestedVehicleId?: string;
  suggestedVehicleName?: string;
  suggestedDriverId?: string;
  suggestedDriverName?: string;
  recommendedVehicleId?: string;
  recommendedVehicleName?: string;
  recommendedDriverId?: string;
  recommendedDriverName?: string;
  orderIds?: string[];
  stopsSequence?: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    city: string;
    estimatedArrival: string;
    reasoning: string;
  }[];
  suggestedStopSequence?: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    address?: string;
    recommendedOrder: number;
    estimatedArrivalTime: string;
    unloadingTimeMinutes: number;
    reasoning: string;
  }[];
  loadingOrderAdvice?: {
    loadingOrder: number;
    orderNumber: string;
    customerName: string;
    advice: string;
  }[];
  totalEstimatedDistanceKm?: number;
  estimatedTotalDistanceKm?: number;
  totalEstimatedDuration?: string;
  estimatedTotalDurationMinutes?: number;
  estimatedFuelCostMxn?: number;
  loadWeightCapacityPct?: number;
  loadVolumeCapacityPct?: number;
  capacityUtilizationPct?: {
    weightPct: number;
    volumePct: number;
  };
  confidenceScore?: number;
  optimizationScore?: number;
  optimizationRationale?: string;
  alerts?: string[];
  aiInsights?: string[];
}

// ==========================================
// FASE 4: COMPRAS, PROVEEDORES & REABASTECIMIENTO (TYPES)
// ==========================================

export type SupplierContactType =
  | 'VENTAS'
  | 'COBRANZA'
  | 'LOGISTICA'
  | 'DIRECCION'
  | 'TECNICO'
  | 'OTRO';

export interface SupplierContact {
  id: string;
  supplier_id?: string;
  supplierId?: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  type: SupplierContactType;
  status: 'ACTIVO' | 'INACTIVO';
  notes?: string;
  isPrimary?: boolean;
}

export interface SupplierProduct {
  id: string;
  supplier_id?: string;
  supplierId?: string;
  supplier_name?: string;
  supplierName?: string;
  product_id?: string;
  productId?: string;
  product_code?: string;
  productCode?: string;
  product_name?: string;
  productName?: string;
  supplier_sku: string;
  purchase_price: number;
  currency: string;
  minimum_order_quantity: number; // MOQ
  lead_time_days: number;
  preferred: boolean;
  last_purchase_date?: string;
  last_purchase_price?: number;
  notes?: string;
  status: 'ACTIVO' | 'INACTIVO';
}

export interface PurchasePriceHistory {
  id: string;
  supplier_id?: string;
  supplierId?: string;
  supplier_name?: string;
  supplierName?: string;
  product_id?: string;
  productId?: string;
  product_code?: string;
  productCode?: string;
  product_name?: string;
  productName?: string;
  purchase_order_id?: string;
  purchaseOrderId?: string;
  purchase_order_number?: string;
  purchaseOrderNumber?: string;
  unit_price: number;
  quantity: number;
  currency: string;
  purchase_date: string; // YYYY-MM-DD
}

export type PurchaseRequestStatus =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'BORRADOR'
  | 'DRAFT'
  | 'PENDIENTE_APROBACION'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APROBADA'
  | 'APPROVED'
  | 'EN_COTIZACION'
  | 'RECHAZADA'
  | 'REJECTED'
  | 'CONVERTIDA_A_ORDEN'
  | 'CONVERTIDA_OC'
  | 'CONVERTED'
  | 'CANCELADA'
  | 'CANCELLED';

export type PurchaseRequestPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface PurchaseRequestItem {
  id: string;
  request_id?: string;
  requestId?: string;
  product_id: string;
  productId?: string;
  product_code: string;
  productCode?: string;
  product_name: string;
  productName?: string;
  unit?: string;
  quantity: number;
  estimated_price?: number;
  estimatedPrice?: number;
  estimated_unit_cost?: number;
  estimatedUnitCost?: number;
  total_estimated?: number;
  estimated_total?: number;
  justification?: string;
  required_date?: string;
  requiredDate?: string;
  notes?: string;
  suggested_supplier_id?: string;
  suggested_supplier_name?: string;
}

export interface PurchaseRequest {
  id: string;
  request_number: string; // e.g. "SC-2026-001"
  requested_by: string; // user ID
  requested_by_name: string;
  requester_id?: string;
  requester_name?: string;
  requestedByUserId?: string;
  requestedByUserName?: string;
  requestedByRole?: string;
  requestedAt?: string;
  department: string;
  warehouse_id: string;
  warehouse_name?: string;
  warehouseId?: string;
  warehouseName?: string;
  productId?: string;
  sku?: string;
  requestedQty?: number;
  priority: PurchaseRequestPriority;
  justification: string;
  reason?: string;
  observations?: string;
  status: PurchaseRequestStatus;
  required_date: string; // YYYY-MM-DD
  notes?: string;
  items: PurchaseRequestItem[];
  total_estimated_amount?: number;
  estimated_total?: number;
  masterTransactionId?: string;
  created_at: string;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  converted_purchase_order_id?: string;
  converted_purchase_order_number?: string;
  convertedPurchaseOrderId?: string;
  convertedPurchaseOrderNumber?: string;
  converted_at?: string;
  origin?: 'MANUAL' | 'ALMACEN' | 'VENTAS' | 'INVENTARIO' | 'IA_REABASTECIMIENTO' | 'ADMINISTRACION' | string;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  updated_at?: string;
  updatedAt?: string;
}

export type PurchaseOrderStatus =
  | 'BORRADOR'
  | 'DRAFT'
  | 'PENDIENTE_APROBACION'
  | 'PENDING_APPROVAL'
  | 'APROBADA'
  | 'APPROVED'
  | 'SENT'
  | 'SENT_TO_SUPPLIER'
  | 'CONFIRMED'
  | 'CONFIRMADA'
  | 'PARTIAL_RECEIVED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'RECIBIDA'
  | 'CANCELLED'
  | 'CANCELADA';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id?: string;
  purchaseOrderId?: string;
  product_id: string;
  productId?: string;
  product_code: string;
  productCode?: string;
  product_name: string;
  productName?: string;
  unit?: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_pending: number;
  unit_price: number;
  unitPrice?: number;
  unit_cost?: number;
  unitCost?: number;
  discount: number;
  discount_percentage?: number;
  tax_rate?: number;
  tax_percentage?: number;
  tax: number;
  subtotal: number;
  total: number;
  expected_date?: string;
  notes?: string;
}

export interface PurchaseOrder {
  supplier_confirmation_number?: string;
  id: string;
  purchase_order_number: string; // e.g. "OC-2026-001"
  purchaseOrderNumber?: string;
  po_number?: string;
  orderNumber?: string;
  supplier_id: string;
  supplier_name: string;
  supplier_rfc?: string;
  supplier_contact?: string;
  supplier_email?: string;
  warehouse_id: string;
  warehouse_name: string;
  requester_id?: string;
  requester_name?: string;
  buyer_id: string;
  buyer_name: string;
  order_date: string; // YYYY-MM-DD
  expected_date?: string; // YYYY-MM-DD
  expected_delivery_date?: string; // YYYY-MM-DD
  payment_terms: string;
  currency: string;
  exchange_rate?: number;
  subtotal: number;
  discount?: number;
  discount_total?: number;
  tax: number;
  total: number;
  // Landed Cost (Costo puesto en almacén)
  freight_cost?: number;
  shipping_cost?: number;
  shippingCost?: number;
  insurance_cost?: number;
  customs_cost?: number;
  other_costs?: number;
  landed_cost_total?: number;
  status: PurchaseOrderStatus;
  notes?: string;
  request_id?: string;
  request_number?: string;
  purchase_request_id?: string;
  purchase_request_number?: string;
  purchaseRequestId?: string;
  purchaseRequestNumber?: string;
  masterTransactionId?: string;
  master_transaction_id?: string;
  approval_level_required?: 'GERENTE' | 'DIRECTOR' | 'AUTO';
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  sent_at?: string;
  sent_by?: string;
  sent_by_name?: string;
  sent_method?: 'EMAIL' | 'PORTAL' | 'WHATSAPP' | 'TELEFONO';
  sent_contact?: string;
  sent_reference?: string;
  items: PurchaseOrderItem[];
  origin?: 'MANUAL' | 'SOLICITUD' | 'IA_REABASTECIMIENTO' | 'REORDEN_AUTOMATICO' | string;
  created_at: string;
  updated_at?: string;
}

export interface PurchaseApprovalLimit {
  id: string;
  name: string;
  role: UserRole;
  max_amount_mxn: number; // 0 for unlimited, or e.g. 50000
  requires_second_signature?: boolean;
  description: string;
}

export type GoodsReceiptStatus = 'BORRADOR' | 'RECEIVED' | 'PARTIAL' | 'CONFIRMED' | 'REJECTED';

export type GoodsReceiptItemQuality = 'ACEPTADA' | 'RECHAZADA' | 'EN_REVISION';

export interface GoodsReceiptItem {
  id: string;
  receipt_id?: string;
  purchase_order_item_id?: string;
  product_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  quantity_ordered: number;
  quantity_previously_received?: number;
  quantity_received: number;
  quantity_accepted?: number;
  quantity_rejected?: number;
  quality_approved?: boolean;
  rejection_reason?: string;
  quality_status?: GoodsReceiptItemQuality;
  unit_price: number;
  total_cost?: number;
  destination_location?: string; // e.g. "N1 / R-02 / P-01 / Niv-2"
  warehouse_location?: string;
  destination_warehouse_id?: string;
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  receipt_number: string; // e.g. "REC-2026-001"
  purchase_order_id: string;
  purchase_order_number: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  received_by: string;
  received_by_name: string;
  received_at?: string; // ISO datetime
  receipt_date?: string;
  supplier_document?: string; // Factura / Remisión / Guía del proveedor
  supplier_remission_invoice_number?: string;
  supplier_carrier?: string;
  carrier_name?: string;
  driver_name?: string;
  vehicle_plates?: string;
  quality_inspection_status?: 'ACEPTADO' | 'PARCIAL' | 'RECHAZADO' | 'EN_REVISION' | string;
  quality_inspector_name?: string;
  notes?: string;
  status: GoodsReceiptStatus;
  items: GoodsReceiptItem[];
  inventory_movement_ids?: string[];
  created_at: string;
}

export type SupplierReturnStatus =
  | 'BORRADOR'
  | 'SOLICITADA'
  | 'PENDIENTE'
  | 'AUTORIZADA'
  | 'ENVIADA'
  | 'APLICADA'
  | 'RECHAZADA'
  | 'CANCELADA';

export interface SupplierReturnItem {
  id: string;
  return_id?: string;
  product_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_cost?: number;
  unit_price?: number;
  total_amount?: number;
  reason?: string;
  condition?: 'DEFECTUOSO' | 'DANADO' | 'NO_CORRESPONDE' | 'EXCEDENTE' | string;
  lot_number?: string;
}

export interface SupplierReturn {
  credit_note_folio?: string;
  id: string;
  return_number: string; // e.g. "DEV-PRV-001"
  purchase_order_id?: string;
  purchase_order_number?: string;
  goods_receipt_id?: string;
  goods_receipt_number?: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  items: SupplierReturnItem[];
  total_amount: number;
  status: SupplierReturnStatus;
  reason?: string;
  reason_summary?: string;
  notes?: string;
  requested_by: string;
  requested_by_name: string;
  requested_at?: string;
  authorized_by?: string;
  authorized_by_name?: string;
  authorized_at?: string;
  shipped_at?: string;
  carrier?: string;
  tracking_number?: string;
  inventory_movement_id?: string; // Movement when stock physically exits
  created_at?: string;
}

export interface ReorderConfig {
  id?: string;
  productId?: string;
  product_id: string;
  product_code: string;
  product_name: string;
  minimum_stock: number;
  maximum_stock: number;
  safety_stock: number;
  average_daily_consumption: number; // Consumo promedio diario
  lead_time_days: number;
  reorder_point: number; // (Consumo Diario * Lead Time) + Stock Seguridad
  preferred_supplier_id?: string;
  preferred_supplier_name?: string;
  moq?: number;
  auto_generate_suggestions?: boolean;
  autoGenerateSuggestions?: boolean;
  updated_at?: string;
  updatedAt?: string;
}

export interface ProductReorderAnalysis {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  physicalStock: number;
  reservedStock: number;
  inTransitStock: number;
  availableStock: number;
  projectedStock?: number; // availableStock + inTransitStock
  committedStock: number;
  netPosition: number; // available + in_transit - committed
  averageDailyConsumption: number;
  leadTimeDays: number;
  safetyStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  daysOfInventoryLeft: number;
  isRiskOfStockout: boolean;
  isOverstocked: boolean;
  suggestedPurchaseQuantity: number;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  moq?: number;
  unitCost: number;
  estimatedInvestment: number;
  urgency: 'CRITICA' | 'ALTA' | 'MEDIA' | 'NORMAL' | 'SOBRESTOCK';
  explanation: string;
}

export interface ProductReorderStatus {
  product_id: string;
  product_code: string;
  product_name: string;
  warehouse_id?: string;
  current_stock: number;
  reorder_point: number;
  safety_stock: number;
  average_daily_demand: number;
  lead_time_days: number;
  days_of_supply: number;
  unit: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPTIMAL';
  suggested_quantity: number;
  estimated_cost: number;
  suggested_supplier_id?: string;
  suggested_supplier_name?: string;
}

export interface ReplenishmentSuggestion {
  id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  warehouse_id?: string;
  current_stock: number;
  physical_stock?: number;
  reserved_stock?: number;
  available_stock?: number;
  incoming_stock?: number;
  projected_stock?: number;
  target_stock?: number;
  reorder_point: number;
  safety_stock: number;
  average_daily_demand: number;
  lead_time_days: number;
  days_of_supply: number;
  unit: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPTIMAL' | string;
  suggested_quantity: number;
  estimated_cost: number;
  suggested_supplier_id?: string;
  suggested_supplier_name?: string;
  reason: string;
  existing_request_detected?: boolean;
  existing_request_number?: string;
}

export interface PurchasesKPIs {
  pending_requests_count: number;
  pending_approval_orders_count: number;
  approved_orders_count: number;
  in_transit_orders_count: number;
  in_transit_units: number;
  in_transit_amount_mxn: number;
  monthly_purchases_amount_mxn: number;
  pending_receipts_count: number;
  critical_products_count: number;
  active_suppliers_count: number;
  supplier_otif_average: number;
  average_price_variation_pct: number;
}

export interface AIPurchaseRecommendation {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  physicalStock?: number;
  currentAvailableStock: number;
  reservedStock: number;
  inTransitStock: number;
  projectedStock?: number;
  targetStock?: number;
  averageDailyConsumption: number;
  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;
  daysUntilStockout: number;
  suggestedQuantity: number;
  recommendedSupplierId: string;
  recommendedSupplierName: string;
  supplierPrice: number;
  supplierMoq: number;
  supplierLeadTime: number;
  supplierRating: number;
  rationale: string;
  urgency: 'CRITICA' | 'ALTA' | 'MEDIA';
  estimatedCost: number;
  existingRequestDetected?: boolean;
  existingRequestNumber?: string;
  alternativeSuppliers?: {
    supplierId: string;
    supplierName: string;
    price: number;
    leadTimeDays: number;
    rating: number;
    prosAndCons: string;
  }[];
  dismissed?: boolean;
}

export interface SupplierEvaluation {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  onTimeDeliveriesPct: number;
  completeDeliveriesPct: number;
  rejectionRatePct: number;
  averageLeadTimeDays: number;
  priceVariationPct: number;
  incidentCount: number;
  overallScore: number; // 0-100
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'CONDICIONAL';
}

// ==========================================
// FASE 5: MARKETING & ATRIBUCIÓN COMERCIAL (TYPES)
// ==========================================

export type MarketingChannelType =
  | 'GOOGLE_ADS'
  | 'FACEBOOK_ADS'
  | 'LINKEDIN_ADS'
  | 'EMAIL_MARKETING'
  | 'SEO_ORGANICO'
  | 'WHATSAPP'
  | 'FERIA_INDUSTRIAL'
  | 'TELEMARKETING'
  | 'DIRECTO'
  | 'OTRO';

export type ChannelType = MarketingChannelType;

export interface MarketingChannel {
  id: string;
  code: string;
  name: string;
  type: MarketingChannelType;
  status: 'ACTIVO' | 'INACTIVO' | 'PAUSADO';
  description?: string;
  totalBudget: number;
  totalSpent: number;
  leadsGenerated: number;
  opportunitiesGenerated: number;
  wonOrdersCount: number;
  revenueAttributed: number;
  cpcAverage: number;
  cplAverage: number;
  cacAverage: number;
  roas: number;
  roi: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'BORRADOR' | 'PROGRAMADA' | 'ACTIVA' | 'PAUSADA' | 'FINALIZADA' | 'CANCELADA';

export type CampaignObjective =
  | 'GENERACION_LEADS'
  | 'BRANDING'
  | 'RECONQUISTA_CLIENTES'
  | 'LANZAMIENTO_PRODUCTO'
  | 'FIDELIZACION'
  | 'VENTA_CRUZADA';

export type AttributionModel =
  | 'FIRST_TOUCH'
  | 'LAST_TOUCH'
  | 'LINEAR'
  | 'TIME_DECAY'
  | 'POSITION_BASED'
  | 'DATA_DRIVEN';

export interface MarketingCampaign {
  id: string;
  code: string; // e.g. CAMP-2026-001
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  channelId: string;
  channelName: string;
  channelType: MarketingChannelType;
  targetAudience: string;
  segmentId?: string;
  segmentName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  allocatedBudget: number; // Presupuesto asignado MXN
  actualSpent: number; // Gasto real ejercido MXN
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  impressions: number;
  clicks: number;
  ctr: number; // (clicks / impressions) * 100
  conversionsLeads: number; // Leads generados
  opportunitiesCount: number; // Oportunidades vinculadas
  quotesCount: number; // Cotizaciones vinculadas
  ordersWonCount: number; // Pedidos cerrados ganados
  revenueAttributed: number; // Ventas totales atribuidas MXN
  cpl: number; // Costo por Lead = actualSpent / conversionsLeads
  cpa: number; // Costo por Adquisición = actualSpent / ordersWonCount
  roas: number; // Retorno de Inversión Publicitaria = revenueAttributed / actualSpent
  roi: number; // ROI = ((revenueAttributed - actualSpent) / actualSpent) * 100
  conversionRatePct: number; // (conversionsLeads / clicks) * 100
  leadToSaleRatePct: number; // (ordersWonCount / conversionsLeads) * 100
  notes?: string;
  aiRecommendation?: {
    status: 'EXCELENTE' | 'ESTABLE' | 'OPTIMIZAR' | 'CRITICA';
    summary: string;
    dataObservation: string;
    analysis: string;
    suggestedAction: string;
    budgetAction?: 'INCREMENTAR' | 'MANTENER' | 'REDUCIR' | 'PAUSAR';
    budgetDeltaAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type CampaignExpenseCategory =
  | 'PAID_ADS'
  | 'SOFTWARE_TOOLS'
  | 'AGENCIA_EXTERNA'
  | 'EVENTOS_STANDS'
  | 'DISENO_CONTENIDO'
  | 'LOGISTICA_PROMO';

export interface CampaignExpense {
  id: string;
  campaignId: string;
  campaignName: string;
  channelId: string;
  channelName: string;
  date: string;
  amount: number;
  invoiceNumber?: string;
  providerName: string;
  concept: string;
  category: ExpenseCategory;
  authorizedBy: string;
  authorizedByName?: string;
  createdAt: string;
}

export interface MarketingSegment {
  id: string;
  name: string;
  description: string;
  targetIndustry: string;
  estimatedAudienceSize: number;
  criteria: {
    states?: string[];
    minCreditLimit?: number;
    productInterest?: string[];
    leadStatus?: LeadStatus[];
  };
  activeLeadsCount: number;
  conversionRatePct: number;
  createdAt: string;
}

export interface Touchpoint {
  id: string;
  leadId?: string;
  opportunityId?: string;
  customerId?: string;
  campaignId: string;
  campaignName: string;
  channel: MarketingChannelType;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  timestamp: string;
  interactionType:
    | 'CLIC_ANUNCIO'
    | 'FORMULARIO_WEB'
    | 'WHATSAPP_INICIADO'
    | 'VISITA_STAND'
    | 'DESCARGA_CATALOGO'
    | 'LLAMADA_ENTRANTE'
    | 'EMAIL_ABIERTO';
  weightFirstTouch?: number;
  weightLastTouch?: number;
  weightLinear?: number;
  weightTimeDecay?: number;
  weightPositionBased?: number;
}

export interface MarketingKPIs {
  totalMarketingBudget: number;
  totalMarketingSpent: number;
  budgetExecutionPct: number;
  totalLeadsGenerated: number;
  totalMQLs: number;
  totalSQLs: number;
  totalOpportunities: number;
  totalCustomersAcquired: number;
  totalRevenueAttributed: number;
  overallCPL: number;
  overallCAC: number;
  overallROAS: number;
  overallROI: number;
  leadToCustomerConversionRate: number;
  activeCampaignsCount: number;
  topPerformingCampaign: {
    name: string;
    roas: number;
    revenue: number;
    leads: number;
  };
  topAcquisitionChannel: {
    name: string;
    leads: number;
    revenue: number;
  };
}

export interface AIMarketingProposal {
  id: string;
  code?: string;
  type:
    | 'REASIGNAR_PRESUPUESTO'
    | 'PAUSAR_CAMPANA'
    | 'ESCALAR_CAMPANA'
    | 'OPTIMIZAR_CANAL'
    | 'NUEVO_SEGMENTO'
    | 'SEGUIMIENTO_LEADS_ESTANCADOS';
  category?: string;
  impactLevel?: 'ALTO' | 'MEDIO' | 'BAJO';
  title: string;
  campaignId?: string;
  campaignName?: string;
  dataObservation: string; // DATO
  dataPoint?: string;
  analysis: string; // ANÁLISIS
  recommendation: string; // RECOMENDACIÓN
  expectedImpact: string;
  expectedOutcome?: string;
  status: 'PROPUESTA' | 'AUTORIZADA' | 'AUTORIZADO' | 'RECHAZADA' | 'RECHAZADO';
  suggestedBudgetDelta?: number;
  authorizedBy?: string;
  authorizedByName?: string;
  authorizedAt?: string;
  createdAt: string;
}

// ============================================================================
// FASE 6: RECURSOS HUMANOS (HR CENTER) DATA MODELS
// ============================================================================

export type DocumentType =
  | 'CONTRATO'
  | 'IDENTIFICACION'
  | 'COMPROBANTE_DOMICILIO'
  | 'CERTIFICACION'
  | 'LICENCIA_MANEJO'
  | 'CONSTANCIA_FISCAL'
  | 'DOCUMENTO_INTERNO'
  | 'OTRO';

export type DocumentStatus = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'EN_REVISION';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employee_id?: string;
  employeeName?: string;
  documentType: DocumentType;
  document_type?: DocumentType;
  title: string;
  fileReference: string;
  file_reference?: string;
  issueDate?: string;
  issue_date?: string;
  expirationDate?: string;
  expiration_date?: string;
  status: DocumentStatus;
  uploadedBy?: string;
  uploaded_by?: string;
  uploadedByName?: string;
  confidentialLevel?: 'PUBLICO' | 'CONFIDENCIAL_RH' | 'CONFIDENCIAL_DIRECTIVO';
  createdAt: string;
}

export interface EmployeeConfidentialData {
  employeeId: string;
  baseSalary: number;
  paymentFrequency: 'QUINCENAL' | 'MENSUAL' | 'SEMANAL';
  bankName: string;
  bankAccount: string;
  clabe: string;
  rfc: string;
  curp: string;
  nss: string;
  taxRegime: string;
  benefitsPackage: string[];
  confidentialNotes?: string;
  lastSalaryRevisionDate?: string;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'JUSTIFIED'
  | 'REMOTE'
  | 'OTHER'
  | 'PRESENTE'
  | 'RETARDO'
  | 'FALTA'
  | 'JUSTIFICADA'
  | 'REMOTO';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee_id?: string;
  employeeName?: string;
  employeeNumber?: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm:ss or ISO
  check_in?: string;
  checkOut?: string; // HH:mm:ss or ISO
  check_out?: string;
  shiftId?: string;
  shift_id?: string;
  shiftName?: string;
  scheduledCheckIn?: string;
  scheduledCheckOut?: string;
  status: AttendanceStatus;
  delayMinutes?: number;
  source: 'RELOJ_VIRTUAL' | 'BIOMETRICO' | 'APP_MOVIL' | 'MANUAL_SUPERVISOR';
  notes?: string;
  modifiedBy?: string;
  modifiedByName?: string;
  modifiedAt?: string;
}

export type AbsenceType =
  | 'VACACIONES'
  | 'PERMISO'
  | 'INCAPACIDAD'
  | 'FALTA_JUSTIFICADA'
  | 'PATERNIDAD_MATERNIDAD'
  | 'OTRO';

export type AbsenceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'CANCELADO';

export interface AbsenceRequest {
  id: string;
  folio: string; // e.g. 'AUS-2026-001'
  employeeId: string;
  employee_id?: string;
  employeeName: string;
  departmentId?: string;
  departmentName?: string;
  type: AbsenceType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: AbsenceStatus;
  requestedAt: string;
  managerId?: string;
  managerName?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewDate?: string;
  reviewComment?: string;
  impactOnPayroll?: boolean;
}

export interface VacationBalance {
  id: string;
  employeeId: string;
  employee_id?: string;
  employeeName: string;
  period: string; // e.g. '2026'
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  expirationDate?: string;
  seniorityYears?: number;
}

export type CommissionStatus =
  | 'CALCULATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'CANCELLED'
  | 'CALCULADA'
  | 'PENDIENTE_APROBACION'
  | 'APROBADA'
  | 'PAGADA'
  | 'CANCELADA';

export interface CommissionRecord {
  id: string;
  folio: string; // e.g. 'COM-2026-001'
  employeeId: string;
  employee_id?: string;
  employeeName: string;
  userId?: string;
  salespersonName: string;
  saleId?: string; // orderId / sale folio
  orderFolio?: string;
  customerName?: string;
  baseAmount: number; // Subtotal de la venta
  grossMarginAmount?: number;
  grossMarginPct?: number;
  commissionRuleId?: string;
  commissionRuleName?: string;
  commissionRate: number; // % aplicado
  commissionAmount: number; // Monto calculado
  status: CommissionStatus;
  period: string; // YYYY-MM
  calculatedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
}

export interface PayrollPeriod {
  items?: PayrollRecord[];
  id: string;
  folio: string; // e.g. 'NOM-2026-16'
  name: string; // '2da Quincena Agosto 2026'
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: 'BORRADOR' | 'EN_CALCULO' | 'APROBADA' | 'PAGADA' | 'CERRADA';
  totalGrossSalaries: number;
  totalCommissions: number;
  totalBonuses: number;
  totalPerceptions: number;
  totalDeductions: number;
  totalNetToPay: number;
  employeesCount: number;
  fiscalProviderStatus: 'PENDIENTE_CONFIGURACION_FISCAL' | 'CONECTADO';
  notes?: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName: string;
  positionName: string;
  departmentName: string;
  baseSalary: number;
  daysWorked: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  commissionsAmount: number;
  bonusesAmount: number;
  otherPerceptions?: number;
  totalPerceptions: number;
  taxWithholdingSimulated?: number;
  socialSecuritySimulated?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netPay: number;
  status: 'BORRADOR' | 'APROBADO' | 'PAGADO';
  bankAccountClabe?: string;
  isFiscalIntegrated: boolean; // false -> 'Pendiente de configuración fiscal'
}

export type ReviewStatus = 'DRAFT' | 'IN_REVIEW' | 'COMPLETED' | 'ACKNOWLEDGED' | 'BORRADOR' | 'EN_REVISION' | 'COMPLETADA' | 'CONFIRMADA';

export interface PerformanceReview {
  id: string;
  folio: string; // e.g. 'EVAL-2026-001'
  employeeId: string;
  employeeName: string;
  positionName: string;
  departmentName: string;
  reviewerId: string;
  reviewerName: string;
  period: string; // e.g. '2026-S1'
  reviewDate: string;
  overallScore: number; // 0 - 100
  categoryScores: {
    kpiAchievement: number;
    competencies: number;
    leadership: number;
    values: number;
  };
  strengths: string[];
  improvementAreas: string[];
  comments: string;
  actionPlan: string;
  status: ReviewStatus;
  nextReviewDate?: string;
}

export type GoalMetricType =
  | 'VENTAS_TOTALES'
  | 'MARGEN_PROMEDIO'
  | 'COTIZACIONES_CERRADAS'
  | 'PEDIDOS_SURTIDOS_ALMACEN'
  | 'ENTREGAS_PUNTUALES_LOGISTICA'
  | 'LEADS_GENERADOS_MARKETING'
  | 'AHORRO_COMPRAS'
  | 'CAPACITACION_EQUIPO'
  | 'OTRO';

export type GoalStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'NO_INICIADO'
  | 'EN_PROGRESO'
  | 'CUMPLIDO'
  | 'EN_RIESGO'
  | 'CANCELADO';

export interface EmployeeGoal {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  title: string;
  description: string;
  metricType: GoalMetricType;
  metricLabel: string;
  targetValue: number;
  actualValue: number;
  unit: 'MXN' | 'UNIDADES' | 'PCT' | 'HORAS' | 'RUTAS';
  progressPct: number;
  startDate: string;
  dueDate: string;
  status: GoalStatus;
  linkedModule?: ERPModule;
  autoCalculated: boolean;
}

export interface TrainingCourse {
  id: string;
  code: string; // 'CRS-001'
  courseId?: string;
  name: string;
  description: string;
  category:
    | 'SEGURIDAD_INDUSTRIAL'
    | 'PRODUCTO_AISLAMIENTOS'
    | 'VENTAS_CONSULTIVAS'
    | 'LOGISTICA_Y_ALMACEN'
    | 'LIDERAZGO_Y_GESTION'
    | 'CALIDAD_Y_NORMATIVA';
  instructor: string;
  durationHours: number;
  modality: 'PRESENCIAL' | 'ONLINE' | 'MIXTO';
  passingScore: number; // e.g. 80
  status: 'ACTIVO' | 'INACTIVO';
}

export type TrainingStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'ASIGNADO'
  | 'EN_CURSO'
  | 'COMPLETADO'
  | 'NO_APROBADO'
  | 'CANCELADO';

export interface EmployeeTraining {
  id: string;
  employeeId: string;
  employeeName: string;
  courseId: string;
  courseName: string;
  category: string;
  assignedDate: string;
  startDate?: string;
  completionDate?: string;
  score?: number;
  status: TrainingStatus;
  certificateReference?: string;
  expiryDate?: string;
  notes?: string;
}

export interface Skill {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
}

export interface EmployeeSkill {
  id: string;
  employeeId: string;
  employeeName: string;
  skillId: string;
  skillName: string;
  category: string;
  requiredLevel: number; // 1 to 5
  currentLevel: number; // 1 to 5
  gap: number; // required - current (>= 0 is gap)
  assessedDate: string;
  assessorName: string;
}

export interface AIHRAdvisorInsight {
  id: string;
  code?: string;
  type: 'DESEMPENO' | 'ASISTENCIA' | 'CAPACITACION' | 'COMISIONES' | 'RETENCION_CLIMA' | 'ALERTAS_DOCUMENTOS';
  title: string;
  dataObservation: string; // DATO OBSERVADO CON DATOS REALES
  patternAnalysis: string; // ANÁLISIS DEL PATRÓN
  possibleExplanation: string; // POSIBLE EXPLICACIÓN
  recommendation: string; // RECOMENDACIÓN ESTRATÉGICA
  departmentId?: string;
  departmentName?: string;
  employeeId?: string;
  employeeName?: string;
  impactLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  actionSuggested: string;
  status: 'NUEVO' | 'EN_REVISION' | 'ATENDIDO' | 'DESCARTADO';
  requiresHumanApproval: true; // Strict guarantee
  createdAt: string;
}

export interface HRKPIs {
  totalEmployees: number;
  activeEmployees: number;
  probationEmployees: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  todayVacations: number;
  pendingVacationRequests: number;
  pendingReviewsCount: number;
  pendingTrainingsCount: number;
  expiringDocumentsCount: number;
  totalMonthlyLaborCost: number;
  totalCommissionsAccrued: number;
  avgTurnoverRatePct?: number;
  avgAttendanceRatePct?: number;
  topSkillsGapArea?: {
    skillName: string;
    gapScore: number;
    department: string;
  };
  topSalesCommissionLeader?: {
    name: string;
    totalCommission: number;
    salesAmount: number;
  };
}

// ==========================================
// FASE 7: FINANZAS, TESORERÍA, CXC, CXP,
// FLUJO DE EFECTIVO, RENTABILIDAD & AI ADVISOR
// ==========================================

export type AccountCategory =
  | 'ACTIVO'
  | 'PASIVO'
  | 'CAPITAL'
  | 'INGRESOS'
  | 'COSTOS'
  | 'GASTOS';

export type AccountSubcategory =
  | 'ACTIVO_CIRCULANTE'
  | 'ACTIVO_NO_CIRCULANTE'
  | 'PASIVO_CORTO_PLAZO'
  | 'PASIVO_LARGO_PLAZO'
  | 'CAPITAL_CONTABLE'
  | 'INGRESOS_OPERATIVOS'
  | 'OTROS_INGRESOS'
  | 'COSTO_VENTAS'
  | 'COSTO_LOGISTICO'
  | 'GASTOS_ADMINISTRATIVOS'
  | 'GASTOS_COMERCIALES'
  | 'GASTOS_OPERATIVOS'
  | 'GASTOS_FINANCIEROS';

export type AccountNature = 'DEUDORA' | 'ACREEDORA';

export interface ChartAccount {
  id: string;
  code: string; // e.g. "1110-001"
  name: string;
  category: AccountCategory;
  subcategory: AccountSubcategory;
  nature: AccountNature;
  parentId?: string;
  level: number; // 1: Mayor, 2: Rubro, 3: Subcuenta
  balance: number;
  currency: 'MXN' | 'USD';
  isActive: boolean;
  isHeader: boolean;
  isSystem: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  code: string; // "CC-VENTAS", "CC-MKT", "CC-ALMACEN", etc.
  name: string;
  departmentId?: string;
  managerId?: string;
  managerName?: string;
  annualBudget: number;
  spentBudget: number;
  status: 'ACTIVO' | 'INACTIVO';
  description?: string;
}

export type CXCStatus =
  | 'PENDIENTE'
  | 'PARCIALMENTE_PAGADA'
  | 'PAGADA'
  | 'VENCIDA'
  | 'CANCELADA';

export interface AccountsReceivableInvoice {
  id: string;
  folio: string; // "CXC-2026-001"
  invoiceNumber: string; // "FAC-2026-1040"
  uuidFiscal?: string; // SAT UUID
  customerId: string;
  customerName: string;
  rfc: string;
  orderId?: string;
  orderFolio?: string;
  quoteFolio?: string;
  sellerId?: string;
  sellerName?: string;
  issueDate: string; // "YYYY-MM-DD"
  dueDate: string;
  subtotal: number;
  tax: number; // IVA 16%
  total: number;
  paidAmount: number;
  balance: number;
  creditDays: number;
  overdueDays: number;
  status: CXCStatus;
  paymentMethod: 'PPD' | 'PUE';
  paymentFormSat: '01' | '03' | '04' | '99'; // 01: Efectivo, 03: Transferencia, 04: Tarjeta, 99: Por definir
  cfdiUsage: 'G01' | 'G03' | 'P01' | 'S01';
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface CXCPaymentRecord {
  id: string;
  folio: string; // "REC-2026-001"
  cxcId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  bankAccountId: string;
  bankAccountName: string;
  bankReference: string;
  paymentFormSat: '01' | '03' | '04' | '99';
  complementUuidFiscal?: string;
  recordedBy: string;
  recordedAt: string;
  notes?: string;
}

export interface CollectionActivity {
  id: string;
  cxcId?: string;
  customerId: string;
  customerName: string;
  type: 'LLAMADA' | 'WHATSAPP' | 'CORREO' | 'PROMESA_PAGO' | 'VISITA' | 'NOTA_SEGUIMIENTO';
  date: string;
  promiseDate?: string;
  promiseAmount?: number;
  isPromiseFulfilled?: boolean;
  notes: string;
  contactPerson?: string;
  contactPhone?: string;
  recordedBy: string;
  responsibleId?: string;
  responsibleName?: string;
  status: 'REGISTRADO' | 'EN_PROCESO' | 'CUMPLIDA' | 'INCUMPLIDA';
  outcome?: string;
  createdAt: string;
}

export interface CreditEvaluation {
  customerId: string;
  customerName: string;
  creditLimit: number;
  creditDays: number;
  currentBalance: number;
  overdueBalance: number;
  maxOverdueDays: number;
  newOrderAmount: number;
  projectedBalance: number;
  availableCredit: number;
  isBlocked: boolean;
  blockingReason?: string;
  requiresManagerApproval: boolean;
  riskScore: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
}

export type CXPStatus =
  | 'PENDIENTE'
  | 'PROGRAMADA'
  | 'PARCIALMENTE_PAGADA'
  | 'PAGADA'
  | 'VENCIDA'
  | 'CANCELADA';

export interface AccountsPayableInvoice {
  id: string;
  folio: string; // "CXP-2026-001"
  supplierId: string;
  supplierName: string;
  supplierRfc: string;
  purchaseOrderId?: string;
  purchaseOrderFolio?: string;
  goodsReceiptFolio?: string;
  supplierInvoiceNumber: string; // Folio fiscal proveedor
  uuidFiscal?: string;
  issueDate: string;
  dueDate: string;
  scheduledPaymentDate?: string;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number;
  creditDays: number;
  overdueDays: number;
  status: CXPStatus;
  bankAccountId?: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  notes?: string;
  costCenterId?: string;
  createdAt: string;
}

export interface CXPPaymentRecord {
  id: string;
  folio: string; // "EGR-2026-001"
  cxpId: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  bankAccountId: string;
  bankAccountName: string;
  bankReference: string;
  paymentFormSat: '03' | '01' | '04';
  authorizedBy?: string;
  authorizedAt?: string;
  recordedBy: string;
  recordedAt: string;
  notes?: string;
}

export interface PaymentScheduleItem {
  id: string;
  cxpId: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  dueDate: string;
  amount: number;
  scheduledDate: string;
  bankAccountId: string;
  bankAccountName: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  authorizationStatus: 'PENDIENTE' | 'AUTORIZADO' | 'RECHAZADO';
  authorizedBy?: string;
  authorizedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string; // "BBVA México", "Santander", "Banorte"
  accountNumber: string; // "**** 4892"
  clabe: string; // 18 dígitos
  currency: 'MXN' | 'USD';
  initialBalance: number;
  currentBalance: number;
  availableBalance: number;
  accountType: 'CHEQUES' | 'CONCENTRADORA' | 'INVERSION' | 'CAJA_CHICA';
  status: 'ACTIVA' | 'INACTIVA';
  lastReconciliationDate?: string;
  description?: string;
}

export type BankTransactionType =
  | 'INGRESO'
  | 'EGRESO'
  | 'TRANSFERENCIA'
  | 'COMISION_BANCARIA'
  | 'INTERESES_A_FAVOR'
  | 'OTRO';

export type BankTransactionCategory =
  | 'COBRO_CLIENTE'
  | 'PAGO_PROVEEDOR'
  | 'PAGO_NOMINA'
  | 'PAGO_IMPUESTOS'
  | 'PAGO_GASTO'
  | 'TRANSFERENCIA_INTERNA'
  | 'COMISION_SERVICIO'
  | 'OTRO';

export interface BankTransaction {
  id: string;
  folio: string; // "MOV-BNK-001"
  bankAccountId: string;
  bankAccountName: string;
  type: BankTransactionType;
  category: BankTransactionCategory;
  date: string;
  amount: number;
  reference: string;
  concept: string;
  relatedCxcId?: string;
  relatedCxpId?: string;
  relatedExpenseId?: string;
  relatedPayrollId?: string;
  destinationBankAccountId?: string;
  isReconciled: boolean;
  reconciliationId?: string;
  auditUser: string;
  createdAt: string;
}

export interface BankReconciliationSession {
  id: string;
  folio: string; // "REC-BNK-2026-08"
  bankAccountId: string;
  bankAccountName: string;
  statementPeriod: string; // "Agosto 2026"
  statementOpeningBalance: number;
  statementClosingBalance: number;
  erpCalculatedBalance: number;
  difference: number;
  status: 'BORRADOR' | 'CONCILIADO' | 'DIFERENCIA';
  totalMatched: number;
  totalUnmatched: number;
  items: BankReconciliationItem[];
  notes?: string;
  reconciledBy: string;
  reconciledAt?: string;
  createdAt: string;
}

export interface BankReconciliationItem {
  id: string;
  bankTransactionDate: string;
  description: string;
  bankAmount: number;
  erpTransactionId?: string;
  erpReference?: string;
  matchStatus: 'CONCILIADO' | 'NO_CONCILIADO' | 'DIFERENCIA' | 'DUPLICADO';
  discrepancyAmount: number;
  notes?: string;
}

export interface CashFlowEntry {
  id: string;
  date: string;
  periodLabel: string;
  periodType: 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL';
  openingBalance: number;
  collections: number;
  otherIncome: number;
  supplierPayments: number;
  payrollPayments: number;
  taxPayments: number;
  operationalExpenses: number;
  logisticsExpenses: number;
  netCashFlow: number;
  closingBalance: number;
}

export interface CashFlowProjection {
  period: string; // "Semana +1 (01-07 Sep)", "30 Días", etc.
  date: string;
  projectedOpeningBalance: number;
  projectedInflow: number; // Cobranza esperada basada en vencimientos y DSO
  projectedOutflow: number; // Pagos programados a proveedores, nómina y gastos fijos
  projectedNet: number;
  projectedClosingBalance: number;
  confidencePct: number;
  scenario: 'OPTIMISTA' | 'ESPERADO' | 'CONSERVADOR';
  assumptions: string[];
}

export interface Budget {
  id: string;
  code: string; // "PT-2026-001"
  year: number;
  period: string; // "2026-Q3" o "2026-08"
  entityType: 'EMPRESA' | 'DEPARTAMENTO' | 'CENTRO_COSTO' | 'VENDEDOR' | 'CATEGORIA';
  entityId: string;
  entityName: string;
  accountId?: string;
  accountName?: string;
  budgetedAmount: number;
  actualAmount: number;
  committedAmount: number; // En órdenes de compra pendientes o requisiciones
  varianceAmount: number; // budgeted - actual
  variancePct: number; // ((actual - budgeted) / budgeted) * 100
  status: 'DENTRO_DE_PRESUPUESTO' | 'ALERTA_80' | 'EXCEDIDO';
  alertTriggered: boolean;
  notes?: string;
}

export type ExpenseCategory =
  | 'VIATICOS'
  | 'COMBUSTIBLE_LOGISTICA'
  | 'MANTENIMIENTO'
  | 'SERVICIOS_OFICINA'
  | 'MARKETING_ADS'
  | 'SOFTWARE_TI'
  | 'HONORARIOS'
  | 'ARRENDAMIENTO'
  | 'SEGUROS'
  | 'HERRAMENTAL_SEGURIDAD'
  | 'PAID_ADS'
  | 'SOFTWARE_TOOLS'
  | 'AGENCIA_EXTERNA'
  | 'EVENTOS_STANDS'
  | 'DISENO_CONTENIDO'
  | 'LOGISTICA_PROMO';

export type ExpenseStatus =
  | 'CAPTURADO'
  | 'REVISION'
  | 'APROBADO'
  | 'PAGADO'
  | 'RECHAZADO';

export interface Expense {
  id: string;
  folio: string; // "GST-2026-001"
  title: string;
  supplierOrPayee: string;
  payeeRfc?: string;
  date: string;
  category: ExpenseCategory;
  costCenterId: string;
  costCenterName: string;
  subtotal: number;
  tax: number;
  total: number;
  bankAccountId?: string;
  paymentDate?: string;
  invoiceReceiptUrl?: string;
  receiptFolio?: string;
  responsibleId: string;
  responsibleName: string;
  status: ExpenseStatus;
  authorizedBy?: string;
  authorizedAt?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  folio: string; // "NC-2026-001"
  invoiceId: string;
  invoiceFolio: string;
  customerId: string;
  customerName: string;
  date: string;
  reason: 'DEVOLUCION_MERCANCIA' | 'DESCUENTO_COMERCIAL' | 'CORRECCION_PRECIO' | 'BONIFICACION';
  subtotal: number;
  tax: number;
  total: number;
  status: 'APLICADA' | 'CANCELADA';
  approvedBy: string;
  approvedAt: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerFinancialStatement {
  customerId: string;
  customerName: string;
  rfc: string;
  creditLimit: number;
  creditDays: number;
  currentBalance: number;
  availableCredit: number;
  totalInvoiced: number;
  totalPaid: number;
  totalCreditNotes: number;
  overdueBalance: number;
  avgDaysToPay: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  history: Array<{
    id: string;
    date: string;
    type: 'FACTURA' | 'PAGO' | 'NOTA_CREDITO';
    folio: string;
    concept: string;
    debit: number; // Cargo (+)
    credit: number; // Abono (-)
    balance: number;
    notes?: string;
  }>;
}

export interface FinancialPeriodClosing {
  id: string;
  year: number;
  period: string; // "2026-07" o "2026-Q2"
  closingType: 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
  closedDate: string;
  closedBy: string;
  status: 'ABIERTO' | 'VALIDACION_PREVIA' | 'CERRADO' | 'REABIERTO';
  checklist: {
    cxcReconciled: boolean;
    cxpReconciled: boolean;
    bankReconciled: boolean;
    inventoryValued: boolean;
    expensesApproved: boolean;
    payrollAccounted: boolean;
    invoicingCompleted: boolean;
    hasNoPendingDrafts: boolean;
  };
  financialSummary: {
    totalRevenue: number;
    totalCostOfGoodsSold: number;
    grossProfit: number;
    grossMarginPct: number;
    totalOperatingExpenses: number;
    operatingProfit: number;
    operatingMarginPct: number;
    ebitda: number;
    netCashFlow: number;
  };
  reopeningReason?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  notes?: string;
}

export interface FinancialKPIs {
  revenuePeriod: number;
  revenueYTD: number;
  revenueBudgetPeriod: number;
  revenueGrowthPct: number;
  cxcTotal: number;
  cxcOverdue: number;
  cxcOverduePct: number;
  avgDSO: number; // Days Sales Outstanding
  cxpTotal: number;
  cxpOverdue: number;
  avgDPO: number; // Days Payable Outstanding
  totalBankBalance: number;
  netCashFlowPeriod: number;
  totalInflowsPeriod: number;
  totalOutflowsPeriod: number;
  grossProfitPeriod: number;
  grossMarginPct: number;
  operatingProfitPeriod: number;
  operatingMarginPct: number;
  valuedInventoryAmount: number;
  workingCapital: number; // Activo Circulante - Pasivo Circulante
  currentRatio: number; // Activo Circulante / Pasivo Circulante
  ebitdaPeriod: number;
  ebitdaMarginPct: number;
  budgetVarianceAmount: number;
  budgetVariancePct: number;
}

export interface ProfitabilityProductItem {
  id?: string;
  productId: string;
  productName: string;
  name?: string;
  sku: string;
  price?: number;
  cost?: number;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit?: number;
  grossProfit: number;
  marginPct?: number;
  grossMarginPct: number;
  allocatedLogisticsCost: number;
  netContribution: number;
  contributionMarginPct: number;
}

export interface ProfitabilityCustomerItem {
  id?: string;
  customerId: string;
  customerName: string;
  name?: string;
  orderCount?: number;
  revenue: number;
  cost?: number;
  cogs: number;
  profit?: number;
  grossProfit: number;
  marginPct?: number;
  grossMarginPct: number;
  commissionsCost: number;
  logisticsCost: number;
  netContribution: number;
  contributionMarginPct: number;
  overdueBalance: number;
  avgDaysToPay: number;
  classification: 'ALTAMENTE_RENTABLE' | 'RENTABLE' | 'BAJO_MARGEN' | 'NO_RENTABLE';
}

export interface ProfitabilitySalespersonItem {
  id?: string;
  sellerId: string;
  sellerName: string;
  name?: string;
  orderCount?: number;
  totalRevenue: number;
  revenue?: number;
  cost?: number;
  cogs: number;
  profit?: number;
  grossProfit: number;
  marginPct?: number;
  grossMarginPct: number;
  commissionsPaid: number;
  travelExpenses: number;
  netContribution: number;
  contributionMarginPct: number;
}

export interface ProfitabilityCampaignItem {
  id?: string;
  campaignId: string;
  campaignName: string;
  name?: string;
  channel: string;
  spend?: number;
  campaignCost: number;
  attributedRevenue: number;
  revenue?: number;
  cogs: number;
  profit?: number;
  grossProfit: number;
  grossMarginPct: number;
  netProfit: number;
  roas: number;
  roiPct: number;
  cac: number;
}

export interface ProfitabilityOrderItem {
  id?: string;
  orderId: string;
  orderFolio: string;
  folio?: string;
  customerName: string;
  revenue: number;
  cost?: number;
  cogs: number;
  profit?: number;
  grossProfit: number;
  marginPct?: number;
  grossMarginPct: number;
  commission: number;
  logisticsCost: number;
  netContribution: number;
}

export interface ProfitabilityAnalysis {
  byProduct: ProfitabilityProductItem[];
  byCustomer: ProfitabilityCustomerItem[];
  bySalesperson: ProfitabilitySalespersonItem[];
  byCampaign: ProfitabilityCampaignItem[];
  byOrder: ProfitabilityOrderItem[];

  // Dimensional View Aliases
  products?: ProfitabilityProductItem[];
  customers?: ProfitabilityCustomerItem[];
  salesReps?: ProfitabilitySalespersonItem[];
  campaigns?: ProfitabilityCampaignItem[];
  orders?: ProfitabilityOrderItem[];

  // Global Summary Metrics
  totalRevenue?: number;
  totalCogs?: number;
  grossProfit?: number;
  grossMarginPct?: number;
}

export interface AIFinancialInsight {
  id: string;
  code: string;
  type:
    | 'FLUJO_EFECTIVO'
    | 'CARTERA_CXC'
    | 'RENTABILIDAD'
    | 'PRESUPUESTO_GASTOS'
    | 'INVENTARIO_CAPITAL'
    | 'RIESGOS_FINANCIEROS';
  title: string;
  dataUsed: string; // "DATOS UTILIZADOS"
  analyzedPeriod: string; // "PERIODO ANALIZADO"
  calculationMethod: string; // "CÁLCULO"
  findings: string; // "HALLAZGO"
  patternDetected: string; // "PATRONES"
  strategicRecommendation: string; // "RECOMENDACIÓN"
  financialRiskIdentified: string; // "RIESGO"
  confidenceLevelPct: number; // "NIVEL DE CONFIANZA" (e.g. 96)
  dataSource: string; // "FUENTE DE DATOS"
  impactLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  status: 'ACTIVO' | 'EN_REVISION' | 'ATENDIDO';
  requiresHumanAuthorization: true; // Strict AI Governance
  severity?: 'ALTA' | 'MEDIA' | 'BAJA' | 'CRITICA';
  confidence?: number;
  description?: string;
  recommendation?: string;
  potentialImpact?: string;
  createdAt: string;
}

export interface FinancialScenario {
  name: 'OPTIMISTA' | 'ESPERADO' | 'CONSERVADOR';
  salesVariationPct: number;
  collectionsEfficiencyPct: number;
  costOfGoodsVariationPct: number;
  expensesReductionPct: number;
  calculatedRevenue: number;
  calculatedGrossProfit: number;
  calculatedOperatingProfit: number;
  calculatedClosingCash: number;
  workingCapitalNeeded: number;
  description: string;
}

export interface FinancialSimulationParams {
  salesGrowthPct: number;
  collectionEfficiencyPct: number;
  cogsChangePct: number;
  supplierTermsDays: number;
  opexChangePct: number;
}

export interface FinancialSimulationResult {
  baseSales: number;
  baseCogs: number;
  baseGrossProfit: number;
  baseOpex: number;
  baseEbitda: number;
  baseNetCashFlow: number;
  baseWorkingCapital: number;
  projectedSales: number;
  projectedCogs: number;
  projectedGrossProfit: number;
  projectedOpex: number;
  projectedEbitda: number;
  projectedMarginPct: number;
  projectedInflow: number;
  projectedOutflow: number;
  projectedNetCashFlow: number;
  projectedWorkingCapital: number;
  salesDelta: number;
  grossProfitDelta: number;
  ebitdaDelta: number;
  netCashFlowDelta: number;
  workingCapitalDelta: number;
  aiAssessment: string;
}

export type ChartOfAccount = ChartAccount;
export type DepartmentBudget = Budget;
export type OperatingExpense = Expense;
export type CreditEvaluationResult = CreditEvaluation;
export type DeliveryRoute = DeliveryItem;
export type ARInvoice = AccountsReceivableInvoice;
export type Invoice = AccountsReceivableInvoice;
export type APInvoice = AccountsPayableInvoice;
export type SupplierInvoice = AccountsPayableInvoice;
export type CustomerLead = Lead;
export type PaymentRecord = CXCPaymentRecord;
export type PeriodClosing = {
  id: string;
  period: string;
  closedAt?: string;
  closedBy?: string;
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  status: string;
  isLocked: boolean;
};

// ==========================================
// FASE 8: DIRECCIÓN GENERAL & BUSINESS INTELLIGENCE
// ==========================================

export type HealthStatusLevel = 'EMPRESA_SALUDABLE' | 'EMPRESA_EN_OBSERVACION' | 'EMPRESA_EN_RIESGO' | 'EMPRESA_CRITICA' | 'DATA_INSUFFICIENT';

export type HealthDimensionType =
  | 'VENTAS'
  | 'MARGEN'
  | 'LIQUIDEZ'
  | 'COBRANZA'
  | 'INVENTARIO'
  | 'OPERACIONES'
  | 'RH'
  | 'MARKETING';

export interface HealthDimensionMetric {
  dimension: HealthDimensionType;
  label: string;
  score: number; // 0 - 100
  trend: 'SUBIENDO' | 'ESTABLE' | 'BAJANDO';
  status: HealthStatusLevel;
  problemDetected?: string;
  impact?: string;
  recommendedAction?: string;
  weightPct: number;
}

export interface BusinessHealthScoreData {
  overallScore: number; // 0 - 100
  status: HealthStatusLevel;
  statusLabel: string;
  dimensions: HealthDimensionMetric[];
  lastCalculated: string;
}

export interface ExecutiveKpiSummary {
  // Ventas
  salesPeriod: number;
  salesAccumulated: number;
  salesVariationVsPrevPct: number;
  salesTarget: number;
  salesTargetAttainmentPct: number;
  salesForecastPeriod: number;
  averageTicket: number;
  totalOrdersCount: number;
  salesRevenueNet: number;
  salesRevenueTarget: number;

  // Margen
  grossMarginAmount: number;
  grossMarginPct: number;
  grossMarginTotal: number;
  cogsTotal: number;
  contributionMarginAmount: number;
  contributionMarginPct: number;
  contributionMarginTotal: number;
  netMarginAmount: number;
  netMarginPct: number;
  marginTargetPct: number;
  marginVariancePct: number;

  // EBITDA & Utilidad
  ebitdaOperating: number;
  ebitdaOperatingPct: number;
  operatingExpensesTotal: number;

  // Caja & Tesorería
  availableCash: number;
  cashAvailableTotal: number;
  periodIncome: number;
  periodExpense: number;
  netCashFlow: number;
  projectedCash30d: number;
  projectedCash60d: number;
  projectedCash90d: number;
  collectionsCashIn: number;

  // CXC
  totalArAmount: number;
  accountsReceivableTotal: number;
  overdueArAmount: number;
  accountsReceivableOverdue: number;
  overdueArPct: number;
  accountsReceivableOverduePct: number;
  overdue30DaysPct: number;
  dsoDays: number;
  arCollectionDsoDays: number;

  // CXP
  totalApAmount: number;
  accountsPayableTotal: number;
  accountsPayableOverdue: number;
  upcomingAp7d: number;
  upcomingAp15d: number;
  dpoDays: number;
  criticalPaymentsAmount: number;

  // Inventario
  inventoryValuation: number;
  inventoryValuationTotal: number;
  inventoryPhysicalUnits: number;
  inventoryCommittedUnits: number;
  inventoryCommittedValuation: number;
  availableStockUnits: number;
  reservedStockUnits: number;
  criticalStockSkusCount: number;
  inventoryTurnoverRatio: number;
  inventoryTurnoverDays: number;

  // Operaciones
  openOrdersCount: number;
  pickingOrdersCount: number;
  inTransitOrdersCount: number;
  deliveredOrdersCount: number;
  delayedOrdersCount: number;

  // Pipeline & Liquidez
  pipelineActiveTotal: number;
  liquidityCurrentRatio: number;

  // RH
  activeEmployeesCount: number;
  attendanceRatePct: number;
  turnoverRatePct: number;
  commissionsAccumulated: number;
  trainingCompliancePct: number;

  // Marketing
  marketingSpend: number;
  leadsGenerated: number;
  sqlGenerated: number;
  customersWon: number;
  cacAmount: number;
  roasRatio: number;
  roiPct: number;
}

export type ProductClassificationCategory = 'STAR' | 'CASH_GENERATOR' | 'LOW_MARGIN' | 'SLOW_MOVING' | 'DEAD_STOCK' | 'CRITICAL_STOCK';

export interface ProductProfitabilityRecord {
  productId: string;
  sku: string;
  name: string;
  category: string;
  salesRevenue: number;
  unitsSold: number;
  unitPrice: number;
  averageCost: number;
  cogs: number;
  grossMargin: number;
  grossMarginPct: number;
  inventoryUnits: number;
  daysOfInventory: number;
  inventoryValuation: number;
  turnover: number;
  isCriticalStock: boolean;
  classification: ProductClassificationCategory;
  aiInsight: string;
}

export interface CustomerProfitabilityRecord {
  customerId: string;
  code: string;
  name: string;
  rfc: string;
  segment: string;
  salesAccumulated: number;
  cogs: number;
  grossMargin: number;
  grossMarginPct: number;
  logisticsCost: number;
  commissionsCost: number;
  collectionCost: number;
  netProfit: number;
  netMarginPct: number;
  averagePaymentDays: number;
  currentArBalance: number;
  overdueArBalance: number;
  purchaseFrequencyMonthly: number;
  classification: 'A' | 'B' | 'C' | 'D';
  healthScore: number; // 0 - 100
  creditRiskLevel: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  aiRecommendation: string;
}

export interface SalesPerformanceRecord {
  sellerId: string;
  name: string;
  avatar?: string;
  salesTarget: number;
  salesActual: number;
  attainmentPct: number;
  pipelineAmount: number;
  forecastWeighted: number;
  grossMarginGenerated: number;
  grossMarginPct: number;
  commissionsEarned: number;
  conversionRatePct: number;
  averageTicket: number;
  activitiesLoggedCount: number;
  overdueFollowupsCount: number;
  newCustomersCount: number;
  efficiencyScore: number; // 0 - 100
  rankSales: number;
  rankMargin: number;
  rankConversion: number;
  rankProfitability: number;
}

export interface EnterpriseForecastPoint {
  periodLabel: string;
  horizonDays: number;
  salesRevenue: number;
  collectionsCash: number;
  paymentsCxp: number;
  netCashBalance: number;
  inventoryNeeded: number;
  grossMargin: number;
  netProfit: number;
}

export interface EnterpriseForecastData {
  scenario: 'CONSERVADOR' | 'ESPERADO' | 'OPTIMISTA' | 'PERSONALIZADO';
  horizon: '30_DIAS' | '60_DIAS' | '90_DIAS' | '6_MESES' | '12_MESES';
  cutoffDate: string;
  methodology: string;
  assumptions: string[];
  confidenceLevelPct: number;
  dataPoints: EnterpriseForecastPoint[];
  dataSources: string[];
}

export type ExecutiveAlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface ExecutiveAlertItem {
  id: string;
  code: string;
  priority: ExecutiveAlertPriority;
  moduleOrigin: ERPModule;
  title: string;
  problem: string;
  entity: string;
  entityId?: string;
  estimatedFinancialImpact: number;
  recommendation: string;
  availableActionLabel: string;
  actionTargetModule: ERPModule;
  createdAt: string;
  isResolved?: boolean;
}

export interface ExecutiveDailyBriefingData {
  date: string;
  theGood: string[];
  requiresAttention: string[];
  risks: string[];
  opportunities: string[];
  moneySummary: string;
  salesSummary: string;
  operationsSummary: string;
  hrSummary: string;
  marketingSummary: string;
  aiRecommendations: string[];
}

export interface WhatIfScenarioVariables {
  salesPctDelta: number; // e.g. -15
  cogsPctDelta: number; // e.g. +8
  targetMarginPctDelta: number;
  arDaysDelta: number; // e.g. +10
  apDaysDelta: number;
  safetyStockPctDelta: number;
  operatingExpensesPctDelta: number;
  marketingBudgetPctDelta: number;
  logisticsCostPctDelta: number;
}

export interface WhatIfScenarioResult {
  base: {
    revenue: number;
    cogs: number;
    grossMargin: number;
    grossMarginPct: number;
    operatingExpenses: number;
    netProfit: number;
    closingCash: number;
    inventoryValuation: number;
    arBalance: number;
    apBalance: number;
    ebitdaApprox: number;
  };
  simulated: {
    revenue: number;
    cogs: number;
    grossMargin: number;
    grossMarginPct: number;
    operatingExpenses: number;
    netProfit: number;
    closingCash: number;
    inventoryValuation: number;
    arBalance: number;
    apBalance: number;
    ebitdaApprox: number;
  };
  variances: {
    revenueDelta: number;
    grossMarginDelta: number;
    netProfitDelta: number;
    cashDelta: number;
    ebitdaDelta: number;
  };
  riskAssessment: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  strategicSummary: string;
}

export interface WhatIfSimulationInput {
  salesGrowthPct: number;
  priceChangePct: number;
  cogsReductionPct: number;
  arDaysImprovement: number;
  cxpExtensionDays: number;
  operatingExpenseChangePct: number;
  inventoryReductionPct: number;
}

export interface WhatIfSimulationResult {
  baseSales: number;
  simulatedSales: number;
  salesDelta: number;
  baseGrossProfit: number;
  simulatedGrossProfit: number;
  grossProfitDelta: number;
  simulatedGrossMarginPct: number;
  baseNetProfit: number;
  simulatedNetProfit: number;
  netProfitDelta: number;
  simulatedCashFlow: number;
  cashFlowDelta: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  summary: string;
  aiRecommendation: string;
}

export interface ExecutiveAdvisorPromptSuggestion {
  id: string;
  category: string;
  question: string;
  description: string;
}

export interface ExecutiveAdvisorNextBestAction {
  priority: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  entity: string;
  problem: string;
  impact: string;
  action: string;
  responsible: string;
  suggestedDate: string;
  justification: string;
}

export interface ExecutiveAdvisorResponse {
  question: string;
  dataSourcesUsed: {
    source: string;
    type: 'REAL' | 'CALCULATED' | 'PROJECTED' | 'INSUFFICIENT_DATA';
    detail: string;
  }[] | string[];
  periodAnalyzed: string;
  analysis: string;
  findings: string[];
  risks: string[];
  opportunities?: string[];
  recommendations: string[];
  nextBestAction?: ExecutiveAdvisorNextBestAction;
  confidencePct: number;
  limitations?: string;
  financialMetricsSnapshot?: {
    salesRevenue: number;
    grossMarginPct: number;
    ebitda: number;
    accountsReceivable: number;
    accountsPayable: number;
    availableCash: number;
    inventoryValuation: number;
  };
}

export interface ExecutiveDepartmentBudget {
  department: string;
  assignedBudget: number;
  executedAmount: number;
  committedAmount: number;
  availableAmount: number;
  executionPct: number;
  varianceAmount: number;
  variancePct: number;
  forecastClosureAmount: number;
  status: 'ON_TRACK' | 'WARNING' | 'OVER_BUDGET';
  notes: string;
}

export interface BoardReportFinancialMetric {
  metric: string;
  actual: string;
  budget: string;
  variance: string;
}

export interface BoardReportData {
  companyName: string;
  reportTitle: string;
  period: string;
  generatedDate: string;
  executiveSummary: string;
  financialHighlights: BoardReportFinancialMetric[];
  operationalHighlights: string[];
  strategicInitiatives: string[];
}

export interface DataIntegrityCheckItem {
  name: string;
  calculatedValue: number;
  expectedValue: number;
  variance: number;
  passed: boolean;
  details: string;
}

export interface DataIntegrityReport {
  isBalanced: boolean;
  totalVariance: number;
  checks: DataIntegrityCheckItem[];
  lastChecked: string;
}

export interface DataIntegrityValidationResult {
  isFullyIntegral: boolean;
  totalDiscrepancyAmount: number;
  checks: {
    name: string;
    description: string;
    isPassed: boolean;
    erpValue: number;
    calculatedValue: number;
    difference: number;
    formula: string;
  }[];
  lastValidatedAt: string;
}

// ==========================================
// FASE 9: MASTER CERTIFICATION & PRODUCTION DATA MODELS
// ==========================================

export type SystemHealthStatus = 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL';

export type SystemComponentName =
  | 'DATABASE'
  | 'API'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'REALTIME'
  | 'STORAGE'
  | 'AUDIT'
  | 'INTEGRATIONS'
  | 'AI'
  | 'BACKUPS';

export interface SystemComponentHealth {
  name: SystemComponentName;
  displayName: string;
  status: SystemHealthStatus;
  latencyMs: number;
  lastCheck: string;
  errorCount: number;
  availabilityPct: number;
  details: string;
  diagnosticMessage: string;
  verified: boolean;
}

export interface DataIntegrityAuditFinding {
  entity: string;
  recordId: string;
  recordLabel?: string;
  issueType:
    | 'DUPLICATE'
    | 'ORPHAN'
    | 'BROKEN_FK'
    | 'INVALID_STATUS'
    | 'NEGATIVE_STOCK'
    | 'NEGATIVE_BALANCE'
    | 'MISSING_REFERENCE'
    | 'INCONSISTENT_TOTAL';
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  detectedAt: string;
}

export interface DataIntegrityGlobalAuditReport {
  entitiesAuditedCount: number;
  totalRecordsAuditedCount: number;
  duplicatesCount: number;
  orphansCount: number;
  brokenFksCount: number;
  negativeStockCount: number;
  negativeBalancesCount: number;
  inconsistentTotalsCount: number;
  findings: DataIntegrityAuditFinding[];
  isCompliant: boolean;
  generatedAt: string;
}

export interface MasterTransactionLifecycleStep {
  stepKey: string;
  stepNumber: number;
  title: string;
  module: ERPModule;
  entity: string;
  entityId: string;
  folio: string;
  timestamp: string;
  user: string;
  amount: number;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  auditNote: string;
}

export interface MasterTransactionRecord {
  masterTransactionId: string;
  createdAt: string;
  totalAmount: number;
  customerName: string;
  customerRfc: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  steps: MasterTransactionLifecycleStep[];
}

export interface TransactionAtomicityTestResult {
  scenarioId: string;
  scenarioName: string;
  trigger: string;
  failurePoint: string;
  expectedOutcome: 'COMMIT COMPLETO' | 'ROLLBACK COMPLETO';
  actualOutcome: 'COMMIT COMPLETO' | 'ROLLBACK COMPLETO' | 'PARTIAL_COMMIT' | 'ORPHAN_STATE';
  passed: boolean;
  rollbackLog: string[];
  stateConsistencyVerified: boolean;
}

export interface IdempotencyTestResult {
  operationKey: string;
  operationName: string;
  firstRequestResult: string;
  secondRequestResult: 'BLOCKED_OR_IDEMPOTENT' | 'DUPLICATE_EXECUTED';
  passed: boolean;
  idempotencyKey: string;
  details: string;
}

export interface ConcurrencyTestScenarioResult {
  scenarioName: string;
  resourceKey: string;
  initialStockOrBalance: number;
  userAAction: string;
  userBAction: string;
  userAResult: 'SUCCESS' | 'BLOCKED';
  userBResult: 'SUCCESS' | 'BLOCKED';
  finalStockOrBalance: number;
  invariantMaintained: boolean;
  notes: string;
}

export interface InvariantEvaluation {
  invariantName: string;
  formula: string;
  calculatedValue: number;
  expectedValue: number;
  variance: number;
  passed: boolean;
  sourceOfTruth: string;
  details: string;
}

export interface SecurityRbacMatrixAudit {
  role: UserRole;
  domainsTested: {
    domainName: string;
    isAllowedByMatrix: boolean;
    testedAction: string;
    actualAccessResult: 'ACCESS_GRANTED' | 'ACCESS_DENIED';
    hasDataLeak: boolean;
  }[];
}

export interface DataPrivacyMaskingTest {
  field: string;
  sampleRawValue: string;
  maskedValue: string;
  unauthorizedViewRestricted: boolean;
  authorizedViewAllowed: boolean;
  passed: boolean;
}

export type PeriodClosingStatus = 'OPEN_PERIOD' | 'CLOSE_PERIOD' | 'LOCKED_PERIOD' | 'REOPEN_PERIOD';

export interface PeriodClosingAuditInfo {
  status: PeriodClosingStatus;
  currentPeriod: string;
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  reopenAuthorization?: string;
  auditId?: string;
}

export interface BackupItem {
  id: string;
  name: string;
  createdAt: string;
  sizeKb: number;
  recordCounts: Record<string, number>;
  checksum: string;
  verified: boolean;
  status: 'VALID' | 'CORRUPTED' | 'UNVERIFIED';
}

export interface DisasterRecoveryMetrics {
  detectionTimeMs: number | 'NOT_CONFIGURED';
  recoveryTimeMs: number | 'NOT_CONFIGURED';
  rpo: string | 'NOT_CONFIGURED';
  rto: string | 'NOT_CONFIGURED';
  recoveredRecordsCount: number;
  dataLossRecordsCount: number;
  status: 'HEALTHY' | 'DEGRADED' | 'NOT_CONFIGURED';
  lastSimulationDate: string;
}

export interface AIGovernanceGuardrail {
  action: string;
  blockedAutonomously: boolean;
  requiresHumanApproval: boolean;
  isCompliant: boolean;
  safetyReason: string;
}

export interface AIDataHonestyItem {
  dataPoint: string;
  category: 'REAL_DATA' | 'CALCULATED_DATA' | 'PROJECTED_DATA' | 'SIMULATED_DATA' | 'DATA_INSUFFICIENT';
  source: string;
  honestyPassed: boolean;
}

export interface PerformanceBenchmarkResult {
  component: string;
  responseTimeMs: number | 'NOT_MEASURED';
  queryTimeMs: number | 'NOT_MEASURED';
  renderTimeMs: number | 'NOT_MEASURED';
  realtimeLatencyMs: number | 'NOT_MEASURED';
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'DEGRADED' | 'NOT_MEASURED';
}

export interface MasterCertificationPillar {
  pillarKey: string;
  pillarName: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_TESTED' | 'NOT_CONFIGURED';
  scorePct: number;
  testCount: number;
  passedCount: number;
  findingsCount: number;
  details: string;
}

export interface ExecutiveApprovalItem {
  requestId: string;
  userId: string;
  userName: string;
  role: UserRole;
  entity: 'DESCUENTO' | 'EXCEPCION_CREDITO' | 'AJUSTE_INVENTARIO' | 'PAGO' | 'TRANSFERENCIA' | 'GASTO' | 'BONO' | 'COMISION' | 'REAPERTURA_PERIODO' | 'AJUSTE_CONTABLE';
  entityId: string;
  amount: number;
  reason: string;
  timestamp: string;
  approver?: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  auditId: string;
  impact: string;
}

export interface ChaosTestResult {
  testId: string;
  name: string;
  failureSimulated: 'OFFLINE_DISCONNECT' | 'TIMEOUT_5000MS' | 'API_500_CRASH' | 'DATABASE_LOCK' | 'BROWSER_TAB_CLOSE' | 'REFRESH_MID_TX' | 'DOUBLE_CLICK_BURST' | 'DUPLICATE_WEBHOOK';
  preventedOrphanState: boolean;
  preventedDoubleCharge: boolean;
  preventedDoubleStockDeduction: boolean;
  preventedDoubleCommission: boolean;
  rollbackExecuted: boolean;
  passed: boolean;
  notes: string;
}

export interface ProductionPerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  thresholdExcellent: number;
  thresholdGood: number;
  thresholdWarning: number;
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface ProductionReadinessMatrixItem {
  domain: string;
  expected: string;
  actual: string;
  difference: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_TESTED';
}

export interface ProductionReadinessReportData {
  companyName: string;
  date: string;
  version: string;
  environment: string;
  executorUser: string;
  productionReadinessScore: number;
  isProductionReady: boolean;
  totalTests: number;
  passedTests: number;
  warningTests: number;
  failedTests: number;
  notTestedTests: number;
  matrix: ProductionReadinessMatrixItem[];
  regressionPhaseStatus: Record<string, 'PASS' | 'REGRESSION_DETECTED'>;
}

export interface MasterCertificationReportData {
  companyName: string;
  date: string;
  version: string;
  environment: string;
  executorUser: string;
  overallCertificationStatus: 'PASS' | 'PARTIALLY VALIDATED' | 'FAILED';
  totalTestsCount: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  notTestedCount: number;
  notConfiguredCount: number;
  pillars: MasterCertificationPillar[];
  discrepancies: string[];
  duplicateRecords: string[];
  orphanRecords: string[];
  securityFailures: string[];
  unauthorizedOperations: string[];
  transactionFailures: string[];
  rollbackFailures: string[];
  auditFailures: string[];
  realtimeFailures: string[];
  backupFailures: string[];
  recoveryFailures: string[];
  aiGovernanceFailures: string[];
}

export * from './customerServiceTypes';


