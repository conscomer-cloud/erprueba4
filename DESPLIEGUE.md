# Poner CONSCORE ERP en línea

## Por qué no puede ser un solo archivo HTML

La aplicación tiene dos mitades. El navegador pinta la interfaz; el servidor
Node guarda los datos y decide quién puede ver qué. El frontend llama a 56
endpoints distintos: login, permisos, clientes, cotizaciones, pedidos,
inventario, picking, logística, finanzas, RH y auditoría.

Un HTML suelto carga la pantalla de acceso y ahí se queda: no hay a quién
preguntarle si la contraseña es correcta. Poner el ERP en línea significa
publicar el servidor, no convertir la app a un archivo.

La buena noticia es que el servidor ya sirve también la interfaz. Un solo
proceso, un solo puerto, una sola URL.

---

## Opción 1 — Render (la más simple)

Render lee `render.yaml` y arma el servicio solo.

1. Sube el proyecto a un repositorio de GitHub.
2. Entra a render.com, "New" → "Blueprint", y conecta el repositorio.
3. Render detecta `render.yaml`. Pide un valor para `SEED_PASSWORD`: pon ahí
   la contraseña inicial que quieras para las cuentas sembradas.
4. `SESSION_SECRET` lo genera Render solo. No hay que inventarlo.
5. Al terminar te da una URL del tipo `conscore-erp.onrender.com`.

El plan starter es de pago porque el ERP necesita disco persistente. En el
plan gratuito el archivo de base de datos se borra cada vez que el servicio se
reinicia, y se reinicia solo tras un rato sin uso: perderías todo lo capturado.

## Opción 2 — Cualquier servicio con Docker

El `Dockerfile` incluido funciona en Cloud Run, Railway, Fly.io o un servidor
propio.

```bash
docker build -t conscore-erp .
docker run -p 3000:3000 \
  -e SESSION_SECRET="pega-aqui-el-secreto" \
  -e SEED_PASSWORD="la-contraseña-inicial" \
  -v conscore-datos:/app/data \
  conscore-erp
```

El secreto se genera así:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

La bandera `-v` es la que importa: sin ese volumen, los datos viven dentro del
contenedor y desaparecen al reiniciarlo.

## Opción 3 — Tu propia computadora, accesible desde la red local

Si solo quieres que el equipo de la oficina entre desde sus máquinas:

```bash
npm install
npm run build
npm start
```

Queda en `http://TU-IP-LOCAL:3000`. Sirve para revisión interna, no para
producción: depende de que esa computadora esté encendida.

---

## Antes de abrirlo a los usuarios

1. Define `SESSION_SECRET`. Sin él, las sesiones se caen en cada reinicio.
2. Define `SEED_PASSWORD`. La de fábrica es pública.
3. Entra con cada una de las cuentas sembradas y cambia su contraseña.
4. Verifica que `DB_PATH` apunte a un volumen persistente.
5. Revisa `/api/health`: debe responder `sessionSecretConfigured: true` y
   `environment: production`.

## Límite conocido

Los datos viven en un archivo JSON que se reescribe completo en cada
movimiento. Aguanta un equipo pequeño. Para operación real, con varias
personas capturando al mismo tiempo, hay que migrar a SQLite o Postgres. Está
explicado en el apartado 5.2 de `AUDITORIA.md`.

Por lo mismo, no levantes más de una instancia: dos procesos escribiendo el
mismo archivo se pisan.
