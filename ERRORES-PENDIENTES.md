# Verificación de tipos: 304 errores pendientes

## Qué cambió

El proyecto no tenía instalados `@types/react` ni `@types/react-dom`. TypeScript
trataba todo el JSX como `any`, así que `npm run lint` pasaba sin revisar nada.

Ahora están instalados y declarados en `package.json`. **`npm run lint` falla, y
eso es correcto**: está reportando problemas que siempre estuvieron ahí.

`npm run build` sigue pasando. Vite no verifica tipos, así que el despliegue no
está bloqueado. Lo que falla es la verificación, no la compilación.

## Recorrido

| Momento | Errores |
|---|---|
| Al instalar los tipos | 421 |
| Primera pasada | 328 |
| Segunda pasada | 304 |

## Categorías cerradas

**TS2786 — componentes inválidos (12 de 12).** Los ErrorBoundary usaban
`extends (React.Component as any)`, un parche por la falta de tipos que además
impedía que React los reconociera como componentes de JSX.

**TS2367 — comparaciones imposibles (23 de 23).** Cada una era código muerto:

- Control de gastos: los botones de autorizar comparaban contra `'BORRADOR'`,
  que no existe en `ExpenseStatus`. Nunca se renderizaban, así que no se podía
  autorizar un gasto.
- Servicio al cliente: los contadores de garantías y devoluciones pendientes
  comparaban contra estados inexistentes. Siempre marcaban cero.
- Nómina y vacaciones: `'APROBADO'` contra `'APROBADA'`. Filtros muertos por el
  género de la palabra.
- Surtido: `'EN SURTIDO'` con espacio en vez de guion bajo.
- `ModulePlaceholder`: unas 85 líneas de JSX inalcanzable, porque la función
  retorna antes para esos módulos. Eliminadas.

**TS2551 — nombres mal escritos (22 de 22).** 15 renombres mecánicos y 7 que
requerían criterio.

Advertencia para quien continúe: **las sugerencias de TypeScript engañan**.
Proponía `financialRejectionReason -> financialRejectedAt`, que cambia un motivo
por una fecha. Al investigarlo salió un bug real: Finanzas guarda el motivo en
`financialApprovalNotes` y la interfaz leía un campo que nunca se escribe, así
que el vendedor siempre veía "Rechazado sin observaciones".

## Otros bugs encontrados en el camino

- `AccountsAndCostCenters` llamaba a `addAccount`, que no existe en el contexto.
  El botón de crear cuenta reventaba al hacer clic.
- `BudgetAndExpenseControl` llamaba a `recordOperatingExpense` y
  `authorizeOperatingExpense`, que tampoco existen. Registrar y autorizar un
  gasto reventaban.
- Ese mismo archivo importaba los tipos `DepartmentBudget` y `OperatingExpense`,
  que no están definidos en el proyecto.
- La UI de cuentas leía `type`, `currentBalance`, `monthlyBudget` y
  `currentSpent`; el modelo y los datos sembrados usan `category`, `balance`,
  `annualBudget` y `spentBudget`. Los saldos y presupuestos se pintaban vacíos.
- `EmployeeDocuments` mostraba una fecha escrita a mano (`'2026-01-10'`) como
  respaldo de un campo inexistente.

## Segunda pasada: colecciones del contexto mal nombradas

Varios tableros ejecutivos leían colecciones que el contexto no expone:
`inventoryMovements`, `arInvoices`, `payments`, `payrollRecords`, `deliveries`,
`apBills`, `campaigns`, `companyBudget` y `operatingExpenses`. Los nombres
reales son `movements`, `cxcInvoices`, `cxcPayments`, `payrollPeriods`, `pods`,
`cxpInvoices`, `marketingCampaigns`, `budgets` y `expenses`.

Consecuencia: el reporte de integridad de datos, el tablero de certificación y
el centro de mando ejecutivo se construían sobre colecciones `undefined`.

El OPEX del centro de mando leía `expensesTotal`, que no existe en el resumen
ejecutivo; el campo real es `operatingExpensesTotal`, así que esa cifra se
pintaba siempre en cero.

## Lo que queda

304 errores repartidos en unos 60 archivos. Es cola larga: ningún archivo
concentra más de 33, así que no hay una corrección que cierre muchos de golpe.

| Archivo | Errores |
|---|---|
| `context/ERPContext.tsx` | 33 |
| `components/finance/CXCManagement.tsx` | 11 |
| `components/hr/AttendanceTracker.tsx` | 10 |
| `components/automation/WorkflowBpmStudioView.tsx` | 9 |
| `components/hr/CommissionsAndPayroll.tsx` | 9 |
| `components/automation/ChaosTestingSuiteView.tsx` | 8 |
| `components/executive/MasterE2ETestModal.tsx` | 8 |
| `components/finance/CustomerStatementModal.tsx` | 8 |
| `components/finance/TreasuryOverview.tsx` | 8 |
| `components/marketing/SegmentsAndAudience.tsx` | 8 |

Para ver el listado completo:

```bash
npx tsc --noEmit
```

## Cómo continuar

Conviene ir archivo por archivo, no por código de error: los errores de un mismo
archivo suelen compartir causa, casi siempre un tipo mal importado o una
convención de nombres distinta entre la interfaz y el modelo.

Antes de aplicar la sugerencia de TypeScript, verificar contra los datos
sembrados en `src/data/` cuál es el nombre correcto. En varios casos el modelo y
el seed coinciden entre sí, y es la interfaz la que está equivocada.
