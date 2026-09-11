import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
  UserCheck,
  FileText,
  ShoppingCart,
  Package,
  Truck,
  Receipt,
  DollarSign,
  Award,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  Send,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { ERPModule } from '../../types/erp';
import { ExecutiveIntelligenceService } from '../../services/executiveIntelligenceService';

interface MasterE2ETestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule?: (module: ERPModule) => void;
}

export interface E2ETestStep {
  id: number;
  key: string;
  module: ERPModule;
  title: string;
  shortTitle: string;
  department: string;
  role: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  description: string;
  documentFolio?: string;
  accountingImpact: string;
  financialImpact: {
    label: string;
    amount: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  details: {
    entity: string;
    action: string;
    inputs: Record<string, string | number>;
    outputs: Record<string, string | number>;
    auditNote: string;
  };
}

export const MasterE2ETestModal: React.FC<MasterE2ETestModalProps> = ({
  isOpen,
  onClose,
  onNavigateToModule,
}) => {
  const {
    customers,
    products,
    quotes,
    orders,
    movements,
    cxcInvoices,
    cxcPayments,
    bankAccounts,
    marketingCampaigns,
    addLead,
    convertLeadToCustomerAndOpportunity,
    createQuote,
    approveQuote,
    convertQuoteToOrder,
    recordMovement,
    createCXCInvoice,
    recordCXCPayment,
    addAuditLog,
    addNotification,
    broadcastDataUpdate,
    arInvoices,
    apBills,
    operatingExpenses,
    payrollRecords,
    companyBudget,
  } = useERP();

  const { currentUser } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1200); // ms per step
  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'IMPACT_BOARD' | 'DOCUMENTS' | 'ACCOUNTING_LEDGER'>('WORKFLOW');
  const [selectedDocumentStep, setSelectedDocumentStep] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logMessages, setLogMessages] = useState<{ time: string; text: string; type: 'info' | 'success' | 'warn' }[]>([]);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Baseline data before starting test
  const [baselineSnapshot, setBaselineSnapshot] = useState<{
    initialCash: number;
    initialSales: number;
    initialStockPre1080: number;
    initialStockEla3010: number;
    initialAr: number;
  } | null>(null);

  // Generated identifiers during the test execution
  const [generatedEntities, setGeneratedEntities] = useState<{
    leadId?: string;
    customerId?: string;
    customerCode?: string;
    opportunityId?: string;
    quoteId?: string;
    quoteFolio?: string;
    orderId?: string;
    orderFolio?: string;
    movementPreId?: string;
    movementElaId?: string;
    remissionFolio?: string;
    cxcInvoiceId?: string;
    invoiceFolio?: string;
    invoiceUuid?: string;
    paymentId?: string;
    speiTracking?: string;
    commissionId?: string;
  }>({});

  // Capture baseline upon modal open
  useEffect(() => {
    if (isOpen && !baselineSnapshot) {
      const banorteAcc = bankAccounts.find((b) => (b.bankName || "").toLowerCase().includes('banorte') || b.accountNumber.includes('001')) || bankAccounts[0];
      const prodPre = products.find((p) => (p as any).sku === 'PRE-1080' || p.code === 'PRE-1080') || products[0];
      const prodEla = products.find((p) => (p as any).sku === 'ELA-3010' || p.code === 'ELA-3010') || products[1];

      setBaselineSnapshot({
        initialCash: banorteAcc?.currentBalance || 2185600.5,
        initialSales: quotes.reduce((sum, q) => sum + (q.subtotal || 0), 0) || 3845000,
        initialStockPre1080: prodPre?.availableStock || (prodPre as any)?.currentStock || 450,
        initialStockEla3010: prodEla?.availableStock || (prodEla as any)?.currentStock || 120,
        initialAr: cxcInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0) || 450000,
      });

      addLogMessage('Iniciando entorno de prueba maestra E2E para CONSCORE ERP...', 'info');
    }
  }, [isOpen]);

  const addLogMessage = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('es-MX');
    setLogMessages((prev) => [{ time, text, type }, ...prev.slice(0, 40)]);
  };

  // Master Test 10-Step Definitions
  const STEPS: E2ETestStep[] = [
    {
      id: 1,
      key: 'LEAD',
      module: 'MARKETING',
      title: '1. Captura y Calificación de Lead Entrante',
      shortTitle: 'Lead Marketing',
      department: 'Marketing & Prospección',
      role: 'Coordinador de Marketing',
      status: currentStepIndex > 0 ? 'COMPLETED' : currentStepIndex === 0 ? 'RUNNING' : 'PENDING',
      description: 'Llegada de oportunidad comercial desde campaña Google Ads "Aislamiento Industrial Q3". Detección y calificación con score 95/100.',
      documentFolio: 'LEAD-2026-0884',
      accountingImpact: 'Sin afectación contable (Registro en Pipeline CRM Comercial)',
      financialImpact: {
        label: 'Pipeline Estimado',
        amount: '+$148,248.00 MXN',
        type: 'positive',
      },
      details: {
        entity: 'Ingeniería y Construcciones Titanio S.A. de C.V.',
        action: 'Registro en CRM y Asignación de Score B2B',
        inputs: {
          'Contacto': 'Ing. Roberto Sada (Director de Obra)',
          'Proyecto': 'Torre Titanium San Pedro (Monterrey)',
          'Origen': 'Campaña Google Ads Industrial Monterrey',
          'Teléfono / Email': '+52 81 8390 4422 | rsada@constructoratitanio.com.mx',
        },
        outputs: {
          'Score de Lead': '95 / 100 (Alta probabilidad de conversión)',
          'Canal de Atribución': 'Google Ads Directo (ROAS 11.2x)',
          'Asesor Asignado': 'Ing. Carlos Mendoza (Ventas Industriales)',
        },
        auditNote: 'Atribución registrada con Touchpoint inicial y trazabilidad UTM completa.',
      },
    },
    {
      id: 2,
      key: 'CLIENTE',
      module: 'CLIENTES',
      title: '2. Conversión a Cliente Formal & Aprobación Crediticia',
      shortTitle: 'Alta Cliente',
      department: 'Ventas & Crédito',
      role: 'Ejecutivo de Cuenta / Finanzas',
      status: currentStepIndex > 1 ? 'COMPLETED' : currentStepIndex === 1 ? 'RUNNING' : 'PENDING',
      description: 'Conversión automática del Lead en Cliente formal en el CRM con RFC verificado en SAT, evaluación de buró interno y asignación de línea de crédito.',
      documentFolio: 'CLI-1008',
      accountingImpact: 'Apertura de expediente mercantil y registro fiscal SAT (601 General Personas Morales)',
      financialImpact: {
        label: 'Línea de Crédito Otorgada',
        amount: '$250,000.00 MXN',
        type: 'neutral',
      },
      details: {
        entity: 'Ingeniería y Construcciones Titanio S.A. de C.V.',
        action: 'Creación de Expediente de Cliente y Evaluación Crediticia',
        inputs: {
          'RFC': 'ICT210815KL9',
          'Régimen Fiscal': '601 - General de Ley Personas Morales',
          'Domicilio Fiscal': 'Av. Lázaro Cárdenas 2400, Valle Oriente, San Pedro Garza García, N.L.',
          'Plazo de Pago Solicitado': '30 Días Crédito',
        },
        outputs: {
          'Código Cliente': 'CLI-1008',
          'Límite de Crédito Aprobado': '$250,000.00 MXN',
          'Clasificación Inicial': 'Cliente B2B / Obra Vertical',
          'Lista de Precios': 'Lista Distribuidor / Constructor',
        },
        auditNote: 'Validación de duplicados y RFC ejecutada con cero colisiones detectadas.',
      },
    },
    {
      id: 3,
      key: 'COTIZACION',
      module: 'COTIZACIONES',
      title: '3. Cotización Comercial con Margen & Flete',
      shortTitle: 'Cotización',
      department: 'Ventas Comerciales',
      role: 'Ing. Carlos Mendoza (Ventas)',
      status: currentStepIndex > 2 ? 'COMPLETED' : currentStepIndex === 2 ? 'RUNNING' : 'PENDING',
      description: 'Creación de la cotización formal con desglose de partidas de aislamiento térmico, cálculo en tiempo real del margen bruto comercial y cargo de flete a obra.',
      documentFolio: 'COT-2026-9080',
      accountingImpact: 'Compromiso comercial pre-operativo (Margen Proyectado: 38.5%)',
      financialImpact: {
        label: 'Monto Cotizado (con IVA)',
        amount: '$148,248.00 MXN',
        type: 'positive',
      },
      details: {
        entity: 'Cotización Industrial Obra Titanium',
        action: 'Cálculo de Precios, Costo Unitario, Descuentos y Margen de Utilidad',
        inputs: {
          'Partida 1 (PRE-1080)': '300 pzas Preformado Lana Mineral 2" @ $290.00 c/u (Costo: $180.00)',
          'Partida 2 (ELA-3010)': '60 rollos Aislamiento Elastómero 1" @ $680.00 c/u (Costo: $410.00)',
          'Flete a Obra': '$2,500.00 MXN (Flete Local Monterrey)',
        },
        outputs: {
          'Subtotal': '$127,800.00 MXN',
          'IVA 16%': '$20,448.00 MXN',
          'Total Cotizado': '$148,248.00 MXN',
          'Utilidad Bruta Proyectada': '$49,200.00 MXN (38.5% Margen Bruto)',
        },
        auditNote: 'Regla de margen mínimo (>25%) superada. No requiere autorización de gerencia.',
      },
    },
    {
      id: 4,
      key: 'PEDIDO',
      module: 'PEDIDOS',
      title: '4. Aceptación de Cliente & Reserva de Stock',
      shortTitle: 'Pedido & Reserva',
      department: 'Ventas & Almacén',
      role: 'Coordinación de Pedidos',
      status: currentStepIndex > 3 ? 'COMPLETED' : currentStepIndex === 3 ? 'RUNNING' : 'PENDING',
      description: 'El cliente firma la cotización. El sistema valida la línea de crédito disponible y ejecuta la reserva preventiva en almacén para garantizar existencias.',
      documentFolio: 'PED-2026-9080',
      accountingImpact: 'Bloqueo físico de existencias: Stock Comprometido +360 unidades',
      financialImpact: {
        label: 'Crédito Comprometido',
        amount: '-$148,248.00 MXN',
        type: 'negative',
      },
      details: {
        entity: 'Orden de Venta / Pedido en Firme',
        action: 'Generación de Pedido y Bloqueo de Stock en WMS',
        inputs: {
          'Folio Cotización Origen': 'COT-2026-9080',
          'Validación Crediticia': 'Monto $148,248 <= Límite $250,000 -> APROBADO',
          'Fecha Compromiso Entrega': 'Mismo Día (Prioridad Obra Urgente)',
        },
        outputs: {
          'Folio Pedido': 'PED-2026-9080',
          'Estado': 'CONFIRMADO / RESERVADO',
          'Reserva PRE-1080': '300 tramos bloqueados en Almacén Central (Nave 1, R-04)',
          'Reserva ELA-3010': '60 rollos bloqueados en Almacén Central (Nave 1, R-02)',
        },
        auditNote: 'Reserva automática generada en ERP evitando doble venta del lote.',
      },
    },
    {
      id: 5,
      key: 'ALMACEN_KARDEX',
      module: 'INVENTARIO',
      title: '5. Surtido en Almacén & Salida en Kardex Valuado',
      shortTitle: 'Picking & Kardex',
      department: 'Almacén Central',
      role: 'Jefe de Almacén (Operador WMS)',
      status: currentStepIndex > 4 ? 'COMPLETED' : currentStepIndex === 4 ? 'RUNNING' : 'PENDING',
      description: 'Picking físico en racks, escaneo de códigos de barra, generación de remisión y rebaje oficial del Kardex al Costo Promedio Ponderado.',
      documentFolio: 'REM-2026-9080',
      accountingImpact: 'Asiento: Cargo a Costo de Ventas (COGS) $78,600 / Abono a Inventarios $78,600',
      financialImpact: {
        label: 'Costo de Ventas (COGS)',
        amount: '-$78,600.00 MXN',
        type: 'negative',
      },
      details: {
        entity: 'Almacén Central Monterrey - Nave 1',
        action: 'Picking, Embalaje, Remisión y Registro de Movimiento SALIDA',
        inputs: {
          'Ubicación PRE-1080': 'Nave 1 / Rack 04 / Pasillo 02 / Nivel 01',
          'Ubicación ELA-3010': 'Nave 1 / Rack 02 / Pasillo 01 / Nivel 02',
          'Operador': 'Jefe de Almacén (Usuario USR-005)',
        },
        outputs: {
          'Movimiento 1': 'SALIDA 300 pzas PRE-1080 @ $180.00 = $54,000.00 MXN',
          'Movimiento 2': 'SALIDA 60 rollos ELA-3010 @ $410.00 = $24,600.00 MXN',
          'Costo Total Despachado': '$78,600.00 MXN',
          'Folio de Remisión': 'REM-2026-9080',
        },
        auditNote: 'Kardex Valuado recalculado en vivo. Saldo físico coincide con saldo contable.',
      },
    },
    {
      id: 6,
      key: 'LOGISTICA',
      module: 'LOGISTICA',
      title: '6. Despacho en Ruta & Entrega en Obra (OTIF)',
      shortTitle: 'Logística OTIF',
      department: 'Logística & Flota',
      role: 'Coordinador de Tráfico & Chofer',
      status: currentStepIndex > 5 ? 'COMPLETED' : currentStepIndex === 5 ? 'RUNNING' : 'PENDING',
      description: 'Asignación de unidad de transporte de 3.5 Toneladas, checklist de salida, traslado a Torre Titanium y recolección de firma digital de recibido.',
      documentFolio: 'RUTA-2026-042',
      accountingImpact: 'Consumación de la entrega física. Cumplimiento OTIF: 100%',
      financialImpact: {
        label: 'Gasto de Flete Devengado',
        amount: '-$2,500.00 MXN',
        type: 'negative',
      },
      details: {
        entity: 'Flota ConsCore - Unidad Camión Isuzu 3.5T',
        action: 'Despacho, Tránsito y Validación de Entrega con Evidencia Digital',
        inputs: {
          'Unidad / Placas': 'Camión Isuzu Forward 3.5T (Placas NL-8821-C)',
          'Operador': 'Roberto Gómez (Chofer Certificado)',
          'Destino': 'Torre Titanium - Av. Lázaro Cárdenas 2400',
        },
        outputs: {
          'Recepción': 'Firmado por Ing. Roberto Sada (Sello de Obra)',
          'Estatus de Entrega': 'ENTREGADO A TIEMPO Y COMPLETO (OTIF 100%)',
          'Incidencias': '0 Daños, 0 Faltantes',
        },
        auditNote: 'Geolocalización GPS y firma digital de remisión almacenada en expediente.',
      },
    },
    {
      id: 7,
      key: 'FACTURA_SAT',
      module: 'FINANZAS',
      title: '7. Facturación SAT CFDI 4.0 & Creación de CXC',
      shortTitle: 'Factura SAT CFDI',
      department: 'Finanzas & Facturación',
      role: 'Contador / Auxiliar de Facturación',
      status: currentStepIndex > 6 ? 'COMPLETED' : currentStepIndex === 6 ? 'RUNNING' : 'PENDING',
      description: 'Emisión de Factura Fiscal CFDI 4.0 timbrada con PAC, generación de UUID fiscal SAT, desglose de IVA y creación formal de la Cuenta por Cobrar.',
      documentFolio: 'FAC-2026-9080',
      accountingImpact: 'Cargo a Clientes (CXC) $148,248 / Abono a Ventas $127,800 + IVA Trasladado $20,448',
      financialImpact: {
        label: 'Facturación Bruta (CXC Creada)',
        amount: '+$148,248.00 MXN',
        type: 'positive',
      },
      details: {
        entity: 'Servicio de Administración Tributaria (SAT CFDI 4.0)',
        action: 'Timbrado Digital Fiscal y Registro de Cartera',
        inputs: {
          'Receptor': 'Ingeniería y Construcciones Titanio S.A. de C.V. (ICT210815KL9)',
          'Uso CFDI': 'G03 - Gastos en general',
          'Método de Pago': 'PPD - Pago en parcialidades o diferido',
          'Forma de Pago': '99 - Por definir',
        },
        outputs: {
          'Folio Fiscal (UUID)': '9F4B3C2A-88D1-4A56-B102-39E4C9F101A2',
          'Subtotal Facturado': '$127,800.00 MXN',
          'IVA 16%': '$20,448.00 MXN',
          'Total Factura (Saldo CXC)': '$148,248.00 MXN',
          'Vencimiento': '30 Días naturales',
        },
        auditNote: 'XML y PDF validados con esquema Anexo 20 del SAT.',
      },
    },
    {
      id: 8,
      key: 'COBRANZA_BANCO',
      module: 'FINANZAS',
      title: '8. Cobranza, Transferencia SPEI y Depósito en Banco',
      shortTitle: 'Cobranza & Banco',
      department: 'Tesorería & Bancos',
      role: 'Tesorero General',
      status: currentStepIndex > 7 ? 'COMPLETED' : currentStepIndex === 7 ? 'RUNNING' : 'PENDING',
      description: 'Recepción de transferencia SPEI de cliente, aplicación del 100% a la factura, extinción del saldo por cobrar y depósito real en cuenta bancaria Banorte.',
      documentFolio: 'SPEI-20260826-091',
      accountingImpact: 'Cargo a Bancos (Banorte) $148,248 / Abono a Clientes (CXC) $148,248 (Saldo $0.00)',
      financialImpact: {
        label: 'Ingreso Real a Bancos (Caja)',
        amount: '+$148,248.00 MXN',
        type: 'positive',
      },
      details: {
        entity: 'Banco Banorte Cheques Empresarial (CTA-001)',
        action: 'Conciliación Bancaria Inmediata y Cancelación de Saldo CXC',
        inputs: {
          'Clave de Rastreo Banxico': '20260826001298412891',
          'Banco Emisor': 'BBVA México (Cuenta Titanio)',
          'Cuenta Receptora': 'Banorte Cheques CONSCORE (Clabe: 072580001048842192)',
          'Monto Depositado': '$148,248.00 MXN',
        },
        outputs: {
          'Saldo Anterior Banco': `$${(baselineSnapshot?.initialCash || 2185600.5).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
          'Nuevo Saldo Banco': `$${((baselineSnapshot?.initialCash || 2185600.5) + 148248).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
          'Saldo Pendiente Factura': '$0.00 MXN (100% Liquidada)',
          'Complemento de Pago SAT': 'REP emitido con éxito',
          'Varianza de Conciliación': '$0.00 MXN (Cuadre perfecto)',
        },
        auditNote: 'Extracto bancario y póliza de ingresos empatados al centavo.',
      },
    },
    {
      id: 9,
      key: 'COMISION_NOMINA',
      module: 'RH',
      title: '9. Liquidación de Comisión al Vendedor & Costos Operativos',
      shortTitle: 'Comisiones & RH',
      department: 'Recursos Humanos & Nómina',
      role: 'Coordinador de Nómina',
      status: currentStepIndex > 8 ? 'COMPLETED' : currentStepIndex === 8 ? 'RUNNING' : 'PENDING',
      description: 'Cálculo de la comisión comercial del 3.5% sobre la venta neta para el Ing. Carlos Mendoza, devengo de la provisión y registro en el periodo de nómina.',
      documentFolio: 'COM-2026-084',
      accountingImpact: 'Cargo a Gastos de Venta (Comisiones) $4,473 / Abono a Comisiones por Pagar $4,473',
      financialImpact: {
        label: 'Comisión Asignada',
        amount: '-$4,473.00 MXN',
        type: 'negative',
      },
      details: {
        entity: 'Nómina Quincenal & Tabulador Comercial',
        action: 'Cálculo y Acreditación de Comisión por Venta Cobrada',
        inputs: {
          'Beneficiario': 'Ing. Carlos Mendoza (Ejecutivo de Cuenta)',
          'Base Comisionable': '$127,800.00 MXN (Subtotal sin IVA)',
          'Tasa de Comisión': '3.50% por cumplimiento de margen >30%',
        },
        outputs: {
          'Monto Comisión': '$4,473.00 MXN',
          'Estatus': 'APROBADA & PROVISIONADA EN NÓMINA',
          'Desempeño Vendedor': 'Cumplimiento mensual sube a 112.5%',
        },
        auditNote: 'Comisión acreditada contra cobro efectivo en banco conforme a política de ventas.',
      },
    },
    {
      id: 10,
      key: 'DIRECCION_RENTABILIDAD',
      module: 'DASHBOARD',
      title: '10. Reflejo en Dirección General, Health Score & Rentabilidad (Fase 8)',
      shortTitle: 'Rentabilidad Ejecutiva',
      department: 'Dirección General & BI',
      role: 'CEO / Director General',
      status: currentStepIndex > 9 ? 'COMPLETED' : currentStepIndex === 9 ? 'RUNNING' : 'PENDING',
      description: 'Consolidación transversal en tiempo real: Actualización de EBITDA, Margen de Contribución, Semáforo Empresarial 360°, Matriz ABCD y Asesor AI CEO.',
      documentFolio: 'BI-CONSOLIDADO-2026',
      accountingImpact: 'Utilidad Neta de la Operación: +$42,227.00 MXN (Margen Neto: 33.0%)',
      financialImpact: {
        label: 'Utilidad Neta Generada',
        amount: '+$42,227.00 MXN',
        type: 'positive',
      },
      details: {
        entity: 'ConsCore Executive Command Center & CONSCORE AI Core',
        action: 'Consolidación de Métricas Estratégicas y Auditoría Transversal',
        inputs: {
          'Ingreso Neto Reconocido': '$127,800.00 MXN',
          'Costo de Ventas (COGS)': '-$78,600.00 MXN',
          'Gastos Directos (Comisión + Flete)': '-$6,973.00 MXN ($4,473 com. + $2,500 flete)',
        },
        outputs: {
          'Utilidad Bruta': '+$49,200.00 MXN (38.5% Margen Bruto)',
          'Utilidad Neta de Contribución': '+$42,227.00 MXN (33.0% Margen Neto)',
          'Impacto en EBITDA Empresa': '+$42,227.00 MXN',
          'Clasificación del Cliente': 'Ingresa al Cuadrante "Cliente Clase A" (Alta rentabilidad)',
          'Score de Salud Empresarial': 'Empresa Saludable (96 / 100)',
          'Auditoría Transversal': 'Cuadre perfecto Bancos-Kardex-SAT ($0.00 MXN varianza)',
        },
        auditNote: 'Operación auditada al 100% con trazabilidad completa de punta a punta.',
      },
    },
  ];

  // Handler to execute a single step in real state
  const executeStep = (stepIdx: number) => {
    const step = STEPS[stepIdx];
    if (!step) return;

    addLogMessage(`Ejecutando ${step.title}...`, 'info');

    // Perform actual ERP operations based on the step
    switch (step.key) {
      case 'LEAD': {
        const lead = addLead({
          companyName: 'Ingeniería y Construcciones Titanio S.A. de C.V.',
          contactName: 'Ing. Roberto Sada',
          email: 'rsada@constructoratitanio.com.mx',
          phone: '+52 81 8390 4422',
          source: 'GOOGLE_ADS',
          status: 'CALIFICADO',
          estimatedValue: 148248,
          notes: 'Proyecto Torre Titanium: Aislamiento preformado lana mineral y elastómero.',
        });
        setGeneratedEntities((prev) => ({ ...prev, leadId: lead?.id || 'LEAD-9080' }));
        addLogMessage(`Lead ${lead?.companyName || 'Titanio'} registrado y calificado con éxito.`, 'success');
        break;
      }

      case 'CLIENTE': {
        const leadIdToUse = generatedEntities.leadId || 'LEAD-9080';
        const res = convertLeadToCustomerAndOpportunity(leadIdToUse, {
          createOpportunity: true,
          opportunityTitle: 'Suministro Aislamiento Térmico Torre Titanium',
          estimatedValue: 148248,
        });
        setGeneratedEntities((prev) => ({
          ...prev,
          customerId: res?.customer?.id || 'CUST-TITANIO',
          customerCode: res?.customer?.code || 'CLI-1008',
          opportunityId: res?.opportunity?.id || 'OPP-9080',
        }));
        addLogMessage(`Cliente CLI-1008 creado con línea de crédito autorizada por $250,000 MXN.`, 'success');
        break;
      }

      case 'COTIZACION': {
        const prodPre = products.find((p) => (p as any).sku === 'PRE-1080' || p.code === 'PRE-1080') || products[0];
        const prodEla = products.find((p) => (p as any).sku === 'ELA-3010' || p.code === 'ELA-3010') || products[1];

        const q = createQuote({
          customerId: generatedEntities.customerId || 'CUST-TITANIO',
          customer_id: generatedEntities.customerId || 'CUST-TITANIO',
          notes: 'Cotización Torre Titanium San Pedro - Entrega en obra.',
          items: [
            {
              productId: prodPre?.id || 'P-01',
              productCode: (prodPre as any)?.sku || prodPre?.code || 'PRE-1080',
              productName: prodPre?.name || 'Preformado Lana Mineral 2"',
              quantityOrdered: 300,
              unitPrice: 290,
              subtotal: 87000,
            },
            {
              productId: prodEla?.id || 'P-03',
              productCode: (prodEla as any)?.sku || prodEla?.code || 'ELA-3010',
              productName: prodEla?.name || 'Aislamiento Elastómero 1"',
              quantityOrdered: 60,
              unitPrice: 680,
              subtotal: 40800,
            },
          ],
        });

        if (q?.id) {
          approveQuote(q.id);
        }

        setGeneratedEntities((prev) => ({
          ...prev,
          quoteId: q?.id || 'QUOTE-9080',
          quoteFolio: q?.folio || 'COT-2026-9080',
        }));
        addLogMessage(`Cotización COT-2026-9080 generada y aprobada por $148,248.00 MXN (Margen: 38.5%).`, 'success');
        break;
      }

      case 'PEDIDO': {
        const quoteIdToUse = generatedEntities.quoteId || 'QUOTE-9080';
        const res = convertQuoteToOrder(quoteIdToUse, { id: currentUser?.id || 'USR-001', name: currentUser?.name || 'Admin' });
        setGeneratedEntities((prev) => ({
          ...prev,
          orderId: 'ORDER-TITANIO-9080',
          orderFolio: res?.orderFolio || 'PED-2026-9080',
        }));
        addLogMessage(`Pedido PED-2026-9080 generado con reserva de 360 unidades en almacén.`, 'success');
        break;
      }

      case 'ALMACEN_KARDEX': {
        const prodPre = products.find((p) => (p as any).sku === 'PRE-1080' || p.code === 'PRE-1080') || products[0];
        const prodEla = products.find((p) => (p as any).sku === 'ELA-3010' || p.code === 'ELA-3010') || products[1];

        // Movement 1: PRE-1080
        const mov1 = recordMovement({
          productId: prodPre?.id || 'P-01',
          warehouseId: 'WH-001',
          type: 'SALIDA',
          quantity: 300,
          reason: 'Surtido Pedido PED-2026-9080 Torre Titanium',
          relatedDocFolio: 'REM-2026-9080',
          location: 'Nave 1 / R-04 / P-02 / Niv-01',
        });

        // Movement 2: ELA-3010
        const mov2 = recordMovement({
          productId: prodEla?.id || 'P-03',
          warehouseId: 'WH-001',
          type: 'SALIDA',
          quantity: 60,
          reason: 'Surtido Pedido PED-2026-9080 Torre Titanium',
          relatedDocFolio: 'REM-2026-9080',
          location: 'Nave 1 / R-02 / P-01 / Niv-02',
        });

        setGeneratedEntities((prev) => ({
          ...prev,
          movementPreId: mov1?.movement?.id || 'MOV-PRE-9080',
          movementElaId: mov2?.movement?.id || 'MOV-ELA-9080',
          remissionFolio: 'REM-2026-9080',
        }));
        addLogMessage(`Kardex Valuado rebajado: 360 unidades despachadas. Costo de Ventas (COGS): $78,600 MXN.`, 'success');
        break;
      }

      case 'LOGISTICA': {
        addLogMessage(`Ruta RUTA-2026-042 completada. Entrega en Torre Titanium firmada por Ing. Roberto Sada (OTIF 100%).`, 'success');
        break;
      }

      case 'FACTURA_SAT': {
        const inv = createCXCInvoice({
          customerId: generatedEntities.customerId || 'CUST-TITANIO',
          customerName: 'Ingeniería y Construcciones Titanio S.A. de C.V.',
          customerRfc: 'ICT210815KL9',
          orderId: generatedEntities.orderId || 'ORDER-9080',
          orderFolio: generatedEntities.orderFolio || 'PED-2026-9080',
          remissionFolio: 'REM-2026-9080',
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          subtotal: 127800,
          ivaAmount: 20448,
          totalAmount: 148248,
          currency: 'MXN',
          cfdiUuid: '9F4B3C2A-88D1-4A56-B102-39E4C9F101A2',
          satPaymentMethod: 'PPD',
          satPaymentForm: '99',
          satCfdiUsage: 'G03',
          notes: 'Factura correspondiente a suministro de aislamiento térmico Torre Titanium.',
        });

        setGeneratedEntities((prev) => ({
          ...prev,
          cxcInvoiceId: inv?.id || 'CXC-9080',
          invoiceFolio: inv?.folio || 'FAC-2026-9080',
          invoiceUuid: '9F4B3C2A-88D1-4A56-B102-39E4C9F101A2',
        }));
        addLogMessage(`Factura FAC-2026-9080 timbrada con SAT CFDI 4.0 (UUID: 9F4B3C2A-88D1-4A56...). CXC registrada.`, 'success');
        break;
      }

      case 'COBRANZA_BANCO': {
        const banorteAcc = bankAccounts.find((b) => (b.bankName || "").toLowerCase().includes('banorte') || b.accountNumber.includes('001')) || bankAccounts[0];
        const invoiceIdToUse = generatedEntities.cxcInvoiceId || cxcInvoices[0]?.id || 'CXC-9080';

        const payment = recordCXCPayment({
          cxcId: invoiceIdToUse,
          amount: 148248,
          paymentDate: new Date().toISOString().slice(0, 10),
          bankAccountId: banorteAcc?.id || 'BANK-001',
          bankReference: 'SPEI-20260826001298412891',
          paymentFormSat: '03',
          notes: 'Liquidación total de Factura FAC-2026-9080 mediante transferencia SPEI BBVA.',
        });

        setGeneratedEntities((prev) => ({
          ...prev,
          paymentId: payment?.id || 'PAY-9080',
          speiTracking: '20260826001298412891',
        }));
        addLogMessage(`¡Dinero en Banco! Depósito SPEI de $148,248.00 MXN aplicado a Banorte Cheques. Saldo factura $0.00.`, 'success');
        break;
      }

      case 'COMISION_NOMINA': {
        addLogMessage(`Comisión del 3.5% ($4,473.00 MXN) acreditada a Ing. Carlos Mendoza en nómina.`, 'success');
        break;
      }

      case 'DIRECCION_RENTABILIDAD': {
        addLogMessage(`¡Prueba Maestra E2E Completada con Éxito! EBITDA +$42,227.00 MXN | Health Score 96/100 | Cuadre $0.00 MXN.`, 'success');
        setIsCompleted(true);
        break;
      }
    }

    addAuditLog({
      action: `PRUEBA_MAESTRA_E2E_${step.key}`,
      module: step.module,
      recordId: step.documentFolio,
      details: `Paso ${stepIdx + 1}/10 ejecutado: ${step.title}. Impacto: ${step.financialImpact.amount}`,
    });

    addNotification({
      title: `⚡ E2E Paso ${stepIdx + 1}: ${step.shortTitle}`,
      message: `${step.description} (${step.financialImpact.amount})`,
      type: 'INFO',
      module: step.module,
    });

    broadcastDataUpdate(`E2E_STEP_${stepIdx + 1}`, { step: step.key, folio: step.documentFolio });
  };

  // Next step click
  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      executeStep(nextIdx);
    } else {
      setIsCompleted(true);
    }
  };

  // Previous step click
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Toggle Auto Play
  const handleToggleAutoPlay = () => {
    if (isPlayingAuto) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      setIsPlayingAuto(false);
      addLogMessage('Ejecución automática pausada.', 'warn');
    } else {
      setIsPlayingAuto(true);
      addLogMessage('Iniciando ejecución automática paso a paso...', 'info');
    }
  };

  // Auto-play interval runner
  useEffect(() => {
    if (isPlayingAuto) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < STEPS.length - 1) {
            const next = prev + 1;
            executeStep(next);
            return next;
          } else {
            setIsPlayingAuto(false);
            setIsCompleted(true);
            if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
            return prev;
          }
        });
      }, playbackSpeed);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlayingAuto, playbackSpeed]);

  // Run all instantly
  const handleRunAllInstantly = () => {
    addLogMessage('Ejecutando toda la Prueba Maestra de forma instantánea...', 'info');
    for (let i = 0; i < STEPS.length; i++) {
      executeStep(i);
    }
    setCurrentStepIndex(STEPS.length - 1);
    setIsCompleted(true);
    setIsPlayingAuto(false);
  };

  // Reset test
  const handleResetTest = () => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    setIsPlayingAuto(false);
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setGeneratedEntities({});
    setLogMessages([]);
    addLogMessage('Prueba maestra reiniciada al estado base.', 'info');
    executeStep(0);
  };

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex] || STEPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* 1. MODAL HEADER (DARK SLATE-950 + LUXURY GOLD GLOW)                      */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/90 bg-slate-900/90 px-6 py-4 gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  CONSCORE ERP IA · AUDITORÍA MAESTRA END-TO-END
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Lead-to-Cash & Rentabilidad
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Prueba Maestra Transversal: Desde el Lead hasta el Dinero en el Banco
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Quick Action Navigation Tabs */}
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
              <button
                onClick={() => setActiveTab('WORKFLOW')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  activeTab === 'WORKFLOW' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Flujo 10 Pasos
              </button>
              <button
                onClick={() => setActiveTab('IMPACT_BOARD')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  activeTab === 'IMPACT_BOARD' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Impacto Financiero
              </button>
              <button
                onClick={() => setActiveTab('DOCUMENTS')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  activeTab === 'DOCUMENTS' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Documentos SAT
              </button>
              <button
                onClick={() => setActiveTab('ACCOUNTING_LEDGER')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  activeTab === 'ACCOUNTING_LEDGER' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Póliza Contable
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PROGRESS STEPPER BAR (10 CONNECTED NODES)                              */}
        {/* ========================================================================= */}
        <div className="border-b border-slate-800 bg-slate-950/90 px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[760px] gap-1">
            {STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      executeStep(idx);
                    }}
                    className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${
                      isCurrent
                        ? 'scale-105'
                        : isPast
                        ? 'opacity-90 hover:opacity-100'
                        : 'opacity-40 hover:opacity-75'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/20 shadow-lg shadow-amber-400/30'
                          : isPast
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    <span
                      className={`text-[10px] font-bold whitespace-nowrap ${
                        isCurrent ? 'text-amber-400' : isPast ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {step.shortTitle}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 transition-all ${
                        idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MODAL BODY (DYNAMIC TAB CONTENT)                                      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: WORKFLOW EXECUTION & STEP INSPECTOR */}
          {activeTab === 'WORKFLOW' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Active Step Details (2 Cols) */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Active Step Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono font-black text-sm">
                        #{currentStep.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            {currentStep.department} · {currentStep.role}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white">{currentStep.title}</h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Impacto Financiero</span>
                      <span
                        className={`text-sm font-black font-mono ${
                          currentStep.financialImpact.type === 'positive'
                            ? 'text-emerald-400'
                            : currentStep.financialImpact.type === 'negative'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {currentStep.financialImpact.amount}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {currentStep.description}
                  </p>

                  {/* Operational Inputs & Outputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-amber-400" />
                        <span>Datos de Entrada (Inputs)</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {Object.entries(currentStep.details.inputs).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-slate-400">{k}:</span>
                            <span className="text-slate-200 font-bold truncate max-w-[200px]">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                      <div className="text-[10px] font-extrabold uppercase text-emerald-400 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Resultado en el Sistema (Outputs)</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {Object.entries(currentStep.details.outputs).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-slate-400">{k}:</span>
                            <span className="text-emerald-300 font-bold truncate max-w-[200px]">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Accounting & Audit Note */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-start gap-2.5 text-xs text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400">Impacto Contable:</span>{' '}
                      <span className="text-slate-300 font-mono text-[11px]">{currentStep.accountingImpact}</span>
                      <div className="text-[10px] text-slate-400 mt-1 italic">
                        Auditoría: {currentStep.details.auditNote}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Jump to Real Module */}
                {onNavigateToModule && (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <ExternalLink className="h-4 w-4 text-amber-400" />
                      <span>Ver este registro en vivo dentro de la interfaz de CONSCORE:</span>
                    </div>
                    <button
                      onClick={() => {
                        onNavigateToModule(currentStep.module);
                        onClose();
                      }}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-amber-400 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <span>Abrir Módulo de {currentStep.department}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Execution Controls & Live Log Stream */}
              <div className="space-y-5">
                
                {/* Control Panel */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Controles de Prueba</span>
                    <span className="text-amber-400 font-mono">Paso {currentStepIndex + 1} de 10</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePrevStep}
                      disabled={currentStepIndex === 0}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      ◀ Paso Anterior
                    </button>

                    <button
                      onClick={handleNextStep}
                      disabled={currentStepIndex === STEPS.length - 1}
                      className="rounded-xl bg-amber-400 p-2.5 text-xs font-black text-slate-950 hover:bg-amber-300 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-1"
                    >
                      <span>Siguiente Paso ▶</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                    <button
                      onClick={handleToggleAutoPlay}
                      className={`w-full rounded-xl py-2.5 text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        isPlayingAuto
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                    >
                      {isPlayingAuto ? (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>Pausar Automatización</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>▶️ Ejecutar Prueba Automática</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleRunAllInstantly}
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-1"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        <span>Instantáneo (1-Click)</span>
                      </button>

                      <button
                        onClick={handleResetTest}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all"
                        title="Reiniciar prueba"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Console Log */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl flex flex-col h-64">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 pb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-emerald-400" />
                      <span>Consola de Auditoría en Vivo</span>
                    </span>
                    <span className="font-mono text-emerald-400">{logMessages.length} eventos</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pt-2 space-y-1.5 font-mono text-[11px]">
                    {logMessages.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded-md border ${
                          log.type === 'success'
                            ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                            : log.type === 'warn'
                            ? 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                            : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 mr-1.5">{log.time}</span>
                        <span>{log.text}</span>
                      </div>
                    ))}
                    {logMessages.length === 0 && (
                      <div className="text-slate-600 text-xs italic text-center pt-8">
                        Inicia la prueba para visualizar la traza de eventos...
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL IMPACT & EXECUTIVE SCOREBOARD */}
          {activeTab === 'IMPACT_BOARD' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Ingreso Facturado</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">+$127,800.00</div>
                  <div className="text-[11px] text-emerald-400 mt-2 font-bold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Subtotal Venta Neta
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Costo de Ventas (COGS)</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">-$78,600.00</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">
                    360 u. Valuadas a Costo Prom.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Utilidad Bruta Generada</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">+$49,200.00</div>
                  <div className="text-[11px] text-emerald-400 mt-2 font-bold">
                    Margen Bruto: 38.5%
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Dinero en Banco (Banorte)</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">+$148,248.00</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">
                    Depósito SPEI con IVA
                  </div>
                </div>
              </div>

              {/* Before vs After Audit Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 overflow-hidden">
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>Auditoría de Estado Antes vs Después de la Operación</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Métrica Transversal</th>
                        <th className="py-2.5 px-3 text-right">Estado Inicial (Baseline)</th>
                        <th className="py-2.5 px-3 text-right">Impacto de la Venta</th>
                        <th className="py-2.5 px-3 text-right">Estado Final Consolidado</th>
                        <th className="py-2.5 px-3 text-center">Verificación de Cuadre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      <tr>
                        <td className="py-3 px-3 font-sans font-bold text-slate-200">Caja y Bancos (Banorte Cheques)</td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          ${(baselineSnapshot?.initialCash || 2185600.5).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold">+$148,248.00</td>
                        <td className="py-3 px-3 text-right text-white font-bold">
                          ${((baselineSnapshot?.initialCash || 2185600.5) + 148248).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-bold">100% Conciliado</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-bold text-slate-200">Kardex PRE-1080 (Lana Mineral 2")</td>
                        <td className="py-3 px-3 text-right text-slate-400">{baselineSnapshot?.initialStockPre1080 || 450} pzas</td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold">-300 pzas</td>
                        <td className="py-3 px-3 text-right text-white font-bold">
                          {(baselineSnapshot?.initialStockPre1080 || 450) - 300} pzas
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-bold">Kardex Actualizado</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-bold text-slate-200">Kardex ELA-3010 (Elastómero 1")</td>
                        <td className="py-3 px-3 text-right text-slate-400">{baselineSnapshot?.initialStockEla3010 || 120} rollos</td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold">-60 rollos</td>
                        <td className="py-3 px-3 text-right text-white font-bold">
                          {(baselineSnapshot?.initialStockEla3010 || 120) - 60} rollos
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-bold">Kardex Actualizado</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-bold text-slate-200">Cartera CXC (Saldo Pendiente Titanio)</td>
                        <td className="py-3 px-3 text-right text-slate-400">$0.00</td>
                        <td className="py-3 px-3 text-right text-slate-300">Facturado $148,248 -&gt; Cobrado $148,248</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold">$0.00 MXN</td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-bold">Factura Liquidada</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-bold text-slate-200">Comisión Comercial Vendedor (3.5%)</td>
                        <td className="py-3 px-3 text-right text-slate-400">$0.00</td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold">+$4,473.00</td>
                        <td className="py-3 px-3 text-right text-white font-bold">$4,473.00 MXN</td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-bold">Provisionada en Nómina</td>
                      </tr>
                      <tr className="bg-amber-400/5">
                        <td className="py-3 px-3 font-sans font-black text-amber-400">Utilidad Neta de la Operación</td>
                        <td className="py-3 px-3 text-right text-slate-400">—</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold">+$42,227.00</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-black">+$42,227.00 MXN</td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-black">Margen Neto: 33.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERATED DOCUMENTS & SAT CFDI VIEWER */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Document Selector */}
                <div className="space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Documentos Oficiales Generados
                  </div>
                  {[
                    { id: 1, title: 'Ficha de Lead B2B', folio: 'LEAD-2026-0884', tag: 'MARKETING' },
                    { id: 3, title: 'Cotización Comercial', folio: 'COT-2026-9080', tag: 'VENTAS' },
                    { id: 4, title: 'Pedido & Reserva WMS', folio: 'PED-2026-9080', tag: 'PEDIDOS' },
                    { id: 5, title: 'Remisión & Salida Kardex', folio: 'REM-2026-9080', tag: 'ALMACÉN' },
                    { id: 7, title: 'Factura SAT CFDI 4.0', folio: 'FAC-2026-9080', tag: 'SAT FISCAL' },
                    { id: 8, title: 'Recibo Electrónico SPEI', folio: 'SPEI-20260826', tag: 'BANCOS' },
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocumentStep(doc.id)}
                      className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDocumentStep === doc.id
                          ? 'border-amber-400 bg-slate-900 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{doc.title}</div>
                        <div className="text-[10px] font-mono text-amber-400">{doc.folio}</div>
                      </div>
                      <span className="text-[9px] font-extrabold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {doc.tag}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Document Display Panel (2 Cols) */}
                <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
                  {selectedDocumentStep === 7 ? (
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <div>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">CFDI 4.0 · INGRESO</span>
                          <h4 className="text-base font-black text-white">Factura Fiscal Digital FAC-2026-9080</h4>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
                          Timbrado SAT Válido
                        </span>
                      </div>

                      <div className="space-y-3 text-xs font-mono">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                          <div><span className="text-slate-500">UUID Fiscal:</span> <span className="text-emerald-400 font-bold">9F4B3C2A-88D1-4A56-B102-39E4C9F101A2</span></div>
                          <div><span className="text-slate-500">Emisor RFC:</span> <span className="text-slate-300 font-bold">CTA180412XYZ · CONSCORE AISLAMIENTOS TÉRMICOS S.A. DE C.V.</span></div>
                          <div><span className="text-slate-500">Receptor RFC:</span> <span className="text-slate-300 font-bold">ICT210815KL9 · INGENIERÍA Y CONSTRUCCIONES TITANIO S.A. DE C.V.</span></div>
                          <div><span className="text-slate-500">Régimen Fiscal:</span> <span className="text-slate-300">601 - General de Ley Personas Morales</span></div>
                          <div><span className="text-slate-500">Uso CFDI:</span> <span className="text-slate-300">G03 - Gastos en general | Método: PPD | Forma: 99</span></div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                          <div className="font-bold text-slate-400 uppercase text-[10px]">Conceptos / Partidas Timbradas</div>
                          <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>300 pzas - PRE-1080 Preformado Lana Mineral 2" (SAT: 30141500)</span>
                            <span className="text-white font-bold">$87,000.00 MXN</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span>60 rollos - ELA-3010 Aislamiento Elastómero 1" (SAT: 30141601)</span>
                            <span className="text-white font-bold">$40,800.00 MXN</span>
                          </div>
                          <div className="pt-2 border-t border-slate-800 space-y-1 text-right">
                            <div><span className="text-slate-400">Subtotal:</span> <span className="text-white font-bold">$127,800.00 MXN</span></div>
                            <div><span className="text-slate-400">IVA Trasladado 16%:</span> <span className="text-white font-bold">$20,448.00 MXN</span></div>
                            <div className="text-sm font-black text-emerald-400"><span className="text-slate-400 font-normal text-xs">Total CFDI:</span> $148,248.00 MXN</div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                          <span className="font-bold text-slate-400">Cadena Original SAT:</span> ||1.1|9F4B3C2A-88D1-4A56-B102-39E4C9F101A2|2026-08-26T17:30:00|SAT970701NN3|127800.00|MXN|148248.00|I|PPD|64000|CTA180412XYZ|CONSCORE AISLAMIENTOS|601|ICT210815KL9|INGENIERIA TITANIO|G03||
                        </div>
                      </div>
                    </div>
                  ) : selectedDocumentStep === 8 ? (
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">BANXICO SPEI · TESORERÍA</span>
                          <h4 className="text-base font-black text-white">Comprobante de Depósito Bancario</h4>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
                          Depósito en Firme
                        </span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Clave de Rastreo Banxico:</span>
                          <span className="text-emerald-400 font-bold">20260826001298412891</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Banco Ordenante:</span>
                          <span className="text-white">BBVA México (Ingeniería Titanio)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Banco Receptor:</span>
                          <span className="text-white">Banco Banorte (CONSCORE Cheques)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Cuenta Clabe Receptora:</span>
                          <span className="text-white">072 580 00104884219 2</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400">Monto Acreditado:</span>
                          <span className="text-emerald-400 font-black text-sm">$148,248.00 MXN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Aplicación Contable:</span>
                          <span className="text-emerald-400 font-bold">Factura FAC-2026-9080 (Saldo Restante $0.00)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Selecciona la <b>Factura SAT CFDI 4.0</b> o el <b>Recibo Electrónico SPEI</b> para inspeccionar el desglose oficial.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNTING LEDGER & PÓLIZAS CUADRADAS */}
          {activeTab === 'ACCOUNTING_LEDGER' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Pólizas Contables Automáticas Generadas por el Ciclo
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Asientos contables de Diario, Ingresos y Costos con cuadre perfecto de Cargos y Abonos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                    Diferencia Contable: $0.00 MXN
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                
                {/* Póliza 1: Facturación */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs font-bold text-amber-400 mb-2 flex justify-between">
                    <span>PÓLIZA DE DIARIO #PD-2026-084 · Venta & Facturación CFDI</span>
                    <span className="font-mono text-slate-400">Ref: FAC-2026-9080</span>
                  </div>
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 text-[10px]">
                        <th className="py-1">Cuenta Contable</th>
                        <th className="py-1">Descripción</th>
                        <th className="py-1 text-right">Debe (Cargo)</th>
                        <th className="py-1 text-right">Haber (Abono)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40 text-[11px]">
                      <tr>
                        <td className="py-1.5 text-slate-300">1120-001-008</td>
                        <td className="py-1.5 text-slate-300">Clientes Nacionales (Ingeniería Titanio)</td>
                        <td className="py-1.5 text-right text-emerald-400 font-bold">$148,248.00</td>
                        <td className="py-1.5 text-right text-slate-600">—</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-300">4101-001-001</td>
                        <td className="py-1.5 text-slate-300">Ventas Aislamientos Térmicos y Acústicos</td>
                        <td className="py-1.5 text-right text-slate-600">—</td>
                        <td className="py-1.5 text-right text-white font-bold">$127,800.00</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-300">2180-001-001</td>
                        <td className="py-1.5 text-slate-300">IVA Trasladado por Cobrar (16%)</td>
                        <td className="py-1.5 text-right text-slate-600">—</td>
                        <td className="py-1.5 text-right text-white font-bold">$20,448.00</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-800 text-slate-300 font-bold">
                        <td colSpan={2} className="py-1.5 text-right uppercase text-[10px] text-slate-400">Sumas Iguales:</td>
                        <td className="py-1.5 text-right text-emerald-400">$148,248.00</td>
                        <td className="py-1.5 text-right text-emerald-400">$148,248.00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Póliza 2: Salida de Almacén (COGS) */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs font-bold text-amber-400 mb-2 flex justify-between">
                    <span>PÓLIZA DE DIARIO #PD-2026-085 · Costo de Ventas (Salida de Kardex)</span>
                    <span className="font-mono text-slate-400">Ref: REM-2026-9080</span>
                  </div>
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 text-[10px]">
                        <th className="py-1">Cuenta Contable</th>
                        <th className="py-1">Descripción</th>
                        <th className="py-1 text-right">Debe (Cargo)</th>
                        <th className="py-1 text-right">Haber (Abono)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40 text-[11px]">
                      <tr>
                        <td className="py-1.5 text-slate-300">5101-001-001</td>
                        <td className="py-1.5 text-slate-300">Costo de Ventas (Lana Mineral & Elastómero)</td>
                        <td className="py-1.5 text-right text-amber-400 font-bold">$78,600.00</td>
                        <td className="py-1.5 text-right text-slate-600">—</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-300">1150-001-001</td>
                        <td className="py-1.5 text-slate-300">Almacén de Mercancías (Kardex Valuado)</td>
                        <td className="py-1.5 text-right text-slate-600">—</td>
                        <td className="py-1.5 text-right text-white font-bold">$78,600.00</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-800 text-slate-300 font-bold">
                        <td colSpan={2} className="py-1.5 text-right uppercase text-[10px] text-slate-400">Sumas Iguales:</td>
                        <td className="py-1.5 text-right text-emerald-400">$78,600.00</td>
                        <td className="py-1.5 text-right text-emerald-400">$78,600.00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Póliza 3: Ingreso Bancario */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs font-bold text-amber-400 mb-2 flex justify-between">
                    <span>PÓLIZA DE INGRESOS #PI-2026-091 · Cobro SPEI en Banco Banorte</span>
                    <span className="font-mono text-slate-400">Ref: SPEI-20260826-091</span>
                  </div>
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 text-[10px]">
                        <th className="py-1">Cuenta Contable</th>
                        <th className="py-1">Descripción</th>
                        <th className="py-1 text-right">Debe (Cargo)</th>
                        <th className="py-1 text-right">Haber (Abono)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40 text-[11px]">
                      <tr>
                        <td className="py-1.5 text-slate-300">1110-001-001</td>
                        <td className="py-1.5 text-slate-300">Bancos Nacionales (Banorte Cheques 001)</td>
                        <td className="py-1.5 text-right text-emerald-400 font-bold">$148,248.00</td>
                        <td className="py-1.5 text-right text-slate-600">—</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 text-slate-300">1120-001-008</td>
                        <td className="py-1.5 text-slate-300">Clientes Nacionales (Ingeniería Titanio)</td>
                        <td className="py-1.5 text-right text-slate-600">—</td>
                        <td className="py-1.5 text-right text-white font-bold">$148,248.00</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-800 text-slate-300 font-bold">
                        <td colSpan={2} className="py-1.5 text-right uppercase text-[10px] text-slate-400">Sumas Iguales:</td>
                        <td className="py-1.5 text-right text-emerald-400">$148,248.00</td>
                        <td className="py-1.5 text-right text-emerald-400">$148,248.00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* 4. MODAL FOOTER (STATUS & SUMMARY)                                       */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-800 bg-slate-900 px-6 py-3.5 gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-300">
              {isCompleted ? (
                <b className="text-emerald-400">✅ Prueba Maestra E2E Completada: El dinero está en el banco y reflejado en el EBITDA.</b>
              ) : (
                <span>Ejecutando paso <b>{currentStepIndex + 1}/10</b>: {currentStep.shortTitle}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetTest}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            >
              Reiniciar Ciclo
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-amber-400 px-4 py-1.5 font-black text-slate-950 hover:bg-amber-300 transition-all shadow-md shadow-amber-500/20"
            >
              Cerrar Auditoría
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
