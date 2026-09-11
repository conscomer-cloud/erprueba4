# CONSCORE ERP IA

Plataforma ERP para Conscomer: CRM, cotizaciones, pedidos, inventario, almacenes,
compras, logística, finanzas, RH, servicio al cliente, gobierno corporativo,
automatización BPM e inteligencia predictiva.

Frontend en React 19 + Vite + Tailwind v4. Backend en Express con TypeScript.

---

## Requisitos

Node.js 20 o superior.

## Arranque local

```bash
npm install
cp .env.example .env
npm run dev
```

Abre http://localhost:3000

En desarrollo aparecen los accesos rápidos de la pantalla de entrada y el
selector de rol del encabezado. Son herramientas de prueba.

## Producción

```bash
npm install
npm run build
npm start
```

Antes de desplegar hay que definir `SESSION_SECRET`. Sin esa variable el
servidor arranca igual, pero genera un secreto al vuelo y todas las sesiones
se caen en cada reinicio.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `SESSION_SECRET` | Sí en producción | Firma de los tokens de sesión. Mínimo 32 caracteres |
| `SEED_PASSWORD` | Recomendada | Contraseña inicial de las cuentas sembradas |
| `DB_PATH` | No | Ruta del archivo de base de datos. Por defecto `./data/conscore_db.json` |
| `PORT` | No | Puerto de escucha. Por defecto 3000 |
| `GEMINI_API_KEY` | No | Habilita el módulo de IA |
| `APP_URL` | No | URL pública de la aplicación |

Estas tres se leen al compilar, no al ejecutar:

| Variable | Efecto |
|---|---|
| `VITE_ENABLE_DEV_TOOLS` | Muestra el simulador multiusuario, la prueba E2E y el selector de rol |
| `VITE_ENABLE_DEMO_LOGIN` | Muestra los accesos rápidos en la pantalla de entrada |
| `VITE_DEMO_PASSWORD` | Contraseña que usan esos accesos |

## Primer acceso

En el primer arranque se siembran 18 usuarios con la contraseña de
`SEED_PASSWORD`. Entra con `admin` y cambia la contraseña de cada cuenta antes
de abrir el sistema a los usuarios.

## Persistencia

Los datos viven en un archivo JSON. En Cloud Run el disco del contenedor se
borra en cada reinicio: hay que montar un volumen y apuntar `DB_PATH` ahí, o
migrar a una base de datos real. Ver el apartado 5.2 de `AUDITORIA.md`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con Vite en modo desarrollo |
| `npm run build` | Compila el cliente y empaqueta el servidor |
| `npm start` | Arranca en producción desde `dist/` |
| `npm run lint` | Verificación de tipos |
| `npm run clean` | Borra `dist/` |

## Estado del código

`AUDITORIA.md` documenta los 24 hallazgos de la revisión del 10 de septiembre
de 2026, qué se corrigió y qué queda pendiente. El apartado 5.1 es el más
importante: el proyecto no tiene instalados los tipos de React, así que la
verificación de tipos que aparenta pasar no está validando el JSX.
