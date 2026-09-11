# CONSCORE ERP IA — Auditoría y correcciones

Fecha: 10 de septiembre de 2026
Alcance: 258 archivos, 246 de TypeScript, ~142,000 líneas.
Método: descompresión, instalación de dependencias, compilación, y pruebas contra la API con el servidor corriendo.

---

## Resumen

La aplicación compilaba sin errores y el build de Vite pasaba limpio. Los problemas estaban en otro lado: cualquiera con la URL podía entrar como administrador sin contraseña, el servidor no levantaba en Cloud Run, y varias funciones de la interfaz estaban muertas sin que nada lo indicara.

De los 24 hallazgos, 21 quedaron corregidos y verificados. Los otros tres son trabajo de la siguiente iteración y están descritos al final.

---

## 1. Seguridad

### 1.1 Bypass total de autenticación — CRÍTICO

`server/services/authService.ts`, función `getSession`.

El método tenía una "restauración resiliente": si el token no aparecía en el mapa de sesiones en memoria, bastaba con que empezara por `cstk_` y trajera un id de usuario y una marca de tiempo de las últimas 24 horas para que el servidor construyera una sesión válida. No se verificaba nada más.

Comprobado contra el servidor en ejecución:

```
curl /api/users -H "Authorization: Bearer cstk_USR-001_1789014456000_hackhack"
→ 200, listado completo de usuarios

curl /api/hr/confidential/EMP-01 -H "Authorization: Bearer cstk_USR-001_..._hackhack"
→ 200, {"employeeId":"EMP-01","baseSalary":20000,...}
```

El id `USR-001` está a la vista en cualquier respuesta de la API. Con eso y la hora actual se fabricaba una sesión de administrador.

**Corrección.** Se reemplazó el esquema por tokens firmados:

```
cstk.<payload base64url>.<HMAC-SHA256 del payload>
```

El payload lleva usuario, emisión, expiración y un identificador único de sesión (`jti`). La firma se valida con `crypto.timingSafeEqual` contra el secreto de `SESSION_SECRET`. Sin ese secreto no se puede fabricar un token.

Se conservó la intención original —que la sesión sobreviva a un reinicio del proceso— pero ahora la firma es la que autoriza, no la forma del texto.

Verificación posterior:

```
token viejo forjado          → 401
firma inventada, formato nuevo → 401
sin token                    → 401
login real                   → 200 + /api/auth/me devuelve el usuario correcto
```

### 1.2 Auto-login como administrador — CRÍTICO

`src/context/AuthContext.tsx`.

Al cargar la aplicación sin token, `initAuth` ejecutaba:

```js
await api.login('admin@conscore.com.mx', 'ConsCore2026!');
```

Cualquiera que abriera la URL quedaba autenticado como ADMINISTRADOR. La pantalla de acceso solo aparecía si el usuario había cerrado sesión antes de forma explícita. Además `isAuthenticated` arrancaba en `true` y `currentUser` en un administrador por defecto.

**Corrección.** Sin token no hay sesión: se muestra la pantalla de acceso. El estado inicial pasó a `isAuthenticated = false` y `currentUser = null`.

### 1.3 Contraseña maestra publicada en el navegador — CRÍTICO

`switchUser` autenticaba como cualquier usuario del sistema usando esa misma contraseña escrita en el código. El selector de rol del encabezado llamaba a esa función, así que cualquier usuario podía asignarse el rol que quisiera.

La cadena `ConsCore2026!` aparecía **4 veces en `dist/assets/index.js`**, el archivo que se descarga al navegador.

**Corrección.** `switchUser` y `switchRole` quedaron limitados a desarrollo y ya no autentican: cambian el usuario en memoria para probar la matriz RBAC. El selector de rol solo se muestra con `VITE_ENABLE_DEV_TOOLS=true`, y ahora se pinta en ámbar con la etiqueta "Rol (pruebas)" para que no se confunda con una función del producto.

`grep -rn "ConsCore2026" src/` ya no devuelve nada.

### 1.4 Tokens predecibles

El identificador de sesión se generaba con `Math.random().toString(36).slice(2, 10)`. Ocho caracteres de un generador no criptográfico.

**Corrección.** `crypto.randomBytes(16)` para el `jti`, más la firma HMAC.

### 1.5 Sin límite de intentos de acceso

El login registraba los intentos fallidos en la bitácora pero no los bloqueaba. Un diccionario podía probar contraseñas indefinidamente.

**Corrección.** Cinco intentos fallidos por combinación de identificador e IP bloquean el acceso 15 minutos. Los mensajes se volvieron genéricos —"Usuario o contraseña incorrectos"— porque antes distinguían entre "usuario no encontrado" y "contraseña incorrecta", lo que permitía enumerar cuentas válidas. Cuando no existe el usuario se ejecuta igual la comparación de hash contra un valor falso, para que el tiempo de respuesta no delate la diferencia.

Verificación:

```
intento 1  → Usuario o contraseña incorrectos.
intento 3  → ... Te quedan 2 intento(s) antes del bloqueo temporal.
intento 6  → Demasiados intentos fallidos. Vuelve a intentar en 15 minuto(s).
contraseña correcta después del bloqueo → sigue bloqueado
```

### 1.6 El cierre de sesión no invalidaba nada

Por el problema 1.1, el mismo token seguía funcionando después del logout. También sobrevivía a la desactivación de un usuario y al cambio de contraseña.

**Corrección.** El logout agrega el `jti` a una lista de revocados. `invalidateUserSessions` marca una fecha de corte por usuario: todo token emitido antes queda inválido, se use donde se use.

Verificación: `POST /api/auth/logout` y reutilizar el token → 401.

### 1.7 Sin cabeceras de seguridad

**Corrección.** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y, en producción, `Strict-Transport-Security`. Sin agregar dependencias.

### 1.8 Salt compartido por todos los usuarios

Los 18 usuarios del seed compartían el salt literal `'conscore_salt_2026'`. Un mismo hash servía para todos los que tuvieran la misma contraseña.

**Corrección.** Salt aleatorio por siembra, y la contraseña inicial es configurable con `SEED_PASSWORD`.

---

## 2. Despliegue

### 2.1 Puerto fijo

`const PORT = 3000;` ignoraba `process.env.PORT`. Cloud Run inyecta el puerto y mata el contenedor si no escucha ahí. El despliegue no levantaba.

**Corrección.** `Number(process.env.PORT) || 3000`. Verificado arrancando con `PORT=8080`.

### 2.2 `npm start` levantaba el servidor de desarrollo

El script era `node dist/server.cjs` sin definir `NODE_ENV`. Como el arranque compara contra `"production"`, en el servidor real se creaba un servidor de Vite en modo desarrollo.

**Corrección.** `NODE_ENV=production node dist/server.cjs`.

### 2.3 Rutas de API devolvían HTML

Sin manejador propio, cualquier `/api/*` inexistente caía en el `app.get("*")` del SPA y devolvía `index.html`. El cliente intentaba interpretarlo como JSON y mostraba un error sin relación con el problema.

**Corrección.** 404 en JSON para todo lo que cuelga de `/api`.

### 2.4 Sin manejo de errores ni apagado ordenado

Una excepción dentro de una ruta dejaba la petición colgada hasta el timeout del navegador. Y el proceso no atendía SIGTERM, así que Cloud Run cortaba conexiones a medias.

**Corrección.** Manejador global de errores, captura de `unhandledRejection`, y cierre ordenado con SIGTERM/SIGINT con margen de 10 segundos.

### 2.5 Base de datos efímera

`data/conscore_db.json` se guardaba en el directorio de trabajo del contenedor. En Cloud Run ese disco se borra en cada reinicio: toda la operación del ERP se perdía.

**Corrección parcial.** La ruta es configurable con `DB_PATH` para apuntar a un volumen persistente. La solución de fondo está en el apartado 5.

### 2.6 Traza de error en cada arranque limpio

El repositorio traía `data/conscore_db.json` con 0 bytes. `JSON.parse('')` lanzaba `SyntaxError: Unexpected end of JSON input` y el log de arranque abría con una traza de excepción, aunque el sistema se recuperaba solo.

**Corrección.** Se detecta el archivo vacío y se siembra con un mensaje informativo. El archivo salió del repositorio y `data/*.json` entró al `.gitignore`.

---

## 3. Bugs funcionales

### 3.1 Clave del token mal escrita en 14 lugares

`apiClient` guarda el token en `conscore_auth_token`. Otros archivos lo leían de `conscore_token`, que nunca existió, y dos más de `token` a secas. Esas llamadas salían con `Bearer ` vacío y el servidor respondía 401.

Archivos afectados: `context/ERPContext.tsx` (7 usos), `context/CustomerServiceContextMethods.ts`, `components/warehouse/InventoryAdjustmentsManager.tsx`, `components/hr/EmployeeDirectory.tsx`, `services/inventoryBackupService.ts`.

**Corrección.** Clave unificada en los 14 puntos.

### 3.2 Hash con 1,000 iteraciones contra 10,000

`server/db/database.ts`, línea 1806. La migración que crea al usuario de Recursos Humanos usaba `crypto.pbkdf2Sync(..., 1000, ...)` mientras `verifyPassword` compara con 10,000. El usuario quedaba creado en la base pero su contraseña nunca podía validarse.

**Corrección.** La migración ahora llama a `hashPassword` y `generateSalt`, las mismas funciones que usa la verificación.

### 3.3 Contador de alertas siempre en cero

`components/governance/EnterpriseAlertEngineView.tsx`. El tipo `AlertStatus` admite `OPEN`, `ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED` y `DISMISSED`. La vista comparaba contra `'ACTIVE'`, que no existe.

Consecuencias: el contador de alertas activas mostraba 0 de forma permanente, el resaltado en rojo de las filas nunca se aplicaba, y el botón de atender la alerta no llegaba a renderizarse.

**Corrección.** Un helper `esAlertaActiva` considera activa toda alerta que no esté resuelta ni descartada.

### 3.4 Política de descuentos con roles inexistentes

`components/crm/QuotesModule.tsx`, línea 764. La comprobación de quién puede autorizar descuentos por encima del 5% listaba ocho roles, de los cuales cinco no existen en `UserRole`: `SUPER_ADMIN`, `DIRECTOR_GENERAL`, `ADMIN`, `GERENTE_SUCURSAL` y `DIRECTOR_COMERCIAL`. Cinco de las ocho comparaciones eran siempre falsas.

**Corrección.** La lista se redujo a los tres roles reales: `ADMINISTRADOR`, `DIRECTOR`, `GERENTE_VENTAS`.

### 3.5 Usuario fijo en la barra lateral

El pie mostraba "JD / Juan Delgado / Director General" escrito a mano, sin relación con la sesión. Un vendedor entraba y veía el nombre del director.

**Corrección.** Iniciales, nombre y rol del usuario autenticado.

### 3.6 Dos accesos rápidos rotos en la pantalla de entrada

Los botones de `director@conscore.com.mx` y `finanzas@conscore.com.mx` apuntaban a cuentas que no existen en los datos iniciales. Ambos respondían "usuario no encontrado".

**Corrección.** La lista se armó con las ocho cuentas que sí existen.

---

## 4. Interfaz y rendimiento

### 4.1 El botón de modo oscuro no hacía nada

El encabezado tenía el interruptor, guardaba la preferencia y agregaba la clase `dark` al `<html>`. Pero no había una sola clase `dark:` en los 246 archivos, ni la directiva `@custom-variant dark` que Tailwind v4 necesita para responder a esa clase. El botón cambiaba el ícono de luna a sol y nada más.

**Corrección.** Tailwind v4 compila cada utilidad de color a una variable CSS: `.bg-white` sale como `background-color: var(--color-white)`. Redefinir esa escala bajo `.dark` invierte la aplicación completa sin tocar los componentes:

```css
.dark {
  --color-white: oklch(21% 0.02 256);
  --color-slate-50: oklch(24% 0.021 256);
  ...
  --color-slate-900: oklch(97% 0.005 256);
}
```

Unas 40 líneas cubren los 246 archivos. Los acentos —azul, rojo, esmeralda— se aclaran aparte, porque sobre fondo oscuro pierden contraste. Los fondos tenues de las insignias (`bg-blue-50` y similares) se tratan por separado: al invertirse quedaban casi blancos.

### 4.2 Paquete inicial de 4.2 MB

Todo el ERP viajaba en un solo archivo que el navegador tenía que descargar y evaluar antes de pintar la pantalla de acceso.

**Corrección.** Los 19 módulos pasaron a `React.lazy`. El cuello estaba en `ModulePlaceholder`, que se importaba de forma estática desde `App.tsx` e importaba a su vez el módulo de almacén, que arrastraba `xlsx` y `jsPDF` — unos 850 kB que nadie necesita para iniciar sesión.

| | Antes | Después |
|---|---|---|
| Paquete de entrada | 4,204 kB | 974 kB |
| Fragmentos | 1 | 25 |

Cada módulo llega cuando se abre. React y los íconos van en fragmentos propios que el navegador cachea entre despliegues.

### 4.3 Sin contención de errores

Una excepción de renderizado en cualquier módulo desmontaba el árbol completo y dejaba la pantalla en blanco, sin forma de saber qué pasó ni de volver atrás.

**Corrección.** `AppErrorBoundary` alrededor del contenido, con opción de reintentar o volver al dashboard, y el detalle técnico plegado. El error se limpia solo al cambiar de módulo.

### 4.4 Etiquetas de desarrollo en la interfaz

En la barra lateral: insignias "Fase 11", "Fase 13", "Fase 14", "Fase 16". En el encabezado: "ERP FASES 1-14 ACTIVO", "2 Usuarios ⚡" y "Prueba Maestra E2E 🚀". En los títulos de módulo: "(Fase 13)", "(Fase 14)", "(Fase 16)".

**Corrección.** Las insignias de fase salieron. Los botones de simulación y prueba E2E quedaron detrás de `VITE_ENABLE_DEV_TOOLS`, y sus componentes ni siquiera se descargan cuando la bandera está apagada.

### 4.5 Accesibilidad

Varios botones usaban `outline-none` sin reemplazo, así que navegar con Tab no dejaba ninguna señal visible.

**Corrección.** Regla `:focus-visible` global, `prefers-reduced-motion` respetado y barras de desplazamiento que siguen el tema.

### 4.6 Afirmación de seguridad que la aplicación no controla

El pie del login decía "Seguridad Bancaria TLS 1.3 · Sesiones Tokenizadas" en una pantalla que ofrecía siete accesos con la contraseña del sistema. TLS depende del hosting, no del código.

**Corrección.** "Sesión firmada · Acceso por rol", que sí describe lo que hace la aplicación.

---

## 5. Pendiente para la siguiente iteración

### 5.1 No están instalados los tipos de React

Este es el hallazgo más importante de los que quedan abiertos.

El proyecto no tiene `@types/react` ni `@types/react-dom`. TypeScript ha estado tratando todo el JSX como `any`, y por eso los 246 archivos compilan sin una sola queja. La validación de tipos que aparenta existir no existe.

Al instalarlos aparecen **506 errores**:

| Código | Cantidad | Qué significa |
|---|---|---|
| TS2339 | 378 | Acceso a una propiedad que no existe en el tipo |
| TS2322 | 37 | Tipo incompatible en una asignación |
| TS2367 | 29 | Comparación entre tipos sin intersección posible |
| TS2551 | 27 | Propiedad mal escrita |
| Otros | 35 | |

Los 29 de TS2367 son de la misma familia que los problemas 3.3 y 3.4: código muerto que aparenta funcionar. Corregí los dos que tenían efecto visible; quedan 27 por revisar, entre ellos comparaciones contra `ExpenseStatus === 'AUTORIZADO'` en control presupuestal y contra un estado de cotización `'APROBADA'` que tampoco existe.

Con `strictNullChecks` solo, sin los tipos de React, son 78 errores. Ese es un punto de partida más manejable.

No los toqué en esta pasada porque arreglarlos a medias deja el build roto y el objetivo era poder desplegar. Es la prioridad de la siguiente ronda.

### 5.2 La base de datos es un archivo JSON

`persistSync` reescribe el archivo completo de forma síncrona en cada mutación, y hay más de 60 llamadas repartidas por `database.ts`. Con 30 colecciones el archivo crece rápido, cada escritura bloquea el hilo de Node, y dos peticiones simultáneas pueden pisarse.

Para arrancar con pocos usuarios funciona. Para operación real hace falta SQLite —cambio contenido, misma idea de archivo local— o Postgres si se van a levantar varias instancias.

### 5.3 Permisos del cliente en localStorage

`AuthContext` lee la matriz de permisos de `localStorage`, que el usuario puede editar desde la consola del navegador. El backend revalida todo, así que no es una brecha: como mucho se ve un menú que no debería estar ahí y las llamadas devuelven 403. Aun así conviene que los permisos lleguen del servidor en cada sesión.

---

## 6. Variables de entorno

`SESSION_SECRET` es obligatoria en producción. Sin ella el servidor arranca con un secreto generado al vuelo, avisa en el log, y todas las sesiones se caen en cada reinicio. Con más de una instancia nunca funcionan.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Para qué |
|---|---|
| `SESSION_SECRET` | Firma de los tokens. Mínimo 32 caracteres |
| `SEED_PASSWORD` | Contraseña inicial de las cuentas sembradas |
| `DB_PATH` | Ruta del archivo de base de datos |
| `PORT` | Puerto de escucha |
| `GEMINI_API_KEY` | Módulo de IA |
| `VITE_ENABLE_DEV_TOOLS` | Simulador, prueba E2E y selector de rol |
| `VITE_ENABLE_DEMO_LOGIN` | Accesos rápidos en la pantalla de entrada |
| `VITE_DEMO_PASSWORD` | Contraseña que usan esos accesos |

Las tres últimas se leen al compilar, no al ejecutar.

---

## 7. Puesta en marcha

```bash
npm install
cp .env.example .env       # define SESSION_SECRET y SEED_PASSWORD
npm run build
npm start
```

Antes de abrir la aplicación a los usuarios: entrar con cada cuenta sembrada y cambiar su contraseña. La del seed es pública y está en este documento.

---

## 8. Verificación ejecutada

Servidor en modo producción, `PORT=8080`, `SESSION_SECRET` definido.

| Prueba | Resultado |
|---|---|
| `/api/health` | 200, `sessionSecretConfigured: true` |
| Token forjado con el formato antiguo | 401 |
| Token con firma inventada | 401 |
| Petición sin token | 401 |
| Login de administrador | 200 + token firmado |
| `/api/auth/me` | Devuelve el usuario correcto |
| Token reutilizado tras logout | 401 |
| Seis intentos fallidos | Bloqueo a los 5, 15 minutos |
| Rol ALMACÉN en `/api/users` | 403 con el motivo |
| Rol ALMACÉN en datos salariales | 403 |
| Rol ALMACÉN en `/api/products` | 200 |
| Usuario RH (bug 3.2) | Entra correctamente |
| `GET /` | 200, sirve el SPA |
| `GET /api/inexistente` | 404 en JSON |
| Cabeceras de seguridad | Presentes |
| `tsc --noEmit` | 0 errores |
| `vite build` | Correcto, 25 fragmentos |

---

## 9. Bitácora de observaciones V4 — pendientes atendidos

Los once pendientes del PDF del 10 de septiembre. Ocho eran pantallas en
blanco y tenían dos causas distintas.

### Cómo se diagnosticaron

`scripts/repro-pantallas-blancas.tsx` renderiza cada vista en Node con los
mismos datos que recibe dentro de la aplicación y reporta la excepción con su
línea. Reprodujo cinco de los seis fallos de Gobierno en la primera corrida.

```bash
npx tsx scripts/repro-pantallas-blancas.tsx
```

### Observaciones 31 a 36 — Gobierno & Riesgos

Las seis vistas estaban escritas contra nombres de campo que sus tipos no
tienen. No era un error por vista: era la misma deriva repetida.

| Obs | Apartado | Reventaba en | Nombre real |
|---|---|---|---|
| 31 | Compliance y Evidencias | `ob.evidenceIds.length` | `evidences`, `area`, `status`, `regulationSource` |
| 32 | Bóveda documental | `doc.fileExtension.toUpperCase()` | `category`, `entityLabel`, `validTo`; el formato sale de `storagePath` |
| 33 | Auditoría transversal | `activeTrace.stages.length` | `tracePoints`, `totalAmount` |
| 34 | Motor de alertas | `alert.timestamp.replace()` | `detectedAt`, `alertId`, `description` |
| 35 | Anomalías estadísticas | no reventaba | `deviationPercentage`, `recommendedAction` |
| 36 | Acciones priorizadas | `action.timeframe.replace()` | `horizon`, `actionId`, `dueDate`, `ownerName` |

La 35 renderizaba, pero mostraba "(Z: σ)", "Variación: %", "Muestras:
periodos" y la acción sugerida vacía. En la 36, además, las comparaciones
contra el estado `'PENDING'` eran siempre falsas: los contadores de "Para Hoy"
y "Esta Semana" marcaban cero y el botón de completar no se renderizaba.

### Observaciones 28 y 29 — Finanzas

Otro origen. `ProfitabilityAnalysisView` y `FinancialScenarioSimulator`
llamaban a `getProfitabilityBreakdown()` y `runFinancialSimulation()` del
contexto ERP. Ninguna de las dos funciones existía, así que la llamada
lanzaba "is not a function" antes de pintar nada.

Se implementaron en `src/services/profitabilityService.ts`: rentabilidad por
producto, cliente, vendedor, campaña y pedido cruzando pedidos contra el costo
de catálogo, y proyección de ventas, EBITDA, flujo y capital de trabajo a
partir de los KPIs financieros del periodo.

Una limitación que conviene tener presente: el costo sale del catálogo de
productos, no del pedido. Los renglones no guardan el costo al momento de la
venta, de modo que al cambiar el costo de un producto la rentabilidad
histórica se recalcula con el costo nuevo. Para valuar al costo del día hay
que congelarlo en el renglón al confirmar el pedido.

### Observación 27 — botón duplicado en Leads

"Registrar Lead" dentro de `LeadsManager` y "Agregar Cliente" en el
encabezado de Ventas & CRM abrían el mismo `LeadModal`. Se eliminó el
primero; el del encabezado está visible desde cualquier pestaña.

### Observación 30 — accesos por departamento

Tres problemas estructurales en la matriz de seguridad:

1. `SERVICIO_CLIENTE`, `CHOFER` y `CALIDAD` existen en `UserRole` y hay
   usuarios asignados, pero no tenían registro en la tabla de roles.
   `checkPermission` busca el rol por nombre y devuelve `false` cuando no lo
   encuentra: el usuario de Servicio al Cliente quedaba sin acceso a ningún
   módulo del sistema.
2. `MARKETING` no tenía un solo permiso otorgado, y `LOGISTICA` solo tenía
   Servicio al Cliente.
3. `AUTOMATIZACION` y `PREDICTIVO` aparecen en la barra lateral pero no
   estaban en la lista de módulos con permisos, así que ningún rol distinto de
   ADMINISTRADOR podía entrar ni podía otorgárseles el acceso desde la matriz.

La matriz pasó de 11 roles, 102 permisos y 249 asignaciones a 14 roles, 114
permisos y 318 asignaciones. Verificado: el usuario de Servicio al Cliente
entra a clientes y productos (200) y sigue bloqueado en configuración (403).

### Observación 37 — paleta

La paleta se centralizó en un bloque `@theme` de `src/index.css`. Toda la
interfaz usa la escala de Tailwind por nombre — blue-600 aparece 371 veces,
yellow-400 300, emerald 244 — y Tailwind v4 compila cada utilidad a
`var(--color-*)`, así que redefinir esos nombres repinta los 246 archivos.
Cambiar la identidad visual es editar ese bloque.

Valores aplicados, tomados de la paleta de Conscomer definida en el trabajo de
ventalanamineral.com:

| Uso | Hex |
|---|---|
| Azul institucional, primario | `#065994` |
| Azul oscuro, encabezados | `#05406a` |
| Dorado, botones de acción | `#e4a734` |
| Rojo, alertas | `#cf2823` |
| Rojo oscuro, hover y estados | `#ae251e` |

El verde de confirmación y el ámbar de advertencia se dejaron fuera del kit a
propósito: son estados operativos y, si el ámbar fuera el dorado de marca, un
botón de acción y una advertencia se verían iguales.

En modo oscuro los azules y rojos se aclaran, porque a esa luminosidad pierden
contraste contra el fondo. El dorado funciona igual en ambos.

### Lo que sigue abierto de esta bitácora

Nada de los once pendientes queda sin atender. La paleta está aplicada pero
sujeta a confirmación: los hex provienen del proyecto de ventalanamineral.com,
no del Kit de Marca de Canva, cuya API no expone los valores de color.
