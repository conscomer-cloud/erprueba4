/**
 * @license
 * CONSCORE ERP IA - Finance Context Handlers & Methods
 * FASE 7: Manejadores de estado para Plan de Cuentas, Tesorería, CXC, CXP,
 * Cobranza, Presupuestos, Gastos, Rentabilidad y Cierre Contable.
 */

import React from 'react';
import {
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
  FinancialSimulationParams,
  FinancialSimulationResult,
  Customer,
  Supplier,
  Product,
  Order,
  AuditLog,
  NotificationItem,
  UserRole,
} from '../types/erp';
import {
  calculateFinancialKPIs,
  evaluateCustomerCredit as evalCustCredit,
  buildCustomerFinancialStatement,
  calculateProfitabilityAnalysis,
  runFinancialSimulation as executeSimulation,
} from '../services/financeService';

export interface FinanceHandlersParams {
  currentUser: { id: string; name: string; role: UserRole } | null;
  chartOfAccounts: ChartAccount[];
  setChartOfAccounts: React.Dispatch<React.SetStateAction<ChartAccount[]>>;
  costCenters: CostCenter[];
  setCostCenters: React.Dispatch<React.SetStateAction<CostCenter[]>>;
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  bankTransactions: BankTransaction[];
  setBankTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
  bankReconciliations: BankReconciliationSession[];
  setBankReconciliations: React.Dispatch<React.SetStateAction<BankReconciliationSession[]>>;
  cxcInvoices: AccountsReceivableInvoice[];
  setCXCInvoices: React.Dispatch<React.SetStateAction<AccountsReceivableInvoice[]>>;
  cxcPayments: CXCPaymentRecord[];
  setCXCPayments: React.Dispatch<React.SetStateAction<CXCPaymentRecord[]>>;
  collectionActivities: CollectionActivity[];
  setCollectionActivities: React.Dispatch<React.SetStateAction<CollectionActivity[]>>;
  cxpInvoices: AccountsPayableInvoice[];
  setCXPInvoices: React.Dispatch<React.SetStateAction<AccountsPayableInvoice[]>>;
  cxpPayments: CXPPaymentRecord[];
  setCXPPayments: React.Dispatch<React.SetStateAction<CXPPaymentRecord[]>>;
  paymentSchedule: PaymentScheduleItem[];
  setPaymentSchedule: React.Dispatch<React.SetStateAction<PaymentScheduleItem[]>>;
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  creditNotes: CreditNote[];
  setCreditNotes: React.Dispatch<React.SetStateAction<CreditNote[]>>;
  periodClosings: FinancialPeriodClosing[];
  setPeriodClosings: React.Dispatch<React.SetStateAction<FinancialPeriodClosing[]>>;
  aiFinancialInsights: AIFinancialInsight[];
  setAIFinancialInsights: React.Dispatch<React.SetStateAction<AIFinancialInsight[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  products: Product[];
  orders: Order[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
}

export function createFinanceHandlers(params: FinanceHandlersParams) {
  const {
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
    addAuditLog,
    addNotification,
  } = params;

  // ==========================================
  // 1. PLAN DE CUENTAS (CHART OF ACCOUNTS)
  // ==========================================
  const addChartAccount = (account: Omit<ChartAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `ACC-${Date.now()}`;
    const newAcc: ChartAccount = {
      ...account,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setChartOfAccounts((prev) => [...prev, newAcc]);

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'CREAR_CUENTA_CONTABLE',
      module: 'FINANZAS',
      entityId: newId,
      details: `Cuenta creada: ${newAcc.code} - ${newAcc.name} (${newAcc.category})`,
    });

    addNotification({
      type: 'INFO',
      title: 'Cuenta Contable Creada',
      message: `Se añadió la cuenta ${newAcc.code} - ${newAcc.name}`,
      module: 'FINANZAS',
    });

    return newAcc;
  };

  const updateChartAccount = (id: string, updates: Partial<ChartAccount>) => {
    setChartOfAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? { ...acc, ...updates, updatedAt: new Date().toISOString().slice(0, 10) }
          : acc
      )
    );
  };

  // ==========================================
  // 2. CENTROS DE COSTO
  // ==========================================
  const addCostCenter = (center: Omit<CostCenter, 'id'>) => {
    const newId = `CC-${Date.now()}`;
    const newCC: CostCenter = { ...center, id: newId };
    setCostCenters((prev) => [...prev, newCC]);
    return newCC;
  };

  const updateCostCenter = (id: string, updates: Partial<CostCenter>) => {
    setCostCenters((prev) =>
      prev.map((cc) => (cc.id === id ? { ...cc, ...updates } : cc))
    );
  };

  // ==========================================
  // 3. TESORERÍA & CUENTAS BANCARIAS
  // ==========================================
  const addBankAccount = (account: Omit<BankAccount, 'id'>) => {
    const newId = `BNK-${Date.now()}`;
    const newBank: BankAccount = { ...account, id: newId };
    setBankAccounts((prev) => [...prev, newBank]);
    return newBank;
  };

  const registerBankTransaction = (
    tx: Omit<BankTransaction, 'id' | 'folio' | 'createdAt' | 'auditUser' | 'isReconciled'>
  ) => {
    const newId = `MOV-BNK-${Date.now()}`;
    const folio = `BNK-TR-${Math.floor(100 + Math.random() * 900)}`;
    const newTx: BankTransaction = {
      ...tx,
      id: newId,
      folio,
      isReconciled: true,
      auditUser: currentUser?.name || 'Laura Elena Elizondo',
      createdAt: new Date().toISOString(),
    };

    setBankTransactions((prev) => [newTx, ...prev]);

    // Actualizar saldo de la cuenta bancaria
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.id === tx.bankAccountId) {
          const delta = tx.type === 'INGRESO' ? tx.amount : -tx.amount;
          const newBal = b.currentBalance + delta;
          return {
            ...b,
            currentBalance: newBal,
            availableBalance: newBal,
          };
        }
        return b;
      })
    );

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'MOVIMIENTO_BANCARIO',
      module: 'FINANZAS',
      entityId: newId,
      details: `${tx.type} de $${(Number(tx.amount) || 0).toLocaleString('es-MX')} en ${tx.bankAccountName}: ${tx.concept}`,
    });

    return newTx;
  };

  // ==========================================
  // 4. CUENTAS POR COBRAR (CXC)
  // ==========================================
  const createCXCInvoice = (
    invoice: Omit<AccountsReceivableInvoice, 'id' | 'folio' | 'createdAt' | 'createdBy' | 'paidAmount' | 'balance' | 'overdueDays' | 'status'>
  ) => {
    const newId = `CXC-${Date.now()}`;
    const folio = `CXC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newInv: AccountsReceivableInvoice = {
      ...invoice,
      id: newId,
      folio,
      paidAmount: 0,
      balance: invoice.total,
      overdueDays: 0,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Laura Elena Elizondo Garza',
    };

    setCXCInvoices((prev) => [newInv, ...prev]);

    // Actualizar saldo en la ficha del cliente
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === invoice.customerId
          ? { ...c, currentBalance: (c.currentBalance || 0) + invoice.total }
          : c
      )
    );

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'EMISION_FACTURA_CXC',
      module: 'FINANZAS',
      entityId: newId,
      details: `Factura ${newInv.invoiceNumber} emitida a ${newInv.customerName} por $${(Number(newInv.total) || 0).toLocaleString('es-MX')}`,
    });

    addNotification({
      type: 'INFO',
      title: 'Factura CXC Emitida',
      message: `${newInv.invoiceNumber} para ${newInv.customerName} ($${(Number(newInv.total) || 0).toLocaleString('es-MX')})`,
      module: 'FINANZAS',
    });

    return newInv;
  };

  const recordCXCPayment = (paymentData: {
    cxcId: string;
    amount: number;
    paymentDate: string;
    bankAccountId: string;
    bankReference: string;
    paymentFormSat: '01' | '03' | '04' | '99';
    notes?: string;
  }) => {
    const inv = cxcInvoices.find((c) => c.id === paymentData.cxcId);
    if (!inv) return null;

    const bankAcc = bankAccounts.find((b) => b.id === paymentData.bankAccountId);
    const newPaidAmount = inv.paidAmount + paymentData.amount;
    const newBalance = Math.max(0, inv.total - newPaidAmount);
    const newStatus = newBalance === 0 ? 'PAGADA' : 'PARCIALMENTE_PAGADA';

    // 1. Actualizar Factura CXC
    setCXCInvoices((prev) =>
      prev.map((c) =>
        c.id === paymentData.cxcId
          ? {
              ...c,
              paidAmount: newPaidAmount,
              balance: newBalance,
              status: newStatus,
            }
          : c
      )
    );

    // 2. Registrar Comprobante de Cobro
    const recId = `REC-2026-${Date.now()}`;
    const recFolio = `REC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const paymentRecord: CXCPaymentRecord = {
      id: recId,
      folio: recFolio,
      cxcId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate,
      bankAccountId: paymentData.bankAccountId,
      bankAccountName: bankAcc?.bankName || 'Banco BBVA',
      bankReference: paymentData.bankReference,
      paymentFormSat: paymentData.paymentFormSat,
      recordedBy: currentUser?.name || 'Laura Elena Elizondo Garza',
      recordedAt: new Date().toISOString(),
      notes: paymentData.notes,
    };
    setCXCPayments((prev) => [paymentRecord, ...prev]);

    // 3. Registrar Movimiento Bancario de Ingreso
    registerBankTransaction({
      bankAccountId: paymentData.bankAccountId,
      bankAccountName: bankAcc?.bankName || 'BBVA México',
      type: 'INGRESO',
      category: 'COBRO_CLIENTE',
      date: paymentData.paymentDate,
      amount: paymentData.amount,
      reference: paymentData.bankReference,
      concept: `Cobro Factura ${inv.invoiceNumber} - ${inv.customerName}`,
      relatedCxcId: inv.id,
    });

    // 4. Actualizar saldo en Cliente
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === inv.customerId
          ? { ...c, currentBalance: Math.max(0, (c.currentBalance || 0) - paymentData.amount) }
          : c
      )
    );

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'COBRO_CXC_REGISTRADO',
      module: 'FINANZAS',
      entityId: recId,
      details: `Cobro de $${(Number(paymentData.amount) || 0).toLocaleString('es-MX')} recibido para ${inv.invoiceNumber} (${inv.customerName})`,
    });

    addNotification({
      type: 'EXITO',
      title: 'Pago de Cliente Registrado',
      message: `Se aplicó abono de $${(Number(paymentData.amount) || 0).toLocaleString('es-MX')} a ${inv.invoiceNumber}`,
      module: 'FINANZAS',
    });

    return paymentRecord;
  };

  // ==========================================
  // 5. BITÁCORA DE COBRANZA
  // ==========================================
  const addCollectionActivity = (
    activity: Omit<CollectionActivity, 'id' | 'createdAt' | 'recordedBy'>
  ) => {
    const newId = `ACT-COB-${Date.now()}`;
    const newAct: CollectionActivity = {
      ...activity,
      id: newId,
      recordedBy: currentUser?.name || 'Laura Elena Elizondo Garza',
      createdAt: new Date().toISOString(),
    };
    setCollectionActivities((prev) => [newAct, ...prev]);

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'REGISTRO_ACTIVIDAD_COBRANZA',
      module: 'FINANZAS',
      entityId: newId,
      details: `${activity.type} con ${activity.customerName}: ${activity.notes}`,
    });

    return newAct;
  };

  // ==========================================
  // 6. CUENTAS POR PAGAR (CXP)
  // ==========================================
  const createCXPInvoice = (
    invoice: Omit<AccountsPayableInvoice, 'id' | 'folio' | 'createdAt' | 'paidAmount' | 'balance' | 'overdueDays' | 'status'>
  ) => {
    const newId = `CXP-${Date.now()}`;
    const folio = `CXP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newInv: AccountsPayableInvoice = {
      ...invoice,
      id: newId,
      folio,
      paidAmount: 0,
      balance: invoice.total,
      overdueDays: 0,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
    };
    setCXPInvoices((prev) => [newInv, ...prev]);

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'FACTURA_PROVEEDOR_CXP',
      module: 'FINANZAS',
      entityId: newId,
      details: `Factura ${newInv.supplierInvoiceNumber} de ${newInv.supplierName} por $${(Number(newInv.total) || 0).toLocaleString('es-MX')}`,
    });

    return newInv;
  };

  const recordCXPPayment = (paymentData: {
    cxpId: string;
    amount: number;
    paymentDate: string;
    bankAccountId: string;
    bankReference: string;
    notes?: string;
  }) => {
    const inv = cxpInvoices.find((c) => c.id === paymentData.cxpId);
    if (!inv) return null;

    const bankAcc = bankAccounts.find((b) => b.id === paymentData.bankAccountId);
    const newPaidAmount = inv.paidAmount + paymentData.amount;
    const newBalance = Math.max(0, inv.total - newPaidAmount);
    const newStatus = newBalance === 0 ? 'PAGADA' : 'PARCIALMENTE_PAGADA';

    // 1. Actualizar Factura CXP
    setCXPInvoices((prev) =>
      prev.map((c) =>
        c.id === paymentData.cxpId
          ? {
              ...c,
              paidAmount: newPaidAmount,
              balance: newBalance,
              status: newStatus,
            }
          : c
      )
    );

    // 2. Registrar Comprobante de Egreso
    const egrId = `EGR-2026-${Date.now()}`;
    const egrFolio = `EGR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const paymentRecord: CXPPaymentRecord = {
      id: egrId,
      folio: egrFolio,
      cxpId: inv.id,
      supplierInvoiceNumber: inv.supplierInvoiceNumber,
      supplierId: inv.supplierId,
      supplierName: inv.supplierName,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate,
      bankAccountId: paymentData.bankAccountId,
      bankAccountName: bankAcc?.bankName || 'BBVA México',
      bankReference: paymentData.bankReference,
      paymentFormSat: '03',
      authorizedBy: currentUser?.name || 'Roberto Garza Sada',
      authorizedAt: new Date().toISOString(),
      recordedBy: currentUser?.name || 'Laura Elena Elizondo Garza',
      recordedAt: new Date().toISOString(),
      notes: paymentData.notes,
    };
    setCXPPayments((prev) => [paymentRecord, ...prev]);

    // 3. Registrar Movimiento Bancario de Egreso
    registerBankTransaction({
      bankAccountId: paymentData.bankAccountId,
      bankAccountName: bankAcc?.bankName || 'BBVA México',
      type: 'EGRESO',
      category: 'PAGO_PROVEEDOR',
      date: paymentData.paymentDate,
      amount: paymentData.amount,
      reference: paymentData.bankReference,
      concept: `Pago Factura ${inv.supplierInvoiceNumber} - ${inv.supplierName}`,
      relatedCxpId: inv.id,
    });

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'PAGO_PROVEEDOR_CXP',
      module: 'FINANZAS',
      entityId: egrId,
      details: `Pago de $${(Number(paymentData.amount) || 0).toLocaleString('es-MX')} liquidado a ${inv.supplierName} (${inv.supplierInvoiceNumber})`,
    });

    addNotification({
      type: 'INFO',
      title: 'Pago a Proveedor Realizado',
      message: `Dispersión de $${(Number(paymentData.amount) || 0).toLocaleString('es-MX')} a ${inv.supplierName}`,
      module: 'FINANZAS',
    });

    return paymentRecord;
  };

  // ==========================================
  // 7. PROGRAMACIÓN DE PAGOS
  // ==========================================
  const addPaymentScheduleItem = (
    item: Omit<PaymentScheduleItem, 'id' | 'createdAt' | 'authorizationStatus'>
  ) => {
    const newId = `PRG-2026-${Date.now()}`;
    const newItem: PaymentScheduleItem = {
      ...item,
      id: newId,
      authorizationStatus: 'PENDIENTE',
      createdAt: new Date().toISOString(),
    };
    setPaymentSchedule((prev) => [...prev, newItem]);
    return newItem;
  };

  const authorizePaymentScheduleItem = (id: string, authorize: boolean) => {
    setPaymentSchedule((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              authorizationStatus: authorize ? 'AUTORIZADO' : 'RECHAZADO',
              authorizedBy: currentUser?.name || 'Laura Elena Elizondo Garza',
              authorizedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  // ==========================================
  // 8. PRESUPUESTOS (BUDGETS)
  // ==========================================
  const addBudget = (budget: Omit<Budget, 'id' | 'varianceAmount' | 'variancePct' | 'status' | 'alertTriggered'>) => {
    const newId = `BGT-${Date.now()}`;
    const varianceAmount = budget.budgetedAmount - budget.actualAmount;
    const variancePct = budget.budgetedAmount > 0
      ? ((budget.actualAmount - budget.budgetedAmount) / budget.budgetedAmount) * 100
      : 0;

    let status: Budget['status'] = 'DENTRO_DE_PRESUPUESTO';
    let alertTriggered = false;

    if (budget.actualAmount > budget.budgetedAmount) {
      status = 'EXCEDIDO';
      alertTriggered = true;
    } else if (budget.actualAmount >= budget.budgetedAmount * 0.8) {
      status = 'ALERTA_80';
      alertTriggered = true;
    }

    const newBgt: Budget = {
      ...budget,
      id: newId,
      varianceAmount,
      variancePct: Number(variancePct.toFixed(1)),
      status,
      alertTriggered,
    };

    setBudgets((prev) => [...prev, newBgt]);
    return newBgt;
  };

  // ==========================================
  // 9. GASTOS OPERATIVOS (EXPENSES)
  // ==========================================
  const addExpense = (
    expense: Omit<Expense, 'id' | 'folio' | 'createdAt' | 'status'>
  ) => {
    const newId = `GST-${Date.now()}`;
    const folio = `GST-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newExp: Expense = {
      ...expense,
      id: newId,
      folio,
      status: 'CAPTURADO',
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'GASTO_CAPTURADO',
      module: 'FINANZAS',
      entityId: newId,
      details: `Gasto de $${(Number(newExp.total) || 0).toLocaleString('es-MX')} registrado: ${newExp.title}`,
    });

    return newExp;
  };

  const approveExpense = (id: string, approve: boolean) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: approve ? 'APROBADO' : 'RECHAZADO',
              authorizedBy: currentUser?.name || 'Laura Elena Elizondo Garza',
              authorizedAt: new Date().toISOString(),
            }
          : e
      )
    );
  };

  const payExpense = (id: string, bankAccountId: string, paymentReference: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return;

    const bankAcc = bankAccounts.find((b) => b.id === bankAccountId);

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'PAGADO',
              bankAccountId,
              paymentDate: new Date().toISOString().slice(0, 10),
              paymentReference,
            }
          : e
      )
    );

    // Registrar Egreso Bancario
    registerBankTransaction({
      bankAccountId,
      bankAccountName: bankAcc?.bankName || 'BBVA México',
      type: 'EGRESO',
      category: 'PAGO_GASTO',
      date: new Date().toISOString().slice(0, 10),
      amount: exp.total,
      reference: paymentReference,
      concept: `Pago Gasto ${exp.folio}: ${exp.title}`,
      relatedExpenseId: exp.id,
    });

    // Actualizar presupuesto del centro de costo
    setCostCenters((prev) =>
      prev.map((cc) =>
        cc.id === exp.costCenterId
          ? { ...cc, spentBudget: cc.spentBudget + exp.subtotal }
          : cc
      )
    );
  };

  // ==========================================
  // 10. NOTAS DE CRÉDITO
  // ==========================================
  const addCreditNote = (note: Omit<CreditNote, 'id' | 'folio' | 'createdAt' | 'status'>) => {
    const newId = `NC-${Date.now()}`;
    const folio = `NC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newNote: CreditNote = {
      ...note,
      id: newId,
      folio,
      status: 'APLICADA',
      createdAt: new Date().toISOString(),
    };
    setCreditNotes((prev) => [newNote, ...prev]);

    // Disminuir saldo de la factura CXC asociada
    setCXCInvoices((prev) =>
      prev.map((c) =>
        c.id === note.invoiceId
          ? {
              ...c,
              balance: Math.max(0, c.balance - note.total),
              status: c.balance - note.total <= 0 ? 'PAGADA' : c.status,
            }
          : c
      )
    );

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'NOTA_CREDITO_APLICADA',
      module: 'FINANZAS',
      entityId: newId,
      details: `Nota de Crédito ${newNote.folio} por $${(Number(newNote.total) || 0).toLocaleString('es-MX')} aplicada a ${newNote.invoiceFolio}`,
    });

    return newNote;
  };

  // ==========================================
  // 11. CIERRE DE PERIODO CONTABLE
  // ==========================================
  const closeFinancialPeriod = (periodId: string) => {
    setPeriodClosings((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              status: 'CERRADO',
              closedDate: new Date().toISOString(),
              closedBy: currentUser?.name || 'Lic. Laura Elena Elizondo Garza',
            }
          : p
      )
    );

    addAuditLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Finanzas',
      action: 'CIERRE_CONTABLE_MENSUAL',
      module: 'FINANZAS',
      entityId: periodId,
      details: `Periodo contable ${periodId} cerrado exitosamente por Dirección Financiera`,
    });

    addNotification({
      type: 'EXITO',
      title: 'Cierre Financiero Sellado',
      message: `El periodo ${periodId} ha sido auditado y cerrado.`,
      module: 'FINANZAS',
    });
  };

  // ==========================================
  // 12. GESTIÓN DE INSIGHTS CONSCORE AI
  // ==========================================
  const updateAIFinancialInsightStatus = (
    id: string,
    status: AIFinancialInsight['status']
  ) => {
    setAIFinancialInsights((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, status } : ins))
    );
  };

  // ==========================================
  // 13. CONSULTAS Y RESÚMENES CALCULADOS
  // ==========================================
  const getFinancialKPIs = (): FinancialKPIs => {
    return calculateFinancialKPIs({
      cxcInvoices,
      cxpInvoices,
      bankAccounts,
      bankTransactions,
      expenses,
      products,
      orders,
      budgets,
    });
  };

  const getCustomerStatement = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return null;
    return buildCustomerFinancialStatement({
      customer: cust,
      cxcInvoices,
      cxcPayments,
      creditNotes,
    });
  };

  const getCustomerCreditEvaluation = (customerId: string, newOrderAmount?: number) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return null;
    return evalCustCredit({
      customer: cust,
      cxcInvoices,
      newOrderAmount,
    });
  };

  const getProfitability = () => {
    return calculateProfitabilityAnalysis({
      products: products || [],
      customers: customers || [],
      orders: orders || [],
    });
  };

  const getProfitabilityBreakdown = () => {
    return getProfitability();
  };

  const runFinancialSimulation = (
    params: Partial<FinancialSimulationParams>
  ): FinancialSimulationResult => {
    const kpis = getFinancialKPIs();
    return executeSimulation(params, kpis);
  };

  return {
    addChartAccount,
    updateChartAccount,
    addCostCenter,
    updateCostCenter,
    addBankAccount,
    registerBankTransaction,
    createCXCInvoice,
    recordCXCPayment,
    addCollectionActivity,
    createCXPInvoice,
    recordCXPPayment,
    addPaymentScheduleItem,
    authorizePaymentScheduleItem,
    addBudget,
    addExpense,
    approveExpense,
    payExpense,
    addCreditNote,
    closeFinancialPeriod,
    updateAIFinancialInsightStatus,
    getFinancialKPIs,
    financialKPIs: getFinancialKPIs(),
    runFinancialSimulation,
    getCustomerStatement,
    getCustomerCreditEvaluation,
    getProfitability,
    getProfitabilityBreakdown,
  };
}
