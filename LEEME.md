# Corrección de instalación para Render

Este parche corrige únicamente la omisión de dependencias de desarrollo durante el build. No corrige ni oculta los errores adicionales del modo estricto.

## Cambios

- render.yaml: buildCommand usa npm ci --include=dev && npm run build.
- Dockerfile: la etapa build instala con --include=dev. La etapa runtime conserva --omit=dev.

Para un servicio configurado manualmente en Render, poner también este Build Command en el panel:

    npm ci --include=dev && npm run build

El registro informa que faltan @types/express y @types/react-dom, ya declarados como devDependencies del proyecto. También falta @types/d3, que no estaba declarado. Para este último se requiere ejecutar en el repositorio y guardar ambos archivos de paquetes:

    npm install --save-dev @types/d3@^7

La descarga de D3 no pudo realizarse en el entorno de revisión: la política automática bloqueó la autorización. Este parche no incorpora ni simula una actualización de package-lock.json.

## Comprobación pendiente

El tsconfig.json del ZIP entregado no activa strict. Al ejecutar npx tsc --noEmit --strict sobre ese proyecto aparecen 193 diagnósticos, incluso con los tipos locales de Express y React DOM instalados. Los errores de null/undefined y duplicados del registro pertenecen a ese grupo y no se resuelven instalando tipos.

Hace falta el tsconfig.json que Render está utilizando y su Build Command para reproducir la versión desplegada sin desactivar validaciones ni modificar reglas de negocio a ciegas. No se cambió tsconfig.json ni se añadieron any o declaraciones ficticias de módulos.
