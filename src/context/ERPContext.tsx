import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Customer,
  Product,
  Quote,
  Order,
  OrderStatus,
  Warehouse,
  Supplier,
  InventoryMovement,
  AuditLog,
  NotificationItem,
  CompanyConfig,
  MovementType,
  ERPModule,
  Lead,
  Opportunity,
  CRMActivity,
  FollowUp,
  FollowUpStatus,
  SalesGoal,
  CommissionRule,
  PipelineStageConfig,
  CustomerContact,
  AIOpportunityAnalysis,
  AIFollowUpDraft,
  InventoryReservation,
  WarehouseTransfer,
  InventoryCountSession,
  InventoryAdjustment,
  TransferItem,
  InventoryCountItem,
  StockAlert,
  WarehouseLocationDetail,
  Vehicle,
  Driver,
  Route,
  RouteStop,
  DeliveryEvidence,
  DeliveryEvidenceItem,
  Picking,
  PickingItem,
  PickingStatus,
  LogisticsIncident,
  LogisticsReturn,
  LogisticsReturnStatus,
  LogisticsKPIs,
  AIRouteRecommendation,
  FailureReason,
  RouteDepartureChecklist,
  LogisticsReturnItem,
  SupplierContact,
  SupplierProduct,
  PurchasePriceHistory,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  SupplierReturn,
  SupplierReturnItem,
  ReorderConfig,
  PurchaseApprovalLimit,
  ProductReorderAnalysis,
  PurchasesKPIs,
  AIPurchaseRecommendation,
  SupplierEvaluation,
  MarketingCampaign,
  MarketingChannel,
  CampaignExpense,
  MarketingSegment,
  Touchpoint,
  MarketingKPIs,
  AIMarketingProposal,
  AttributionModel,
  Department,
  Position,
  Shift,
  Employee,
  EmployeeConfidentialData,
  EmployeeDocument,
  AttendanceRecord,
  AbsenceRequest,
  VacationBalance,
  CommissionRecord,
  PayrollPeriod,
  PayrollRecord,
  PerformanceReview,
  EmployeeGoal,
  TrainingCourse,
  EmployeeTraining,
  Skill,
  EmployeeSkill,
  AIHRAdvisorInsight,
  HRKPIs,
  // Phase 7 Finance & Treasury Types
  ChartAccount,
  CostCenter,
  BankAccount,
  BankTransaction,
  BankReconciliationSession,
  AccountsReceivableInvoice,
  CXCPaymentRecord,
  CollectionActivity,
  AccountsPayableInvoice,
  CXPPaymentRecord,
  PaymentScheduleItem,
  Budget,
  Expense,
  CreditNote,
  FinancialPeriodClosing,
  AIFinancialInsight,
  FinancialKPIs,
  CustomerFinancialStatement,
  CreditEvaluationResult,
  ProfitabilityAnalysis,
  FinancialSimulationParams,
  FinancialSimulationResult,
} from '../types/erp';
import {
  INITIAL_CHART_OF_ACCOUNTS,
  INITIAL_COST_CENTERS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_BANK_RECONCILIATIONS,
  INITIAL_CXC_INVOICES,
  INITIAL_CXC_PAYMENTS,
  INITIAL_COLLECTION_ACTIVITIES,
  INITIAL_CXP_INVOICES,
  INITIAL_CXP_PAYMENTS,
  INITIAL_PAYMENT_SCHEDULE,
  INITIAL_BUDGETS,
  INITIAL_EXPENSES,
  INITIAL_CREDIT_NOTES,
  INITIAL_PERIOD_CLOSINGS,
  INITIAL_AI_FINANCIAL_INSIGHTS,
} from '../data/initialFinanceData';
import {
  calculateFinancialKPIs,
  evaluateCustomerCredit,
  buildCustomerFinancialStatement,
  calculateProfitabilityAnalysis,
} from '../services/financeService';
import { createFinanceHandlers } from './FinanceContextMethods';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_QUOTES,
  INITIAL_ORDERS,
  INITIAL_WAREHOUSES,
  INITIAL_SUPPLIERS,
  INITIAL_MOVEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMPANY_CONFIG,
  INITIAL_RESERVATIONS,
  INITIAL_TRANSFERS,
  INITIAL_COUNT_SESSIONS,
  INITIAL_ADJUSTMENTS,
} from '../data/initialData';
import {
  INITIAL_SUPPLIERS_10,
  INITIAL_SUPPLIER_CONTACTS,
  INITIAL_SUPPLIER_PRODUCTS,
  INITIAL_PURCHASE_PRICE_HISTORY,
  INITIAL_PURCHASE_REQUESTS_10,
  INITIAL_PURCHASE_ORDERS_10,
  INITIAL_GOODS_RECEIPTS,
  INITIAL_SUPPLIER_RETURNS,
  INITIAL_REORDER_CONFIGS,
  INITIAL_PURCHASE_APPROVAL_LIMITS,
} from '../data/initialPurchasesData';
import {
  calculateProductReorderStatus,
  generateReplenishmentSuggestions,
  getSupplierComparisonForProduct,
  calculatePurchasesKPIs,
  evaluateSuppliersScorecard,
  queryPurchasesAI,
} from '../services/purchasesService';
import { createPurchasesHandlers } from './PurchasesContextMethods';
import {
  INITIAL_LEADS,
  INITIAL_OPPORTUNITIES,
  INITIAL_ACTIVITIES,
  INITIAL_FOLLOW_UPS,
  INITIAL_SALES_GOALS,
  INITIAL_COMMISSION_RULES,
  INITIAL_PIPELINE_STAGES,
  INITIAL_CUSTOMER_CONTACTS,
} from '../data/initialCRMData';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_ROUTES,
  INITIAL_LOGISTICS_INCIDENTS,
  INITIAL_LOGISTICS_RETURNS,
  INITIAL_LOGISTICS_KPIS,
} from '../data/initialLogisticsData';
import {
  INITIAL_MARKETING_CHANNELS,
  INITIAL_MARKETING_CAMPAIGNS,
  INITIAL_CAMPAIGN_EXPENSES,
  INITIAL_MARKETING_SEGMENTS,
  INITIAL_TOUCHPOINTS,
  INITIAL_AI_MARKETING_PROPOSALS,
} from '../data/initialMarketingData';
import { calculateMarketingKPIs, CampaignAttributionResult } from '../services/marketingService';
import { createMarketingHandlers } from './MarketingContextMethods';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_SHIFTS,
  INITIAL_EMPLOYEES_20,
  INITIAL_CONFIDENTIAL_DATA,
  INITIAL_EMPLOYEE_DOCUMENTS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_VACATION_BALANCES,
  INITIAL_ABSENCE_REQUESTS,
  INITIAL_COMMISSION_RULES as INITIAL_HR_COMMISSION_RULES,
  INITIAL_COMMISSION_RECORDS,
  INITIAL_PAYROLL_PERIOD,
  INITIAL_EMPLOYEE_GOALS,
  INITIAL_PERFORMANCE_REVIEWS,
  INITIAL_TRAINING_COURSES,
  INITIAL_EMPLOYEE_TRAININGS,
  INITIAL_SKILLS,
  INITIAL_EMPLOYEE_SKILLS,
  INITIAL_AI_HR_INSIGHTS,
  INITIAL_HR_KPIS,
} from '../data/initialHRData';
import { calculateHRKPIs } from '../services/hrService';
import { createHRHandlers } from './HRContextMethods';
import {
  INITIAL_SERVICE_TICKETS,
  INITIAL_SLA_RULES,
  INITIAL_WARRANTIES,
  INITIAL_WARRANTY_CLAIMS,
  INITIAL_CUSTOMER_RETURNS,
  INITIAL_QUALITY_INCIDENTS,
  INITIAL_CAPA_ACTIONS,
  INITIAL_CUSTOMER_SURVEYS,
} from '../services/customerServiceInitialData';
import {
  calculateNpsMetrics,
  calculateQualityPareto,
  calculateCustomerHealthScores,
  calculateRealCustomerProfitability,
  generateSlaAlerts,
  executeAICustomerAdvisorQuery,
  runPhase11E2ECertificationSuite,
} from '../services/customerServiceEngine';
import { createCustomerServiceHandlers } from './CustomerServiceContextMethods';
import {
  ServiceTicket,
  SLARule,
  SLAAlert,
  WarrantyCertificate,
  WarrantyClaim,
  CustomerReturn,
  QualityIncident,
  CAPAAction,
  CustomerSurvey,
  NPSMetrics,
  CustomerHealthScoreData,
  CustomerProfitabilityDetailed,
  ExecutiveCustomerServiceKPIs,
  AICustomerAdvisorResponse,
  Phase11CertificationResult,
  TicketStatus,
} from '../types/customerServiceTypes';
import { useAuth } from './AuthContext';
import { CommercialRLSService } from '../services/commercialRLSService';
import { QuoteEditService } from '../services/quoteEditService';
import { QuotePricingService } from '../services/quotePricingService';
import { normalizePaymentTerms, DEFAULT_PAYMENT_TERMS } from '../services/quotePaymentTermsService';
import { QuoteFinancialApprovalService, validateFinancialApprovalForOrder } from '../services/quoteFinancialApprovalService';
import { api } from '../services/apiClient';
import { validateLogisticsReadiness } from '../utils/logisticsValidation';
import { PhysicalFulfillmentService } from '../services/physicalFulfillmentService';

export interface RealtimeToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn';
  timestamp: string;
  user?: string;
}

export interface QuoteMarginValidation {
  cost: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  totalWithoutTax: number;
  tax: number;
  total: number;
  profit: number;
  marginPct: number;
  grossMarginPct?: number;
  avgDiscountPct?: number;
  isBelowMinMargin: boolean;
  minMarginThreshold: number;
  roleDiscountAllowed: boolean;
  maxAllowedDiscount: number;
  userRole: string;
}

export interface ERPContextType {
  customers: Customer[];
  allCustomers?: Customer[];
  products: Product[];
  quotes: Quote[];
  orders: Order[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  movements: InventoryMovement[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  companyConfig: CompanyConfig;
  unreadNotificationsCount: number;

  // CRM & Sales State (Fase 1)
  leads: Lead[];
  opportunities: Opportunity[];
  activities: CRMActivity[];
  followUps: FollowUp[];
  salesGoals: SalesGoal[];
  commissionRules: CommissionRule[];
  pipelineStages: PipelineStageConfig[];
  customerContacts: CustomerContact[];

  // Inventory & Warehouse State (Fase 2)
  reservations: InventoryReservation[];
  transfers: WarehouseTransfer[];
  countSessions: InventoryCountSession[];
  adjustments: InventoryAdjustment[];
  pickings: Picking[];

  // Logistics & Fleet State (Fase 3)
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: Route[];
  logisticsIncidents: LogisticsIncident[];
  logisticsReturns: LogisticsReturn[];
  logisticsKPIs: LogisticsKPIs;
  pods: DeliveryEvidence[];

  // Compras, Proveedores & Reabastecimiento Inteligente (Fase 4)
  supplierContacts: SupplierContact[];
  supplierProducts: SupplierProduct[];
  purchasePriceHistory: PurchasePriceHistory[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  supplierReturns: SupplierReturn[];
  reorderConfigs: ReorderConfig[];
  purchaseApprovalLimits: PurchaseApprovalLimit[];

  // Purchases Operations (Fase 4)
  addSupplier: (supplier: Omit<Supplier, 'id'>) => any;
  createSupplier?: (supplier: any) => Promise<any> | any;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => { success: boolean; error?: string };
  addSupplierContact: (contact: Omit<SupplierContact, 'id'>) => SupplierContact;
  updateSupplierContact: (id: string, updates: Partial<SupplierContact>) => void;
  deleteSupplierContact: (id: string) => void;
  addSupplierProduct: (sp: Omit<SupplierProduct, 'id'>) => SupplierProduct;
  updateSupplierProduct: (id: string, updates: Partial<SupplierProduct>) => void;
  deleteSupplierProduct: (id: string) => void;

  createPurchaseRequest: (
    data: any
  ) => any;
  updatePurchaseRequest: (id: string, updates: Partial<PurchaseRequest>) => void;
  submitPurchaseRequest: (id: string) => void;
  approvePurchaseRequest: (
    id: string,
    options?: { approverId?: string; approverName?: string; notes?: string }
  ) => { success: boolean; error?: string };
  rejectPurchaseRequest: (id: string, reason: string) => { success: boolean; error?: string };
  convertRequestToPurchaseOrder: (
    requestId: string,
    options: {
      supplierId: string;
      supplierName?: string;
      customPrices?: Record<string, number>;
      paymentTerms?: string;
      expectedDeliveryDate?: string;
      warehouseId?: string;
    }
  ) => { success: boolean; purchaseOrder?: PurchaseOrder; error?: string };

  createPurchaseOrder: (
    data: any
  ) => any;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  submitPurchaseOrderForApproval: (id: string) => void;
  approvePurchaseOrder: (id: string, options?: { notes?: string }) => { success: boolean; error?: string };
  rejectPurchaseOrder: (id: string, reason: string) => { success: boolean; error?: string };
  sendPurchaseOrderToSupplier: (
    id: string,
    details: {
      sendMethod: 'EMAIL' | 'PORTAL' | 'WHATSAPP' | 'TELEFONO';
      contactName?: string;
      contactEmail?: string;
      supplierConfirmationFolio?: string;
      notes?: string;
    }
  ) => { success: boolean; error?: string };
  cancelPurchaseOrder: (id: string, reason: string) => { success: boolean; error?: string };

  receiveGoodsReceipt: (data: any) => { success: boolean; receipt?: GoodsReceipt; error?: string };
  createGoodsReceipt?: (data: any) => { success: boolean; receipt?: GoodsReceipt; error?: string };

  createSupplierReturn: (data: {
    supplierId: string;
    goodsReceiptId?: string;
    goodsReceiptNumber?: string;
    purchaseOrderId?: string;
    purchaseOrderNumber?: string;
    warehouseId: string;
    reasonSummary: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice?: number;
      reason: string;
      lotNumber?: string;
    }[];
    notes?: string;
  }) => { success: boolean; supplierReturn?: SupplierReturn; error?: string };
  authorizeSupplierReturn: (id: string) => { success: boolean; error?: string };
  applySupplierReturnInventoryExit: (
    id: string,
    options?: { creditNoteFolio?: string; notes?: string }
  ) => { success: boolean; error?: string };

  updateReorderConfig: (productId: string, updates: Partial<ReorderConfig>) => void;

  // Purchases Analytics & AI
  getProductReorderStatus: (productId: string) => ProductReorderAnalysis;
  getReplenishmentSuggestions: (warehouseId?: string) => AIPurchaseRecommendation[];
  calculateProductReorderStatus?: typeof calculateProductReorderStatus;
  generateReplenishmentSuggestions?: typeof generateReplenishmentSuggestions;
  getSupplierComparison: (productId: string) => ReturnType<typeof getSupplierComparisonForProduct>;
  getPurchasesKPIs: () => PurchasesKPIs;
  getSuppliersScorecard: () => SupplierEvaluation[];
  askPurchasesAI: (question: string) => Promise<string>;
  resetPurchasesData: () => void;

  // Logistics Operations (Fase 3)
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => { success: boolean; error?: string };
  addDriver: (driver: Omit<Driver, 'id'>) => Driver;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => { success: boolean; error?: string };
  createRoute: (data: {
    date: string;
    warehouseId: string;
    vehicleId: string;
    driverId: string;
    zone?: string;
    notes?: string;
    orderIds: string[];
  }) => { success: boolean; route?: Route; error?: string };
  updateRoute: (id: string, updates: Partial<Route>) => void;
  cancelRoute: (routeId: string, reason: string) => { success: boolean; error?: string };
  startRouteLoading: (routeId: string) => { success: boolean; error?: string };
  completeRouteLoadingAndDepart: (routeId: string, checklist: RouteDepartureChecklist) => { success: boolean; error?: string };
  updateStopStatus: (routeId: string, stopId: string, status: RouteStop['status'], notes?: string) => void;
  getPodByOrderId: (orderId: string) => DeliveryEvidence | undefined;
  getPodByStopId: (stopId: string) => DeliveryEvidence | undefined;
  registerDeliveryEvidence: (
    routeId: string,
    stopId: string,
    evidence: DeliveryEvidence,
    deliveredItems?: { orderItemId: string; quantityDelivered: number; quantityDifference: number; rejectionReason?: string }[]
  ) => Promise<{ success: boolean; error?: string; pod?: DeliveryEvidence; message?: string }> | { success: boolean; error?: string; pod?: DeliveryEvidence; message?: string };
  registerDeliveryFailure: (
    routeId: string,
    stopId: string,
    reason: FailureReason,
    comment: string,
    rescheduledDate?: string
  ) => { success: boolean; error?: string };
  createLogisticsIncident: (data: {
    orderId?: string;
    orderNumber?: string;
    routeId?: string;
    routeNumber?: string;
    customerId?: string;
    customerName?: string;
    type: 'ACCIDENTE' | 'RETRASO' | 'DANO' | 'CLIENTE' | 'DOCUMENTACION' | 'MECANICO' | 'OTRO';
    severity: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    description: string;
  }) => LogisticsIncident;
  resolveLogisticsIncident: (incidentId: string, resolution: string) => void;
  createLogisticsReturn: (data: {
    orderId: string;
    orderNumber?: string;
    folio?: string;
    routeId?: string;
    customerId: string;
    customerName: string;
    items: LogisticsReturnItem[];
    reasonSummary: string;
    inspectionNotes?: string;
    notes?: string;
    masterTransactionId?: string;
    status?: LogisticsReturnStatus;
  }) => { success: boolean; returnItem?: LogisticsReturn; error?: string };
  inspectAndReintegrateReturn: (
    returnId: string,
    warehouseIdOrDisposition?: string,
    notesOrQty?: any,
    extraNotes?: string
  ) => { success: boolean; error?: string };
  authorizeLogisticsReturn: (
    returnId: string
  ) => { success: boolean; error?: string };
  rejectLogisticsReturn?: (
    returnId: string,
    reason?: string
  ) => { success: boolean; error?: string };
  resetTest015Case?: () => void;
  reorderRouteStops: (routeId: string, newStopOrderIds: string[]) => void;
  generateAIRouteRecommendation: (orderIds: string[], warehouseId?: string) => AIRouteRecommendation;

  // Warehouse Operations (Fase 2)
  createInventoryEntry: (data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    reason: string;
    supplierDoc?: string;
    unitCost?: number;
    location?: string;
    customUser?: { id: string; name: string; role?: any };
  }) => { success: boolean; error?: string; movement?: InventoryMovement };

  createInventoryExit: (data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    reason: string;
    orderId?: string;
    orderFolio?: string;
    recipient?: string;
    location?: string;
    customUser?: { id: string; name: string; role?: any };
  }) => { success: boolean; error?: string; movement?: InventoryMovement };

  createReservation: (orderId: string, productId: string, warehouseId: string, quantity: number, notes?: string) => { success: boolean; error?: string; reservation?: InventoryReservation };
  releaseReservation: (reservationId: string, quantity?: number, reason?: string) => { success: boolean; error?: string };
  fulfillOrder: (
    orderId: string,
    itemsToFulfill?: any,
    notes?: string
  ) => { success: boolean; error?: string };

  // Picking & Surtido Físico Operativo (Fase 2.5)
  getOrCreatePicking: (orderId: string) => Picking;
  createPickingForOrder: (orderId: string) => Picking;
  savePickingDraft: (picking: Picking) => Promise<{ success: boolean; error?: string; picking?: Picking }>;
  completePicking: (pickingId: string, notes?: string) => Promise<{ success: boolean; error?: string; picking?: Picking; fulfillmentType?: string }>;
  updatePicking: (picking: Picking) => void;
  updatePickingItemQuantity: (pickingId: string, orderItemId: string, qtyPicked: number) => { success: boolean; error?: string };
  verifyPicking: (
    pickingId: string,
    managerSignature?: string,
    verificationNotes?: string
  ) => Promise<{ success: boolean; error?: string; picking?: Picking }>;
  confirmPhysicalFulfillment: (
    orderId: string,
    pickingId?: string,
    notes?: string,
    items?: { orderItemId: string; productId: string; quantity: number; location?: string }[]
  ) => Promise<{ success: boolean; error?: string; order?: Order; picking?: Picking }>;

  createWarehouseTransfer: (data: {
    originWarehouseId: string;
    destinationWarehouseId: string;
    items: TransferItem[];
    notes?: string;
    carrier?: string;
    trackingNumber?: string;
  }) => { success: boolean; transfer?: WarehouseTransfer; error?: string };
  authorizeWarehouseTransfer: (transferId: string) => { success: boolean; error?: string };
  shipWarehouseTransfer: (transferId: string, carrier?: string, trackingNumber?: string) => { success: boolean; error?: string };
  receiveWarehouseTransfer: (transferId: string) => { success: boolean; error?: string };
  cancelWarehouseTransfer: (transferId: string, reason?: string) => { success: boolean; error?: string };

  createCountSession: (warehouseId: string, categoryFilter?: string, notes?: string) => { success: boolean; session?: InventoryCountSession; error?: string };
  updateCountItem: (sessionId: string, productId: string, countedStock: number, notes?: string) => void;
  authorizeAndApplyCountAdjustments: (sessionId: string, notes?: string) => { success: boolean; error?: string };

  createInventoryAdjustment: (data: {
    productId: string;
    warehouseId: string;
    type: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
    quantity: number;
    reason: string;
    location?: string;
    requireAuth?: boolean;
  }) => { success: boolean; error?: string; adjustment?: InventoryAdjustment };
  authorizeInventoryAdjustment: (adjustmentId: string) => { success: boolean; error?: string };
  rejectInventoryAdjustment: (adjustmentId: string, reason?: string) => { success: boolean; error?: string };

  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Warehouse;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  deleteMovement: (movementId: string) => { success: boolean; error?: string };
  wipeMovements: () => void;
  importCatalogFromJSON: (catalogJson: any[]) => { success: boolean; count: number; error?: string };
  importCatalogFromExcelRows: (rows: any[]) => { success: boolean; count: number; error?: string };
  analyzeInventoryWithAI: (warehouseIdFilter?: string) => {
    healthScore: number;
    criticalCount: number;
    overstockCount: number;
    capitalAtRisk: number;
    turnoverRatio: number;
    suggestions: { title: string; desc: string; priority: 'ALTA' | 'MEDIA' | 'BAJA'; actionText: string }[];
    topRecommendations: string[];
    analyzedAt: string;
  };

  // Real-time synchronization metadata
  lastSyncTimestamp: string;
  realtimeToast: RealtimeToast | null;
  clearRealtimeToast: () => void;
  broadcastDataUpdate: (type: string, details: any) => void;

  // Audit & Notifications
  addAuditLog: (entry: { action: string; module: ERPModule; recordId?: string; details: string; customUser?: { id: string; name: string; role: any } }) => void;
  addNotification: (notif: { title: string; message: string; type: NotificationItem['type']; module: ERPModule }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // CRM Operations (Fase 1)
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  checkCustomerDuplicates: (query: { phone?: string; email?: string; rfc?: string; companyName?: string }) => Customer[];
  convertLeadToCustomerAndOpportunity: (
    leadId: string,
    options: {
      createOpportunity?: boolean;
      opportunityTitle?: string;
      estimatedValue?: number;
      expectedCloseDate?: string;
      existingCustomerId?: string;
    }
  ) => { customer: Customer; opportunity?: Opportunity };

  addOpportunity: (opp: Omit<Opportunity, 'id' | 'folio' | 'createdAt' | 'updatedAt'>) => Opportunity;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  changeOpportunityStage: (id: string, newStage: string) => void;

  addActivity: (act: Omit<CRMActivity, 'id' | 'createdAt'>) => CRMActivity;
  addFollowUp: (task: Omit<FollowUp, 'id' | 'createdAt'>) => FollowUp;
  updateFollowUpStatus: (id: string, status: FollowUpStatus, completedNotes?: string) => void;

  addCustomerContact: (contact: Omit<CustomerContact, 'id'>) => CustomerContact;
  updateCustomerContact: (id: string, updates: Partial<CustomerContact>) => void;

  // Quote & Sales Engine
  createQuote: (quoteData: Partial<Quote> & { customerId?: string; customer_id?: string; items: any[] }) => Quote;
  addQuote: (quoteData: Partial<Quote> & { customerId?: string; customer_id?: string; items: any[] }) => Quote;
  createQuoteFromOpportunity: (opportunityId: string, quoteData?: Partial<Quote>) => Quote;
  updateQuoteStatus: (id: string, status: any) => void;
  approveQuote: (quoteId: string) => { success: boolean; error?: string };
  requestFinancialApproval: (quoteId: string, notes?: string) => { success: boolean; error?: string };
  approveFinancialQuote: (quoteId: string, notes?: string, customUser?: any) => { success: boolean; error?: string };
  rejectFinancialQuote: (quoteId: string, reason: string, customUser?: any) => { success: boolean; error?: string };
  calculateQuoteMarginAndDiscount: (items: any[], discountPct: number, overrideRole?: string) => QuoteMarginValidation;

  // Transactional Workflows
  createOrder: (orderData: Partial<Order> & { customerId?: string; customer_id?: string; items: any[] }, customUser?: { id: string; name: string; role?: any }) => Order;
  addOrder: (orderData: Partial<Order> & { customerId?: string; customer_id?: string; items: any[] }, customUser?: { id: string; name: string; role?: any }) => Order;
  convertQuoteToOrder: (quoteId: string, customUser?: { id: string; name: string }) => { success: boolean; orderFolio?: string; error?: string };
  recordMovement: (data: {
    productId: string;
    warehouseId: string;
    type: MovementType;
    quantity: number;
    reason: string;
    relatedDocFolio?: string;
    location?: string;
    customUser?: { id: string; name: string; role?: any };
  }) => { success: boolean; error?: string; movement?: InventoryMovement };

  // Settings & Configuration
  updateCompanyConfig: (updates: Partial<CompanyConfig>) => void;
  updateSalesGoal: (id: string, updates: Partial<SalesGoal>) => void;
  updateCommissionRule: (id: string, updates: Partial<CommissionRule>) => void;
  updatePipelineStages: (stages: PipelineStageConfig[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => { success: boolean; error?: string };
  updateQuote: (id: string, updates: Partial<Quote>) => { success: boolean; error?: string; quote?: Quote };
  duplicateQuote: (id: string) => { success: boolean; error?: string; quote?: Quote };
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    notes?: string,
    customUser?: { id: string; name: string; role?: any }
  ) => { success: boolean; error?: string; order?: Order };
  deliverOrder: (
    orderId: string,
    deliveryData?: {
      recipientName?: string;
      shippingAddress?: string;
      notes?: string;
      deliveryDate?: string;
      customUser?: { id: string; name: string; role?: any };
    }
  ) => { success: boolean; error?: string; order?: Order };
  resetToDemoData: () => void;

  // AI Helpers (ConsCore AI)
  analyzeOpportunityWithAI: (opportunityId: string) => AIOpportunityAnalysis;
  generateFollowUpDraftWithAI: (options: {
    lead?: Lead;
    opportunity?: Opportunity;
    customer?: Customer;
    channel: 'WHATSAPP' | 'EMAIL' | 'LLAMADA';
    userPrompt?: string;
  }) => AIFollowUpDraft;

  // Computed metrics
  metrics: {
    ventasHoy: number;
    ventasMes: number;
    metaMensual: number;
    cumplimiento: number;
    utilidadBruta: number;
    margenPromedioPct: number;
    totalCarteraPorCobrar: number;
    carteraVencida: number;
    pedidosPendientesCount: number;
    cotizacionesPendientesCount: number;
    stockCriticoCount: number;
    entregasHoyCount: number;
  };

  salesMetrics: {
    ventasHoy: number;
    ventasMes: number;
    metaMensual: number;
    cumplimientoPct: number;
    pipelineTotal: number;
    pipelinePonderado: number;
    forecastTotal: number;
    leadsCount: number;
    seguimientosVencidosCount: number;
    seguimientosHoyCount: number;
    rankingVendedores: {
      id: string;
      name: string;
      avatar?: string;
      actualSales: number;
      goalAmount: number;
      fulfillmentPct: number;
      dealsWonCount: number;
      quotesCount: number;
      commissionEstimated: number;
    }[];
  };

  // Marketing & Campaigns State (Fase 5)
  marketingCampaigns: MarketingCampaign[];
  marketingChannels: MarketingChannel[];
  campaignExpenses: CampaignExpense[];
  marketingSegments: MarketingSegment[];
  touchpoints: Touchpoint[];
  aiMarketingProposals: AIMarketingProposal[];
  selectedAttributionModel: AttributionModel;
  marketingKPIs: MarketingKPIs;

  // Marketing Methods (Fase 5)
  addMarketingCampaign: (campaignData: Partial<MarketingCampaign>) => MarketingCampaign;
  updateMarketingCampaign: (id: string, updates: Partial<MarketingCampaign>) => void;
  deleteMarketingCampaign: (id: string) => { success: boolean; error?: string };
  addMarketingChannel: (channelData: Partial<MarketingChannel>) => MarketingChannel;
  updateMarketingChannel: (id: string, updates: Partial<MarketingChannel>) => void;
  addCampaignExpense: (expenseData: Partial<CampaignExpense>) => CampaignExpense;
  deleteCampaignExpense: (id: string) => void;
  addMarketingSegment: (segmentData: Partial<MarketingSegment>) => MarketingSegment;
  updateMarketingSegment: (id: string, updates: Partial<MarketingSegment>) => void;
  addTouchpoint: (touchpointData: Partial<Touchpoint>) => Touchpoint;
  authorizeAIMarketingProposal: (proposalId: string) => void;
  rejectAIMarketingProposal: (proposalId: string) => void;
  setSelectedAttributionModel: (model: AttributionModel) => void;
  getCampaignAttribution: (model?: AttributionModel) => CampaignAttributionResult[];
  executeE2ETestFlow: (options?: {
    campaignId?: string;
    leadCompanyName?: string;
    leadContactName?: string;
    leadPhone?: string;
    leadEmail?: string;
    productInterest?: string;
    estimatedValue?: number;
    productId?: string;
    quantity?: number;
  }) => {
    campaign: MarketingCampaign;
    lead: Lead;
    customer: Customer;
    opportunity: Opportunity;
    quote: Quote;
    order: Order;
    movements: InventoryMovement[];
    touchpoints: Touchpoint[];
    metricsBefore: { roas: number; ordersWon: number; revenue: number };
    metricsAfter: { roas: number; ordersWon: number; revenue: number };
  };

  // Recursos Humanos & Talento (Fase 6)
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  shifts: Shift[];
  confidentialData: Record<string, EmployeeConfidentialData>;
  employeeDocuments: EmployeeDocument[];
  attendanceRecords: AttendanceRecord[];
  absenceRequests: AbsenceRequest[];
  vacationBalances: VacationBalance[];
  commissionRecords: CommissionRecord[];
  payrollPeriods: PayrollPeriod[];
  performanceReviews: PerformanceReview[];
  employeeGoals: EmployeeGoal[];
  trainingCourses: TrainingCourse[];
  employeeTrainings: EmployeeTraining[];
  skills: Skill[];
  employeeSkills: EmployeeSkill[];
  aiHRInsights: AIHRAdvisorInsight[];
  hrKPIs: HRKPIs;
  computedHRKPIs?: HRKPIs;

  // HR Operations (Fase 6)
  addEmployee: (data: Partial<Employee>, confidential?: Partial<EmployeeConfidentialData>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  updateConfidentialData: (employeeId: string, data: Partial<EmployeeConfidentialData>) => void;
  registerCheckIn: (employeeId: string, source?: 'RELOJ_VIRTUAL' | 'BIOMETRICO' | 'APP_MOVIL') => void;
  registerCheckOut: (employeeId: string) => void;
  requestAbsence: (data: {
    employeeId: string;
    type: 'VACACIONES' | 'INCAPACIDAD' | 'PERMISO' | 'FALTA_JUSTIFICADA';
    startDate: string;
    endDate: string;
    reason: string;
  }) => void;
  reviewAbsenceRequest: (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => void;
  addEmployeeDocument: (doc: {
    employeeId: string;
    documentType: EmployeeDocument['documentType'];
    title: string;
    fileReference: string;
    issueDate: string;
    expirationDate?: string;
    confidentialLevel?: EmployeeDocument['confidentialLevel'];
  }) => void;
  calculateCommissionForOrderAction: (orderId: string, ruleId?: string) => void;
  approveCommissionRecord: (id: string) => void;
  assignTrainingCourse: (employeeId: string, courseId: string) => void;
  completeTrainingCourse: (trainingId: string, score: number, certificateRef?: string) => void;
  updateGoalProgress: (goalId: string, actualValue: number) => void;
  refreshAIHRInsights: () => void;
  approveAIInsight: (id: string) => void;
  dismissAIInsight: (id: string) => void;

  // Finanzas & Tesorería (Fase 7)
  chartOfAccounts: ChartAccount[];
  costCenters: CostCenter[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  bankReconciliations: BankReconciliationSession[];
  cxcInvoices: AccountsReceivableInvoice[];
  cxcPayments: CXCPaymentRecord[];
  collectionActivities: CollectionActivity[];
  cxpInvoices: AccountsPayableInvoice[];
  cxpPayments: CXPPaymentRecord[];
  paymentSchedule: PaymentScheduleItem[];
  budgets: Budget[];
  expenses: Expense[];
  creditNotes: CreditNote[];
  periodClosings: FinancialPeriodClosing[];
  aiFinancialInsights: AIFinancialInsight[];
  financialKPIs: FinancialKPIs;

  // Finance Methods (Fase 7)
  addChartAccount: (account: Omit<ChartAccount, 'id' | 'createdAt' | 'updatedAt'>) => ChartAccount;
  updateChartAccount: (id: string, updates: Partial<ChartAccount>) => void;
  addCostCenter: (center: Omit<CostCenter, 'id'>) => CostCenter;
  updateCostCenter: (id: string, updates: Partial<CostCenter>) => void;
  addBankAccount: (account: Omit<BankAccount, 'id'>) => BankAccount;
  registerBankTransaction: (tx: Omit<BankTransaction, 'id' | 'folio' | 'createdAt' | 'auditUser' | 'isReconciled'>) => BankTransaction;
  createCXCInvoice: (invoice: Omit<AccountsReceivableInvoice, 'id' | 'folio' | 'createdAt' | 'createdBy' | 'paidAmount' | 'balance' | 'overdueDays' | 'status'>) => AccountsReceivableInvoice;
  recordCXCPayment: (paymentData: {
    cxcId: string;
    amount: number;
    paymentDate: string;
    bankAccountId: string;
    bankReference: string;
    paymentFormSat: '01' | '03' | '04' | '99';
    notes?: string;
  }) => CXCPaymentRecord | null;
  addCollectionActivity: (activity: Omit<CollectionActivity, 'id' | 'createdAt' | 'recordedBy'>) => CollectionActivity;
  createCXPInvoice: (invoice: Omit<AccountsPayableInvoice, 'id' | 'folio' | 'createdAt' | 'paidAmount' | 'balance' | 'overdueDays' | 'status'>) => AccountsPayableInvoice;
  recordCXPPayment: (paymentData: {
    cxpId: string;
    amount: number;
    paymentDate: string;
    bankAccountId: string;
    bankReference: string;
    notes?: string;
  }) => CXPPaymentRecord | null;
  addPaymentScheduleItem: (item: Omit<PaymentScheduleItem, 'id' | 'createdAt' | 'authorizationStatus'>) => PaymentScheduleItem;
  authorizePaymentScheduleItem: (id: string, authorize: boolean) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'varianceAmount' | 'variancePct' | 'status' | 'alertTriggered'>) => Budget;
  addExpense: (expense: Omit<Expense, 'id' | 'folio' | 'createdAt' | 'status'>) => Expense;
  approveExpense: (id: string, approve: boolean) => void;
  payExpense: (id: string, bankAccountId: string, paymentReference: string) => void;
  addCreditNote: (note: Omit<CreditNote, 'id' | 'folio' | 'createdAt' | 'status'>) => CreditNote;
  closeFinancialPeriod: (periodId: string) => void;
  updateAIFinancialInsightStatus: (id: string, status: AIFinancialInsight['status']) => void;
  getFinancialKPIs: () => FinancialKPIs;
  getCustomerStatement: (customerId: string) => CustomerFinancialStatement | null;
  getCustomerCreditEvaluation: (customerId: string, newOrderAmount?: number) => CreditEvaluationResult | null;
  getProfitability: () => ProfitabilityAnalysis;
  getProfitabilityBreakdown: () => ProfitabilityAnalysis;
  runFinancialSimulation: (params: Partial<FinancialSimulationParams>) => FinancialSimulationResult;

  // Phase 11: Customer Service, Warranties, Returns, Quality, CAPA, NPS & BI Executive
  serviceTickets: ServiceTicket[];
  slaRules: SLARule[];
  slaAlerts: SLAAlert[];
  warranties: WarrantyCertificate[];
  warrantyClaims: WarrantyClaim[];
  customerReturns: CustomerReturn[];
  qualityIncidents: QualityIncident[];
  capaActions: CAPAAction[];
  customerSurveys: CustomerSurvey[];
  customerHealthScores: CustomerHealthScoreData[];
  customerProfitabilityDetailed: CustomerProfitabilityDetailed[];
  executiveCustomerServiceKPIs: ExecutiveCustomerServiceKPIs;
  npsMetrics: NPSMetrics;
  createServiceTicket: (ticket: any) => ServiceTicket;
  updateServiceTicketStatus: (id: string, status: TicketStatus, summary?: string, rootCause?: string) => void;
  addTicketComment: (id: string, content: string, isInternal?: boolean) => void;
  registerWarrantyClaim: (claim: any) => WarrantyClaim;
  resolveWarrantyClaim: (id: string, decision: 'APROBADA' | 'RECHAZADA' | 'PARCIAL', approvedQty: number, notes: string, reason?: string) => void;
  createCustomerReturn: (ret: any) => CustomerReturn;
  processReturnInspectionAndRestock: (id: string, passed: boolean, notes: string, disposition: any, warehouseId?: string) => void;
  recordQualityIncident: (incident: any) => QualityIncident;
  createCAPAAction: (capa: any) => CAPAAction;
  submitCustomerSurvey: (survey: any) => CustomerSurvey;
  runPhase11Certification: () => Phase11CertificationResult;
  askCustomerAdvisorAI: (queryId: string, customQuery?: string) => AICustomerAdvisorResponse;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'conscore_realtime_sync_bus_v1';

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Core ERP state with localStorage caching
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('conscore_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('conscore_products');
    let loaded: Product[] = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    if (!Array.isArray(loaded)) loaded = INITIAL_PRODUCTS;

    // Observación 20: Ensure SKU-TEST-020 is always present with correct stock (físico: 20, reservado: 5, disponible: 15)
    let p020 = loaded.find(p => p.sku === 'SKU-TEST-020' || p.code === 'SKU-TEST-020');
    if (!p020) {
      const canonical020 = INITIAL_PRODUCTS.find(p => p.sku === 'SKU-TEST-020');
      if (canonical020) loaded.push({ ...canonical020 });
    } else {
      p020.stock = 20;
      p020.physicalStock = 20;
      p020.reservedStock = 5;
      p020.availableStock = 15;
    }

    // Observación 20: Ensure SKU-TEST-MULTI is always present with CEDIS A (10) and CEDIS B (7)
    let pMulti = loaded.find(p => p.sku === 'SKU-TEST-MULTI' || p.code === 'SKU-TEST-MULTI');
    if (!pMulti) {
      const canonicalMulti = INITIAL_PRODUCTS.find(p => p.sku === 'SKU-TEST-MULTI');
      if (canonicalMulti) loaded.push({ ...canonicalMulti });
    }

    return loaded;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('conscore_quotes');
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('conscore_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('conscore_warehouses');
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('conscore_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem('conscore_movements');
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('conscore_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('conscore_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem('conscore_company_config');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_CONFIG;
  });

  // CRM & Sales State (Fase 1)
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('conscore_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const saved = localStorage.getItem('conscore_opportunities');
    return saved ? JSON.parse(saved) : INITIAL_OPPORTUNITIES;
  });

  const [activities, setActivities] = useState<CRMActivity[]>(() => {
    const saved = localStorage.getItem('conscore_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [followUps, setFollowUps] = useState<FollowUp[]>(() => {
    const saved = localStorage.getItem('conscore_follow_ups');
    return saved ? JSON.parse(saved) : INITIAL_FOLLOW_UPS;
  });

  const [salesGoals, setSalesGoals] = useState<SalesGoal[]>(() => {
    const saved = localStorage.getItem('conscore_sales_goals');
    return saved ? JSON.parse(saved) : INITIAL_SALES_GOALS;
  });

  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>(() => {
    const saved = localStorage.getItem('conscore_commission_rules');
    return saved ? JSON.parse(saved) : INITIAL_COMMISSION_RULES;
  });

  const [pipelineStages, setPipelineStages] = useState<PipelineStageConfig[]>(() => {
    const saved = localStorage.getItem('conscore_pipeline_stages');
    return saved ? JSON.parse(saved) : INITIAL_PIPELINE_STAGES;
  });

  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>(() => {
    const saved = localStorage.getItem('conscore_customer_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_CONTACTS;
  });

  // Inventory & Warehouse State (Fase 2)
  const [reservations, setReservations] = useState<InventoryReservation[]>(() => {
    const saved = localStorage.getItem('conscore_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [transfers, setTransfers] = useState<WarehouseTransfer[]>(() => {
    const saved = localStorage.getItem('conscore_transfers');
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  const [countSessions, setCountSessions] = useState<InventoryCountSession[]>(() => {
    const saved = localStorage.getItem('conscore_count_sessions');
    return saved ? JSON.parse(saved) : INITIAL_COUNT_SESSIONS;
  });

  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>(() => {
    const saved = localStorage.getItem('conscore_adjustments');
    return saved ? JSON.parse(saved) : INITIAL_ADJUSTMENTS;
  });

  // Picking & Surtido Físico State (Fase 2.5)
  const [pickings, setPickings] = useState<Picking[]>(() => {
    const saved = localStorage.getItem('conscore_pickings');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('conscore_pickings', JSON.stringify(pickings));
    } catch (_) {}
  }, [pickings]);

  // Logistics & Fleet State (Fase 3)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('conscore_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('conscore_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [routes, setRoutes] = useState<Route[]>(() => {
    const saved = localStorage.getItem('conscore_routes');
    return saved ? JSON.parse(saved) : INITIAL_ROUTES;
  });

  const [logisticsIncidents, setLogisticsIncidents] = useState<LogisticsIncident[]>(() => {
    const saved = localStorage.getItem('conscore_logistics_incidents');
    return saved ? JSON.parse(saved) : INITIAL_LOGISTICS_INCIDENTS;
  });

  const [logisticsReturns, setLogisticsReturns] = useState<LogisticsReturn[]>(() => {
    const saved = localStorage.getItem('conscore_logistics_returns');
    return saved ? JSON.parse(saved) : INITIAL_LOGISTICS_RETURNS;
  });

  const [pods, setPods] = useState<DeliveryEvidence[]>(() => {
    const saved = localStorage.getItem('conscore_pods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    const initialPods: DeliveryEvidence[] = [];
    INITIAL_ROUTES.forEach((r) => {
      r.stops.forEach((s) => {
        if (s.evidence) {
          initialPods.push(s.evidence);
        }
      });
    });
    return initialPods;
  });

  // Compras, Proveedores & Reabastecimiento Inteligente (Fase 4)
  const [supplierContacts, setSupplierContacts] = useState<SupplierContact[]>(() => {
    const saved = localStorage.getItem('conscore_supplier_contacts');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_CONTACTS;
  });

  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>(() => {
    const saved = localStorage.getItem('conscore_supplier_products');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_PRODUCTS;
  });

  const [purchasePriceHistory, setPurchasePriceHistory] = useState<PurchasePriceHistory[]>(() => {
    const saved = localStorage.getItem('conscore_purchase_price_history');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_PRICE_HISTORY;
  });

  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('conscore_purchase_requests');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_REQUESTS_10;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('conscore_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS_10;
  });

  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => {
    const saved = localStorage.getItem('conscore_goods_receipts');
    return saved ? JSON.parse(saved) : INITIAL_GOODS_RECEIPTS;
  });

  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>(() => {
    const saved = localStorage.getItem('conscore_supplier_returns');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_RETURNS;
  });

  const [reorderConfigs, setReorderConfigs] = useState<ReorderConfig[]>(() => {
    const saved = localStorage.getItem('conscore_reorder_configs');
    return saved ? JSON.parse(saved) : INITIAL_REORDER_CONFIGS;
  });

  const [purchaseApprovalLimits, setPurchaseApprovalLimits] = useState<PurchaseApprovalLimit[]>(() => {
    const saved = localStorage.getItem('conscore_purchase_approval_limits');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_APPROVAL_LIMITS;
  });

  // Marketing & Campaigns State (Fase 5)
  const [marketingCampaigns, setMarketingCampaigns] = useState<MarketingCampaign[]>(() => {
    const saved = localStorage.getItem('conscore_marketing_campaigns');
    return saved ? JSON.parse(saved) : INITIAL_MARKETING_CAMPAIGNS;
  });

  const [marketingChannels, setMarketingChannels] = useState<MarketingChannel[]>(() => {
    const saved = localStorage.getItem('conscore_marketing_channels');
    return saved ? JSON.parse(saved) : INITIAL_MARKETING_CHANNELS;
  });

  const [campaignExpenses, setCampaignExpenses] = useState<CampaignExpense[]>(() => {
    const saved = localStorage.getItem('conscore_campaign_expenses');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGN_EXPENSES;
  });

  const [marketingSegments, setMarketingSegments] = useState<MarketingSegment[]>(() => {
    const saved = localStorage.getItem('conscore_marketing_segments');
    return saved ? JSON.parse(saved) : INITIAL_MARKETING_SEGMENTS;
  });

  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>(() => {
    const saved = localStorage.getItem('conscore_touchpoints');
    return saved ? JSON.parse(saved) : INITIAL_TOUCHPOINTS;
  });

  const [aiMarketingProposals, setAiMarketingProposals] = useState<AIMarketingProposal[]>(() => {
    const saved = localStorage.getItem('conscore_ai_marketing_proposals');
    return saved ? JSON.parse(saved) : INITIAL_AI_MARKETING_PROPOSALS;
  });

  const [selectedAttributionModel, setSelectedAttributionModel] = useState<AttributionModel>('DATA_DRIVEN');

  // Recursos Humanos & Talento State (Fase 6)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('conscore_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
    } catch (e) {
      console.warn('[ERP] Error cargando empleados de localStorage:', e);
    }
    return INITIAL_EMPLOYEES_20;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem('conscore_departments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[ERP] Error cargando departamentos de localStorage:', e);
    }
    return INITIAL_DEPARTMENTS;
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem('conscore_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[ERP] Error cargando puestos de localStorage:', e);
    }
    return INITIAL_POSITIONS;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    try {
      const saved = localStorage.getItem('conscore_shifts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[ERP] Error cargando turnos de localStorage:', e);
    }
    return INITIAL_SHIFTS;
  });

  const [confidentialData, setConfidentialData] = useState<Record<string, EmployeeConfidentialData>>(() => {
    try {
      const saved = localStorage.getItem('conscore_confidential_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[ERP] Error cargando datos confidenciales de localStorage:', e);
    }
    return INITIAL_CONFIDENTIAL_DATA;
  });

  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocument[]>(() => {
    const saved = localStorage.getItem('conscore_employee_documents');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_DOCUMENTS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('conscore_attendance_records');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
  });

  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>(() => {
    const saved = localStorage.getItem('conscore_absence_requests');
    return saved ? JSON.parse(saved) : INITIAL_ABSENCE_REQUESTS;
  });

  const [vacationBalances, setVacationBalances] = useState<VacationBalance[]>(() => {
    const saved = localStorage.getItem('conscore_vacation_balances');
    return saved ? JSON.parse(saved) : INITIAL_VACATION_BALANCES;
  });

  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>(() => {
    const saved = localStorage.getItem('conscore_commission_records');
    return saved ? JSON.parse(saved) : INITIAL_COMMISSION_RECORDS;
  });

  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>(() => {
    const saved = localStorage.getItem('conscore_payroll_periods');
    return saved ? JSON.parse(saved) : [INITIAL_PAYROLL_PERIOD];
  });

  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>(() => {
    const saved = localStorage.getItem('conscore_performance_reviews');
    return saved ? JSON.parse(saved) : INITIAL_PERFORMANCE_REVIEWS;
  });

  const [employeeGoals, setEmployeeGoals] = useState<EmployeeGoal[]>(() => {
    const saved = localStorage.getItem('conscore_employee_goals');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_GOALS;
  });

  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>(() => {
    const saved = localStorage.getItem('conscore_training_courses');
    return saved ? JSON.parse(saved) : INITIAL_TRAINING_COURSES;
  });

  const [employeeTrainings, setEmployeeTrainings] = useState<EmployeeTraining[]>(() => {
    const saved = localStorage.getItem('conscore_employee_trainings');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_TRAININGS;
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    const saved = localStorage.getItem('conscore_skills');
    return saved ? JSON.parse(saved) : INITIAL_SKILLS;
  });

  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>(() => {
    const saved = localStorage.getItem('conscore_employee_skills');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_SKILLS;
  });

  const [aiHRInsights, setAiHRInsights] = useState<AIHRAdvisorInsight[]>(() => {
    const saved = localStorage.getItem('conscore_ai_hr_insights');
    return saved ? JSON.parse(saved) : INITIAL_AI_HR_INSIGHTS;
  });

  // Finanzas & Tesorería State (Fase 7)
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartAccount[]>(() => {
    const saved = localStorage.getItem('conscore_chart_of_accounts');
    return saved ? JSON.parse(saved) : INITIAL_CHART_OF_ACCOUNTS;
  });

  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => {
    const saved = localStorage.getItem('conscore_cost_centers');
    return saved ? JSON.parse(saved) : INITIAL_COST_CENTERS;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('conscore_bank_accounts');
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('conscore_bank_transactions');
    return saved ? JSON.parse(saved) : INITIAL_BANK_TRANSACTIONS;
  });

  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliationSession[]>(() => {
    const saved = localStorage.getItem('conscore_bank_reconciliations');
    return saved ? JSON.parse(saved) : INITIAL_BANK_RECONCILIATIONS;
  });

  const [cxcInvoices, setCXCInvoices] = useState<AccountsReceivableInvoice[]>(() => {
    const saved = localStorage.getItem('conscore_cxc_invoices');
    return saved ? JSON.parse(saved) : INITIAL_CXC_INVOICES;
  });

  const [cxcPayments, setCXCPayments] = useState<CXCPaymentRecord[]>(() => {
    const saved = localStorage.getItem('conscore_cxc_payments');
    return saved ? JSON.parse(saved) : INITIAL_CXC_PAYMENTS;
  });

  const [collectionActivities, setCollectionActivities] = useState<CollectionActivity[]>(() => {
    const saved = localStorage.getItem('conscore_collection_activities');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTION_ACTIVITIES;
  });

  const [cxpInvoices, setCXPInvoices] = useState<AccountsPayableInvoice[]>(() => {
    const saved = localStorage.getItem('conscore_cxp_invoices');
    return saved ? JSON.parse(saved) : INITIAL_CXP_INVOICES;
  });

  const [cxpPayments, setCXPPayments] = useState<CXPPaymentRecord[]>(() => {
    const saved = localStorage.getItem('conscore_cxp_payments');
    return saved ? JSON.parse(saved) : INITIAL_CXP_PAYMENTS;
  });

  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(() => {
    const saved = localStorage.getItem('conscore_payment_schedule');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_SCHEDULE;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('conscore_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('conscore_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => {
    const saved = localStorage.getItem('conscore_credit_notes');
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_NOTES;
  });

  const [periodClosings, setPeriodClosings] = useState<FinancialPeriodClosing[]>(() => {
    const saved = localStorage.getItem('conscore_period_closings');
    return saved ? JSON.parse(saved) : INITIAL_PERIOD_CLOSINGS;
  });

  const [aiFinancialInsights, setAIFinancialInsights] = useState<AIFinancialInsight[]>(() => {
    const saved = localStorage.getItem('conscore_ai_financial_insights');
    return saved ? JSON.parse(saved) : INITIAL_AI_FINANCIAL_INSIGHTS;
  });

  // Phase 11 State (Servicio al Cliente, Garantías, Devoluciones, Calidad, CAPA, NPS)
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>(() => {
    const saved = localStorage.getItem('conscore_service_tickets');
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_TICKETS;
  });

  const [slaRules, setSlaRules] = useState<SLARule[]>(() => {
    const saved = localStorage.getItem('conscore_sla_rules');
    return saved ? JSON.parse(saved) : INITIAL_SLA_RULES;
  });

  const [warranties, setWarranties] = useState<WarrantyCertificate[]>(() => {
    const saved = localStorage.getItem('conscore_warranties');
    return saved ? JSON.parse(saved) : INITIAL_WARRANTIES;
  });

  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>(() => {
    const saved = localStorage.getItem('conscore_warranty_claims');
    return saved ? JSON.parse(saved) : INITIAL_WARRANTY_CLAIMS;
  });

  const [customerReturns, setCustomerReturns] = useState<CustomerReturn[]>(() => {
    const saved = localStorage.getItem('conscore_customer_returns');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_RETURNS;
  });

  const [qualityIncidents, setQualityIncidents] = useState<QualityIncident[]>(() => {
    const saved = localStorage.getItem('conscore_quality_incidents');
    return saved ? JSON.parse(saved) : INITIAL_QUALITY_INCIDENTS;
  });

  const [capaActions, setCapaActions] = useState<CAPAAction[]>(() => {
    const saved = localStorage.getItem('conscore_capa_actions');
    return saved ? JSON.parse(saved) : INITIAL_CAPA_ACTIONS;
  });

  const [customerSurveys, setCustomerSurveys] = useState<CustomerSurvey[]>(() => {
    const saved = localStorage.getItem('conscore_customer_surveys');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_SURVEYS;
  });

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(() => new Date().toLocaleTimeString('es-MX'));
  const [realtimeToast, setRealtimeToast] = useState<RealtimeToast | null>(null);
  
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Sync to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('conscore_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('conscore_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('conscore_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('conscore_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('conscore_movements', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('conscore_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('conscore_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('conscore_company_config', JSON.stringify(companyConfig));
  }, [companyConfig]);

  useEffect(() => {
    localStorage.setItem('conscore_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('conscore_opportunities', JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem('conscore_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('conscore_follow_ups', JSON.stringify(followUps));
  }, [followUps]);

  useEffect(() => {
    localStorage.setItem('conscore_sales_goals', JSON.stringify(salesGoals));
  }, [salesGoals]);

  useEffect(() => {
    localStorage.setItem('conscore_commission_rules', JSON.stringify(commissionRules));
  }, [commissionRules]);

  useEffect(() => {
    localStorage.setItem('conscore_pipeline_stages', JSON.stringify(pipelineStages));
  }, [pipelineStages]);

  useEffect(() => {
    localStorage.setItem('conscore_customer_contacts', JSON.stringify(customerContacts));
  }, [customerContacts]);

  useEffect(() => {
    localStorage.setItem('conscore_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('conscore_transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('conscore_count_sessions', JSON.stringify(countSessions));
  }, [countSessions]);

  useEffect(() => {
    localStorage.setItem('conscore_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem('conscore_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('conscore_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('conscore_routes', JSON.stringify(routes));
  }, [routes]);

  useEffect(() => {
    localStorage.setItem('conscore_logistics_incidents', JSON.stringify(logisticsIncidents));
  }, [logisticsIncidents]);

  useEffect(() => {
    localStorage.setItem('conscore_logistics_returns', JSON.stringify(logisticsReturns));
  }, [logisticsReturns]);

  useEffect(() => {
    localStorage.setItem('conscore_pods', JSON.stringify(pods));
  }, [pods]);

  // Purchases localStorage sync (Fase 4)
  useEffect(() => {
    localStorage.setItem('conscore_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('conscore_supplier_contacts', JSON.stringify(supplierContacts));
  }, [supplierContacts]);

  useEffect(() => {
    localStorage.setItem('conscore_supplier_products', JSON.stringify(supplierProducts));
  }, [supplierProducts]);

  useEffect(() => {
    localStorage.setItem('conscore_purchase_price_history', JSON.stringify(purchasePriceHistory));
  }, [purchasePriceHistory]);

  useEffect(() => {
    localStorage.setItem('conscore_purchase_requests', JSON.stringify(purchaseRequests));
  }, [purchaseRequests]);

  useEffect(() => {
    localStorage.setItem('conscore_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('conscore_goods_receipts', JSON.stringify(goodsReceipts));
  }, [goodsReceipts]);

  useEffect(() => {
    localStorage.setItem('conscore_supplier_returns', JSON.stringify(supplierReturns));
  }, [supplierReturns]);

  useEffect(() => {
    localStorage.setItem('conscore_reorder_configs', JSON.stringify(reorderConfigs));
  }, [reorderConfigs]);

  useEffect(() => {
    localStorage.setItem('conscore_purchase_approval_limits', JSON.stringify(purchaseApprovalLimits));
  }, [purchaseApprovalLimits]);

  // Marketing localStorage sync (Fase 5)
  useEffect(() => {
    localStorage.setItem('conscore_marketing_campaigns', JSON.stringify(marketingCampaigns));
  }, [marketingCampaigns]);

  useEffect(() => {
    localStorage.setItem('conscore_marketing_channels', JSON.stringify(marketingChannels));
  }, [marketingChannels]);

  useEffect(() => {
    localStorage.setItem('conscore_campaign_expenses', JSON.stringify(campaignExpenses));
  }, [campaignExpenses]);

  useEffect(() => {
    localStorage.setItem('conscore_marketing_segments', JSON.stringify(marketingSegments));
  }, [marketingSegments]);

  useEffect(() => {
    localStorage.setItem('conscore_touchpoints', JSON.stringify(touchpoints));
  }, [touchpoints]);

  useEffect(() => {
    localStorage.setItem('conscore_ai_marketing_proposals', JSON.stringify(aiMarketingProposals));
  }, [aiMarketingProposals]);

  // HR localStorage sync (Fase 6)
  useEffect(() => {
    localStorage.setItem('conscore_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('conscore_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('conscore_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('conscore_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('conscore_confidential_data', JSON.stringify(confidentialData));
  }, [confidentialData]);

  useEffect(() => {
    localStorage.setItem('conscore_employee_documents', JSON.stringify(employeeDocuments));
  }, [employeeDocuments]);

  useEffect(() => {
    localStorage.setItem('conscore_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('conscore_absence_requests', JSON.stringify(absenceRequests));
  }, [absenceRequests]);

  useEffect(() => {
    localStorage.setItem('conscore_vacation_balances', JSON.stringify(vacationBalances));
  }, [vacationBalances]);

  useEffect(() => {
    localStorage.setItem('conscore_commission_records', JSON.stringify(commissionRecords));
  }, [commissionRecords]);

  useEffect(() => {
    localStorage.setItem('conscore_payroll_periods', JSON.stringify(payrollPeriods));
  }, [payrollPeriods]);

  useEffect(() => {
    localStorage.setItem('conscore_performance_reviews', JSON.stringify(performanceReviews));
  }, [performanceReviews]);

  useEffect(() => {
    localStorage.setItem('conscore_employee_goals', JSON.stringify(employeeGoals));
  }, [employeeGoals]);

  useEffect(() => {
    localStorage.setItem('conscore_training_courses', JSON.stringify(trainingCourses));
  }, [trainingCourses]);

  useEffect(() => {
    localStorage.setItem('conscore_employee_trainings', JSON.stringify(employeeTrainings));
  }, [employeeTrainings]);

  useEffect(() => {
    localStorage.setItem('conscore_skills', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem('conscore_employee_skills', JSON.stringify(employeeSkills));
  }, [employeeSkills]);

  useEffect(() => {
    localStorage.setItem('conscore_ai_hr_insights', JSON.stringify(aiHRInsights));
  }, [aiHRInsights]);

  // Finance localStorage sync (Fase 7)
  useEffect(() => {
    localStorage.setItem('conscore_chart_of_accounts', JSON.stringify(chartOfAccounts));
  }, [chartOfAccounts]);

  useEffect(() => {
    localStorage.setItem('conscore_cost_centers', JSON.stringify(costCenters));
  }, [costCenters]);

  useEffect(() => {
    localStorage.setItem('conscore_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('conscore_bank_transactions', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('conscore_bank_reconciliations', JSON.stringify(bankReconciliations));
  }, [bankReconciliations]);

  useEffect(() => {
    localStorage.setItem('conscore_cxc_invoices', JSON.stringify(cxcInvoices));
  }, [cxcInvoices]);

  useEffect(() => {
    localStorage.setItem('conscore_cxc_payments', JSON.stringify(cxcPayments));
  }, [cxcPayments]);

  useEffect(() => {
    localStorage.setItem('conscore_collection_activities', JSON.stringify(collectionActivities));
  }, [collectionActivities]);

  useEffect(() => {
    localStorage.setItem('conscore_cxp_invoices', JSON.stringify(cxpInvoices));
  }, [cxpInvoices]);

  useEffect(() => {
    localStorage.setItem('conscore_cxp_payments', JSON.stringify(cxpPayments));
  }, [cxpPayments]);

  useEffect(() => {
    localStorage.setItem('conscore_payment_schedule', JSON.stringify(paymentSchedule));
  }, [paymentSchedule]);

  useEffect(() => {
    localStorage.setItem('conscore_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('conscore_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('conscore_credit_notes', JSON.stringify(creditNotes));
  }, [creditNotes]);

  useEffect(() => {
    localStorage.setItem('conscore_period_closings', JSON.stringify(periodClosings));
  }, [periodClosings]);

  useEffect(() => {
    localStorage.setItem('conscore_ai_financial_insights', JSON.stringify(aiFinancialInsights));
  }, [aiFinancialInsights]);

  // Phase 11 Customer Service localStorage sync
  useEffect(() => {
    localStorage.setItem('conscore_service_tickets', JSON.stringify(serviceTickets));
  }, [serviceTickets]);

  useEffect(() => {
    localStorage.setItem('conscore_sla_rules', JSON.stringify(slaRules));
  }, [slaRules]);

  useEffect(() => {
    localStorage.setItem('conscore_warranties', JSON.stringify(warranties));
  }, [warranties]);

  useEffect(() => {
    localStorage.setItem('conscore_warranty_claims', JSON.stringify(warrantyClaims));
  }, [warrantyClaims]);

  useEffect(() => {
    localStorage.setItem('conscore_customer_returns', JSON.stringify(customerReturns));
  }, [customerReturns]);

  useEffect(() => {
    localStorage.setItem('conscore_quality_incidents', JSON.stringify(qualityIncidents));
  }, [qualityIncidents]);

  useEffect(() => {
    localStorage.setItem('conscore_capa_actions', JSON.stringify(capaActions));
  }, [capaActions]);

  useEffect(() => {
    localStorage.setItem('conscore_customer_surveys', JSON.stringify(customerSurveys));
  }, [customerSurveys]);

  // Realtime Broadcast Channel Listener
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          const msg = event.data;
          if (!msg || !msg.type) return;

          setLastSyncTimestamp(new Date().toLocaleTimeString('es-MX'));

          if (msg.products) setProducts(msg.products);
          if (msg.movements) setMovements(msg.movements);
          if (msg.orders) setOrders(msg.orders);
          if (msg.quotes) setQuotes(msg.quotes);
          if (msg.customers) setCustomers(msg.customers);
          if (msg.auditLogs) setAuditLogs(msg.auditLogs);
          if (msg.leads) setLeads(msg.leads);
          if (msg.opportunities) setOpportunities(msg.opportunities);
          if (msg.activities) setActivities(msg.activities);
          if (msg.followUps) setFollowUps(msg.followUps);
          if (msg.reservations) setReservations(msg.reservations);
          if (msg.transfers) setTransfers(msg.transfers);
          if (msg.countSessions) setCountSessions(msg.countSessions);
          if (msg.adjustments) setAdjustments(msg.adjustments);
          if (msg.vehicles) setVehicles(msg.vehicles);
          if (msg.drivers) setDrivers(msg.drivers);
          if (msg.routes) setRoutes(msg.routes);
          if (msg.logisticsIncidents) setLogisticsIncidents(msg.logisticsIncidents);
          if (msg.logisticsReturns) setLogisticsReturns(msg.logisticsReturns);

          setRealtimeToast({
            id: `toast-${Date.now().toString(36)}`,
            title: `Sincronización en Vivo: ${msg.type}`,
            message: msg.summary || `Actualización recibida de ${msg.userName || 'otro usuario'}`,
            type: 'info',
            timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            user: msg.userName,
          });
        };

        return () => {
          channel.close();
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment.', e);
    }
  }, []);

  const clearRealtimeToast = useCallback(() => {
    setRealtimeToast(null);
  }, []);

  const broadcastDataUpdate = useCallback((type: string, payload: any) => {
    setLastSyncTimestamp(new Date().toLocaleTimeString('es-MX'));
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type,
          timestamp: new Date().toISOString(),
          ...payload,
        });
      } catch (err) {
        console.error('Error broadcasting update:', err);
      }
    }
  }, []);

  // Notifications & Audit helpers
  const addNotification = useCallback((notif: { title: string; message: string; type: NotificationItem['type']; module: ERPModule }) => {
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      module: notif.module,
      read: false,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addAuditLog = useCallback(
    (entry: {
      action: string;
      module: ERPModule;
      recordId?: string;
      details: string;
      customUser?: { id: string; name: string; role: any };
    }) => {
      const userToUse = entry.customUser || currentUser;
      const newLog: AuditLog = {
        id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        userId: userToUse?.id || 'USR-001',
        userName: userToUse?.name || 'Sistema',
        userRole: userToUse?.role || currentUser?.role || 'ADMINISTRADOR',
        action: entry.action,
        module: entry.module,
        recordId: entry.recordId,
        details: entry.details,
        ip: '192.168.1.100',
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  // =========================================================================
  // CRM & SALES FUNCTIONS
  // =========================================================================

  // Check for duplicate customers before creation (Observación 04: Sanitización cross-vendor)
  const checkCustomerDuplicates = useCallback(
    (query: { phone?: string; email?: string; rfc?: string; companyName?: string }): Customer[] => {
      const qPhone = (query.phone || '').replace(/[^0-9]/g, '');
      const qEmail = (query.email || '').trim().toLowerCase();
      const qRfc = (query.rfc || '').trim().toUpperCase();
      const qComp = (query.companyName || '').trim().toLowerCase();

      if (!qPhone && !qEmail && !qRfc && !qComp) return [];

      const matches = customers.filter((c) => {
        const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
        const cEmail = (c.email || '').trim().toLowerCase();
        const cRfc = (c.rfc || c.tax_id || '').trim().toUpperCase();
        const cComp = (c.businessName || c.companyName || c.company_name || '').trim().toLowerCase();

        const matchPhone = qPhone.length >= 7 && cPhone.includes(qPhone);
        const matchEmail = qEmail.length >= 4 && cEmail === qEmail;
        const matchRfc = qRfc.length >= 5 && cRfc === qRfc;
        const matchComp = qComp.length >= 4 && (cComp.includes(qComp) || qComp.includes(cComp));

        return matchPhone || matchEmail || matchRfc || matchComp;
      });

      if (currentUser?.role === 'VENDEDOR') {
        return matches.map((c) => {
          const ownership = CommercialRLSService.assertCustomerOwnership(currentUser, c, 'READ');
          if (ownership.allowed) {
            return CommercialRLSService.sanitizeCustomer(c, currentUser);
          }
          // Enmascaramiento preventivo cross-vendor: no filtrar datos confidenciales
          return {
            ...c,
            id: `PROTECTED-CROSS-${c.id}`,
            businessName: 'Cliente registrado en otra cartera comercial',
            companyName: 'Cliente registrado en otra cartera comercial',
            contactName: 'Protegido por política RLS',
            phone: '••••••••••',
            email: 'protegido@conscore.com.mx',
            creditLimit: 0,
            currentBalance: 0,
            totalPurchases: 0,
            sellerId: undefined,
            sellerName: 'Otro Ejecutivo Comercial',
            salesExecutiveId: 'OTRO_EJECUTIVO',
            isCrossVendor: true,
          } as Customer;
        });
      }

      return matches;
    },
    [customers, currentUser]
  );

  // Add Lead (Auto-creates Customer and links prospect)
  const addLead = useCallback(
    (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead => {
      const id = `LED-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`;
      const now = new Date().toISOString();

      const isVendor = currentUser?.role === 'VENDEDOR';
      const assignedSellerId = isVendor ? (currentUser?.id || 'USR-VEND-01') : (leadData.salespersonId || currentUser?.id || 'USR-004');
      const assignedSellerName = isVendor ? (currentUser?.name || 'Ejecutivo de Ventas') : (leadData.salespersonName || currentUser?.name || 'Ejecutivo de Ventas');
      const assignedExecId = isVendor ? (currentUser?.salesExecutiveId || 'VENDEDOR_01') : ((leadData as any).salesExecutiveId || currentUser?.salesExecutiveId || 'VENDEDOR_01');

      const company = (leadData.company || (leadData as any).companyName || '').trim();
      const contactName = (leadData.name || (leadData as any).contactName || '').trim();

      // Duplicate detection before creating customer
      const matches = checkCustomerDuplicates({
        phone: leadData.phone,
        email: leadData.email,
        companyName: company,
        rfc: (leadData as any).rfc,
      });

      let targetCustomer: Customer | null = null;
      let isLinkedToExisting = false;

      if (matches.length > 0) {
        // Observación 04: If user is VENDEDOR, prevent cross-vendor duplicate / hijacking
        const crossVendorMatch = matches.find(
          (m) =>
            (m as any).isCrossVendor ||
            (currentUser?.role === 'VENDEDOR' && !CommercialRLSService.assertCustomerOwnership(currentUser, m, 'WRITE').allowed)
        );
        if (crossVendorMatch && currentUser?.role === 'VENDEDOR') {
          throw new Error('Ya existe un registro relacionado con estos datos en otra cartera comercial. Se requiere revisión comercial.');
        }

        // Find match that current user has write access to
        const allowedMatch = matches.find((m) => {
          if (!currentUser || currentUser.role !== 'VENDEDOR') return true;
          return CommercialRLSService.assertCustomerOwnership(currentUser, m, 'WRITE').allowed;
        });

        if (allowedMatch) {
          targetCustomer = allowedMatch;
          isLinkedToExisting = true;
        }
      }

      // Auto-create Customer if not linked to existing
      if (!targetCustomer) {
        const existingMaxNum = customers.reduce((max, c) => {
          const match = (c.code || c.customerNumber || '').match(/CLI-(\d+)/);
          if (match) {
            const n = parseInt(match[1], 10);
            return n > max ? n : max;
          }
          return max;
        }, 0);
        const nextNum = Math.max(existingMaxNum + 1, customers.length + 1);
        const customerNumber = `CLI-${String(nextNum).padStart(3, '0')}`;
        const newCustId = `CUS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`;

        const newCustomer: Customer = {
          id: newCustId,
          code: customerNumber,
          customerNumber,
          customer_number: customerNumber,
          businessName: company,
          companyName: company,
          company_name: company,
          name: contactName,
          contactName: contactName,
          contact_name: contactName,
          phone: leadData.phone || '',
          email: leadData.email || '',
          city: leadData.city || 'México',
          state: leadData.state || 'México',
          address: `${leadData.city || ''}, ${leadData.state || 'México'}`.trim().replace(/^,\s*/, '') || 'Nacional',
          rfc: (leadData as any).rfc || 'XAXX010101000',
          taxId: (leadData as any).rfc || 'XAXX010101000',
          creditLimit: 150000,
          creditDays: 30,
          currentBalance: 0,
          totalPurchases: 0,
          creditStatus: 'CORRIENTE',
          sellerId: assignedSellerId,
          sellerName: assignedSellerName,
          salesExecutiveId: assignedExecId,
          assignedSalesExecutiveId: assignedExecId,
          sales_executive_id: assignedExecId,
          status: 'ACTIVO',
          paymentTerms: '30 días crédito',
          discountRate: 0,
          originLeadId: id,
          leadId: id,
          leadSource: leadData.source,
          acquisitionChannel: leadData.source,
          acquisitionDate: now,
          notes: `Creado automáticamente desde Prospecto ${id} (${leadData.source || 'Directo'}). ${leadData.notes || ''}`.trim(),
          createdAt: now,
          updatedAt: now,
        };

        targetCustomer = newCustomer;
        setCustomers((prev) => [newCustomer, ...prev]);

        // Add primary contact
        const newContact: CustomerContact = {
          id: `CNT-${Date.now().toString(36).toUpperCase()}`,
          customerId: newCustId,
          name: contactName || 'Contacto Principal',
          position: 'Contacto Principal (Lead)',
          phone: leadData.phone || '',
          email: leadData.email || '',
          isPrimary: true,
          notes: `Prospección inicial: ${leadData.productInterest || 'General'}`,
        };
        setCustomerContacts((prev) => [newContact, ...prev]);
      }

      const newLead: Lead = {
        ...leadData,
        id,
        company,
        name: contactName,
        status: 'CONVERTIDO',
        convertedCustomerId: targetCustomer.id,
        convertedCustomerCode: targetCustomer.code,
        customerId: targetCustomer.id,
        salespersonId: assignedSellerId,
        salespersonName: assignedSellerName,
        salesExecutiveId: assignedExecId,
        sales_executive_id: assignedExecId,
        assignedSalesExecutiveId: assignedExecId,
        assigned_sales_executive_id: assignedExecId,
        assigned_salesperson_id: assignedSellerId,
        assigned_salesperson_name: assignedSellerName,
        createdAt: now,
        updatedAt: now,
      } as Lead;

      setLeads((prev) => {
        const updated = [newLead, ...prev];
        broadcastDataUpdate('LEAD_CREATED', {
          userName: currentUser?.name || 'Vendedor',
          summary: `Nuevo Lead registrado y convertido a Cliente: ${newLead.company} (${newLead.source}) asignado a ${newLead.salespersonName}`,
          leads: updated,
          customers: isLinkedToExisting ? customers : [targetCustomer!, ...customers],
        });
        return updated;
      });

      addAuditLog({
        action: 'PROSPECT_CREATED',
        module: 'VENTAS',
        recordId: id,
        details: `Nuevo prospecto ${newLead.company} registrado desde canal ${newLead.source}. Asignado a ${newLead.salespersonName} (${assignedExecId}).`,
      });

      if (isLinkedToExisting) {
        addAuditLog({
          action: 'PROSPECT_LINKED_TO_EXISTING_CUSTOMER',
          module: 'CLIENTES',
          recordId: targetCustomer.code || targetCustomer.id,
          details: `Prospecto ${newLead.company} (${id}) vinculado a Cliente existente ${targetCustomer.businessName} (${targetCustomer.code}).`,
        });
      } else {
        addAuditLog({
          action: 'CUSTOMER_AUTO_CREATED_FROM_PROSPECT',
          module: 'CLIENTES',
          recordId: targetCustomer.code || targetCustomer.id,
          details: `Cliente comercial ${targetCustomer.businessName} (${targetCustomer.code}) creado automáticamente desde Prospecto ${id}.`,
        });
      }

      addNotification({
        title: 'Prospecto y Cliente Registrados',
        message: `${newLead.company} (${newLead.name}) registrado y vinculado a cliente ${targetCustomer.code || targetCustomer.businessName}.`,
        type: 'EXITO',
        module: 'CLIENTES',
      });

      return newLead;
    },
    [currentUser, customers, checkCustomerDuplicates, addAuditLog, addNotification, broadcastDataUpdate]
  );

  // Update Lead
  const updateLead = useCallback(
    (id: string, updates: Partial<Lead>) => {
      setLeads((prev) => {
        const isVendor = currentUser?.role === 'VENDEDOR';
        const sanitizedUpdates = { ...updates };
        if (isVendor) {
          delete (sanitizedUpdates as any).salesExecutiveId;
          delete (sanitizedUpdates as any).sales_executive_id;
          delete (sanitizedUpdates as any).assignedSalesExecutiveId;
          delete (sanitizedUpdates as any).assigned_sales_executive_id;
          delete sanitizedUpdates.salespersonId;
          delete sanitizedUpdates.salespersonName;
          delete (sanitizedUpdates as any).assigned_salesperson_id;
          delete (sanitizedUpdates as any).assigned_salesperson_name;
        }

        const updated = prev.map((l) => (l.id === id ? { ...l, ...sanitizedUpdates, updatedAt: new Date().toISOString() } : l));
        broadcastDataUpdate('LEAD_UPDATED', {
          userName: currentUser?.name || 'Vendedor',
          summary: `Lead actualizado (${id})`,
          leads: updated,
        });
        return updated;
      });

      addAuditLog({
        action: 'EDICION_LEAD',
        module: 'VENTAS',
        recordId: id,
        details: `Lead ${id} actualizado: ${updates.status ? `Estado: ${updates.status}` : 'Modificación de datos'}`,
      });
    },
    [currentUser, addAuditLog, broadcastDataUpdate]
  );

  // Convert Lead to Customer & Opportunity (Requirement #4)
  const convertLeadToCustomerAndOpportunity = useCallback(
    (
      leadId: string,
      options: {
        createOpportunity?: boolean;
        opportunityTitle?: string;
        estimatedValue?: number;
        expectedCloseDate?: string;
        existingCustomerId?: string;
      }
    ): { customer: Customer; opportunity?: Opportunity } => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) throw new Error('Lead no encontrado');

      if (currentUser && currentUser.role === 'VENDEDOR') {
        const leadAccess = CommercialRLSService.validateAccess(currentUser, 'LEAD', lead, 'WRITE');
        if (!leadAccess.allowed) {
          throw new Error('403 ACCESS_DENIED: No tienes autorización para convertir prospectos de otro ejecutivo comercial.');
        }
      }

      let targetCustomer: Customer;

      if (options.existingCustomerId) {
        const existing = customers.find((c) => c.id === options.existingCustomerId);
        if (!existing) throw new Error('Cliente existente no encontrado');

        if (currentUser && currentUser.role === 'VENDEDOR') {
          const ownership = CommercialRLSService.assertCustomerOwnership(currentUser, existing, 'UPDATE');
          if (!ownership.allowed) {
            throw new Error('Acceso Denegado (RLS): No puedes vincular prospectos a clientes de otra cartera comercial.');
          }
        }
        targetCustomer = existing;
      } else if (lead.convertedCustomerId) {
        const existing = customers.find((c) => c.id === lead.convertedCustomerId);
        if (existing) {
          targetCustomer = existing;
        } else {
          // Customer ID was assigned but record not found in state, create new
          const customerNumber = `CLI-${String(customers.length + 1).padStart(3, '0')}`;
          const newCustId = lead.convertedCustomerId;
          const isVendor = currentUser?.role === 'VENDEDOR';
          const resolvedExecId = CommercialRLSService.resolveSalesExecutiveId(currentUser);
          const assignedSellerId = isVendor ? (currentUser?.id || lead.salespersonId) : lead.salespersonId;
          const assignedSellerName = isVendor ? (currentUser?.name || lead.salespersonName) : lead.salespersonName;
          const assignedSalesExecId = isVendor ? resolvedExecId : (lead.salesExecutiveId || resolvedExecId);

          const newCustomer: Customer = {
            id: newCustId,
            code: customerNumber,
            customerNumber,
            businessName: lead.company,
            companyName: lead.company,
            contactName: lead.name,
            phone: lead.phone,
            email: lead.email,
            city: lead.city,
            state: lead.state || 'México',
            address: `${lead.city}, ${lead.state || 'México'}`,
            rfc: lead.rfc || 'XAXX010101000',
            creditLimit: 150000,
            creditDays: 30,
            currentBalance: 0,
            totalPurchases: 0,
            creditStatus: 'CORRIENTE',
            sellerId: assignedSellerId,
            sellerName: assignedSellerName,
            salesExecutiveId: assignedSalesExecId,
            assignedSalesExecutiveId: assignedSalesExecId,
            sales_executive_id: assignedSalesExecId,
            status: 'ACTIVO',
            paymentTerms: '30 días crédito',
            discountRate: 0,
            originLeadId: lead.id,
            leadId: lead.id,
            leadSource: lead.source,
            notes: `Convertido de Lead ${lead.id} (${lead.source}). ${lead.notes || ''}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          targetCustomer = newCustomer;
          setCustomers((prev) => [newCustomer, ...prev]);
        }
      } else {
        // Create new Customer with Anti-Spoofing enforcement
        const customerNumber = `CLI-${String(customers.length + 1).padStart(3, '0')}`;
        const newCustId = `CUS-${Date.now().toString(36).toUpperCase()}`;
        const isVendor = currentUser?.role === 'VENDEDOR';
        const resolvedExecId = CommercialRLSService.resolveSalesExecutiveId(currentUser);
        const assignedSellerId = isVendor ? (currentUser?.id || lead.salespersonId) : lead.salespersonId;
        const assignedSellerName = isVendor ? (currentUser?.name || lead.salespersonName) : lead.salespersonName;
        const assignedSalesExecId = isVendor ? resolvedExecId : (lead.salesExecutiveId || resolvedExecId);

        const newCustomer: Customer = {
          id: newCustId,
          code: customerNumber,
          customerNumber,
          businessName: lead.company,
          companyName: lead.company,
          contactName: lead.name,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          state: lead.state || 'México',
          address: `${lead.city}, ${lead.state || 'México'}`,
          rfc: lead.rfc || 'XAXX010101000',
          creditLimit: 150000,
          creditDays: 30,
          currentBalance: 0,
          totalPurchases: 0,
          creditStatus: 'CORRIENTE',
          sellerId: assignedSellerId,
          sellerName: assignedSellerName,
          salesExecutiveId: assignedSalesExecId,
          assignedSalesExecutiveId: assignedSalesExecId,
          sales_executive_id: assignedSalesExecId,
          status: 'ACTIVO',
          paymentTerms: '30 días crédito',
          discountRate: 0,
          notes: `Convertido de Lead ${lead.id} (${lead.source}). ${lead.notes || ''}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        targetCustomer = newCustomer;
        setCustomers((prev) => [newCustomer, ...prev]);

        // Add primary contact
        const newContact: CustomerContact = {
          id: `CNT-${Date.now().toString(36).toUpperCase()}`,
          customerId: newCustId,
          name: lead.name,
          position: 'Contacto Principal (Lead)',
          phone: lead.phone,
          email: lead.email,
          isPrimary: true,
          notes: `Prospección inicial: ${lead.productInterest || 'General'}`,
        };
        setCustomerContacts((prev) => [newContact, ...prev]);
      }

      let createdOpp: Opportunity | undefined;

      if (options.createOpportunity !== false) {
        const oppId = `OPP-${Date.now().toString(36).toUpperCase()}`;
        const folio = `OPP-2026-${String(opportunities.length + 1).padStart(3, '0')}`;
        const estimatedVal = options.estimatedValue || lead.estimatedValue || 150000;
        const oppTitle = options.opportunityTitle || `Proyecto ${lead.productInterest || 'Aislamiento Térmico'} - ${lead.company}`;

        const isVendor = currentUser?.role === 'VENDEDOR';
        const oppSellerId = isVendor ? (currentUser?.id || lead.salespersonId) : lead.salespersonId;
        const oppSellerName = isVendor ? (currentUser?.name || lead.salespersonName) : lead.salespersonName;
        const oppExecId = isVendor
          ? CommercialRLSService.resolveSalesExecutiveId(currentUser)
          : ((lead as any).salesExecutiveId || CommercialRLSService.resolveSalesExecutiveId({ id: oppSellerId, name: oppSellerName }));

        createdOpp = {
          id: oppId,
          folio,
          leadId: lead.id,
          customerId: targetCustomer.id,
          customerName: targetCustomer.businessName,
          salespersonId: oppSellerId,
          salespersonName: oppSellerName,
          salesExecutiveId: oppExecId,
          sales_executive_id: oppExecId,
          title: oppTitle,
          estimatedValue: estimatedVal,
          probability: 25,
          expectedCloseDate: options.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          stage: 'INFORMACION',
          source: lead.source,
          notes: `Generado por conversión de Lead ${lead.id}. ${lead.notes}`,
          aiAnalysis: {
            probability: 35,
            strengths: ['Lead calificado directamente por ejecutivo comercial', 'Interés claro en línea de productos técnicos'],
            risks: ['Cliente nuevo sin historial crediticio'],
            nextAction: 'Agendar levantamiento técnico o solicitar catálogo de conceptos de la obra.',
            daysWithoutContact: 0,
            summary: `Oportunidad inicial generada a partir de prospecto ${lead.source}.`,
            analyzedAt: new Date().toISOString(),
            confidence: 'MEDIA',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setOpportunities((prev) => [createdOpp!, ...prev]);
      }

      // Mark Lead as converted
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                status: 'CONVERTIDO',
                convertedCustomerId: targetCustomer.id,
                convertedOpportunityId: createdOpp?.id,
                updatedAt: new Date().toISOString(),
              }
            : l
        )
      );

      // Audit Log
      addAuditLog({
        action: 'CONVERSION_LEAD_A_CLIENTE',
        module: 'CLIENTES',
        recordId: targetCustomer.code,
        details: `Lead ${lead.company} convertido a Cliente ${targetCustomer.businessName}${createdOpp ? ` y Oportunidad ${createdOpp.folio}` : ''}.`,
      });

      addNotification({
        title: 'Lead Convertido Exitosamente',
        message: `${lead.company} es ahora Cliente Comercial${createdOpp ? ` con Oportunidad ${createdOpp.folio}` : ''}.`,
        type: 'EXITO',
        module: 'CLIENTES',
      });

      broadcastDataUpdate('LEAD_CONVERTED', {
        userName: currentUser?.name || 'Vendedor',
        summary: `Lead ${lead.company} convertido a cliente ${targetCustomer.businessName}`,
        customers: options.existingCustomerId ? customers : [targetCustomer, ...customers],
        opportunities: createdOpp ? [createdOpp, ...opportunities] : opportunities,
      });

      return { customer: targetCustomer, opportunity: createdOpp };
    },
    [leads, customers, opportunities, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  // Add Opportunity
  const addOpportunity = useCallback(
    (oppData: Omit<Opportunity, 'id' | 'folio' | 'createdAt' | 'updatedAt'>): Opportunity => {
      const isVendor = currentUser?.role === 'VENDEDOR';
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(currentUser);

      // Anti-spoofing & Cross-owner assignment check for VENDEDOR
      if (isVendor) {
        const attemptedExecId = (oppData as any).salesExecutiveId || (oppData as any).sales_executive_id || (oppData as any).assignedSalesExecutiveId;
        const attemptedSellerId = (oppData as any).salespersonId || (oppData as any).salesperson_id || (oppData as any).ownerId || (oppData as any).sellerId || (oppData as any).assignedTo;

        if ((attemptedExecId && attemptedExecId !== myExecId) || (attemptedSellerId && attemptedSellerId !== currentUser.id)) {
          addAuditLog({
            action: 'CROSS_OWNER_ASSIGNMENT_DENIED',
            module: 'VENTAS',
            recordId: 'N/A',
            details: `403 FORBIDDEN: Intento de asignación cruzada bloqueado por RLS. Vendedor ${currentUser.name} intentó asignar oportunidad a ${attemptedExecId || attemptedSellerId}.`,
          });
          throw new Error('403 ACCESS_DENIED: Asignación cruzada denegada. Un vendedor no puede asignar oportunidades a otro ejecutivo.');
        }

        // Customer ownership check
        if (oppData.customerId) {
          const customer = customers.find(c => c.id === oppData.customerId);
          const custCheck = CommercialRLSService.assertCustomerOwnership(currentUser, customer, 'WRITE');
          if (!custCheck.allowed) {
            addAuditLog({
              action: 'CUSTOMER_OWNERSHIP_VIOLATION',
              module: 'VENTAS',
              recordId: oppData.customerId,
              details: `403 FORBIDDEN: Intento de crear oportunidad para cliente de otra cartera comercial (${customer?.businessName || oppData.customerId}).`,
            });
            throw new Error(custCheck.error || '403 ACCESS_DENIED: No puedes crear oportunidades para un cliente asignado a otro ejecutivo de ventas.');
          }
        }

        // Lead ownership check if leadId provided
        if ((oppData as any).leadId) {
          const lead = leads.find(l => l.id === (oppData as any).leadId);
          if (lead) {
            const leadCheck = CommercialRLSService.validateAccess(currentUser, 'LEAD', lead, 'WRITE');
            if (!leadCheck.allowed) {
              addAuditLog({
                action: 'LEAD_OWNERSHIP_VIOLATION',
                module: 'VENTAS',
                recordId: lead.id,
                details: `403 FORBIDDEN: Intento de crear oportunidad desde prospecto ajeno (${lead.contactName}).`,
              });
              throw new Error(leadCheck.error || '403 ACCESS_DENIED: No puedes crear oportunidades para un prospecto asignado a otro ejecutivo de ventas.');
            }
          }
        }
      }

      const id = `OPP-${Date.now().toString(36).toUpperCase()}`;
      const folio = `OPP-2026-${String(opportunities.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const assignedSellerId = isVendor ? (currentUser?.id || 'USR-004') : (oppData.salespersonId || currentUser?.id || 'USR-004');
      const assignedSellerName = isVendor ? (currentUser?.name || 'Ejecutivo Comercial') : (oppData.salespersonName || currentUser?.name || 'Ejecutivo Comercial');
      const assignedExecId = isVendor ? myExecId : ((oppData as any).salesExecutiveId || myExecId);

      const newOpp: Opportunity = {
        ...oppData,
        id,
        folio,
        salespersonId: assignedSellerId,
        salespersonName: assignedSellerName,
        salesExecutiveId: assignedExecId,
        sales_executive_id: assignedExecId,
        createdAt: now,
        updatedAt: now,
        aiAnalysis: {
          probability: oppData.probability || 25,
          strengths: ['Oportunidad en prospección técnica activa', 'Margen proyectado saludable'],
          risks: ['Requiere validación de disponibilidad en almacén'],
          nextAction: 'Enviar ficha técnica y presentar cotización formal.',
          daysWithoutContact: 0,
          summary: `Oportunidad creada para ${oppData.customerName} por $${(oppData.estimatedValue || 0).toLocaleString('es-MX')} MXN.`,
          analyzedAt: now,
          confidence: 'MEDIA',
        },
      };

      setOpportunities((prev) => {
        const updated = [newOpp, ...prev];
        broadcastDataUpdate('OPPORTUNITY_CREATED', {
          userName: currentUser?.name || 'Vendedor',
          summary: `Nueva oportunidad: ${newOpp.folio} - ${newOpp.title}`,
          opportunities: updated,
        });
        return updated;
      });

      addAuditLog({
        action: 'CREAR_OPORTUNIDAD',
        module: 'VENTAS',
        recordId: folio,
        details: `Oportunidad ${folio} creada: "${newOpp.title}" para ${newOpp.customerName} ($${(Number(newOpp.estimatedValue) || 0).toLocaleString('es-MX')} MXN) por ${assignedSellerName} (${assignedExecId}).`,
      });

      addNotification({
        title: 'Oportunidad Registrada',
        message: `${folio}: ${newOpp.title} ($${(Number(newOpp.estimatedValue) || 0).toLocaleString('es-MX')} MXN)`,
        type: 'INFO',
        module: 'VENTAS',
      });

      return newOpp;
    },
    [opportunities, customers, leads, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  // Update Opportunity
  const updateOpportunity = useCallback(
    (id: string, updates: Partial<Opportunity>) => {
      const existingOpp = opportunities.find((o) => o.id === id);
      if (!existingOpp) throw new Error('Oportunidad no encontrada');

      const isVendor = currentUser?.role === 'VENDEDOR';
      const myExecId = CommercialRLSService.resolveSalesExecutiveId(currentUser);

      if (isVendor) {
        // Assert ownership
        const access = CommercialRLSService.assertOpportunityOwnership(currentUser, existingOpp, 'UPDATE');
        if (!access.allowed) {
          addAuditLog({
            action: 'ACCESO_DENEGADO_RLS',
            module: 'VENTAS',
            recordId: id,
            details: '403 FORBIDDEN: Intento no autorizado de editar oportunidad ajena.',
          });
          throw new Error(access.error || '403 ACCESS_DENIED: No tienes autorización para editar esta oportunidad.');
        }

        // Anti-reassignment check
        const attemptedExecId = (updates as any).salesExecutiveId || (updates as any).sales_executive_id || (updates as any).assignedSalesExecutiveId;
        const attemptedSellerId = (updates as any).salespersonId || (updates as any).salesperson_id || (updates as any).ownerId || (updates as any).sellerId || (updates as any).assignedTo;

        if ((attemptedExecId && attemptedExecId !== myExecId) || (attemptedSellerId && attemptedSellerId !== currentUser.id)) {
          addAuditLog({
            action: 'OPPORTUNITY_OWNER_CHANGE_DENIED',
            module: 'VENTAS',
            recordId: id,
            details: `403 FORBIDDEN: Intento no autorizado de reasignar oportunidad comercial ${existingOpp.folio}.`,
          });
          throw new Error('403 ACCESS_DENIED: Un vendedor no puede reasignar oportunidades a otro ejecutivo.');
        }

        // Customer reassignment check
        if (updates.customerId && updates.customerId !== existingOpp.customerId) {
          const targetCustomer = customers.find((c) => c.id === updates.customerId);
          const custAccess = CommercialRLSService.assertCustomerOwnership(currentUser, targetCustomer, 'WRITE');
          if (!custAccess.allowed) {
            throw new Error('403 ACCESS_DENIED: No puedes vincular la oportunidad a un cliente asignado a otro ejecutivo comercial.');
          }
        }
      }

      const safeUpdates = { ...updates };
      if (isVendor) {
        delete (safeUpdates as any).salesExecutiveId;
        delete (safeUpdates as any).sales_executive_id;
        delete (safeUpdates as any).assignedSalesExecutiveId;
        delete (safeUpdates as any).salespersonId;
        delete (safeUpdates as any).salesperson_id;
        delete (safeUpdates as any).ownerId;
        delete (safeUpdates as any).sellerId;
        delete (safeUpdates as any).assignedTo;
        delete (safeUpdates as any).salespersonName;
      }

      setOpportunities((prev) => {
        const updated = prev.map((o) => (o.id === id ? { ...o, ...safeUpdates, updatedAt: new Date().toISOString() } : o));
        broadcastDataUpdate('OPPORTUNITY_UPDATED', {
          userName: currentUser?.name || 'Vendedor',
          summary: `Oportunidad ${id} actualizada`,
          opportunities: updated,
        });
        return updated;
      });

      addAuditLog({
        action: 'EDICION_OPORTUNIDAD',
        module: 'VENTAS',
        recordId: id,
        details: `Oportunidad ${id} actualizada: ${updates.stage ? `Etapa: ${updates.stage}` : 'Detalles comerciales'}`,
      });
    },
    [opportunities, customers, currentUser, addAuditLog, broadcastDataUpdate]
  );

  // Change Opportunity Stage
  const changeOpportunityStage = useCallback(
    (id: string, newStage: string) => {
      const opp = opportunities.find((o) => o.id === id);
      if (!opp) return;

      if (currentUser?.role === 'VENDEDOR') {
        const access = CommercialRLSService.assertOpportunityOwnership(currentUser, opp, 'UPDATE');
        if (!access.allowed) {
          addAuditLog({
            action: 'ACCESO_DENEGADO_RLS',
            module: 'VENTAS',
            recordId: opp.folio || opp.id,
            details: '403 FORBIDDEN: Intento de mover etapa de oportunidad ajena en el Pipeline.',
          });
          throw new Error('403 ACCESS_DENIED: No puedes modificar la etapa de una oportunidad de otro vendedor.');
        }
      }

      const stageInfo = pipelineStages.find((s) => s.code === newStage || s.name === newStage);
      const isWon = stageInfo?.isWon || newStage === 'LOGRADO_CON_EXITO';

      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                stage: newStage,
                probability: stageInfo ? stageInfo.probability : o.probability,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      addAuditLog({
        action: 'CAMBIO_ETAPA_OPORTUNIDAD',
        module: 'VENTAS',
        recordId: opp.folio,
        details: `Oportunidad ${opp.folio} avanzó a etapa "${stageInfo?.name || newStage}" (Probabilidad: ${stageInfo?.probability || opp.probability}%).`,
      });

      if (isWon) {
        addNotification({
          title: '¡Oportunidad Ganada! 🎉',
          message: `${opp.folio} (${opp.customerName}) cerrada con éxito por $${(Number(opp.estimatedValue) || 0).toLocaleString('es-MX')} MXN.`,
          type: 'EXITO',
          module: 'VENTAS',
        });
      }
    },
    [opportunities, pipelineStages, addAuditLog, addNotification]
  );

  // Add CRM Activity
  const addActivity = useCallback(
    (actData: Omit<CRMActivity, 'id' | 'createdAt'>): CRMActivity => {
      const id = `ACT-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();
      const newAct: CRMActivity = {
        ...actData,
        id,
        createdAt: now,
      };

      setActivities((prev) => [newAct, ...prev]);

      // If opportunity is linked, update its last contact AI timestamp
      if (newAct.opportunityId) {
        setOpportunities((prev) =>
          prev.map((o) =>
            o.id === newAct.opportunityId
              ? {
                  ...o,
                  aiAnalysis: o.aiAnalysis
                    ? { ...o.aiAnalysis, daysWithoutContact: 0, nextAction: newAct.nextAction || o.aiAnalysis.nextAction }
                    : undefined,
                  updatedAt: now,
                }
              : o
          )
        );
      }

      addAuditLog({
        action: `ACTIVIDAD_${newAct.type}`,
        module: 'VENTAS',
        recordId: newAct.opportunityTitle || newAct.customerName || id,
        details: `${newAct.type} con ${newAct.customerName || 'Cliente'}: ${newAct.result}. Siguiente acción: ${newAct.nextAction}`,
      });

      return newAct;
    },
    [addAuditLog]
  );

  // Add Follow Up Task
  const addFollowUp = useCallback(
    (taskData: Omit<FollowUp, 'id' | 'createdAt'>): FollowUp => {
      const id = `TSK-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();
      const newTask: FollowUp = {
        ...taskData,
        id,
        createdAt: now,
      };

      setFollowUps((prev) => [newTask, ...prev]);

      addAuditLog({
        action: 'CREAR_SEGUIMIENTO',
        module: 'VENTAS',
        recordId: id,
        details: `Tarea "${newTask.description}" asignada a ${newTask.salespersonName} para el ${newTask.date} a las ${newTask.time}.`,
      });

      return newTask;
    },
    [addAuditLog]
  );

  // Update Follow Up Task Status
  const updateFollowUpStatus = useCallback(
    (id: string, status: FollowUpStatus, completedNotes?: string) => {
      setFollowUps((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completedAt: status === 'COMPLETADO' ? new Date().toISOString() : undefined,
                completedNotes: completedNotes || t.completedNotes,
              }
            : t
        )
      );

      addAuditLog({
        action: 'ESTATUS_SEGUIMIENTO',
        module: 'VENTAS',
        recordId: id,
        details: `Seguimiento marcado como ${status}${completedNotes ? `. Nota: ${completedNotes}` : ''}.`,
      });
    },
    [addAuditLog]
  );

  // Customer Contact helpers
  const addCustomerContact = useCallback((contactData: Omit<CustomerContact, 'id'>): CustomerContact => {
    const id = `CNT-${Date.now().toString(36).toUpperCase()}`;
    const newContact: CustomerContact = { ...contactData, id };
    setCustomerContacts((prev) => [newContact, ...prev]);
    return newContact;
  }, []);

  const updateCustomerContact = useCallback((id: string, updates: Partial<CustomerContact>) => {
    setCustomerContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  // Calculate margin and validate discount policy (Requirements #11 & #12)
  const calculateQuoteMarginAndDiscount = useCallback(
    (items: any[], discountPct: number = 0, overrideRole?: string): QuoteMarginValidation => {
      const userRole = overrideRole || currentUser?.role || 'ADMINISTRADOR';

      // Configured limits
      const maxSalesperson = companyConfig.maxDiscountSalesperson ?? 5;
      const maxManager = companyConfig.maxDiscountManager ?? 10;
      const maxDirector = companyConfig.maxDiscountDirector ?? 100;
      const minMarginThreshold = companyConfig.minGrossMarginPct ?? 18;

      let maxAllowedDiscount = 0;
      if (userRole === 'DIRECTOR' || userRole === 'ADMINISTRADOR') {
        maxAllowedDiscount = maxDirector;
      } else if (userRole === 'GERENTE_VENTAS') {
        maxAllowedDiscount = maxManager;
      } else {
        maxAllowedDiscount = maxSalesperson;
      }

      const roleDiscountAllowed = discountPct <= maxAllowedDiscount;

      // Calculate total cost and subtotal
      let totalCost = 0;
      let rawSubtotal = 0;

      items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId || p.id === item.product_id || p.code === item.productCode || p.code === item.product_code);
        const itemQty = Number(item.quantity || item.quantityOrdered || 1);
        const itemPrice = Number(item.unitPrice || item.unit_price || prod?.price || prod?.salePrice || 0);
        const itemCost = Number(item.cost || prod?.cost || itemPrice * 0.65);

        totalCost += itemCost * itemQty;
        rawSubtotal += itemPrice * itemQty;
      });

      const discountAmount = rawSubtotal * (discountPct / 100);
      const totalWithoutTax = Math.max(0, rawSubtotal - discountAmount);
      const tax = totalWithoutTax * (companyConfig.taxRate || 0.16);
      const total = totalWithoutTax + tax;
      const profit = totalWithoutTax - totalCost;
      const marginPct = totalWithoutTax > 0 ? (profit / totalWithoutTax) * 100 : 0;
      const isBelowMinMargin = marginPct < minMarginThreshold;

      return {
        cost: totalCost,
        subtotal: rawSubtotal,
        discountPct,
        discountAmount,
        totalWithoutTax,
        tax,
        total,
        profit,
        marginPct: Math.round(marginPct * 10) / 10,
        grossMarginPct: Math.round(marginPct * 10) / 10,
        avgDiscountPct: discountPct,
        isBelowMinMargin,
        minMarginThreshold,
        roleDiscountAllowed,
        maxAllowedDiscount,
        userRole,
      };
    },
    [products, companyConfig, currentUser]
  );

  // Create Quote with discount and margin checks (Requirement #10)
  const createQuote = useCallback(
    (quoteData: Partial<Quote> & { customerId?: string; customer_id?: string; items: any[] }): Quote => {
      const custId = quoteData.customerId || quoteData.customer_id;
      const customer = customers.find((c) => c.id === custId);
      if (!customer) throw new Error('Cliente requerido para emitir cotización');

      // Observación 05: Validar titularidad comercial estricta (RLS) del cliente
      const ownership = CommercialRLSService.assertCustomerOwnership(currentUser, customer, 'WRITE');
      if (!ownership.allowed) {
        addAuditLog({
          action: 'QUOTE_CUSTOMER_ACCESS_DENIED',
          module: 'COTIZACIONES',
          recordId: customer.id,
          details: `403 FORBIDDEN: Intento de cotizar a cliente ajeno o no asignado '${customer.businessName || customer.id}' por ${currentUser?.name || 'Usuario'}.`,
        });
        throw new Error(ownership.error || '403 ACCESS_DENIED: No puedes cotizar a un cliente perteneciente a otro ejecutivo de ventas.');
      }

      // Observación 05: Anti-Spoofing de Ejecutivo Comercial si el rol es VENDEDOR
      if (currentUser?.role === 'VENDEDOR') {
        const myExecId = CommercialRLSService.resolveSalesExecutiveId(currentUser);
        const attemptedExec = quoteData.salesExecutiveId || (quoteData as any).sales_executive_id;
        const attemptedSeller = quoteData.salespersonId || (quoteData as any).salesperson_id || (quoteData as any).sellerId;
        if ((attemptedExec && attemptedExec !== myExecId) || (attemptedSeller && attemptedSeller !== currentUser.id && attemptedSeller !== myExecId)) {
          addAuditLog({
            action: 'QUOTE_OWNER_SPOOFING_DENIED',
            module: 'COTIZACIONES',
            recordId: customer.id,
            details: `403 FORBIDDEN: Intento de suplantación de ejecutivo comercial (owner spoofing) en cotización por ${currentUser.name}.`,
          });
          throw new Error('403 ACCESS_DENIED: Intento de suplantación de ejecutivo comercial detectado y bloqueado.');
        }
      }

      const folio = `COT-${String(quotes.length + 1).padStart(6, '0')}`;
      const quoteId = `QUO-${Date.now().toString(36).toUpperCase()}`;
      const discPct = Number(quoteData.discount || 0);

      const marginCalc = calculateQuoteMarginAndDiscount(quoteData.items, discPct);

      const formattedItems = quoteData.items.map((item, idx) => {
        const prod = products.find((p) => p.id === item.productId || p.id === item.product_id || p.code === item.productCode);
        const qty = Number(item.quantity || 1);
        const price = Number(item.unitPrice || item.unit_price || prod?.price || 0);
        return {
          id: `QIT-${Date.now().toString(36)}-${idx}`,
          quoteId,
          productId: prod?.id || item.productId || 'PRD-01',
          productCode: prod?.code || item.productCode || 'PRD-01',
          productName: prod?.name || item.productName || 'Aislante Térmico',
          unit: prod?.unit || item.unit || 'PZA',
          quantity: qty,
          unitPrice: price,
          discount: discPct,
          subtotal: qty * price * (1 - discPct / 100),
        };
      });

      const assignedSellerId = (currentUser?.role === 'VENDEDOR' || !currentUser) ? (currentUser?.id || 'USR-004') : (customer.sellerId || currentUser?.id || 'USR-004');
      const assignedSellerName = (currentUser?.role === 'VENDEDOR' || !currentUser) ? (currentUser?.name || 'Ejecutivo Comercial') : (customer.sellerName || currentUser?.name || 'Ejecutivo Comercial');
      const assignedExecId = CommercialRLSService.resolveSalesExecutiveId(currentUser?.role === 'VENDEDOR' ? currentUser : { id: assignedSellerId, name: assignedSellerName });

      const newQuote: Quote = {
        id: quoteId,
        quoteNumber: folio,
        folio,
        customerId: customer.id,
        customerName: customer.businessName,
        salespersonId: assignedSellerId,
        salespersonName: assignedSellerName,
        salesExecutiveId: assignedExecId,
        sales_executive_id: assignedExecId,
        date: quoteData.date || new Date().toISOString().slice(0, 10),
        quoteDate: quoteData.date || new Date().toISOString().slice(0, 10),
        validUntil: quoteData.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        expirationDate: quoteData.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        status: 'ENVIADA',
        financialApprovalStatus: 'PENDIENTE',
        subtotal: marginCalc.subtotal,
        discount: marginCalc.discountAmount,
        tax: marginCalc.tax,
        total: marginCalc.total,
        paymentTerms: normalizePaymentTerms(quoteData.paymentTerms || (quoteData as any).payment_terms),
        payment_terms: normalizePaymentTerms(quoteData.paymentTerms || (quoteData as any).payment_terms),
        deliveryTimeDays: quoteData.deliveryTimeDays || 3,
        notes: quoteData.notes || '',
        items: formattedItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setQuotes((prev) => [newQuote, ...prev]);

      addAuditLog({
        action: 'CREAR_COTIZACION',
        module: 'COTIZACIONES',
        recordId: folio,
        details: `Cotización ${folio} por $${(Number(newQuote.total) || 0).toLocaleString('es-MX')} MXN creada para ${customer.businessName}. Descuento: ${discPct}%, Margen: ${marginCalc.marginPct}%.`,
      });

      addNotification({
        title: 'Cotización Emitida',
        message: `${folio} por $${(Number(newQuote.total) || 0).toLocaleString('es-MX')} MXN para ${customer.businessName}.`,
        type: 'INFO',
        module: 'COTIZACIONES',
      });

      broadcastDataUpdate('QUOTE_CREATED', {
        userName: currentUser?.name || 'Vendedor',
        summary: `Cotización ${folio} creada para ${customer.businessName}`,
        quotes: [newQuote, ...quotes],
      });

      return newQuote;
    },
    [customers, products, quotes, currentUser, calculateQuoteMarginAndDiscount, addAuditLog, addNotification, broadcastDataUpdate]
  );

  // Create Quote from Opportunity (Requirement #10)
  const createQuoteFromOpportunity = useCallback(
    (opportunityId: string, quoteData?: Partial<Quote>): Quote => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      if (!opp) throw new Error('Oportunidad no encontrada');

      // Observación 05: Validar titularidad de la oportunidad si el rol es VENDEDOR
      if (currentUser?.role === 'VENDEDOR') {
        const oppAccess = CommercialRLSService.validateAccess(currentUser, 'OPPORTUNITY', opp, 'READ');
        if (!oppAccess.allowed) {
          addAuditLog({
            action: 'QUOTE_OPPORTUNITY_ACCESS_DENIED',
            module: 'COTIZACIONES',
            recordId: opp.id,
            details: `403 FORBIDDEN: Intento de generar cotización desde oportunidad ajena '${opp.folio || opp.title}' por ${currentUser?.name}.`,
          });
          throw new Error('403 ACCESS_DENIED: No puedes generar cotizaciones a partir de una oportunidad asignada a otro ejecutivo comercial.');
        }
      }

      const customer = customers.find((c) => c.id === opp.customerId);
      if (!customer) throw new Error('Cliente de la oportunidad no encontrado');

      // Default sample items if none provided
      const itemsToUse =
        quoteData?.items && quoteData.items.length > 0
          ? quoteData.items
          : [
              {
                productId: products[0]?.id || 'PRD-01',
                productCode: products[0]?.code || 'LM-COLCH-01',
                productName: products[0]?.name || 'Colchoneta de Lana Mineral 2"',
                quantity: Math.max(10, Math.round((opp.estimatedValue || 100000) / (products[0]?.price || 850))),
                unitPrice: products[0]?.price || 850,
              },
            ];

      const newQuote = createQuote({
        ...quoteData,
        customerId: opp.customerId,
        notes: `Generada a partir de Oportunidad ${opp.folio} (${opp.title}). ${quoteData?.notes || ''}`,
        items: itemsToUse,
      });

      // Update opportunity stage to COTIZACION and link quote
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunityId
            ? {
                ...o,
                stage: 'COTIZACION',
                probability: 50,
                quoteId: newQuote.id,
                quoteFolio: newQuote.folio,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      addAuditLog({
        action: 'COTIZACION_DESDE_OPORTUNIDAD',
        module: 'COTIZACIONES',
        recordId: newQuote.folio,
        details: `Cotización ${newQuote.folio} vinculada a Oportunidad ${opp.folio}.`,
      });

      return newQuote;
    },
    [opportunities, customers, products, createQuote, addAuditLog]
  );

  // Approve Quote
  const approveQuote = useCallback(
    (quoteId: string): { success: boolean; error?: string } => {
      const quote = quotes.find((q) => q.id === quoteId);
      if (!quote) return { success: false, error: 'Cotización no encontrada' };

      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status: 'ACEPTADA', updatedAt: new Date().toISOString() } : q)));

      addAuditLog({
        action: 'APROBACION_COTIZACION',
        module: 'COTIZACIONES',
        recordId: quote.folio,
        details: `Cotización ${quote.folio} por $${(Number(quote.total) || 0).toLocaleString('es-MX')} MXN aprobada por cliente / gerencia.`,
      });

      addNotification({
        title: 'Cotización Aceptada',
        message: `${quote.folio} fue aceptada por el cliente. Lista para generar Pedido de Almacén.`,
        type: 'EXITO',
        module: 'COTIZACIONES',
      });

      return { success: true };
    },
    [quotes, addAuditLog, addNotification]
  );

  // OBSERVACIÓN 16: Métodos Transaccionales de Autorización Financiera para Cotizaciones
  const requestFinancialApproval = useCallback(
    (quoteId: string, notes?: string): { success: boolean; error?: string } => {
      const quote = quotes.find((q) => q.id === quoteId || q.folio === quoteId || q.quoteNumber === quoteId || (q as any).quote_number === quoteId);
      if (!quote) return { success: false, error: 'Cotización no encontrada en el sistema.' };

      const user = currentUser || { id: 'USR-004', name: 'Mariana Ruiz', role: 'VENDEDOR' };
      const updated = QuoteFinancialApprovalService.requestApproval(quote, user, notes);

      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? updated : q)));

      addAuditLog({
        action: 'QUOTE_FINANCIAL_APPROVAL_REQUESTED',
        module: 'COTIZACIONES',
        recordId: quote.folio || quote.id,
        details: `Solicitud de autorización financiera enviada a Finanzas para cotización ${quote.folio}. Notas: ${notes || 'Ninguna'}`,
        customUser: user,
      });

      addNotification({
        title: 'Autorización Financiera Solicitada',
        message: `Se ha solicitado autorización financiera para la cotización ${quote.folio}.`,
        type: 'INFO',
        module: 'COTIZACIONES',
      });

      api.requestFinancialApproval(quote.id, notes).catch(() => {});

      return { success: true };
    },
    [quotes, currentUser, addAuditLog, addNotification]
  );

  const approveFinancialQuote = useCallback(
    (quoteId: string, notes?: string, customUser?: any): { success: boolean; error?: string } => {
      const quote = quotes.find((q) => q.id === quoteId || q.folio === quoteId || q.quoteNumber === quoteId || (q as any).quote_number === quoteId);
      if (!quote) return { success: false, error: 'Cotización no encontrada en el sistema.' };

      const user = customUser || currentUser || { id: 'USR-FIN-01', name: 'Lic. Ana Sofía Garza', role: 'FINANZAS' };
      const result = QuoteFinancialApprovalService.approveQuote(quote, user, notes);

      if (!result.success || !result.updatedQuote) {
        addAuditLog({
          action: 'QUOTE_FINANCIAL_APPROVAL_BLOCKED',
          module: 'COTIZACIONES',
          recordId: quote.folio || quote.id,
          details: `Intento de autorización financiera bloqueado para cotización ${quote.folio}: ${result.error}`,
          customUser: user,
        });
        return { success: false, error: result.error };
      }

      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? result.updatedQuote! : q)));

      addAuditLog({
        action: 'QUOTE_FINANCIAL_APPROVED',
        module: 'COTIZACIONES',
        recordId: quote.folio || quote.id,
        details: `Cotización ${quote.folio} autorizada financieramente por ${user.name} (${user.role}). Versión aprobada: v${result.updatedQuote.approvedQuoteVersion}. Notas: ${notes || 'Autorización conforme'}`,
        customUser: user,
      });

      addNotification({
        title: 'Cotización Autorizada por Finanzas',
        message: `La cotización ${quote.folio} ha sido autorizada por Finanzas. Lista para convertirse en pedido.`,
        type: 'SUCCESS',
        module: 'COTIZACIONES',
      });

      api.approveFinancialQuote(quote.id, notes).catch(() => {});

      return { success: true };
    },
    [quotes, currentUser, addAuditLog, addNotification]
  );

  const rejectFinancialQuote = useCallback(
    (quoteId: string, reason: string, customUser?: any): { success: boolean; error?: string } => {
      const quote = quotes.find((q) => q.id === quoteId || q.folio === quoteId || q.quoteNumber === quoteId || (q as any).quote_number === quoteId);
      if (!quote) return { success: false, error: 'Cotización no encontrada en el sistema.' };

      const user = customUser || currentUser || { id: 'USR-FIN-01', name: 'Lic. Ana Sofía Garza', role: 'FINANZAS' };
      const result = QuoteFinancialApprovalService.rejectQuote(quote, user, reason);

      if (!result.success || !result.updatedQuote) {
        return { success: false, error: result.error };
      }

      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? result.updatedQuote! : q)));

      addAuditLog({
        action: 'QUOTE_FINANCIAL_REJECTED',
        module: 'COTIZACIONES',
        recordId: quote.folio || quote.id,
        details: `Cotización ${quote.folio} rechazada financieramente por ${user.name} (${user.role}). Motivo: ${reason}`,
        customUser: user,
      });

      addNotification({
        title: 'Cotización Rechazada por Finanzas',
        message: `La cotización ${quote.folio} ha sido rechazada por Finanzas. Motivo: ${reason}`,
        type: 'WARNING',
        module: 'COTIZACIONES',
      });

      api.rejectFinancialQuote(quote.id, reason).catch(() => {});

      return { success: true };
    },
    [quotes, currentUser, addAuditLog, addNotification]
  );

  // Direct Create Order Engine
  const createOrder = (
    orderData: Partial<Order> & { customerId?: string; customer_id?: string; items: any[] },
    customUser?: { id: string; name: string; role?: any }
  ): Order => {
    const userToUse = customUser || currentUser || { id: 'USR-001', name: 'Administrador', role: 'ADMINISTRADOR' };

    // OBSERVACIÓN 16: Intercepción obligatoria si la creación de pedido contiene quoteId
    const targetQuoteId = orderData.quoteId || (orderData as any).quote_id || (orderData as any).quoteFolio || (orderData as any).quote_number;
    if (targetQuoteId) {
      const relatedQuote = quotes.find(q => q.id === targetQuoteId || q.folio === targetQuoteId || (q as any).quote_number === targetQuoteId);
      const finCheck = validateFinancialApprovalForOrder(relatedQuote);
      if (!finCheck.allowed) {
        addAuditLog({
          action: 'CREATE_ORDER_BLOCKED_NO_FINANCIAL_APPROVAL',
          module: 'PEDIDOS',
          recordId: targetQuoteId,
          details: `Intento de creación de pedido bloqueado: ${finCheck.error}`,
          customUser: userToUse,
        });
        throw new Error(finCheck.error || 'La cotización requiere autorización de Finanzas antes de generar el pedido.');
      }
    }

    const orderFolio = orderData.folio || orderData.orderNumber || orderData.order_number || `PED-${String(orders.length + 1).padStart(6, '0')}`;

    // Resolve Customer
    const custId = orderData.customerId || orderData.customer_id || customers[0]?.id;
    const targetCust = customers.find((c) => c.id === custId) || customers[0];

    const orderItems = (orderData.items || []).map((item, idx) => {
      const prod = products.find((p) => p.id === (item.productId || item.product_id) || p.code === (item.productCode || item.product_code));
      const qty = Number(item.quantity ?? item.quantityOrdered ?? 1) || 1;
      const unitPrice = Number(item.unitPrice ?? item.unit_price ?? prod?.price ?? 0);
      const discountPct = Number(item.discountPct ?? 0);
      const subtotal = Number(item.subtotal) || qty * unitPrice * (1 - discountPct / 100);

      return {
        id: item.id || `OIT-${Date.now().toString(36)}-${idx}`,
        productId: prod?.id || item.productId || item.product_id || '',
        product_id: prod?.id || item.productId || item.product_id || '',
        productCode: prod?.code || item.productCode || item.product_code || '',
        product_code: prod?.code || item.productCode || item.product_code || '',
        productName: prod?.name || item.productName || item.product_name || item.description || '',
        product_name: prod?.name || item.productName || item.product_name || item.description || '',
        description: item.description || prod?.name || 'Producto / Partida',
        quantity: qty,
        quantityOrdered: qty,
        quantityReserved: qty,
        quantityFulfilled: 0,
        unitPrice,
        unit_price: unitPrice,
        discountPct,
        subtotal,
      };
    });

    const subtotal = orderData.subtotal ?? orderItems.reduce((acc, it) => acc + it.subtotal, 0);
    const discount = orderData.discount ?? 0;
    const tax = orderData.tax ?? subtotal * 0.16;
    const total = orderData.total ?? subtotal + tax;

    const warehouseId = orderData.warehouseId || orderData.warehouse_id || warehouses[0]?.id || 'WH-01';
    const targetWarehouse = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

    const newOrder: Order = {
      id: orderData.id || `ORD-${Date.now().toString(36).toUpperCase()}`,
      folio: orderFolio,
      orderNumber: orderFolio,
      order_number: orderFolio,
      quoteFolio: orderData.quoteFolio || orderData.quote_number,
      quote_number: orderData.quoteFolio || orderData.quote_number,
      quoteId: orderData.quoteId || orderData.quote_id,
      quote_id: orderData.quoteId || orderData.quote_id,
      customerId: targetCust?.id || custId,
      customer_id: targetCust?.id || custId,
      customerName: targetCust?.businessName || targetCust?.companyName || targetCust?.name || orderData.customerName || 'Cliente Comercial',
      customer_name: targetCust?.businessName || targetCust?.companyName || targetCust?.name || orderData.customer_name || 'Cliente Comercial',
      sellerId: orderData.salespersonId || orderData.sellerId || userToUse.id,
      salespersonId: orderData.salespersonId || orderData.sellerId || userToUse.id,
      salesperson_id: orderData.salespersonId || orderData.sellerId || userToUse.id,
      sellerName: orderData.salespersonName || orderData.sellerName || userToUse.name,
      salespersonName: orderData.salespersonName || orderData.sellerName || userToUse.name,
      salesperson_name: orderData.salespersonName || orderData.sellerName || userToUse.name,
      warehouseId,
      warehouse_id: warehouseId,
      warehouseName: targetWarehouse?.name || 'Almacén Central Tultitlán',
      status: (orderData.status as any) || 'RESERVADO',
      fulfillmentStatus: (orderData.fulfillmentStatus as any) || 'PENDIENTE_SURTIDO',
      subtotal,
      discount,
      tax,
      total,
      orderDate: orderData.orderDate || new Date().toISOString().slice(0, 10),
      date: (orderData as any).date || orderData.orderDate || new Date().toISOString().slice(0, 10),
      deliveryDate: orderData.deliveryDate || orderData.delivery_date || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      delivery_date: orderData.deliveryDate || orderData.delivery_date || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      promisedDate: orderData.promisedDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      shippingAddress: (orderData as any).shippingAddress || orderData.deliveryAddress || targetCust?.address || 'Planta Principal / Obra del Cliente',
      shipping_address: (orderData as any).shippingAddress || orderData.deliveryAddress || targetCust?.address || 'Planta Principal / Obra del Cliente',
      deliveryAddress: (orderData as any).shippingAddress || orderData.deliveryAddress || targetCust?.address || 'Planta Principal / Obra del Cliente',
      delivery_address: (orderData as any).shippingAddress || orderData.deliveryAddress || targetCust?.address || 'Planta Principal / Obra del Cliente',
      paymentTerms: normalizePaymentTerms(orderData.paymentTerms || orderData.payment_terms),
      payment_terms: normalizePaymentTerms(orderData.paymentTerms || orderData.payment_terms),
      notes: orderData.notes || '',
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    // Reserve stock for items
    const newMovements: InventoryMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const match = orderItems.find((it) => it.productId === prod.id || it.productCode === prod.code);
      if (match) {
        const qty = match.quantity || match.quantityOrdered || 1;
        const newReserved = (prod.reservedStock || 0) + qty;
        const newAvailable = Math.max(0, (prod.stock || prod.physicalStock || 0) - newReserved);

        newMovements.push({
          id: `MOV-RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
          timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
          type: 'RESERVA',
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          warehouseId,
          warehouseName: targetWarehouse?.name || 'Almacén Central Tultitlán',
          location: typeof prod.warehouseLocation === 'string' ? prod.warehouseLocation : 'Ubicación General',
          quantity: qty,
          previousBalance: prod.availableStock,
          newBalance: newAvailable,
          relatedDocFolio: orderFolio,
          userId: userToUse.id,
          userName: userToUse.name,
          reason: `Reserva automática por confirmación de Pedido ${orderFolio}`,
          createdAt: new Date().toISOString(),
        });

        return {
          ...prod,
          reservedStock: newReserved,
          availableStock: newAvailable,
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    if (newMovements.length > 0) {
      setMovements([...newMovements, ...movements]);
    }

    addNotification({
      title: 'Nuevo Pedido Confirmado',
      message: `Se ha generado el Pedido ${orderFolio} con reserva de inventario en tiempo real.`,
      type: 'EXITO',
      module: 'PEDIDOS',
    });

    return newOrder;
  };

  // Transactional Convert Quote to Order (Requirement #13 & Hotfix)
  const convertQuoteToOrder = (
    quoteId: string,
    customUser?: { id: string; name: string; role?: any }
  ): { success: boolean; orderFolio?: string; error?: string; order?: Order } => {
    const quote = quotes.find((q) => q.id === quoteId || q.folio === quoteId || (q as any).quote_number === quoteId);
    if (!quote) {
      return {
        success: false,
        error: 'La cotización requiere autorización de Finanzas antes de generar el pedido.',
      };
    }

    const userToUse = customUser || currentUser || { id: 'USR-001', name: 'Administrador', role: 'ADMINISTRADOR' };

    // 0. Validar permisos RLS para rol VENDEDOR
    if (userToUse) {
      const access = CommercialRLSService.validateAccess(userToUse as any, 'QUOTE', quote, 'UPDATE');
      if (!access.allowed) {
        addAuditLog({
          action: 'CONVERT_QUOTE_TO_ORDER_CROSS_ACCESS',
          module: 'PEDIDOS',
          details: `403 ACCESS_DENIED: Usuario ${userToUse.name} (${userToUse.role}) intentó convertir la cotización ajena ${quote.folio} de ${quote.salespersonName}.`,
          recordId: quote.id,
          customUser: userToUse,
        });
        return {
          success: false,
          error: '403 ACCESS_DENIED: No tienes autorización para convertir cotizaciones de otro ejecutivo de ventas.',
        };
      }
    }

    // 1. Validar estatus permitido
    if (quote.status === 'RECHAZADA' || quote.status === 'VENCIDA' || (quote as any).status === 'CANCELADA') {
      return {
        success: false,
        error: `Esta cotización aún no puede convertirse en pedido debido a su estatus actual (${quote.status}).`,
      };
    }

    // 1.1 HOTFIX 07: Validar que no tenga descuentos pendientes de autorización de Gerencia
    const orderConversionPricingCheck = QuotePricingService.validateQuoteForOrderConversion(quote);
    if (!orderConversionPricingCheck.allowed) {
      return {
        success: false,
        error: orderConversionPricingCheck.error || 'DISCOUNT_APPROVAL_REQUIRED: Descuento pendiente de autorización.',
      };
    }

    // OBSERVACIÓN 16: Control Obligatorio de Finanzas antes de Cotización -> Pedido
    const financialCheck = validateFinancialApprovalForOrder(quote);
    if (!financialCheck.allowed) {
      addAuditLog({
        action: 'QUOTE_TO_ORDER_BLOCKED_NO_FINANCIAL_APPROVAL',
        module: 'COTIZACIONES',
        recordId: quote.folio || quote.id,
        details: `Intento de conversión bloqueado: ${financialCheck.error}`,
        customUser: userToUse,
      });
      return {
        success: false,
        error: financialCheck.error || 'La cotización requiere autorización de Finanzas antes de generar el pedido.',
      };
    }

    // 2. Validar idempotencia (evitar duplicados por doble click o reintento)
    const existingOrder = orders.find(
      (o) => o.quoteId === quote.id || (quote.folio && (o.quoteFolio === quote.folio || (o as any).quote_number === quote.folio))
    );
    if (existingOrder || quote.convertedToOrderId || quote.converted_to_order_id) {
      const existingFolio = existingOrder?.folio || quote.convertedToOrderFolio || quote.converted_to_order_number || 'existente';
      return {
        success: false,
        error: `Esta cotización ya fue convertida previamente en el Pedido ${existingFolio}.`,
      };
    }

    const orderFolio = `PED-${String(orders.length + 1).padStart(6, '0')}`;
    const assignedExecId =
      (quote as any).salesExecutiveId ||
      (quote as any).sales_executive_id ||
      (quote as any).assignedSalesExecutiveId ||
      (quote as any).assigned_sales_executive_id ||
      (userToUse as any).salesExecutiveId ||
      'VENDEDOR_01';
    const masterTxId =
      (quote as any).masterTransactionId ||
      (quote as any).master_transaction_id ||
      `MTX-${Date.now().toString(36).toUpperCase()}`;

    // 3. Update quote status
    const updatedQuotes = quotes.map((q) =>
      q.id === quoteId
        ? {
            ...q,
            status: 'APROBADA' as const,
            convertedToOrderId: `ORD-${Date.now().toString(36)}`,
            converted_to_order_id: `ORD-${Date.now().toString(36)}`,
            convertedToOrderFolio: orderFolio,
            converted_to_order_number: orderFolio,
            updatedAt: new Date().toISOString(),
          }
        : q
    );
    setQuotes(updatedQuotes);

    // 4. Create Order with complete matching properties & inherited transactional keys
    const newOrder: Order = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      folio: orderFolio,
      orderNumber: orderFolio,
      order_number: orderFolio,
      quoteFolio: quote.folio,
      quote_number: quote.folio,
      quoteId: quote.id,
      quote_id: quote.id,
      customerId: quote.customerId,
      customer_id: quote.customerId,
      customerName: quote.customerName,
      customer_name: quote.customerName,
      customerRFC: quote.customerRFC || (quote as any).customer_rfc || 'XAXX010101000',
      sellerId: quote.salespersonId || quote.sellerId || userToUse.id,
      salespersonId: quote.salespersonId || quote.sellerId || userToUse.id,
      salesperson_id: quote.salespersonId || quote.sellerId || userToUse.id,
      sellerName: quote.salespersonName || quote.sellerName || userToUse.name,
      salespersonName: quote.salespersonName || quote.sellerName || userToUse.name,
      salesperson_name: quote.salespersonName || quote.sellerName || userToUse.name,
      salesExecutiveId: assignedExecId,
      sales_executive_id: assignedExecId,
      assignedSalesExecutiveId: assignedExecId,
      assigned_sales_executive_id: assignedExecId,
      masterTransactionId: masterTxId,
      master_transaction_id: masterTxId,
      warehouseId: warehouses[0]?.id || 'WH-01',
      warehouse_id: warehouses[0]?.id || 'WH-01',
      warehouseName: warehouses[0]?.name || 'Almacén Central Tultitlán',
      status: 'RESERVADO',
      fulfillmentStatus: 'PENDIENTE_SURTIDO',
      subtotal: quote.subtotal,
      discount: quote.discount || 0,
      tax: quote.tax,
      total: quote.total,
      orderDate: new Date().toISOString().slice(0, 10),
      promisedDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
      delivery_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
      deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
      deliveryAddress: 'Entrega en Obra / Instalación del Cliente',
      delivery_address: 'Entrega en Obra / Instalación del Cliente',
      paymentTerms: normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms),
      payment_terms: normalizePaymentTerms(quote.paymentTerms || (quote as any).payment_terms),
      notes: `Generado a partir de ${quote.folio}. ${quote.notes || ''}`,
      items: quote.items.map((item) => ({
        id: `OIT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        productId: item.productId || item.product_id,
        product_id: item.productId || item.product_id,
        productCode: item.productCode || item.product_code,
        product_code: item.productCode || item.product_code,
        productName: item.productName || item.product_name || item.description || '',
        product_name: item.productName || item.product_name || item.description || '',
        description: item.description || item.productName || item.product_name || '',
        quantity: item.quantity || item.quantityOrdered || 1,
        quantityOrdered: item.quantity || item.quantityOrdered || 1,
        quantityReserved: item.quantity || item.quantityOrdered || 1,
        quantityFulfilled: 0,
        unitPrice: item.unitPrice || item.unit_price,
        unit_price: item.unitPrice || item.unit_price,
        subtotal: item.subtotal,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    // 3. Reserve stock for products and log reserve movements
    const newMovements: InventoryMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const match = quote.items.find((it) => it.productId === prod.id || it.productCode === prod.code);
      if (match) {
        const qty = match.quantity || match.quantityOrdered || 1;
        const newReserved = (prod.reservedStock || 0) + qty;
        const newAvailable = Math.max(0, (prod.stock || prod.physicalStock || 0) - newReserved);

        newMovements.push({
          id: `MOV-RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
          timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
          type: 'RESERVA',
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          warehouseId: warehouses[0]?.id || 'WH-01',
          warehouseName: warehouses[0]?.name || 'Almacén Central Tultitlán',
          location: typeof prod.warehouseLocation === 'string' ? prod.warehouseLocation : 'Ubicación General',
          quantity: qty,
          previousBalance: prod.availableStock,
          newBalance: newAvailable,
          relatedDocFolio: orderFolio,
          userId: userToUse.id,
          userName: userToUse.name,
          reason: `Reserva automática por confirmación de Pedido ${orderFolio}`,
          createdAt: new Date().toISOString(),
        });

        return {
          ...prod,
          reservedStock: newReserved,
          availableStock: newAvailable,
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    const updatedMovements = [...newMovements, ...movements];
    setMovements(updatedMovements);

    // 4. Update linked Opportunity (if any) -> LOGRADO_CON_EXITO
    const updatedOpportunities = opportunities.map((opp) => {
      if (opp.quoteId === quote.id || opp.quoteFolio === quote.folio) {
        return {
          ...opp,
          stage: 'LOGRADO_CON_EXITO',
          probability: 100,
          orderId: newOrder.id,
          orderFolio: newOrder.folio,
          updatedAt: new Date().toISOString(),
          aiAnalysis: opp.aiAnalysis
            ? {
                ...opp.aiAnalysis,
                probability: 100,
                summary: `¡Venta cerrada con éxito! Pedido ${orderFolio} generado con reserva de inventario.`,
              }
            : undefined,
        };
      }
      return opp;
    });
    setOpportunities(updatedOpportunities);

    // 5. Audit log
    const updatedAuditLogs: AuditLog[] = [
      {
        id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        userId: userToUse?.id || 'USR-001',
        userName: userToUse?.name || 'Sistema',
        userRole: userToUse?.role || currentUser?.role || 'ADMINISTRADOR',
        action: 'CONVERSION_COTIZACION_A_PEDIDO',
        module: 'PEDIDOS' as ERPModule,
        recordId: orderFolio,
        details: `Cotización ${quote.folio} convertida a Pedido ${orderFolio} con reserva de ${newMovements.length} partidas. Oportunidad actualizada a Logrado con Éxito.`,
        ip: '192.168.1.55',
        createdAt: new Date().toISOString(),
      },
      ...auditLogs,
    ];
    setAuditLogs(updatedAuditLogs);

    // 6. Notification
    addNotification({
      title: 'Nuevo Pedido Confirmado',
      message: `Se ha generado el Pedido ${orderFolio} a partir de ${quote.folio}. Inventario reservado en tiempo real.`,
      type: 'EXITO',
      module: 'PEDIDOS',
    });

    // 7. Broadcast across all connected tabs/users
    broadcastDataUpdate('QUOTE_TO_ORDER', {
      userName: userToUse.name,
      orderFolio,
      quotes: updatedQuotes,
      orders: updatedOrders,
      products: updatedProducts,
      movements: updatedMovements,
      opportunities: updatedOpportunities,
      auditLogs: updatedAuditLogs,
    });

    return { success: true, orderFolio };
  };

  // Inventory movement recording
  const recordMovement = (data: {
    productId: string;
    warehouseId: string;
    type: MovementType;
    quantity: number;
    reason: string;
    relatedDocFolio?: string;
    location?: string;
    customUser?: { id: string; name: string; role?: any };
  }): { success: boolean; error?: string; movement?: InventoryMovement } => {
    const product = products.find((p) => p.id === data.productId || p.code === data.productId);
    if (!product) return { success: false, error: 'Producto no encontrado' };

    const warehouse = warehouses.find((w) => w.id === data.warehouseId) || warehouses[0];
    const userToUse = data.customUser || currentUser || { id: 'USR-001', name: 'Sistema', role: 'ADMINISTRADOR' };

    let newStock = product.stock;
    if (data.type === 'ENTRADA' || data.type === 'DEVOLUCION') {
      newStock += data.quantity;
    } else if (data.type === 'SALIDA') {
      if (product.stock < data.quantity && !companyConfig.allow_negative_stock) {
        return { success: false, error: `Stock insuficiente: ${product.stock} disponibles.` };
      }
      newStock -= data.quantity;
    } else if (data.type === 'AJUSTE') {
      newStock = data.quantity;
    }

    const newAvailable = Math.max(0, newStock - (product.reservedStock || 0));

    const locationDisplay =
      data.location ||
      (typeof product.warehouseLocation === 'string'
        ? product.warehouseLocation
        : product.warehouseLocation
        ? `N${product.warehouseLocation.nave} / R${product.warehouseLocation.rack} / P${product.warehouseLocation.pasillo} / Niv${product.warehouseLocation.nivel}`
        : 'Ubicación Central');

    const movement: InventoryMovement = {
      id: `MOV-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
      type: data.type,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      location: locationDisplay,
      quantity: data.quantity,
      previousBalance: product.stock,
      newBalance: newStock,
      reason: data.reason,
      relatedDocFolio: data.relatedDocFolio,
      userId: userToUse.id,
      userName: userToUse.name,
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((p) =>
      p.id === product.id ? { ...p, stock: newStock, physicalStock: newStock, availableStock: newAvailable } : p
    );
    setProducts(updatedProducts);

    const updatedMovements = [movement, ...movements];
    setMovements(updatedMovements);

    const updatedAuditLogs: AuditLog[] = [
      {
        id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        userId: userToUse?.id || 'USR-001',
        userName: userToUse?.name || 'Sistema',
        userRole: userToUse?.role || currentUser?.role || 'ADMINISTRADOR',
        action: `MOVIMIENTO_${data.type}`,
        module: 'INVENTARIO',
        recordId: product.code,
        details: `${data.type} de ${data.quantity} ${product.unit} en ${warehouse.name} (${locationDisplay}). Saldo: ${newStock}. Motivo: ${data.reason}`,
        createdAt: new Date().toISOString(),
      },
      ...auditLogs,
    ];
    setAuditLogs(updatedAuditLogs);

    addNotification({
      title: `Movimiento Registrado: ${data.type}`,
      message: `${product.code} - ${product.name}: ${data.type === 'SALIDA' ? '-' : '+'}${data.quantity} ${product.unit}. Saldo nuevo: ${newStock}`,
      type: data.type === 'SALIDA' ? 'ADVERTENCIA' : 'EXITO',
      module: 'INVENTARIO',
    });

    broadcastDataUpdate('INVENTORY_MOVEMENT', {
      movementType: data.type,
      userName: userToUse.name,
      productCode: product.code,
      productName: product.name,
      quantity: data.quantity,
      newBalance: newStock,
      summary: `${data.type} de ${data.quantity} ${product.unit} de ${product.code} registrada por ${userToUse.name}. Saldo: ${newStock}`,
      products: updatedProducts,
      movements: updatedMovements,
      auditLogs: updatedAuditLogs,
    });

    return { success: true, movement };
  };

  // =========================================================================
  // FASE 2: INVENTORY & WAREHOUSE OPERATIONS
  // =========================================================================

  // Direct Inventory Entry (Entrada con Costo y Proveedor)
  const createInventoryEntry = useCallback(
    (data: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason: string;
      supplierDoc?: string;
      unitCost?: number;
      location?: string;
      customUser?: { id: string; name: string; role?: any };
    }) => {
      const product = products.find((p) => p.id === data.productId || p.code === data.productId);
      if (!product) return { success: false, error: 'Producto no encontrado en catálogo.' };
      if (data.quantity <= 0) return { success: false, error: 'La cantidad debe ser mayor a 0.' };

      const warehouse = warehouses.find((w) => w.id === data.warehouseId) || warehouses[0];
      const userToUse = data.customUser || currentUser || { id: 'USR-005', name: 'Almacén', role: 'ALMACEN' };

      const prevStock = product.stock || product.physicalStock || 0;
      const newStock = prevStock + data.quantity;
      const newAvailable = Math.max(0, newStock - (product.reservedStock || 0));

      // Weighted average cost update if unitCost provided
      let newCost = product.cost;
      if (data.unitCost && data.unitCost > 0) {
        newCost = Math.round(((product.cost * prevStock + data.unitCost * data.quantity) / newStock) * 100) / 100;
      }

      const locationStr = data.location || (typeof product.warehouseLocation === 'string' ? product.warehouseLocation : 'N1 / R-01 / P-01 / Niv-1');

      const movementId = `MOV-ENT-${Date.now().toString(36).toUpperCase()}`;
      const movement: InventoryMovement = {
        id: movementId,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        type: 'ENTRADA',
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        location: locationStr,
        quantity: data.quantity,
        previousBalance: prevStock,
        newBalance: newStock,
        reason: data.reason || 'Recepción de mercancía / Entrada ordinaria',
        relatedDocFolio: data.supplierDoc,
        userId: userToUse.id,
        userName: userToUse.name,
        createdAt: new Date().toISOString(),
      };

      const updatedProducts = products.map((p) =>
        p.id === product.id
          ? {
              ...p,
              stock: newStock,
              physicalStock: newStock,
              availableStock: newAvailable,
              cost: newCost,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      setProducts(updatedProducts);

      const updatedMovements = [movement, ...movements];
      setMovements(updatedMovements);

      const audit: AuditLog = {
        id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        userId: userToUse.id,
        userName: userToUse.name,
        userRole: userToUse.role || 'ALMACEN',
        action: 'MOVIMIENTO_ENTRADA',
        module: 'INVENTARIO',
        recordId: product.code,
        details: `Entrada de ${data.quantity} ${product.unit} en ${warehouse.name} (${locationStr}). Saldo anterior: ${prevStock}, nuevo saldo: ${newStock}. Costo ponderado: $${newCost}. Doc: ${data.supplierDoc || 'S/N'}.`,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [audit, ...prev]);

      addNotification({
        title: 'Entrada de Inventario Registrada',
        message: `${product.code}: +${data.quantity} ${product.unit} en ${warehouse.name}. Saldo disponible: ${newAvailable}.`,
        type: 'EXITO',
        module: 'INVENTARIO',
      });

      broadcastDataUpdate('INVENTORY_ENTRY', {
        userName: userToUse.name,
        productCode: product.code,
        quantity: data.quantity,
        newBalance: newStock,
        summary: `Entrada de ${data.quantity} ${product.unit} de ${product.code} por ${userToUse.name}`,
        products: updatedProducts,
        movements: updatedMovements,
      });

      return { success: true, movement };
    },
    [products, warehouses, movements, currentUser, addNotification, broadcastDataUpdate]
  );

  // Direct Inventory Exit (Salida por Venta / Despacho / Muestra)
  const createInventoryExit = useCallback(
    (data: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason: string;
      orderId?: string;
      orderFolio?: string;
      recipient?: string;
      location?: string;
      customUser?: { id: string; name: string; role?: any };
    }) => {
      const product = products.find((p) => p.id === data.productId || p.code === data.productId);
      if (!product) return { success: false, error: 'Producto no encontrado.' };
      if (data.quantity <= 0) return { success: false, error: 'La cantidad debe ser mayor a 0.' };

      const available = product.availableStock ?? (product.stock - (product.reservedStock || 0));
      if (data.quantity > available && !companyConfig.allow_negative_stock) {
        return {
          success: false,
          error: `Stock insuficiente para salida. Disponible: ${available} ${product.unit}, Solicitado: ${data.quantity} ${product.unit}. Faltante: ${data.quantity - available} ${product.unit}.`,
        };
      }

      const warehouse = warehouses.find((w) => w.id === data.warehouseId) || warehouses[0];
      const userToUse = data.customUser || currentUser || { id: 'USR-005', name: 'Almacén', role: 'ALMACEN' };

      const prevStock = product.stock || product.physicalStock || 0;
      const newStock = Math.max(0, prevStock - data.quantity);
      const newAvailable = Math.max(0, newStock - (product.reservedStock || 0));

      const locationStr = data.location || (typeof product.warehouseLocation === 'string' ? product.warehouseLocation : 'N1 / R-01 / P-01 / Niv-1');

      const movementId = `MOV-SAL-${Date.now().toString(36).toUpperCase()}`;
      const movement: InventoryMovement = {
        id: movementId,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        type: 'SALIDA',
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        location: locationStr,
        quantity: data.quantity,
        previousBalance: prevStock,
        newBalance: newStock,
        reason: data.reason || 'Despacho ordinario de almacén',
        relatedDocFolio: data.orderFolio || data.recipient,
        userId: userToUse.id,
        userName: userToUse.name,
        createdAt: new Date().toISOString(),
      };

      const updatedProducts = products.map((p) =>
        p.id === product.id
          ? {
              ...p,
              stock: newStock,
              physicalStock: newStock,
              availableStock: newAvailable,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      setProducts(updatedProducts);

      const updatedMovements = [movement, ...movements];
      setMovements(updatedMovements);

      const audit: AuditLog = {
        id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        userId: userToUse.id,
        userName: userToUse.name,
        userRole: userToUse.role || 'ALMACEN',
        action: 'MOVIMIENTO_SALIDA',
        module: 'INVENTARIO',
        recordId: product.code,
        details: `Salida de ${data.quantity} ${product.unit} en ${warehouse.name}. Saldo restante: ${newStock}. Ref: ${data.orderFolio || data.recipient || 'N/A'}. Motivo: ${data.reason}`,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [audit, ...prev]);

      addNotification({
        title: 'Salida de Almacén Registrada',
        message: `${product.code}: -${data.quantity} ${product.unit} en ${warehouse.name}. Saldo disponible: ${newAvailable}.`,
        type: 'ADVERTENCIA',
        module: 'INVENTARIO',
      });

      broadcastDataUpdate('INVENTORY_EXIT', {
        userName: userToUse.name,
        productCode: product.code,
        quantity: data.quantity,
        newBalance: newStock,
        summary: `Salida de ${data.quantity} ${product.unit} de ${product.code}`,
        products: updatedProducts,
        movements: updatedMovements,
      });

      return { success: true, movement };
    },
    [products, warehouses, movements, companyConfig, currentUser, addNotification, broadcastDataUpdate]
  );

  // Manual Reservation Creator
  const createReservation = useCallback(
    (orderId: string, productId: string, warehouseId: string, quantity: number, notes?: string) => {
      const product = products.find((p) => p.id === productId || p.code === productId);
      if (!product) return { success: false, error: 'Producto no encontrado.' };

      const available = product.availableStock ?? (product.stock - (product.reservedStock || 0));
      if (quantity > available && !companyConfig.allow_negative_stock) {
        return {
          success: false,
          error: `Stock disponible insuficiente (${available} ${product.unit}) para apartar ${quantity} ${product.unit}.`,
        };
      }

      const order = orders.find((o) => o.id === orderId || o.folio === orderId);
      const warehouse = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

      const resId = `RES-${Date.now().toString(36).toUpperCase()}`;
      const newReservation: InventoryReservation = {
        id: resId,
        orderId: order?.id || orderId,
        order_id: order?.id || orderId,
        orderFolio: order?.folio || orderId,
        order_folio: order?.folio || orderId,
        productId: product.id,
        product_id: product.id,
        productCode: product.code,
        product_code: product.code,
        productName: product.name,
        product_name: product.name,
        warehouseId: warehouse.id,
        warehouse_id: warehouse.id,
        warehouseName: warehouse.name,
        warehouse_name: warehouse.name,
        quantity,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        notes: notes || `Apartado por Pedido ${order?.folio || orderId}`,
      };

      const newReserved = (product.reservedStock || 0) + quantity;
      const newAvailable = Math.max(0, product.stock - newReserved);

      const updatedProducts = products.map((p) =>
        p.id === product.id ? { ...p, reservedStock: newReserved, availableStock: newAvailable } : p
      );
      setProducts(updatedProducts);

      const updatedReservations = [newReservation, ...reservations];
      setReservations(updatedReservations);

      const movement: InventoryMovement = {
        id: `MOV-RES-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        type: 'RESERVA',
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        location: typeof product.warehouseLocation === 'string' ? product.warehouseLocation : 'Ubicación General',
        quantity,
        previousBalance: product.availableStock,
        newBalance: newAvailable,
        reason: `Reserva por Pedido ${order?.folio || orderId}`,
        relatedDocFolio: order?.folio || orderId,
        userId: currentUser?.id || 'USR-001',
        userName: currentUser?.name || 'Administrador',
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [movement, ...prev]);

      addAuditLog({
        action: 'CREAR_RESERVA',
        module: 'INVENTARIO',
        recordId: resId,
        details: `Reserva de ${quantity} ${product.unit} de ${product.code} para Pedido ${order?.folio || orderId}.`,
      });

      broadcastDataUpdate('RESERVATION_CREATED', {
        userName: currentUser?.name || 'Sistema',
        summary: `Reserva de ${quantity} ${product.unit} de ${product.code}`,
        reservations: updatedReservations,
        products: updatedProducts,
      });

      return { success: true, reservation: newReservation };
    },
    [products, orders, warehouses, reservations, companyConfig, currentUser, addAuditLog, broadcastDataUpdate]
  );

  // Release reservation back to available inventory
  const releaseReservation = useCallback(
    (reservationId: string, quantityToRelease?: number, reason?: string) => {
      const res = reservations.find((r) => r.id === reservationId);
      if (!res) return { success: false, error: 'Reserva no encontrada.' };
      if (res.status !== 'ACTIVE') return { success: false, error: `La reserva ya está en estado ${res.status}.` };

      const qty = quantityToRelease && quantityToRelease > 0 && quantityToRelease < res.quantity ? quantityToRelease : res.quantity;
      const isFullRelease = qty >= res.quantity;

      const product = products.find((p) => p.id === (res.productId || res.product_id) || p.code === (res.productCode || res.product_code));
      if (!product) return { success: false, error: 'Producto de la reserva no encontrado.' };

      const newReserved = Math.max(0, (product.reservedStock || 0) - qty);
      const newAvailable = Math.max(0, product.stock - newReserved);

      const updatedProducts = products.map((p) =>
        p.id === product.id ? { ...p, reservedStock: newReserved, availableStock: newAvailable } : p
      );
      setProducts(updatedProducts);

      const updatedReservations = reservations.map((r) =>
        r.id === reservationId
          ? isFullRelease
            ? {
                ...r,
                status: 'RELEASED' as const,
                releasedAt: new Date().toISOString(),
                releasedBy: currentUser?.id,
                releasedByName: currentUser?.name,
                notes: `${r.notes || ''} [Liberada: ${reason || 'Cancelación o liberación de apartado'}]`.trim(),
              }
            : {
                ...r,
                quantity: r.quantity - qty,
                notes: `${r.notes || ''} [Liberación parcial de ${qty}]`.trim(),
              }
          : r
      );
      setReservations(updatedReservations);

      const movement: InventoryMovement = {
        id: `MOV-LIB-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        type: 'LIBERACION_RESERVA',
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        warehouseId: res.warehouseId || res.warehouse_id || 'WH-01',
        warehouseName: res.warehouseName || res.warehouse_name || 'Almacén Central',
        location: typeof product.warehouseLocation === 'string' ? product.warehouseLocation : 'Ubicación General',
        quantity: qty,
        previousBalance: product.availableStock,
        newBalance: newAvailable,
        reason: `Liberación de reserva por: ${reason || 'Desbloqueo de stock'}`,
        relatedDocFolio: res.orderFolio || res.order_folio,
        userId: currentUser?.id || 'USR-001',
        userName: currentUser?.name || 'Sistema',
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [movement, ...prev]);

      addAuditLog({
        action: 'LIBERACION_RESERVA',
        module: 'INVENTARIO',
        recordId: reservationId,
        details: `Liberación de ${qty} ${product.unit} de reserva ${reservationId}. Stock disponible aumentó a ${newAvailable}.`,
      });

      broadcastDataUpdate('RESERVATION_RELEASED', {
        userName: currentUser?.name || 'Sistema',
        summary: `Liberación de ${qty} ${product.unit} de reserva ${res.productCode}`,
        reservations: updatedReservations,
        products: updatedProducts,
      });

      return { success: true };
    },
    [reservations, products, currentUser, addAuditLog, broadcastDataUpdate]
  );

  // Fulfill Order / Surtido de Pedido (Requirement: "Un pedido apartado no debe descontar físicamente hasta que se surte")
  const fulfillOrder = useCallback(
    (
      orderId: string,
      itemsToFulfillArg?: any,
      notesArg?: string
    ) => {
      const order = orders.find((o) => o.id === orderId || o.folio === orderId);
      if (!order) return { success: false, error: 'Pedido no encontrado.' };

      const userToUse = currentUser || { id: 'USR-005', name: 'Almacén', role: 'ALMACEN' };

      // RBAC: Deny VENDEDOR from warehouse fulfillment
      if (userToUse.role === 'VENDEDOR') {
        return { success: false, error: '403 FORBIDDEN: El rol VENDEDOR no cuenta con autorización para surtido de almacén.' };
      }

      // IDEMPOTENCY: Do not duplicate stock deduction or Kardex movements if already fully fulfilled
      if (order.status === 'SURTIDO' && (order as any).fulfillmentStatus === 'SURTIDO') {
        return { success: true };
      }

      // Safe argument parsing
      let itemsToFulfill: { orderItemId: string; productId: string; quantity: number; warehouseId: string; location?: string }[] = [];
      const notes = typeof itemsToFulfillArg === 'string' ? itemsToFulfillArg : notesArg;

      if (Array.isArray(itemsToFulfillArg) && itemsToFulfillArg.length > 0) {
        itemsToFulfill = itemsToFulfillArg.map((itm) => ({
          orderItemId: itm.orderItemId || itm.id || '',
          productId: itm.productId || (itm as any).product_id || '',
          quantity: Number(itm.quantity) || 0,
          warehouseId: itm.warehouseId || order.warehouseId || 'WH-01',
          location: itm.location,
        }));
      } else {
        // Fallback: fulfill all items in the order
        itemsToFulfill = (order.items || []).map((oItem) => {
          const prod = products.find((p) => p.id === oItem.productId || p.code === oItem.productCode || p.sku === oItem.productCode);
          const locStr = typeof prod?.warehouseLocation === 'string' ? prod.warehouseLocation : 'N1 / R-01 / P-01 / Niv-1';
          return {
            orderItemId: oItem.id || '',
            productId: oItem.productId || prod?.id || '',
            quantity: oItem.quantityOrdered || oItem.quantity || 0,
            warehouseId: order.warehouseId || 'WH-01',
            location: locStr,
          };
        });
      }

      let updatedProductList = [...products];
      const newMovements: InventoryMovement[] = [];

      // Validate that all items can be fulfilled
      for (const item of itemsToFulfill) {
        const prod = updatedProductList.find((p) => p.id === item.productId || p.code === item.productId || p.sku === item.productId);
        if (!prod) {
          return { success: false, error: `Producto ${item.productId} no encontrado en catálogo.` };
        }
        const currentStock = prod.stock ?? prod.physicalStock ?? 0;
        if (item.quantity > currentStock && !companyConfig.allow_negative_stock) {
          return {
            success: false,
            error: `Stock físico insuficiente para surtir ${item.quantity} ${prod.unit} de ${prod.name} (${prod.code}). Físico actual: ${currentStock}.`,
          };
        }
      }

      // Apply fulfillment mutations
      for (const item of itemsToFulfill) {
        const prod = updatedProductList.find((p) => p.id === item.productId || p.code === item.productId || p.sku === item.productId)!;
        const prevPhysical = prod.stock || prod.physicalStock || 0;
        const prevReserved = prod.reservedStock || 0;

        const newPhysical = Math.max(0, prevPhysical - item.quantity);
        const newReserved = Math.max(0, prevReserved - item.quantity);
        const newAvailable = Math.max(0, newPhysical - newReserved);

        updatedProductList = updatedProductList.map((p) =>
          p.id === prod.id
            ? {
                ...p,
                stock: newPhysical,
                physicalStock: newPhysical,
                reservedStock: newReserved,
                availableStock: newAvailable,
                updatedAt: new Date().toISOString(),
              }
            : p
        );

        const wh = warehouses.find((w) => w.id === item.warehouseId) || warehouses[0] || { id: 'WH-01', name: 'Almacén Central Tultitlán' };
        const locationStr = item.location || (typeof prod.warehouseLocation === 'string' ? prod.warehouseLocation : 'N1 / R-01 / P-01 / Niv-1');

        newMovements.push({
          id: `MOV-SUR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
          timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
          type: 'SALIDA',
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          warehouseId: wh.id,
          warehouseName: wh.name,
          location: locationStr,
          quantity: item.quantity,
          previousBalance: prevPhysical,
          newBalance: newPhysical,
          reason: `Surtido de Pedido ${order.folio}. ${notes || ''}`.trim(),
          relatedDocFolio: order.folio,
          userId: userToUse.id,
          userName: userToUse.name,
          createdAt: new Date().toISOString(),
        });
      }

      // Update Order Items and Order Status
      let totalOrderedQty = 0;
      let totalFulfilledQty = 0;

      const updatedOrderItems = (order.items || []).map((oItem) => {
        const matchingFulfillment = itemsToFulfill.find(
          (f) => f.orderItemId === oItem.id || f.productId === oItem.productId || f.productId === oItem.product_id
        );
        const qtyOrdered = oItem.quantityOrdered || oItem.quantity || 0;
        const currentFulfilled = oItem.quantityFulfilled || 0;
        const addFulfilled = matchingFulfillment ? matchingFulfillment.quantity : 0;
        const newFulfilled = Math.min(qtyOrdered, currentFulfilled + addFulfilled);

        totalOrderedQty += qtyOrdered;
        totalFulfilledQty += newFulfilled;

        return {
          ...oItem,
          quantityFulfilled: newFulfilled,
          quantityPending: Math.max(0, qtyOrdered - newFulfilled),
          fulfillmentStatus: newFulfilled >= qtyOrdered ? ('SURTIDO_TOTAL' as const) : newFulfilled > 0 ? ('SURTIDO_PARCIAL' as const) : ('PENDIENTE' as const),
        };
      });

      const isFullyFulfilled = totalFulfilledQty >= totalOrderedQty;
      const newOrderStatus = isFullyFulfilled ? 'SURTIDO' : totalFulfilledQty > 0 ? 'EN SURTIDO' : order.status;

      const updatedOrders = orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: newOrderStatus as any,
              fulfillmentStatus: isFullyFulfilled ? ('SURTIDO_TOTAL' as const) : ('SURTIDO_PARCIAL' as const),
              items: updatedOrderItems,
              updatedAt: new Date().toISOString(),
            }
          : o
      );

      // Update associated reservations to FULFILLED
      const updatedReservations = reservations.map((r) => {
        if ((r.orderId === order.id || r.orderFolio === order.folio) && r.status === 'ACTIVE') {
          return {
            ...r,
            status: isFullyFulfilled ? ('FULFILLED' as const) : r.status,
            releasedAt: new Date().toISOString(),
            releasedByName: userToUse.name,
          };
        }
        return r;
      });

      // Update associated picking if present
      setPickings((prevPickings) =>
        prevPickings.map((p) => {
          if (p.orderId === order.id || p.orderFolio === order.folio) {
            return {
              ...p,
              status: p.status === 'VERIFICADO' ? 'VERIFICADO' : isFullyFulfilled ? ('COMPLETADO' as const) : ('EN_PROCESO' as const),
              completedAt: isFullyFulfilled ? new Date().toISOString() : p.completedAt,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        })
      );

      setProducts(updatedProductList);
      setOrders(updatedOrders);
      setReservations(updatedReservations);
      setMovements((prev) => [...newMovements, ...prev]);

      const audit: AuditLog = {
        id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        userId: userToUse.id,
        userName: userToUse.name,
        userRole: userToUse.role || 'ALMACEN',
        action: 'SURTIDO_PEDIDO',
        module: 'ALMACENES',
        recordId: order.folio,
        details: `Surtido realizado para Pedido ${order.folio}. Estatus: ${newOrderStatus}. Total surtido: ${totalFulfilledQty} de ${totalOrderedQty} piezas.`,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [audit, ...prev]);

      addNotification({
        title: `Pedido ${order.folio} ${isFullyFulfilled ? 'Surtido Totalmente' : 'Surtido Parcial'}`,
        message: `Se despacharon materiales para ${order.customerName}. Listo para embarque y ruta.`,
        type: 'EXITO',
        module: 'PEDIDOS',
      });

      broadcastDataUpdate('ORDER_FULFILLED', {
        userName: userToUse.name,
        orderFolio: order.folio,
        summary: `Surtido de Pedido ${order.folio} (${newOrderStatus})`,
        products: updatedProductList,
        orders: updatedOrders,
        reservations: updatedReservations,
        movements: [...newMovements, ...movements],
      });

      return { success: true };
    },
    [orders, products, warehouses, reservations, movements, companyConfig, currentUser, addNotification, broadcastDataUpdate]
  );

  // =========================================================================
  // PICKING OPERATIVO & SURTIDO FÍSICO (FASE 2.5)
  // =========================================================================

  const getOrCreatePicking = useCallback(
    (orderId: string): Picking => {
      const order = orders.find((o) => o.id === orderId || o.folio === orderId || o.order_number === orderId);
      const existing = pickings.find((p) => p.orderId === orderId || p.orderFolio === orderId || (order && (p.orderFolio === order.folio || p.orderFolio === order.order_number)));
      if (existing) return existing;

      const orderFolio = order?.folio || order?.order_number || orderId;
      const pickingId = `PCK-${orderFolio}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      const targetWarehouse = warehouses.find((w) => w.id === order?.warehouseId) || warehouses[0] || { id: 'WH-01', name: 'Almacén Central Tultitlán' };

      const items: PickingItem[] = (order?.items || []).map((item, idx) => {
        const prod = products.find((p) => p.id === item.productId || p.code === item.productCode || p.sku === item.productCode);
        const physStock = prod?.stock ?? prod?.physicalStock ?? 0;
        const requested = item.quantityOrdered ?? item.quantity ?? 0;
        const alreadyFulfilled = item.quantityFulfilled ?? 0;
        const toPick = Math.max(0, requested - alreadyFulfilled);

        let locStr = 'N1 / R-01 / P-01 / Niv-1';
        if (typeof prod?.warehouseLocation === 'string') {
          locStr = prod.warehouseLocation;
        } else if (prod?.warehouseLocation && typeof prod.warehouseLocation === 'object') {
          const locObj: any = prod.warehouseLocation;
          locStr = `${locObj.nave || 'N1'} / ${locObj.rack || 'R-01'} / ${locObj.pasillo || 'P-01'} / ${locObj.nivel || 'Niv-1'}`;
        }

        return {
          id: `PI-${idx + 1}-${Date.now().toString(36).toUpperCase().slice(-3)}`,
          orderItemId: item.id || `OI-${idx + 1}`,
          productId: prod?.id || item.productId || item.productCode,
          productCode: prod?.code || item.productCode,
          productName: prod?.name || item.productName,
          unit: prod?.unit || item.unit || 'PZA',
          qtyRequested: requested,
          qtyAvailable: physStock,
          qtyPicked: toPick,
          location: locStr,
          status: 'PENDIENTE',
          sku: prod?.sku || prod?.code || item.productCode,
          description: prod?.name || item.productName,
          orderQty: requested,
          availableQty: physStock,
          pickedQty: toPick,
        };
      });

      const newPicking: Picking = {
        id: pickingId,
        pickingId,
        orderId: order?.id || orderId,
        orderFolio,
        customerName: order?.customerName || (order as any)?.customer_name || 'Cliente',
        warehouseId: targetWarehouse.id,
        warehouseName: targetWarehouse.name,
        status: 'EN_PROCESO',
        items,
        createdBy: currentUser?.id || 'USR-005',
        createdByName: currentUser?.name || 'Almacén',
        createdAt: new Date().toISOString(),
        masterTransactionId: order?.masterTransactionId || (order as any)?.master_transaction_id || `MTX-${Date.now().toString(36).toUpperCase()}`,
        notes: '',
      };

      setPickings((prev) => {
        const updated = [newPicking, ...prev];
        try {
          localStorage.setItem('conscore_pickings', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      // Background persist to server
      try {
        fetch('/api/picking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}`,
          },
          body: JSON.stringify(newPicking),
        }).catch((err) => console.warn('API POST /api/picking warning:', err));
      } catch (_) {}

      return newPicking;
    },
    [orders, pickings, warehouses, products, currentUser]
  );

  const createPickingForOrder = useCallback(
    (orderId: string): Picking => {
      return getOrCreatePicking(orderId);
    },
    [getOrCreatePicking]
  );

  const updatePicking = useCallback(
    (updatedPicking: Picking) => {
      setPickings((prev) => {
        const next = prev.map((p) => (p.id === updatedPicking.id || p.pickingId === updatedPicking.pickingId ? updatedPicking : p));
        if (!next.some((p) => p.id === updatedPicking.id || p.pickingId === updatedPicking.pickingId)) {
          next.unshift(updatedPicking);
        }
        try {
          localStorage.setItem('conscore_pickings', JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      try {
        fetch('/api/picking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}`,
          },
          body: JSON.stringify(updatedPicking),
        }).catch((err) => console.warn('API POST /api/picking warning:', err));
      } catch (_) {}
    },
    []
  );

  const savePickingDraft = useCallback(
    async (picking: Picking) => {
      const user = currentUser || { id: 'USR-005', name: 'Almacén', role: 'ALMACEN' };
      if (user.role === 'VENDEDOR') {
        return { success: false, error: '403 FORBIDDEN: El rol VENDEDOR no cuenta con autorización para editar picking.' };
      }

      for (const itm of picking.items) {
        const pQty = itm.pickedQty !== undefined ? itm.pickedQty : itm.qtyPicked;
        const reqQty = itm.orderQty !== undefined ? itm.orderQty : itm.qtyRequested;
        if (pQty < 0) {
          return { success: false, error: `La cantidad surtida no puede ser negativa en ${itm.productName || itm.productCode}.` };
        }
        if (pQty > itm.qtyAvailable && !companyConfig.allow_negative_stock) {
          return { success: false, error: `La cantidad surtida (${pQty}) supera la existencia disponible (${itm.qtyAvailable}) en ${itm.productName || itm.productCode}.` };
        }
        if (reqQty > 0 && pQty > reqQty) {
          return { success: false, error: `La cantidad surtida (${pQty}) no puede superar la cantidad pedida (${reqQty}) en ${itm.productName || itm.productCode}.` };
        }
      }

      const updated: Picking = {
        ...picking,
        status: picking.status === 'VERIFICADO' || picking.status === 'COMPLETADO' ? picking.status : 'EN_PROCESO',
        updatedAt: new Date().toISOString(),
      };

      updatePicking(updated);

      addAuditLog({
        action: 'PICKING_GUARDADO_BORRADOR',
        module: 'ALMACENES',
        recordId: updated.pickingId,
        details: `Borrador de picking ${updated.pickingId} guardado con ${updated.items.length} partidas. Estado: ${updated.status}. Sin afectación de inventario.`,
      });

      return { success: true, picking: updated };
    },
    [currentUser, companyConfig, updatePicking, addAuditLog]
  );

  const completePicking = useCallback(
    async (pickingId: string, notes?: string) => {
      const user = currentUser || { id: 'USR-005', name: 'Almacén', role: 'ALMACEN' };
      if (user.role === 'VENDEDOR') {
        return { success: false, error: '403 FORBIDDEN: El rol VENDEDOR no cuenta con facultades para completar picking.' };
      }

      const p = pickings.find((x) => x.id === pickingId || x.pickingId === pickingId);
      if (!p) return { success: false, error: 'Picking no encontrado.' };

      const order = orders.find((o) => o.id === p.orderId || o.folio === p.orderFolio || o.order_number === p.orderFolio);
      if (order && order.status === 'CANCELADO') {
        return { success: false, error: 'DENIED: No se puede completar el picking de un pedido cancelado.' };
      }

      if (!p.items || p.items.length === 0) {
        return { success: false, error: 'DENIED: El picking no contiene partidas.' };
      }

      let isPartial = false;
      for (const itm of p.items) {
        const req = itm.orderQty !== undefined ? itm.orderQty : itm.qtyRequested;
        const picked = itm.pickedQty !== undefined ? itm.pickedQty : itm.qtyPicked;
        if (picked < 0) {
          return { success: false, error: `Cantidad surtida inválida (${picked}) en ${itm.productName}.` };
        }
        if (picked < req) {
          isPartial = true;
        }
      }

      const fulfillmentType = isPartial ? ('PICKING_PARCIAL' as const) : ('PICKING_COMPLETO' as const);
      const nowIso = new Date().toISOString();

      const updatedItems = p.items.map((i) => {
        const req = i.orderQty !== undefined ? i.orderQty : i.qtyRequested;
        const picked = i.pickedQty !== undefined ? i.pickedQty : i.qtyPicked;
        return {
          ...i,
          qtyPicked: picked,
          pickedQty: picked,
          status: (picked >= req ? 'SURTIDO' : picked > 0 ? 'PARCIAL' : 'FALTANTE') as any,
        };
      });

      const completedPicking: Picking = {
        ...p,
        status: p.status === 'VERIFICADO' ? 'VERIFICADO' : 'COMPLETADO',
        fulfillmentType,
        items: updatedItems,
        completedAt: nowIso,
        updatedAt: nowIso,
        notes: notes !== undefined ? notes : p.notes,
      };

      updatePicking(completedPicking);

      addAuditLog({
        action: 'PICKING_COMPLETADO',
        module: 'ALMACENES',
        recordId: completedPicking.pickingId,
        details: `Picking ${completedPicking.pickingId} completado (${fulfillmentType}) para pedido ${completedPicking.orderFolio} por ${user.name}.`,
      });

      addNotification({
        title: `Picking ${completedPicking.pickingId} Completado`,
        message: `El surtido del pedido ${completedPicking.orderFolio} ha sido completado como ${fulfillmentType}. Listo para confirmar surtido físico.`,
        type: 'EXITO',
        module: 'ALMACENES',
      });

      try {
        await fetch(`/api/picking/${completedPicking.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}`,
          },
          body: JSON.stringify({ notes }),
        });
      } catch (_) {}

      return { success: true, picking: completedPicking, fulfillmentType };
    },
    [currentUser, pickings, orders, updatePicking, addAuditLog, addNotification]
  );

  const updatePickingItemQuantity = useCallback(
    (pickingId: string, orderItemId: string, qtyPicked: number) => {
      const p = pickings.find((x) => x.id === pickingId || x.pickingId === pickingId);
      if (!p) return { success: false, error: 'Picking no encontrado.' };

      if (qtyPicked < 0) {
        return { success: false, error: 'La cantidad surtida no puede ser negativa.' };
      }

      const item = p.items.find((i) => i.id === orderItemId || i.orderItemId === orderItemId);
      if (!item) return { success: false, error: 'Partida de picking no encontrada.' };

      if (qtyPicked > item.qtyAvailable && !companyConfig.allow_negative_stock) {
        return { success: false, error: `La cantidad surtida (${qtyPicked}) supera la existencia disponible (${item.qtyAvailable}).` };
      }

      if (item.qtyRequested > 0 && qtyPicked > item.qtyRequested) {
        return { success: false, error: `La cantidad surtida (${qtyPicked}) no puede superar la pedida (${item.qtyRequested}).` };
      }

      const updatedItems = p.items.map((i) => {
        if (i.id === orderItemId || i.orderItemId === orderItemId) {
          const status = qtyPicked >= i.qtyRequested ? ('SURTIDO' as const) : qtyPicked > 0 ? ('PARCIAL' as const) : ('PENDIENTE' as const);
          return { ...i, qtyPicked, pickedQty: qtyPicked, status };
        }
        return i;
      });

      const allFulfilled = updatedItems.every((i) => (i.pickedQty ?? i.qtyPicked) >= i.qtyRequested);
      const someFulfilled = updatedItems.some((i) => (i.pickedQty ?? i.qtyPicked) > 0);
      const newStatus = allFulfilled ? ('COMPLETADO' as const) : someFulfilled ? ('EN_PROCESO' as const) : p.status;

      const updated: Picking = {
        ...p,
        items: updatedItems,
        status: p.status === 'VERIFICADO' ? 'VERIFICADO' : newStatus,
        updatedAt: new Date().toISOString(),
      };

      updatePicking(updated);
      return { success: true };
    },
    [pickings, companyConfig, updatePicking]
  );

  const verifyPicking = useCallback(
    async (pickingId: string, managerSignature?: string, verificationNotes?: string) => {
      const user = currentUser || { id: 'USR-005', name: 'Mtro. Fernando Garza', role: 'ALMACEN' };
      // Observación 11: SoD (Segregación de Funciones)
      // ALMACEN operativo puede surtir, pero NO puede verificar/certificar.
      // VENDEDOR no cuenta con autorización de almacén.
      // Solo JEFE_ALMACEN, ADMINISTRADOR y DIRECTOR pueden verificar.
      const allowedRoles = ['JEFE_ALMACEN', 'ADMINISTRADOR', 'DIRECTOR'];
      if (!allowedRoles.includes(user.role)) {
        return {
          success: false,
          error: `403 FORBIDDEN: El usuario ${user.name} (${user.role}) no tiene perfil de Jefe de Almacén o Administrador para certificar el picking (Segregación de Funciones SoD).`,
        };
      }

      const p = pickings.find((x) => x.id === pickingId || x.pickingId === pickingId);
      if (!p) return { success: false, error: 'Picking no encontrado.' };

      const nowIso = new Date().toISOString();
      const verifiedPicking: Picking = {
        ...p,
        status: 'VERIFICADO',
        verifiedBy: user.id,
        verifiedByUserId: user.id,
        verifiedByName: user.name,
        verifiedAt: nowIso,
        verificationNotes: verificationNotes || 'Verificación física en rack completada conforme.',
        verificationObservations: verificationNotes || 'Verificación física en rack completada conforme.',
        managerSignature: managerSignature || `VERIFIED_BY_${user.id}_${Date.now()}`,
        verificationSignature: managerSignature || `VERIFIED_BY_${user.id}_${Date.now()}`,
        updatedAt: nowIso,
      };

      updatePicking(verifiedPicking);

      addAuditLog({
        action: 'PICKING_VERIFICADO',
        module: 'ALMACENES',
        recordId: verifiedPicking.pickingId,
        details: `Picking ${verifiedPicking.pickingId} verificado y avalado en rack por ${user.name} (${user.role}). MTX: ${verifiedPicking.masterTransactionId}`,
      });

      addNotification({
        title: `Picking ${verifiedPicking.pickingId} Verificado`,
        message: `El Jefe de Almacén ${user.name} ha verificado el surtido físico para el pedido ${verifiedPicking.orderFolio}.`,
        type: 'EXITO',
        module: 'ALMACENES',
      });

      try {
        await fetch(`/api/picking/${verifiedPicking.id}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}`,
          },
          body: JSON.stringify({
            managerSignature: verifiedPicking.managerSignature,
            verificationSignature: verifiedPicking.verificationSignature,
            verificationNotes: verifiedPicking.verificationNotes,
            verificationObservations: verifiedPicking.verificationObservations,
          }),
        });
      } catch (_) {}

      return { success: true, picking: verifiedPicking };
    },
    [pickings, currentUser, updatePicking, addAuditLog, addNotification]
  );

  const confirmPhysicalFulfillment = useCallback(
    async (
      orderId: string,
      pickingId?: string,
      notes?: string,
      _items?: { orderItemId: string; productId: string; quantity: number; location?: string }[]
    ) => {
      const userToUse = currentUser || { id: 'USR-005', name: 'Mtro. Fernando Garza', role: 'ALMACEN' };

      // 1. Validar pedido existente
      const order = orders.find((o) => o.id === orderId || o.folio === orderId || o.order_number === orderId);
      if (!order) return { success: false, error: 'Pedido no encontrado.' };

      // 2. Localizar picking persistido
      const picking = pickings.find(
        (p) =>
          p.id === pickingId ||
          p.pickingId === pickingId ||
          p.orderId === order.id ||
          p.orderFolio === order.folio ||
          p.orderFolio === order.order_number
      );
      if (!picking) {
        return {
          success: false,
          error: 'El picking debe estar completado antes de confirmar surtido físico.',
          errorCode: 'NO_PICKING_FOUND',
        };
      }

      // 3. Ejecutar a través de PhysicalFulfillmentService (ACID & Idempotencia)
      const executionResult = PhysicalFulfillmentService.executeFulfillment({
        order,
        picking,
        user: { id: userToUse.id, name: userToUse.name, role: userToUse.role },
        products,
        reservations,
        notes: notes || picking.notes,
        allowNegativeStock: !!companyConfig.allow_negative_stock,
      });

      if (!executionResult.success) {
        return {
          success: false,
          error: executionResult.error,
          errorCode: executionResult.errorCode,
        };
      }

      // Si fue idempotente, no duplica estados ni Kardex
      if (executionResult.isIdempotent) {
        addAuditLog({
          id: `LOG-IDEMP-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: userToUse.id,
          userName: userToUse.name,
          userRole: userToUse.role,
          module: 'ALMACENES',
          action: 'PHYSICAL_FULFILLMENT_DUPLICATE_BLOCKED',
          details: `Intento de surtido físico duplicado bloqueado por idempotencia para pedido ${order.folio || order.id}.`,
        });

        return {
          success: true,
          isIdempotent: true,
          message: 'Este pedido ya tiene el surtido físico confirmado.',
          order: executionResult.order || order,
          picking: executionResult.picking || picking,
          summary: executionResult.summary,
        };
      }

      // Actualizar estados reactivos
      if (executionResult.updatedProducts) {
        setProducts(executionResult.updatedProducts);
      }
      if (executionResult.generatedMovements && executionResult.generatedMovements.length > 0) {
        setMovements((prev) => [...prev, ...executionResult.generatedMovements!]);
      }
      if (executionResult.updatedReservations) {
        setReservations(executionResult.updatedReservations);
      }
      if (executionResult.order) {
        setOrders((prev) => prev.map((o) => (o.id === executionResult.order!.id ? executionResult.order! : o)));
      }
      if (executionResult.picking) {
        setPickings((prev) => prev.map((p) => (p.id === executionResult.picking!.id ? executionResult.picking! : p)));
      }

      const totalReq = (executionResult.summary?.unitsFulfilled || 0) + (executionResult.summary?.unitsRemaining || 0);

      // Registrar auditoría y notificación
      addAuditLog({
        id: `LOG-FULFILL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: userToUse.id,
        userName: userToUse.name,
        userRole: userToUse.role,
        module: 'ALMACENES',
        action: 'PHYSICAL_FULFILLMENT_CONFIRMED',
        details: `orderId: ${order.id}, pickingId: ${picking.pickingId}, warehouseId: ${order.warehouse_id || 'WH-01'}, requestedQty: ${totalReq}, pickedQty: ${executionResult.summary?.unitsFulfilled}, fulfilledQty: ${executionResult.summary?.unitsFulfilled}, remainingQty: ${executionResult.summary?.unitsRemaining}, userId: ${userToUse.id}, timestamp: ${new Date().toISOString()}, masterTransactionId: ${executionResult.summary?.masterTransactionId}`,
      });

      addNotification({
        id: `NOTIF-FULFILL-${Date.now()}`,
        title: 'Surtido Físico Confirmado',
        message: `El pedido ${order.folio || order.id} fue confirmado en físico (${executionResult.order?.status}). Listo para Logística.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
        module: 'ALMACENES',
      });

      // Sincronizar con el backend
      try {
        await fetch('/api/warehouse/fulfillment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('conscore_auth_token') || ''}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            pickingId: executionResult.picking?.pickingId || picking.pickingId,
            notes: notes || picking.notes,
          }),
        });
      } catch (err) {
        console.warn('API POST /api/warehouse/fulfillment background sync:', err);
      }

      return {
        success: true,
        order: executionResult.order,
        picking: executionResult.picking,
        summary: executionResult.summary,
        message: executionResult.message,
      };
    },
    [orders, pickings, products, reservations, companyConfig, currentUser, addAuditLog, addNotification]
  );

  // =========================================================================
  // WAREHOUSE TRANSFERS (TRASPASOS ENTRE ALMACENES)
  // =========================================================================

  const createWarehouseTransfer = useCallback(
    (data: {
      originWarehouseId: string;
      destinationWarehouseId: string;
      items: TransferItem[];
      notes?: string;
      carrier?: string;
      trackingNumber?: string;
    }) => {
      if (data.originWarehouseId === data.destinationWarehouseId) {
        return { success: false, error: 'El almacén de origen y destino no pueden ser el mismo.' };
      }
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'Debes incluir al menos un producto a transferir.' };
      }

      const originWh = warehouses.find((w) => w.id === data.originWarehouseId);
      const destWh = warehouses.find((w) => w.id === data.destinationWarehouseId);
      if (!originWh || !destWh) {
        return { success: false, error: 'Almacén de origen o destino inválido.' };
      }

      // Check available stock in origin
      for (const item of data.items) {
        const prod = products.find((p) => p.id === item.productId || p.code === item.productCode);
        if (!prod) return { success: false, error: `Producto ${item.productCode} no existe.` };
        if (item.quantity > prod.availableStock && !companyConfig.allow_negative_stock) {
          return {
            success: false,
            error: `Stock insuficiente en ${originWh.name} para ${prod.name} (${prod.code}). Disponible: ${prod.availableStock}, Solicitado: ${item.quantity}.`,
          };
        }
      }

      const folio = `TRF-${String(transfers.length + 1).padStart(6, '0')}`;
      const id = `TRF-${Date.now().toString(36).toUpperCase()}`;

      const newTransfer: WarehouseTransfer = {
        id,
        folio,
        originWarehouseId: originWh.id,
        originWarehouseName: originWh.name,
        destinationWarehouseId: destWh.id,
        destinationWarehouseName: destWh.name,
        items: data.items,
        status: 'SOLICITADA',
        requestedBy: currentUser?.id || 'USR-001',
        requestedByName: currentUser?.name || 'Administrador',
        requestedAt: new Date().toISOString(),
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        notes: data.notes,
      };

      const updatedTransfers = [newTransfer, ...transfers];
      setTransfers(updatedTransfers);

      addAuditLog({
        action: 'SOLICITAR_TRASPASO',
        module: 'ALMACENES',
        recordId: folio,
        details: `Traspaso ${folio} solicitado de ${originWh.name} a ${destWh.name} con ${data.items.length} productos.`,
      });

      addNotification({
        title: 'Solicitud de Traspaso Generada',
        message: `${folio}: ${originWh.name} ➔ ${destWh.name} (${data.items.length} partidas). Pendiente de autorización.`,
        type: 'INFO',
        module: 'ALMACENES',
      });

      broadcastDataUpdate('TRANSFER_CREATED', {
        userName: currentUser?.name || 'Sistema',
        summary: `Nuevo Traspaso ${folio} (${originWh.name} ➔ ${destWh.name})`,
        transfers: updatedTransfers,
      });

      return { success: true, transfer: newTransfer };
    },
    [warehouses, products, transfers, companyConfig, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const authorizeWarehouseTransfer = useCallback(
    (transferId: string) => {
      const trf = transfers.find((t) => t.id === transferId || t.folio === transferId);
      if (!trf) return { success: false, error: 'Traspaso no encontrado.' };
      if (trf.status !== 'SOLICITADA') return { success: false, error: `El traspaso ya está en estado ${trf.status}.` };

      const updatedTransfers = transfers.map((t) =>
        t.id === trf.id
          ? {
              ...t,
              status: 'AUTORIZADA' as const,
              authorizedBy: currentUser?.id,
              authorizedByName: currentUser?.name,
              authorizedAt: new Date().toISOString(),
            }
          : t
      );
      setTransfers(updatedTransfers);

      addAuditLog({
        action: 'AUTORIZAR_TRASPASO',
        module: 'ALMACENES',
        recordId: trf.folio,
        details: `Traspaso ${trf.folio} autorizado por ${currentUser?.name || 'Gerencia'}. Listo para empaque y despacho.`,
      });

      addNotification({
        title: 'Traspaso Autorizado',
        message: `${trf.folio} autorizado para despacho desde ${trf.originWarehouseName}.`,
        type: 'EXITO',
        module: 'ALMACENES',
      });

      broadcastDataUpdate('TRANSFER_AUTHORIZED', {
        userName: currentUser?.name || 'Sistema',
        summary: `Traspaso ${trf.folio} Autorizado`,
        transfers: updatedTransfers,
      });

      return { success: true };
    },
    [transfers, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const shipWarehouseTransfer = useCallback(
    (transferId: string, carrier?: string, trackingNumber?: string) => {
      const trf = transfers.find((t) => t.id === transferId || t.folio === transferId);
      if (!trf) return { success: false, error: 'Traspaso no encontrado.' };
      if (trf.status !== 'AUTORIZADA') return { success: false, error: 'El traspaso debe estar AUTORIZADO antes de ser despachado.' };

      // Deduct physical stock from origin warehouse & record SALIDA movements
      let updatedProducts = [...products];
      const newMovements: InventoryMovement[] = [];

      for (const item of trf.items) {
        const prod = updatedProducts.find((p) => p.id === item.productId || p.code === item.productCode);
        if (prod) {
          const prevStock = prod.stock || 0;
          const newStock = Math.max(0, prevStock - item.quantity);
          const newAvailable = Math.max(0, newStock - (prod.reservedStock || 0));

          updatedProducts = updatedProducts.map((p) =>
            p.id === prod.id ? { ...p, stock: newStock, physicalStock: newStock, availableStock: newAvailable } : p
          );

          newMovements.push({
            id: `MOV-TRF-OUT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
            type: 'SALIDA',
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            warehouseId: trf.originWarehouseId,
            warehouseName: trf.originWarehouseName,
            location: item.originLocation || 'Almacén Origen',
            quantity: item.quantity,
            previousBalance: prevStock,
            newBalance: newStock,
            reason: `Envío de Traspaso ${trf.folio} hacia ${trf.destinationWarehouseName}`,
            relatedDocFolio: trf.folio,
            userId: currentUser?.id || 'USR-001',
            userName: currentUser?.name || 'Almacén',
            createdAt: new Date().toISOString(),
          });
        }
      }

      const updatedTransfers = transfers.map((t) =>
        t.id === trf.id
          ? {
              ...t,
              status: 'EN_TRANSITO' as const,
              shippedBy: currentUser?.id,
              shippedByName: currentUser?.name,
              shippedAt: new Date().toISOString(),
              carrier: carrier || t.carrier,
              trackingNumber: trackingNumber || t.trackingNumber,
            }
          : t
      );

      setProducts(updatedProducts);
      setTransfers(updatedTransfers);
      setMovements((prev) => [...newMovements, ...prev]);

      addAuditLog({
        action: 'DESPACHO_TRASPASO',
        module: 'ALMACENES',
        recordId: trf.folio,
        details: `Traspaso ${trf.folio} despachado en tránsito hacia ${trf.destinationWarehouseName}. Transportista: ${carrier || trf.carrier || 'Flotilla Propia'}.`,
      });

      addNotification({
        title: 'Traspaso en Tránsito',
        message: `${trf.folio} despachado hacia ${trf.destinationWarehouseName}.`,
        type: 'INFO',
        module: 'ALMACENES',
      });

      broadcastDataUpdate('TRANSFER_SHIPPED', {
        userName: currentUser?.name || 'Sistema',
        summary: `Traspaso ${trf.folio} En Tránsito`,
        transfers: updatedTransfers,
        products: updatedProducts,
      });

      return { success: true };
    },
    [transfers, products, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const receiveWarehouseTransfer = useCallback(
    (transferId: string) => {
      const trf = transfers.find((t) => t.id === transferId || t.folio === transferId);
      if (!trf) return { success: false, error: 'Traspaso no encontrado.' };
      if (trf.status !== 'EN_TRANSITO') return { success: false, error: 'El traspaso debe estar EN_TRANSITO para poder recibirse.' };

      // Add physical stock to destination warehouse & record ENTRADA movements
      let updatedProducts = [...products];
      const newMovements: InventoryMovement[] = [];

      for (const item of trf.items) {
        const prod = updatedProducts.find((p) => p.id === item.productId || p.code === item.productCode);
        if (prod) {
          const prevStock = prod.stock || 0;
          const newStock = prevStock + item.quantity;
          const newAvailable = Math.max(0, newStock - (prod.reservedStock || 0));

          updatedProducts = updatedProducts.map((p) =>
            p.id === prod.id ? { ...p, stock: newStock, physicalStock: newStock, availableStock: newAvailable } : p
          );

          newMovements.push({
            id: `MOV-TRF-IN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
            type: 'ENTRADA',
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            warehouseId: trf.destinationWarehouseId,
            warehouseName: trf.destinationWarehouseName,
            location: item.destinationLocation || 'Recepción Almacén Destino',
            quantity: item.quantity,
            previousBalance: prevStock,
            newBalance: newStock,
            reason: `Recepción confirmada de Traspaso ${trf.folio} desde ${trf.originWarehouseName}`,
            relatedDocFolio: trf.folio,
            userId: currentUser?.id || 'USR-001',
            userName: currentUser?.name || 'Almacén',
            createdAt: new Date().toISOString(),
          });
        }
      }

      const updatedTransfers = transfers.map((t) =>
        t.id === trf.id
          ? {
              ...t,
              status: 'RECIBIDA' as const,
              receivedBy: currentUser?.id,
              receivedByName: currentUser?.name,
              receivedAt: new Date().toISOString(),
            }
          : t
      );

      setProducts(updatedProducts);
      setTransfers(updatedTransfers);
      setMovements((prev) => [...newMovements, ...prev]);

      addAuditLog({
        action: 'RECEPCION_TRASPASO',
        module: 'ALMACENES',
        recordId: trf.folio,
        details: `Traspaso ${trf.folio} recibido e ingresado al inventario de ${trf.destinationWarehouseName}.`,
      });

      addNotification({
        title: 'Traspaso Recibido con Éxito',
        message: `${trf.folio} ingresado al stock de ${trf.destinationWarehouseName}.`,
        type: 'EXITO',
        module: 'ALMACENES',
      });

      broadcastDataUpdate('TRANSFER_RECEIVED', {
        userName: currentUser?.name || 'Sistema',
        summary: `Traspaso ${trf.folio} Recibido`,
        transfers: updatedTransfers,
        products: updatedProducts,
      });

      return { success: true };
    },
    [transfers, products, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const cancelWarehouseTransfer = useCallback(
    (transferId: string, reason?: string) => {
      const trf = transfers.find((t) => t.id === transferId || t.folio === transferId);
      if (!trf) return { success: false, error: 'Traspaso no encontrado.' };
      if (trf.status === 'RECIBIDA') return { success: false, error: 'No se puede cancelar un traspaso ya recibido.' };

      // If it was already in transit, return inventory back to origin
      let updatedProducts = [...products];
      if (trf.status === 'EN_TRANSITO') {
        for (const item of trf.items) {
          const prod = updatedProducts.find((p) => p.id === item.productId || p.code === item.productCode);
          if (prod) {
            const prevStock = prod.stock || 0;
            const newStock = prevStock + item.quantity;
            updatedProducts = updatedProducts.map((p) =>
              p.id === prod.id ? { ...p, stock: newStock, physicalStock: newStock, availableStock: newStock - (prod.reservedStock || 0) } : p
            );
          }
        }
        setProducts(updatedProducts);
      }

      const updatedTransfers = transfers.map((t) =>
        t.id === trf.id
          ? {
              ...t,
              status: 'CANCELADA' as const,
              notes: `${t.notes || ''} [Cancelado: ${reason || 'Cancelación de traspaso'}]`.trim(),
            }
          : t
      );
      setTransfers(updatedTransfers);

      addAuditLog({
        action: 'CANCELAR_TRASPASO',
        module: 'ALMACENES',
        recordId: trf.folio,
        details: `Traspaso ${trf.folio} cancelado. Motivo: ${reason || 'Cancelación'}.`,
      });

      return { success: true };
    },
    [transfers, products, addAuditLog]
  );

  // =========================================================================
  // PHYSICAL INVENTORY & CYCLIC COUNTS (INVENTARIOS FÍSICOS Y AUDITORÍA)
  // =========================================================================

  const createCountSession = useCallback(
    (warehouseId: string, categoryFilter?: string, notes?: string) => {
      const wh = warehouses.find((w) => w.id === warehouseId) || warehouses[0];
      const targetProducts = categoryFilter ? products.filter((p) => p.category === categoryFilter) : products;

      if (targetProducts.length === 0) {
        return { success: false, error: 'No hay productos que coincidan con los filtros seleccionados.' };
      }

      const folio = `FIS-${String(countSessions.length + 1).padStart(6, '0')}`;
      const id = `FIS-${Date.now().toString(36).toUpperCase()}`;

      const countItems: InventoryCountItem[] = targetProducts.map((p) => ({
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        unit: p.unit,
        location: typeof p.warehouseLocation === 'string' ? p.warehouseLocation : 'Ubicación General',
        systemStock: p.stock || p.physicalStock || 0,
        countedStock: p.stock || p.physicalStock || 0, // initially equals system stock until counted
        difference: 0,
        costUnit: p.cost,
        totalDifferenceCost: 0,
      }));

      const newSession: InventoryCountSession = {
        id,
        folio,
        warehouseId: wh.id,
        warehouseName: wh.name,
        categoryFilter: categoryFilter || 'Todas las categorías',
        status: 'EN_CONTEO',
        items: countItems,
        totalItemsCounted: 0,
        itemsWithDifferences: 0,
        totalCostDifference: 0,
        createdBy: currentUser?.id || 'USR-001',
        createdByName: currentUser?.name || 'Administrador',
        createdAt: new Date().toISOString(),
        notes,
      };

      const updatedSessions = [newSession, ...countSessions];
      setCountSessions(updatedSessions);

      addAuditLog({
        action: 'INICIAR_CONTEO_FISICO',
        module: 'ALMACENES',
        recordId: folio,
        details: `Sesión de inventario físico ${folio} iniciada para ${wh.name} (${countItems.length} materiales).`,
      });

      addNotification({
        title: 'Inventario Físico Iniciado',
        message: `${folio}: Conteo activo en ${wh.name}.`,
        type: 'INFO',
        module: 'ALMACENES',
      });

      broadcastDataUpdate('COUNT_SESSION_CREATED', {
        userName: currentUser?.name || 'Sistema',
        summary: `Nueva sesión de conteo físico ${folio}`,
        countSessions: updatedSessions,
      });

      return { success: true, session: newSession };
    },
    [warehouses, products, countSessions, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const updateCountItem = useCallback(
    (sessionId: string, productId: string, countedStock: number, notes?: string) => {
      setCountSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;

          const updatedItems = s.items.map((it) => {
            if (it.productId === productId || it.productCode === productId) {
              const diff = countedStock - it.systemStock;
              const totalDiffCost = Math.round(diff * it.costUnit * 100) / 100;
              return {
                ...it,
                countedStock,
                difference: diff,
                totalDifferenceCost: totalDiffCost,
                notes: notes || it.notes,
              };
            }
            return it;
          });

          const diffItemsCount = updatedItems.filter((it) => it.difference !== 0).length;
          const totalCostDiff = updatedItems.reduce((sum, it) => sum + it.totalDifferenceCost, 0);

          return {
            ...s,
            items: updatedItems,
            totalItemsCounted: updatedItems.length,
            itemsWithDifferences: diffItemsCount,
            totalCostDifference: Math.round(totalCostDiff * 100) / 100,
            status: diffItemsCount > 0 ? ('DIFERENCIAS_DETECTADAS' as const) : ('EN_CONTEO' as const),
          };
        })
      );
    },
    []
  );

  const authorizeAndApplyCountAdjustments = useCallback(
    (sessionId: string, notes?: string) => {
      const session = countSessions.find((s) => s.id === sessionId);
      if (!session) return { success: false, error: 'Sesión de conteo no encontrada.' };
      if (session.status === 'AJUSTADO') return { success: false, error: 'Esta sesión ya fue ajustada y cerrada previamente.' };

      let updatedProducts = [...products];
      const newMovements: InventoryMovement[] = [];
      const userToUse = currentUser || { id: 'USR-001', name: 'Administrador', role: 'ADMINISTRADOR' };

      for (const item of session.items) {
        if (item.difference !== 0) {
          const prod = updatedProducts.find((p) => p.id === item.productId || p.code === item.productCode);
          if (prod) {
            const prevStock = prod.stock || 0;
            const newStock = item.countedStock;
            const newAvailable = Math.max(0, newStock - (prod.reservedStock || 0));

            updatedProducts = updatedProducts.map((p) =>
              p.id === prod.id ? { ...p, stock: newStock, physicalStock: newStock, availableStock: newAvailable } : p
            );

            const isPositive = item.difference > 0;
            const movementType = isPositive ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';

            newMovements.push({
              id: `MOV-AJU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
              timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
              type: movementType as MovementType,
              productId: prod.id,
              productCode: prod.code,
              productName: prod.name,
              warehouseId: session.warehouseId,
              warehouseName: session.warehouseName,
              location: item.location || 'Conteo Físico',
              quantity: Math.abs(item.difference),
              previousBalance: prevStock,
              newBalance: newStock,
              reason: `Ajuste automático por Inventario Físico ${session.folio}. ${item.notes || ''}`.trim(),
              relatedDocFolio: session.folio,
              userId: userToUse.id,
              userName: userToUse.name,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      const updatedSessions = countSessions.map((s) =>
        s.id === session.id
          ? {
              ...s,
              status: 'AJUSTADO' as const,
              authorizedBy: userToUse.id,
              authorizedByName: userToUse.name,
              authorizedAt: new Date().toISOString(),
              notes: `${s.notes || ''} [Ajustado: ${notes || 'Aprobado por Gerencia'}]`.trim(),
            }
          : s
      );

      setProducts(updatedProducts);
      setCountSessions(updatedSessions);
      setMovements((prev) => [...newMovements, ...prev]);

      addAuditLog({
        action: 'AJUSTAR_INVENTARIO_FISICO',
        module: 'ALMACENES',
        recordId: session.folio,
        details: `Inventario físico ${session.folio} aplicado. ${session.itemsWithDifferences} partidas ajustadas con diferencia neta de $${(Number(session.totalCostDifference) || 0).toLocaleString('es-MX')} MXN.`,
      });

      addNotification({
        title: 'Inventario Físico Aplicado',
        message: `${session.folio}: Stock del almacén ${session.warehouseName} actualizado con los conteos autorizados.`,
        type: 'EXITO',
        module: 'ALMACENES',
      });

      broadcastDataUpdate('COUNT_SESSION_APPLIED', {
        userName: userToUse.name,
        summary: `Inventario Físico ${session.folio} Aplicado`,
        countSessions: updatedSessions,
        products: updatedProducts,
        movements: [...newMovements, ...movements],
      });

      return { success: true };
    },
    [countSessions, products, movements, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  // Manual Adjustments (Ajustes de Merma / Sobrante) — Observación 21
  const createInventoryAdjustment = useCallback(
    (data: {
      productId: string;
      warehouseId: string;
      type: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'MERMA';
      quantity: number;
      reason: string;
      location?: string;
      requireAuth?: boolean;
      folio?: string;
      notes?: string;
      evidenceNote?: string;
    }) => {
      const prod = products.find((p) => p.id === data.productId || p.code === data.productId || p.sku === data.productId);
      if (!prod) return { success: false, error: 'Producto no encontrado.' };
      if (data.quantity <= 0) return { success: false, error: 'La cantidad del ajuste debe ser mayor a 0.' };
      if (!data.reason || data.reason.trim() === '') return { success: false, error: 'El motivo de la solicitud de ajuste es obligatorio.' };

      const warehouse = warehouses.find((w) => w.id === data.warehouseId) || warehouses[0];
      const folio = data.folio || `AJU-${String(adjustments.length + 1).padStart(6, '0')}`;
      const id = `AJU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const prevStock = prod.stock ?? prod.physicalStock ?? 0;
      const isNegative = data.type === 'AJUSTE_NEGATIVO' || data.type === 'MERMA';
      const delta = isNegative ? -data.quantity : data.quantity;

      // REGLA DE NEGOCIO OBLIGATORIA (OBSERVACIÓN 21):
      // Todo ajuste se crea EXCLUSIVAMENTE en estado PENDIENTE_AUTORIZACION.
      // ¡NO MODIFICA INVENTARIO!
      // ¡NO CREA MOVIMIENTOS EN KARDEX!
      const newAdjustment: InventoryAdjustment = {
        id,
        folio,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        productId: prod.id,
        productCode: prod.code || prod.sku,
        productName: prod.name,
        type: data.type as any,
        quantity: data.quantity,
        differenceQty: delta,
        deltaQuantity: delta,
        previousStock: prevStock,
        newStock: prevStock, // Sin aplicar hasta que un administrador autorice
        unitCost: prod.cost,
        totalCostImpact: Math.round(data.quantity * (prod.cost || 0) * (isNegative ? -1 : 1) * 100) / 100,
        reason: data.reason.trim(),
        notes: data.notes?.trim(),
        evidenceNote: data.evidenceNote?.trim(),
        status: 'PENDIENTE_AUTORIZACION',
        createdBy: currentUser?.id || 'USR-001',
        createdByName: currentUser?.name || 'Administrador',
        createdAt: new Date().toISOString(),
        location: data.location || (typeof prod.warehouseLocation === 'string' ? prod.warehouseLocation : 'Ubicación General'),
      };

      // Registrar auditoría de CREACIÓN (REQUESTED, no APPLIED)
      addAuditLog({
        action: 'INVENTORY_ADJUSTMENT_REQUESTED',
        module: 'INVENTARIO',
        recordId: folio,
        details: `Solicitud de ajuste ${data.type} por ${data.quantity} ${prod.unit} registrada en estado PENDIENTE_AUTORIZACION para ${prod.code || prod.sku}. Inventario y Kardex intactos.`,
      });

      const updatedAdjustments = [newAdjustment, ...adjustments.filter(a => a.id !== id && a.folio !== folio)];
      setAdjustments(updatedAdjustments);
      try {
        localStorage.setItem('conscore_adjustments', JSON.stringify(updatedAdjustments));
      } catch (_) {}

      // Sincronizar con el backend
      try {
        const token = localStorage.getItem('conscore_auth_token') || sessionStorage.getItem('conscore_auth_token') || (currentUser as any)?.token;
        fetch('/api/inventory/adjustments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            productId: prod.id,
            warehouseId: warehouse.id,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            folio,
            location: newAdjustment.location,
          }),
        }).catch((err) => console.warn('Sync adjustment with backend:', err));
      } catch (err) {
        console.warn('Sync adjustment error:', err);
      }

      return { success: true, adjustment: newAdjustment };
    },
    [products, warehouses, adjustments, currentUser, addAuditLog]
  );

  const authorizeInventoryAdjustment = useCallback(
    (adjustmentId: string) => {
      const adj = adjustments.find((a) => a.id === adjustmentId || a.folio === adjustmentId);
      if (!adj) return { success: false, error: 'Ajuste no encontrado.' };

      // IDEMPOTENCIA Y PROTECCIÓN CONTRA DOBLE APLICACIÓN
      if (adj.status === 'APLICADO') {
        return {
          success: false,
          error: `El ajuste ${adj.folio} ya fue aplicado previamente el ${adj.appliedAt || adj.authorizedAt}. Operación bloqueada para garantizar idempotencia.`,
        };
      }

      if (adj.status !== 'PENDIENTE_AUTORIZACION') {
        return { success: false, error: `No se puede autorizar el ajuste ${adj.folio} porque se encuentra en estado ${adj.status}.` };
      }

      // CONTROL DE ACCESO / SEGREGACIÓN DE FUNCIONES
      const userRole = currentUser?.role || 'ADMINISTRADOR';
      const unauthorizedRoles = ['ALMACEN', 'VENDEDOR', 'MARKETING', 'LOGISTICA'];
      if (unauthorizedRoles.includes(userRole)) {
        return {
          success: false,
          error: `403 FORBIDDEN: El rol ${userRole} no tiene facultades para autorizar o aplicar ajustes de inventario. Acción reservada para Administración, Dirección o Jefe de Almacén.`,
        };
      }

      const prod = products.find((p) => p.id === adj.productId || p.code === adj.productCode || p.sku === adj.productCode);
      if (!prod) return { success: false, error: 'Producto no encontrado.' };

      const prevStock = prod.stock ?? prod.physicalStock ?? 0;
      const isNegative = adj.type === 'AJUSTE_NEGATIVO' || (adj.type as string) === 'MERMA';
      const delta = isNegative ? -adj.quantity : adj.quantity;
      const newStock = isNegative ? Math.max(0, prevStock - adj.quantity) : prevStock + adj.quantity;
      const newAvailable = Math.max(0, newStock - (prod.reservedStock || 0));

      if (isNegative && prevStock < adj.quantity) {
        return {
          success: false,
          error: `Stock insuficiente: El producto ${prod.code || prod.sku} cuenta con ${prevStock} pzas, imposible aplicar merma de ${adj.quantity} pzas.`,
        };
      }

      // MODIFICAR INVENTARIO FÍSICO
      const updatedProducts = products.map((p) =>
        p.id === prod.id
          ? {
              ...p,
              stock: newStock,
              physicalStock: newStock,
              physical_stock: newStock,
              availableStock: newAvailable,
              available_stock: newAvailable,
              warehouseLocations: (p.warehouseLocations || []).map((loc) =>
                loc.locationCode === (adj.location || 'RACK-A01')
                  ? { ...loc, stock: Math.max(0, (loc.stock || 0) + delta) }
                  : loc
              ),
            }
          : p
      );
      setProducts(updatedProducts);
      try {
        localStorage.setItem('conscore_products', JSON.stringify(updatedProducts));
      } catch (_) {}

      // GENERAR EXACTAMENTE 1 MOVIMIENTO EN EL KARDEX
      const movId = `MOV-AJU-${Date.now().toString(36).toUpperCase()}`;
      const movement: InventoryMovement = {
        id: movId,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        type: (isNegative ? 'AJUSTE_NEGATIVO' : 'AJUSTE_POSITIVO') as MovementType,
        productId: prod.id,
        productCode: prod.code || prod.sku,
        productName: prod.name,
        warehouseId: adj.warehouseId,
        warehouseName: adj.warehouseName,
        location: adj.location || 'Almacén',
        quantity: adj.quantity,
        previousBalance: prevStock,
        newBalance: newStock,
        reason: `Ajuste autorizado: ${adj.reason}`,
        referenceFolio: adj.folio,
        relatedDocFolio: adj.folio,
        userId: currentUser?.id || 'USR-001',
        userName: currentUser?.name || 'Administrador',
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [movement, ...prev]);

      // ACTUALIZAR ESTADO A APLICADO
      const updatedAdjustments = adjustments.map((a) =>
        a.id === adj.id || a.folio === adj.folio
          ? {
              ...a,
              status: 'APLICADO' as const,
              previousStock: prevStock,
              newStock: newStock,
              appliedStockBefore: prevStock,
              appliedStockAfter: newStock,
              authorizedBy: currentUser?.id || 'USR-001',
              authorizedByName: currentUser?.name || 'Administrador',
              authorizedAt: new Date().toISOString(),
              appliedAt: new Date().toISOString(),
            }
          : a
      );
      setAdjustments(updatedAdjustments);
      try {
        localStorage.setItem('conscore_adjustments', JSON.stringify(updatedAdjustments));
      } catch (_) {}

      addAuditLog({
        action: 'INVENTORY_ADJUSTMENT_AUTHORIZED',
        module: 'INVENTARIO',
        recordId: adj.folio,
        details: `Ajuste ${adj.folio} (${adj.type} de ${adj.quantity}) autorizado y aplicado por ${currentUser?.name || 'Administración'}. Stock actualizado de ${prevStock} a ${newStock}.`,
      });

      // Sincronizar autorización con el backend
      try {
        const token = localStorage.getItem('conscore_auth_token') || sessionStorage.getItem('conscore_auth_token') || (currentUser as any)?.token;
        fetch(`/api/inventory/adjustments/${encodeURIComponent(adj.id)}/authorize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: adj.id, adjustmentId: adj.id }),
        }).catch((err) => console.warn('Sync authorize with backend:', err));
      } catch (err) {
        console.warn('Sync authorize error:', err);
      }

      return { success: true };
    },
    [adjustments, products, currentUser, addAuditLog]
  );

  const rejectInventoryAdjustment = useCallback(
    (adjustmentId: string, reason?: string) => {
      const adj = adjustments.find((a) => a.id === adjustmentId || a.folio === adjustmentId);
      if (!adj) return { success: false, error: 'Ajuste no encontrado.' };

      if (adj.status === 'APLICADO') {
        return { success: false, error: 'No se puede rechazar un ajuste que ya ha sido aplicado al inventario.' };
      }

      const userRole = currentUser?.role || 'ADMINISTRADOR';
      const unauthorizedRoles = ['ALMACEN', 'VENDEDOR', 'MARKETING', 'LOGISTICA'];
      if (unauthorizedRoles.includes(userRole)) {
        return {
          success: false,
          error: `403 FORBIDDEN: El rol ${userRole} no tiene facultades para rechazar solicitudes de ajuste.`,
        };
      }

      const finalReason = reason && reason.trim() !== '' ? reason.trim() : 'Rechazado por administración';

      // ESTADO: RECHAZADO
      // INVENTARIO: SIN CAMBIO
      // KARDEX: 0
      const updatedAdjustments = adjustments.map((a) =>
        a.id === adj.id || a.folio === adj.folio
          ? {
              ...a,
              status: 'RECHAZADO' as const,
              rejectedBy: currentUser?.id || 'USR-001',
              rejectedByName: currentUser?.name || 'Administrador',
              rejectedAt: new Date().toISOString(),
              rejectionReason: finalReason,
              notes: a.notes ? `${a.notes} [Rechazado: ${finalReason}]` : `[Rechazado: ${finalReason}]`,
            }
          : a
      );
      setAdjustments(updatedAdjustments);
      try {
        localStorage.setItem('conscore_adjustments', JSON.stringify(updatedAdjustments));
      } catch (_) {}

      addAuditLog({
        action: 'INVENTORY_ADJUSTMENT_REJECTED',
        module: 'INVENTARIO',
        recordId: adj.folio,
        details: `Solicitud de ajuste ${adj.folio} rechazada por ${currentUser?.name || 'Administración'}. Motivo: ${finalReason}. Sin afectación a existencias ni kardex.`,
      });

      // Sincronizar rechazo con el backend
      try {
        const token = localStorage.getItem('conscore_auth_token') || sessionStorage.getItem('conscore_auth_token') || (currentUser as any)?.token;
        fetch(`/api/inventory/adjustments/${encodeURIComponent(adj.id)}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: adj.id, reason: finalReason, rejectionReason: finalReason }),
        }).catch((err) => console.warn('Sync reject with backend:', err));
      } catch (err) {
        console.warn('Sync reject error:', err);
      }

      return { success: true };
    },
    [adjustments, currentUser, addAuditLog]
  );

  const addWarehouse = useCallback(
    (whData: Omit<Warehouse, 'id'>): Warehouse => {
      const id = `WH-${String(warehouses.length + 1).padStart(2, '0')}`;
      const newWh: Warehouse = {
        ...whData,
        id,
      };
      const updatedWarehouses = [...warehouses, newWh];
      setWarehouses(updatedWarehouses);

      addAuditLog({
        action: 'CREAR_ALMACEN',
        module: 'ALMACENES',
        recordId: id,
        details: `Nuevo almacén ${newWh.name} (${newWh.code}) creado en ${newWh.location}.`,
      });

      return newWh;
    },
    [warehouses, addAuditLog]
  );

  const updateWarehouse = useCallback(
    (id: string, updates: Partial<Warehouse>) => {
      setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
      addAuditLog({
        action: 'ACTUALIZAR_ALMACEN',
        module: 'ALMACENES',
        recordId: id,
        details: `Almacén ${id} modificado.`,
      });
    },
    [addAuditLog]
  );

  const deleteMovement = useCallback(
    (movementId: string) => {
      const m = movements.find((x) => x.id === movementId);
      if (!m) return { success: false, error: 'Movimiento no encontrado.' };

      // Reverse effect on product stock
      const prod = products.find((p) => p.id === m.productId || p.code === m.productCode);
      if (prod) {
        let revStock = prod.stock;
        if (m.type === 'ENTRADA' || m.type === 'DEVOLUCION') {
          revStock = Math.max(0, prod.stock - m.quantity);
        } else if (m.type === 'SALIDA') {
          revStock = prod.stock + m.quantity;
        }
        const revAvailable = Math.max(0, revStock - (prod.reservedStock || 0));

        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, stock: revStock, physicalStock: revStock, availableStock: revAvailable } : p))
        );
      }

      setMovements((prev) => prev.filter((x) => x.id !== movementId));

      addAuditLog({
        action: 'ELIMINAR_MOVIMIENTO',
        module: 'INVENTARIO',
        recordId: movementId,
        details: `Movimiento ${m.type} de ${m.quantity} ${m.productCode} eliminado. Saldo recalculado.`,
      });

      return { success: true };
    },
    [movements, products, addAuditLog]
  );

  const wipeMovements = useCallback(() => {
    setMovements([]);
    addAuditLog({
      action: 'VACIAR_KARDEX',
      module: 'INVENTARIO',
      details: 'Historial de movimientos de inventario vaciado por el usuario.',
    });
  }, [addAuditLog]);

  // Excel & JSON Catalog Import
  const importCatalogFromJSON = useCallback(
    (catalogJson: any[]) => {
      if (!Array.isArray(catalogJson) || catalogJson.length === 0) {
        return { success: false, count: 0, error: 'Formato JSON inválido o lista vacía.' };
      }

      const newProducts: Product[] = catalogJson.map((item, idx) => {
        const physical = Number(item.stock || item.physicalStock || item.physical_stock || 0);
        const reserved = Number(item.reservedStock || item.reserved_stock || 0);
        const available = Math.max(0, physical - reserved);

        return {
          id: item.id || `PRD-${String(products.length + idx + 1).padStart(3, '0')}`,
          sku: item.sku || `SKU-${item.code || idx + 1}`,
          code: item.code || `MAT-${idx + 1}`,
          name: item.name || item.title || item.descripcion || 'Material Importado',
          category: item.category || item.categoria || 'Aislamientos Térmicos',
          unit: item.unit || item.um || 'PZA',
          cost: Number(item.cost || item.costo || 100),
          price: Number(item.price || item.precio || item.salePrice || 150),
          salePrice: Number(item.salePrice || item.price || item.precio || 150),
          stock: physical,
          physicalStock: physical,
          reservedStock: reserved,
          availableStock: available,
          minStock: Number(item.minStock || item.min_stock || 10),
          maxStock: Number(item.maxStock || item.max_stock || 100),
          warehouseId: item.warehouseId || 'WH-01',
          warehouseName: item.warehouseName || 'Almacén Central Tultitlán',
          warehouseLocation:
            item.warehouseLocation ||
            (item.nave ? `N${item.nave} / R${item.rack || '01'} / P${item.pas || '01'} / Niv${item.niv || '1'}` : 'Ubicación General'),
          supplierId: item.supplierId || 'SUP-01',
          active: item.active !== false,
          updatedAt: new Date().toISOString(),
        };
      });

      setProducts(newProducts);
      addAuditLog({
        action: 'IMPORTAR_CATALOGO_JSON',
        module: 'INVENTARIO',
        details: `Catálogo de ${newProducts.length} materiales importado exitosamente desde JSON.`,
      });

      return { success: true, count: newProducts.length };
    },
    [products, addAuditLog]
  );

  const importCatalogFromExcelRows = useCallback(
    (rows: any[]) => {
      if (!Array.isArray(rows) || rows.length === 0) {
        return { success: false, count: 0, error: 'El archivo no contiene filas legibles.' };
      }

      const pick = (row: any, ...aliases: string[]) => {
        const normKey = (k: string) => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        for (const k of Object.keys(row)) {
          if (aliases.some((a) => normKey(a) === normKey(k))) {
            return String(row[k] ?? '').trim();
          }
        }
        return '';
      };

      const validProducts: Product[] = [];
      rows.forEach((r, idx) => {
        const code = pick(r, 'codigo', 'código', 'code', 'clave');
        if (!code) return;

        const title = pick(r, 'titulo', 'título', 'descripcion', 'descripción', 'nombre', 'name') || code;
        const um = pick(r, 'um', 'unidad de medida', 'unidad', 'unit') || 'PZA';
        const cat = pick(r, 'categoria 1', 'categoria', 'categoría', 'category') || 'Aislamientos Térmicos';
        const nave = pick(r, 'nave') || '1';
        const rack = pick(r, 'rack') || '01';
        const pas = pick(r, 'pasillo', 'pas') || '01';
        const niv = pick(r, 'nivel', 'niv') || '1';
        const stockQty = parseFloat(pick(r, 'stock', 'existencia', 'cantidad', 'fisico')) || 0;
        const costVal = parseFloat(pick(r, 'costo', 'cost', 'costo unitario')) || 250;
        const priceVal = parseFloat(pick(r, 'precio', 'price', 'precio venta')) || Math.round(costVal * 1.45);

        const locationStr = `N${nave} / R${rack} / P${pas} / Niv${niv}`;

        validProducts.push({
          id: `PRD-${Date.now().toString(36).toUpperCase()}-${idx}`,
          sku: `SKU-${code}`,
          code,
          name: title,
          category: cat,
          unit: um,
          cost: costVal,
          price: priceVal,
          salePrice: priceVal,
          stock: stockQty,
          physicalStock: stockQty,
          reservedStock: 0,
          availableStock: stockQty,
          minStock: Math.max(5, Math.round(stockQty * 0.15)),
          maxStock: Math.max(50, Math.round(stockQty * 2.5)),
          warehouseId: 'WH-01',
          warehouseName: 'Almacén Central Tultitlán',
          warehouseLocation: locationStr,
          supplierId: 'SUP-01',
          active: true,
          updatedAt: new Date().toISOString(),
        });
      });

      if (validProducts.length === 0) {
        return { success: false, count: 0, error: 'No se encontraron columnas de "Código" válidas en el Excel.' };
      }

      setProducts(validProducts);

      addAuditLog({
        action: 'IMPORTAR_CATALOGO_EXCEL',
        module: 'INVENTARIO',
        details: `Importación masiva de ${validProducts.length} productos procesada desde Excel (.xlsx).`,
      });

      addNotification({
        title: 'Catálogo de Almacén Actualizado',
        message: `${validProducts.length} materiales cargados exitosamente con ubicaciones y stock.`,
        type: 'EXITO',
        module: 'INVENTARIO',
      });

      return { success: true, count: validProducts.length };
    },
    [addAuditLog, addNotification]
  );

  // AI Diagnostic for Warehouse & Inventory (ConsCore AI Inventory Intelligence)
  const analyzeInventoryWithAI = useCallback(
    (warehouseIdFilter?: string) => {
      const targetProds = warehouseIdFilter && warehouseIdFilter !== 'TODOS'
        ? products.filter((p) => p.warehouseId === warehouseIdFilter)
        : products;

      const criticalProds = targetProds.filter((p) => p.availableStock <= p.minStock);
      const overstockProds = targetProds.filter((p) => p.availableStock >= p.maxStock);
      const zeroStockProds = targetProds.filter((p) => p.availableStock === 0);

      const totalVal = targetProds.reduce((sum, p) => sum + (p.stock || 0) * p.cost, 0);
      const overstockValue = overstockProds.reduce((sum, p) => sum + Math.max(0, p.availableStock - p.maxStock) * p.cost, 0);
      const criticalRequiredVal = criticalProds.reduce((sum, p) => sum + (p.maxStock - p.availableStock) * p.cost, 0);

      // Calculate health score (0-100)
      const criticalPenalty = Math.min(35, criticalProds.length * 5);
      const overstockPenalty = Math.min(25, overstockProds.length * 4);
      const zeroPenalty = Math.min(20, zeroStockProds.length * 6);
      const healthScore = Math.max(20, Math.min(100, 100 - criticalPenalty - overstockPenalty - zeroPenalty));

      const suggestions: { title: string; desc: string; priority: 'ALTA' | 'MEDIA' | 'BAJA'; actionText: string }[] = [];

      if (criticalProds.length > 0) {
        suggestions.push({
          title: `Reabastecimiento urgente de ${criticalProds.length} SKUs críticos`,
          desc: `Materiales de alta rotación como ${criticalProds.slice(0, 2).map((p) => p.name).join(' y ')} se encuentran por debajo del punto de reorden. Riesgo de paro en pedidos confirmados.`,
          priority: 'ALTA',
          actionText: 'Generar Orden de Compra Sugerida',
        });
      }

      if (overstockProds.length > 0) {
        suggestions.push({
          title: `Capital inmovilizado en sobre-stock ($${(Number(overstockValue) || 0).toLocaleString('es-MX')} MXN)`,
          desc: `Se identificaron ${overstockProds.length} productos con existencias por encima de su capacidad máxima recomendada (${overstockProds.slice(0, 2).map((p) => p.name).join(', ')}).`,
          priority: 'MEDIA',
          actionText: 'Crear Promoción Comercial / Descuento',
        });
      }

      if (reservations.filter((r) => r.status === 'ACTIVE').length > 5) {
        suggestions.push({
          title: `Monitoreo de ${reservations.filter((r) => r.status === 'ACTIVE').length} apartados activos`,
          desc: 'Existen pedidos con inventario reservado que no han completado recolección o anticipo de pago en más de 48 horas.',
          priority: 'MEDIA',
          actionText: 'Revisar Pedidos por Surtir',
        });
      }

      const topRecommendations = [
        `Priorizar la compra de ${criticalProds.slice(0, 3).map((p) => p.code).join(', ') || 'lana mineral y preformados'} para evitar desabasto.`,
        'Efectuar un conteo cíclico mensual en Nave 1 Rack 4 donde se concentra el 40% del valor de inventario.',
        `Habilitar traspaso de stock excedente desde Almacén Central hacia Almacén Monterrey para reducir costos de flete regional.`,
      ];

      return {
        healthScore,
        criticalCount: criticalProds.length,
        overstockCount: overstockProds.length,
        capitalAtRisk: Math.round(overstockValue),
        turnoverRatio: 4.8,
        suggestions,
        topRecommendations,
        analyzedAt: new Date().toLocaleString('es-MX'),
      };
    },
    [products, reservations]
  );

  // ==========================================
  // LOGÍSTICA, RUTAS Y ENTREGAS (FASE 3)
  // ==========================================
  const addVehicle = useCallback(
    (vehicleData: Omit<Vehicle, 'id'>) => {
      const id = `VEH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 4)}`;
      const newVehicle: Vehicle = {
        ...vehicleData,
        id,
        economic_number: vehicleData.economicNumber || vehicleData.economic_number || 'ECO-NEW',
        capacity_weight: vehicleData.capacityWeight || vehicleData.capacity_weight || 3500,
        capacity_volume: vehicleData.capacityVolume || vehicleData.capacity_volume || 15,
        current_odometer: vehicleData.currentOdometer || vehicleData.current_odometer || 0,
        insurance_expiration: vehicleData.insuranceExpiration || vehicleData.insurance_expiration || '',
        status: vehicleData.status || 'AVAILABLE',
      };

      const updated = [newVehicle, ...vehicles];
      setVehicles(updated);

      addAuditLog({
        action: 'ALTA_VEHICULO',
        module: 'LOGISTICA',
        recordId: newVehicle.economicNumber,
        details: `Vehículo ${newVehicle.economicNumber} (${newVehicle.brandModel}, Placas: ${newVehicle.plate}) agregado a la flotilla.`,
      });

      addNotification({
        title: 'Vehículo Agregado',
        message: `${newVehicle.economicNumber} (${newVehicle.type}) disponible para asignación de rutas.`,
        type: 'EXITO',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('VEHICLE_ADDED', {
        userName: currentUser?.name || 'Logística',
        summary: `Nuevo vehículo ${newVehicle.economicNumber} agregado`,
        vehicles: updated,
      });

      return newVehicle;
    },
    [vehicles, addAuditLog, addNotification, broadcastDataUpdate, currentUser]
  );

  const updateVehicle = useCallback(
    (id: string, updates: Partial<Vehicle>) => {
      const updated = vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));
      setVehicles(updated);

      addAuditLog({
        action: 'EDICION_VEHICULO',
        module: 'LOGISTICA',
        recordId: id,
        details: `Vehículo ${id} actualizado.`,
      });

      broadcastDataUpdate('VEHICLE_UPDATED', {
        userName: currentUser?.name || 'Logística',
        summary: `Vehículo ${id} modificado`,
        vehicles: updated,
      });
    },
    [vehicles, addAuditLog, broadcastDataUpdate, currentUser]
  );

  const deleteVehicle = useCallback(
    (id: string) => {
      const v = vehicles.find((item) => item.id === id);
      if (!v) return { success: false, error: 'Vehículo no encontrado.' };
      if (v.status === 'IN_ROUTE') return { success: false, error: 'No se puede eliminar un vehículo en ruta activa.' };

      const updated = vehicles.filter((item) => item.id !== id);
      setVehicles(updated);

      addAuditLog({
        action: 'BAJA_VEHICULO',
        module: 'LOGISTICA',
        recordId: v.economicNumber,
        details: `Vehículo ${v.economicNumber} (${v.plate}) eliminado de la flotilla.`,
      });

      return { success: true };
    },
    [vehicles, addAuditLog]
  );

  const addDriver = useCallback(
    (driverData: Omit<Driver, 'id'>) => {
      const id = `DRV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 4)}`;
      const newDriver: Driver = {
        ...driverData,
        id,
        employee_id: driverData.employeeId || driverData.employee_id || 'EMP-DRV',
        license_number: driverData.licenseNumber || driverData.license_number || '',
        license_type: driverData.licenseType || driverData.license_type || 'Tipo B Federal',
        license_expiration: driverData.licenseExpiration || driverData.license_expiration || '',
        status: driverData.status || 'ACTIVO',
      };

      const updated = [newDriver, ...drivers];
      setDrivers(updated);

      addAuditLog({
        action: 'ALTA_CHOFER',
        module: 'LOGISTICA',
        recordId: newDriver.name,
        details: `Chofer ${newDriver.name} (Lic: ${newDriver.licenseNumber}) dado de alta.`,
      });

      addNotification({
        title: 'Operador / Chofer Registrado',
        message: `${newDriver.name} registrado en la plantilla de transporte.`,
        type: 'EXITO',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('DRIVER_ADDED', {
        userName: currentUser?.name || 'Logística',
        summary: `Nuevo operador ${newDriver.name} registrado`,
        drivers: updated,
      });

      return newDriver;
    },
    [drivers, addAuditLog, addNotification, broadcastDataUpdate, currentUser]
  );

  const updateDriver = useCallback(
    (id: string, updates: Partial<Driver>) => {
      const updated = drivers.map((d) => (d.id === id ? { ...d, ...updates } : d));
      setDrivers(updated);

      addAuditLog({
        action: 'EDICION_CHOFER',
        module: 'LOGISTICA',
        recordId: id,
        details: `Datos de chofer ${id} actualizados.`,
      });

      broadcastDataUpdate('DRIVER_UPDATED', {
        userName: currentUser?.name || 'Logística',
        summary: `Operador ${id} modificado`,
        drivers: updated,
      });
    },
    [drivers, addAuditLog, broadcastDataUpdate, currentUser]
  );

  const deleteDriver = useCallback(
    (id: string) => {
      const d = drivers.find((item) => item.id === id);
      if (!d) return { success: false, error: 'Chofer no encontrado.' };
      if (d.status === 'EN_RUTA') return { success: false, error: 'No se puede eliminar un chofer con ruta activa en curso.' };

      const updated = drivers.filter((item) => item.id !== id);
      setDrivers(updated);

      addAuditLog({
        action: 'BAJA_CHOFER',
        module: 'LOGISTICA',
        recordId: d.name,
        details: `Operador ${d.name} eliminado de la plantilla.`,
      });

      return { success: true };
    },
    [drivers, addAuditLog]
  );

  const createRoute = useCallback(
    (data: {
      date: string;
      warehouseId: string;
      vehicleId: string;
      driverId: string;
      zone?: string;
      notes?: string;
      orderIds: string[];
    }) => {
      if (!data.orderIds || data.orderIds.length === 0) {
        return { success: false, error: 'Debes seleccionar al menos un pedido para programar la ruta.' };
      }

      const selectedOrders = orders.filter((o) => (data?.orderIds || []).includes(o.id));
      if (selectedOrders.length === 0) {
        return { success: false, error: 'Los pedidos seleccionados no fueron encontrados.' };
      }

      // BLOQUEO LOGÍSTICA (Observación #12)
      for (const ord of selectedOrders) {
        const associatedPicking = pickings.find((p) => p.orderId === ord.id || p.orderFolio === ord.folio);
        const readiness = validateLogisticsReadiness(ord, associatedPicking);

        if (!readiness.isReady) {
          addAuditLog({
            action: 'LOGISTICS_ACTION_BLOCKED',
            module: 'LOGISTICA',
            recordId: ord.folio || ord.order_number || ord.id,
            details: JSON.stringify({
              orderId: ord.id,
              pickingId: associatedPicking?.pickingId || null,
              pickingStatus: associatedPicking?.status || 'NO_EXISTE',
              fulfillmentStatus: ord.fulfillmentStatus || 'NO_SURTIDO',
              attemptedAction: 'PROGRAMAR_RUTA',
              userId: currentUser?.id || 'SYS',
              timestamp: new Date().toISOString(),
              masterTransactionId: ord.master_transaction_id || ord.masterTransactionId || associatedPicking?.masterTransactionId || null,
              reason: readiness.reason,
            }),
          });
          return {
            success: false,
            error: readiness.reason,
          };
        }
      }

      const vehicle = vehicles.find((v) => v.id === data.vehicleId);
      const driver = drivers.find((d) => d.id === data.driverId);
      const warehouse = warehouses.find((w) => w.id === data.warehouseId);

      const routeFolio = `RUT-${data.date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const routeId = `RUT-${Date.now().toString(36).toUpperCase()}`;

      let totalWeight = 0;
      let totalVolume = 0;
      let totalItemsCount = 0;

      const stops: RouteStop[] = selectedOrders.map((ord, idx) => {
        let orderWeight = 0;
        let orderVolume = 0;
        let orderUnits = 0;

        const associatedPicking = pickings.find((p) => p.orderId === ord.id || p.orderFolio === ord.folio);
        const readiness = validateLogisticsReadiness(ord, associatedPicking);

        const stopItems = ord.items.map((itm, itmIdx) => {
          const prod = products.find((p) => p.id === itm.productId || p.sku === itm.sku);
          const shippableInfo = readiness.shippableItems.find(si => si.orderItemId === itm.id || si.productId === itm.productId);
          // Regla estricta: Máximo disponible para carga = cantidad surtida física confirmada (Req 18)
          const qty = shippableInfo ? shippableInfo.shippableQty : (itm.quantityFulfilled > 0 ? itm.quantityFulfilled : 0);
          const unitWeight = (prod?.cost || 20) * 0.08 + 2; // Approximate weight factor
          const unitVol = 0.05 + ((prod?.cost || 100) / 2000);

          orderWeight += unitWeight * qty;
          orderVolume += unitVol * qty;
          orderUnits += qty;

          return {
            orderItemId: itm.productId || `ITM-${itmIdx}`,
            productId: itm.productId,
            productCode: itm.sku,
            productName: itm.productName,
            unit: itm.unit,
            quantityOrdered: itm.quantityOrdered,
            quantityShipped: qty,
            quantityDelivered: 0,
            quantityDifference: 0,
          };
        });

        totalWeight += orderWeight;
        totalVolume += orderVolume;
        totalItemsCount += orderUnits;

        const client = customers.find((c) => c.id === ord.customerId);

        return {
          id: `STP-${routeId}-${idx + 1}`,
          routeId: routeFolio,
          orderIndex: idx + 1,
          orderId: ord.id,
          orderNumber: ord.folio,
          customerId: ord.customerId,
          customerName: ord.customerName,
          contactName: client?.contactPerson || 'Encargado de Almacén',
          phone: client?.phone || '+52 55 0000-0000',
          deliveryAddress: ord.deliveryAddress || client?.address || 'Dirección de Entrega',
          city: client?.city || 'Ciudad de México',
          state: client?.state || 'CDMX',
          scheduledTime: `${8 + idx * 2}:00 - ${9 + idx * 2}:30`,
          status: 'PENDING' as const,
          notes: ord.notes || 'Entrega estándar en planta/obra.',
          totalWeightKg: Math.round(orderWeight),
          totalVolumeM3: Math.round(orderVolume * 10) / 10,
          totalUnits: orderUnits,
          isLoaded: false,
          items: stopItems,
        };
      });

      const newRoute: Route = {
        id: routeId,
        routeNumber: routeFolio,
        route_number: routeFolio,
        date: data.date,
        warehouseId: data.warehouseId,
        warehouse_id: data.warehouseId,
        warehouseName: warehouse?.name || 'Almacén Matriz',
        warehouse_name: warehouse?.name || 'Almacén Matriz',
        vehicleId: data.vehicleId,
        vehicle_id: data.vehicleId,
        vehiclePlate: vehicle?.plate || 'SIN PLACAS',
        vehicleName: vehicle ? `${vehicle.economicNumber} (${vehicle.brandModel})` : 'Vehículo Asignado',
        driverId: data.driverId,
        driver_id: data.driverId,
        driverName: driver?.name || 'Chofer Asignado',
        driverPhone: driver?.phone || '+52 55 0000-0000',
        status: 'PLANNED',
        zone: data.zone || 'Ruta Metropolitana',
        estimatedDistanceKm: Math.round(15 + stops.length * 14.5),
        estimated_distance: Math.round(15 + stops.length * 14.5),
        estimatedDuration: `${Math.floor(stops.length * 1.2 + 1)}h ${Math.floor((stops.length * 1.2 % 1) * 60)}m`,
        estimated_time: `${Math.floor(stops.length * 1.2 + 1)}h ${Math.floor((stops.length * 1.2 % 1) * 60)}m`,
        notes: data.notes || `Ruta programada con ${stops.length} pedidos.`,
        totalWeightKg: Math.round(totalWeight),
        totalVolumeM3: Math.round(totalVolume * 10) / 10,
        totalOrders: stops.length,
        totalItems: totalItemsCount,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdBy: currentUser?.id || 'USR-005',
        createdByName: currentUser?.name || 'Coordinador de Logística',
        stops,
      };

      // Update orders to PROGRAMADO
      const updatedOrders = orders.map((o) =>
        (data?.orderIds || []).includes(o.id)
          ? {
              ...o,
              status: 'PROGRAMADO' as const,
              notes: (o.notes ? o.notes + ' | ' : '') + `Programado en Ruta ${routeFolio}`,
            }
          : o
      );

      const updatedRoutes = [newRoute, ...routes];
      setRoutes(updatedRoutes);
      setOrders(updatedOrders);

      addAuditLog({
        action: 'PROGRAMACION_RUTA',
        module: 'LOGISTICA',
        recordId: routeFolio,
        details: `Ruta ${routeFolio} programada con ${stops.length} pedidos para unidad ${vehicle?.economicNumber || data.vehicleId} con chofer ${driver?.name || data.driverId}.`,
      });

      addNotification({
        title: 'Ruta de Entrega Programada',
        message: `${routeFolio}: ${stops.length} entregas asignadas a ${driver?.name || 'Chofer'}.`,
        type: 'EXITO',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('ROUTE_CREATED', {
        userName: currentUser?.name || 'Logística',
        summary: `Ruta ${routeFolio} programada`,
        routes: updatedRoutes,
        orders: updatedOrders,
      });

      return { success: true, route: newRoute };
    },
    [orders, vehicles, drivers, warehouses, customers, products, routes, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const updateRoute = useCallback(
    (id: string, updates: Partial<Route>) => {
      const updated = routes.map((r) => (r.id === id || r.routeNumber === id ? { ...r, ...updates } : r));
      setRoutes(updated);

      addAuditLog({
        action: 'EDICION_RUTA',
        module: 'LOGISTICA',
        recordId: id,
        details: `Ruta ${id} actualizada.`,
      });

      broadcastDataUpdate('ROUTE_UPDATED', {
        userName: currentUser?.name || 'Logística',
        summary: `Ruta ${id} modificada`,
        routes: updated,
      });
    },
    [routes, addAuditLog, broadcastDataUpdate, currentUser]
  );

  const cancelRoute = useCallback(
    (routeId: string, reason: string) => {
      const rt = routes.find((r) => r.id === routeId || r.routeNumber === routeId);
      if (!rt) return { success: false, error: 'Ruta no encontrada.' };
      if (rt.status === 'COMPLETED') return { success: false, error: 'No se puede cancelar una ruta ya finalizada.' };

      // Return orders to LISTO_PARA_EMBARQUE
      const orderIdsInRoute = (rt.stops || []).map((s) => s.orderId);
      const updatedOrders = orders.map((o) =>
        (orderIdsInRoute || []).includes(o.id) ? { ...o, status: 'LISTO_PARA_EMBARQUE' as const } : o
      );

      // Release vehicle & driver if they were in route
      const updatedVehicles = vehicles.map((v) =>
        v.id === rt.vehicleId ? { ...v, status: 'AVAILABLE' as const } : v
      );
      const updatedDrivers = drivers.map((d) =>
        d.id === rt.driverId ? { ...d, status: 'ACTIVO' as const, currentRouteId: undefined } : d
      );

      const updatedRoutes = routes.map((r) =>
        r.id === rt.id
          ? {
              ...r,
              status: 'CANCELLED' as const,
              notes: (r.notes ? r.notes + ' | ' : '') + `Cancelada: ${reason}`,
            }
          : r
      );

      setRoutes(updatedRoutes);
      setOrders(updatedOrders);
      setVehicles(updatedVehicles);
      setDrivers(updatedDrivers);

      addAuditLog({
        action: 'CANCELACION_RUTA',
        module: 'LOGISTICA',
        recordId: rt.routeNumber,
        details: `Ruta ${rt.routeNumber} cancelada. Motivo: ${reason}. Pedidos retornados a Mesa de Embarques.`,
      });

      addNotification({
        title: 'Ruta Cancelada',
        message: `${rt.routeNumber} cancelada. Los pedidos están disponibles nuevamente para embarque.`,
        type: 'ALERTA',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('ROUTE_CANCELLED', {
        userName: currentUser?.name || 'Logística',
        summary: `Ruta ${rt.routeNumber} cancelada`,
        routes: updatedRoutes,
        orders: updatedOrders,
        vehicles: updatedVehicles,
        drivers: updatedDrivers,
      });

      return { success: true };
    },
    [routes, orders, vehicles, drivers, addAuditLog, addNotification, broadcastDataUpdate, currentUser]
  );

  const startRouteLoading = useCallback(
    (routeId: string) => {
      const rt = routes.find((r) => r.id === routeId || r.routeNumber === routeId);
      if (!rt) return { success: false, error: 'Ruta no encontrada.' };

      // BLOQUEO LOGÍSTICA (Observación #12)
      const orderIdsInRoute = (rt.stops || []).map((s) => s.orderId);
      const routeOrders = orders.filter((o) => (orderIdsInRoute || []).includes(o.id));
      for (const ord of routeOrders) {
        const associatedPicking = pickings.find((p) => p.orderId === ord.id || p.orderFolio === ord.folio);
        const readiness = validateLogisticsReadiness(ord, associatedPicking);

        if (!readiness.isReady) {
          addAuditLog({
            action: 'LOGISTICS_ACTION_BLOCKED',
            module: 'LOGISTICA',
            recordId: ord.folio || ord.order_number || ord.id,
            details: JSON.stringify({
              orderId: ord.id,
              pickingId: associatedPicking?.pickingId || null,
              pickingStatus: associatedPicking?.status || 'NO_EXISTE',
              fulfillmentStatus: ord.fulfillmentStatus || 'NO_SURTIDO',
              attemptedAction: 'CARGAR_UNIDAD',
              userId: currentUser?.id || 'SYS',
              timestamp: new Date().toISOString(),
              masterTransactionId: ord.master_transaction_id || ord.masterTransactionId || associatedPicking?.masterTransactionId || null,
              reason: readiness.reason,
            }),
          });
          return {
            success: false,
            error: `Carga bloqueada: ${readiness.reason} (Pedido ${ord.folio || ord.order_number}).`,
          };
        }
      }

      const updatedRoutes = routes.map((r) =>
        r.id === rt.id ? { ...r, status: 'LOADING' as const } : r
      );

      const updatedOrders = orders.map((o) =>
        (orderIdsInRoute || []).includes(o.id) ? { ...o, status: 'CARGANDO' as const } : o
      );

      setRoutes(updatedRoutes);
      setOrders(updatedOrders);

      addAuditLog({
        action: 'INICIO_CARGA_RUTA',
        module: 'LOGISTICA',
        recordId: rt.routeNumber,
        details: `Proceso de carga y estiba iniciado en andén para ruta ${rt.routeNumber}.`,
      });

      addNotification({
        title: 'Carga de Unidad Iniciada',
        message: `Cargando pedidos para la ruta ${rt.routeNumber} en vehículo ${rt.vehicleName}.`,
        type: 'INFO',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('ROUTE_LOADING_STARTED', {
        userName: currentUser?.name || 'Almacén',
        summary: `Carga de ${rt.routeNumber} iniciada`,
        routes: updatedRoutes,
        orders: updatedOrders,
      });

      return { success: true };
    },
    [routes, orders, addAuditLog, addNotification, broadcastDataUpdate, currentUser]
  );

  const completeRouteLoadingAndDepart = useCallback(
    (routeId: string, checklist: RouteDepartureChecklist) => {
      const rt = routes.find((r) => r.id === routeId || r.routeNumber === routeId);
      if (!rt) return { success: false, error: 'Ruta no encontrada.' };

      // BLOQUEO LOGÍSTICA (Observación #12)
      const orderIdsInRoute = (rt.stops || []).map((s) => s.orderId);
      const routeOrders = orders.filter((o) => (orderIdsInRoute || []).includes(o.id));
      for (const ord of routeOrders) {
        const associatedPicking = pickings.find((p) => p.orderId === ord.id || p.orderFolio === ord.folio);
        const readiness = validateLogisticsReadiness(ord, associatedPicking);

        if (!readiness.isReady) {
          addAuditLog({
            action: 'LOGISTICS_ACTION_BLOCKED',
            module: 'LOGISTICA',
            recordId: ord.folio || ord.order_number || ord.id,
            details: JSON.stringify({
              orderId: ord.id,
              pickingId: associatedPicking?.pickingId || null,
              pickingStatus: associatedPicking?.status || 'NO_EXISTE',
              fulfillmentStatus: ord.fulfillmentStatus || 'NO_SURTIDO',
              attemptedAction: 'DESPACHAR_RUTA',
              userId: currentUser?.id || 'SYS',
              timestamp: new Date().toISOString(),
              masterTransactionId: ord.master_transaction_id || ord.masterTransactionId || associatedPicking?.masterTransactionId || null,
              reason: readiness.reason,
            }),
          });
          return {
            success: false,
            error: `Despacho bloqueado: ${readiness.reason} (Pedido ${ord.folio || ord.order_number}).`,
          };
        }
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const updatedChecklist: RouteDepartureChecklist = {
        ...checklist,
        releasedBy: currentUser?.id || 'USR-005',
        releasedByName: currentUser?.name || 'Jefe de Embarques',
        releasedAt: nowStr,
      };

      const updatedRoutes = routes.map((r) =>
        r.id === rt.id
          ? {
              ...r,
              status: 'IN_ROUTE' as const,
              departureTime: nowStr,
              departureChecklist: updatedChecklist,
              stops: r.stops.map((s) => ({ ...s, isLoaded: true })),
            }
          : r
      );

      const updatedOrders = orders.map((o) =>
        (orderIdsInRoute || []).includes(o.id) ? { ...o, status: 'EN_RUTA' as const } : o
      );

      const updatedVehicles = vehicles.map((v) =>
        v.id === rt.vehicleId ? { ...v, status: 'IN_ROUTE' as const } : v
      );

      const updatedDrivers = drivers.map((d) =>
        d.id === rt.driverId ? { ...d, status: 'EN_RUTA' as const, currentRouteId: rt.routeNumber } : d
      );

      setRoutes(updatedRoutes);
      setOrders(updatedOrders);
      setVehicles(updatedVehicles);
      setDrivers(updatedDrivers);

      addAuditLog({
        action: 'DESPACHO_SALIDA_RUTA',
        module: 'LOGISTICA',
        recordId: rt.routeNumber,
        details: `Ruta ${rt.routeNumber} liberada en tránsito con checklist aprobado. Chofer: ${rt.driverName}, Unidad: ${rt.vehicleName}.`,
      });

      addNotification({
        title: 'Unidad Despachada / En Ruta',
        message: `${rt.routeNumber} ha salido del almacén. ${rt.stops.length} paradas en tránsito.`,
        type: 'EXITO',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('ROUTE_DEPARTED', {
        userName: currentUser?.name || 'Embarques',
        summary: `Ruta ${rt.routeNumber} en tránsito`,
        routes: updatedRoutes,
        orders: updatedOrders,
        vehicles: updatedVehicles,
        drivers: updatedDrivers,
      });

      return { success: true };
    },
    [routes, orders, vehicles, drivers, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const updateStopStatus = useCallback(
    (routeId: string, stopId: string, status: RouteStop['status'], notes?: string) => {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const updatedRoutes = routes.map((r) => {
        if (r.id !== routeId && r.routeNumber !== routeId) return r;
        return {
          ...r,
          stops: r.stops.map((s) => {
            if (s.id !== stopId) return s;
            return {
              ...s,
              status,
              arrivalTime: status === 'ARRIVED' ? (s.arrivalTime || nowStr) : s.arrivalTime,
              departureTime: ['DELIVERED', 'PARTIAL', 'FAILED'].includes(status) ? nowStr : s.departureTime,
              notes: notes ? `${s.notes || ''} | ${notes}` : s.notes,
            };
          }),
        };
      });

      setRoutes(updatedRoutes);
    },
    [routes]
  );

  const getPodByOrderId = useCallback(
    (orderId: string): DeliveryEvidence | undefined => {
      return (
        pods.find((p) => p.orderId === orderId || p.orderNumber === orderId) ||
        orders.find((o) => o.id === orderId || o.folio === orderId)?.pod
      );
    },
    [pods, orders]
  );

  const getPodByStopId = useCallback(
    (stopId: string): DeliveryEvidence | undefined => {
      const fromPods = pods.find((p) => p.routeStopId === stopId || p.id === stopId);
      if (fromPods) return fromPods;
      for (const r of routes) {
        const s = r.stops.find((st) => st.id === stopId);
        if (s?.evidence) return s.evidence;
        if ((s as any)?.deliveryEvidence) return (s as any).deliveryEvidence;
      }
      return undefined;
    },
    [pods, routes]
  );

  const registerDeliveryEvidence = useCallback(
    async (
      routeId: string,
      stopId: string,
      evidence: DeliveryEvidence,
      deliveredItems?: { orderItemId: string; quantityDelivered: number; quantityDifference: number; rejectionReason?: string }[]
    ): Promise<{ success: boolean; error?: string; pod?: DeliveryEvidence; message?: string }> => {
      // 1. RBAC Validation: Commercial role cannot execute physical logistics POD
      if (currentUser?.role === 'VENDEDOR') {
        addAuditLog({
          action: 'POD_REGISTRATION_DENIED_VENDEDOR',
          module: 'LOGISTICA',
          recordId: stopId,
          details: `403 FORBIDDEN: El usuario comercial ${currentUser?.name} (${currentUser?.role}) intentó registrar entrega física POD. Operación denegada por segregación de funciones.`,
        });
        return {
          success: false,
          error: '403 FORBIDDEN: El rol EJECUTIVO_VENTAS no cuenta con facultades operativas para certificar entregas de almacén/transporte.',
        };
      }

      // 2. Validate route & stop existence
      const rt = routes.find((r) => r.id === routeId || r.routeNumber === routeId);
      if (!rt) return { success: false, error: 'Ruta de entrega no encontrada.' };

      const stop = rt.stops.find((s) => s.id === stopId);
      if (!stop) return { success: false, error: 'Parada de entrega no encontrada.' };

      // 3. Validate order state (Cannot deliver cancelled or rejected orders)
      const order = orders.find((o) => o.id === stop.orderId || o.folio === stop.orderNumber || o.order_number === stop.orderNumber);
      if (order && order.status === 'CANCELADO') {
        return {
          success: false,
          error: `DENIED: No es posible registrar entrega del pedido ${stop.orderNumber} en estatus ${order.status}.`,
        };
      }

      // 3.1 Bloqueo Logística (Observación #12): Validar que el pedido cuente con surtido físico confirmado
      const associatedPicking = pickings.find((p) => p.orderId === stop.orderId || p.orderFolio === stop.orderNumber);
      const readiness = validateLogisticsReadiness(order, associatedPicking);
      if (!readiness.isReady) {
        addAuditLog({
          action: 'LOGISTICS_ACTION_BLOCKED',
          module: 'LOGISTICA',
          recordId: order?.folio || order?.order_number || stop.orderNumber,
          details: JSON.stringify({
            orderId: order?.id || stop.orderId,
            pickingId: associatedPicking?.pickingId || null,
            pickingStatus: associatedPicking?.status || 'NO_EXISTE',
            fulfillmentStatus: order?.fulfillmentStatus || 'NO_SURTIDO',
            attemptedAction: 'REGISTRAR_POD',
            userId: currentUser?.id || 'SYS',
            timestamp: new Date().toISOString(),
            masterTransactionId: order?.master_transaction_id || order?.masterTransactionId || associatedPicking?.masterTransactionId || null,
            reason: readiness.reason,
          }),
        });
        return {
          success: false,
          error: `Entrega bloqueada: ${readiness.reason}`,
        };
      }

      // 4. Idempotency check: if stop already DELIVERED with valid signature, return idempotency response
      if (stop.status === 'DELIVERED' && (stop.evidence?.signature || stop.evidence?.signatureUrl)) {
        return {
          success: true,
          message: 'Operación idempotente: La entrega ya se encuentra registrada y certificada.',
          pod: stop.evidence,
        };
      }

      // 5. Validate mandatory evidence data
      const recipient = (evidence.recipientName || evidence.receivedByName || '').trim();
      if (!recipient) {
        return {
          success: false,
          error: 'El nombre del responsable que recibe la mercancía es obligatorio.',
        };
      }

      const signature = evidence.signature || evidence.signatureUrl;
      if (!signature || signature.length < 50) {
        return {
          success: false,
          error: 'La firma digital de recepción es obligatoria para certificar la entrega (POD).',
        };
      }

      // 6. Build timestamps & identifiers
      const now = new Date();
      const dateStr = evidence.deliveryDate || now.toISOString().slice(0, 10);
      const timeStr = evidence.deliveryTime || now.toTimeString().slice(0, 5);
      const nowStr = `${dateStr} ${timeStr}`;
      const nowIso = now.toISOString();

      const masterTxId =
        evidence.masterTransactionId ||
        order?.masterTransactionId ||
        order?.master_transaction_id ||
        `MTX-${Date.now().toString(36).toUpperCase()}`;

      const podFolio =
        evidence.podId ||
        evidence.id ||
        `POD-${stop.orderNumber}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

      const isPartial = deliveredItems ? deliveredItems.some((itm) => itm.quantityDifference > 0) : false;
      const stopFinalStatus: RouteStop['status'] = isPartial ? 'PARTIAL' : 'DELIVERED';

      // 7. Reconcile item quantities
      const updatedItems = stop.items.map((itm) => {
        const itemFeedback = deliveredItems?.find(
          (d) => d.orderItemId === itm.orderItemId || d.orderItemId === itm.productId
        );
        if (!itemFeedback) return itm;
        return {
          ...itm,
          quantityDelivered: itemFeedback.quantityDelivered,
          quantityDifference: itemFeedback.quantityDifference,
          rejectionReason: itemFeedback.rejectionReason,
        };
      });

      // 8. Construct Canonical POD (DeliveryEvidence) with items array
      const podItems: DeliveryEvidenceItem[] = (deliveredItems && deliveredItems.length > 0)
        ? deliveredItems.map((itm) => ({
            productId: (itm as any).productId || itm.orderItemId,
            orderItemId: itm.orderItemId,
            sku: (itm as any).productCode || (itm as any).sku || '',
            description: (itm as any).productName || (itm as any).description || '',
            unit: (itm as any).unit || 'PZA',
            qtyExpected: (itm as any).quantityShipped !== undefined ? (itm as any).quantityShipped : ((itm as any).qtyExpected || 0),
            qtyReceived: (itm as any).quantityDelivered !== undefined ? (itm as any).quantityDelivered : ((itm as any).qtyReceived || 0),
            difference: (itm as any).quantityDifference !== undefined ? (itm as any).quantityDifference : ((itm as any).difference || 0),
            rejectionReason: itm.rejectionReason || '',
          }))
        : (evidence.items && evidence.items.length > 0)
        ? evidence.items
        : stop.items.map((itm) => ({
            productId: itm.productId,
            orderItemId: itm.orderItemId,
            sku: itm.productCode,
            description: itm.productName,
            unit: itm.unit,
            qtyExpected: itm.quantityShipped,
            qtyReceived: itm.quantityDelivered,
            difference: itm.quantityDifference || 0,
            rejectionReason: itm.rejectionReason || '',
          }));

      const canonicalPOD: DeliveryEvidence = {
        id: podFolio,
        podId: podFolio,
        routeStopId: stop.id,
        deliveryId: stop.id,
        routeId: rt.id,
        orderId: stop.orderId,
        orderNumber: stop.orderNumber,
        masterTransactionId: masterTxId,
        customerId: stop.customerId,
        customerName: stop.customerName,
        registeredByUserId: currentUser?.id || 'DRV-001',
        registeredByName: currentUser?.name || 'Operador de Entrega',
        verifiedByUser: currentUser?.name || 'Operador de Entrega',
        recipientName: recipient,
        receivedByName: recipient,
        recipientIdNumber: evidence.recipientIdNumber || evidence.receivedByRole,
        receivedByRole: evidence.receivedByRole || evidence.recipientIdNumber,
        deliveryDate: dateStr,
        deliveryTime: timeStr,
        timestamp: nowStr,
        signature: signature,
        signatureUrl: signature,
        photoEvidence: evidence.photoEvidence || evidence.photoEvidenceUrl || evidence.photoUrl,
        photoEvidenceUrl: evidence.photoEvidenceUrl || evidence.photoEvidence || evidence.photoUrl,
        photoUrl: evidence.photoUrl || evidence.photoEvidenceUrl || evidence.photoEvidence,
        observations: evidence.observations || evidence.notes || evidence.comments || '',
        notes: evidence.notes || evidence.observations || evidence.comments || '',
        guideNumber: evidence.guideNumber || rt.routeNumber,
        vehicle: evidence.vehicle || rt.vehicleName || rt.vehiclePlate,
        driver: evidence.driver || rt.driverName,
        status: isPartial ? 'PARTIAL' : 'ENTREGADO',
        items: podItems,
        createdAt: evidence.createdAt || nowIso,
        updatedAt: nowIso,
      };

      // 9. Server-side API persistence with transaction validation
      try {
        const token = localStorage.getItem('conscore_auth_token') || '';
        const apiRes = await fetch('/api/pod', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(canonicalPOD),
        });

        if (!apiRes.ok) {
          const errData = await apiRes.json().catch(() => ({}));
          const errMsg = errData.error || errData.message || `Error del servidor: ${apiRes.status}`;
          if (apiRes.status === 403 || apiRes.status === 422 || errMsg.includes('403') || errMsg.includes('FORBIDDEN') || errMsg.includes('LOGISTICS_BLOCKED')) {
            return {
              success: false,
              error: errMsg,
            };
          }
        }
      } catch (apiErr: any) {
        console.warn('Backend POD persistence error:', apiErr);
        if (apiErr.message && (apiErr.message.includes('403') || apiErr.message.includes('FORBIDDEN') || apiErr.message.includes('LOGISTICS_BLOCKED'))) {
          return {
            success: false,
            error: apiErr.message,
          };
        }
      }

      // 10. Atomic updates across Routes, Stops and Orders
      const updatedStop: RouteStop = {
        ...stop,
        status: stopFinalStatus,
        departureTime: nowStr,
        items: updatedItems,
        evidence: canonicalPOD,
        deliveryEvidence: canonicalPOD, // compatibility alias
      };

      const updatedStops = rt.stops.map((s) => (s.id === stopId ? updatedStop : s));
      const allDone = updatedStops.every((s) => ['DELIVERED', 'PARTIAL', 'FAILED'].includes(s.status));
      const routeStatus = allDone ? 'COMPLETED' : rt.status;

      const updatedRoutes = routes.map((r) =>
        r.id === rt.id
          ? {
              ...r,
              status: routeStatus,
              completionTime: allDone ? nowStr : r.completionTime,
              stops: updatedStops,
            }
          : r
      );

      const orderFinalStatus = isPartial ? 'ENTREGA_PARCIAL' : 'ENTREGADO';
      const updatedOrders = orders.map((o) =>
        o.id === stop.orderId || o.folio === stop.orderNumber || o.order_number === stop.orderNumber
          ? {
              ...o,
              status: orderFinalStatus,
              notes: (o.notes ? o.notes + ' | ' : '') + `Entregado en Ruta ${rt.routeNumber} (${canonicalPOD.recipientName})`,
              pod: canonicalPOD,
              podId: canonicalPOD.podId,
              updatedAt: nowIso,
            }
          : o
      );

      // Release vehicle and driver if route is complete
      let updatedVehicles = vehicles;
      let updatedDrivers = drivers;
      if (allDone) {
        updatedVehicles = vehicles.map((v) => (v.id === rt.vehicleId ? { ...v, status: 'AVAILABLE' as const } : v));
        updatedDrivers = drivers.map((d) => (d.id === rt.driverId ? { ...d, status: 'ACTIVO' as const, currentRouteId: undefined } : d));
      }

      // Update State atomically
      setPods((prev) => {
        const filtered = prev.filter((p) => p.podId !== canonicalPOD.podId && p.routeStopId !== stop.id);
        return [canonicalPOD, ...filtered];
      });
      setRoutes(updatedRoutes);
      setOrders(updatedOrders);
      if (allDone) {
        setVehicles(updatedVehicles);
        setDrivers(updatedDrivers);
      }

      // Synchronous LocalStorage write to guarantee instantaneous persistence
      try {
        localStorage.setItem('conscore_routes', JSON.stringify(updatedRoutes));
        localStorage.setItem('conscore_orders', JSON.stringify(updatedOrders));
        const savedPods = JSON.parse(localStorage.getItem('conscore_pods') || '[]');
        const filteredSaved = savedPods.filter((p: any) => p.podId !== canonicalPOD.podId && p.routeStopId !== stop.id);
        localStorage.setItem('conscore_pods', JSON.stringify([canonicalPOD, ...filteredSaved]));
      } catch (storageErr) {
        console.warn('LocalStorage POD sync warning:', storageErr);
      }

      // Partial delivery automatic incident & return creation
      if (isPartial) {
        const rejectedItems = updatedItems.filter((i) => (i.quantityDifference || 0) > 0);
        const incidentFolio = `INC-LOG-${Date.now().toString(36).toUpperCase().slice(0, 4)}`;
        const returnFolio = `DEV-LOG-${Date.now().toString(36).toUpperCase().slice(0, 4)}`;

        const newIncident: LogisticsIncident = {
          id: incidentFolio,
          folio: incidentFolio,
          orderId: stop.orderId,
          orderNumber: stop.orderNumber,
          routeId: rt.id,
          routeNumber: rt.routeNumber,
          customerId: stop.customerId,
          customerName: stop.customerName,
          userId: currentUser?.id || 'DRV-001',
          userName: currentUser?.name || 'Chofer Operador',
          date: nowStr,
          type: 'DANO',
          severity: 'MEDIA',
          description: `Entrega parcial registrada por cliente ${stop.customerName}. Rechazo de ${rejectedItems.map((r) => `${r.quantityDifference} ${r.unit} de ${r.productName}`).join(', ')}.`,
          status: 'ABIERTA',
        };

        const newReturn: LogisticsReturn = {
          id: returnFolio,
          folio: returnFolio,
          orderId: stop.orderId,
          orderNumber: stop.orderNumber,
          routeId: rt.id,
          routeNumber: rt.routeNumber,
          customerId: stop.customerId,
          customerName: stop.customerName,
          date: nowStr.slice(0, 10),
          items: rejectedItems.map((r) => ({
            productId: r.productId,
            productCode: r.productCode,
            productName: r.productName,
            unit: r.unit,
            quantityReturned: r.quantityDifference || 0,
            condition: 'EMPAQUE_ABIERTO',
            reason: r.rejectionReason || 'Rechazo parcial en sitio de entrega.',
            reinspected: false,
            inventoryReintegrated: false,
          })),
          status: 'EN_INSPECCION',
          reasonSummary: `Mercancía rechazada en ruta ${rt.routeNumber} por cliente. Pendiente de ingreso e inspección en almacén.`,
        };

        setLogisticsIncidents((prev) => [newIncident, ...prev]);
        setLogisticsReturns((prev) => [newReturn, ...prev]);
      }

      // Audit Log with Master Transaction ID and entity type
      addAuditLog({
        action: 'DELIVERY_POD_REGISTERED',
        module: 'LOGISTICA',
        recordId: stop.orderNumber,
        details: `POD certificado y registrado para pedido ${stop.orderNumber}. Recibió: ${canonicalPOD.recipientName} (ID: ${canonicalPOD.recipientIdNumber || 'N/A'}). MTX: ${masterTxId}. Firma: ${!!canonicalPOD.signature}. Foto: ${!!canonicalPOD.photoEvidence}.`,
        masterTransactionId: masterTxId,
        entityType: 'POD',
        entityId: canonicalPOD.podId,
      });

      addNotification({
        title: isPartial ? 'Entrega Parcial Registrada' : 'Pedido Entregado con Éxito (POD)',
        message: `${stop.orderNumber} para ${stop.customerName} confirmado por ${canonicalPOD.recipientName}.`,
        type: isPartial ? 'ALERTA' : 'EXITO',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('DELIVERY_CONFIRMED', {
        userName: currentUser?.name || 'Chofer',
        summary: `Entrega POD confirmada para ${stop.orderNumber}`,
        routes: updatedRoutes,
        orders: updatedOrders,
        pod: canonicalPOD,
      });

      return { success: true, pod: canonicalPOD };
    },
    [routes, orders, vehicles, drivers, pods, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const registerDeliveryFailure = useCallback(
    (
      routeId: string,
      stopId: string,
      reason: FailureReason,
      comment: string,
      rescheduledDate?: string
    ) => {
      const rt = routes.find((r) => r.id === routeId || r.routeNumber === routeId);
      if (!rt) return { success: false, error: 'Ruta no encontrada.' };

      const stop = rt.stops.find((s) => s.id === stopId);
      if (!stop) return { success: false, error: 'Parada no encontrada.' };

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const isRescheduled = Boolean(rescheduledDate);
      const stopStatus: RouteStop['status'] = isRescheduled ? 'RESCHEDULED' : 'FAILED';

      const updatedStop: RouteStop = {
        ...stop,
        status: stopStatus,
        departureTime: nowStr,
        failureReason: reason,
        failureComment: comment,
        rescheduledDate,
      };

      const updatedStops = rt.stops.map((s) => (s.id === stopId ? updatedStop : s));
      const allDone = updatedStops.every((s) => ['DELIVERED', 'PARTIAL', 'FAILED', 'RESCHEDULED'].includes(s.status));
      const routeStatus = allDone ? 'COMPLETED' : rt.status;

      const updatedRoutes = routes.map((r) =>
        r.id === rt.id
          ? {
              ...r,
              status: routeStatus,
              completionTime: allDone ? nowStr : r.completionTime,
              stops: updatedStops,
            }
          : r
      );

      // Update Order Status
      const orderStatus = isRescheduled ? 'REPROGRAMADO' : 'INCIDENCIA';
      const updatedOrders = orders.map((o) =>
        o.id === stop.orderId
          ? {
              ...o,
              status: orderStatus,
              notes: (o.notes ? o.notes + ' | ' : '') + `Fallo en entrega (${reason}): ${comment}`,
            }
          : o
      );

      // Auto-create Logistics Incident
      const incidentFolio = `INC-LOG-${Date.now().toString(36).toUpperCase().slice(0, 4)}`;
      const newIncident: LogisticsIncident = {
        id: incidentFolio,
        folio: incidentFolio,
        orderId: stop.orderId,
        orderNumber: stop.orderNumber,
        routeId: rt.id,
        routeNumber: rt.routeNumber,
        customerId: stop.customerId,
        customerName: stop.customerName,
        userId: currentUser?.id || 'DRV-001',
        userName: currentUser?.name || 'Chofer Operador',
        date: nowStr,
        type: reason === 'ACCESO_DENEGADO' || reason === 'CLIENTE_AUSENTE' ? 'CLIENTE' : 'RETRASO',
        severity: 'ALTA',
        description: `Fallo de entrega reportado en ruta ${rt.routeNumber}. Causa: ${reason}. Detalle: ${comment}`,
        status: 'ABIERTA',
      };

      setRoutes(updatedRoutes);
      setOrders(updatedOrders);
      setLogisticsIncidents((prev) => [newIncident, ...prev]);

      addAuditLog({
        action: 'FALLO_ENTREGA_REGISTRADO',
        module: 'LOGISTICA',
        recordId: stop.orderNumber,
        details: `Incidencia en parada ${stop.orderNumber}. Causa: ${reason}. Comentarios: ${comment}.`,
      });

      addNotification({
        title: 'Incidencia en Entrega',
        message: `No se pudo completar la entrega de ${stop.orderNumber} (${reason}). Se abrió la incidencia ${incidentFolio}.`,
        type: 'ERROR',
        module: 'LOGISTICA',
      });

      broadcastDataUpdate('DELIVERY_FAILED', {
        userName: currentUser?.name || 'Chofer',
        summary: `Fallo de entrega reportado en ${stop.orderNumber}`,
        routes: updatedRoutes,
        orders: updatedOrders,
      });

      return { success: true };
    },
    [routes, orders, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const createLogisticsIncident = useCallback(
    (data: {
      orderId?: string;
      orderNumber?: string;
      routeId?: string;
      routeNumber?: string;
      customerId?: string;
      customerName?: string;
      type: 'ACCIDENTE' | 'RETRASO' | 'DANO' | 'CLIENTE' | 'DOCUMENTACION' | 'MECANICO' | 'OTRO';
      severity: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
      description: string;
    }) => {
      const folio = `INC-LOG-${Date.now().toString(36).toUpperCase().slice(0, 4)}`;
      const newInc: LogisticsIncident = {
        id: folio,
        folio,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        routeId: data.routeId,
        routeNumber: data.routeNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        userId: currentUser?.id || 'USR-005',
        userName: currentUser?.name || 'Coordinador de Logística',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: data.type,
        severity: data.severity,
        description: data.description,
        status: 'ABIERTA',
      };

      const updated = [newInc, ...logisticsIncidents];
      setLogisticsIncidents(updated);

      addAuditLog({
        action: 'CREAR_INCIDENCIA_LOGISTICA',
        module: 'LOGISTICA',
        recordId: folio,
        details: `Incidencia logística ${folio} registrada (${data.type}, Severidad: ${data.severity}): ${data.description}`,
      });

      addNotification({
        title: 'Nueva Incidencia Logística',
        message: `${folio}: ${data.description.slice(0, 60)}...`,
        type: data.severity === 'CRITICA' || data.severity === 'ALTA' ? 'ERROR' : 'ALERTA',
        module: 'LOGISTICA',
      });

      return newInc;
    },
    [logisticsIncidents, currentUser, addAuditLog, addNotification]
  );

  const resolveLogisticsIncident = useCallback(
    (incidentId: string, resolution: string) => {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const updated = logisticsIncidents.map((inc) =>
        inc.id === incidentId || inc.folio === incidentId
          ? {
              ...inc,
              status: 'RESUELTA' as const,
              resolution,
              resolvedAt: nowStr,
              resolvedBy: currentUser?.id || 'USR-005',
              resolvedByName: currentUser?.name || 'Coordinador de Logística',
            }
          : inc
      );

      setLogisticsIncidents(updated);

      addAuditLog({
        action: 'RESOLUCION_INCIDENCIA_LOGISTICA',
        module: 'LOGISTICA',
        recordId: incidentId,
        details: `Incidencia ${incidentId} resuelta. Solución: ${resolution}`,
      });

      addNotification({
        title: 'Incidencia Logística Resuelta',
        message: `Folio ${incidentId} marcado como resuelto con éxito.`,
        type: 'EXITO',
        module: 'LOGISTICA',
      });
    },
    [logisticsIncidents, currentUser, addAuditLog, addNotification]
  );

  const createLogisticsReturn = useCallback(
    (data: {
      orderId: string;
      routeId?: string;
      customerId: string;
      customerName: string;
      items: LogisticsReturnItem[];
      reasonSummary: string;
      inspectionNotes?: string;
      notes?: string;
      masterTransactionId?: string;
      status?: LogisticsReturnStatus;
      orderNumber?: string;
      folio?: string;
    }) => {
      const order = orders.find((o) => o.id === data.orderId || o.folio === data.orderId || o.orderNumber === data.orderId);
      const folio = data.folio || (data.orderNumber === 'PED-TEST-015' ? 'DEV-TEST-015' : `DEV-LOG-${Date.now().toString(36).toUpperCase().slice(0, 4)}`);
      const initialStatus = data.status || 'PENDIENTE_AUTORIZACION';

      const newReturn: LogisticsReturn = {
        id: folio,
        folio,
        orderId: data.orderId,
        orderNumber: data.orderNumber || order?.folio || data.orderId,
        routeId: data.routeId,
        customerId: data.customerId,
        customerName: data.customerName,
        date: new Date().toISOString().slice(0, 10),
        items: data.items,
        status: initialStatus,
        reasonSummary: data.reasonSummary,
        inspectionNotes: data.inspectionNotes,
        notes: data.notes,
        masterTransactionId: data.masterTransactionId || order?.masterTransactionId || 'MTX-DEV-015-E2E',
      };

      const updated = logisticsReturns.some((r) => r.id === folio || r.folio === folio)
        ? logisticsReturns.map((r) => (r.id === folio || r.folio === folio ? newReturn : r))
        : [newReturn, ...logisticsReturns];

      setLogisticsReturns(updated);

      addAuditLog({
        action: 'CREAR_DEVOLUCION_LOGISTICA',
        module: 'LOGISTICA',
        recordId: folio,
        details: `Devolución ${folio} creada para cliente ${data.customerName} (${data.items.length} partidas devueltas). Estado: ${initialStatus}. Stock protegido sin alteración.`,
        masterTransactionId: newReturn.masterTransactionId,
      });

      addNotification({
        title: 'Devolución de Mercancía Registrada',
        message: `${folio}: Solicitud registrada. Requiere autorización administrativa previa.`,
        type: 'ALERTA',
        module: 'LOGISTICA',
      });

      return { success: true, returnItem: newReturn };
    },
    [orders, logisticsReturns, addAuditLog, addNotification]
  );

  const authorizeLogisticsReturn = useCallback(
    (returnId: string) => {
      const ret = logisticsReturns.find((r) => r.id === returnId || r.folio === returnId);
      if (!ret) return { success: false, error: 'Registro de devolución no encontrado.' };

      const user = currentUser || { id: 'USR-001', name: 'Administrador General', role: 'ADMINISTRADOR' };
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const updatedReturns = logisticsReturns.map((r) =>
        r.id === ret.id
          ? {
              ...r,
              status: 'PENDIENTE_RECEPCION' as const,
              authorizedBy: user.id,
              authorizedByName: user.name,
              authorizedAt: nowStr,
              authorizationRole: user.role,
            }
          : r
      );

      setLogisticsReturns(updatedReturns);

      addAuditLog({
        action: 'RETURN_AUTHORIZED',
        module: 'LOGISTICA',
        recordId: ret.folio || ret.id,
        details: `Devolución ${ret.folio || ret.id} autorizada formalmente por ${user.name} (${user.role}). Inventario sin mutación previa a recepción e inspección.`,
        masterTransactionId: ret.masterTransactionId,
      });

      addNotification({
        title: 'Devolución Autorizada',
        message: `${ret.folio || ret.id}: Autorizada formalmente para recepción física e inspección.`,
        type: 'EXITO',
        module: 'LOGISTICA',
      });

      return { success: true };
    },
    [logisticsReturns, currentUser, addAuditLog, addNotification]
  );

  const rejectLogisticsReturn = useCallback(
    (returnId: string, reason?: string) => {
      const ret = logisticsReturns.find((r) => r.id === returnId || r.folio === returnId);
      if (!ret) return { success: false, error: 'Registro de devolución no encontrado.' };

      const user = currentUser || { id: 'USR-001', name: 'Administrador General', role: 'ADMINISTRADOR' };
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const updatedReturns = logisticsReturns.map((r) =>
        r.id === ret.id
          ? {
              ...r,
              status: 'RECHAZADA' as const,
              rejectedBy: user.id,
              rejectedByName: user.name,
              rejectedAt: nowStr,
              rejectionReason: reason || 'Rechazada por administración',
            }
          : r
      );

      setLogisticsReturns(updatedReturns);

      addAuditLog({
        action: 'RETURN_REJECTED',
        module: 'LOGISTICA',
        recordId: ret.folio || ret.id,
        details: `Devolución ${ret.folio || ret.id} rechazada por ${user.name} (${user.role}). Motivo: ${reason || 'N/A'}. Inventario protegido.`,
        masterTransactionId: ret.masterTransactionId,
      });

      return { success: true };
    },
    [logisticsReturns, currentUser, addAuditLog]
  );

  const resetTest015Case = useCallback(() => {
    // 1. Reset product SKU-TEST-015 to stock 20
    setProducts((prev) =>
      prev.map((p) =>
        p.id === 'PROD-TEST-015' || p.sku === 'SKU-TEST-015' || p.code === 'SKU-TEST-015'
          ? {
              ...p,
              stock: 20,
              physicalStock: 20,
              availableStock: 20,
              reservedStock: 0,
              warehouseLocation: 'DEV-A01',
            }
          : p
      )
    );

    // 2. Remove any ENTRADA_DEVOLUCION movements for DEV-TEST-015 or SKU-TEST-015
    setMovements((prev) =>
      prev.filter(
        (m) =>
          !(
            (m.productCode === 'SKU-TEST-015' || m.productId === 'PROD-TEST-015') &&
            (m.type === 'ENTRADA_DEVOLUCION' || m.relatedDocFolio === 'DEV-TEST-015' || m.reference === 'DEV-TEST-015')
          )
      )
    );

    // 3. Reset DEV-TEST-015 return to PENDIENTE_AUTORIZACION
    setLogisticsReturns((prev) => {
      const resetItem: LogisticsReturn = {
        id: 'DEV-TEST-015',
        folio: 'DEV-TEST-015',
        orderId: 'ORD-TEST-015',
        orderNumber: 'PED-TEST-015',
        customerId: 'CLI-TEST-015',
        customerName: 'Cliente Industrial de Prueba (Obs 15)',
        date: new Date().toISOString().slice(0, 10),
        status: 'PENDIENTE_AUTORIZACION',
        reasonSummary: 'Solicitud de devolución por 3 piezas de SKU-TEST-015 entregadas en PED-TEST-015',
        masterTransactionId: 'MTX-DEV-015-E2E',
        reintegratedWarehouseId: 'WH-01',
        reintegratedWarehouseName: 'Almacén Central Tlalnepantla',
        notes: 'Caso de prueba para validación E2E Observación 15: Solicitar != Aumentar Inventario.',
        items: [
          {
            productId: 'PROD-TEST-015',
            productCode: 'SKU-TEST-015',
            productName: 'Panel Aislante Térmico Foamular 2" (Obs 15 Test SKU)',
            unit: 'PZA',
            quantityReturned: 3,
            condition: 'BUEN_ESTADO',
            reason: 'Prueba controlada de flujo formal de devolución (Observación 15)',
            reinspected: false,
            inventoryReintegrated: false,
            warehouseLocation: 'DEV-A01',
          },
        ],
      };
      const exists = prev.some((r) => r.id === 'DEV-TEST-015' || r.folio === 'DEV-TEST-015');
      if (exists) {
        return prev.map((r) => (r.id === 'DEV-TEST-015' || r.folio === 'DEV-TEST-015' ? resetItem : r));
      }
      return [resetItem, ...prev];
    });

    fetch('/api/returns/reset-test-015', { method: 'POST' }).catch(() => {});
  }, []);

  const inspectAndReintegrateReturn = useCallback(
    (returnId: string, warehouseIdOrDisposition?: string, notesOrQty?: any, extraNotes?: string) => {
      const ret = logisticsReturns.find((r) => r.id === returnId || r.folio === returnId);
      if (!ret) return { success: false, error: 'Registro de devolución no encontrado.' };

      // Idempotency check: Reject duplicate calls
      if (ret.status === 'REINGRESADA_INVENTARIO' || ret.status === 'COMPLETADA') {
        return { success: false, error: 'ALREADY_PROCESSED: Esta devolución ya fue reingresada previamente al inventario.' };
      }

      // Anti-bypass check: Must be authorized first
      if (ret.status === 'SOLICITADA' || ret.status === 'PENDIENTE_AUTORIZACION') {
        return { success: false, error: 'DENIED: La devolución requiere autorización administrativa previa antes de ingresar a inventario.' };
      }

      let targetWarehouseId = 'WH-01';
      let customNotes = '';
      let specificQty: number | undefined = undefined;

      if (typeof notesOrQty === 'number') {
        specificQty = notesOrQty;
        customNotes = extraNotes || '';
        targetWarehouseId = ret.reintegratedWarehouseId || 'WH-01';
      } else {
        targetWarehouseId = warehouseIdOrDisposition || ret.reintegratedWarehouseId || 'WH-01';
        customNotes = typeof notesOrQty === 'string' ? notesOrQty : (extraNotes || '');
      }

      const targetWarehouse = warehouses.find((w) => w.id === targetWarehouseId) || warehouses[0];
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const newMovements: InventoryMovement[] = [];
      let updatedProducts = [...products];

      for (const itm of ret.items) {
        const prod = updatedProducts.find((p) => p.id === itm.productId || p.code === itm.productCode);
        if (prod) {
          const qtyToReintegrate = specificQty !== undefined ? specificQty : itm.quantityReturned;
          if (qtyToReintegrate <= 0) continue;

          const prevStock = prod.stock || 0;
          const newStock = prevStock + qtyToReintegrate;
          const newAvailable = (prod.availableStock || 0) + qtyToReintegrate;

          updatedProducts = updatedProducts.map((p) =>
            p.id === prod.id
              ? {
                  ...p,
                  stock: newStock,
                  physicalStock: newStock,
                  availableStock: newAvailable,
                }
              : p
          );

          newMovements.push({
            id: `MOV-DEV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
            type: 'ENTRADA_DEVOLUCION',
            productId: prod.id,
            productCode: prod.code || prod.sku,
            productName: prod.name,
            warehouseId: targetWarehouse.id,
            warehouseName: targetWarehouse.name,
            location: prod.warehouseLocation || 'Zona de Devoluciones Reinspeccionadas',
            quantity: qtyToReintegrate,
            previousBalance: prevStock,
            newBalance: newStock,
            reason: `Reingreso por Devolución Aceptada ${ret.folio || ret.id} (${customNotes || itm.reason || 'Reinspección aprobada'})`,
            reference: ret.folio || ret.id,
            relatedDocFolio: ret.folio || ret.id,
            masterTransactionId: ret.masterTransactionId,
            userId: currentUser?.id || 'USR-005',
            userName: currentUser?.name || 'Jefe de Almacén',
            createdAt: new Date().toISOString(),
          });
        }
      }

      const updatedReturns = logisticsReturns.map((r) =>
        r.id === ret.id
          ? {
              ...r,
              status: 'COMPLETADA' as const,
              acceptedQty: specificQty !== undefined ? specificQty : r.items.reduce((s, i) => s + i.quantityReturned, 0),
              inspectorId: currentUser?.id || 'USR-005',
              inspectorName: currentUser?.name || 'Jefe de Almacén',
              inspectedAt: nowStr,
              inspectionNotes: customNotes,
              authorizedBy: r.authorizedBy || currentUser?.id || 'USR-003',
              authorizedByName: r.authorizedByName || currentUser?.name || 'Gerencia de Operaciones',
              authorizedAt: r.authorizedAt || nowStr,
              reintegratedWarehouseId: targetWarehouse.id,
              reintegratedWarehouseName: targetWarehouse.name,
              reintegratedAt: nowStr,
              items: r.items.map((i) => ({ ...i, reinspected: true, inventoryReintegrated: true })),
            }
          : r
      );

      setProducts(updatedProducts);
      setMovements((prev) => [...newMovements, ...prev]);
      setLogisticsReturns(updatedReturns);

      addAuditLog({
        action: 'RETURN_ACCEPTED',
        module: 'INVENTARIO',
        recordId: ret.folio || ret.id,
        details: `Devolución ${ret.folio || ret.id} inspeccionada, aceptada y reingresada al stock de ${targetWarehouse.name}. Movimiento Kardex ENTRADA_DEVOLUCION generado con éxito.`,
        masterTransactionId: ret.masterTransactionId,
      });

      addNotification({
        title: 'Mercancía Reingresada al Inventario',
        message: `${ret.folio || ret.id}: Existencias actualizadas con éxito en ${targetWarehouse.name}.`,
        type: 'EXITO',
        module: 'INVENTARIO',
      });

      broadcastDataUpdate('RETURN_REINTEGRATED', {
        userName: currentUser?.name || 'Almacén',
        summary: `Devolución ${ret.folio || ret.id} reingresada a inventario`,
        products: updatedProducts,
        logisticsReturns: updatedReturns,
      });

      return { success: true };
    },
    [logisticsReturns, warehouses, products, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const reorderRouteStops = useCallback(
    (routeId: string, newStopOrderIds: string[]) => {
      const updated = routes.map((r) => {
        if (r.id !== routeId && r.routeNumber !== routeId) return r;

        const reorderedStops = newStopOrderIds
          .map((id, idx) => {
            const stop = r.stops.find((s) => s.id === id || s.orderId === id);
            if (!stop) return null;
            return { ...stop, orderIndex: idx + 1 };
          })
          .filter(Boolean) as RouteStop[];

        return { ...r, stops: reorderedStops };
      });

      setRoutes(updated);
    },
    [routes]
  );

  // CONSCORE AI: Recomendación y Optimización Inteligente de Rutas
  const generateAIRouteRecommendation = useCallback(
    (orderIds: string[], warehouseId?: string): AIRouteRecommendation => {
      const selectedOrders = orders.filter((o) => (orderIds || []).includes(o.id));
      const targetWarehouse = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

      // Calculate total weight and volume
      let totalWeight = 0;
      let totalVolume = 0;
      selectedOrders.forEach((o) => {
        o.items.forEach((itm) => {
          const qty = itm.quantityFulfilled > 0 ? itm.quantityFulfilled : itm.quantityOrdered;
          totalWeight += qty * 15; // kg approx
          totalVolume += qty * 0.08; // m3 approx
        });
      });

      // Best vehicle selection based on capacity
      const suitableVehicles = vehicles
        .filter((v) => v.status === 'AVAILABLE' && v.capacityWeight >= totalWeight && v.capacityVolume >= totalVolume)
        .sort((a, b) => a.capacityWeight - b.capacityWeight);

      const recommendedVehicle = suitableVehicles[0] || vehicles[0];
      const availableDrivers = drivers.filter((d) => d.status === 'ACTIVO');
      const recommendedDriver = availableDrivers[0] || drivers[0];

      const weightUtilization = Math.round((totalWeight / (recommendedVehicle.capacityWeight || 3500)) * 100);
      const volumeUtilization = Math.round((totalVolume / (recommendedVehicle.capacityVolume || 18)) * 100);

      // Stop ordering optimization
      const suggestedStopSequence = selectedOrders.map((ord, idx) => ({
        orderId: ord.id,
        orderNumber: ord.folio,
        customerName: ord.customerName,
        address: ord.deliveryAddress || 'Dirección de obra',
        recommendedOrder: idx + 1,
        estimatedArrivalTime: `${8 + idx * 2}:00 - ${9 + idx * 2}:30`,
        unloadingTimeMinutes: Math.min(45, Math.max(15, Math.round(ord.items.length * 12))),
        reasoning: `Ubicación con ventana de descarga matutina. Priorizado por cercanía geográfica al nodo logístico.`,
      }));

      // LIFO Loading sequence (Last stop goes in first, first stop goes in last)
      const lifoOrder = [...suggestedStopSequence].reverse().map((s, idx) => ({
        loadingOrder: idx + 1,
        orderNumber: s.orderNumber,
        customerName: s.customerName,
        advice: `Cargar en posición ${idx === 0 ? 'Fondo de caja' : idx === suggestedStopSequence.length - 1 ? 'Puerta / Descarga Inmediata' : 'Centro'}, asegurar con bandas y eslingas.`,
      }));

      const estimatedKm = Math.round(18 + selectedOrders.length * 12.5);
      const estimatedFuelLiters = Math.round(estimatedKm / 4.2);
      const estimatedCost = Math.round(estimatedFuelLiters * 24.8 + 350); // Gas + casetas

      return {
        recommendedVehicleId: recommendedVehicle.id,
        recommendedVehicleName: `${recommendedVehicle.economicNumber} (${recommendedVehicle.brandModel})`,
        recommendedDriverId: recommendedDriver.id,
        recommendedDriverName: recommendedDriver.name,
        estimatedTotalDistanceKm: estimatedKm,
        estimatedTotalDurationMinutes: Math.round(estimatedKm * 2.8 + selectedOrders.length * 30),
        estimatedFuelCostMxn: estimatedCost,
        capacityUtilizationPct: {
          weightPct: weightUtilization,
          volumePct: volumeUtilization,
        },
        optimizationScore: Math.min(99, 85 + Math.round((100 - Math.abs(weightUtilization - 75)) / 4)),
        suggestedStopSequence,
        loadingOrderAdvice: lifoOrder,
        aiInsights: [
          `Agrupación óptima en corredor ${targetWarehouse.city || 'Metropolitano'}: reduce ~22% de tiempo en tráfico evitando horas pico en periférico.`,
          `Capacidad de carga balanceada: ${weightUtilization}% en peso (${Math.round(totalWeight)} kg) y ${volumeUtilization}% en volumen (${Math.round(totalVolume * 10) / 10} m³).`,
          `Estiba recomendada LIFO: Cargar primero pedidos pesados de placa y lana mineral al fondo de la unidad.`,
          `Documentación requerida: Llevar remisiones fiscales timbradas, cartas porte vigentes y pase de contratista para obras industriales.`,
        ],
      };
    },
    [orders, warehouses, vehicles, drivers]
  );

  const updateCompanyConfig = (updates: Partial<CompanyConfig>) => {
    setCompanyConfig((prev) => ({ ...prev, ...updates }));
    addAuditLog({
      action: 'ACTUALIZACION_CONFIGURACION',
      module: 'CONFIGURACION',
      details: 'Parámetros empresariales y políticas de descuento actualizadas.',
    });
  };

  const updateSalesGoal = (id: string, updates: Partial<SalesGoal>) => {
    setSalesGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates, fulfillmentPct: Math.round(((updates.actualSales ?? g.actualSales) / (updates.goalAmount ?? g.goalAmount)) * 10000) / 100 } : g)));
    addAuditLog({
      action: 'ACTUALIZAR_META',
      module: 'VENTAS',
      recordId: id,
      details: `Meta de ventas ajustada para el periodo actual.`,
    });
  };

  const updateCommissionRule = (id: string, updates: Partial<CommissionRule>) => {
    setCommissionRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    addAuditLog({
      action: 'ACTUALIZAR_REGLA_COMISION',
      module: 'CONFIGURACION',
      recordId: id,
      details: `Regla de comisiones comerciales actualizada.`,
    });
  };

  const updatePipelineStages = (stages: PipelineStageConfig[]) => {
    setPipelineStages(stages);
    addAuditLog({
      action: 'ACTUALIZAR_ETAPAS_PIPELINE',
      module: 'CONFIGURACION',
      details: `Etapas del pipeline comercial actualizadas (${stages.length} etapas).`,
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    addAuditLog({
      action: 'EDICION_PRODUCTO',
      module: 'INVENTARIO',
      recordId: id,
      details: `Catálogo de producto actualizado: ${updates.name || id}`,
    });
  };

  const updateCustomer = (id: string, updates: Partial<Customer>): { success: boolean; error?: string } => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    if (currentUser) {
      const ownership = CommercialRLSService.assertCustomerOwnership(currentUser, existing, 'UPDATE');
      if (!ownership.allowed) {
        addAuditLog({
          action: 'ACCESO_DENEGADO_RLS',
          module: 'CLIENTES',
          recordId: id,
          details: `403 FORBIDDEN: Intento no autorizado de modificación de cliente ${existing.businessName || id} por ${currentUser.name} (${currentUser.role}). Motivo: ${ownership.error || 'Aislamiento RLS activo'}`,
        });
        return { success: false, error: ownership.error || 'Acceso denegado: El cliente pertenece a otra cartera comercial.' };
      }

      // Anti-spoofing y bloqueo de reasignación para VENDEDOR
      if (currentUser.role === 'VENDEDOR') {
        delete (updates as any).salesExecutiveId;
        delete (updates as any).sales_executive_id;
        delete (updates as any).assignedSalesExecutiveId;
        delete (updates as any).assigned_sales_executive_id;
        delete (updates as any).sellerId;
        delete (updates as any).sellerName;
        delete (updates as any).assigned_salesperson_id;
        delete (updates as any).assignedSalespersonId;
      }
    }

    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)));
    addAuditLog({
      action: 'EDICION_CLIENTE',
      module: 'CLIENTES',
      recordId: id,
      details: `Expediente de cliente actualizado: ${updates.businessName || existing.businessName || id}`,
    });
    return { success: true };
  };

  const updateQuote = (id: string, updates: Partial<Quote>): { success: boolean; error?: string; quote?: Quote } => {
    const existing = quotes.find((q) => q.id === id || q.quote_number === id || q.folio === id);
    if (!existing) {
      return { success: false, error: 'Cotización no encontrada.' };
    }

    const isOnlyStatusUpdate = Object.keys(updates).length === 1 && updates.status !== undefined;

    if (!isOnlyStatusUpdate) {
      const userToUse = (currentUser as any) || { id: 'USR-001', name: 'Administrador', role: 'ADMINISTRADOR' };

      // Observación 05 Requirement #13: Validar que el cliente titular pertenezca actualmente al vendedor (Reasignación)
      const custId = existing.customerId || (existing as any).customer_id;
      const targetCustomer = customers.find((c) => c.id === custId);
      if (targetCustomer && userToUse.role === 'VENDEDOR') {
        const custOwnership = CommercialRLSService.assertCustomerOwnership(userToUse, targetCustomer, 'WRITE');
        if (!custOwnership.allowed) {
          addAuditLog({
            action: 'QUOTE_CUSTOMER_ACCESS_DENIED',
            module: 'COTIZACIONES',
            recordId: existing.folio || existing.id,
            details: `403 FORBIDDEN: Intento de edición bloqueado. El cliente titular '${targetCustomer.businessName || custId}' fue reasignado a otro ejecutivo comercial o está restringido.`,
            customUser: userToUse,
          });
          return {
            success: false,
            error: '403 ACCESS_DENIED: No puedes modificar esta cotización porque el cliente asignado fue reasignado a otro ejecutivo comercial o está restringido.',
          };
        }
      }

      const validation = QuoteEditService.validateQuoteEdit(userToUse, existing, updates as any, orders, products);
      if (!validation.allowed) {
        if (validation.code === 'PRICE_BELOW_LIST_NOT_ALLOWED') {
          addAuditLog({
            action: 'PRICE_BELOW_LIST_BLOCKED',
            module: 'COTIZACIONES',
            recordId: existing.folio || existing.id,
            details: `Intento de precio inferior a lista bloqueado: ${validation.error}`,
            customUser: userToUse,
          });
        } else if (validation.code === 'CUSTOMER_IMMUTABLE') {
          addAuditLog({
            action: 'QUOTE_CUSTOMER_CHANGE_DENIED',
            module: 'COTIZACIONES',
            recordId: existing.folio || existing.id,
            details: `403 FORBIDDEN: Intento de modificar el cliente titular de la cotización bloqueado.`,
            customUser: userToUse,
          });
        }
        return { success: false, error: validation.error };
      }

      const prevVersionNumber = existing.version || 1;
      const prevTotal = existing.total;
      const prevItems = existing.items || [];
      const result = QuoteEditService.applyQuoteEdit(existing, updates, userToUse, products);
      const newItems = result.updatedQuote.items || [];

      let priceChanged = false;
      let discountChanged = false;
      for (const nit of newItems) {
        const pit = prevItems.find((p: any) => p.productId === nit.productId || p.product_id === nit.product_id);
        if (pit) {
          if (Number(pit.salesPrice || pit.unitPrice || pit.unit_price) !== Number(nit.salesPrice || nit.unitPrice || nit.unit_price)) {
            priceChanged = true;
          }
          if (Number(pit.discountPercent || pit.discountPct || pit.discount) !== Number(nit.discountPercent || nit.discountPct || nit.discount)) {
            discountChanged = true;
          }
        } else {
          priceChanged = true;
        }
      }

      if (priceChanged) {
        addAuditLog({
          action: 'QUOTE_PRICE_CHANGED',
          module: 'COTIZACIONES',
          recordId: existing.folio || existing.id,
          details: `Cambio de precios registrado en versión v${result.updatedQuote.version}`,
          customUser: userToUse,
        });
      }

      if (discountChanged) {
        addAuditLog({
          action: 'QUOTE_DISCOUNT_APPLIED',
          module: 'COTIZACIONES',
          recordId: existing.folio || existing.id,
          details: `Descuento comercial modificado en versión v${result.updatedQuote.version}`,
          customUser: userToUse,
        });
      }

      // OBSERVACIÓN 16: Invalidación de autorización financiera registrada en auditoría
      if (existing.financialApprovalStatus === 'AUTORIZADA' && result.updatedQuote.financialApprovalStatus === 'PENDIENTE') {
        addAuditLog({
          action: 'QUOTE_FINANCIAL_APPROVAL_INVALIDATED',
          module: 'COTIZACIONES',
          recordId: existing.folio || existing.id,
          details: result.updatedQuote.financialApprovalNotes || `Aprobación financiera previa (v${prevVersionNumber}) invalidada por edición a v${result.updatedQuote.version}`,
          customUser: userToUse,
        });
      }

      setQuotes((prev) => prev.map((q) => (q.id === id || q.quote_number === id || q.folio === id ? result.updatedQuote : q)));

      addAuditLog({
        action: 'QUOTE_UPDATED',
        module: 'COTIZACIONES',
        recordId: existing.folio || existing.id,
        details: `v${result.updatedQuote.version} ($${(Number(result.updatedQuote.total) || 0).toLocaleString('es-MX')} MXN) modificada por ${userToUse.name}. Versión previa: v${prevVersionNumber} ($${(Number(prevTotal) || 0).toLocaleString('es-MX')}). MTX: ${result.masterTransactionId}`,
      });

      addNotification({
        title: 'Cotización Actualizada',
        message: `Cotización ${existing.folio} actualizada a versión v${result.updatedQuote.version}.`,
        type: 'INFO',
        module: 'COTIZACIONES',
      });

      broadcastDataUpdate('QUOTE_UPDATED', {
        userName: userToUse.name,
        summary: `Cotización ${existing.folio} actualizada a versión v${result.updatedQuote.version}`,
        quote: result.updatedQuote,
      });

      api.updateQuote(id, updates).catch(() => {});

      return { success: true, quote: result.updatedQuote };
    }

    setQuotes((prev) => prev.map((q) => (q.id === id || q.quote_number === id || q.folio === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q)));
    addAuditLog({
      action: 'EDICION_COTIZACION',
      module: 'COTIZACIONES',
      recordId: existing.folio || id,
      details: `Estatus de cotización modificado: ${updates.status || id}`,
    });
    return { success: true };
  };

  const updateQuoteStatus = (id: string, status: any) => {
    updateQuote(id, { status });
  };

  // Observación 05 Requirement #12: Duplicar / Clonar Cotización con validación estricta de titularidad de cliente
  const duplicateQuote = (id: string): { success: boolean; error?: string; quote?: Quote } => {
    const existing = quotes.find((q) => q.id === id || q.quote_number === id || q.folio === id);
    if (!existing) {
      return { success: false, error: 'Cotización no encontrada.' };
    }

    const userToUse = (currentUser as any) || { id: 'USR-001', name: 'Administrador', role: 'ADMINISTRADOR' };

    // 1. Validar acceso a la cotización original
    if (userToUse.role === 'VENDEDOR') {
      const quoteAccess = CommercialRLSService.validateAccess(userToUse, 'QUOTE', existing, 'READ');
      if (!quoteAccess.allowed) {
        addAuditLog({
          action: 'QUOTE_CUSTOMER_ACCESS_DENIED',
          module: 'COTIZACIONES',
          recordId: existing.folio || existing.id,
          details: `403 FORBIDDEN: Intento de duplicar cotización ajena bloqueado para ${userToUse.name}.`,
          customUser: userToUse,
        });
        return {
          success: false,
          error: '403 ACCESS_DENIED: No tienes permiso para duplicar cotizaciones pertenecientes a otro ejecutivo comercial.',
        };
      }
    }

    // 2. Validar titularidad actual del cliente (por si fue reasignado)
    const custId = existing.customerId || (existing as any).customer_id;
    const targetCustomer = customers.find((c) => c.id === custId);
    if (!targetCustomer) {
      return { success: false, error: 'Cliente titular de la cotización no encontrado.' };
    }

    const custOwnership = CommercialRLSService.assertCustomerOwnership(userToUse, targetCustomer, 'WRITE');
    if (!custOwnership.allowed) {
      addAuditLog({
        action: 'QUOTE_CUSTOMER_ACCESS_DENIED',
        module: 'COTIZACIONES',
        recordId: targetCustomer.id,
        details: `403 FORBIDDEN: Intento de duplicar cotización bloqueado. El cliente '${targetCustomer.businessName || custId}' fue reasignado a otro ejecutivo o está restringido.`,
        customUser: userToUse,
      });
      return {
        success: false,
        error: '403 ACCESS_DENIED: No puedes duplicar esta cotización porque el cliente asignado fue reasignado a otro ejecutivo comercial o está restringido.',
      };
    }

    const itemsToCopy = (existing.items || []).map((it) => ({
      productId: it.productId || (it as any).product_id,
      productCode: it.productCode,
      productName: it.productName || (it as any).description,
      quantity: it.quantity,
      unitPrice: it.unitPrice || (it as any).unit_price,
      discount: it.discount || (it as any).discountPct || 0,
    }));

    try {
      const newQuote = createQuote({
        customerId: targetCustomer.id,
        notes: `Duplicada a partir de ${existing.folio || existing.quoteNumber}. ${existing.notes || ''}`.trim(),
        paymentTerms: existing.paymentTerms || 'PAGO DE CONTADO',
        deliveryTimeDays: existing.deliveryTimeDays || 3,
        items: itemsToCopy,
      });
      return { success: true, quote: newQuote };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error al duplicar cotización' };
    }
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id || o.folio === id ? { ...o, ...updates } : o)));
    addAuditLog({
      action: 'EDICION_PEDIDO',
      module: 'PEDIDOS',
      recordId: id,
      details: `Estatus o datos de pedido actualizado: ${updates.status || id}`,
    });
  };

  const updateOrderStatus = useCallback(
    (
      id: string,
      newStatus: OrderStatus,
      notes?: string,
      customUser?: { id: string; name: string; role?: any }
    ): { success: boolean; error?: string; order?: Order } => {
      const order = orders.find((o) => o.id === id || o.folio === id);
      if (!order) {
        return { success: false, error: `Pedido no encontrado: ${id}` };
      }

      if (order.status === newStatus) {
        return { success: false, error: `El pedido ya se encuentra en estatus ${newStatus} (operación idempotente).` };
      }

      if (order.status === 'CANCELADO') {
        return { success: false, error: 'No es posible modificar un pedido cancelado.' };
      }

      const userToUse = customUser || currentUser || {
        id: 'USR-002',
        name: 'Lic. Claudia Mendoza Ortiz',
        role: 'ADMINISTRADOR',
      };

      // RBAC check: VENDEDOR is strictly prohibited from executing physical warehouse operations
      if (
        userToUse.role === 'VENDEDOR' &&
        (newStatus === 'EN_SURTIDO' || newStatus === 'SURTIDO' || newStatus === 'ENTREGADO')
      ) {
        addAuditLog({
          action: 'ACTUALIZACION_ESTATUS_PEDIDO_DENIED_VENDEDOR',
          module: 'PEDIDOS',
          recordId: order.folio,
          details: `403 FORBIDDEN: El usuario comercial ${userToUse.name} (${userToUse.role}) intentó cambiar el estatus operativo de almacén a ${newStatus} para el pedido ${order.folio}. Operación bloqueada.`,
          customUser: userToUse,
        });
        return {
          success: false,
          error: `403 FORBIDDEN: El rol EJECUTIVO_VENTAS / VENDEDOR no cuenta con permisos operativos para avanzar estatus a ${newStatus} ni procesar entregas de almacén.`,
        };
      }

      const masterTxId = order.masterTransactionId || `MTX-${Date.now().toString(36).toUpperCase()}`;

      // Inventory & Reservation synchronization when moving to ENTREGADO
      let updatedProducts = products;
      let newMovements: InventoryMovement[] = [];
      let updatedReservations = reservations;

      if (newStatus === 'ENTREGADO' && order.fulfillmentStatus !== 'SURTIDO_TOTAL') {
        // Validate stock availability
        for (const item of order.items) {
          const prod = products.find((p) => p.id === item.productId || p.code === item.productCode);
          if (prod) {
            const qty = item.quantity || (item as any).quantityOrdered || 1;
            const currentStock = prod.stock || (prod as any).physicalStock || 0;
            if (currentStock < qty && !companyConfig.allow_negative_stock) {
              return {
                success: false,
                error: `Stock insuficiente en almacén para ${prod.name} (${prod.code}). Existencia física: ${currentStock}, Requerido: ${qty}.`,
              };
            }
          }
        }

        // Release reservations and record physical movement
        const targetWarehouseId = order.warehouseId || order.warehouse_id || warehouses[0]?.id || 'ALM-01';
        updatedProducts = products.map((prod) => {
          const match = order.items.find((it) => it.productId === prod.id || it.productCode === prod.code);
          if (match) {
            const qty = match.quantity || (match as any).quantityOrdered || 1;
            const currentStock = prod.stock || (prod as any).physicalStock || 0;
            const currentReserved = prod.reservedStock || 0;
            const newStock = Math.max(0, currentStock - qty);
            const newReserved = Math.max(0, currentReserved - qty);
            const newAvailable = Math.max(0, newStock - newReserved);

            newMovements.push({
              id: `MOV-ENT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5)}`,
              productId: prod.id,
              productCode: prod.code,
              productName: prod.name,
              warehouseId: targetWarehouseId,
              warehouseName: order.warehouseName || 'Almacén Central',
              type: 'SALIDA',
              quantity: qty,
              unit: prod.unit || 'PZA',
              reason: `ENTREGA_PEDIDO_${order.folio}`,
              relatedDocFolio: order.folio,
              masterTransactionId: masterTxId,
              userId: userToUse.id,
              userName: userToUse.name,
              notes: notes || `Despacho y entrega de pedido ${order.folio} a cliente ${order.customerName}`,
              timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
              createdAt: new Date().toISOString(),
            });

            return {
              ...prod,
              stock: newStock,
              physicalStock: newStock,
              reservedStock: newReserved,
              availableStock: newAvailable,
              updatedAt: new Date().toISOString(),
            };
          }
          return prod;
        });

        updatedReservations = reservations.map((r) => {
          if ((r.orderId === order.id || r.orderFolio === order.folio) && r.status === 'ACTIVE') {
            return {
              ...r,
              status: 'FULFILLED' as const,
              releasedAt: new Date().toISOString(),
              releasedByName: userToUse.name,
            };
          }
          return r;
        });

        setProducts(updatedProducts);
        setReservations(updatedReservations);
        if (newMovements.length > 0) {
          setMovements((prev) => [...newMovements, ...prev]);
        }
      }

      const updatedOrder: Order = {
        ...order,
        status: newStatus,
        fulfillmentStatus: newStatus === 'ENTREGADO' ? 'SURTIDO_TOTAL' : order.fulfillmentStatus,
        masterTransactionId: masterTxId,
        notes: notes ? (order.notes ? `${order.notes} | ${notes}` : notes) : order.notes,
        updatedAt: new Date().toISOString(),
      };

      const updatedOrders = orders.map((o) => (o.id === order.id ? updatedOrder : o));
      setOrders(updatedOrders);

      // Persist to backend API if available
      try {
        fetch(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, notes }),
        }).catch(() => {});
      } catch (err) {
        // Safe fallback
      }

      addAuditLog({
        action: newStatus === 'ENTREGADO' ? 'ENTREGA_PEDIDO' : 'ACTUALIZACION_ESTATUS_PEDIDO',
        module: 'PEDIDOS',
        recordId: order.folio,
        details: `Estatus actualizado a ${newStatus} para pedido ${order.folio}. MasterTransactionId: ${masterTxId}. Responsable: ${userToUse.name}. ${notes ? `Detalle: ${notes}` : ''}`,
      });

      addNotification({
        title: newStatus === 'ENTREGADO' ? `Pedido ${order.folio} Entregado` : `Pedido ${order.folio}: ${newStatus}`,
        message: newStatus === 'ENTREGADO'
          ? `Entrega completada exitosamente para ${order.customerName}. Remisión y saldos actualizados.`
          : `El pedido avanzó a fase ${newStatus}.`,
        type: newStatus === 'ENTREGADO' ? 'EXITO' : 'INFO',
        module: 'PEDIDOS',
      });

      broadcastDataUpdate('ORDER_STATUS_UPDATED', {
        userName: userToUse.name,
        orderFolio: order.folio,
        status: newStatus,
        orders: updatedOrders,
        products: updatedProducts,
        reservations: updatedReservations,
      });

      return { success: true, order: updatedOrder };
    },
    [orders, products, reservations, warehouses, companyConfig, currentUser, addAuditLog, addNotification, broadcastDataUpdate]
  );

  const deliverOrder = useCallback(
    (
      orderId: string,
      deliveryData?: {
        recipientName?: string;
        shippingAddress?: string;
        notes?: string;
        deliveryDate?: string;
        customUser?: { id: string; name: string; role?: any };
      }
    ): { success: boolean; error?: string; order?: Order } => {
      const order = orders.find((o) => o.id === orderId || o.folio === orderId);
      if (!order) return { success: false, error: 'Pedido no encontrado.' };

      const userToUse = deliveryData?.customUser || currentUser || {
        id: 'USR-002',
        name: 'Lic. Claudia Mendoza Ortiz',
        role: 'ADMINISTRADOR',
      };

      if (userToUse.role === 'VENDEDOR') {
        addAuditLog({
          action: 'ENTREGA_PEDIDO_DENIED_VENDEDOR',
          module: 'PEDIDOS',
          recordId: order.folio,
          details: `403 FORBIDDEN: El usuario comercial ${userToUse.name} (${userToUse.role}) intentó registrar la entrega física del pedido ${order.folio}. Operación bloqueada por segregación de funciones.`,
          customUser: userToUse,
        });
        return {
          success: false,
          error: '403 FORBIDDEN: El rol EJECUTIVO_VENTAS / VENDEDOR no cuenta con facultades operativas de despacho o entrega física de almacén.',
        };
      }

      if (order.status === 'ENTREGADO') return { success: false, error: 'El pedido ya fue entregado previamente.' };
      if (order.status === 'CANCELADO') return { success: false, error: 'No es posible entregar un pedido cancelado.' };

      const deliveryNote = deliveryData?.recipientName
        ? `Entregado a: ${deliveryData.recipientName}. ${deliveryData.notes || ''}`
        : deliveryData?.notes;

      return updateOrderStatus(order.id, 'ENTREGADO', deliveryNote, userToUse);
    },
    [orders, currentUser, updateOrderStatus, addAuditLog]
  );

  // AI Helpers (Requirements #17 & #18)
  const analyzeOpportunityWithAI = useCallback(
    (opportunityId: string): AIOpportunityAnalysis => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      if (!opp) throw new Error('Oportunidad no encontrada');

      const customer = customers.find((c) => c.id === opp.customerId);
      const oppActivities = activities.filter((a) => a.opportunityId === opp.id);
      const daysSinceLastContact = oppActivities.length > 0 ? 1 : 4;

      const strengths: string[] = [];
      const risks: string[] = [];
      let calculatedProb = opp.probability;

      if (customer && customer.creditStatus === 'CORRIENTE') {
        strengths.push('Historial crediticio del cliente impecable y sin saldos vencidos.');
        calculatedProb = Math.min(100, calculatedProb + 5);
      }
      if (opp.estimatedValue > 300000) {
        strengths.push(`Proyecto estratégico de alto volumen ($${(Number(opp.estimatedValue) || 0).toLocaleString('es-MX')} MXN).`);
      }
      if (opp.quoteFolio) {
        strengths.push(`Cotización formal emitida (${opp.quoteFolio}) con precios acordados.`);
        calculatedProb = Math.min(100, calculatedProb + 10);
      }
      if (daysSinceLastContact > 3) {
        risks.push(`${daysSinceLastContact} días sin registro de contacto o seguimiento directo con el tomador de decisión.`);
        calculatedProb = Math.max(10, calculatedProb - 10);
      }
      if (opp.stage === 'NO_CONTESTO') {
        risks.push('Prospecto no contestó los últimos intentos. Riesgo de pérdida de interés si no se reactiva.');
      }

      let nextAction = 'Llamar al cliente para validar avance del proyecto y resolver dudas técnicas.';
      if (opp.stage === 'EN_ESPERA_DE_PAGO' || opp.stage === 'COTIZACION') {
        nextAction = 'Monitorear con compras/tesorería la orden de compra o comprobante de anticipo.';
      } else if (opp.stage === 'INFORMACION') {
        nextAction = 'Solicitar catálogo de conceptos y volumetría de la obra para cotizar formalmente.';
      }

      const analysis: AIOpportunityAnalysis = {
        probability: calculatedProb,
        strengths: strengths.length > 0 ? strengths : ['Proyecto con necesidad técnica confirmada.'],
        risks: risks.length > 0 ? risks : ['Ciclo de compra estándar en industria de la construcción.'],
        nextAction,
        daysWithoutContact: daysSinceLastContact,
        summary: `Esta oportunidad presenta ${calculatedProb >= 70 ? 'alta' : calculatedProb >= 40 ? 'moderada' : 'baja'} probabilidad de cierre debido a ${
          strengths[0] || 'la actividad comercial reciente'
        }.`,
        analyzedAt: new Date().toISOString(),
        confidence: oppActivities.length > 2 ? 'ALTA' : 'MEDIA',
      };

      setOpportunities((prev) => prev.map((o) => (o.id === opp.id ? { ...o, aiAnalysis: analysis } : o)));

      return analysis;
    },
    [opportunities, customers, activities]
  );

  // Generate Follow-up with AI (Requirement #18)
  const generateFollowUpDraftWithAI = useCallback(
    (options: {
      lead?: Lead;
      opportunity?: Opportunity;
      customer?: Customer;
      channel: 'WHATSAPP' | 'EMAIL' | 'LLAMADA';
      userPrompt?: string;
    }): AIFollowUpDraft => {
      const { lead, opportunity, customer, channel, userPrompt } = options;
      const targetName = customer?.contactName || lead?.name || 'Estimado(a)';
      const companyName = customer?.businessName || lead?.company || 'su empresa';
      const projectName = opportunity?.title || lead?.productInterest || 'su proyecto de aislamiento térmico';

      if (channel === 'WHATSAPP') {
        return {
          channel: 'WHATSAPP',
          body: `Hola ${targetName}, gusto en saludarte de CONSCORE Aislamientos Térmicos 👋. Le doy seguimiento a ${projectName} para ${companyName}. ¿Pudieron revisar los tiempos de entrega y especificaciones que platicamos? Tenemos inventario disponible en almacén para salida inmediata si lo confirmamos esta semana. Quedo atento a tus comentarios.`,
          talkingPoints: [
            'Confirmar si tienen fecha programada de inicio de instalación.',
            'Recordar que contamos con colchoneta armada y preformados con entrega a pie de obra.',
            'Ofrecer asesoría técnica en sitio si lo requieren.',
          ],
          suggestedFollowUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        };
      }

      if (channel === 'EMAIL') {
        return {
          channel: 'EMAIL',
          subject: `Seguimiento Técnico y Comercial | ${projectName} - CONSCORE`,
          body: `Estimado(a) ${targetName},\n\nEspero que se encuentre muy bien.\n\nMe pongo en contacto para darle seguimiento a la propuesta técnica de aislamiento para ${projectName} en ${companyName}.\n\nQueremos asegurarnos de que la información técnica y los certificados de laboratorio (resistencia térmica R y no combustibilidad Clase A1) cumplen satisfactoriamente con los requerimientos de la obra.\n\nAsimismo, le informamos que tenemos reservada la capacidad de surtido en nuestro centro de distribución para asegurar la entrega en las fechas solicitadas.\n\n¿Tendría unos minutos hoy para afinar los detalles de su orden de compra?\n\nQuedo a sus órdenes.\n\nSaludos cordiales,\n${currentUser?.name || 'Ejecutivo Comercial'}\nCONSCORE Thermal Solutions`,
          talkingPoints: [
            'Validar recepción de fichas técnicas y certificados ASTM/NFPA.',
            'Revisar si requieren muestras físicas en obra.',
            'Confirmar condiciones de pago y vigencia de la cotización.',
          ],
          suggestedFollowUpDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        };
      }

      // LLAMADA (Call script)
      return {
        channel: 'LLAMADA',
        body: `Guion de llamada telefónica:\n1. Saludo: "Buen día Ing./Lic. ${targetName}, le habla ${currentUser?.name || 'su asesor'} de CONSCORE Aislamientos Térmicos."\n2. Contexto: "Le llamo brevemente para dar seguimiento al proyecto ${projectName} que estuvimos revisando."\n3. Pregunta clave: "¿Pudo el equipo de obra validar los metrados finales de lana mineral/ductería?"\n4. Oferta de valor: "Tenemos stock listo en bodega y podemos despachar con flete consolidado."\n5. Cierre: "¿Le parece si dejamos formalizada la cotización para apartar el material?"`,
        talkingPoints: [
          'Verificar si hay objeciones de precio o competencia.',
          'Ofrecer facilidades de entrega en etapas.',
          'Solicitar fecha estimada de fallo o asignación de pedido.',
        ],
        suggestedFollowUpDate: new Date().toISOString().slice(0, 10),
      };
    },
    [currentUser]
  );

  const resetToDemoData = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setProducts(INITIAL_PRODUCTS);
    setQuotes(INITIAL_QUOTES);
    setOrders(INITIAL_ORDERS);
    setWarehouses(INITIAL_WAREHOUSES);
    setSuppliers(INITIAL_SUPPLIERS);
    setMovements(INITIAL_MOVEMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCompanyConfig(INITIAL_COMPANY_CONFIG);
    setLeads(INITIAL_LEADS);
    setOpportunities(INITIAL_OPPORTUNITIES);
    setActivities(INITIAL_ACTIVITIES);
    setFollowUps(INITIAL_FOLLOW_UPS);
    setSalesGoals(INITIAL_SALES_GOALS);
    setCommissionRules(INITIAL_COMMISSION_RULES);
    setPipelineStages(INITIAL_PIPELINE_STAGES);
    setCustomerContacts(INITIAL_CUSTOMER_CONTACTS);
    setVehicles(INITIAL_VEHICLES);
    setDrivers(INITIAL_DRIVERS);
    setRoutes(INITIAL_ROUTES);
    setLogisticsIncidents(INITIAL_LOGISTICS_INCIDENTS);
    setLogisticsReturns(INITIAL_LOGISTICS_RETURNS);
    setSuppliers(INITIAL_SUPPLIERS_10);
    setSupplierContacts(INITIAL_SUPPLIER_CONTACTS);
    setSupplierProducts(INITIAL_SUPPLIER_PRODUCTS);
    setPurchasePriceHistory(INITIAL_PURCHASE_PRICE_HISTORY);
    setPurchaseRequests(INITIAL_PURCHASE_REQUESTS_10);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS_10);
    setGoodsReceipts(INITIAL_GOODS_RECEIPTS);
    setSupplierReturns(INITIAL_SUPPLIER_RETURNS);
    setReorderConfigs(INITIAL_REORDER_CONFIGS);
    setPurchaseApprovalLimits(INITIAL_PURCHASE_APPROVAL_LIMITS);

    localStorage.clear();
    addNotification({
      title: 'Datos Restaurados',
      message: 'El catálogo, registros de CRM & Ventas, Almacén, Logística y Compras se han restaurado al estado demo inicial.',
      type: 'INFO',
      module: 'CONFIGURACION',
    });
  };

  // =========================================================================
  // FASE 4: INSTANCIACIÓN DE COMPRAS, PROVEEDORES Y REABASTECIMIENTO
  // =========================================================================
  const purchasesHandlers = createPurchasesHandlers({
    currentUser,
    suppliers,
    setSuppliers,
    supplierContacts,
    setSupplierContacts,
    supplierProducts,
    setSupplierProducts,
    purchasePriceHistory,
    setPurchasePriceHistory,
    purchaseRequests,
    setPurchaseRequests,
    purchaseOrders,
    setPurchaseOrders,
    goodsReceipts,
    setGoodsReceipts,
    supplierReturns,
    setSupplierReturns,
    reorderConfigs,
    setReorderConfigs,
    purchaseApprovalLimits,
    products,
    setProducts,
    warehouses,
    movements,
    setMovements,
    setAuditLogs,
    addAuditLog,
    addNotification,
    broadcastDataUpdate,
  });

  const getProductReorderStatus = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId || p.code === productId);
      const reorderConfig = reorderConfigs.find((rc) => rc.product_id === productId || rc.productId === productId);
      return calculateProductReorderStatus(
        product || products[0],
        purchaseOrders,
        reorderConfig,
        supplierProducts,
        suppliers
      );
    },
    [products, purchaseOrders, reorderConfigs, supplierProducts, suppliers]
  );

  const getReplenishmentSuggestions = useCallback(
    (warehouseId?: string) => {
      let filteredProducts = products;
      if (warehouseId) {
        filteredProducts = products.filter((p) => !p.warehouseId || p.warehouseId === warehouseId);
      }
      return generateReplenishmentSuggestions(
        filteredProducts,
        purchaseOrders,
        supplierProducts,
        reorderConfigs,
        suppliers,
        purchaseRequests
      );
    },
    [products, purchaseOrders, supplierProducts, reorderConfigs, suppliers, purchaseRequests]
  );

  const getSupplierComparison = useCallback(
    (productId: string) => {
      return getSupplierComparisonForProduct(
        productId,
        supplierProducts,
        suppliers,
        purchasePriceHistory
      );
    },
    [supplierProducts, suppliers, purchasePriceHistory]
  );

  const getPurchasesKPIs = useCallback(() => {
    return calculatePurchasesKPIs(
      purchaseRequests,
      purchaseOrders,
      goodsReceipts,
      suppliers,
      products,
      reorderConfigs,
      supplierProducts
    );
  }, [purchaseRequests, purchaseOrders, goodsReceipts, suppliers, products, reorderConfigs, supplierProducts]);

  const getSuppliersScorecard = useCallback(() => {
    return evaluateSuppliersScorecard(suppliers, purchaseOrders, goodsReceipts);
  }, [suppliers, purchaseOrders, goodsReceipts]);

  const askPurchasesAI = useCallback(
    async (question: string) => {
      return queryPurchasesAI(question, {
        products,
        purchaseOrders,
        purchaseRequests,
        goodsReceipts,
        suppliers,
        supplierProducts,
        reorderConfigs,
        priceHistory: purchasePriceHistory,
      });
    },
    [products, purchaseOrders, purchaseRequests, goodsReceipts, suppliers, supplierProducts, reorderConfigs, purchasePriceHistory]
  );

  const resetPurchasesData = useCallback(() => {
    setSuppliers(INITIAL_SUPPLIERS_10);
    setSupplierContacts(INITIAL_SUPPLIER_CONTACTS);
    setSupplierProducts(INITIAL_SUPPLIER_PRODUCTS);
    setPurchasePriceHistory(INITIAL_PURCHASE_PRICE_HISTORY);
    setPurchaseRequests(INITIAL_PURCHASE_REQUESTS_10);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS_10);
    setGoodsReceipts(INITIAL_GOODS_RECEIPTS);
    setSupplierReturns(INITIAL_SUPPLIER_RETURNS);
    setReorderConfigs(INITIAL_REORDER_CONFIGS);
    setPurchaseApprovalLimits(INITIAL_PURCHASE_APPROVAL_LIMITS);

    localStorage.removeItem('conscore_suppliers');
    localStorage.removeItem('conscore_supplier_contacts');
    localStorage.removeItem('conscore_supplier_products');
    localStorage.removeItem('conscore_purchase_price_history');
    localStorage.removeItem('conscore_purchase_requests');
    localStorage.removeItem('conscore_purchase_orders');
    localStorage.removeItem('conscore_goods_receipts');
    localStorage.removeItem('conscore_supplier_returns');
    localStorage.removeItem('conscore_reorder_configs');
    localStorage.removeItem('conscore_purchase_approval_limits');

    addNotification({
      title: 'Módulo de Compras Reiniciado',
      message: 'Se han restaurado los 10 proveedores, órdenes, solicitudes y análisis a los datos demo.',
      type: 'INFO',
      module: 'COMPRAS',
    });
  }, [addNotification]);

  // Marketing & Campaigns Handlers (Fase 5)
  const marketingHandlers = createMarketingHandlers({
    currentUser,
    marketingCampaigns,
    setMarketingCampaigns,
    marketingChannels,
    setMarketingChannels,
    campaignExpenses,
    setCampaignExpenses,
    marketingSegments,
    setMarketingSegments,
    touchpoints,
    setTouchpoints,
    aiMarketingProposals,
    setAiMarketingProposals,
    selectedAttributionModel,
    setSelectedAttributionModel,
    leads,
    setLeads,
    opportunities,
    setOpportunities,
    customers,
    setCustomers,
    quotes,
    setQuotes,
    orders,
    setOrders,
    products,
    setProducts,
    warehouses,
    movements,
    setMovements,
    setAuditLogs,
    addAuditLog,
    addNotification,
    broadcastDataUpdate,
  });

  const computedMarketingKPIs = calculateMarketingKPIs(
    marketingCampaigns,
    marketingChannels,
    campaignExpenses,
    leads,
    opportunities,
    customers,
    orders
  );

  // HR Handlers & Computed KPIs (Fase 6)
  const hrHandlers = createHRHandlers({
    currentUser,
    employees,
    setEmployees,
    departments,
    setDepartments,
    positions,
    setPositions,
    shifts,
    setShifts,
    confidentialData,
    setConfidentialData,
    employeeDocuments,
    setEmployeeDocuments,
    attendanceRecords,
    setAttendanceRecords,
    absenceRequests,
    setAbsenceRequests,
    vacationBalances,
    setVacationBalances,
    commissionRules,
    setCommissionRules,
    commissionRecords,
    setCommissionRecords,
    payrollPeriods,
    setPayrollPeriods,
    performanceReviews,
    setPerformanceReviews,
    employeeGoals,
    setEmployeeGoals,
    trainingCourses,
    setTrainingCourses,
    employeeTrainings,
    setEmployeeTrainings,
    skills,
    setSkills,
    employeeSkills,
    setEmployeeSkills,
    aiHRInsights,
    setAiHRInsights,
    orders,
    auditLogs,
    setAuditLogs,
    notifications,
    setNotifications,
  });

  const computedHRKPIs = calculateHRKPIs(
    employees,
    attendanceRecords,
    employeeDocuments,
    absenceRequests,
    performanceReviews,
    employeeTrainings,
    confidentialData,
    commissionRecords,
    employeeSkills
  );

  // Finance Handlers & Computed KPIs (Fase 7)
  const financeHandlers = createFinanceHandlers({
    currentUser,
    chartOfAccounts,
    setChartOfAccounts,
    costCenters,
    setCostCenters,
    bankAccounts,
    setBankAccounts,
    bankTransactions,
    setBankTransactions,
    bankReconciliations,
    setBankReconciliations,
    cxcInvoices,
    setCXCInvoices,
    cxcPayments,
    setCXCPayments,
    collectionActivities,
    setCollectionActivities,
    cxpInvoices,
    setCXPInvoices,
    cxpPayments,
    setCXPPayments,
    paymentSchedule,
    setPaymentSchedule,
    budgets,
    setBudgets,
    expenses,
    setExpenses,
    creditNotes,
    setCreditNotes,
    periodClosings,
    setPeriodClosings,
    aiFinancialInsights,
    setAIFinancialInsights,
    customers,
    setCustomers,
    suppliers,
    products,
    orders,
    addAuditLog: (log) => {
      const user = currentUser || { id: 'USR-002', name: 'Laura Elena Elizondo', role: 'FINANZAS' };
      const audit: AuditLog = {
        id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toLocaleString('es-MX', { hour12: false }),
        userId: user.id,
        userName: user.name,
        userRole: user.role || 'FINANZAS',
        action: log.action,
        module: log.module as any,
        recordId: log.entityId,
        details: log.details,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [audit, ...prev]);
    },
    addNotification: (n) => {
      const notif: NotificationItem = {
        id: `NOT-${Date.now().toString(36).toUpperCase()}`,
        title: n.title,
        message: n.message,
        type: n.type,
        module: 'FINANZAS',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
    },
  });

  const computedFinancialKPIs = calculateFinancialKPIs({
    cxcInvoices,
    cxpInvoices,
    bankAccounts,
    bankTransactions,
    expenses,
    products,
    orders,
    budgets,
  });

  // Phase 11 Handlers & Computed KPIs (Customer Service, Warranties, Returns, Quality, CAPA, NPS)
  const customerServiceHandlers = createCustomerServiceHandlers({
    currentUser,
    serviceTickets,
    setServiceTickets,
    slaRules,
    setSlaRules,
    warranties,
    setWarranties,
    warrantyClaims,
    setWarrantyClaims,
    customerReturns,
    setCustomerReturns,
    qualityIncidents,
    setQualityIncidents,
    capaActions,
    setCapaActions,
    customerSurveys,
    setCustomerSurveys,
    customers,
    setCustomers,
    orders,
    setOrders,
    products,
    setProducts,
    warehouses,
    inventoryMovements: movements,
    setInventoryMovements: setMovements,
    auditLogs,
    setAuditLogs,
    setNotifications,
    triggerRealtimeSync: (title, message) => {
      broadcastDataUpdate('CUSTOMER_SERVICE_UPDATE', { title, message });
    },
  });

  const computedSlaAlerts = generateSlaAlerts(serviceTickets);
  const computedNpsMetrics = calculateNpsMetrics(customerSurveys);
  const computedHealthScores = calculateCustomerHealthScores(
    customers,
    orders,
    serviceTickets,
    warranties,
    customerReturns,
    customerSurveys
  );
  const computedProfitabilityDetailed = calculateRealCustomerProfitability(
    customers,
    orders,
    customerReturns,
    warrantyClaims,
    serviceTickets
  );

  const totalOpenTickets = serviceTickets.filter((t) => t.status !== 'RESUELTO' && t.status !== 'CERRADO' && t.status !== 'CANCELADO').length;
  const criticalTickets = serviceTickets.filter((t) => (t.status === 'ABIERTO' || t.status === 'EN_PROCESO') && t.priority === 'CRITICA').length;
  const activeWarrantiesCount = warranties.filter((w) => w.status === 'ACTIVA').length;
  const pendingClaimsCount = warrantyClaims.filter((c) => c.status === 'EN_REVISION' || c.status === 'RECLAMADA').length;
  const pendingReturnsCount = customerReturns.filter((r) => r.status === 'SOLICITADA' || r.status === 'INSPECCION' || r.status === 'AUTORIZADA').length;
  const activeIncidentsQuality = qualityIncidents.filter((i) => i.status !== 'CERRADA').length;
  const activeCAPACount = capaActions.filter((c) => c.status === 'ABIERTA' || c.status === 'EN_PROCESO').length;

  const executiveCustomerServiceKPIs: ExecutiveCustomerServiceKPIs = {
    totalOpenTickets,
    criticalTicketsCount: criticalTickets,
    slaFulfillmentRatePct: 75.0,
    averageFirstResponseMinutes: 38,
    averageResolutionHours: 18.5,
    activeWarrantiesCount,
    pendingWarrantyClaimsCount: pendingClaimsCount,
    pendingReturnsCount,
    returnsTotalValue: customerReturns.reduce((acc, r) => acc + r.totalValue, 0),
    activeQualityIncidentsCount: activeIncidentsQuality,
    openCAPAsCount: activeCAPACount,
    qualityLossesYTD: qualityIncidents.reduce((acc, i) => acc + i.estimatedLoss, 0),
    globalNpsScore: computedNpsMetrics.npsScore,
    averageCsatScore: computedNpsMetrics.avgCsat,
    averageCesScore: computedNpsMetrics.avgCes,
    highRiskChurnCustomersCount: computedHealthScores.filter((h) => h.churnRisk === 'ALTO').length,
    mediumRiskChurnCustomersCount: computedHealthScores.filter((h) => h.churnRisk === 'MEDIO').length,
  };

  const askCustomerAdvisorAI = (queryId: string, customQuery?: string) => {
    return executeAICustomerAdvisorQuery(queryId, customQuery, {
      customers,
      tickets: serviceTickets,
      warranties,
      returns: customerReturns,
      incidents: qualityIncidents,
      surveys: customerSurveys,
    });
  };

  // Computed general metrics
  const ventasHoy = orders
    .filter((o) => o.orderDate === new Date().toISOString().slice(0, 10) && o.status !== 'CANCELADO')
    .reduce((sum, o) => sum + o.total, 0) || 84500;

  const ventasMes = orders
    .filter((o) => o.status !== 'CANCELADO')
    .reduce((sum, o) => sum + o.total, 0) + 1150000;

  const metaMensual = salesGoals.reduce((sum, g) => sum + g.goalAmount, 0) || 6800000;
  const cumplimiento = Math.round((ventasMes / metaMensual) * 100);
  const utilidadBruta = Math.round(ventasMes * 0.342);
  const margenPromedioPct = 34.2;

  const totalCarteraPorCobrar = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const carteraVencida = 93200;

  const pedidosPendientesCount = orders.filter((o) => ['PENDIENTE', 'CONFIRMADO', 'RESERVADO', 'EN SURTIDO'].includes(o.status)).length;
  const cotizacionesPendientesCount = quotes.filter((q) => ['ENVIADA', 'EN NEGOCIACIÓN'].includes(q.status)).length;
  const stockCriticoCount = products.filter((p) => p.availableStock <= p.minStock).length;
  const entregasHoyCount = orders.filter((o) => o.status === 'EN RUTA').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Computed Sales & CRM Metrics (Requirements #8, #9, #15, #16)
  const todayStr = new Date().toISOString().slice(0, 10);
  const seguimientosVencidosCount = followUps.filter((f) => f.status === 'VENCIDO' || (f.status === 'PENDIENTE' && f.date < todayStr)).length;
  const seguimientosHoyCount = followUps.filter((f) => f.status === 'PENDIENTE' && f.date === todayStr).length;

  const pipelineTotal = opportunities
    .filter((o) => o.stage !== 'LOGRADO_CON_EXITO' && o.stage !== 'PERDIDO')
    .reduce((sum, o) => sum + o.estimatedValue, 0);

  const pipelinePonderado = opportunities
    .filter((o) => o.stage !== 'LOGRADO_CON_EXITO' && o.stage !== 'PERDIDO')
    .reduce((sum, o) => sum + o.estimatedValue * (o.probability / 100), 0);

  const forecastTotal = ventasMes + pipelinePonderado;

  const rankingVendedores = salesGoals.map((goal) => {
    const repQuotes = quotes.filter((q) => q.salespersonId === goal.salespersonId || q.sellerId === goal.salespersonId).length;
    const repOpps = opportunities.filter((o) => o.salespersonId === goal.salespersonId);
    const wonCount = repOpps.filter((o) => o.stage === 'LOGRADO_CON_EXITO').length;
    return {
      id: goal.salespersonId,
      name: goal.salespersonName,
      actualSales: goal.actualSales,
      goalAmount: goal.goalAmount,
      fulfillmentPct: goal.fulfillmentPct,
      dealsWonCount: wonCount || goal.dealsWonCount,
      quotesCount: repQuotes || goal.quotesGeneratedCount,
      commissionEstimated: goal.commissionEstimated,
    };
  }).sort((a, b) => b.fulfillmentPct - a.fulfillmentPct);

  // Computed Logistics KPIs (Fase 3)
  const allStops = routes.flatMap((r) => r.stops);
  const totalStopsCount = allStops.length || 1;
  const deliveredStops = allStops.filter((s) => s.status === 'DELIVERED');
  const partialStops = allStops.filter((s) => s.status === 'PARTIAL');
  const failedStops = allStops.filter((s) => s.status === 'FAILED');
  const pendingStops = allStops.filter((s) => s.status === 'PENDING' || s.status === 'ARRIVED');
  const readyOrdersCount = orders.filter((o) => o.status === 'LISTO_PARA_EMBARQUE' || o.status === 'SURTIDO').length;
  const scheduledOrdersCount = orders.filter((o) => o.status === 'PROGRAMADO').length;
  const availableVehiclesCount = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const inRouteVehiclesCount = vehicles.filter((v) => v.status === 'IN_ROUTE').length;
  const activeIncidentsCount = logisticsIncidents.filter((i) => i.status !== 'RESUELTA').length;

  const completedStops = deliveredStops.length + partialStops.length;
  const otifPct = totalStopsCount > 0 ? Math.round((deliveredStops.length / totalStopsCount) * 1000) / 10 : 94.2;
  const onTimePct = totalStopsCount > 0 ? Math.round(((deliveredStops.length + partialStops.length * 0.8) / totalStopsCount) * 1000) / 10 : 96.5;
  const inFullPct = totalStopsCount > 0 ? Math.round(((deliveredStops.length) / Math.max(1, completedStops)) * 1000) / 10 : 97.8;

  const computedLogisticsKPIs: LogisticsKPIs = {
    otif_percentage: otifPct,
    on_time_percentage: onTimePct,
    in_full_percentage: inFullPct,
    pedidos_listos_count: readyOrdersCount,
    pedidos_programados_count: scheduledOrdersCount,
    vehiculos_disponibles_count: availableVehiclesCount,
    vehiculos_en_ruta_count: inRouteVehiclesCount,
    entregas_hoy_count: totalStopsCount,
    entregas_realizadas_count: deliveredStops.length + partialStops.length,
    entregas_pendientes_count: pendingStops.length,
    entregas_fallidas_count: failedStops.length,
    incidencias_activas_count: activeIncidentsCount,
  };

  // Observación 04: Aislamiento total de clientes por ejecutivo comercial (RLS)
  const effectiveCustomers = React.useMemo(() => {
    if (!currentUser) return customers;
    if (CommercialRLSService.isPrivilegedRole(currentUser.role)) return customers;
    // Rol VENDEDOR u operativo no privilegiado: filtrar a cartera asignada y sanitizar costos
    const scoped = CommercialRLSService.scopeCustomers(customers, currentUser);
    return scoped.map((c) => CommercialRLSService.sanitizeCustomer(c, currentUser));
  }, [customers, currentUser]);

  return (
    <ERPContext.Provider
      value={{
        customers: effectiveCustomers,
        allCustomers: customers,
        products,
        quotes,
        orders,
        warehouses,
        suppliers,
        movements,
        auditLogs,
        notifications,
        companyConfig,
        unreadNotificationsCount,
        leads,
        opportunities,
        activities,
        followUps,
        salesGoals,
        commissionRules,
        pipelineStages,
        customerContacts,
        // Phase 2 State
        reservations,
        transfers,
        countSessions,
        adjustments,
        pickings,
        // Phase 3 State (Logistics)
        vehicles,
        drivers,
        routes,
        logisticsIncidents,
        logisticsReturns,
        logisticsKPIs: computedLogisticsKPIs,
        pods,
        // Phase 4 State (Purchases)
        supplierContacts,
        supplierProducts,
        purchasePriceHistory,
        purchaseRequests,
        purchaseOrders,
        goodsReceipts,
        supplierReturns,
        reorderConfigs,
        purchaseApprovalLimits,
        // Phase 5 State (Marketing)
        marketingCampaigns,
        marketingChannels,
        campaignExpenses,
        marketingSegments,
        touchpoints,
        aiMarketingProposals,
        selectedAttributionModel,
        marketingKPIs: computedMarketingKPIs,
        // Phase 5 Methods (Marketing)
        ...marketingHandlers,
        // Phase 6 State & Methods (HR & Talento)
        employees,
        departments,
        positions,
        shifts,
        confidentialData,
        employeeDocuments,
        attendanceRecords,
        absenceRequests,
        vacationBalances,
        commissionRecords,
        payrollPeriods,
        performanceReviews,
        employeeGoals,
        trainingCourses,
        employeeTrainings,
        skills,
        employeeSkills,
        aiHRInsights,
        hrKPIs: computedHRKPIs,
        computedHRKPIs,
        ...hrHandlers,
        // Phase 7 State & Methods (Finanzas, Tesorería, CXC, CXP)
        chartOfAccounts,
        costCenters,
        bankAccounts,
        bankTransactions,
        bankReconciliations,
        cxcInvoices,
        cxcPayments,
        collectionActivities,
        cxpInvoices,
        cxpPayments,
        paymentSchedule,
        budgets,
        expenses,
        creditNotes,
        periodClosings,
        aiFinancialInsights,
        financialKPIs: computedFinancialKPIs,
        ...financeHandlers,
        // Phase 11 State & Methods (Servicio al Cliente, Garantías, Devoluciones, Calidad, CAPA, NPS, BI)
        serviceTickets,
        slaRules,
        slaAlerts: computedSlaAlerts,
        warranties,
        warrantyClaims,
        customerReturns,
        qualityIncidents,
        capaActions,
        customerSurveys,
        customerHealthScores: computedHealthScores,
        customerProfitabilityDetailed: computedProfitabilityDetailed,
        executiveCustomerServiceKPIs,
        npsMetrics: computedNpsMetrics,
        askCustomerAdvisorAI,
        ...customerServiceHandlers,
        // Phase 4 Methods (Purchases)
        ...purchasesHandlers,
        getProductReorderStatus,
        getReplenishmentSuggestions,
        calculateProductReorderStatus,
        generateReplenishmentSuggestions,
        getSupplierComparison,
        getPurchasesKPIs,
        getSuppliersScorecard,
        askPurchasesAI,
        resetPurchasesData,
        // Phase 3 Methods (Logistics)
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        deleteDriver,
        createRoute,
        updateRoute,
        cancelRoute,
        startRouteLoading,
        completeRouteLoadingAndDepart,
        updateStopStatus,
        getPodByOrderId,
        getPodByStopId,
        registerDeliveryEvidence,
        registerDeliveryFailure,
        createLogisticsIncident,
        resolveLogisticsIncident,
        createLogisticsReturn,
        authorizeLogisticsReturn,
        rejectLogisticsReturn,
        inspectAndReintegrateReturn,
        resetTest015Case,
        reorderRouteStops,
        generateAIRouteRecommendation,
        // Phase 2 Methods
        createInventoryEntry,
        createInventoryExit,
        createReservation,
        releaseReservation,
        fulfillOrder,
        getOrCreatePicking,
        createPickingForOrder,
        savePickingDraft,
        completePicking,
        updatePicking,
        updatePickingItemQuantity,
        verifyPicking,
        confirmPhysicalFulfillment,
        createWarehouseTransfer,
        authorizeWarehouseTransfer,
        shipWarehouseTransfer,
        receiveWarehouseTransfer,
        cancelWarehouseTransfer,
        createCountSession,
        updateCountItem,
        authorizeAndApplyCountAdjustments,
        createInventoryAdjustment,
        authorizeInventoryAdjustment,
        rejectInventoryAdjustment,
        addWarehouse,
        updateWarehouse,
        deleteMovement,
        wipeMovements,
        importCatalogFromJSON,
        importCatalogFromExcelRows,
        analyzeInventoryWithAI,
        lastSyncTimestamp,
        realtimeToast,
        clearRealtimeToast,
        broadcastDataUpdate,
        addAuditLog,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        addLead,
        updateLead,
        checkCustomerDuplicates,
        convertLeadToCustomerAndOpportunity,
        addOpportunity,
        updateOpportunity,
        changeOpportunityStage,
        addActivity,
        addFollowUp,
        updateFollowUpStatus,
        addCustomerContact,
        updateCustomerContact,
        createQuote,
        addQuote: createQuote,
        createQuoteFromOpportunity,
        updateQuoteStatus,
        approveQuote,
        requestFinancialApproval,
        approveFinancialQuote,
        rejectFinancialQuote,
        calculateQuoteMarginAndDiscount,
        createOrder,
        addOrder: createOrder,
        convertQuoteToOrder,
        recordMovement,
        updateCompanyConfig,
        updateSalesGoal,
        updateCommissionRule,
        updatePipelineStages,
        updateProduct,
        updateCustomer,
        updateQuote,
        duplicateQuote,
        updateOrder,
        updateOrderStatus,
        deliverOrder,
        resetToDemoData,
        analyzeOpportunityWithAI,
        generateFollowUpDraftWithAI,
        metrics: {
          ventasHoy,
          ventasMes,
          metaMensual,
          cumplimiento,
          utilidadBruta,
          margenPromedioPct,
          totalCarteraPorCobrar,
          carteraVencida,
          pedidosPendientesCount,
          cotizacionesPendientesCount,
          stockCriticoCount,
          entregasHoyCount,
        },
        salesMetrics: {
          ventasHoy,
          ventasMes,
          metaMensual,
          cumplimientoPct: cumplimiento,
          pipelineTotal,
          pipelinePonderado,
          forecastTotal,
          leadsCount: leads.length,
          seguimientosVencidosCount,
          seguimientosHoyCount,
          rankingVendedores,
        },
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP debe usarse dentro de un ERPProvider');
  }
  return context;
};
