# Menú lateral: estructura aplicada y entradas pendientes

## Qué se aplicó

El menú pasó de una lista plana de 19 módulos a grupos colapsables, siguiendo
la estructura que pidió la operación. El grupo que contiene el módulo activo se
abre solo, de modo que si se entra por otra vía —un enlace del dashboard, por
ejemplo— el menú refleja dónde está el usuario.

Cada entrada puede apuntar a un módulo o a una pestaña concreta dentro de él.
Eso permite que "Proveedores" y "Órdenes de Compra" sean entradas separadas del
menú aunque ambas vivan dentro del módulo de Compras. Se agregó `initialTab` a
Compras, Finanzas y CRM; Recursos Humanos ya lo tenía.

| Grupo | Entradas |
|---|---|
| Inicio | Dashboard |
| Gerencia | Dashboard, CONSCORE AI, Gobierno y Riesgos, BPM y Automatización, Inteligencia Predictiva, Auditoría, Configuración |
| Compras | Productos, Proveedores, Órdenes de Compra, Solicitudes |
| Inventarios | Inventario, Almacenes, Recepción de Mercancía, Logística y Rutas |
| Ventas | CRM, Prospectos, Clientes 360°, Cotizaciones, Pedidos, Servicio al Cliente |
| Finanzas | Bancos y Cajas, Cuentas por Cobrar, Cuentas por Pagar, Gastos y Presupuestos, Cuentas y Centros de Costo, Rentabilidad |
| Recursos Humanos | Empleados, Nómina y Comisiones, Reloj / Asistencia, Vacaciones y Ausencias, Expedientes |
| Marketing | Marketing |

Los permisos se respetan como antes: un grupo entero se oculta si el rol no
puede ver ninguno de sus destinos, y las entradas sin permiso quedan
deshabilitadas con candado. Se conserva la segregación de funciones que impide
a Almacén ver Compras.

Con el menú colapsado no hay espacio para desplegar, así que tocar un grupo
entra al primer destino permitido en vez de no hacer nada.

## Entradas solicitadas que NO se agregaron

Estas pantallas no existen todavía en el sistema. No se pusieron en el menú
porque una entrada que lleva a una pantalla inexistente es peor que no tenerla:
se ve como una función disponible y falla al tocarla.

### Bloque completo de Contabilidad

Se pidió: reportes financieros, pólizas, configuración contable, pólizas de
diario, activos, pasivos y DIOT.

Ninguno existe. El ERP no tiene módulo contable: no hay catálogo de pólizas, ni
registro de activos fijos, ni cálculo de DIOT. Lo más cercano es "Cuentas y
Centros de Costo" dentro de Finanzas, que maneja el catálogo de cuentas pero no
genera asientos contables. Construir esto es un módulo nuevo completo, no una
entrada de menú.

### Bloque completo de Créditos

Se pidió: estado de cuenta de clientes, facturar remisiones y notas de crédito.

- **Estado de cuenta de clientes**: existe como modal dentro de Cuentas por
  Cobrar (`CustomerStatementModal`), no como pantalla propia. Se puede promover
  a entrada de menú si se desea.
- **Notas de crédito**: la colección `creditNotes` existe en el contexto, pero
  no hay pantalla que las administre.
- **Facturar remisiones**: no existe. Lo más cercano es el panel de facturación
  CFDI por pedido, que timbra pedidos, no remisiones.

### Reportes operativos por área

Se pidió: compras, inventario, cobranza y ventas.

El módulo llamado REPORTES en el sistema es en realidad "Gobierno, Riesgos y
Cumplimiento" —auditoría, compliance, matriz de autoridad— y no contiene
reportes operativos por área. Esos cuatro reportes habría que construirlos.

### Otras entradas sueltas

- **Producción**: se indicó explícitamente no crearlo.
- **Conciliación** (Finanzas): no existe.
- **Ingresos y Egresos** (Finanzas): no existe como pantalla; el movimiento de
  bancos se ve en Bancos y Cajas.
- **Conceptos de Venta** (Ventas): no existe.
- **Capturar Venta** (Ventas): no existe como pantalla propia. La captura ocurre
  desde Cotizaciones y Pedidos.
- **Finiquitos** (RH): no existe.

## Recomendación

Conviene decidir cuáles de estas pantallas se van a construir y en qué orden,
antes de agregarlas al menú. El bloque contable es el de mayor esfuerzo y el
que más depende de criterios fiscales y contables que deben definirse con quien
lleva la contabilidad de la empresa.
