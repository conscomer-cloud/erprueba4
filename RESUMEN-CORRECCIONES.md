# Correcciones de CONSCORE ERP IA

## Resultado

Se revisó el ZIP original y la lista ERRORES-PENDIENTES.md. Se corrigieron los **304 diagnósticos iniciales**; la comprobación de TypeScript terminó con **0 errores**. Se modificaron **94 archivos existentes** y se añadieron las pruebas de regresión, un ejecutor de validación aislada y este informe. El historial del documento original se conserva.

**La validación completa de la entrega no pudo cerrarse:** un build intermedio terminó correctamente, pero el build final y la última repetición de pruebas con tsx fueron bloqueados por el entorno. No se presenta el build anterior como prueba de la versión final.

## Correcciones principales

- **Contratos y vistas:** nombres de campos, colecciones, estados, argumentos y callbacks alineados con modelos, servicios y seeds. Incluye CRM, Pedidos, Compras, RH, Finanzas, Logística, Marketing, Automatización, Estrategia, Gobierno y Servicio al Cliente. Se corrigieron los límites de errores de React usando sus tipos reales, sin desactivar la comprobación de JSX.
- **Pedidos y cotizaciones:** almacenes desde su colección real; disponibilidad mediante QuoteAvailabilityService; motivo de rechazo financiero desde financialApprovalNotes; cantidades del simulador de cotizaciones desde quantity. No se modificó la regla de aprobación financiera ni la de reserva/salida física de inventario.
- **Finanzas:** estado de cuenta construido desde los registros reales de CXC; métodos y categorías válidos; cierres sobre periodos existentes, con permisos y checklist completo; reapertura con actor y motivo. El restablecimiento de datos de demostración solo se ofrece en desarrollo a Administración. No se realizó ningún restablecimiento.
- **RH:** navegación y acciones conectadas a manejadores existentes o implementadas contra sus modelos; asistencia manual conserva fecha y hora; aprobación de ausencias exige AUTORIZAR y evita reprocesar solicitudes resueltas; evaluaciones y avances solicitan valores reales. Capacitación compara la calificación con passingScore y no genera certificados ficticios. Nómina suma partidas existentes y no inventa salarios, deducciones ni partidas cuando faltan.
- **Compras:** precio del proveedor desde purchase_price; datos bancarios y códigos correctos; creación/edición de proveedores mediante el contrato real; devoluciones conservan transportista, guía, condición y lote. Se rechazan devoluciones con proveedor, almacén, cantidades o precios inválidos.
- **Integridad de información:** se retiraron cifras de respaldo inventadas de indicadores de RH, calificaciones de proveedores, referencias SPEI automáticas y la marca SAT inferida de un folio. El expediente de RH solicita referencia y fecha de emisión del documento. La demostración de CXC ya no asigna un UUID fiscal ficticio. Los escenarios estáticos de caos se identifican como demostración.
- **Prevención de regresiones:** el build ahora ejecuta TypeScript antes de empaquetar. La prueba de Observación 16 usa available_stock y physical_stock, comprueba el rechazo por código y deja de declarar éxito cuando el servidor no responde.

## Seguridad

1. **SSE autenticado:** /api/events rechaza tokens ausentes o inválidos antes de abrir el flujo. Revalida sesión/rol al enviar y en el latido periódico. Los eventos de difusión solo indican que hubo un cambio; los datos deben consultarse en los endpoints autenticados con sus filtros de permisos y propiedad. No se encontraron consumidores del payload SSE en las vistas del proyecto que requirieran migración.
2. **Sesiones:** las sesiones en caché vuelven a comprobar que el usuario existe y está activo, y refrescan su rol desde la base. dotenv se carga antes de leer la ruta de base, contraseña de seed y secreto de sesión.
3. **Duplicados de otra cartera:** la alerta utiliza una lista explícita de campos enmascarados; no copia el cliente completo ni incorpora su identificador real. Se conserva la prohibición de acceso a carteras ajenas.
4. **Dependencias:** SheetJS pasó de 0.18.5 a 0.20.3 desde su [distribución oficial](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/); se actualizó body-parser a 1.20.8 y se fijó qs 6.16.0 mediante overrides. El audit de la instalación terminó con **0 vulnerabilidades reportadas**. Se conserva package-lock.json para instalación reproducible con npm. Esto no equivale a certificar la ausencia de toda vulnerabilidad en el ERP.

No se relajaron RBAC/RLS ni autenticación. Los archivos de data y los seeds de src/data del ZIP original conservan exactamente su contenido (9 archivos comparados por SHA-256). Las pruebas que escribieron datos utilizaron bases temporales separadas. No se enviaron correos, mensajes, pagos ni solicitudes de timbrado.

## Validaciones y evidencia

| Comprobación | Resultado observado |
|---|---|
| npx tsc --noEmit | Final: 0 errores; salida 0 |
| npm run lint | Final: 0 errores; salida 0. El lint del proyecto es TypeScript; no existe un ESLint independiente |
| npm run build | Corrida intermedia: Vite y esbuild terminaron, salida 0. Advertencia de tamaño de chunk. Corrida final: bloqueada por acceso denegado al cargar vite.config.ts |
| hotfixRegression.test.ts | Corrida realizada: 8/8. SSE, enmascaramiento, KPIs sin datos, asistencia diaria, calificación de cursos, permisos RH y round-trip XLSX |
| orderPrintVerification.test.ts | Corrida realizada: 23/23 |
| quotePdfVerification.test.ts | Corrida realizada: 21/21 |
| returnE2EVerification.test.ts | Corrida realizada: 26/26 |
| test_observation_09.ts | Corrida realizada: 8/8 en suite canónica; comprobaciones de aislamiento e inmutabilidad aprobadas |
| test_observation_01_hotfix.ts | Corrida realizada: 5/5 |
| test-hotfix05.ts | Corrida realizada: 31/31 |
| test_observation_16_hotfix.ts | La corrida inicial encontró defectos en la prueba; se corrigieron contra el servicio. La corrida final requiere servidor y quedó pendiente por el bloqueo del entorno |
| npm install, audit incorporado | 0 vulnerabilidades reportadas tras actualizar dependencias |
| node --check scripts/verify-hotfix.mjs | Sintaxis correcta; el flujo completo aún no se ejecutó |

Las corridas exitosas anteriores no cubren cada interacción del ERP ni todos los ajustes posteriores de revisión. Parte de las suites heredadas verifica simulaciones; por eso se añadieron regresiones que llaman directamente a los manejadores y al bus. No se verificó una impresora física, el diálogo de impresión del navegador, servicios fiscales externos ni una sesión completa de interfaz.

La última repetición con tsx falla en os.userInfo con uv_os_get_passwd/ENOMEM. El build falla con Access is denied al resolver la configuración. La política automática rechazó la ejecución fuera del aislamiento porque las autorizaciones de sandbox están deshabilitadas. Es un límite del entorno de revisión, no un resultado exitoso de validación.

## Cómo completar la validación en un entorno habilitado

Usar Node 20–24 y npm. Desde la carpeta del proyecto:

```sh
npm ci
npx tsc --noEmit
npm run lint
npm run verify:hotfix
```

verify:hotfix ejecuta el build y, si pasa, arranca el servidor en un puerto temporal, comprueba autenticación/SSE/revocación y ejecuta ocho suites. Cada suite usa una base temporal distinta. El servidor se detiene al finalizar. El ejecutor detecta salidas no cero y fallos impresos por las pruebas heredadas. Se entrega preparado para ejecución, no como una corrida ya aprobada.

El expediente RH mantiene referencias documentales; no se implementó un servicio nuevo de subida de archivos. El cálculo de nómina requiere partidas reales. Los catálogos y simuladores de demostración preexistentes siguen presentes; no deben interpretarse como certificaciones operativas ni datos productivos. No se adjuntan dist ni node_modules, para evitar distribuir un build intermedio o dependencias locales.

## Archivos existentes modificados (94)

- `ERRORES-PENDIENTES.md`
- `package-lock.json`
- `package.json`
- `scripts/test_observation_16_hotfix.ts`
- `server/db/database.ts`
- `server/services/authService.ts`
- `server/services/eventBus.ts`
- `server.ts`
- `src/components/automation/AutomationObservabilityView.tsx`
- `src/components/automation/BusinessRulesEngineView.tsx`
- `src/components/automation/ChaosTestingSuiteView.tsx`
- `src/components/automation/EventBusMonitorView.tsx`
- `src/components/automation/NotificationEscalationCenterView.tsx`
- `src/components/automation/PreconfiguredAutomationsView.tsx`
- `src/components/automation/RpaBotsManagerView.tsx`
- `src/components/automation/WorkflowBpmStudioView.tsx`
- `src/components/common/AppErrorBoundary.tsx`
- `src/components/common/MultiUserLiveSimulatorModal.tsx`
- `src/components/config/UserManagementView.tsx`
- `src/components/crm/ActivityModal.tsx`
- `src/components/crm/Client360View.tsx`
- `src/components/crm/CommercialRLSCertificationModal.tsx`
- `src/components/crm/CRMModule.tsx`
- `src/components/crm/FollowUpModal.tsx`
- `src/components/crm/LeadModal.tsx`
- `src/components/crm/OpportunityModal.tsx`
- `src/components/crm/OrdersModule.tsx`
- `src/components/crm/QuotesModule.tsx`
- `src/components/crm/SalesForecast.tsx`
- `src/components/crm/SalesGoalsAndCommissions.tsx`
- `src/components/executive/DataIntegrityReportViewer.tsx`
- `src/components/executive/MasterCertificationDashboard.tsx`
- `src/components/executive/MasterE2ETestModal.tsx`
- `src/components/finance/AIFinancialAdvisorView.tsx`
- `src/components/finance/BudgetAndExpenseControl.tsx`
- `src/components/finance/CustomerStatementModal.tsx`
- `src/components/finance/CXCManagement.tsx`
- `src/components/finance/CXPManagement.tsx`
- `src/components/finance/FinancialDashboard.tsx`
- `src/components/finance/FinancialScenarioSimulator.tsx`
- `src/components/finance/ProfitabilityAnalysisView.tsx`
- `src/components/finance/TreasuryOverview.tsx`
- `src/components/governance/AIRiskAdvisorView.tsx`
- `src/components/governance/AnomalyDetectionView.tsx`
- `src/components/governance/ComplianceCenterView.tsx`
- `src/components/governance/CorporateDocumentManagerView.tsx`
- `src/components/governance/EnterpriseAlertEngineView.tsx`
- `src/components/governance/ExecutiveAuditCenterView.tsx`
- `src/components/governance/GovernanceExecutiveActionView.tsx`
- `src/components/governance/Phase13CertificationView.tsx`
- `src/components/hr/AIHRAdvisor.tsx`
- `src/components/hr/AttendanceTracker.tsx`
- `src/components/hr/CommissionsAndPayroll.tsx`
- `src/components/hr/EmployeeDirectory.tsx`
- `src/components/hr/EmployeeDocuments.tsx`
- `src/components/hr/HRDashboard.tsx`
- `src/components/hr/HRModule.tsx`
- `src/components/hr/PerformanceAndGoals.tsx`
- `src/components/hr/TrainingAndSkills.tsx`
- `src/components/hr/VacationsAndAbsences.tsx`
- `src/components/logistics/DepartureChecklistModal.tsx`
- `src/components/logistics/DriverDeliveryModal.tsx`
- `src/components/logistics/EmbarquesTable.tsx`
- `src/components/logistics/FleetManagementTab.tsx`
- `src/components/logistics/IncidentsReturnsTab.tsx`
- `src/components/logistics/Observation14Modal.tsx`
- `src/components/marketing/AIMarketingAdvisor.tsx`
- `src/components/marketing/CampaignDetailModal.tsx`
- `src/components/marketing/E2EFlowTestModal.tsx`
- `src/components/marketing/SegmentsAndAudience.tsx`
- `src/components/modules/ModulePlaceholder.tsx`
- `src/components/predictive/StockCapacityAlertCenter.tsx`
- `src/components/purchases/NewGoodsReceiptModal.tsx`
- `src/components/purchases/NewPurchaseOrderModal.tsx`
- `src/components/purchases/NewPurchaseRequestModal.tsx`
- `src/components/purchases/NewSupplierModal.tsx`
- `src/components/purchases/NewSupplierReturnModal.tsx`
- `src/components/purchases/PurchaseOrdersTab.tsx`
- `src/components/purchases/SuppliersTab.tsx`
- `src/components/service/CustomerServiceCenter.tsx`
- `src/components/strategy/StrategicPlanningModule.tsx`
- `src/components/warehouse/CatalogImportExportModal.tsx`
- `src/components/warehouse/PickingSheetModal.tsx`
- `src/components/warehouse/ReorderAlertPanel.tsx`
- `src/context/ERPContext.tsx`
- `src/context/FinanceContextMethods.ts`
- `src/context/HRContextMethods.ts`
- `src/context/MarketingContextMethods.ts`
- `src/context/PurchasesContextMethods.ts`
- `src/services/commercialRLSService.ts`
- `src/services/executiveIntelligenceService.ts`
- `src/services/hrService.ts`
- `src/services/inventoryBackupService.ts`
- `src/types/erp.ts`

## Archivos añadidos

- `src/tests/hotfixRegression.test.ts`
- `scripts/verify-hotfix.mjs`
- `INFORME-CORRECCIONES.md`

La carpeta validacion incluida en el ZIP conserva los registros de las corridas y su manifiesto; no contiene las bases temporales de prueba.

---

## Adenda: verificación independiente + Dashboard por Departamento

**Verificación independiente de este informe.** Se instaló desde cero, sin
aceptar las cifras de oídas. Único punto de fricción: `xlsx` apunta a
`cdn.sheetjs.com`, dominio no accesible desde el entorno de verificación
(SheetJS dejó de publicar en npmjs desde la 0.18.5; 0.19+ solo vive en su CDN
oficial). Con un downgrade temporal solo para poder instalar:

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` desde instalación limpia | 0 errores |
| `npm run build` | pasa |
| Token forjado / SSE sin token | 401 |
| RBAC (ALMACÉN en `/api/users`) | 403 |
| `hotfixRegression.test.ts` | 7/8 (el único fallo es la versión de xlsx forzada a la baja; con 0.20.3 real es 8/8) |
| `test_observation_09/01/hotfix05`, `orderPrintVerification`, `quotePdfVerification`, `returnE2EVerification` | Las seis suites pasan como se declara |
| `scripts/verify-hotfix.mjs` | Corre su propio servidor con base temporal y detecta correctamente el fallo forzado, sin maquillarlo |

El `package-lock.json` y el `package.json` que se entregan de vuelta son los
originales, con `xlsx@0.20.3` desde `cdn.sheetjs.com`. El downgrade fue solo
para poder ejecutar la verificación en este entorno; nunca se tocó el paquete
final.

**Dashboard por Departamento.** Nueva pestaña en el centro de mando ejecutivo
(`DASHBOARD` → "🏢 Por Departamento"), a solicitud explícita: un segundo
dashboard, distinto del financiero tipo Bind que se decidió no construir.

Cubre Ventas, Compras, Almacén, Logística y RH. Cada jefe ve solo su
departamento; Dirección y Administración ven los cinco con selector.

Ventas, Compras, Almacén y Logística se calculan en un endpoint nuevo del
servidor (`server/services/departmentKpisService.ts`,
`GET /api/reports/department-kpis`), porque esas colecciones sí se persisten
ahí. La autorización no depende de que el cliente oculte pestañas: el
servidor recorta la respuesta según el rol y solo entrega lo que ese rol tiene
permitido, verificado en vivo (VENDEDOR nunca recibe `purchasing` ni
`warehouse` aunque los pida).

RH se calcula en el cliente, dentro de `DepartmentDashboard.tsx`: la
asistencia, las ausencias y las comisiones nunca se guardaron en el esquema
del servidor, viven en `localStorage` a través de `ERPContext`. Un dashboard
de RH contra el servidor habría mostrado ceros permanentes. La interfaz lo
indica explícitamente, para que nadie confunda ese origen con el resto.

La puntualidad de entrega en Logística se deja en `null` a propósito: el
modelo de datos no guarda una hora prometida por parada, así que no hay base
real para ese porcentaje.

Verificado con `scripts/verificar-department-kpis.ts` (12 comprobaciones:
exclusión de pedidos cancelados y fuera de mes, órdenes de compra ya
recibidas fuera del conteo de abiertas, ausencia de NaN) y contra el servidor
real con los cuatro roles (ADMINISTRADOR, VENDEDOR, ALMACEN, RH).

---

## Adenda 2: Autocompletado de dirección por código postal (SEPOMEX)

**Origen de los datos.** Catálogo oficial de SEPOMEX tomado del repositorio
`github.com/d3249/mexico_zipcodes`, que a su vez lo genera desde el archivo de
descarga del portal de Correos de México. Corte: marzo de 2019. No es una API:
es un archivo de texto separado por pipes en ISO-8859-1, así que se compiló una
sola vez a un JSON compacto en lugar de depender de un servicio de terceros en
cada consulta.

| Métrica | Valor |
|---|---|
| Códigos postales únicos | 32,080 |
| Municipios | 2,463 |
| Estados | 32 |
| Tamaño del catálogo | 5.2 MB |

El catálogo vive solo en el servidor (`server/data/zipcodes-mx.json`). No se
envía al navegador: el cliente pide un código postal y recibe únicamente el
resultado de esa consulta.

**Bug de despliegue detectado y corregido.** El `Dockerfile` copia únicamente
`dist/` a la imagen final, y `esbuild` empaqueta código pero no archivos JSON
que se leen por ruta en tiempo de ejecución. Sin corregirlo, el endpoint
habría funcionado en desarrollo y fallado en producción por archivo no
encontrado. El script `build` ahora copia el catálogo a `dist/server/data/`, y
`zipCodeService` prueba ambas rutas para funcionar en los dos modos. Verificado
arrancando el servidor desde `dist/`, tal como se despliega.

**Endpoint.** `GET /api/geo/zipcode/:cp`. Exige sesión iniciada pero no permiso
de módulo: es información pública y cualquier formulario con dirección puede
necesitarla.

**Componente.** `MexicanAddressAutofill` (`src/components/common/`). Al capturar
5 dígitos autocompleta estado y municipio, y ofrece un selector de colonia
porque un mismo código postal casi siempre cubre varias. Si el código no
aparece en el catálogo —zona nueva o reasignada desde 2019—, los campos quedan
editables en vez de bloquear la captura: el dato que trae la persona vale más
que un catálogo con corte.

**Integración.** `LeadModal` era el único formulario del sistema con un campo de
dirección real. Ahí se detectó de paso que el campo `state` existía en el tipo
`Lead` pero nunca se renderizaba: solo se capturaba la ciudad como texto libre.
Se agregaron `colonia` y `zipCode` a los tipos `Lead` y `Customer`, distintos de
`fiscalZipCode`, que es el del receptor del CFDI.

**Verificación.** `scripts/verificar-zipcodes.ts`, 19 comprobaciones: casos
conocidos (CDMX, Tepeji del Río), código inexistente, formato inválido, cadena
vacía, espacios, y que los acentos sobrevivieran la conversión desde
ISO-8859-1. Todas pasan. Prueba de humo contra el servidor de producción sin
regresiones: token forjado 401, SSE sin token 401, VENDEDOR en `/api/users` 403,
CP inexistente 404, CP sin token 401.

**Hallazgo lateral, sin corregir.** El código postal configurado como domicilio
de la empresa (42850) no corresponde a ningún código real de Tepeji del Río: los
del municipio empiezan en 42852. Conviene revisarlo antes de timbrar CFDI,
porque el código postal de expedición es un dato que el SAT valida.
